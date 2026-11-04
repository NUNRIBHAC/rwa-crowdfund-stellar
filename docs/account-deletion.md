# Prototype account deletion

The first implementation supports verified email accounts only. It is not an
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
review/support request. Wallet/social identities remain unsupported until
purpose-bound fresh proof and external-record checks are implemented. A current
login signature or recent social session alone is not destructive consent.

After success the tab clears its session and private-test provider names. A
subsequent registration is a new account, not recovery of the deleted profile.
