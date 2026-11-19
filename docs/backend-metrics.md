# Backend observability metrics

This document defines the Prometheus-compatible metrics exposed by the Blockallisto backend. The implementation is dependency-free and lives in `backend/src/metrics.ts`. Metrics are served at `GET /api/operator/metrics` behind the existing admin-key gate (`x-admin-key`).

## Scope and safety rules

- No dashboards, alert thresholds or production telemetry pipelines are changed by this instrumentation.
- Labels never include request bodies, query strings, wallet addresses, SQL, credentials, or raw error messages.
- Route labels use the matched Express route path (`:id` placeholders). Requests that end before routing (body-parse failures, read-limiter rejections, unmatched 404s) use the single coarse label `route="unmatched"`, so arbitrary paths cannot create unbounded time series.
- Database labels use the same stable SHA-256 hash of the database identity already used by the database runtime; no connection strings are exposed.
- Histogram buckets are fixed; they cover the expected latency range without requiring per-route tuning.

## Metric definitions

| Name                            | Type      | Labels                           | Description                                                                                                                                                                                                                            |
| ------------------------------- | --------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `http_requests_total`           | counter   | `method`, `route`, `status_code` | Total HTTP requests handled by the app. Recorded before body parsing and the read limiter, so limiter `429`s and malformed-body `400`s are included.                                                                                   |
| `http_request_duration_seconds` | histogram | `method`, `route`, `status_code` | HTTP request duration measured from middleware entry to response `finish`. Recorded before body parsing and the read limiter. Cumulative buckets: 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10 and +Inf; +Inf equals count. |
| `api_errors_total`              | counter   | `code`                           | API responses with status `>= 400` that include a public `code` field. Counts stable error codes such as `not_found`, `API_UNAVAILABLE`, `invalid_input`; all codes outside a fixed allowlist collapse to `other`.                     |
| `db_pool_active_connections`    | gauge     | `db_hash`                        | Checked-out connections (max(0, total minus idle)), summed across pools sharing a database identity.                                                                                                                                   |
| `db_pool_idle_connections`      | gauge     | `db_hash`                        | Idle connections per tracked database pool.                                                                                                                                                                                            |
| `db_pool_waiting_connections`   | gauge     | `db_hash`                        | Requests waiting for a connection per tracked database pool.                                                                                                                                                                           |
| `db_pool_max_connections`       | gauge     | `db_hash`                        | Configured maximum size of each tracked database pool.                                                                                                                                                                                 |

## Endpoint

```
GET /api/operator/metrics
Content-Type: text/plain; version=0.0.4; charset=utf-8
```

Access requires the admin key configured via `ADMIN_SECRET`. The endpoint returns Prometheus exposition format and is suitable for scraping by any Prometheus-compatible collector.

## Operational use

- Latency SLI: `http_request_duration_seconds` p99 per `route` and `method`.
- Error budget: ratio of `http_requests_total{status_code=~"5..|4.."}` to total requests per `route`.
- Saturation alert: `db_pool_active_connections / db_pool_max_connections` approaching 1, or `db_pool_waiting_connections` > 0 for a sustained window.

## Future work (out of scope here)

- Per-dependency latency (Soroban RPC/Horizon, email provider).
- Background-task success/failure/freshness metrics.
- Operational runbook linking each metric to a concrete rollback or investigation step.

## Measurement limits

Metrics are process-local and reset on restart. Pool gauges read driver properties without executing SQL. Missing properties and identities with no tracked pools report zero; this is not proof that a remote database is healthy or idle. CORS middleware runs before instrumentation, so requests it completes early are outside these request metrics. Aborted responses without a finish event are not counted. Scraping does not configure a collector, persistence, dashboards or alerts. No production overhead measurement or end-to-end collector validation is claimed.
