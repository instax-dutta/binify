# Troubleshooting Guide

## Issue: Styles Not Loading in Dev Server

### Problem

Tailwind CSS styles not being applied, UI appears unstyled with only basic HTML.

### Root Cause

Next.js 15 was initially configured with Tailwind CSS v4 (beta), which uses a different PostCSS plugin (`@tailwindcss/postcss`) that has compatibility issues.

### Solution

Downgraded to Tailwind CSS v3 (stable) with standard PostCSS configuration.

**Steps taken:**

1. Uninstalled Tailwind CSS v4 and `@tailwindcss/postcss`
2. Installed Tailwind CSS v3 with standard plugins
3. Updated `postcss.config.mjs` to use standard configuration

**Commands:**

```bash
npm uninstall tailwindcss @tailwindcss/postcss
npm install -D tailwindcss@^3 postcss autoprefixer
```

**Updated PostCSS Config:**

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Verification

After the fix, the dev server should automatically reload and all Tailwind styles should be applied correctly.

---

## Other Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Styles Not Updating

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### TypeScript Errors

```bash
# Check for errors
npx tsc --noEmit
```

### Build Errors

```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build
```

---

## Current Configuration

**Tailwind CSS:** v3 (stable)
**PostCSS:** Standard configuration
**Next.js:** 16.0.10
**Node.js:** 18+

All styles should now work correctly in both development and production! ✅
