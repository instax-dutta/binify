# Gates: binify production readiness

OWNS: scripts/neon-compute.ts, src/app/api/cron/**, .github/workflows/**, scripts/verify-*.mjs, src/app/error.tsx, src/app/global-error.tsx, src/app/loading.tsx, src/components/ClientLayout.tsx, src/components/LuxurySelect.tsx, src/components/PasteEditor.tsx, src/components/PasteViewer.tsx, src/components/PasteCreated.tsx, src/components/PasteLoader.tsx, src/components/ContentCanvas.tsx, src/components/MarkdownPreview.tsx, src/components/CodeBlock.tsx, src/app/**, src/proxy.ts, src/lib/**, docs/**, tsconfig.json, tailwind.config.ts

Scope: close every outstanding gap in the reliability, accessibility, crawler-control and payload budget of the application, and prove each one by re-measuring the built artifact.

Two properties are decided here rather than measured, because a test cannot decide them. Both are recorded so they are not lost:

- **Encryption stays as it is.** Pastes are sealed with a password-derived key (Argon2id, with PBKDF2 kept for reads of older pastes). No server-side recovery is possible by design; a paste whose password is lost is unreadable and unrecoverable. G9 measures the cost of that choice.
- **Availability is a compute setting, not a ping.** Scale to zero suspends the
  compute after five idle minutes and resumes it in a few hundred milliseconds;
  that is not an outage. The failure that can actually keep the project down is a
  consumption quota, which pinging makes worse. `suspend_timeout_seconds` decides
  the first, and G14 requires both the setting and the ping route to exist and to
  say plainly which is which.
- **Backups are Neon's point-in-time recovery, not logical dumps.** G13 requires the runbook to state the procedure and to mark the retention window as a property of the Neon plan, which only the account owner can confirm.

- [x] G0: this ledger states outcomes that can fail
  CHECK: node /Users/saiduttaabhishekdash/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ac2362a5e404f55f3e0757bb13c502652d0244eaefefbc244421b340eed8ed2a; exit=0; EXPECT=matched; output-sha256=48630b7361dd44ee870917b12c3d19b9d7bdea738aaca16bb04d4cab83b772d2; output-bytes=8; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G1: every existing test passes and the type checker is clean
  CHECK: node scripts/verify-suite.mjs
  EXPECT: SUITE PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=b1c701de5de4df7a193d050cef5b58d0196781244c0d6a0ae971a18bd0568f4e; exit=0; EXPECT=matched; output-sha256=16cb24f062453caa2a3e41865613624d13801126b68bd6224fcec30e2f7607f6; output-bytes=94; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G2: the built app returns hardened security headers, and its production Content-Security-Policy omits unsafe-eval
  CHECK: node scripts/verify-headers.mjs
  EXPECT: HEADERS PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=1b6b248d4a0e999ce878a2677d170803209502d53b79455d5c3fbf4fef8f9c93; exit=0; EXPECT=matched; output-sha256=58e75a76258ca2520f03e32ecb4a8bd67e604b8482634f2464543a83aaea54e5; output-bytes=13; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G3: the production Content-Security-Policy does not block the application's own scripts in a real browser
  CHECK: node scripts/verify-csp-not-blocking.mjs
  EXPECT: CSP-NOT-BLOCKING PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=19d225940bd948f1228d4508cf2df5b0a9ebe17a25907a4d401a1f5b15fcd526; exit=0; EXPECT=matched; output-sha256=92b056463e9bc01005ae85ed3206ed83d2b2c79a112b514d4686ba896bed309c; output-bytes=22; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G4: paste pages are excluded from indexing and the crawler policy covers the whole surface
  CHECK: node scripts/verify-crawler.mjs
  EXPECT: CRAWLER PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=51d79d291a4065814385572be31f0a18235ebf85961cb7a4d613d292681faef2; exit=0; EXPECT=matched; output-sha256=382d7fe7ea7fbd8e8fc253b261931b93cff0996d7f3ee4a543df9a1e604d9076; output-bytes=13; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G5: an unhandled render error is caught by a route error boundary instead of escaping to a blank frame
  CHECK: node scripts/verify-error-boundary.mjs
  EXPECT: ERROR-BOUNDARY PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=0e026a75f0e87d822946e1c095950220538b9e20842261e9479f555a8f4029c0; exit=0; EXPECT=matched; output-sha256=aa971eb7c42f018bbf97e46639076c230ad92dccb48a98fc562682854e577d88; output-bytes=20; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G6: the primary user journeys work in Chromium, Firefox and WebKit
  CHECK: node scripts/verify-browsers.mjs
  EXPECT: BROWSERS PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=65995802ec8ee33663e0d6e030e33a4e889a9da1caa566311717c841fdff292c; exit=0; EXPECT=matched; output-sha256=d18fed6d731766f6a3554dde3dffab2dcf634728d987eaa6549d0f3cda589c5b; output-bytes=57; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G7: the audited pages carry no serious or critical accessibility violations, and the custom select is operable by keyboard alone
  CHECK: node scripts/verify-a11y.mjs
  EXPECT: A11Y PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=80a09089a1d9ef9430b3c149d79c54ebcf44a52ccbcf57572ce5afa7aef5976b; exit=0; EXPECT=matched; output-sha256=44183949ba015da87485bc57f26e827127bbc5a4f75ea2094ed50615c9147dd9; output-bytes=65; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G8: continuous integration runs the whole suite on every pull request
  CHECK: node scripts/verify-ci.mjs
  EXPECT: CI PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=0f0bd0acfb96aa1dc5f605f1c4948b859c6b76434475127574c216fe29af1119; exit=0; EXPECT=matched; output-sha256=925aa73a803f90a02437102a6c87e1e43c12734da472d2c44bd39d48dd2488f6; output-bytes=8; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G9: the homepage payload stays within its declared budget
  CHECK: node scripts/verify-budget.mjs
  EXPECT: BUDGET PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=8e4385a8bd3405b0ae5de717a68fbe7831ecb8e1a8ca66b5eb10a5d9ce398d48; exit=0; EXPECT=matched; output-sha256=101d5119ab153ac3c704675741f9d058fba322a57d3ea5c1ba5fc5f2b68ccf26; output-bytes=843; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G10: every static asset referenced by metadata and the manifest exists and is within budget
  CHECK: node scripts/verify-assets.mjs
  EXPECT: ASSETS PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=90fec1880040f725c10ccdce4e00851811b4936b5a02a19435e896446a8513d9; exit=0; EXPECT=matched; output-sha256=296038b24ade74272f0c5fe2276f65d864576dcf5e1edd276264f6c6be75905e; output-bytes=61; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G11: paste pages announce a useful loading and error state rather than an empty frame
  CHECK: node scripts/verify-pending-ui.mjs
  EXPECT: PENDING-UI PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=9526ed563f2e6f074b83c97ddd0a6836f69252d9ee0800152c235ee50a044b4b; exit=0; EXPECT=matched; output-sha256=c68b9b47ea419052c7b27da12c08866fb9d4b4bad923009af7e203f2952e2927; output-bytes=16; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G12: a production failure can be diagnosed from outside, and no response identifies the infrastructure
  CHECK: node scripts/verify-observability.mjs
  EXPECT: OBSERVABILITY PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=44482c3ac797d7a7a42976fa670194bd7217e8f35a476051d2bc669a32062ec3; exit=0; EXPECT=matched; output-sha256=53662ccb91d75bb00291f28dce9c36252f08c485174ff1914ef8733037ad2469; output-bytes=19; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G13: the runbook states every environment variable, the recovery procedure and the role split, and carries no credential
  CHECK: node scripts/verify-docs.mjs
  EXPECT: DOCS PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=3d7b15615cfa39b562e94b2bde81f9112a6323c7f272cfa3ef81ada831f56bc2; exit=0; EXPECT=matched; output-sha256=212bcb96c1c1416c95d2d17898c3c436fbfcb2e501da9081fe6d971fc785f555; output-bytes=10; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

- [x] G14: the database stays available, and the mechanism is chosen for the failure mode rather than applied on reflex
  CHECK: node scripts/verify-keepalive.mjs
  EXPECT: KEEPALIVE PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=c59a7f0701fd339995904f0d55e116375921dbc87154a23a18c2ce55c341f6fa; exit=0; EXPECT=matched; output-sha256=16a1d6b973319ee4112ddb72d5f074d000edd7a219b7e99ab36c98bc251b646d; output-bytes=15; shell=/bin/sh; cwd=/home/tejes/binify-test/binify; path=7cc916ea10f3/10 entries

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