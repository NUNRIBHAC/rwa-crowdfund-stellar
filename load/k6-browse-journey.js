// Browse journey: the read-heavy path normal public traffic puts on the API.
// Anonymous visitors list campaigns, open a campaign, and read its metadata,
// news, comments, the global news feed, podcast episodes and the sitemap;
// some attempt sign-in with malformed payloads (validation path only - no
// challenge is persisted and no session is created).
// Execution rules mirror load/README.md: read paths and invalid-payload
// validation paths only. No valid signed submissions, no on-chain writes.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:4000';
const PROFILES = {
  low: { vus: 10, duration: '30s' },
  medium: { vus: 50, duration: '2m' },
};
export const options = PROFILES[__ENV.K6_PROFILE || 'low'];

export default function () {
  const health = http.get(`${BASE}/health`);
  check(health, { 'health 200': (r) => r.status === 200 });

  const list = http.get(`${BASE}/api/campaigns`);
  check(list, { 'campaigns 200': (r) => r.status === 200 });

  let id = null;
  try {
    const items = JSON.parse(list.body);
    const arr = Array.isArray(items) ? items : items.campaigns;
    if (arr && arr.length) id = arr[0].id ?? arr[0].campaignId ?? null;
  } catch {
    // no campaigns yet: campaign-scoped reads below are skipped
  }

  if (id) {
    const meta = http.get(`${BASE}/api/campaigns/${id}/metadata`);
    check(meta, { 'metadata 200': (r) => r.status === 200 });

    const news = http.get(`${BASE}/api/campaigns/${id}/news`);
    check(news, { 'campaign news 200': (r) => r.status === 200 });

    const comments = http.get(`${BASE}/api/campaigns/${id}/comments`);
    check(comments, { 'campaign comments 200': (r) => r.status === 200 });

    const podcast = http.get(`${BASE}/api/campaigns/${id}/podcast`);
    check(podcast, { 'campaign podcast answered (2xx/404)': (r) => r.status === 200 || r.status === 404 });
  }

  const feed = http.get(`${BASE}/api/news`);
  check(feed, { 'news feed 200': (r) => r.status === 200 });

  const episodes = http.get(`${BASE}/api/podcast/episodes`);
  check(episodes, { 'episodes 200': (r) => r.status === 200 });

  const sitemap = http.get(`${BASE}/sitemap.xml`);
  check(sitemap, { 'sitemap 200': (r) => r.status === 200 });

  // Sign-in validation path with a malformed public key: rejected before any
  // store write, so no challenge rows accumulate under load.
  const challenge = http.post(`${BASE}/api/auth/challenge`, JSON.stringify({ publicKey: 'not-a-real-stellar-public-key' }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(challenge, { 'challenge answered (any 2xx/4xx)': (r) => r.status > 0 && r.status < 500 });

  sleep(0.5);
}
