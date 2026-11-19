import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { FileCommunityStore, emptyCommunityState } from '../src/community-store.ts';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'community-cache-benchmark-'));
try {
  const filename = path.join(directory, 'store.json');
  const state = emptyCommunityState();
  for (let index = 0; index < 10_000; index++) {
    const id = `comment-${index}`;
    state.comments[id] = {
      id,
      campaignId: 'synthetic-campaign',
      publicKey: 'synthetic-user',
      displayName: null,
      body: 'x'.repeat(260),
      createdAt: index,
      hiddenAt: null,
      hiddenReason: null,
    };
  }
  fs.writeFileSync(filename, JSON.stringify(state));
  const store = new FileCommunityStore(filename);
  const iterations = 300;
  const measure = async (read) => {
    await read();
    const durations = [];
    for (let index = 0; index < iterations; index++) {
      const start = performance.now();
      await read();
      durations.push(performance.now() - start);
    }
    durations.sort((a, b) => a - b);
    return { p50ms: durations[149], p95ms: durations[284] };
  };
  console.log(
    JSON.stringify(
      {
        node: process.version,
        bytes: fs.statSync(filename).size,
        iterations,
        scope: 'local read components only; baseline omits validation; not HTTP or production capacity',
        readAndParse: await measure(() => JSON.parse(fs.readFileSync(filename, 'utf8'))),
        validatedCachedRead: await measure(() => store.read()),
      },
      null,
      2,
    ),
  );
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
// Imported app modules may start idle resources; this standalone finite probe
// has completed all work and cleanup before ending its process.
process.exit(0);
