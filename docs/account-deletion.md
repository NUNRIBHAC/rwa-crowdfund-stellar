# Prototype account deletion

The released implementation supports verified email accounts. Local unpublished
work adds a dedicated linked-social identity ceremony. Wallet accounts remain
unavailable without a coherent external-retention adapter. It is not an
all-data erasure or legal compliance guarantee. No owner account is deleted as
part of release verification; tests use disposable local fixtures.

The owner must open the explicit confirmation form, type DELETE, provide the
current password and, when enabled, a new current authenticator code. Both
password and authenticator failures persist rate limits. The server derives the
owner exclusively from the current bearer session. A submitted public key is
ignored. Proof checks and removal run in one serialized store mutation.

Removal covers the prototype profile (including TOTP enrollment), email
credential and reset/verification tokens, linked social identities, all sessions,
login challenges, TOTP tickets, pending link flows, matching social email-proof
flows, comments, support messages and notifications. Other accounts and the
operator audit are preserved. No email, wallet, or provider account is deleted.
Backups, provider records, separate journals, transactions and blockchain data
are not erased.

Contributor, issuer, company, assessment, investment-document, operator audit or
simulation-meeting references block the operation conservatively. Operator
allowlist members are blocked too. A block deletes nothing and creates no
review/support request. A current login signature or recent social session
alone is not destructive consent. Local social deletion starts only after
DELETE, verifies an already-linked provider subject, returns a five-minute
session-bound proof without signing in or deleting, and requires a new final
DELETE plus enabled TOTP. Provider identity is verified; newly typed provider
credentials are not promised. Hosted Farcaster-only accounts stay blocked. A local unpublished extension
adds a distinct signed deletion URI, original-session verification and relay
cancellation; genuine wallet-app proof and release checks remain outstanding.
The dedicated authenticated start is rate-limited and does not send email; it
does not alter public registration, challenge or mail abuse gates.

After success the tab clears its session and private-test provider names. A
subsequent registration is a new account, not recovery of the deleted profile.
