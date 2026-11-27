// Refund storm: failed campaign, all contributors reclaim at once.
// Loads campaign state reads and the recovery/status polling endpoints that a
// refund storm actually hammers. See README.md - authored scenario.
// This scenario never submits refunds: it proves the READ and VALIDATION
// paths hold under storm load (campaign list, status polling of an unknown
// hash, recovery-body validation), each with its exact expected response.
// It says nothing about real refund execution.
import http from 'k6/http';
import { check, sleep } from 'k6';

// Target guard: these scripts POST and hammer endpoints, so the default
// target is loopback only. A remote target needs BOTH K6_ALLOW_REMOTE=1 and
// its host in K6_TARGET_ALLOWLIST (comma-separated) - an explicit opt-in,
// never an ambient BASE_URL. The shared module is also unit-tested from node.
import { assertK6Target } from './target-guard-k6.js';
const BASE = __ENV.BASE_URL || 'http://localhost:4000';
assertK6Target(BASE, __ENV);
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
  check(tx, { 'tx status bogus hash rejected 400': (r) => r.status === 400 });
  // Recover endpoint with an invalid body: validation-path load only.
  const rec = http.post(`${BASE}/api/soroban/recover`, JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } });
  check(rec, { 'recover invalid body rejected 400': (r) => r.status === 400 });
  sleep(0.5);
}
