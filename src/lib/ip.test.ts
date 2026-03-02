import { test } from 'node:test';
import assert from 'node:assert';
import { getClientIp } from './ip.ts';

/**
 * Mock Headers implementation for testing
 */
class MockHeaders {
    private headers: Record<string, string> = {};

    constructor(headers: Record<string, string>) {
        for (const [key, value] of Object.entries(headers)) {
            this.headers[key.toLowerCase()] = value;
        }
    }

    get(name: string): string | null {
        return this.headers[name.toLowerCase()] || null;
    }
}

test('getClientIp security logic', async (t) => {
    await t.test('should prioritize X-Real-IP over X-Forwarded-For', () => {
        const headers = new MockHeaders({
            'x-real-ip': '1.1.1.1',
            'x-forwarded-for': '2.2.2.2, 3.3.3.3'
        });
        assert.strictEqual(getClientIp(headers as any), '1.1.1.1');
    });

    await t.test('should pick the LAST entry of X-Forwarded-For when X-Real-IP is absent', () => {
        const headers = new MockHeaders({
            'x-forwarded-for': '10.0.0.1, 10.0.0.2, 4.4.4.4'
        });
        // 4.4.4.4 is the IP added by the trusted proxy, 10.0.0.1 and 10.0.0.2 could be spoofed
        assert.strictEqual(getClientIp(headers as any), '4.4.4.4');
    });

    await t.test('should handle single entry in X-Forwarded-For', () => {
        const headers = new MockHeaders({
            'x-forwarded-for': '5.5.5.5'
        });
        assert.strictEqual(getClientIp(headers as any), '5.5.5.5');
    });

    await t.test('should handle whitespace in X-Forwarded-For', () => {
        const headers = new MockHeaders({
            'x-forwarded-for': ' 6.6.6.6 , 7.7.7.7 '
        });
        assert.strictEqual(getClientIp(headers as any), '7.7.7.7');
    });

    await t.test('should return unknown when no headers are present', () => {
        const headers = new MockHeaders({});
        assert.strictEqual(getClientIp(headers as any), 'unknown');
    });

    await t.test('should return unknown when X-Forwarded-For is empty', () => {
        const headers = new MockHeaders({
            'x-forwarded-for': ''
        });
        assert.strictEqual(getClientIp(headers as any), 'unknown');
    });

    await t.test('should return unknown when X-Forwarded-For contains only commas/spaces', () => {
        const headers = new MockHeaders({
            'x-forwarded-for': ' , '
        });
        assert.strictEqual(getClientIp(headers as any), 'unknown');
    });
});
