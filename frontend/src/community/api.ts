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

export type CampaignRewardTier = {
  id: string;
  threshold: string;
  description: string;
  terms?: string;
  demo?: boolean;
};

export type CampaignMetadata = {
  campaignId: string;
  industry: string;
  industryLabel: string;
  documents: CampaignDocument[];
  rewards?: CampaignRewardTier[];
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
  call<{ token: string; expiresAt: number; account: CommunityAccount; isOperator?: boolean }>('/api/auth/verify', { body: { publicKey, signature } });

export const logout = (token: string) => call<{ ok: true }>('/api/auth/logout', { method: 'POST', body: {}, token });

export const fetchMe = (token: string) => call<{ account: CommunityAccount; isOperator?: boolean }>('/api/auth/me', { token });

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

// --- Owner-scoped notifications ---
// Server-generated from real events on the owner's own content only; kinds
// are stable so the UI renders localized titles while the body stays the
// server's English fallback (bodies embed dynamic project/subject text).
export type NotificationKind = 'application_received' | 'application_status' | 'comment_moderated' | 'ticket_closed' | 'company_received' | 'company_status';

export type CommunityNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  // Structured event vars for localized body templates; absent on rows
  // written before vars existed - fall back to title/body there.
  vars?: Record<string, string>;
  refId: string | null;
  createdAt: number;
  readAt: number | null;
};

export const fetchNotifications = (token: string) => call<{ notifications: CommunityNotification[]; unreadCount: number }>('/api/notifications', { token });

export const markNotificationRead = (token: string, id: string) =>
  call<{ ok: true }>(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST', body: {}, token });

export const markAllNotificationsRead = (token: string) => call<{ marked: number }>('/api/notifications/read-all', { method: 'POST', body: {}, token });

// --- Operator surface (demo admin dashboard; OPERATOR_WALLETS allow-list,
// wallet bearer auth, fail-closed server-side) ---
export const fetchOperatorApplications = (token: string) => call<{ applications: IssuerApplication[] }>('/api/operator/issuer-applications', { token });
export const setOperatorApplicationStatus = (token: string, id: string, status: string) =>
  call<{ ok: true }>(`/api/operator/issuer-applications/${encodeURIComponent(id)}/status`, { method: 'POST', body: { status }, token });
// Operator comment rows carry the moderation fields (raw author key, hidden
// state/reason), unlike the public CommunityComment author-label shape.
export type OperatorComment = {
  id: string;
  campaignId: string;
  publicKey: string;
  displayName: string | null;
  body: string;
  createdAt: number;
  hiddenAt: number | null;
  hiddenReason: string | null;
};
export const fetchOperatorComments = (token: string) => call<{ comments: OperatorComment[] }>('/api/operator/comments', { token });
export const setOperatorCommentHidden = (token: string, id: string, hidden: boolean, reason?: string) =>
  call<{ ok: true }>(`/api/operator/comments/${encodeURIComponent(id)}/${hidden ? 'hide' : 'unhide'}`, {
    method: 'POST',
    body: reason ? { reason } : {},
    token,
  });
export const fetchOperatorTickets = (token: string) => call<{ tickets: Ticket[] }>('/api/operator/tickets', { token });

// --- Operator read-only operations views ---
// Reconciliation compares this app's journal against the on-chain cumulative
// contribution counter. It is an operational debugging aid: no accounting,
// custody or compliance claim (the server repeats this in `semantics`).
export type CampaignReconciliation = {
  campaignId: string;
  onChainRaised: string | null;
  journalCovered: string;
  notJournalCovered: string | null;
  successContributes: number;
  successRefunds: number;
  successWithdraws: number;
  openIntentHashes: string[];
  failedIntents: number;
  notes: string[];
};
export type ReconciliationResponse = {
  generatedAt: string;
  network: string;
  semantics: string;
  campaigns: CampaignReconciliation[];
  quarantinedIntents: number;
};
export type AuditEntry = { id: string; at: number; actor: string; action: string; target: string; detail?: string };

export const fetchOperatorReconciliation = (token: string) => call<ReconciliationResponse>('/api/operator/reconciliation', { token });
export const fetchOperatorAuditLog = (token: string, limit = 100) =>
  call<{ audit: AuditEntry[] }>(`/api/operator/audit-log?limit=${Math.max(1, Math.min(500, Math.floor(limit)))}`, { token });
export const closeOperatorTicket = (token: string, id: string) =>
  call<{ ok: true }>(`/api/operator/tickets/${encodeURIComponent(id)}/close`, { method: 'POST', body: {}, token });
export const postOperatorNews = (token: string, campaignId: string, title: string, body: string) =>
  call<{ post: NewsPost }>(`/api/operator/campaigns/${encodeURIComponent(campaignId)}/news`, { method: 'POST', body: { title, body }, token });

// --- Support and feedback tickets ---
export const createTicket = (token: string, input: { kind: 'support' | 'feedback'; subject: string; body: string }) =>
  call<{ ticket: Ticket }>('/api/support/tickets', { body: input, token });

export const fetchMyTickets = (token: string) => call<{ tickets: Ticket[] }>('/api/support/tickets', { token });

// Company accounts: wallet-scoped applications for a company context. Review
// is manual (operator surface); registry fields are applicant-provided and no
// documents are uploaded or verified in this prototype.
export type CompanyApplication = {
  id: string;
  companyName: string;
  legalForm: string;
  registrationNumber: string;
  country: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  decidedAt: number | null;
};

export const fetchMyCompanies = (token: string) => call<{ companies: CompanyApplication[] }>('/api/companies/mine', { token });

export const applyForCompany = (token: string, input: { companyName: string; legalForm: string; registrationNumber: string; country: string }) =>
  call<{ company: CompanyApplication }>('/api/companies', { body: input, token });

// Session security: list and revoke the wallet account's own sessions. The id
// is a short non-secret prefix of the server-side token hash.
export type SessionInfo = { id: string; createdAt: number; expiresAt: number; current: boolean };

export const fetchSessions = (token: string) => call<{ sessions: SessionInfo[] }>('/api/auth/sessions', { token });

export const revokeSession = (token: string, id: string) => call<{ ok: true }>(`/api/auth/sessions/${encodeURIComponent(id)}`, { method: 'DELETE', token });

export const logoutOtherSessions = (token: string) => call<{ removed: number }>('/api/auth/logout-others', { method: 'POST', body: {}, token });

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
