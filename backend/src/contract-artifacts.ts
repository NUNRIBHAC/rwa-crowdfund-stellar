import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Historical bytes and recognition are never replaced by a toolchain update.
// Only the named SDK30 artifacts are selected for newly prepared deployments.
export const CONTRACT_ARTIFACTS = Object.freeze({
  crowdfund29: { family: 'crowdfund', file: 'reviewed-crowdfund.wasm', hash: '202c9d7e59623c06d1eb2f1ade4cbd187a73ccd3f8154673593820c71db1b564' },
  tokenLegacy: { family: 'token', file: 'v2-share-token.wasm', hash: '3fc3d4b74f69fcfb2e0b86878b5b0f3d89a73050e6a049da4dd789dd7a27eaa1' },
  token29: { family: 'token', file: 'v2-share-token-sep41.wasm', hash: '6010fc62cf08ee606a2687bd4877790c6d131cbd57936beb21e592d179b818e7' },
  offering29: { family: 'offering', file: 'v2-offering.wasm', hash: '84d254abbc46f5aaf8305734510d66123b4cc9d800992cd11c23da88eb1be622' },
  crowdfund30: { family: 'crowdfund', file: 'sdk30-crowdfund.wasm', hash: '79e4d2122a8ebee77eaea1dc7bf9aa082f1b594062844422879320858cf043b8' },
  token30: { family: 'token', file: 'sdk30-share-token.wasm', hash: 'c256d9bbca81821d461ff8384d588c233593b44811494b7480612150aa300f87' },
  offering30: { family: 'offering', file: 'sdk30-offering.wasm', hash: '2f3239d8514035ddd7d3c6d77f1e4a588e831b333cf9a309d18961974ec30910' },
} as const);
export type ContractFamily = 'crowdfund' | 'token' | 'offering';
export const DEPLOY_ARTIFACTS = Object.freeze({
  crowdfund: CONTRACT_ARTIFACTS.crowdfund30,
  token: CONTRACT_ARTIFACTS.token30,
  offering: CONTRACT_ARTIFACTS.offering30,
});
export function isReviewedContractHash(family: ContractFamily, hash: string): boolean {
  return Object.values(CONTRACT_ARTIFACTS).some((a) => a.family === family && a.hash === hash);
}
export function loadDeployArtifact(family: ContractFamily, selectedHash: string = DEPLOY_ARTIFACTS[family].hash): Buffer {
  const artifact = Object.values(CONTRACT_ARTIFACTS).find((a) => a.family === family && a.hash === selectedHash);
  if (!artifact) throw new Error('unreviewed deployment artifact');
  const bytes = readFileSync(new URL(`../wasm/${artifact.file}`, import.meta.url));
  if (createHash('sha256').update(bytes).digest('hex') !== artifact.hash)
    throw new Error(`packaged ${family} Wasm does not match its deployment pin; refusing`);
  return bytes;
}
