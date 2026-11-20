import { Asset, Horizon, Keypair, Networks, Operation, TransactionBuilder, BASE_FEE } from '@stellar/stellar-sdk';

// This script SUBMITS trustline transactions to the Stellar testnet. Refuse
// to run without the explicit opt-in confirming that exact target.
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
if (process.env.E2E_SUBMIT_OPT_IN !== '1') {
  console.error(`Refusing to submit: set E2E_SUBMIT_OPT_IN=1 to confirm the target ${HORIZON_URL} (testnet trustlines).`);
  process.exit(2);
}
const server = new Horizon.Server(HORIZON_URL);
const usdc = new Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
for (const secret of [process.env.S1, process.env.S2, process.env.S3]) {
  const kp = Keypair.fromSecret(secret);
  const acct = await server.loadAccount(kp.publicKey());
  const has = acct.balances.some((b) => b.asset_code === 'USDC' && b.asset_issuer === usdc.issuer);
  if (has) {
    console.log(kp.publicKey(), 'trustline exists');
    continue;
  }
  const tx = new TransactionBuilder(acct, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: usdc }))
    .setTimeout(60)
    .build();
  tx.sign(kp);
  const r = await server.submitTransaction(tx);
  console.log(kp.publicKey(), 'trustline added', r.hash);
}
