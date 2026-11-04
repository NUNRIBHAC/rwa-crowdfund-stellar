# Purpose-bound deletion proof foundation

Unpublished work. No new hosted route or wallet deletion UI is enabled.
Local social routes/UI are wired but not released.

A wallet proof is distinct from login: its signed text names permanent prototype
profile deletion, account, session-hash prefix, random nonce and five-minute
expiry. It explicitly excludes transactions, funds, the wallet itself and chain
records. The server stores the full challenge, verifies the SEP-53 signature,
binds it to the exact active session and consumes it in the deletion mutation.
A generic login signature, another session, an expired or reused proof fails.
Typed DELETE and a current enabled TOTP code remain independent requirements.

Wallet deletion is fail-closed unless an external retention checker explicitly
returns clear. The current hosted router does not supply such a checker and the
UI still blocks wallet self-service. No live wallet account can use this code.
Local tests inject clear/protected/unavailable results; these are not proof that
live external records were checked.

Before enabling wallet deletion, cover the intent journal (including quarantined
or uncertain signed records), pending contributor proofs, creator/issuer links,
contributor/holder history and chain uncertainty, with a coherent lock/snapshot
boundary against concurrent writes. Existing journal reads and readPending() are
not sufficient: the legacy non-strict readPending returns an empty list on file read errors,
and journal terminal retention means absence is not proof of no chain history.
An adapter must distinguish unavailable history from clear. No financial or
on-chain records may be deleted as a shortcut.

Deletion also fences old wallet login challenges. A new deliberate wallet login
may make a new empty profile with the same public key; no old content or tokens
are restored. Social proof still needs a dedicated provider flow bound to the
original session/identity and a separate final destructive confirmation. A recent
ordinary login or email match alone must not stand in for that proof.

## Social foundation

The local backend can tag a dedicated OAuth flow with deletion purpose bound to
an existing linked provider subject and the exact original session. Provider
callback verification still uses the normal state, nonce, PKCE and browser
binding. The callback issues only a five-minute, hash-stored, one-use deletion
proof. It does not delete data, sign in, link a new provider, or create an account.
A different provider subject, email-only match, expired session, removed binding
or another session cannot use it. A separate final request must still supply
DELETE and enabled TOTP. Ordinary OAuth login never produces deletion proof.

The local authenticated start/list routes and frontend are now wired. The user
first types DELETE before leaving for a linked provider. The callback returns
to the same signed-in tab with proof in a fragment, removed on consumption.
The form resets confirmation and requires a new final DELETE/TOTP; cancellation
forgets the proof. No server-side deletion occurs on return. Identity proof does
not guarantee a newly typed provider password: the UI says this explicitly.
No provider-freshness claim or forced-fresh-auth support is assumed. Live
provider-console/callback proof remains separate from the local fake-provider
tests. Unsupported Farcaster requires its own equivalent purpose ceremony.

The strict pending-record reader and conservative retention evidence evaluator
are local foundations only. They distinguish unreadable, invalid, uncertain or
protected records from clear evidence. No live coherent chain-history/lock
adapter is connected, so wallet deletion remains unavailable.

## Farcaster purpose extension (local, not released)

The installed Farcaster client fixes the signed statement to Farcaster Auth
(or accepts Farcaster Connect), so a custom deletion statement cannot be
assumed. The local extension uses the signed URI
`https://<configured-domain>/account?purpose=account-deletion` instead, with a
server-side deletion purpose tied to the already-linked fid and original
session. A normal `/account` SIWF message cannot satisfy this proof. Existing
domain, nonce, time, local EOA recovery, Farcaster registry verification and
browser-cookie binding remain in force. Verification produces only the shared
five-minute deletion proof, never a session, link, account or deletion. The
separate final DELETE/TOTP operation is still required.

There is no Farcaster deletion start route, relay/UI wiring or deployment yet.
Real relay support for the dedicated signed URI must be checked before claiming
that the full flow is usable. Do not reuse an ordinary sign-in result or alter
the fixed statement in an attempt to make the library accept deletion consent.
Local tests use real signature recovery and client validation with a stubbed
Farcaster registry/RPC, not real-provider end-to-end proof.
