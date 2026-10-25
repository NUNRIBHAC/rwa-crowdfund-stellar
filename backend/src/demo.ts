import {
    createCampaign,
    finalize,
    invest,
    seedDemoInvestors,
  } from './campaigns.js';
  import { getBalances } from './chain.js';
  import { requirePlatform } from './stellar.js';
  
  async function main(): Promise<void> {
    const amounts = [60, 30, 10];
    const { investors } = await seedDemoInvestors(amounts);
    console.log('Investidores demo:', investors.join(', '));
  
    const campaign = await createCampaign({ name: 'Solar Lisbon #1', goalUsdc: 100 });
    console.log(`Campaña ${campaign.id} (${campaign.code}) creador=${campaign.creatorPub} mint=${campaign.mintTx}`);
  
    const amounts2 = [60, 30, 10];
    for (let i = 0; i < amounts2.length && i < investors.length; i++) {
      const inv = await invest(campaign.id, { investorPub: investors[i], amountUsdc: amounts2[i] });
      const last = inv.investments[inv.investments.length - 1];
      console.log(
        `  ${investors[i].slice(0, 6)}… +${last.amountUsdc} USDC → +${last.tokens} tokens (usdc=${last.usdcTx} tokens=${last.tokenTx})`,
      );
    }
  
    const done = await finalize(campaign.id);
    console.log(`Finalizada ${campaign.id}: payout=${done.payoutTx}`);
  
    const platPub = requirePlatform().publicKey();
    for (const pub of [platPub, campaign.creatorPub, ...investors]) {
      const balances = await getBalances(pub);
      console.log(
        `${pub.slice(0, 6)}… → ${balances
          .map((b) => `${b.code}:${b.balance}`)
          .join(' | ')}`,
      );
    }
  }
  
  main().catch((err) => {
    console.error('Demo fallou:', err);
    process.exit(1);
  });  