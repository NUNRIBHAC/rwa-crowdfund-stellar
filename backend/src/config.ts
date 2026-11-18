import 'dotenv/config';

export const NETWORK = process.env.STELLAR_NETWORK ?? 'testnet';
export const HORIZON_URL = process.env.HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
export const RPC_URL = process.env.RPC_URL ?? 'https://soroban-testnet.stellar.org';
export const PORT = Number(process.env.PORT ?? 4000);
// Deploy identity: set at image build/activation time so a running container can
// be matched to the commit and image it was built from. Empty when unset, which
// means "unknown", never a guess.
export const BUILD_COMMIT = process.env.BUILD_COMMIT ?? '';
export const BUILD_IMAGE = process.env.BUILD_IMAGE ?? '';
export const PLATFORM_SECRET = process.env.PLATFORM_SECRET ?? '';
export const SOZU_FAUCET_URL = process.env.SOZU_FAUCET_URL ?? 'https://faucet.sozu.capital';

export const USDC = {
  code: 'USDC',
  issuer: process.env.USDC_ISSUER ?? '',
};

export const hasUsdcConfig = USDC.issuer.length > 0;
