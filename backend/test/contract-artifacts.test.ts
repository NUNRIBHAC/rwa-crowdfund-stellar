import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { contract, xdr } from '@stellar/stellar-sdk';
import { CONTRACT_ARTIFACTS, DEPLOY_ARTIFACTS, isReviewedContractHash, loadDeployArtifact } from '../src/contract-artifacts.js';

test('all seven current/historical artifacts retain exact pins, with family-only recognition', () => {
  assert.equal(Object.keys(CONTRACT_ARTIFACTS).length, 7);
  for (const a of Object.values(CONTRACT_ARTIFACTS)) {
    const bytes = readFileSync(new URL(`../wasm/${a.file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), a.hash);
    for (const family of ['crowdfund', 'token', 'offering'] as const) assert.equal(isReviewedContractHash(family, a.hash), family === a.family);
    assert.equal(isReviewedContractHash(a.family, a.hash.toUpperCase()), false);
  }
  for (const family of ['crowdfund', 'token', 'offering'] as const) {
    assert.equal(isReviewedContractHash(family, '0'.repeat(64)), false);
    assert.equal(createHash('sha256').update(loadDeployArtifact(family)).digest('hex'), DEPLOY_ARTIFACTS[family].hash);
    assert.match(DEPLOY_ARTIFACTS[family].file, /^sdk30-/);
  }
});

test('SDK JS parses every historical/new spec and preserves names, inputs and errors', async () => {
  for (const [old, current] of [
    [CONTRACT_ARTIFACTS.crowdfund29, CONTRACT_ARTIFACTS.crowdfund30],
    [CONTRACT_ARTIFACTS.token29, CONTRACT_ARTIFACTS.token30],
    [CONTRACT_ARTIFACTS.offering29, CONTRACT_ARTIFACTS.offering30],
  ]) {
    const a = await contract.Spec.fromWasm(readFileSync(new URL(`../wasm/${old.file}`, import.meta.url)));
    const b = await contract.Spec.fromWasm(readFileSync(new URL(`../wasm/${current.file}`, import.meta.url)));
    assert.deepEqual(
      a.funcs().map((f) => f.name.toString()),
      b.funcs().map((f) => f.name.toString()),
    );
    assert.deepEqual(a.errorCases(), b.errorCases());
    for (const f of a.funcs()) {
      const name = f.name.toString();
      assert.deepEqual(f.inputs, b.getFunc(name).inputs);
      if (f.outputs[0]?.type === 'scSpecTypeResult') {
        const err = xdr.ScVal.scvError(xdr.ScError.sceContract(3));
        assert.deepEqual(a.funcResToNative(name, err), b.funcResToNative(name, err));
      }
    }
  }
});
