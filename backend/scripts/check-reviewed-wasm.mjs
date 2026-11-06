// Build-time guard: the backend resolves backend/wasm/reviewed-crowdfund.wasm
// relative to dist (backend/wasm/ inside the image) and refuses any bytes whose
// sha256 differs from the pinned WASM_HASH in the compiled soroban module.
// This script fails the image build if the file is missing or drifted.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const dist = readFileSync(new URL("../dist/soroban.js", import.meta.url), "utf8");
const m = dist.match(/WASM_HASH\s*=\s*["']([0-9a-f]{64})["']/);
if (!m) {
  console.error("check-reviewed-wasm: WASM_HASH constant not found in backend/dist/soroban.js");
  process.exit(1);
}
const pinned = m[1];
let bytes;
try {
  bytes = readFileSync(new URL("../wasm/reviewed-crowdfund.wasm", import.meta.url));
} catch (err) {
  console.error("check-reviewed-wasm: backend/wasm/reviewed-crowdfund.wasm missing from build context:", err.message);
  process.exit(1);
}
const actual = createHash("sha256").update(bytes).digest("hex");
if (actual !== pinned) {
  console.error(`check-reviewed-wasm: sha256 mismatch (pinned \${pinned}, actual \${actual})`);
  process.exit(1);
}
console.log(`check-reviewed-wasm: OK sha256=\${actual} (\${bytes.length} bytes)`);
