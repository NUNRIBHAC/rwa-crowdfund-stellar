# Monitoring and alerts

State as of 2026-11-02; verify before relying.

- Uptime Kuma on the Oracle VM checks Weblate every minute. It runs on the
  same machine, so it cannot report a whole-VM outage.
- Kuma currently has **no notification channels configured** - do not
  assume failure alerts fire.
- Oracle account-level monitoring/backup alert emails go to the owner's
  mailbox. A DELIVERY TEST was received 2026-11-01; the full failure chain
  (an actual backup failure producing an alert) is untested, and a
  whole-VM outage is silent today.
- Render free-tier services sleep when idle; expect ~30s cold starts, which
  naive uptime checks can misread as downtime.
- Not covered yet: the docs portals, the demo/staging apps on a
  notification-enabled channel, and the archive sync gap detection (planned
  with the durable archive work).
