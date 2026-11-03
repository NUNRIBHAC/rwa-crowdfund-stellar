# Isolated operator browser exercise

Run from the repository root after `npm ci` and installation of a Playwright Chromium browser:

```sh
node --import tsx backend/e2e/operator-browser.ts
```

For a locally installed Chrome, set `PLAYWRIGHT_EXECUTABLE_PATH`. Optional
`OPERATOR_SCREENSHOT_DIR` writes two screenshots for manual visual inspection.

The harness serves the actual operator component and its auth provider through
Vite, on the same random loopback HTTP port as the actual Express community
router. No browser response interception is used. Temporary generated identities
sign challenge messages locally. They never sign transactions or use owner keys.

Covered: HTTP challenge/verify login, application under review and approval,
reload persistence, comment hide with reason and unhide, ticket closure,
news/report/podcast publication, moderation/status/ticket owner notifications,
audit display, independent file-store reopening, and non-operator HTTP 403.
The real service and temporary file store handle all mutations. The harness
removes its temporary store and restores its operator allowlist on exit.

Funding and entitlement are explicitly synthetic providers. The example audio
URL is invalid and never fetched. No mail transport, transaction submitter,
hosted database or hosted endpoint is wired. Local report publication is not
proof that live-chain gates passed. This is an operator-component integration
exercise, not a full production-app/Freighter or financial/legal certification.

The regular unit/state suites remain responsible for failure, empty and loading
variants. This additional manual gate covers the real browser-to-service path.
