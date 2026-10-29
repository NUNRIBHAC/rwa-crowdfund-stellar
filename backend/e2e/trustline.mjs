import { Asset, Horizon, Keypair, Networks, Operation, TransactionBuilder, BASE_FEE } from '@stellar/stellar-sdk';
const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const usdc = new Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
for (const secret of [process.env.S1, process.env.S2, process.env.S3]) {
  const kp = Keypair.fromSecret(secret);
  const acct = await server.loadAccount(kp.publicKey());
  const has = acct.balances.some(b => b.asset_code === 'USDC' && b.asset_issuer === usdc.issuer);
  if (has) { console.log(kp.publicKey(), 'trustline exists'); continue; }
  const tx = new TransactionBuilder(acct, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: usdc })).setTimeout(60).build();
  tx.sign(kp);
  const r = await server.submitTransaction(tx);
  console.log(kp.publicKey(), 'trustline added', r.hash);
}
