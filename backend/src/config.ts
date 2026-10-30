import 'dotenv/config';

export const NETWORK = process.env.STELLAR_NETWORK ?? 'testnet';
export const HORIZON_URL = process.env.HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
export const RPC_URL = process.env.RPC_URL ?? 'https://soroban-testnet.stellar.org';
export const PORT = Number(process.env.PORT ?? 4000);
export const PLATFORM_SECRET = process.env.PLATFORM_SECRET ?? '';
export const SOZU_FAUCET_URL = process.env.SOZU_FAUCET_URL ?? 'https://faucet.sozu.capital';

export const USDC = {
  code: 'USDC',
  issuer: process.env.USDC_ISSUER ?? '',
};

export const hasUsdcConfig = USDC.issuer.length > 0;
