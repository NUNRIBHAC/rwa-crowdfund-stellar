# Community file-store read cache

## Scope and contract

`FileCommunityStore` caches the complete validated community document in process memory, including private records, until invalidation, replacement on a later read, or process exit. PostgreSQL storage is unchanged. This does not speed up a deployment that uses PostgreSQL.

Every read checks `dev:ino:size:mtimeMs:ctimeMs`. An equal fingerprint reuses a deeply frozen snapshot and returns a shallow root copy. A changed fingerprint triggers file reading, JSON parsing, validation and iterative freezing. The iterative worklist accepts deeply nested forward-compatible JSON without recursive stack exhaustion. It still uses memory proportional to the document. Nested records returned from reads are immutable at runtime. The existing TypeScript interface does not enforce deep immutability, so callers must not mutate them. Changes belong inside `change()`.

The supported writer is one API process using the existing temp-file, fsync, rename and directory-fsync sequence. `change()` invalidates the cache before reading a fresh mutable document. A completed internal write is visible to the next read. This does not add multi-writer locking.

## Freshness limits

The fingerprint is a metadata heuristic, not a content digest or an absolute freshness guarantee. There is no timer-based TTL. External changes that alter the fingerprint are noticed on a subsequent read, but an edit preserving all fingerprint fields can return old cached data. Filesystem timestamp precision and external writers matter. The stat and file read are separate operations, not one atomic snapshot of metadata and bytes. External in-place writes can also expose partial JSON and fail validation, as before. Do not infer linearizable multi-process reads or a zero-staleness guarantee.

A missing file clears the cache and returns a new frozen empty state. Non-ENOENT filesystem errors and invalid JSON still throw. Validation runs on cache misses, not on every cache hit. A metadata collision can therefore also conceal an external corrupt rewrite. Use a different storage or coordination design when authoritative multi-writer freshness is required.

## Reproducible local benchmark

From the repository root:

```sh
NODE_ENV=test node --import tsx backend/scripts/benchmark-community-file-read.mjs
```

The committed script generates a deterministic synthetic document, uses temporary local files only, warms each path once and reports JSON with bytes, iterations and p50/p95 read latency. It compares a fresh file read plus JSON parse against the actual validated snapshot cache. The baseline deliberately omits validation, so it is a conservative component comparison, not an exact old implementation benchmark. It does not contact a service or use production data. It removes its temporary directory afterward.

Results depend on machine and runtime. This is not an HTTP, CPU, production-capacity or PostgreSQL benchmark. Earlier HTTP/CPU tables supplied with the original PR were not reproducible from committed scripts and have been removed rather than presented as verified evidence. Caller filtering, sorting and serialization still cost time. In particular, `listComments` still materializes all comments before filtering, so endpoint work is not constant in total store size.

## Tests and evidence boundary

Cache tests cover internal-write visibility, external edits, same-length edits, corrupt data, missing files, legacy record normalization, rejected nested mutation and a 10,000-level JSON field. The deep-field regression failed on recursive freeze and passes on iterative freeze. The controlled metadata-collision test documents the freshness limit rather than pretending it is fixed.

No staging or production deployment, real multi-IP load test or PostgreSQL speedup is claimed. Fresh full CI must be checked for the exact revised head. Existing unrelated dependency warnings and audit thresholds are not changed by this optimization.
