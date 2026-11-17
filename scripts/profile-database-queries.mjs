import { pathToFileURL } from 'node:url';
import path from 'node:path';
const root = path.resolve(process.argv[2]);
const load = (p) => import(pathToFileURL(path.join(root, p)).href);
const { PostgresCommunityStore, emptyCommunityState } = await load('backend/src/community-store.ts');
const { createCommunityServiceFactory } = await load('backend/src/community-routes.ts');
let calls = 0,
  writes = 0;
const row = emptyCommunityState();
const client = {
  query: async (sql) => {
    calls++;
    if (sql.startsWith('INSERT')) writes++;
    return { rows: sql.startsWith('SELECT doc') ? [{ doc: structuredClone(row) }] : [] };
  },
  release() {},
};
const store = new PostgresCommunityStore({ query: client.query, connect: async () => client, end: async () => {} });
await store.change(() => {});
const startup = { sqlCalls: calls, writes };
calls = 0;
writes = 0;
for (let i = 0; i < 100; i++) await store.change(() => {});
const idle100 = { sqlCalls: calls, writes };
let creates = 0,
  failureSQL = 0;
const factory = createCommunityServiceFactory(async () => {
  creates++;
  return new PostgresCommunityStore({
    query: async () => {
      failureSQL++;
      throw new Error('synthetic initialization outage');
    },
    end: async () => {},
  });
});
for (let i = 0; i < 100; i++) await factory().catch(() => {});
console.log(
  JSON.stringify({
    source: root,
    scenario: 'isolated fake PostgreSQL pool; no network',
    startup,
    idle100,
    failedInitialization100: { creates, sqlCalls: failureSQL },
  }),
);
