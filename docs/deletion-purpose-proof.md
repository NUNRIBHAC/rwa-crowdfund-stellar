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
