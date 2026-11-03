# Load testing (k6)

Authored k6 scenarios for the two burst paths the platform must survive:
contribution bursts near a deadline and refund storms after a failed
campaign.

## Run

Start a local backend first (default http://localhost:4000), then:

    k6 run k6-contribution-burst.js
    k6 run k6-refund-storm.js

Environment:

- `BASE_URL` - target backend (default `http://localhost:4000`)
- `K6_PROFILE=low|medium` - low: 10 VUs / 30s; medium: 50 VUs / 2m

## Execution rules

- Local backend first. Staging only owner-aware LOW; Render sleep/shared
  limits mean wake-up time is not capacity.
- Never run against the public demo under evaluation, or mainnet.
- The scripts exercise read paths and invalid-payload build/submit
  validation paths only. They perform no valid signed submissions and no
  on-chain writes. Full sign-submit load requires separately approved
  pre-signed fixtures.

## Execution status

- 2026-11-02: LOW profile (10 VUs, 30s) executed against a local Node stub
  at 127.0.0.1:4101; 600 iterations each, passed. This proves script
  executability only - it is not evidence of actual backend capacity. The
  scenarios have not yet been run against a real backend.
