# Deployment Guide for Binify

This guide will walk you through deploying Binify to Vercel with TursoDB and Upstash Redis.

---

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] TursoDB account (free tier: 9GB storage, 1 billion row reads/month)
- [ ] Upstash Redis account (free tier: 10,000 commands/day)
- [ ] Custom domain configured (optional but recommended)

---

## Step 1: Set Up TursoDB

### 1.1 Install Turso CLI

**macOS/Linux:**

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

**Windows:**

```powershell
irm get.tur.so/install.ps1 | iex
```

### 1.2 Authenticate

```bash
turso auth login
```

### 1.3 Create Database

```bash
# Create database
turso db create binify

# Get database URL
turso db show binify --url
# Output: libsql://binify-[username].turso.io

# Create authentication token
turso db tokens create binify
# Output: eyJhbGc...
```

### 1.4 Save Credentials

Save these values for later:

- `TURSO_DATABASE_URL`: The URL from step above
- `TURSO_AUTH_TOKEN`: The token from step above

---

## Step 2: Set Up Upstash Redis

### 2.1 Create Redis Database

1. Go to [console.upstash.com](https://console.upstash.com)
2. Click "Create Database"
3. Choose a name (e.g., "binify")
4. Select a region close to your Vercel deployment region
5. Click "Create"

### 2.2 Get Credentials

1. In the database dashboard, scroll to "REST API"
2. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## Step 3: Prepare Repository

### 3.1 Initialize Git (if not already done)

```bash
cd /path/to/binify
git init
git add .
git commit -m "Initial commit: Binify zero-knowledge pastebin"
```

### 3.2 Push to GitHub

```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/binify.git
git branch -M main
git push -u origin main
```

---

## Step 4: Deploy to Vercel

### 4.1 Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 4.2 Configure Environment Variables

In the Vercel project settings, add these environment variables:

| Name | Value | Notes |
|------|-------|-------|
| `TURSO_DATABASE_URL` | `libsql://binify-[username].turso.io` | From Step 1.3 |
| `TURSO_AUTH_TOKEN` | `eyJhbGc...` | From Step 1.3 |
| `UPSTASH_REDIS_REST_URL` | `https://[name].upstash.io` | From Step 2.2 |
| `UPSTASH_REDIS_REST_TOKEN` | `[token]` | From Step 2.2 |
| `NEXT_PUBLIC_APP_URL` | `https://bin.sdad.pro` | Your production URL |

### 4.3 Deploy

Click "Deploy" and wait for the build to complete.

---

## Step 5: Initialize Database

After deployment, initialize the database schema:

```bash
curl -X POST https://your-deployment-url.vercel.app/api/init
```

Expected response:

```json
{
  "message": "Database initialized successfully"
}
```

---

## Step 6: Configure Custom Domain

### 6.1 Add Domain in Vercel

1. Go to your project in Vercel
2. Navigate to Settings → Domains
3. Add your domain: `bin.sdad.pro`

### 6.2 Update DNS Records

Vercel will provide DNS records. Typically:

**For root domain (bin.sdad.pro):**

- Type: `A`
- Name: `bin` (or `@` if using root)
- Value: `76.76.21.21` (Vercel's IP)

**Or use CNAME:**

- Type: `CNAME`
- Name: `bin`
- Value: `cname.vercel-dns.com`

### 6.3 Update Environment Variable

Update `NEXT_PUBLIC_APP_URL` in Vercel:

```
NEXT_PUBLIC_APP_URL=https://bin.sdad.pro
```

Redeploy for changes to take effect.

---

## Step 7: Verify Deployment

### 7.1 Test Paste Creation

1. Visit `https://bin.sdad.pro`
2. Create a test paste
3. Verify you receive a URL
4. Open the URL and verify decryption works

### 7.2 Test Features

- [ ] Paste creation
- [ ] Paste viewing
- [ ] Password protection
- [ ] Burn after read
- [ ] Syntax highlighting
- [ ] QR code generation
- [ ] Copy to clipboard
- [ ] Expiration countdown

### 7.3 Check Security Headers

```bash
curl -I https://bin.sdad.pro
```

Verify headers:

- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (in production)

---

## Step 8: Monitoring & Maintenance

### 8.1 Monitor Usage

**TursoDB:**

```bash
turso db show binify
```

**Upstash:**

- Check dashboard at console.upstash.com
- Monitor daily command usage

**Vercel:**

- Check Analytics in Vercel dashboard
- Monitor function execution times
- Review error logs

### 8.2 Set Up Alerts

**Upstash:**

1. Go to database settings
2. Set up email alerts for:
   - 80% of daily limit reached
   - Error rate threshold

**Vercel:**

1. Enable email notifications for:
   - Deployment failures
   - Function errors

### 8.3 Backup Strategy

**TursoDB:**

```bash
# Create a backup
turso db shell binify ".backup backup.db"

# Restore from backup
turso db shell binify ".restore backup.db"
```

**Note**: Upstash Redis is ephemeral by design (TTL-based). No backup needed for paste content.

---

## Troubleshooting

### Issue: "Database connection failed"

**Solution:**

- Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are correct
- Check if database exists: `turso db list`
- Regenerate token: `turso db tokens create binify`

### Issue: "Redis connection failed"

**Solution:**

- Verify Upstash credentials in Vercel
- Check Redis database status in Upstash console
- Ensure region is accessible from Vercel

### Issue: "Paste not found" immediately after creation

**Solution:**

- Check Redis TTL settings
- Verify database initialization: `curl -X POST https://your-url/api/init`
- Check Vercel function logs

### Issue: Rate limiting too strict

**Solution:**
Edit `src/app/api/paste/route.ts`:

```typescript
const RATE_LIMIT_MAX = 20; // Increase from 10
const RATE_LIMIT_WINDOW = 3600; // Keep at 1 hour
```

### Issue: Paste size limit too small

**Solution:**
Edit `src/lib/validation.ts`:

```typescript
export const MAX_PASTE_SIZE = 2 * 1024 * 1024; // 2MB instead of 1MB
```

---

## Scaling Considerations

### Free Tier Limits

**TursoDB (Free):**

- 9 GB total storage
- 1 billion row reads/month
- 25 million row writes/month

**Upstash Redis (Free):**

- 10,000 commands/day
- 256 MB storage
- 100 concurrent connections

**Vercel (Hobby):**

- 100 GB bandwidth/month
- 100 GB-hours serverless function execution
- 6,000 build minutes/month

### When to Upgrade

**Upgrade TursoDB if:**

- Storing >9GB of metadata
- >1B reads/month (~380 reads/second average)

**Upgrade Upstash if:**
>
- >10,000 commands/day (~7 commands/minute)
- Need >256MB storage

**Upgrade Vercel if:**
>
- >100GB bandwidth/month
- Need custom build configurations
- Want cron jobs for cleanup

---

## Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] Database initialized (`/api/init`)
- [ ] Custom domain configured and SSL active
- [ ] Security headers verified
- [ ] Test paste creation and viewing
- [ ] Test password protection
- [ ] Test burn-after-read
- [ ] Test expiration (create 5min paste)
- [ ] Verify rate limiting works
- [ ] Check mobile responsiveness
- [ ] Set up monitoring alerts
- [ ] Document backup procedures
- [ ] Update README with your info
- [ ] Add GitHub repository link
- [ ] Test QR code generation
- [ ] Verify syntax highlighting for multiple languages

---

## Post-Deployment

### Share Your Deployment

- Update `README.md` with your deployment URL
- Add to your portfolio
- Share on social media
- Submit to product directories

### Optional Enhancements

- Add analytics (privacy-respecting like Plausible)
- Implement paste statistics dashboard
- Add API rate limit dashboard
- Create browser extension
- Build CLI tool for paste creation
- Add paste templates
- Implement paste collections

---

## Support

If you encounter issues:

1. Check Vercel function logs
2. Review TursoDB connection
3. Verify Upstash Redis status
4. Check browser console for client-side errors
5. Review security headers (may block resources)

For help:

- GitHub Issues: [your-repo]
- Email: [your-email]
- Website: <https://sdad.pro>

---

**Congratulations! Your zero-knowledge pastebin is now live! 🎉**
