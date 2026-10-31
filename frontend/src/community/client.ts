import { isConnected, requestAccess, signMessage } from '@stellar/freighter-api';

// Client for the community platform API (docs/community-api.md).
// Session = proof of wallet ownership via a signed one-time server challenge.
// The token lives in localStorage; it authenticates comments, tickets and
// applications. It is not a transaction credential and moves no funds.

export type SessionAccount = { publicKey: string; displayName: string | null };
export type Session = { token: string; expiresAt: number; account: SessionAccount };

const STORAGE_KEY = 'blockallisto.session';

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s.token || !s.expiresAt || s.expiresAt <= Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null): void {
  if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else localStorage.removeItem(STORAGE_KEY);
}

async function apiCall(path: string, opts: { method?: string; body?: unknown; token?: string } = {}) {
  const r = await fetch(path, {
    method: opts.method ?? (opts.body === undefined ? 'GET' : 'POST'),
    headers: {
      ...(opts.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const v = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((v as { error?: string }).error ?? 'API request failed');
  return v;
}

export async function loginWithFreighter(): Promise<Session> {
  const conn = await isConnected();
  if (!conn.isConnected) throw new Error('Freighter wallet extension not found. Install Freighter to sign in.');
  const access = await requestAccess();
  if (access.error || !access.address) throw new Error(access.error?.message ?? 'Wallet access was not granted.');
  const publicKey = access.address;
  const challenge = (await apiCall('/api/auth/challenge', { body: { publicKey } })) as { message: string };
  // signMessage returns a base64 string (v4+) or a Buffer (v3). The backend
  // verifies base64 Ed25519 over the exact UTF-8 challenge bytes.
  const signed = await signMessage(challenge.message, { address: publicKey });
  if (signed.error || !signed.signedMessage) throw new Error(signed.error?.message ?? 'The login message was not signed.');
  const signature = typeof signed.signedMessage === 'string' ? signed.signedMessage : bytesToBase64(signed.signedMessage);
  const session = (await apiCall('/api/auth/verify', { body: { publicKey, signature } })) as Session;
  saveSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const s = loadSession();
  if (s) await apiCall('/api/auth/logout', { method: 'POST', token: s.token }).catch(() => {});
  saveSession(null);
}

export async function setDisplayName(name: string): Promise<SessionAccount> {
  const s = requireSession();
  const v = (await apiCall('/api/auth/me', { method: 'PUT', body: { displayName: name }, token: s.token })) as {
    account: SessionAccount;
  };
  saveSession({ ...s, account: v.account });
  return v.account;
}

export function requireSession(): Session {
  const s = loadSession();
  if (!s) throw new Error('Sign in first.');
  return s;
}

export const communityApi = {
  listComments: (campaignId: string) => apiCall(`/api/campaigns/${campaignId}/comments`) as Promise<{ comments: PublicComment[] }>,
  addComment: (campaignId: string, body: string) =>
    apiCall(`/api/campaigns/${campaignId}/comments`, { body: { body }, token: requireSession().token }) as Promise<{ comment: PublicComment }>,
  listNews: (campaignId: string) => apiCall(`/api/campaigns/${campaignId}/news`) as Promise<{ news: NewsPost[] }>,
  metadata: (campaignId: string) => apiCall(`/api/campaigns/${campaignId}/metadata`) as Promise<{ metadata: CampaignMetadata | null }>,
  createTicket: (kind: 'support' | 'feedback', subject: string, body: string) =>
    apiCall('/api/support/tickets', { body: { kind, subject, body }, token: requireSession().token }),
  myTickets: () => apiCall('/api/support/tickets', { token: requireSession().token }),
  submitApplication: (input: Record<string, string>) => apiCall('/api/issuer-applications', { body: input, token: requireSession().token }),
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export type PublicComment = { id: string; campaignId: string; body: string; createdAt: number; author: string };
export type NewsPost = { id: string; campaignId: string; title: string; body: string; authorLabel: string; createdAt: number };
export type CampaignMetadata = {
  campaignId: string;
  industry: string;
  industryLabel: string;
  documents: { id: string; title: string; kind: string; url: string; demo: boolean }[];
};
