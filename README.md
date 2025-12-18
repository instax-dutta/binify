# Binify - Zero-Knowledge Encrypted Pastebin

**Production-ready, privacy-first, zero-knowledge pastebin application.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsaiduttaabhishekdash%2Fbinify&env=TURSO_DATABASE_URL,TURSO_AUTH_TOKEN,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,NEXT_PUBLIC_APP_URL&project-name=binify&repository-name=binify)

🔒 **Zero-Knowledge**: All encryption happens client-side. The server never sees your plaintext.  
⚡ **Fast**: Built with Next.js 15 and tailormade for maximum performance.  
🔥 **Burn After Read**: Self-destructing secrets with cryptographic certainty.  
🛡️ **Military Grade**: AES-256-GCM encryption with argon2-level PBKDF2 key derivation.

---

## 🚀 Quick Deploy

You can host your own instance of Binify in minutes:

1. Click the **Deploy to Vercel** button above.
2. Connect your GitHub account.
3. Provide the required environment variables (see [Setup](#-setup)).
4. Initialize your database.

---

## ✨ Features

### 🔐 Security & Privacy

- **Client-Side Encryption**: AES-256-GCM encryption performed locally.
- **Zero-Knowledge**: Keys are stored in the URL fragment (`#`), which browsers never send to the server.
- **Password Protection**: Optional second layer of security using PBKDF2 (100,000 iterations).
- **Ephemeral Storage**: Redis-backed storage with strict TTL policies.
- **Burn After Read**: One-time-use links that purge data immediately upon retrieval.

### 🛠 Technical Excellence

- **Syntax Highlighting**: Beautiful code rendering for 20+ languages.
- **Markdown Support**: Render documents with rich formatting.
- **QR Codes**: Instant mobile sharing with secure scan.
- **Rate Limiting**: Intelligent abuse prevention.
- **Privacy First**: No tracking, no cookies, no logs.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [Turso](https://turso.tech/) (SQLite via libSQL)
- **Cache**: [Upstash Redis](https://upstash.com/)
- **Styling**: Tailwind CSS + Framer Motion
- **Icons**: Lucide React
- **Cryptography**: Web Crypto API

---

## 📋 Setup

### Prerequisites

- Node.js 18+
- Accounts for Turso and Upstash (both have generous free tiers).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Your Turso DB connection URL. |
| `TURSO_AUTH_TOKEN` | Your Turso DB authentication token. |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token. |
| `NEXT_PUBLIC_APP_URL` | The public URL of your deployment (e.g., `https://bin.sdad.pro`). |
| `INIT_SECRET` | (Optional) Secret key to protect the database initialization endpoint. |

### Initialization

Once deployed, you must initialize the database schema:

```bash
curl -X POST https://your-domain.com/api/init \
  -H "Authorization: Bearer YOUR_INIT_SECRET"
```

---

## 📄 Documentation

For detailed guides, architecture diagrams, and security protocols, visit the [Documentation Page](https://bin.sdad.pro/docs).

---

## 🛡️ Security Policy

We take security seriously. If you discover a vulnerability, please report it via [security.sdad.pro](https://sdad.pro/security).

---

## 🤝 Credits

Built with ❤️ by [sdad.pro](https://sdad.pro)
