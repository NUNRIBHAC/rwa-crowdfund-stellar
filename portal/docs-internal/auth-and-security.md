# Authentication and security

- No passwords anywhere in the product. Two wallet-based flows (see
  Architecture in depth): connected actor for investing, challenge-response
  session for the account area.
- Community sessions are 30-day bearer tokens; logout revokes server-side.
- TOTP second factor: per-account, with single-use recovery codes. The
  wallet signature alone does not issue a session when 2FA is enabled.
- Operator API: `OPERATOR_WALLETS` allow-list enforced server-side on every
  request; the UI flag is only a display hint.
- The backend never holds user keys; every action is signed in Freighter.
- Repo is private and all-rights-reserved; GitHub Free means no branch
  protection on private repos - review discipline is process-based.
- Bitwarden (self-hosted on the Oracle VM) holds the owner's credentials;
  hosting secrets live in provider dashboards/env vars.
