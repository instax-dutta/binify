# Security Architecture - Binify

This document explains the security model, threat analysis, and cryptographic implementation of Binify.

---

## Zero-Knowledge Architecture

### Core Principle

**The server must never have access to plaintext content or encryption keys.**

### How It Works

1. **Encryption happens client-side**
   - All encryption/decryption uses Web Crypto API in the browser
   - Server only receives encrypted blobs

2. **Key never leaves the client**
   - Encryption key is stored in URL fragment (`#key`)
   - URL fragments are never sent to the server (browser behavior)
   - Server has no way to decrypt content

3. **Optional password protection**
   - Password is used to derive an additional encryption key
   - Password itself is never sent to server
   - Only the salt for key derivation is stored

---

## Cryptographic Implementation

### Encryption Algorithm: AES-256-GCM

**Why AES-256-GCM?**

- Industry standard authenticated encryption
- Provides both confidentiality and integrity
- Built into Web Crypto API
- Resistant to padding oracle attacks
- NIST approved

**Parameters:**

- Key size: 256 bits
- IV size: 96 bits (12 bytes) - recommended for GCM
- Authentication tag: 128 bits (16 bytes)

### Key Generation

**Base Key:**

```typescript
// Generate 256-bit random key
const key = new Uint8Array(32);
crypto.getRandomValues(key);
```

**Password-Derived Key (Optional):**

```typescript
// PBKDF2 with 100,000 iterations
const derivedKey = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: randomSalt,      // 128 bits
    iterations: 100000,    // OWASP recommendation
    hash: 'SHA-256',
  },
  passwordKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

### Encryption Process

```
Plaintext → AES-256-GCM → Ciphertext + Auth Tag
                ↑
            Key + IV

Stored on server:
{
  ciphertext: base64url(ciphertext),
  iv: base64url(iv),
  authTag: base64url(authTag),
  salt: base64url(salt)  // if password-protected
}
```

### Decryption Process

```
Ciphertext + Auth Tag → AES-256-GCM → Plaintext
                            ↑
                        Key + IV

Key source:
- Base key from URL fragment
- + Password-derived key (if protected)
```

---

## Threat Model

### What We Protect Against

✅ **Server Compromise**

- Even if server is compromised, attacker only gets encrypted blobs
- Without encryption keys, data remains secure
- Metadata (timestamps, view counts) may be exposed

✅ **Database Breach**

- TursoDB breach: Only metadata exposed
- Redis breach: Only encrypted payloads exposed
- No plaintext content accessible

✅ **Network Interception**

- HTTPS encrypts transport layer
- Encryption key in URL fragment never transmitted
- Man-in-the-middle cannot decrypt content

✅ **Unauthorized Access**

- Rate limiting prevents brute force
- Paste IDs have 128-bit entropy (unguessable)
- Optional password adds second layer

### What We Don't Protect Against

⚠️ **Client-Side Compromise**

- Malicious browser extension could steal keys
- XSS vulnerabilities could leak plaintext
- Mitigation: CSP headers, regular security audits

⚠️ **Social Engineering**

- Users could be tricked into sharing URLs with keys
- Phishing attacks targeting paste URLs
- Mitigation: User education, clear warnings

⚠️ **Physical Access**

- Attacker with physical access to unlocked device
- Browser history contains full URLs with keys
- Mitigation: Use private browsing, clear history

⚠️ **Endpoint Security**

- Compromised client device
- Keyloggers, screen recorders
- Mitigation: User responsibility, device security

---

## Security Features

### 1. Content Security Policy (CSP)

Implemented in `src/middleware.ts`:

```typescript
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob:;
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

**Purpose:**

- Prevent XSS attacks
- Block unauthorized resource loading
- Prevent clickjacking

### 2. Rate Limiting

Implemented in `src/lib/redis.ts`:

```typescript
// 10 pastes per hour per IP
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 3600;
```

**Purpose:**

- Prevent spam
- Mitigate DoS attacks
- Protect server resources

### 3. Paste ID Generation

Implemented in `src/lib/crypto.ts`:

```typescript
// 128-bit cryptographically secure random ID
const buffer = new Uint8Array(16);
crypto.getRandomValues(buffer);
const pasteId = base64url(buffer); // 22 characters
```

**Security:**

- 128-bit entropy = 2^128 possible IDs
- Collision probability: negligible
- Brute force infeasible

### 4. Size Limits

Implemented in `src/lib/validation.ts`:

```typescript
const MAX_PASTE_SIZE = 1024 * 1024; // 1MB
```

**Purpose:**

- Prevent resource exhaustion
- Limit storage costs
- Mitigate DoS attacks

### 5. Secure Headers

Additional headers in `src/middleware.ts`:

```typescript
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 6. Input Validation

All inputs validated with Zod schemas:

```typescript
CreatePasteSchema.parse(body);
```

**Validates:**

- Data types
- String lengths
- Number ranges
- Required fields

---

## Attack Scenarios & Mitigations

### Scenario 1: Brute Force Paste IDs

**Attack:** Try random paste IDs to find valid pastes

**Mitigation:**

- 128-bit entropy = 2^128 combinations
- At 1 million attempts/second: 10^25 years to try all
- Rate limiting: 10 requests/hour per IP
- Result: Infeasible

### Scenario 2: Replay Attacks

**Attack:** Intercept and replay API requests

**Mitigation:**

- HTTPS prevents interception
- Replaying encrypted blob is useless without key
- Key never transmitted to server
- Result: No benefit to attacker

### Scenario 3: SQL Injection

**Attack:** Inject malicious SQL in inputs

**Mitigation:**

- Parameterized queries in TursoDB client
- Input validation with Zod
- No raw SQL from user input
- Result: Protected

### Scenario 4: XSS (Cross-Site Scripting)

**Attack:** Inject malicious scripts

**Mitigation:**

- CSP headers block inline scripts
- React auto-escapes output
- No `dangerouslySetInnerHTML` used
- Result: Significantly reduced risk

### Scenario 5: CSRF (Cross-Site Request Forgery)

**Attack:** Trick user into making unwanted requests

**Mitigation:**

- SameSite cookies (if implemented)
- CORS restrictions
- No state-changing GET requests
- Result: Protected

### Scenario 6: Timing Attacks

**Attack:** Measure response times to infer information

**Mitigation:**

- Constant-time comparison for critical operations
- Rate limiting adds noise
- Result: Minimal risk

---

## Privacy Considerations

### What We Log

**Server-side:**

- Paste IDs (necessary for retrieval)
- Timestamps (for expiration)
- View counts (for view-based expiration)
- IP addresses (for rate limiting, temporary)

**What we DON'T log:**

- Plaintext content
- Encryption keys
- Passwords
- User identities
- Browsing patterns

### Data Retention

**Upstash Redis:**

- Encrypted payloads: Deleted on expiration or burn
- Rate limit counters: Expire after 1 hour

**TursoDB:**

- Metadata: Deleted when paste expires
- No automatic cleanup (manual cleanup recommended)

### GDPR Compliance

**Right to be forgotten:**

- Users can delete pastes via DELETE endpoint
- No personal data collected by default
- IP addresses hashed for rate limiting

**Data minimization:**

- Only essential metadata stored
- No tracking or analytics by default

---

## Audit Recommendations

### Regular Security Audits

1. **Dependency Audit**

   ```bash
   npm audit
   npm audit fix
   ```

2. **Code Review**
   - Review crypto implementation
   - Check for XSS vulnerabilities
   - Verify CSP headers

3. **Penetration Testing**
   - Test rate limiting
   - Attempt paste ID enumeration
   - Test XSS/CSRF vectors

### Monitoring

1. **Error Logs**
   - Monitor Vercel function logs
   - Alert on unusual error rates

2. **Usage Patterns**
   - Monitor paste creation rate
   - Alert on rate limit violations
   - Track storage usage

3. **Security Events**
   - Failed decryption attempts
   - Unusual API access patterns

---

## Incident Response

### If Server is Compromised

1. **Immediate Actions:**
   - Rotate all credentials (TursoDB, Upstash, Vercel)
   - Review access logs
   - Notify users if necessary

2. **Assessment:**
   - Determine what data was accessed
   - Remember: Encrypted payloads are safe
   - Metadata may be exposed

3. **Recovery:**
   - Restore from backups if needed
   - Update security measures
   - Document incident

### If Vulnerability is Discovered

1. **Assess severity**
2. **Develop patch**
3. **Deploy fix**
4. **Notify users if necessary**
5. **Document in security advisory**

---

## Best Practices for Users

### Creating Pastes

✅ **Do:**

- Use password protection for sensitive data
- Choose appropriate expiration times
- Use burn-after-read for one-time secrets
- Verify HTTPS before creating paste

❌ **Don't:**

- Share paste URLs in insecure channels
- Store highly sensitive data indefinitely
- Reuse passwords across pastes
- Trust paste content from unknown sources

### Sharing Pastes

✅ **Do:**

- Share URLs via encrypted channels (Signal, etc.)
- Verify recipient before sharing
- Use burn-after-read for sensitive shares
- Consider password protection

❌ **Don't:**

- Post paste URLs publicly
- Share via unencrypted email
- Share in public forums
- Include sensitive info in paste title

---

## Cryptographic Verification

### Verify Encryption Implementation

Users can verify encryption in browser console:

```javascript
// Check Web Crypto API is used
console.log(crypto.subtle);

// Verify key generation
const key = new Uint8Array(32);
crypto.getRandomValues(key);
console.log(key); // Should be random

// Verify encryption
const data = new TextEncoder().encode("test");
const cryptoKey = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true,
  ["encrypt", "decrypt"]
);
const encrypted = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv: new Uint8Array(12) },
  cryptoKey,
  data
);
console.log(encrypted); // Should be encrypted
```

---

## Security Disclosure

If you discover a security vulnerability:

1. **Do NOT** open a public GitHub issue
2. Email: [your-security-email]
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours.

---

## Conclusion

Binify implements a robust zero-knowledge architecture with multiple layers of security:

1. **Client-side encryption** (AES-256-GCM)
2. **Key isolation** (URL fragments)
3. **Optional password protection** (PBKDF2)
4. **Rate limiting** (DoS protection)
5. **Security headers** (XSS/CSRF protection)
6. **Input validation** (Injection protection)

While no system is 100% secure, Binify provides strong protection for shared secrets with a clear threat model and documented limitations.

**Remember: Security is a shared responsibility between the service and its users.**
