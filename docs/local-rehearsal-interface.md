# Isolated rehearsal interface

This is an English development harness, not a hosted feature or a legal-rights implementation. It connects the optional authenticated distribution and meeting rehearsal routers to an interactive interface without changing `server.ts`, `App`, Account, operator roles or deployment settings.

## Run locally

Use Node 24 and install the repository dependencies, then run from the repository root:

```sh
LOCAL_REHEARSAL=test_only node --import tsx backend/scripts/local-rehearsal.ts
```

Open the loopback URL printed by the process. It binds only to `127.0.0.1` on an ephemeral port. It rejects non-loopback Host headers and cross-origin requests. The frontend client refuses a non-loopback origin. Stop the process to delete its temporary store. No hosted data, SMTP, provider, live payment adapter or transaction client is wired in.

The account selector switches between two randomly generated temporary fixture accounts. They are not user accounts or wallet integrations. Session credentials remain internal to the local harness and must not be copied to another site. The fixtures are deliberately available to anyone with access to this local process. Do not expose it through a tunnel, proxy or public port.

## Distribution exercise

1. Enter a total in fictional units and an idempotency key. Prepare the fixed 3:1 synthetic register allocation.
2. Same-account review is rejected. Copy the displayed distribution ID, switch to the other fixture account, enter the ID and read it.
3. Review and run the mock distribution. Check the snapshot hash, exact 7.5/2.5 allocation for a total of 10, mock receipt references and audit trail.
4. Re-running is disabled after simulation. Unknown or dispatching outcomes do not permit automatic retries. Inspect the local ledger before recovery.
5. Draft or approved instructions can be cancelled by their participants with a reason of at least ten characters.

Idempotency keys must not be reused for different inputs. Every request rechecks authentication and current local allowlists. Actor identities are taken from authenticated sessions, never from user-supplied request bodies.

## Meeting exercise

1. Enter a title, resolution and idempotency key. Participants are fixed to the two local fixture accounts.
2. The creator opens the meeting. Participants can record exactly one immutable choice. Repeating the same choice is idempotent; changing it is rejected.
3. The organizer closes the meeting. Participant totals are withheld until close. An account sees only its own choice, not another participant's ballot. The organizer can see interim aggregate counts and its audit, not a ballot list through the router.
4. Draft meetings may be cancelled. Closed or cancelled meetings cannot reopen.

There is no share weighting, legal quorum, entitlement certification, invitation, notification or binding vote.

## Evidence limits

Component tests cover response-mode guards, origin restrictions, stale replies, context resets, duplicate-click protection, errors, unknown outcomes and participant privacy controls. A local browser exercise covers prepare, rejected self-review, distinct review, mock receipts, meeting open/choice/close and participant readback at 390/1280 pixels. These are local fixtures only. Hosted registration, actual user sessions, hosted register PDFs and operator panel acceptance remain separate work.

Production builds do not include the local HTML entry. Do not add this harness to production build inputs or mount its fixture-session endpoint in `server.ts`.
