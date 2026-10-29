export type CampaignConfig = {
  creator: string;
  token: string;
  goal: string;
  deadline: string;
};

export type Campaign = {
  id: string;
  name: string;
  contractId: string;
  raised: string;
  balance: string | null;
  withdrawn: boolean;
  config: CampaignConfig;
};

export type Intent = {
  hash: string;
  xdr: string;
  campaign: string;
  actor: string;
  action: string;
  status: string;
  signedXdr?: string;
  amount?: string;
  feeStroops?: string;
  contractId?: string;
};

export const TERMINAL_STATUSES = ['SUCCESS', 'FAILED', 'CANCELLED_UNSIGNED'] as const;

export const isTerminal = (status: string) =>
  (TERMINAL_STATUSES as readonly string[]).includes(status);
