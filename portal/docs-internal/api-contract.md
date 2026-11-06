# API contract (OpenAPI)

The machine-readable contract lives at `openapi.yaml` next to this page. It is
generated from the Express route definitions in `backend/src` (server.ts,
community-routes.ts, infrastructure/router.ts) at current main.

Status: DRAFT v0.2.0. Paths, HTTP methods and auth requirements are
source-verified. Path coverage synchronized to main @0962c6f on 2026-11-03
(duplicate path keys merged; post-snapshot routes added: email/social auth,
abuse diagnostics, event-archive, share-register, investment documents,
campaign-deploy, payouts). Request/response schemas are intentionally generic until each
handler's zod validation is transcribed - treat schema detail as the next
iteration, not as settled truth.

Security schemes (all verified against the source):

- `sessionAuth` - bearer session token issued by `POST /api/auth/verify` after
  a Freighter challenge signature. Used by investor and operator routes;
  operator routes additionally require the operator role server-side.
- `adminKey` - `x-admin-key` header, timing-safe compared against the
  `ADMIN_SECRET` env var. Admin routes fail closed with 503 when the secret is
  not configured.
- `infraBearer` - per-principal credentials for the infrastructure test API
  (roles: compliance, valuation, governor, operator, auditor).

Boundaries worth knowing:

- `/api/infrastructure/*` is a TEST-ONLY service bound to 127.0.0.1
  (INFRA_PORT, default 4100). It must never be exposed publicly.
- Unknown `/api/*` POST paths get a generic 404 from a catch-all; it is not an
  API route and is intentionally not in the spec.

Public copy: the public portal serves a sanitized derivative at
`portal/static/openapi.yaml` (platform-administration, operator-console,
internal test-only and legacy-admin paths removed; servers trimmed to the
public hosts). Regenerate it from this file whenever the spec changes.

Rendering: keep the YAML in the repo as the single source of truth and link it
from this page. If an interactive viewer is wanted later, evaluate the
docusaurus-openapi-docs plugin as a separate change (build weight + audit);
not required to consume the contract.
