# Oracle VM hosting: current architecture and standard operations

State verified on 2026-11-06. Time-bounded facts are marked; re-verify before
relying on them later. This document fills the reference in
`docker-compose.oracle.yml` and covers the same ground as
`docs/oracle-test-runner.md` from the hosting side.

## Architecture map

### Validation and deploy cycle (local on the Oracle VM)

- GitHub Actions is the first-choice runner by policy, but is currently
  blocked: jobs do not start ("recent account payments have failed or your
  spending limit needs to be increased" - observed on run #777, 2026-11-06).
  There is no automatic Actions-to-Oracle deployment and there has never been
  one: the workflows (`ci.yml`, `visual.yml`) run tests and visual checks only.
- All validation therefore runs on the existing Oracle Always Free VM:
  - Tests (including dependency-update gates) run in disposable Docker
    containers from an exact reviewed commit. They are configured for mocks,
    fake pools and local disposable databases only; zero external Prisma
    Postgres free-plan quota consumption by test traffic is the
    architectural goal, enforced by the
    fail-closed test-storage guard (any test process refuses a non-localhost
    Postgres URL) and by never injecting hosted database credentials into test
    environments. It is a design property, not a measured universal zero.
  - Deploys are manual/programmatic on the VM: build the image locally from a
    pinned commit and recreate the staging/demo containers. No self-hosted
    Actions runner, webhook deploy listener, watchtower or cron pull exists.

### Network and routing

- User traffic: public DNS via sslip.io (the public IP is embedded in the
  hostname) -> https-portal container.
- TLS terminates at https-portal (Nginx inside, Let's Encrypt certificates
  issued and renewed automatically). Certificates persist in the named Docker
  volume `weblate_ssl-certs`; they survive container recreation and
  image/container pruning (volume pruning is never run).
- Routing from https-portal to the staging and demo app containers is internal
  on the Docker network; app ports are not published publicly.
- Cloudflare Turnstile operates independently at the application layer for
  form anti-abuse validation: the widget runs in the client AND the token is
  verified server-side by the app backend (community-routes Turnstile
  verify). No Cloudflare proxy sits in front of the VM; network traffic
  goes directly to the VM (sslip.io is DNS only).
- Local port surface: rpcbind is DISABLED (unit and socket `disabled`,
  not `masked` - verified 2026-11-06) and nothing listens on port 111 on
  any interface.

### Data layer

- The staging app connects exclusively to the staging Prisma Postgres
  database; the demo app exclusively to the demo database. These are
  OUTBOUND connections over the internet to Prisma's hosted service with
  verified TLS (DATABASE_URL sslmode=require; pg-connection-string 2.14.1
  maps that to full certificate verification) - "exclusively" names the
  database pairing, not an internal network path. The two databases
  are logically separate but share and compete for the limits of one Prisma
  free plan (measured engine: PostgreSQL 17.2).
- The apps use the raw `pg` driver (no Prisma Client / ORM). Pool caps are set
  per store via env (`COMMUNITY_POOL_MAX=2`, `SOROBAN_JOURNAL_POOL_MAX=2`
  direct, `EVENT_ARCHIVE_POOL_MAX=1` pooled per app); pools open lazily and a
  2026-11-06 snapshot showed 1-2 idle connections per app.
- The Weblate platform's own database (weblate-database-1,
  postgres:18-alpine) is fully local: named volume weblate_postgres-data on
  the VM disk, no dependency on the shared external Prisma Postgres quota;
  it is dumped nightly by the backup script below.
- The Bitwarden Lite vault database moved off the VM on 2026-11-07: the
  container runs with BW_DB_PROVIDER=postgresql against a dedicated Prisma
  Postgres database (separate Prisma project, eu-central-1), so vault
  contents (users, ciphers, folders) live off the VM on the same free plan
  the app databases share. The VM still holds the operational files the
  container cannot regenerate (data-protection keys, identity.pfx, nginx
  config, logs) plus a retained pre-migration SQLite copy kept for
  rollback only. Note: Lite stores vault ATTACHMENT payloads as files
  under bwdata/attachments even with a Postgres backend - none exist
  today, but future attachments are VM-resident file content by design.
- Object storage and media tiers (per the 2026-11-06 storage plan):
  - Private and backup tier (OCI Object Storage): nightly encrypted
    backups only - implemented and running. The plan's second use,
    persistent private system PDFs served via pre-authenticated requests,
    is NOT implemented: the only system PDF today (the admin share
    register) is generated in memory and streamed on demand, never
    stored. If persistent private PDFs are needed, the backend has no
    object-storage client yet - that is open planned work.
  - Public media tier (Backblaze B2 + Cloudflare Workers): public
    campaign media lives in a private B2 bucket and is served through the
    blockallisto-media Worker using a public/-scoped read key (GET/HEAD
    only). There is no Cloudflare zone for this property, so the plan's
    Cache Rules mitigation does not apply; quota protection rests on the
    Worker free allowance and the scoped key. MEDIA_ORIGIN points both
    app containers at the Worker; excluding media from the frontend
    build is committed on the feature branch and ships with the next
    deploy.
  - Quota figures in the plan (OCI 20 GB storage / 50k requests per
    month, B2 10 GB free with 3x egress, Workers 100k requests/day) are
    vendor-stated free-tier numbers, not verified caps, and no platform
    here has a verified hard spending cap. The backup script enforces
    its own stored-bytes budget before upload; that does not bound
    request counts.
- Nightly backup at 03:00 Europe/Lisbon to an OCI Object Storage bucket via a
  versioned, seam-testable script (see the backup section below).

## Standard local test run (disposable, no hosted database)

Run from a pristine archive of an exact commit, in a throwaway container:

```bash
git archive --format=tar.gz -o /tmp/tree.tgz <commit-sha>
# on the VM:
docker run --rm --network host \
  -v /tmp/tree.tgz:/src.tgz:ro -v /tmp/gate-logs:/logs \
  node:24-alpine sh -c '
    mkdir /work && tar xzf /src.tgz -C /work && cd /work &&
    npm ci && npm run lint && npm test 2>&1 | tee /logs/test.log'
```

Safeguards that make this safe: no `*_DATABASE_URL` is passed (hosted
credentials absent), the test-storage guard fails closed on any non-localhost
Postgres URL inside a test process, and the container is removed on exit.

Optional: tests that need a real database use an ephemeral
`postgres:17-alpine` container (matching the hosted engine, 17.2) bound to
127.0.0.1 on the runner host, destroyed after the run. Keep database URLs on
localhost so the test-storage guard accepts them; a compose service hostname
such as `test-db` is refused by the guard by design. A bare `depends_on` does
not wait for PostgreSQL readiness (Docker starts containers, it does not wait
for them to accept connections); use a `pg_isready` healthcheck with
`condition: service_healthy` or equivalent retry.

## Standard deploy flow (manual/programmatic, with rollback)

```bash
# 1. Deploy an exact reviewed commit - never a bare `git pull` of a branch.
git fetch origin && git checkout <reviewed-commit-sha>

# 2. Tag the current image as a rollback point BEFORE rebuilding.
docker tag blockallisto-app:local blockallisto-app:pre-<short-sha>

# 3. Build locally and recreate only the intended service.
docker compose -f docker-compose.oracle.yml up -d --build <service>

# 4. Verify health; roll back by re-tagging and recreating if unhealthy.
docker ps --filter name=<service>   # plus the site's HTTP checks
```

Notes: the app initializes its own schema at boot (advisory-lock serialized);
there is no separate migration step and no Prisma ORM involved. `-T` on
`docker compose exec` is for non-interactive contexts (scripts/cron), not a
general requirement.

## Disk hygiene (measured, targeted - never blanket prune)

Root filesystem is 30 GB total (NOT 200 GB); a targeted cleanup on
2026-11-06 brought it from 91% to 85% used (2.8 GB to 4.7 GB free). Safe
routine, run manually after build/test sessions:

```bash
docker ps -a --filter status=exited   # identify test containers, then remove by name
docker builder prune -f               # clears build cache only (~1 GB typical)
```

Never run `docker system prune -a --volumes` on this VM: `-a` deletes every
image not referenced by any container, which includes the tagged rollback
images that are our only instant-rollback mechanism. `--volumes` prunes
anonymous volumes (Docker 29 CLI semantics); the more aggressive
`docker volume prune -a` extends to named volumes, but only ones not
referenced by any container - a stopped container still protects its
volumes, while a removed container releases them. `docker image prune`
without `-a` (dangling only) is safe.

## Backups

Nightly at 03:00 Europe/Lisbon (cron with scoped `CRON_TZ`), the versioned
backup script tars Weblate/Kuma/config state, dumps the Weblate database and
all three Prisma Postgres databases (staging, demo, Bitwarden vault),
archives the Bitwarden volume files (data-protection keys, identity
certificate, attachments directory), encrypts with
GnuPG symmetric AES-256 (s2k SHA-512, passphrase file), uploads to an OCI
Object Storage bucket with an exact per-object ledger, and reports PARTIAL per
failed leg via ONS and Uptime Kuma. Failure-isolation tests (stubbed legs,
encrypt and upload failures) run in a fully fixture-bound harness. The Bitwarden
Postgres leg's first real nightly run is still pending; the harness is not a
restore proof. A scratch-container restore of the Bitwarden dump was
verified on 2026-11-07 (73 tables, EF migration history preserved).

## Docker container log caps

Policy (approved by Nuno 2026-11-06): every container's json-file logs are
capped at 3 files x 10 MB. Current container logs were ~16 MB total when the
cap was approved; the cap prevents unbounded growth (docker's default is
unbounded).

- Compose-managed services (weblate stack, https-portal, dozzle + socket
  proxy, blockallisto staging + demo): the `logging:` block lives in the
  owning compose file and takes effect on each service's next natural
  recreate (deploy or stack update) - no fleet-wide restart was done.
- Run-based containers (kuma, bitwarden, public-docs, private-docs): any
  future `docker run` / recreate MUST include
  `--log-driver json-file --log-opt max-size=10m --log-opt max-file=3`.
  Recreate by reusing the container's inspected config (image, volumes,
  ports, env) rather than retyping it.

https-portal's nginx file logs (/var/log/nginx inside its volume) rotate
independently via the image's own logrotate (daily, 30 rotations,
compressed) - separate mechanism, already active.
