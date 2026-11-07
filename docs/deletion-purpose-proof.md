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

## Wallet lifetime snapshot builder (local, not wired)

`deletion-history-snapshot.ts` collects the checker inputs from the platform's
own sources, and `deployment-manifest.ts` grounds each contract's creation in
chain evidence. Both remain local foundations: no hosted route injects the
composed verdict, and wallet deletion stays unavailable on the hosted service.

The creation manifest records campaign, contract, creation ledger, deployment
hash and network only from a SUCCESSFUL deployment transaction fetched by exact
hash; conflicting or corrupt rows throw, and a missing record falls back to the
conservative bound ledger 1, which only ever widens the span coverage must
prove. It never compensates for contracts the registry does not know: any
campaign reference found in the journal, pending queue, contributor registry
or archive that the registry cannot explain marks the manifest incomplete.

The snapshot pins one target ledger: the highest ledger every contract's
archive checkpoint has fully processed, capped by the chain tip. Only
current-version, gap-free checkpoints count. Participant keys are derived from
every topic position and the event value, XDR-decoded and raw-scanned, so all
roles are covered, not only contributors; events archived beyond the shared
target are still checked (over-inclusion only ever turns clear into
protected), and any field that cannot be fully decoded or scanned is an
unreadable event, never an empty one.

Coherence requires the caller to refresh the archive toward the chain tip
immediately before the snapshot; a failed refresh is unavailable. The composed
verdict (`walletDeletionEvidenceVerdict`) feeds the history result into the
retention evaluator together with the journal (quarantine fails closed),
hash-only pending proofs (unavailable) and deploy-intent creator keys
(protected). Wiring this into the hosted deletion route still requires the
final mutation to re-check under its own serialized lock, plus its own full
gate and explicit authorization. No financial or on-chain record is deleted.

## Deployment auto-recording and v2 archive targets (local, not wired)

Deployments now record each successfully deployed campaign contract into the
creation manifest at submit time, in both the v1 and v2 paths. The record is
written only after the Wasm-pin checks pass and the deployment transaction
returns SUCCESS, and it is keyed by the exact transaction hash fetched back
from the network; a recording failure never fails an otherwise successful
deployment, it only leaves the manifest without that record, which the
snapshot builder conservatively treats as creation at ledger 1 (widening,
never narrowing, the span coverage must prove). The manifest store can be
selected by deploymentManifestBackend (file or Postgres), and the Postgres
store is fail-closed: a corrupt or conflicting row throws rather than
silently degrading to a file fallback.

The archive now also loops the v2 campaign targets (`<id>:token` and
`<id>:offering` from sorobanArchiveTargets) alongside the v1 registry, while
the backfill pass remains v1-only. v2 targets are derived from the same
recordContractCreation hook, so only contracts that were actually deployed
through this server are archived; an undeployed or externally created v2
campaign simply has no target. Archive cadence, gap honesty and the
prospective-start caveat are unchanged: the archive still starts from its
first run, retains honest gaps, and parses participants best-effort.

Neither addition changes the deletion verdict: no hosted route injects the
composed wallet verdict, wallet deletion stays unavailable on the hosted
service, and no financial or on-chain record is deleted. Wiring remains held
for explicit authorization and its own full gate.
