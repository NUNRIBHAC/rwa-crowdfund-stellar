import { Keypair, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
const base = 'http://127.0.0.1:4000';
const actor = process.env.ACTOR;
const kp = Keypair.fromSecret(process.env.SECRET);
const post = (u, b) =>
  fetch(base + u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(async (r) => ({
    ok: r.ok,
    status: r.status,
    body: await r.json(),
  }));

const campaigns = await fetch(base + '/api/campaigns?actor=' + actor).then((r) => r.json());
console.log(
  'CAMPAIGNS:',
  JSON.stringify(
    campaigns.campaigns?.map((c) => ({ id: c.id, raised: c.raised, goal: c.config.goal, balance: c.balance })),
    null,
    1,
  ),
);

const build = await post('/api/campaigns/demo-solar/soroban/build', { actor, action: 'contribute', amount: '1.5' });
if (!build.ok) {
  console.log('BUILD FAILED', build);
  process.exit(1);
}
console.log('BUILT hash', build.body.hash, 'fee', build.body.feeStroops, 'contract', build.body.contractId);
const tx = TransactionBuilder.fromXDR(build.body.xdr, Networks.TESTNET);
tx.sign(kp);
const submit = await post('/api/campaigns/demo-solar/soroban/submit', { actor, xdr: tx.toXDR() });
console.log('SUBMIT:', JSON.stringify(submit.body));
for (let i = 0; i < 12; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const st = await fetch(base + '/api/soroban/transactions/' + build.body.hash).then((r) => r.json());
  console.log('STATUS', st.status);
  if (st.status === 'SUCCESS' || st.status === 'FAILED') break;
}
const after = await fetch(base + '/api/campaigns?actor=' + actor).then((r) => r.json());
console.log(
  'AFTER:',
  JSON.stringify(
    after.campaigns?.map((c) => ({ id: c.id, raised: c.raised, balance: c.balance })),
    null,
    1,
  ),
);
