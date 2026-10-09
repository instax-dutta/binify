import { test } from 'node:test';
import assert from 'node:assert';
import { getClientIp, UNVERIFIED_IP } from './ip.ts';

class MockHeaders {
    private headers: Record<string, string> = {};

    constructor(headers: Record<string, string>) {
        for (const [key, value] of Object.entries(headers)) {
            this.headers[key.toLowerCase()] = value;
        }
    }

    get(name: string): string | null {
        return this.headers[name.toLowerCase()] ?? null;
    }
}

const req = (headers: Record<string, string>, ip?: string) =>
    ({ ip, headers: new MockHeaders(headers) }) as any;

test('getClientIp prefers the platform-observed address', async (t) => {
    await t.test('uses request.ip when present', () => {
        assert.strictEqual(
            getClientIp(req({ 'x-forwarded-for': '2.2.2.2, 3.3.3.3', 'x-real-ip': '4.4.4.4' }, '1.1.1.1')),
            '1.1.1.1'
        );
    });

    await t.test('ignores headers entirely when request.ip is present', () => {
        delete process.env.TRUST_PROXY;
        assert.strictEqual(
            getClientIp(req({ 'x-forwarded-for': '9.9.9.9' }, '1.1.1.1')),
            '1.1.1.1'
        );
    });
});

test('getClientIp fails closed when the address cannot be verified', async (t) => {
    await t.test('does not trust X-Forwarded-For by default', () => {
        delete process.env.TRUST_PROXY;
        assert.strictEqual(
            getClientIp(req({ 'x-forwarded-for': '10.0.0.1, 4.4.4.4' })),
            UNVERIFIED_IP
        );
    });

    await t.test('a spoofed header cannot mint a fresh rate-limit bucket', () => {
        delete process.env.TRUST_PROXY;
        // Two different claimed addresses must land in the same bucket, otherwise
        // rotating the header defeats rate limiting entirely.
        const a = getClientIp(req({ 'x-forwarded-for': '203.0.113.5' }));
        const b = getClientIp(req({ 'x-forwarded-for': '203.0.113.6' }));
        assert.strictEqual(a, b);
    });

    await t.test('ignores X-Real-IP, which is trivially spoofable', () => {
        delete process.env.TRUST_PROXY;
        assert.strictEqual(getClientIp(req({ 'x-real-ip': '7.7.7.7' })), UNVERIFIED_IP);
    });

    await t.test('handles missing and empty headers', () => {
        delete process.env.TRUST_PROXY;
        assert.strictEqual(getClientIp(req({})), UNVERIFIED_IP);
        assert.strictEqual(getClientIp(req({ 'x-forwarded-for': '' })), UNVERIFIED_IP);
    });
});

test('getClientIp trusts headers only behind an opted-in proxy', async (t) => {
    await t.test('takes the last entry, appended by the closest proxy', () => {
        process.env.TRUST_PROXY = 'true';
        assert.strictEqual(
            getClientIp(req({ 'x-forwarded-for': '10.0.0.1, 10.0.0.2, 4.4.4.4' })),
            '4.4.4.4'
        );
    });

    await t.test('handles a single entry', () => {
        process.env.TRUST_PROXY = 'true';
        assert.strictEqual(getClientIp(req({ 'x-forwarded-for': '5.5.5.5' })), '5.5.5.5');
    });

    await t.test('trims whitespace', () => {
        process.env.TRUST_PROXY = 'true';
        assert.strictEqual(
            getClientIp(req({ 'x-forwarded-for': ' 6.6.6.6 , 7.7.7.7 ' })),
            '7.7.7.7'
        );
    });

    await t.test('still falls back when the header is absent', () => {
        process.env.TRUST_PROXY = 'true';
        assert.strictEqual(getClientIp(req({})), UNVERIFIED_IP);
    });

    await t.after(() => {
        delete process.env.TRUST_PROXY;
    });
});
