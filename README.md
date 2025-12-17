# Binify - Zero-Knowledge Encrypted Pastebin

**Production-ready, Vercel-hostable, zero-knowledge pastebin application**

🔒 **Zero-Knowledge**: All encryption happens client-side  
⚡ **Fast**: Built with Next.js 15 and optimized for Vercel  
🔥 **Burn After Read**: Self-destructing pastes  
🎨 **Beautiful**: Dark theme with syntax highlighting  
🛡️ **Secure**: AES-256-GCM encryption with optional password protection

---

## Features

### Core Features

- ✅ Client-side AES-256-GCM encryption
- ✅ Zero-knowledge architecture (server never sees plaintext)
- ✅ Burn-after-read functionality
- ✅ Time-based expiration (5min to 30 days)
- ✅ View-based expiration
- ✅ Optional password protection (PBKDF2)
- ✅ Syntax highlighting for 20+ languages
- ✅ Markdown rendering
- ✅ QR code generation
- ✅ One-click copy & download
- ✅ Raw view mode
- ✅ Mobile-responsive UI
- ✅ Rate limiting
- ✅ Paste size limits (1MB)

### Security Features

- 🔐 AES-256-GCM encryption
- 🔑 PBKDF2 key derivation (100,000 iterations)
- 🛡️ CSP headers
- 🚫 XSS protection
- 🔒 HSTS in production
- ⚡ Rate limiting (10 pastes/hour per IP)
- 🎯 Secure paste ID generation (128-bit entropy)

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: TursoDB (libSQL)
- **Cache**: Upstash Redis
- **Encryption**: Web Crypto API
- **Deployment**: Vercel

---

## Architecture

### Storage Strategy

**Upstash Redis** (Encrypted Payloads)

- Stores encrypted paste content
- TTL-based expiration
- Burn-after-read with GETDEL

**TursoDB** (Metadata)

- Paste metadata (ID, timestamps, view counts)
- Expiration settings
- Feature flags

### Encryption Flow

**Creating a Paste:**

1. User enters content in browser
2. Client generates random 256-bit key
3. Optional: Derive additional key from password (PBKDF2)
4. Encrypt content with AES-256-GCM
5. Send encrypted blob to server
6. Server stores in Redis + metadata in TursoDB
7. Return paste ID to client
8. Client constructs URL: `https://bin.sdad.pro/p/{id}#{key}`

**Reading a Paste:**

1. Parse paste ID from URL path
2. Extract encryption key from URL fragment (#key)
3. Fetch encrypted blob from API
4. Client decrypts using key from fragment
5. Display decrypted content

**Key Point**: The encryption key in the URL fragment is NEVER sent to the server.

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- TursoDB account ([turso.tech](https://turso.tech))
- Upstash Redis account ([upstash.com](https://upstash.com))
- Vercel account (for deployment)

### Local Development

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up TursoDB:**

   ```bash
   # Install Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Login
   turso auth login
   
   # Create database
   turso db create binify
   
   # Get connection URL
   turso db show binify --url
   
   # Create auth token
   turso db tokens create binify
   ```

3. **Set up Upstash Redis:**
   - Go to [console.upstash.com](https://console.upstash.com)
   - Create a new Redis database
   - Copy REST URL and token

4. **Configure environment variables:**

   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local`:

   ```env
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Initialize database:**

   ```bash
   npm run dev
   ```

   Then visit: `http://localhost:3000/api/init` (POST request)

   Or use curl:

   ```bash
   curl -X POST http://localhost:3000/api/init
   ```

6. **Start development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Production Deployment (Vercel)

1. **Push to GitHub:**

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables:
     - `TURSO_DATABASE_URL`
     - `TURSO_AUTH_TOKEN`
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`
     - `NEXT_PUBLIC_APP_URL` (e.g., `https://bin.sdad.pro`)
   - Deploy!

3. **Initialize production database:**

   ```bash
   curl -X POST https://bin.sdad.pro/api/init
   ```

4. **Configure custom domain:**
   - In Vercel dashboard, go to Settings → Domains
   - Add `bin.sdad.pro`
   - Update DNS records as instructed

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TURSO_DATABASE_URL` | TursoDB connection URL | Yes |
| `TURSO_AUTH_TOKEN` | TursoDB authentication token | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application | Yes |

---

## API Endpoints

### `POST /api/paste`

Create a new encrypted paste.

**Request Body:**

```json
{
  "ciphertext": "base64url-encoded-ciphertext",
  "iv": "base64url-encoded-iv",
  "authTag": "base64url-encoded-auth-tag",
  "salt": "base64url-encoded-salt (optional)",
  "expirationType": "1day",
  "maxViews": 10,
  "hasPassword": false,
  "language": "javascript",
  "title": "My Paste"
}
```

**Response:**

```json
{
  "pasteId": "paste-id",
  "expiresAt": 1234567890,
  "maxViews": 10
}
```

### `GET /api/paste/[id]`

Retrieve an encrypted paste.

**Response:**

```json
{
  "ciphertext": "...",
  "iv": "...",
  "authTag": "...",
  "salt": "...",
  "createdAt": 1234567890,
  "expiresAt": 1234567890,
  "viewCount": 1,
  "maxViews": 10,
  "hasPassword": false,
  "language": "javascript",
  "title": "My Paste",
  "willBurn": false
}
```

### `DELETE /api/paste/[id]`

Delete a paste (revoke).

**Response:**

```json
{
  "message": "Paste deleted successfully"
}
```

### `POST /api/init`

Initialize database schema (run once on deployment).

---

## Security Considerations

### What the Server Knows

- Paste ID
- Encrypted blob (ciphertext)
- Metadata (timestamps, view counts, expiration settings)
- IP addresses (for rate limiting)

### What the Server NEVER Knows

- Plaintext content
- Encryption keys
- Passwords (only password-derived salts)

### Threat Model

- ✅ **Server compromise**: Encrypted data remains secure
- ✅ **Network interception**: HTTPS + key in fragment
- ✅ **Database leak**: Only encrypted blobs exposed
- ⚠️ **Client compromise**: Malicious JS could steal keys
- ⚠️ **Phishing**: Users could be tricked into sharing URLs

### Best Practices

- Always use HTTPS in production
- Regularly rotate TursoDB and Upstash credentials
- Monitor rate limiting logs
- Keep dependencies updated
- Review CSP headers periodically

---

## Project Structure

```
binify/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── paste/
│   │   │   │   ├── route.ts          # POST /api/paste
│   │   │   │   └── [id]/route.ts     # GET/DELETE /api/paste/[id]
│   │   │   └── init/route.ts         # POST /api/init
│   │   ├── p/[id]/page.tsx           # Paste view page
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home page
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── PasteEditor.tsx           # Paste creation form
│   │   ├── PasteCreated.tsx          # Success screen with URL
│   │   └── PasteViewer.tsx           # Paste display with highlighting
│   ├── lib/
│   │   ├── crypto.ts                 # Encryption utilities
│   │   ├── db.ts                     # TursoDB client
│   │   ├── redis.ts                  # Upstash Redis client
│   │   └── validation.ts             # Zod schemas
│   └── middleware.ts                 # Security headers
├── public/                           # Static assets
├── tailwind.config.ts                # Tailwind configuration
├── next.config.ts                    # Next.js configuration
├── package.json                      # Dependencies
└── README.md                         # This file
```

---

## Maintenance

### Cleanup Expired Pastes

Currently, expired pastes are cleaned up on-demand when accessed. For proactive cleanup, you could:

1. **Manual cleanup** (run periodically):

   ```typescript
   // Create a script: scripts/cleanup.ts
   import { getExpiredPasteIds, deletePasteMetadata } from '@/lib/db';
   import { deletePastes } from '@/lib/redis';
   
   const expiredIds = await getExpiredPasteIds();
   await deletePastes(expiredIds);
   await Promise.all(expiredIds.map(deletePasteMetadata));
   ```

2. **Vercel Cron** (requires Pro plan):
   Add to `vercel.json`:

   ```json
   {
     "crons": [{
       "path": "/api/cleanup",
       "schedule": "0 0 * * *"
     }]
   }
   ```

### Monitoring

- Monitor Upstash Redis usage
- Monitor TursoDB database size
- Check rate limiting logs
- Review error logs in Vercel dashboard

---

## License

MIT License - feel free to use for personal or commercial projects.

---

## Credits

Built with ❤️ by [sdad.pro](https://sdad.pro)

Inspired by [PrivateBin](https://privatebin.info/)

---

## Support

For issues or questions:

- GitHub Issues: [your-repo-url]
- Email: [your-email]
- Website: [https://sdad.pro](https://sdad.pro)
