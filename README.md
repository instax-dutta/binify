# 🌌 Binify — Zero-Knowledge Encrypted Pastebin

[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/instax-dutta/binify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Finstax-dutta%2Fbinify&env=TURSO_DATABASE_URL,TURSO_AUTH_TOKEN,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,NEXT_PUBLIC_APP_URL&project-name=binify&repository-name=binify)

**Binify** is a sovereign, production-ready, privacy-first pastebin application. Built for the modern web with a **zero-knowledge architecture**, ensuring that your secrets remain yours — even from the server hosting them.

---

## ✨ Why Binify?

In an era of mass surveillance and data breaches, Binify provides a secure haven for your code, notes, and secrets.

- 🔒 **Zero-Knowledge Architecture**: All encryption and decryption happen in your browser. The server never sees your plaintext content or your encryption keys.
- ⚡ **High Performance**: Built with **Next.js 15**, **Turso (libSQL)**, and **Upstash Redis** for sub-millisecond metadata lookups.
- 🛡️ **Military Grade Security**: Implements **AES-256-GCM** encryption with optional **PBKDF2** key derivation (100,000 iterations).
- 🔓 **Fully Open Source**: Audit the code, host it yourself, and contribute to a more private web.

---

## 🚀 Key Features

### 🔐 Security & Privacy

- **Client-Side Encryption**: AES-256-GCM performed locally before transmission.
- **Key Isolation**: Encryption keys are stored in the URL fragment (`#`), which browsers never send to the server.
- **Self-Destruct (Burn-after-read)**: Cryptographically purge data immediately after the first view.
- **Granular Expiration**: Set pastes to expire after 5 minutes, 30 days, or a specific number of views.
- **Password Protection**: An extra layer of derivation to protect ultra-sensitive content.
- **Manual Revocation**: Purge your content at any time using a private administrative token.
- **Link Rotation**: Instantly change the public URL of your paste while keeping the underlying data intact.

### 🎨 Developer Experience

- **High-Fidelity Markdown**: Full GFM support including tables, task lists, and sanitized HTML.
- **Rich Syntax Highlighting**: Industry-standard highlighting for 20+ programming languages.
- **Infinite Payload Support**: Optimized for large pastes up to **4MB** with smooth internal scrolling.
- **Link Management Terminal**: Dedicated `/revoke` interface that accepts both raw IDs and full sharing URLs.
- **QR Code Sharing**: Securely share pastes to mobile devices via instant QR generation.
- **Premium Aesthetic**: A glassmorphic, terminal-inspired UI designed for modern developers.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [Turso](https://turso.tech/) (Edge SQLite)
- **Cache/Storage**: [Upstash Redis](https://upstash.com/)
- **Styling**: Tailwind CSS + Framer Motion
- **Cryptography**: Web Crypto API (Browser Native)
- **Smooth Scrolling**: [Lenis](https://lenis.darkroom.engineering/)
- **Icons**: Lucide React

---

## 🛡️ Security Architecture

### How the "Zero-Knowledge" Flow Works

1. **Creation**: Browser generates a random 256-bit key → Encrypts data → Sends blob to server.
2. **Key Storage**: The access key is appended to the URL as a fragment: `https://binify.io/p/abc#KEY`.
3. **Retrieval**: Browser parses the `#KEY` locally → Fetches the blob → Decrypts inside the client.
4. **Administrative Controls**: Upon creation, the user receives a unique **Deletion Token** for life-cycle management.

### The Dual-Key Security Model

Binify separates **Access** from **Control** to maximize sovereignty:

- **The #Fragment (Access)**: Used only for decryption. It is never transmitted to the network.
- **The Deletion Token (Control)**: used to verify authority during revocation or rotation. It resides in the database metadata layer but grants no access to the content.

---

## 📖 Installation & Deployment

### 1. Local Development

```bash
git clone https://github.com/instax-dutta/binify.git
npm install
npm run dev
```

### 2. Environment Configuration

Create a `.env.local` file with the following:

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Initialization

```bash
curl -X POST http://localhost:3000/api/init
```

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's a bug fix, new feature, or documentation improvement, please feel free to open a Pull Request.

1. **Fork** the repository.
2. Create a **feature branch**: `git checkout -b feature/name`
3. **Commit** your changes: `git commit -m 'Add some feature'`
4. **Push** to the branch and open a **PR**.

---

Built with ❤️ by [sdad.pro](https://sdad.pro) — *Securing the web, one paste at a time.*
