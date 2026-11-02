# Monitoring and alerts

State as of 2026-11-02; verify before relying.

- Uptime Kuma on the Oracle VM checks Weblate every minute. It runs on the
  same machine, so it cannot report a whole-VM outage.
- Kuma currently has **no notification channels configured** - do not
  assume failure alerts fire.
- Backup and monitoring failures are **log-only** today: no actual failure
  has ever produced an external alert, so external alerting is NOT proven.
  A mailbox delivery test for Oracle account-level emails was received
  2026-11-01, but that is not evidence of the failure chain, and a
  whole-VM outage is silent today. Closing this gap is owned by the
  tooling work.
- Render free-tier services sleep when idle; expect ~30s cold starts, which
  naive uptime checks can misread as downtime.
- Not covered yet: the docs portals, the demo/staging apps on a
  notification-enabled channel, and the archive sync gap detection (planned
  with the durable archive work).
