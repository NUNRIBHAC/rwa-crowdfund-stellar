# Private application document runtime (preparation only)

This change wires the existing OCI private text provider into the actual community factory. It does not activate a provider, create a bucket, change IAM, migrate inline documents, publish URLs, merge or deploy anything.

## Default and gates

The default `COMMUNITY_APPLICATION_UPLOAD_MODE` is `legacy-inline`, preserving existing inline data and behavior. Client requests carrying an upload operation ID still fail closed with `feature_unavailable` until the private provider is explicitly enabled. No private transport is constructed in the default mode.

`oracle-private` requires BOTH `COMMUNITY_PRIVATE_UPLOAD_ENABLED=1` and `COMMUNITY_PRIVATE_CLEANUP_ENABLED=1`, plus all `COMMUNITY_PRIVATE_OCI_*` values shown in `backend/.env.example`. Missing or invalid values fail startup of the community service before opening its store. Config parsing makes no network request. Configuration changes require a restart, not a live provider switch.

The store identity hashes namespace, region, bucket and prefix. Existing references cannot silently switch to another store. Secrets remain in the server's approved secret/config mechanism, never browser data, logs, commits or public links.

## Finite cleanup

The enabled runtime starts one worker per process, once a minute, with a default maximum of 25 durable jobs per pass. A cursor moves past blocked jobs; overlapping passes in one process are skipped. Existing database claims arbitrate other processes. Each DELETE uses the saved object reference and must pass the service's ownership, hash, size and no-live-reference checks.

Only `cleanup` upload intents and already requested deletion jobs are eligible. `uploading` and `uncertain` PUT outcomes are never promoted because time elapsed or a read returned 404. The worker never repeats PUT, lists a bucket, derives a new object key, or deletes a submitted application's live attachment. Network or commit ambiguity retains the durable same-key job and claim for a later pass. A failed pass emits allowlisted event/count information only.

A private application's age alone does not authorize this worker to remove its live documents. Existing pruning continues to retain applications with private references or unresolved jobs. A separate retention policy and its implementation remain an activation review item; this PR is not a claim that private retention is complete.

## Before any real activation

Get separate approval for the provider, exact storage identity, credentials and total expected cost/limits. Verify the chosen bucket is private and that no public URL/PAR route exposes these documents. Verify the effective credential permissions rather than assuming a prefix in application code narrows the provider credential. A credential with broad account permissions remains a limitation, not a least-privilege credential.

Verify private read/write/delete behavior and recovery using approved synthetic content only. Recheck the legal retention requirement and its operational plan before accepting real personal data. The upload feature here remains synthetic .txt only, 16 KB maximum, five documents, with add/replace/delete frozen after Submit. No policy or environment change is authorized by this preparation.

## Tests

The real `server.ts` app, actual environment factory, signed OCI adapter and file persistence are exercised with an in-memory fake HTTP provider. Tests cover private upload/read, owner/operator isolation, safe metadata, explicit draft deletion and durable cleanup, and no provider call for add/delete after Submit. Existing workflow tests cover commit-ACK loss, uncertain PUT outcomes and cleanup claims. No real OCI account, mail, transaction or money is used.
