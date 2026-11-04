import { describe, expect, it } from 'vitest';
import { accountReadActor } from './account-read-actor';
import type { CommunityAccount } from './community/api';

const wallet: CommunityAccount = { publicKey: 'wallet-session', displayName: null, createdAt: 1, totpEnabled: false, authMethod: 'wallet' };
describe('read-only account identity', () => {
  it('restores wallet records without claiming an extension is connected', () => {
    expect(accountReadActor('', wallet)).toBe('wallet-session');
  });
  it('keeps an explicitly connected wallet as the read scope', () => {
    expect(accountReadActor('connected-wallet', wallet)).toBe('connected-wallet');
  });
  it('never treats an email or legacy account identity as a wallet', () => {
    expect(accountReadActor('', { ...wallet, authMethod: 'email' })).toBe('');
    expect(accountReadActor('', { ...wallet, authMethod: undefined })).toBe('');
    expect(accountReadActor('', null)).toBe('');
  });
});
