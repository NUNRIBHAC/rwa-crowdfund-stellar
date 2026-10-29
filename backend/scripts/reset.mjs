if (process.env.LEGACY_MAINTENANCE !== 'explicitly_authorized') throw new Error('Legacy reset disabled: preserve unresolved balances and intents.');
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

const targets = [
  path.join(backendRoot, 'data', 'campaigns.json'),
  path.join(backendRoot, '.demo-investors.json'),
];

let removed = 0;
for (const p of targets) {
  try {
    fs.unlinkSync(p);
    console.log(`[reset] removido ${path.relative(backendRoot, p)}`);
    removed++;
  } catch {
    console.log(`[reset] nada a remover: ${path.relative(backendRoot, p)}`);
  }
}
console.log(`[reset] ${removed} ficheiro(s) removido(s).`);