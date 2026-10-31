// Community API client: wallet-authenticated accounts, comments, news,
// support/feedback tickets, issuer applications and campaign metadata.
// Matches backend/src/community-routes.ts + accounts.ts on
// feature/community-platform. Same-origin requests; the bearer token is kept
// in localStorage (30-day server session) and never leaves this origin.

export type CommunityAccount = {
  publicKey: string;
  displayName: string | null;
  createdAt: number;
};

// Wire shape is backend PublicComment (community.ts): the server already
// resolves the author label (display name or shortened key) and never exposes
// publicKey/displayName/hidden fields on this endpoint.
export type CommunityComment = {
  id: string;
  campaignId: string;
  body: string;
  createdAt: number;
  author: string;
};

export type NewsPost = {
  id: string;
  campaignId: string;
  title: string;
  body: string;
  // Server honesty rule: news are posted through the admin key as issuer
  // stand-in; there is no verified issuer identity. Always show this label.
  authorLabel: 'platform-demo';
  createdAt: number;
};

export type Ticket = {
  id: string;
  kind: 'support' | 'feedback';
  publicKey: string;
  subject: string;
  body: string;
  status: 'open' | 'closed';
  createdAt: number;
  closedAt: number | null;
};

export type IssuerApplication = {
  id: string;
  publicKey: string;
  projectName: string;
  country: string;
  instrumentType: string;
  targetAmount: string;
  description: string;
  contactEmail: string | null;
  status: 'received' | 'under_review' | 'closed';
  createdAt: number;
};

export type CampaignDocument = {
  id: string;
  title: string;
  kind: 'kiis' | 'terms' | 'project' | 'other';
  url: string;
  demo: boolean;
};

export type CampaignMetadata = {
  campaignId: string;
  industry: string;
  industryLabel: string;
  documents: CampaignDocument[];
};

// Server-side input limits (backend/src/community.ts LIMITS + accounts.ts).
export const COMMUNITY_LIMITS = {
  displayName: 40,
  commentBody: 1000,
  ticketSubject: 120,
  ticketBody: 4000,
  applicationField: 200,
  applicationDescription: 4000,
} as const;

const TOKEN_KEY = 'blockallisto-community-token';

export function loadCommunityToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveCommunityToken(token: string) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable: the session lives in memory only.
  }
}

async function call<T>(url: string, opts: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const r = await fetch(url, {
    method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const v = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(v.error ?? `Request failed (${r.status})`);
  return v as T;
}

// --- Auth ---
export const requestChallenge = (publicKey: string) =>
  call<{ message: string; expiresAt: number }>('/api/auth/challenge', {
    body: { publicKey },
  });

export const verifyChallenge = (publicKey: string, signature: string) =>
  call<{ token: string; expiresAt: number; account: CommunityAccount }>('/api/auth/verify', { body: { publicKey, signature } });

export const logout = (token: string) => call<{ ok: true }>('/api/auth/logout', { method: 'POST', body: {}, token });

export const fetchMe = (token: string) => call<{ account: CommunityAccount }>('/api/auth/me', { token });

export const updateDisplayName = (token: string, displayName: string) =>
  call<{ account: CommunityAccount }>('/api/auth/me', {
    method: 'PUT',
    body: { displayName },
    token,
  });

// --- Campaign metadata / documents ---
export const fetchCampaignMetadata = (campaignId: string) =>
  call<{ metadata: CampaignMetadata | null }>(`/api/campaigns/${encodeURIComponent(campaignId)}/metadata`);

// --- Comments ---
export const fetchComments = (campaignId: string) => call<{ comments: CommunityComment[] }>(`/api/campaigns/${encodeURIComponent(campaignId)}/comments`);

export const postComment = (token: string, campaignId: string, body: string) =>
  call<{ comment: CommunityComment }>(`/api/campaigns/${encodeURIComponent(campaignId)}/comments`, { body: { body }, token });

// --- News (read-only for users; posting is admin-key only) ---
// Backend shape note: this endpoint returns { news: [...] } (not posts) -
// verified against backend/src/community-routes.ts; a regression test pins it.
export const fetchNews = (campaignId: string) => call<{ news: NewsPost[] }>(`/api/campaigns/${encodeURIComponent(campaignId)}/news`);

// --- Site-wide news feed (public) ---
export const fetchNewsFeed = () => call<{ news: NewsPost[] }>('/api/news');

// --- Support and feedback tickets ---
export const createTicket = (token: string, input: { kind: 'support' | 'feedback'; subject: string; body: string }) =>
  call<{ ticket: Ticket }>('/api/support/tickets', { body: input, token });

export const fetchMyTickets = (token: string) => call<{ tickets: Ticket[] }>('/api/support/tickets', { token });

// --- Issuer applications ---
export const fetchMyApplications = (token: string) => call<{ applications: IssuerApplication[] }>('/api/issuer-applications', { token });

// --- Own activity (account dashboard feed) ---
export type OwnComment = CommunityComment & { hidden: boolean };

export const fetchMyComments = (token: string) => call<{ comments: OwnComment[] }>('/api/comments/mine', { token });

export const submitIssuerApplication = (
  token: string,
  input: {
    projectName: string;
    country: string;
    instrumentType: string;
    targetAmount: string;
    description: string;
    contactEmail?: string;
  },
) =>
  call<{ application: IssuerApplication }>('/api/issuer-applications', {
    body: input,
    token,
  });
