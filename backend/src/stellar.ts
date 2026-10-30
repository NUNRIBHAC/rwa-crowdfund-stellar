import { Horizon, Keypair, Networks } from '@stellar/stellar-sdk';
import { HORIZON_URL, NETWORK, PLATFORM_SECRET } from './config.js';

export const server = new Horizon.Server(HORIZON_URL);

export const networkPassphrase = NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET;

export const platform = PLATFORM_SECRET ? Keypair.fromSecret(PLATFORM_SECRET) : null;

export function requirePlatform(): Keypair {
  if (!platform) {
    throw new Error('PLATFORM_SECRET not configured (backend/.env)');
  }
  return platform;
}
