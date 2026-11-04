# Canonical social-provider validation

A provider's credentials and registered callback are necessary, but are not proof
that a real sign-in works. Keep unverified providers out of the ordinary sign-in
panel with `SOCIAL_VALIDATION_PROVIDERS=google,github,linkedin,telegram`.

This comma-separated, case-insensitive list filters only the public provider list
returned by `/api/auth/abuse-config`. It adds no alternate sign-in endpoint and
never skips Turnstile, provider identity verification, state, nonce, PKCE,
browser binding, restricted registration, linking proof, or two-factor checks.
Unknown names have no effect. Incomplete credentials remain hidden regardless.

Set the validation list before, or atomically with, the credentials. In an
isolated QA browser session, intercept only the abuse-config response to expose
one provider locally for its real canonical sign-in test. Do not intercept any
challenge, provider response, callback, email proof or authentication response.
A rendered button, provider console setting, redirect, or mocked test is not a
successful real sign-in. Keep each provider on the validation list until its
actual callback and account/session result have been checked. Then remove only
that verified provider from the list using the approved deployment workflow.
Keep the registration test allowlist unchanged unless separately approved.

## Owner's ordinary browser

A verified email account whose address is currently in the deployment's social
registration test allowlist can opt in from Account > Security > Start private
test. The protected, no-store `/api/auth/social/validation-providers` read checks
the authenticated account, matching verified credential and current allowlist.
Only provider names are returned, never credentials or a session.

The explicit opt-in is kept in this tab's session storage so it survives the
provider redirect and sign-out needed for a real login test. It changes only the
local provider list. End private test clears it; closing the tab also ends it.
Link the provider to the existing verified email account first, using the
ordinary password step-up. Then sign out and use that provider in the same tab.
This avoids intentionally making a second account for the same owner. New tabs
and other visitors retain the ordinary hidden-provider list. This interface is
not a security boundary for provider URLs: every existing backend authentication
and registration protection still applies, with or without the local UI list.
