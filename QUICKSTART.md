# Quick Start Guide - Binify

Get Binify running locally in 5 minutes!

---

## Prerequisites

- Node.js 18+ installed
- npm installed
- TursoDB account (free): <https://turso.tech>
- Upstash Redis account (free): <https://upstash.com>

---

## Step 1: Install Dependencies

```bash
cd /Users/saiduttaabhishekdash/binify
npm install
```

---

## Step 2: Set Up TursoDB

```bash
# Install Turso CLI (macOS)
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create binify

# Get credentials
turso db show binify --url
# Copy this URL

turso db tokens create binify
# Copy this token
```

---

## Step 3: Set Up Upstash Redis

1. Go to <https://console.upstash.com>
2. Click "Create Database"
3. Name it "binify"
4. Select a region
5. Click "Create"
6. Copy the "REST URL" and "REST TOKEN"

---

## Step 4: Configure Environment

Create `.env.local` file:

```bash
cp env.example .env.local
```

Edit `.env.local` with your credentials:

```env
TURSO_DATABASE_URL=libsql://binify-[your-username].turso.io
TURSO_AUTH_TOKEN=eyJhbGc...
UPSTASH_REDIS_REST_URL=https://[your-redis].upstash.io
UPSTASH_REDIS_REST_TOKEN=[your-token]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 5: Start Development Server

```bash
npm run dev
```

Open <http://localhost:3000>

---

## Step 6: Initialize Database

In a new terminal:

```bash
curl -X POST http://localhost:3000/api/init
```

You should see:

```json
{"message":"Database initialized successfully"}
```

---

## Step 7: Test It Out

1. Go to <http://localhost:3000>
2. Enter some text in the editor
3. Click "Create Encrypted Paste"
4. Copy the URL
5. Open the URL in a new tab
6. Verify the content is decrypted correctly

---

## Common Issues

### "Database connection failed"

- Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are correct
- Check if database exists: `turso db list`

### "Redis connection failed"

- Verify Upstash credentials
- Check Redis database status in Upstash console

### "Module not found"

- Run `npm install` again
- Delete `node_modules` and `.next`, then `npm install`

### Port 3000 already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

---

## Next Steps

- Read [README.md](./README.md) for full documentation
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Read [SECURITY.md](./SECURITY.md) for security details
- Customize the UI in `src/app/globals.css`
- Add your own features!

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

---

## File Structure

```
src/
├── app/
│   ├── api/          # API routes
│   ├── p/[id]/       # Paste view page
│   ├── page.tsx      # Home page
│   └── layout.tsx    # Root layout
├── components/       # React components
├── lib/             # Utilities (crypto, db, redis)
└── middleware.ts    # Security headers
```

---

## Testing Checklist

- [ ] Create paste
- [ ] View paste
- [ ] Copy URL
- [ ] Test password protection
- [ ] Test burn-after-read
- [ ] Test expiration (create 5min paste)
- [ ] Test syntax highlighting
- [ ] Test QR code
- [ ] Test on mobile
- [ ] Test raw view mode

---

## Ready to Deploy?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel deployment instructions.

---

**Happy coding! 🚀**
