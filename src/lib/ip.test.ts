import { test } from 'node:test';
import assert from 'node:assert';
import { getClientIp } from './ip.ts';

test('getClientIp prioritizes x-real-ip', () => {
    const headers = new Headers();
    headers.set('x-real-ip', '1.2.3.4');
    headers.set('x-forwarded-for', '5.6.7.8');
    const ip = getClientIp(headers);
    assert.strictEqual(ip, '1.2.3.4');
});

test('getClientIp takes the LAST IP in x-forwarded-for to prevent spoofing', () => {
    const headers = new Headers();
    // 1.1.1.1 is spoofed by client, 2.2.2.2 is real client IP added by proxy
    headers.set('x-forwarded-for', '1.1.1.1, 2.2.2.2');
    const ip = getClientIp(headers);
    assert.strictEqual(ip, '2.2.2.2');
});

test('getClientIp handles multiple IPs in x-forwarded-for', () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', '1.1.1.1, 2.2.2.2, 3.3.3.3');
    const ip = getClientIp(headers);
    assert.strictEqual(ip, '3.3.3.3');
});

test('getClientIp handles x-forwarded-for with whitespace', () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', ' 1.1.1.1 ,  2.2.2.2 ');
    const ip = getClientIp(headers);
    assert.strictEqual(ip, '2.2.2.2');
});

test('getClientIp returns unknown if no headers are present', () => {
    const headers = new Headers();
    const ip = getClientIp(headers);
    assert.strictEqual(ip, 'unknown');
});

test('getClientIp handles empty x-forwarded-for', () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', '');
    const ip = getClientIp(headers);
    assert.strictEqual(ip, 'unknown');
});
