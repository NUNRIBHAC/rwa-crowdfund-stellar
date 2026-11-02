// Community API client: wallet-authenticated accounts, comments, news,
// support/feedback tickets, issuer applications and campaign metadata.
// Matches backend/src/community-routes.ts + accounts.ts on
// feature/community-platform. Same-origin requests; the bearer token is kept
// in localStorage (30-day server session) and never leaves this origin.

export type CommunityAccount = {
  publicKey: string;
  displayName: string | null;
  createdAt: number;
  totpEnabled: boolean;
  // 'email' accounts registered with email+password (throwaway identity
  // keypair server-side); 'wallet' is the classic challenge-response account.
  authMethod?: 'wallet' | 'email';
  // The owner's own address, only ever returned to the session owner.
  email?: string | null;
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

export type PodcastEpisode = {
  id: string;
  // Null for platform-wide episodes; set when tied to one campaign.
  campaignId: string | null;
  title: string;
  description: string;
  // External https audio URL only; the platform never hosts audio files.
  audioUrl: string;
  // Server honesty rule, same as news: episodes are published through the
  // admin/operator key as platform stand-in. Always show this label.
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

export type VerifyChallengeResult =
  { token: string; expiresAt: number; account: CommunityAccount; isOperator?: boolean } | { requiresTotp: true; ticket: string; expiresAt: number };

export const verifyChallenge = (publicKey: string, signature: string) => call<VerifyChallengeResult>('/api/auth/verify', { body: { publicKey, signature } });

// Email + password registration/login (backend email-auth.ts). Register and
// resend intentionally return the same anti-enumeration shape whether the
// address is new, unverified or already registered.
export const emailRegister = (email: string, password: string) =>
  call<{ status: 'verification-sent' }>('/api/auth/email/register', { body: { email, password } });

export const emailResend = (email: string) => call<{ status: 'verification-sent' }>('/api/auth/email/resend', { body: { email } });

export const emailVerify = (email: string, verificationToken: string) =>
  call<{ token: string; expiresAt: number; account: CommunityAccount; isOperator?: boolean }>('/api/auth/email/verify', {
    body: { email, token: verificationToken },
  });

export const emailLogin = (email: string, password: string) =>
  call<{ token: string; expiresAt: number; account: CommunityAccount; isOperator?: boolean }>('/api/auth/email/login', {
    body: { email, password },
  });

// Second factor: completes a gated login, or manages enrollment from the
// account security section. The enrollment secret is returned once, to the
// session owner only.
export const completeTotpLogin = (ticket: string, code: string) =>
  call<{ token: string; expiresAt: number; account: CommunityAccount; isOperator?: boolean }>('/api/auth/totp/complete', { body: { ticket, code } });

export const enrollTotp = (token: string) => call<{ otpauthUrl: string; manualKey: string }>('/api/auth/totp/enroll', { token, body: {} });

export const enableTotp = (token: string, code: string) => call<{ recoveryCodes: string[] }>('/api/auth/totp/enable', { token, body: { code } });

export const disableTotp = (token: string, code: string) => call<{ ok: boolean }>('/api/auth/totp/disable', { token, body: { code } });

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

// --- Post-funding reports (investor-scoped) ---
// Reports are published by operators only AFTER the campaign's on-chain
// deadline passes, and are readable only by wallets with a verified
// contribution history in that campaign (plus operators). The backend fails
// closed when entitlement cannot be verified, so 'unavailable' here means
// "temporarily cannot verify" - never "you are not an investor".
export type PostFundingReport = {
  id: string;
  campaignId: string;
  kind: 'funding_outcome' | 'use_of_proceeds' | 'milestone' | 'other';
  title: string;
  body: string;
  authorLabel: 'platform-demo';
  createdAt: number;
};

export type ReportsResult =
  { ok: true; reports: PostFundingReport[] } | { ok: false; reason: 'unauthenticated' | 'not-investor' | 'unknown-campaign' | 'unavailable'; message?: string };

export async function fetchReports(campaignId: string, token: string): Promise<ReportsResult> {
  if (!token) return { ok: false, reason: 'unauthenticated' };
  try {
    const r = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const v = (await r.json().catch(() => ({}))) as { reports?: PostFundingReport[]; error?: string };
    if (r.ok) return { ok: true, reports: v.reports ?? [] };
    if (r.status === 401) return { ok: false, reason: 'unauthenticated', message: v.error };
    if (r.status === 403) return { ok: false, reason: 'not-investor', message: v.error };
    if (r.status === 404) return { ok: false, reason: 'unknown-campaign', message: v.error };
    return { ok: false, reason: 'unavailable', message: v.error ?? `Request failed (${r.status})` };
  } catch (e) {
    return { ok: false, reason: 'unavailable', message: e instanceof Error ? e.message : String(e) };
  }
}

export const postOperatorReport = (token: string, campaignId: string, kind: PostFundingReport['kind'], title: string, body: string) =>
  call<{ report: PostFundingReport }>(`/api/operator/campaigns/${encodeURIComponent(campaignId)}/reports`, {
    body: { kind, title, body },
    token,
  });

// --- ECSPR Art. 21 appropriateness test + loss simulation (RTS 2022/2114) ---
// Data scopes are distinct by design: the knowledge test sends answers for
// server-side scoring (only the outcome is stored); the loss simulation
// computes CLIENT-SIDE and transmits ONLY the result figures (net worth +
// 10% capacity) - the income/asset/commitment inputs never leave the
// browser (RTS Art. 5(5) provider non-access rule). Quiz success never
// labels an investor sophisticated and is never presented as the Art.
// 21(1) appropriateness assessment.
// Full ECSPR Art. 21(2) / RTS 2022/2114 Art. 2 information set (v2).
// Banded/enumerated self-declarations with explicit 'none' options; an
// implementation choice, not a legally validated assessment.
export type AppropriatenessInformation = {
  familiarInvestmentTypes: string[];
  pastTransactions: {
    natures: string[];
    annualFrequencyBand: string;
    totalVolumeBandEur: string;
    periodYearsBand: string;
  };
  educationLevel: string;
  professionOrFormer: string | null;
  crowdfundingProfessionalExperience: boolean;
  holdingPeriod: string;
  riskProfile: string;
  sustainabilityPreference: string;
};

// ECSPR Annex II Section II request template (capture-only; no approval
// path exists, so a request never upgrades how the account is treated).
export type SophisticationRequest = {
  route: 'annex_ii_attestation' | 'mifid_professional_client';
  personType: 'natural' | 'legal' | null;
  attestedCriteria: string[];
  professionalClientProof: string | null;
  awarenessStatementAccepted: true;
  liabilityStatementAccepted: true;
  requestedAt: number;
};

export type AppropriatenessRecord = {
  publicKey: string;
  version: 1 | 2;
  experienceLevel: 'none' | 'some' | 'experienced';
  objective: 'capital_preservation' | 'income' | 'growth' | 'other';
  information: AppropriatenessInformation | null;
  categorisation: { status: 'non_sophisticated' | 'sophistication_requested'; request: SophisticationRequest | null };
  knowledgeScore: number;
  knowledgeTotal: number;
  outcome: 'knowledge_check_passed' | 'warning_issued';
  warningAcknowledgedAt: number | null;
  simulation: { netWorthEur: number; capacityEur: number; transmittedAt: number } | null;
  completedAt: number;
  reviewAssessmentDueAt: number;
  reviewSimulationDueAt: number | null;
};

export const fetchAppropriateness = (token: string) => call<{ record: AppropriatenessRecord | null }>('/api/auth/appropriateness', { token });
export const submitKnowledgeAssessment = (
  token: string,
  input: { experienceLevel: string; objective: string; answers: number[]; information?: AppropriatenessInformation },
) => call<{ record: AppropriatenessRecord }>('/api/auth/appropriateness/knowledge', { method: 'POST', body: input, token });
export const requestSophistication = (token: string, input: Omit<SophisticationRequest, 'requestedAt'>) =>
  call<{ record: AppropriatenessRecord }>('/api/auth/appropriateness/sophistication-request', { method: 'POST', body: input, token });
export const transmitSimulationResult = (token: string, input: { netWorthEur: number; capacityEur: number }) =>
  call<{ record: AppropriatenessRecord }>('/api/auth/appropriateness/simulation-result', { method: 'POST', body: input, token });
export const acknowledgeWarning = (token: string) =>
  call<{ record: AppropriatenessRecord }>('/api/auth/appropriateness/acknowledge-warning', { method: 'POST', body: {}, token });

// --- Podcast episodes (public; external https audio only) ---
export const fetchEpisodes = () => call<{ episodes: PodcastEpisode[] }>('/api/podcast/episodes');
export const fetchCampaignEpisodes = (campaignId: string) => call<{ episodes: PodcastEpisode[] }>(`/api/campaigns/${encodeURIComponent(campaignId)}/podcast`);

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
export const postOperatorEpisode = (token: string, input: { title: string; description: string; audioUrl: string; campaignId?: string | null }) =>
  call<{ episode: PodcastEpisode }>('/api/operator/podcast/episodes', { method: 'POST', body: input, token });

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
