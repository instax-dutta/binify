# 🌌 Binify — Zero-Knowledge Encrypted Pastebin

[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/saiduttaabhishekdash/binify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsaiduttaabhishekdash%2Fbinify&env=TURSO_DATABASE_URL,TURSO_AUTH_TOKEN,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,NEXT_PUBLIC_APP_URL&project-name=binify&repository-name=binify)

**Binify** is a sovereign, production-ready, privacy-first pastebin application. Built for the modern web with a **zero-knowledge architecture**, ensuring that your secrets remain yours — even from the server hosting them.

---

## ✨ Why Binify?

In an era of mass surveillance and data breaches, Binify provides a secure haven for your code, notes, and secrets.

- 🔒 **Zero-Knowledge Architecture**: All encryption and decryption happen in your browser. The server never sees your plaintext content or your encryption keys.
- ⚡ **High Performance**: Built with **Next.js 15**, **Turso (libSQL)**, and **Upstash Redis** for sub-millisecond metadata lookups.
- 🛡️ **Military Grade Security**: Implements **AES-256-GCM** encryption with optional **PBKDF2** key derivation (100,000 iterations).
- 🔓 **Fully Open Source**: audit the code, host it yourself, and contribute to a more private web.

---

## 🚀 Key Features

### 🔐 Security & Privacy

- **Client-Side Encryption**: AES-256-GCM performed locally.
- **Key Isolation**: Encryption keys are stored in the URL fragment (`#`), which browsers never send to the server.
- **Self-Destruct (Burn-after-read)**: Cryptographically purge data immediately after the first view.
- **Granular Expiration**: Set pastes to expire after 5 minutes, 30 days, or a specific number of views.
- **Password Protection**: An extra layer of derivation to protect ultra-sensitive content.

### 🎨 Developer Experience

- **Rich Syntax Highlighting**: Support for 20+ programming languages.
- **Live Markdown Preview**: Render documents with beautiful, sanitized formatting.
- **Large Content Support**: Now supports up to **4MB** per paste for large codebases or documents.
- **QR Code Sharing**: Instant mobile integration with secure scan links.
- **Responsive & Dark Mode**: A premium, terminal-inspired aesthetic for developers.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [Turso](https://turso.tech/) (Edge SQLite)
- **Cache/Storage**: [Upstash Redis](https://upstash.com/)
- **Styling**: Tailwind CSS + Framer Motion
- **Cryptography**: Web Crypto API (Browser Native)
- **Icons**: Lucide React

---

## 📖 Getting Started (Local Development)

### 1. Prerequisites

- Node.js 18+ & npm
- [Turso CLI](https://get.tur.so/install.sh)
- [Upstash](https://console.upstash.com) Account

### 2. Installation

```bash
git clone https://github.com/saiduttaabhishekdash/binify.git
cd binify
npm install
```

### 3. Configuration

Create a `.env.local` file:

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Initialization

Start the server and initialize the schema:

```bash
npm run dev
curl -X POST http://localhost:3000/api/init
```

---

## 🚢 Production Deployment

### Step 1: Services Setup

1. **TursoDB**: `turso db create binify` → Get URL and Token.
2. **Upstash Redis**: Create a database → Copy REST credentials.

### Step 2: Vercel Deployment

1. Connect your repo to Vercel.
2. Add the environment variables listed in the configuration section.
3. Deploy!
4. Initialize the prod DB: `curl -X POST https://your-domain.com/api/init`

---

## 🛡️ Security Architecture

### How the "Zero-Knowledge" Flow Works

1. **Creation**: Browser generates a random 256-bit key → Encrypts data → Sends blob to server.
2. **Key Storage**: The key is appended to the URL as a fragment: `https://binify.io/p/abc#KEY`.
3. **Retrieval**: Browser parses the `#KEY` from the URL → Fetches the blob → Decrypts locally.
4. **Server Knowledge**: The server only sees the encrypted blob and metadata (ID, timestamp).

### Threat Model

- ✅ **Server Compromise**: Attacker gets encrypted blobs but no keys.
- ✅ **Network Interception**: TLS handles transport; keys never leave the client.
- ✅ **Database Breach**: Only metadata is exposed.

---

## 🔧 Troubleshooting

- **Styles not loading?** Ensure you are using Tailwind v3 configuration.
- **Database Connection Error?** Verify your Turso credentials and that you've run `/api/init`.
- **Paste not found?** Check Upstash Redis TTL or if the paste was set to "Burn after read".

---

## 🤝 Contributing & Open Source

Binify is proud to be **Open Source**. We believe that security software must be transparent and community-driven.

1. **Fork** the repository.
2. Create a **feature branch**: `git checkout -b feature/amazing-thing`
3. **Commit** your changes: `git commit -m 'Add some amazing thing'`
4. **Push** to the branch: `git push origin feature/amazing-thing`
5. Open a **Pull Request**.

### License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

Built with ❤️ by [sdad.pro](https://sdad.pro) — *Securing the web, one paste at a time.*
