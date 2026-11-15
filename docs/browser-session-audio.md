# Browser session and audio policy

Browser community sessions use the host-only `__Host-blockallisto-session`
cookie: Secure, httpOnly, SameSite=Lax and Path=/. JavaScript receives only the
`cookie-session` marker. OAuth fragments do not contain a session bearer.
Explicit non-browser bearer clients keep their existing response contract.

The readable `__Host-blockallisto-csrf` cookie is bound to the session.
Cookie-authenticated writes must echo it in `x-community-csrf`; foreign Origin
or non-same-origin Fetch Metadata is rejected. Browser login writes also reject
foreign origins. Existing CORS origin checks remain in place.

On first restore, a legacy localStorage bearer can be exchanged by `/api/auth/me`
for the cookies without extending the server session lifetime. New sessions are
never saved to localStorage. Logout revokes the server session and clears both
cookies. If logout is unconfirmed, the UI retains the signed-in state and shows
the existing localized request error instead of pretending it succeeded.

## Audio

`COMMUNITY_AUDIO_ORIGINS` is a comma-separated list of exact HTTPS origins, for
example `https://audio.example.com,https://cdn.example.com`. No wildcard, path,
trailing slash, credentials, query or fragment is accepted. The default is empty:
CSP permits only same-origin media and new external podcast publication is
rejected. New podcast URLs must belong to the configured HTTPS origins.

Choosing or adding a real external host is a separate configuration decision.
This patch does not approve a host, change existing episode records or deploy
any configuration. Redirected audio hosts must also be permitted by CSP; do not
add a broad `https:` fallback to work around a denied redirect.

## Validation

Tests exercise real wallet challenge/login and session restore, cookie flags,
CSRF denial and success, duplicate-cookie failure, foreign-origin login denial,
legacy bearer compatibility, logout revocation, OAuth fragment/cookie handling,
and exact audio origin boundaries. Run the full test suite and production-host
integration before release. HTTPS browser validation should verify that the
session cookie is invisible to JavaScript and the page restores after reload.
