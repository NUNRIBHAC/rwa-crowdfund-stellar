# Frontend integration: community platform (handoff)

31 October 2026, branch `feature/community-platform`. Net-new files only;
nothing here modifies shared frontend. Mount points below are suggestions -
the frontend owner does the wiring, styling and i18n.

## New files

- `frontend/src/community/client.ts` - session (localStorage
  `blockallisto.session`), Freighter challenge-sign login, typed API calls.
- `frontend/src/community/LoginControl.tsx` - sign in/out + optional display
  name. Keeps the "not KYC" notice visible.
- `frontend/src/community/Comments.tsx` - campaign comments (list + form).
- `frontend/src/community/NewsList.tsx` - campaign news, platform-demo
  attribution kept visible.
- `frontend/src/community/DocumentsList.tsx` - documents with demo badges.
- `frontend/src/community/SupportForm.tsx` - support/feedback ticket form.

All components take an optional `labels` prop (English defaults inline) so
each string can be wired to the i18n system as new keys - the locale files
stay with the frontend owner.

## Backend (same branch)

`docs/community-api.md` documents every endpoint, the security/privacy
posture, retention and rate limits. No new env vars needed on Render:
community storage falls back to `SOROBAN_JOURNAL_DATABASE_URL`, and refuses
to boot on ephemeral file storage when `SOROBAN_JOURNAL_BACKEND=postgres`
has no database URL (campaign API stays up either way).

## Suggested mount points

- Header or My account: `LoginControl`.
- Campaign page tabs: `Comments`, `NewsList`, `DocumentsList` fill the
  existing empty Comments/News/Documents tabs.
- Financing page: replace the disabled issuer form with a real submit via
  `communityApi.submitApplication` (fields: projectName, country,
  instrumentType, targetAmount, description, optional contactEmail).
- Support page/feedback tab: `SupportForm`.
- Investments list: `communityApi.metadata(id).industryLabel` feeds the
  industry chips and filter.

## Must-verify before merge/deploy

1. Browser test of the real Freighter `signMessage` round-trip against the
   backend verify endpoint (v3 Buffer vs v4 base64 handled in client.ts;
   Ledger-backed Freighter accounts cannot sign arbitrary messages - the
   client surfaces the wallet's error).
2. Neon integration validation of the Postgres store (schema init,
   concurrency, retention) on the staging database.
3. CORS: the backend now allows the `authorization` header; the deployed
   allowlist is unchanged.
4. Styling: components use semantic `community-*` class names, no styles
   shipped; the frontend owner styles them into the Blockallisto UI kit.
