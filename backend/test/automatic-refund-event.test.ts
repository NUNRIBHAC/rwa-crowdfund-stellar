import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Address, StrKey, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { decodeRefundEvent } from '../src/automatic-refund-event.ts';
const contract = StrKey.encodeContract(new Uint8Array(32).fill(1));
const contributor = StrKey.encodeEd25519PublicKey(new Uint8Array(32).fill(2));
function event(change: { contract?: string; contributor?: string; amount?: unknown; name?: string; diagnostic?: boolean; extra?: boolean } = {}) {
  return new xdr.ContractEvent({
    ext: xdr.ExtensionPoint.v0(),
    contractId: xdr.ContractId.fromXdrObject(StrKey.decodeContract(change.contract ?? contract)),
    type: change.diagnostic ? xdr.ContractEventType.diagnostic : xdr.ContractEventType.contract,
    body: xdr.ContractEventBody.v0(
      new xdr.ContractEventV0({
        topics: [nativeToScVal(change.name ?? 'refunded', { type: 'symbol' }), new Address(change.contributor ?? contributor).toScVal()],
        data: nativeToScVal({ amount: change.amount ?? 10n, ...(change.extra ? { destination: contributor } : {}) }),
      }),
    ),
  });
}
test('accepts only the original wallet positive amount from one reviewed-contract event', () =>
  assert.equal(decodeRefundEvent([event()], contract, contributor), 10n));
for (const [name, events] of [
  ['missing', []],
  ['duplicate', [event(), event()]],
  ['other contract', [event({ contract: StrKey.encodeContract(new Uint8Array(32).fill(3)) })]],
  ['other wallet', [event({ contributor: StrKey.encodeEd25519PublicKey(new Uint8Array(32).fill(4)) })]],
  ['zero', [event({ amount: 0n })]],
  ['negative', [event({ amount: -1n })]],
  ['string amount', [event({ amount: '10' })]],
  ['wrong event', [event({ name: 'transfer' })]],
  ['diagnostic only', [event({ diagnostic: true })]],
  ['extra data', [event({ extra: true })]],
] as const)
  test('rejects event: ' + name, () => assert.throws(() => decodeRefundEvent(events, contract, contributor)));
test('ignores unrelated token events without accepting them as refund evidence', () =>
  assert.equal(decodeRefundEvent([event({ name: 'transfer' }), event()], contract, contributor), 10n));
