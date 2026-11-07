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

Local dedicated authenticated nonce/verify routes and relay/UI wiring now exist,
but are not deployed. The public sign-in verifier cannot consume deletion
nonces; the dedicated verifier requires the original bearer session and cannot
consume login nonces. Both dedicated routes are rate-limited. Cancel invalidates
the local run; late relay results cannot reopen the form. Return clears typed
confirmation and requires a separate final DELETE/TOTP.
Real relay/wallet-app support for the dedicated signed URI must be proved before
claiming that the full flow is usable. Do not reuse an ordinary sign-in result or alter
the fixed statement in an attempt to make the library accept deletion consent.
Local tests use real signature recovery and client validation with a stubbed
Farcaster registry/RPC, not real-provider end-to-end proof.

Public protocol grounding checked 2026-11-04:

- https://docs.farcaster.xyz/auth-kit/client/app/create-channel documents a
  caller-supplied `siweUri` and nonce.
- https://docs.farcaster.xyz/auth-kit/client/wallet/build-sign-in-message
  documents carrying the supplied URI into the signed message.
  This supports the dedicated-URI design, not acceptance by a real wallet app
  or a successful deletion ceremony. The local dependency also enforces its
  fixed statement. A real provider proof is still required.

Installed 0.7.1 differs from the current parser docs: parseSignInURI returns
only channelToken, not URI/domain/nonce. The local buildSignInMessage test
therefore supplies the URI explicitly. No wallet-app round trip is inferred
from the current documentation or a channel-token-only parser result.

## Wallet lifetime coverage policy (local, not wired)

`deletion-history.ts` validates a runtime evidence snapshot before it can return
clear. It requires a complete campaign manifest, one explicit network and
ledger, no duplicate campaign/contract, each contract's independently grounded
creation ledger, complete all-event/all-participant-role coverage from creation
through exactly that ledger, no gaps or unreadable events, and valid participant
keys. Historic participation is protected even if balances are now zero. Missing
or malformed evidence is unavailable, including a forged TypeScript cast.

This is a policy checker, not a live source of those assurances. The current
archive starts prospectively, retains honest gaps, and its parsedContributor is
only a best-effort field. A contributor-only checkpoint, current zero balance,
empty pruned journal or parse-success on some events cannot fill these inputs.
The checker is not called by hosted deletion and enables no wallet route.
Actual collection still needs trustworthy contract-creation/manifest coverage,
all-role event parsing, and one coherent lock/snapshot boundary across journal,
pending proofs, registry, archive and community changes. No permission to erase
financial/on-chain records is implied.
