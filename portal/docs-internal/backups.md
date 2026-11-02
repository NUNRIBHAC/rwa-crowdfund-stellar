# Backups

State as of 2026-11-01; verify schedules on the VM before relying.

- Nightly at 03:00 from the Oracle VM. Encrypted before upload to Oracle
  object storage (Frankfurt).
- Scope: Weblate (database, files, config), Uptime Kuma data, server
  config, and both Neon databases (demo + staging).
- Restores tested 2026-10-31: Weblate in an isolated install; Neon row
  counts matched. That test covers only what existed then - it is NOT
  evidence for any table or archive added later.
- Known gap: no off-Oracle copy (cross-region Oracle copy is not free) - a
  regional failure would lose the backup destination too. Owner decision
  pending on a second destination.
- Planned addition: the durable chain-event archive (see
  `backend-operations.md`) gets the same independent-backup and
  restore-verification treatment. As of 2026-11-02 the archive is being
  implemented; its tables are not yet covered by any verified backup or
  restore test.
