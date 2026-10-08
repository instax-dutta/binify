import { test } from 'node:test';
import assert from 'node:assert';
import { isPasteExpired, type PasteMetadata } from './paste-expiry.ts';

const basePaste: PasteMetadata = {
    id: 'test-id',
    createdAt: Date.now(),
    viewCount: 0,
    burned: false,
    hasPassword: false,
};

test('isPasteExpired', async (t) => {
    await t.test('should return false for an active paste', () => {
        const paste: PasteMetadata = {
            ...basePaste,
            expiresAt: Date.now() + 10000,
            maxViews: 10,
            viewCount: 5,
        };
        assert.strictEqual(isPasteExpired(paste), false);
    });

    await t.test('should return true for a burned paste', () => {
        const paste: PasteMetadata = {
            ...basePaste,
            burned: true,
        };
        assert.strictEqual(isPasteExpired(paste), true);
    });

    await t.test('should return true for an expired paste (by time)', (t) => {
        const now = Date.now();
        t.mock.timers.enable({ apis: ['Date'], now });

        const paste: PasteMetadata = {
            ...basePaste,
            expiresAt: now - 1000,
        };

        assert.strictEqual(isPasteExpired(paste), true);
    });

    await t.test('should return false for a non-expired paste (by time)', (t) => {
        const now = Date.now();
        t.mock.timers.enable({ apis: ['Date'], now });

        const paste: PasteMetadata = {
            ...basePaste,
            expiresAt: now + 1000,
        };
        assert.strictEqual(isPasteExpired(paste), false);
    });

    await t.test('should return true when viewCount reaches maxViews', () => {
        const paste: PasteMetadata = {
            ...basePaste,
            maxViews: 5,
            viewCount: 5,
        };
        assert.strictEqual(isPasteExpired(paste), true);
    });

    await t.test('should return true when viewCount exceeds maxViews', () => {
        const paste: PasteMetadata = {
            ...basePaste,
            maxViews: 5,
            viewCount: 6,
        };
        assert.strictEqual(isPasteExpired(paste), true);
    });

    await t.test('should return false when viewCount is less than maxViews', () => {
        const paste: PasteMetadata = {
            ...basePaste,
            maxViews: 5,
            viewCount: 4,
        };
        assert.strictEqual(isPasteExpired(paste), false);
    });

    await t.test('should return false when no expiration constraints are set', () => {
        const paste: PasteMetadata = {
            ...basePaste,
        };
        assert.strictEqual(isPasteExpired(paste), false);
    });
});
