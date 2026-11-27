import { Address, StrKey, scValToNative, type xdr } from '@stellar/stellar-sdk';

// Only the reviewed contract's own success event counts, not token events,
// diagnostic events, a zero balance or a matching event from another contract.
export function decodeRefundEvent(events: readonly xdr.ContractEvent[], contract: string, contributor: string): bigint {
  const matching = events.filter(
    (event) =>
      event.type.name === 'contract' &&
      event.contractId &&
      StrKey.encodeContract(event.contractId.toXdrObject()) === contract &&
      event.body.v0.topics[0]?.type === 'scvSymbol' &&
      scValToNative(event.body.v0.topics[0]) === 'refunded',
  );
  if (matching.length !== 1) throw new Error('AUTO_REFUND_EVENT_COUNT');
  const event = matching[0].body.v0;
  if (event.topics.length !== 2 || Address.fromScVal(event.topics[1]).toString() !== contributor || event.data.type !== 'scvMap')
    throw new Error('AUTO_REFUND_EVENT_RECIPIENT');
  const value = scValToNative(event.data) as Record<string, unknown>;
  if (!value || Object.keys(value).length !== 1 || typeof value.amount !== 'bigint' || value.amount <= 0n) throw new Error('AUTO_REFUND_EVENT_AMOUNT');
  return value.amount;
}
