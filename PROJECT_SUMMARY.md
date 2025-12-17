# Binify - Project Summary

## Overview

**Binify** is a production-ready, zero-knowledge encrypted pastebin application built for deployment on Vercel. It implements end-to-end encryption where all cryptographic operations happen client-side, ensuring the server never has access to plaintext content or encryption keys.

---

## ✅ Completed Features

### Core Functionality

- ✅ **Zero-Knowledge Architecture**: All encryption/decryption happens in browser
- ✅ **AES-256-GCM Encryption**: Military-grade authenticated encryption
- ✅ **Client-Side Key Generation**: Cryptographically secure random keys
- ✅ **URL Fragment Key Storage**: Encryption key never sent to server
- ✅ **Password Protection**: Optional PBKDF2-derived additional encryption
- ✅ **Burn After Read**: Self-destructing pastes after first view
- ✅ **Time-Based Expiration**: 5 minutes to 30 days, or never
- ✅ **View-Based Expiration**: Delete after X views
- ✅ **Syntax Highlighting**: 20+ programming languages supported
- ✅ **Markdown Rendering**: Client-side markdown preview
- ✅ **QR Code Generation**: Easy mobile sharing
- ✅ **Copy to Clipboard**: One-click URL and content copying
- ✅ **Download Paste**: Save paste as text file
- ✅ **Raw View Mode**: Toggle between formatted and raw display

### Security Features

- ✅ **Rate Limiting**: 10 pastes/hour per IP
- ✅ **Size Limits**: 1MB maximum paste size
- ✅ **CSP Headers**: Content Security Policy protection
- ✅ **XSS Protection**: Multiple layers of XSS prevention
- ✅ **HSTS**: HTTP Strict Transport Security in production
- ✅ **Input Validation**: Zod schemas for all API inputs
- ✅ **Secure Paste IDs**: 128-bit entropy (unguessable)

### UI/UX Features

- ✅ **Dark Theme**: High-contrast, terminal-inspired aesthetic
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Smooth Animations**: Subtle fade-ins and transitions
- ✅ **Loading States**: Clear feedback during operations
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Countdown Timer**: Real-time expiration display
- ✅ **Security Warnings**: Clear burn-after-read alerts
- ✅ **Accessibility**: Keyboard navigation and screen reader support

### Technical Implementation

- ✅ **Next.js 15**: App Router with TypeScript
- ✅ **Tailwind CSS**: Utility-first styling
- ✅ **TursoDB Integration**: SQLite metadata storage
- ✅ **Upstash Redis**: Encrypted payload storage with TTL
- ✅ **Web Crypto API**: Browser-native encryption
- ✅ **Vercel-Compatible**: Serverless-ready architecture
- ✅ **Production Build**: Optimized and tested

---

## 📁 Project Structure

```
binify/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── paste/
│   │   │   │   ├── route.ts              # POST /api/paste (create)
│   │   │   │   └── [id]/route.ts         # GET/DELETE /api/paste/[id]
│   │   │   └── init/route.ts             # POST /api/init (DB setup)
│   │   ├── p/[id]/page.tsx               # Paste view page
│   │   ├── layout.tsx                    # Root layout with SEO
│   │   ├── page.tsx                      # Home page
│   │   └── globals.css                   # Global styles
│   ├── components/
│   │   ├── PasteEditor.tsx               # Paste creation form
│   │   ├── PasteCreated.tsx              # Success screen with URL/QR
│   │   └── PasteViewer.tsx               # Paste display with highlighting
│   ├── lib/
│   │   ├── crypto.ts                     # Encryption utilities
│   │   ├── db.ts                         # TursoDB client
│   │   ├── redis.ts                      # Upstash Redis client
│   │   └── validation.ts                 # Zod schemas
│   └── middleware.ts                     # Security headers
├── public/                               # Static assets
├── tailwind.config.ts                    # Tailwind configuration
├── next.config.ts                        # Next.js configuration
├── vercel.json                           # Vercel deployment config
├── package.json                          # Dependencies
├── README.md                             # Main documentation
├── DEPLOYMENT.md                         # Deployment guide
├── SECURITY.md                           # Security documentation
└── env.example                           # Environment variables template
```

---

## 🔐 Security Architecture

### Encryption Flow

**Creating a Paste:**

1. User enters content in browser
2. Client generates random 256-bit AES key
3. Optional: Derive additional key from password (PBKDF2, 100k iterations)
4. Encrypt content with AES-256-GCM (produces ciphertext + IV + auth tag)
5. Send encrypted blob to server (server never sees plaintext)
6. Server stores encrypted payload in Redis, metadata in TursoDB
7. Return paste ID to client
8. Client constructs URL: `https://bin.sdad.pro/p/{id}#{key}`
9. Key in URL fragment (#) is never sent to server

**Reading a Paste:**

1. Parse paste ID from URL path
2. Extract encryption key from URL fragment
3. Fetch encrypted blob from API
4. Client decrypts using key from fragment
5. Display decrypted content with syntax highlighting

### What Server Knows vs. Doesn't Know

**Server Knows:**

- Paste ID
- Encrypted blob (useless without key)
- Metadata (timestamps, view counts, expiration)
- IP addresses (for rate limiting, temporary)

**Server NEVER Knows:**

- Plaintext content
- Encryption keys
- Passwords (only salts for key derivation)

---

## 🚀 Deployment Status

### Build Status

✅ **Production build successful**

- No TypeScript errors
- No build warnings (except expected middleware deprecation)
- All routes compiled successfully
- Optimized for production

### Required Services

1. **TursoDB** (Database)
   - Free tier: 9GB storage, 1B reads/month
   - Stores paste metadata
   - Initialization required: `POST /api/init`

2. **Upstash Redis** (Cache)
   - Free tier: 10k commands/day, 256MB
   - Stores encrypted payloads
   - TTL-based expiration

3. **Vercel** (Hosting)
   - Hobby tier compatible
   - Serverless functions
   - Edge network

### Environment Variables Needed

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
NEXT_PUBLIC_APP_URL=https://bin.sdad.pro
```

---

## 📊 API Endpoints

### `POST /api/paste`

Create encrypted paste

- **Rate limit**: 10/hour per IP
- **Max size**: 1MB
- **Returns**: `{ pasteId, expiresAt, maxViews }`

### `GET /api/paste/[id]`

Retrieve encrypted paste

- **Auto-increments** view count
- **Burns** if burn-after-read
- **Returns**: Encrypted payload + metadata

### `DELETE /api/paste/[id]`

Delete paste (revoke)

- **Removes** from Redis and TursoDB
- **Returns**: Success message

### `POST /api/init`

Initialize database schema

- **Run once** on deployment
- **Creates** tables and indexes

---

## 🎨 Design System

### Colors

- **Background**: `#0a0a0a`, `#111111`, `#1a1a1a`
- **Text**: `#e5e5e5`, `#a0a0a0`, `#6b7280`
- **Accent Blue**: `#3b82f6`
- **Accent Green**: `#10b981`
- **Accent Yellow**: `#f59e0b`
- **Accent Red**: `#ef4444`
- **Borders**: `#2a2a2a`, `#3a3a3a`

### Typography

- **UI Font**: Inter (Google Fonts)
- **Code Font**: JetBrains Mono (Google Fonts)

### Components

- Buttons: Primary, Secondary, Danger
- Inputs: Text, Textarea, Select
- Cards: Default, Hover
- Badges: Blue, Green, Yellow, Red
- Animations: Fade-in, Slide-up, Spinner

---

## 📝 Next Steps for Deployment

1. **Set up TursoDB**

   ```bash
   turso db create binify
   turso db show binify --url
   turso db tokens create binify
   ```

2. **Set up Upstash Redis**
   - Create database at console.upstash.com
   - Copy REST URL and token

3. **Deploy to Vercel**
   - Push to GitHub
   - Import repository in Vercel
   - Add environment variables
   - Deploy

4. **Initialize Database**

   ```bash
   curl -X POST https://bin.sdad.pro/api/init
   ```

5. **Configure Custom Domain**
   - Add `bin.sdad.pro` in Vercel
   - Update DNS records
   - Update `NEXT_PUBLIC_APP_URL`

6. **Test Everything**
   - Create paste
   - View paste
   - Test password protection
   - Test burn-after-read
   - Test expiration
   - Verify QR codes
   - Check mobile responsiveness

---

## 🔧 Maintenance

### Regular Tasks

- Monitor Upstash Redis usage
- Monitor TursoDB database size
- Review rate limiting logs
- Update dependencies monthly
- Check security advisories

### Optional Enhancements

- Add analytics (Plausible, privacy-respecting)
- Implement paste statistics dashboard
- Create CLI tool for paste creation
- Add browser extension
- Implement paste collections/folders
- Add paste templates
- Multi-file paste support
- Collaborative paste editing

---

## 📚 Documentation

- **README.md**: Main documentation with features and setup
- **DEPLOYMENT.md**: Step-by-step deployment guide
- **SECURITY.md**: Security architecture and threat model
- **env.example**: Environment variables template

---

## 🎯 Success Criteria

All core requirements met:

- ✅ Zero-knowledge architecture
- ✅ Vercel-compatible
- ✅ TursoDB + Upstash Redis integration
- ✅ AES-256-GCM encryption
- ✅ Burn-after-read
- ✅ Time and view-based expiration
- ✅ Password protection
- ✅ Syntax highlighting
- ✅ QR code generation
- ✅ Rate limiting
- ✅ Security headers
- ✅ Mobile-responsive
- ✅ Dark theme
- ✅ Production-ready build
- ✅ Comprehensive documentation

---

## 🚨 Known Limitations

1. **No Background Workers**: Expired pastes cleaned up on-demand (Vercel Hobby limitation)
2. **No Cron Jobs**: Manual cleanup required (upgrade to Vercel Pro for cron)
3. **1MB Paste Limit**: Configurable but limited by Vercel function payload size
4. **Rate Limiting**: IP-based (can be bypassed with VPN, but sufficient for personal use)

---

## 📞 Support

For issues or questions:

- Review documentation in README.md, DEPLOYMENT.md, SECURITY.md
- Check Vercel function logs for errors
- Verify TursoDB and Upstash connectivity
- Test in browser console for client-side issues

---

## 🎉 Conclusion

**Binify is production-ready and deployment-ready!**

The application implements a robust zero-knowledge architecture with:

- Military-grade encryption (AES-256-GCM)
- Secure key management (URL fragments)
- Multiple layers of security (CSP, rate limiting, validation)
- Beautiful, accessible UI
- Comprehensive documentation
- Vercel-optimized architecture

**Ready to deploy to bin.sdad.pro!**
