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
    fake pools and local disposable databases only; zero Prisma Cloud
    consumption by test traffic is the architectural goal, enforced by the
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
  form anti-abuse validation; network traffic goes directly to the VM.

### Data layer

- The staging app connects exclusively to the staging Prisma Postgres
  database; the demo app exclusively to the demo database. The two databases
  are logically separate but share and compete for the limits of one Prisma
  free plan (measured engine: PostgreSQL 17.2).
- The apps use the raw `pg` driver (no Prisma Client / ORM). Pool caps are set
  per store via env (`COMMUNITY_POOL_MAX=2`, `SOROBAN_JOURNAL_POOL_MAX=2`
  direct, `EVENT_ARCHIVE_POOL_MAX=1` pooled per app); pools open lazily and a
  2026-11-06 snapshot showed 1-2 idle connections per app.
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
both Prisma Postgres databases, snapshots the Bitwarden vault, encrypts with
GnuPG symmetric AES-256 (s2k SHA-512, passphrase file), uploads to an OCI
Object Storage bucket with an exact per-object ledger, and reports PARTIAL per
failed leg via ONS and Uptime Kuma. Failure-isolation tests (stubbed legs,
encrypt and upload failures) run in a fully fixture-bound harness. The first
real nightly run including the Prisma legs, and its restore verification, are
still pending; the harness is not a restore proof.
