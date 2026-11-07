// Local-only authenticated rehearsal client. Never imported by the hosted app.
export type Distribution = {
  id: string;
  campaignId: string;
  mode: 'test_only';
  legalEffect: false;
  state: 'draft' | 'approved' | 'dispatching' | 'simulated' | 'unknown' | 'cancelled';
  total: string;
  snapshotHash: string;
  preparedBy: string;
  reviewedBy?: string;
  rows: { publicKey: string; amount: string }[];
  receipts: { publicKey: string; amount: string; reference: string }[];
  audit: { actor: string; at: number; event: string; reason?: string }[];
};
export type Meeting = {
  id: string;
  campaignId: string;
  title: string;
  resolution: string;
  state: 'draft' | 'open' | 'closed' | 'cancelled';
  simulation: true;
  legalEffect: false;
  binding: false;
  participationBasis: string;
  participantCount: number;
  castCount: number;
  totals: { for: number; against: number; abstain: number } | null;
  ownChoice: string | null;
  canParticipate: boolean;
  audit?: { actor: string; at: number; event: string }[];
};
export async function rehearsalRequest<T>(token: string, path: string, body?: unknown): Promise<T> {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) throw Error('Rehearsal is restricted to a loopback development origin');
  if (!token || !/^\/(?:campaigns|distributions|meetings)(?:\/|$)/.test(path)) throw Error('Authenticated local rehearsal required');
  const response = await fetch(`/local-rehearsal${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    cache: 'no-store',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw Error(`Rehearsal request rejected (${response.status}); refresh state before another action`);
  const value = await response.json();
  if (value?.legalEffect !== false || !(value?.mode === 'test_only' || (value?.simulation === true && value?.binding === false)))
    throw Error('Non-rehearsal response refused');
  return value as T;
}
