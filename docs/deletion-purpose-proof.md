# Purpose-bound deletion proof foundation

Unpublished backend work. No new hosted route or wallet deletion UI is enabled.

A wallet proof is distinct from login: its signed text names permanent prototype
profile deletion, account, session-hash prefix, random nonce and five-minute
expiry. It explicitly excludes transactions, funds, the wallet itself and chain
records. The server stores the full challenge, verifies the SEP-53 signature,
binds it to the exact active session and consumes it in the deletion mutation.
A generic login signature, another session, an expired or reused proof fails.
Typed DELETE and a current enabled TOTP code remain independent requirements.

Wallet deletion is fail-closed unless an external retention checker explicitly
returns clear. The current hosted router does not supply such a checker and the
UI still states email-only support. No live wallet account can use this code.
Local tests inject clear/protected/unavailable results; these are not proof that
live external records were checked.

Before enabling wallet deletion, cover the intent journal (including quarantined
or uncertain signed records), pending contributor proofs, creator/issuer links,
contributor/holder history and chain uncertainty, with a coherent lock/snapshot
boundary against concurrent writes. Existing journal reads and readPending() are
not sufficient: readPending currently returns an empty list on file read errors,
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

No deletion-purpose flow start route or frontend is wired yet. Do not publish or
claim social-account support from this foundation alone. Complete normal UI
collection, explicit review before leaving for the provider, correct fragment
handling back in the SAME signed-in tab, new final confirmation and cancellation
before enabling this route. Unsupported Farcaster requires its own equivalent
purpose-bound ceremony, not a fake OAuth start. Provider login freshness must be
requested/checked where the provider actually supports it, with honest wording
where the callback establishes identity but not a newly typed password.
