# Backups

State as of 2026-11-02; verify schedules on the VM before relying.

- Nightly at 03:00 from the Oracle VM. Encrypted before upload to Oracle
  object storage (Frankfurt).
- Scope: Weblate (database, files, config), Uptime Kuma data, server
  config, both Neon databases (demo + staging), and the durable chain-event
  archive (archive and checkpoint TABLE definitions, DATA, indexes and
  constraints are all in the dump catalog).
- Restores tested 2026-10-31: Weblate in an isolated install; Neon row
  counts matched. That test covers only what existed then - it is NOT
  evidence for any table or archive added later.
- Known gap: no off-Oracle copy (cross-region Oracle copy is not free) - a
  regional failure would lose the backup destination too. Owner decision
  pending on a second destination.
- Chain-event archive (145 events as of 2026-11-02): independent VM
  snapshots every 30 minutes, dated, with 14-day retention. Verified
  2026-11-02: a fetched snapshot was restored in isolation and all 145/145
  archived events matched by hash.
- NOT yet done: a full restore of the nightly dump into a NEW database.
  Until that test runs, the dump is catalog-complete but not restore-proven.
