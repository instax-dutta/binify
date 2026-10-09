# Gates: binify production readiness

OWNS: .github/workflows/**, scripts/verify-*.mjs, src/app/error.tsx, src/app/global-error.tsx, src/app/loading.tsx, src/components/ClientLayout.tsx, src/components/LuxurySelect.tsx, src/components/PasteEditor.tsx, src/components/PasteViewer.tsx, src/components/PasteCreated.tsx, src/components/PasteLoader.tsx, src/components/ContentCanvas.tsx, src/components/MarkdownPreview.tsx, src/components/CodeBlock.tsx, src/app/**, src/proxy.ts, src/lib/**, docs/**, tsconfig.json, tailwind.config.ts

Scope: close every outstanding gap in the reliability, accessibility, crawler-control and payload budget of the application, and prove each one by re-measuring the built artifact.

Two properties are decided here rather than measured, because a test cannot decide them. Both are recorded so they are not lost:

- **Encryption stays as it is.** Pastes are sealed with a password-derived key (Argon2id, with PBKDF2 kept for reads of older pastes). No server-side recovery is possible by design; a paste whose password is lost is unreadable and unrecoverable. G9 measures the cost of that choice.
- **Backups are Neon's point-in-time recovery, not logical dumps.** G13 requires the runbook to state the procedure and to mark the retention window as a property of the Neon plan, which only the account owner can confirm.

- [ ] G0: this ledger states outcomes that can fail
  CHECK: node /Users/saiduttaabhishekdash/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: pending

- [ ] G1: every existing test passes and the type checker is clean
  CHECK: node scripts/verify-suite.mjs
  EXPECT: SUITE PASS
  EVIDENCE: pending

- [ ] G2: the built app returns hardened security headers, and its production Content-Security-Policy omits unsafe-eval
  CHECK: node scripts/verify-headers.mjs
  EXPECT: HEADERS PASS
  EVIDENCE: pending

- [ ] G3: the production Content-Security-Policy does not block the application's own scripts in a real browser
  CHECK: node scripts/verify-csp-not-blocking.mjs
  EXPECT: CSP-NOT-BLOCKING PASS
  EVIDENCE: pending

- [ ] G4: paste pages are excluded from indexing and the crawler policy covers the whole surface
  CHECK: node scripts/verify-crawler.mjs
  EXPECT: CRAWLER PASS
  EVIDENCE: pending

- [ ] G5: an unhandled render error is caught by a route error boundary instead of escaping to a blank frame
  CHECK: node scripts/verify-error-boundary.mjs
  EXPECT: ERROR-BOUNDARY PASS
  EVIDENCE: pending

- [ ] G6: the primary user journeys work in Chromium, Firefox and WebKit
  CHECK: node scripts/verify-browsers.mjs
  EXPECT: BROWSERS PASS
  EVIDENCE: pending

- [ ] G7: the audited pages carry no serious or critical accessibility violations, and the custom select is operable by keyboard alone
  CHECK: node scripts/verify-a11y.mjs
  EXPECT: A11Y PASS
  EVIDENCE: pending

- [ ] G8: continuous integration runs the whole suite on every pull request
  CHECK: node scripts/verify-ci.mjs
  EXPECT: CI PASS
  EVIDENCE: pending

- [ ] G9: the homepage payload stays within its declared budget
  CHECK: node scripts/verify-budget.mjs
  EXPECT: BUDGET PASS
  EVIDENCE: pending

- [ ] G10: every static asset referenced by metadata and the manifest exists and is within budget
  CHECK: node scripts/verify-assets.mjs
  EXPECT: ASSETS PASS
  EVIDENCE: pending

- [ ] G11: paste pages announce a useful loading and error state rather than an empty frame
  CHECK: node scripts/verify-pending-ui.mjs
  EXPECT: PENDING-UI PASS
  EVIDENCE: pending

- [ ] G12: a production failure can be diagnosed from outside, and no response identifies the infrastructure
  CHECK: node scripts/verify-observability.mjs
  EXPECT: OBSERVABILITY PASS
  EVIDENCE: pending

- [ ] G13: the runbook states every environment variable, the recovery procedure and the role split, and carries no credential
  CHECK: node scripts/verify-docs.mjs
  EXPECT: DOCS PASS
  EVIDENCE: pending

## Owner actions

These cannot be verified from the repository, so they are listed rather than
claimed as done. Each is a single step in a console, not a code change.

1. **Rotate the Neon owner password.** It was shared in a chat transcript. The
   running app is unaffected because it authenticates as `binify_app`, not the
   owner. Confirm the app still works after the rotation.
2. **Set the production environment in Vercel**: `DATABASE_URL` (pooled
   `binify_app` URI), `TOKEN_PEPPER`, `INIT_SECRET`, `CRON_SECRET`, and
   `MAX_PASTE_SIZE` if the default 4 MB is not wanted.
3. **Confirm the Neon plan's PITR retention and backup window** and correct the
   table in `docs/neon-migration.md` if it differs. The app cannot observe this.