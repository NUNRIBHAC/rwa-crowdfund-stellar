# Translation integration gate

## Failure reconstructed on 25 November 2026

PR 281 merged at 24 November 20:07:15 UTC. Weblate's MergeFailure was first recorded at 20:07:25. The common Git ancestor was 73c5c895. Main contained the feature's 29 testnet-setup strings in every UI language, while the translation branch contained a separate export of the same strings. The feature carried their values but not their translation-branch ancestry. Git's text merge conflicted in all 11 UI JSON files. Semantic equality of the new strings did not prove Git mergeability.

Weblate also held eight pending automatic-refund strings per language and seven different status strings in EN, HI, JA and KO. These could not be discarded merely because the current main schema did not yet consume them. Four catalogs lacked 83 empty arrays each after serialization. The reviewed reconciliation restored these 332 arrays while preserving all existing Weblate string values.

No evidence establishes that the user's request for faster progress caused the failure.

## Required release checks

1. Record the exact main, feature and translation heads, worktree state and pending-unit count. Export all unit records and all 11 complete catalogs before a reconciliation.
2. Preserve the translation history with a normal ancestry join. A feature containing translation values is not by itself a history join. If a change intentionally carries only a namespace, prove a clean merge of the current exact translation head with the proposed main result before merging the PR.
3. Compare all catalog leaves, not only new text. Retain empty arrays, unrelated pending namespaces and status strings. Test all 11 catalogs. A current-main schema rejecting a pending namespace is a schema-boundary finding, not permission to delete that namespace.
4. Use the approved author and committer identity for every new commit. Restore the prior Weblate setting in a finally block and verify restoration afterward.
5. After a main merge, run the normal Weblate update and inspect current state: no MergeFailure, expected branch ancestry, expected catalog values, unchanged pre-existing unit states, clean worktree and pending count. A site can be healthy while translation synchronization is broken.
6. Do not call synchronization complete until these post-merge checks pass. Do not use reset, force-push or history rewriting as a shortcut.

## Current repair evidence

Normal merge 4e3d0d12 has parents 9ff4cea4 and f1b70e71. It was applied to the translation branch on 25 November with the user's specific approval. All 29,128 serialized unit records were compared exactly before and after; all 11 catalogs matched the reviewed preserving result; MergeFailure was absent; the component was unlocked; prior identity was restored. The repair did not merge main or publish a site.

This document is a proposed process guard. It is not an implemented CI check and does not grant release authority.
