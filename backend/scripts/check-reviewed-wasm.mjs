// Verify every packaged historical and current artifact. The runtime inventory is
// compiled first; no regex over a single deployment constant can cover it.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { CONTRACT_ARTIFACTS } from '../dist/contract-artifacts.js';
for (const [name, artifact] of Object.entries(CONTRACT_ARTIFACTS)) {
  const bytes = readFileSync(new URL(`../wasm/${artifact.file}`, import.meta.url));
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== artifact.hash) throw new Error(`check-reviewed-wasm: ${name} digest mismatch`);
  console.log(`check-reviewed-wasm: ${name} OK ${actual} (${bytes.length} bytes)`);
}
