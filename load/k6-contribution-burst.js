// Contribution burst: many contributors arriving at once near a deadline.
// Loads the campaign read paths and the transaction-BUILD endpoint.
// See README.md - authored scenario, execution rules apply.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:4000';
const PROFILES = {
  low: { vus: 10, duration: '30s' },
  medium: { vus: 50, duration: '2m' },
};
export const options = PROFILES[__ENV.K6_PROFILE || 'low'];

export default function () {
  const list = http.get(`${BASE}/api/campaigns`);
  check(list, { 'campaigns 200': (r) => r.status === 200 });

  let id = null;
  try {
    const items = JSON.parse(list.body);
    const arr = Array.isArray(items) ? items : items.campaigns;
    if (arr && arr.length) id = arr[0].id ?? arr[0].campaignId ?? null;
  } catch {
    // no campaigns yet: id stays null, burst skips the build step
  }

  if (id) {
    const meta = http.get(`${BASE}/api/campaigns/${id}/metadata`);
    check(meta, { 'metadata 200': (r) => r.status === 200 });
    // Build endpoint: unauthenticated/invalid here on purpose - measures
    // validation-path cost without writing anything on-chain.
    const build = http.post(
      `${BASE}/api/campaigns/${id}/soroban/build`,
      JSON.stringify({ contributor: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', amount: 1 }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    check(build, { 'build answered (any 2xx/4xx)': (r) => r.status > 0 && r.status < 500 });
  }
  sleep(0.5);
}
