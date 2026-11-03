// Refund storm: failed campaign, all contributors reclaim at once.
// Loads campaign state reads and the recovery/status polling endpoints that a
// refund storm actually hammers. See README.md - authored scenario.
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
  // Transaction status polling with a bogus hash: exercises the polling path
  // without touching real transactions.
  const bogus = '0'.repeat(64);
  const tx = http.get(`${BASE}/api/soroban/transactions/${bogus}`);
  check(tx, { 'tx status answered (any 2xx/4xx)': (r) => r.status > 0 && r.status < 500 });
  // Recover endpoint with an invalid body: validation-path load only.
  const rec = http.post(`${BASE}/api/soroban/recover`, JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } });
  check(rec, { 'recover answered (any 2xx/4xx)': (r) => r.status > 0 && r.status < 500 });
  sleep(0.5);
}
