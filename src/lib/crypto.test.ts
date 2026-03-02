import { test } from 'node:test';
import assert from 'node:assert';
import {
    encryptContent,
    decryptContent,
    generateKey,
    generatePasteId,
    generateDeletionToken,
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

test('PBKDF2 iteration count and backward compatibility', async (t) => {
    const key = await generateKey();
    const content = 'Hello, Security!';
    const password = 'ultra-safe-password';

    await t.test('should encrypt with 600,000 iterations by default', async () => {
        const encrypted = await encryptContent(content, key, password);
        assert.strictEqual(encrypted.iterations, 600000);

        const decrypted = await decryptContent(encrypted, key, password);
        assert.strictEqual(decrypted, content);
    });

    await t.test('should support manual iteration count (simulating legacy or custom)', async () => {
        // We can't easily generate a 100k payload without changing the code or exporting more,
        // but we can test if providing DIFFERENT iterations results in DIFFERENT keys (decryption failure).

        const encrypted600k = await encryptContent(content, key, password);

        // Try to decrypt 600k payload but forcing it to use 100k iterations
        // We do this by deleting the iterations field so it falls back to legacy (100k)
        const legacyPayload = { ...encrypted600k };
        delete legacyPayload.iterations;

        try {
            await decryptContent(legacyPayload, key, password);
            assert.fail('Should have failed to decrypt 600k payload with 100k iterations');
        } catch (e) {
            assert.ok(e instanceof Error);
            assert.strictEqual(e.message, 'Decryption failed. Invalid key or password.');
        }
    });
});

test('End-to-end encryption/decryption', async () => {
    const key = await generateKey();
    const content = 'Binify test content';

    // Test without password
    const encrypted = await encryptContent(content, key);
    const decrypted = await decryptContent(encrypted, key);
    assert.strictEqual(decrypted, content);

    // Test with password
    const password = 'test-password';
    const encryptedPw = await encryptContent(content, key, password);
    const decryptedPw = await decryptContent(encryptedPw, key, password);
    assert.strictEqual(decryptedPw, content);
});
