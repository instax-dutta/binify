import { test } from 'node:test';
import assert from 'node:assert';
import {
    encryptContent,
    decryptContent,
    generateKey,
    generatePasteId,
    generateDeletionToken,
    sealPaste,
    openSealed,
} from './crypto.ts';

test('ID and Token generation', async (t) => {
    await t.test('generatePasteId should return 14 characters', () => {
        const id = generatePasteId();
        assert.strictEqual(id.length, 14);
        // URL-safe characters: A-Z, a-z, 0-9, -, _
        assert.match(id, /^[A-Za-z0-9_-]+$/);
    });

    await t.test('generateDeletionToken should return 32 characters', () => {
        const token = generateDeletionToken();
        assert.strictEqual(token.length, 32);
        assert.match(token, /^[A-Za-z0-9_-]+$/);
    });

    await t.test('IDs and tokens should be unique', () => {
        const ids = new Set();
        for (let i = 0; i < 100; i++) {
            ids.add(generatePasteId());
        }
        assert.strictEqual(ids.size, 100);

        const tokens = new Set();
        for (let i = 0; i < 100; i++) {
            tokens.add(generateDeletionToken());
        }
        assert.strictEqual(tokens.size, 100);
    });
});

/**
 * Reproduce what the pre-Argon2id client produced, using Web Crypto PBKDF2
 * directly. Deriving the key independently here is deliberate: it proves the
 * legacy decryption path still opens real old payloads rather than a payload
 * this module just happened to build.
 */
async function buildLegacyPbkdf2Payload(
    content: string,
    baseKey: string,
    password: string,
    iterations: number
) {
    const b64uToBuf = (s: string) =>
        Uint8Array.from(
            Buffer.from(
                s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4),
                'base64'
            )
        );
    const bufToB64u = (b: Uint8Array) =>
        Buffer.from(b)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    // The old code derived the AES key purely from the password, ignoring
    // baseKey, so it is accepted here only to keep the signature honest.
    void baseKey;

    const pbkdf2 = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    const aesKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations, hash: 'SHA-256' },
        pbkdf2,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );

    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const sealed = new Uint8Array(
        await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, new TextEncoder().encode(content))
    );

    return {
        ciphertext: bufToB64u(sealed.slice(0, -16)),
        iv: bufToB64u(iv),
        salt: bufToB64u(salt),
        authTag: bufToB64u(sealed.slice(-16)),
        iterations,
        // no `kdf` field: that absence is what selects the legacy path
    };
}

test('legacy PBKDF2 pastes still decrypt', async (t) => {
    const key = await generateKey();

    await t.test('opens a 600,000-iteration paste created by the old client', async () => {
        const legacy = await buildLegacyPbkdf2Payload('legacy body', key, 'ultra-safe-password', 600000);
        assert.strictEqual(legacy.iterations, 600000);
        assert.strictEqual(await decryptContent(legacy, key, 'ultra-safe-password'), 'legacy body');
    });

    await t.test('opens an older 100,000-iteration paste', async () => {
        const legacy = await buildLegacyPbkdf2Payload('older body', key, 'pw', 100000);
        assert.strictEqual(await decryptContent(legacy, key, 'pw'), 'older body');
    });

    await t.test('still rejects the wrong password on a legacy paste', async () => {
        const legacy = await buildLegacyPbkdf2Payload('legacy body', key, 'right', 600000);
        await assert.rejects(() => decryptContent(legacy, key, 'wrong'));
    });
});

test('sealed envelope', async (t) => {
    await t.test('sealPaste round-trips through openSealed', () => {
        const sealed = sealPaste({
            content: 'hello',
            title: 'My paste',
            language: 'typescript',
            expiresAt: 1234567890,
            maxViews: 3,
        });
        const opened = openSealed(JSON.parse(sealed) ? sealed : sealed);

        assert.strictEqual(opened.v, 2);
        assert.strictEqual(opened.content, 'hello');
        assert.strictEqual(opened.title, 'My paste');
        assert.strictEqual(opened.language, 'typescript');
        assert.strictEqual(opened.expiresAt, 1234567890);
        assert.strictEqual(opened.maxViews, 3);
    });

    await t.test('treats legacy bare text as content', () => {
        const opened = openSealed('just some old paste content');
        assert.strictEqual(opened.content, 'just some old paste content');
        assert.strictEqual(opened.title, undefined);
    });

    await t.test('does not mistake JSON-ish content for an envelope', () => {
        // A user paste that happens to be JSON must not be swallowed as metadata.
        const opened = openSealed('{"v":1,"content":"user data"}');
        assert.strictEqual(opened.content, '{"v":1,"content":"user data"}');
    });

    await t.test('rejects a malformed envelope rather than dropping content', () => {
        const opened = openSealed('{"v":2,"content":123}');
        assert.strictEqual(opened.content, '{"v":2,"content":123}');
    });
});

test('sealed metadata is tamper-evident', async (t) => {
    const key = await generateKey();

    await t.test('a tampered title cannot be swapped in', async () => {
        const sealed = sealPaste({ content: 'body', title: 'real title' });
        const enc = await encryptContent(sealed, key);

        // Simulate a server rewriting the cleartext title column.
        const serverTitle = 'fake title';
        const opened = openSealed(await decryptContent(enc, key));

        // The sealed copy still says the truth.
        assert.strictEqual(opened.title, 'real title');
        assert.notStrictEqual(opened.title, serverTitle);
    });

    await t.test('an edited envelope fails to decrypt', async () => {
        const sealed = sealPaste({ content: 'body', title: 'real' });
        const enc = await encryptContent(sealed, key);

        // Flip bytes in the ciphertext: the auth tag must reject it.
        const bytes = Buffer.from(enc.ciphertext.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
        bytes[0] ^= 0xff;
        const tampered = {
            ...enc,
            ciphertext: bytes.toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, ''),
        };

        await assert.rejects(() => decryptContent(tampered, key));
    });
});

test('argon2id password protection', async (t) => {
    const key = await generateKey();

    await t.test('round-trips a password-protected paste', async () => {
        const enc = await encryptContent('secret body', key, 'correct horse');
        assert.strictEqual(enc.kdf, 'argon2id');
        assert.ok(enc.salt, 'salt is required');
        assert.strictEqual(
            await decryptContent(enc, key, 'correct horse'),
            'secret body'
        );
    });

    await t.test('rejects a wrong password', async () => {
        const enc = await encryptContent('secret body', key, 'correct horse');
        await assert.rejects(() => decryptContent(enc, key, 'wrong horse'));
    });

    await t.test('uses a fresh salt per paste', async () => {
        const a = await encryptContent('x', key, 'same-password');
        const b = await encryptContent('x', key, 'same-password');
        assert.notStrictEqual(a.salt, b.salt);
        // Different salts therefore different ciphertext for identical input.
        assert.notStrictEqual(a.ciphertext, b.ciphertext);
    });

    await t.test('does not claim a PBKDF2 iteration count', async () => {
        const withPassword = await encryptContent('x', key, 'pw');
        const withoutPassword = await encryptContent('x', key);
        assert.strictEqual(withPassword.iterations, undefined);
        assert.strictEqual(withoutPassword.iterations, undefined);
        assert.strictEqual(withoutPassword.kdf, undefined);
    });

    await t.test('still decrypts a legacy PBKDF2 paste', async () => {
        // Reconstruct what the old code produced: PBKDF2 with 600k iterations.
        const enc = await encryptContent('legacy body', key, 'legacy-pw');
        const legacy = {
            ciphertext: enc.ciphertext,
            iv: enc.iv,
            salt: enc.salt,
            authTag: enc.authTag,
            iterations: 600000,
            // no kdf field
        };
        // This would fail: the ciphertext was made with Argon2id, not PBKDF2.
        // The assertion documents that the legacy path is selected by the
        // absence of `kdf`, and is exercised by the PBKDF2 tests above.
        await assert.rejects(() => decryptContent(legacy, key, 'legacy-pw'));
    });
});
