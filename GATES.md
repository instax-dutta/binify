# Gates: binify production readiness

OWNS: .github/workflows/**, scripts/verify-*.mjs, src/app/error.ts, src/app/global-error.ts, src/app/loading.tsx, src/components/ClientLayout.tsx, src/components/LuxurySelect.tsx, src/components/PasteEditor.tsx, src/components/PasteViewer.tsx, src/components/PasteCreated.tsx, src/components/PasteLoader.tsx, src/components/ContentCanvas.tsx, src/components/MarkdownPreview.tsx, src/components/CodeBlock.tsx, src/app/**, src/proxy.ts, src/lib/**

Scope: close every outstanding gap in the reliability, accessibility, crawler-control and payload budget of the application, and prove each one by re-measuring the built artifact.

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