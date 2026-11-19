// Repeated AB/BA local-only comparison. No URLs or database options.
import process from 'node:process';
import console from 'node:console';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { cpus, freemem, hostname, platform, release, totalmem } from 'node:os';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [base, candidate, output = '/code/.generated_artifacts/browse-benchmark/comparison'] = process.argv.slice(2);
if (!base || !candidate) throw new Error('Usage: node load/compare-campaign-listing.mjs BASE_COMMIT CANDIDATE_COMMIT [OUTPUT_DIR]');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const commits = { baseline: git('rev-parse', '--verify', `${base}^{commit}`), candidate: git('rev-parse', '--verify', `${candidate}^{commit}`) };
const scratch = mkdtempSync('/var/tmp/campaign-browse-benchmark-');
mkdirSync(output, { recursive: true });
writeFileSync(
  join(output, 'host.json'),
  JSON.stringify(
    {
      startedAt: new Date().toISOString(),
      node: process.version,
      platform: platform(),
      release: release(),
      hostname: hostname(),
      cpus: cpus(),
      totalMemoryBytes: totalmem(),
      freeMemoryBytes: freemem(),
      commits,
      method: 'sequential processes, alternating AB/BA order, five pairs per size/mode; no HTTP or real RPC; includes JSON serialization and fixture lookup',
      harnessSha256: Object.fromEntries(
        ['load/bench-campaign-listing.mts', 'load/compare-campaign-listing.mjs'].map((file) => [
          file,
          createHash('sha256')
            .update(readFileSync(join(root, file)))
            .digest('hex'),
        ]),
      ),
    },
    null,
    2,
  ),
);
writeFileSync(join(output, 'runs.jsonl'), '');
try {
  for (const [label, commit] of Object.entries(commits)) {
    const target = join(scratch, label);
    mkdirSync(target);
    const archive = join(scratch, `${label}.tar`);
    execFileSync('git', ['archive', '--format=tar', `--output=${archive}`, commit, 'backend/src', 'backend/package.json'], { cwd: root });
    execFileSync('tar', ['-xf', archive, '-C', target]);
    symlinkSync(join(root, 'node_modules'), join(target, 'node_modules'), 'dir');
  }
  for (const count of [3, 25, 100]) {
    for (const mode of ['fresh', 'warm']) {
      for (let pair = 0; pair < 5; pair++) {
        for (const label of pair % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
          // An explicit environment prevents hosted database URLs and other
          // managed secrets from reaching either benchmark child process.
          const result = execFileSync(process.execPath, ['--import', 'tsx', 'load/bench-campaign-listing.mts'], {
            cwd: root,
            encoding: 'utf8',
            timeout: 60000,
            env: {
              PATH: process.env.PATH,
              HOME: scratch,
              NODE_ENV: 'test',
              BENCH_MODE: mode,
              BENCH_CAMPAIGNS: String(count),
              BENCH_ITERATIONS: mode === 'warm' ? '10000' : '500',
              BENCH_LABEL: label,
              BENCH_COMMIT: commits[label],
              BENCH_SOURCE: join(scratch, label, 'backend/src/soroban.ts'),
            },
          });
          const record = { ...JSON.parse(result), pair: pair + 1 };
          appendFileSync(join(output, 'runs.jsonl'), JSON.stringify(record) + '\n');
          console.log(`${count} campaigns ${mode} pair ${pair + 1} ${label}: ${record.p50Ms.toFixed(3)} ms p50, errors=${record.errors}`);
        }
      }
    }
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
const runs = readFileSync(join(output, 'runs.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const summary = [];
for (const count of [3, 25, 100]) {
  for (const mode of ['fresh', 'warm']) {
    const group = runs.filter((r) => r.campaigns === count && r.mode === mode);
    assert.equal(group.length, 10);
    assert.equal(new Set(group.map((r) => r.responseSha256)).size, 1, 'response mismatch between revisions');
    assert(group.every((r) => r.errors === 0));
    assert(group.every((r) => r.rpcCalls === (mode === 'fresh' ? r.iterations * Math.ceil(count / 100) : 0)));
    const row = { campaigns: count, mode };
    for (const label of ['baseline', 'candidate']) {
      const selected = group.filter((r) => r.label === label);
      row[label] = Object.fromEntries(
        ['p50Ms', 'p95Ms', 'p99Ms', 'operationsPerSecond', 'elapsedMs', 'cpuUserMs', 'cpuSystemMs', 'maxRssKiB', 'eventLoopDelayP95Ms'].map((key) => [
          key,
          median(selected.map((r) => r[key])),
        ]),
      );
      row[label].p50RangeMs = [Math.min(...selected.map((r) => r.p50Ms)), Math.max(...selected.map((r) => r.p50Ms))];
      row[label].totalErrors = selected.reduce((sum, r) => sum + r.errors, 0);
    }
    row.p50ReductionPercent = 100 * (1 - row.candidate.p50Ms / row.baseline.p50Ms);
    summary.push(row);
  }
}
writeFileSync(join(output, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
