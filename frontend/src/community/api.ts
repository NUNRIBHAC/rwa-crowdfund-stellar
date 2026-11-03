import { localizedApiError, requestFailedMessage, storedLocale } from '../i18n';
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
  // 'email' accounts registered with email+password, 'social' via an OAuth
  // provider (both get a throwaway identity keypair server-side); 'wallet'
  // is the classic challenge-response account.
  authMethod?: 'wallet' | 'email' | 'social';
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
  status: 'received' | 'under_review' | 'approved' | 'rejected' | 'closed';
  reviewedBy: string | null;
  reviewedAt: number | null;
  reviewNote: string | null;
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

// API error with the backend's stable machine-readable code (when it sent
// one) so the UI can localize known failures instead of showing raw English
// server text. Unknown/absent code: the raw message is shown as-is.
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
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
  const v = (await r.json().catch(() => ({}))) as { error?: string; code?: string };
  if (!r.ok) {
    const local = localizedApiError(v.code);
    // Validation keeps its field detail (server text) after the localized lead.
    const detail = v.code === 'invalid_input' && v.error ? ` (${v.error.replace(/^invalid input: /, '')})` : '';
    throw new ApiError(local ? local + detail : (v.error ?? requestFailedMessage(r.status)), v.code);
  }
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

// Social account linking (backend social-auth.ts): POST with the
// method-appropriate step-up proof; the response carries the provider URL
// to navigate to. Completion returns to /account#social-linked=<provider>.
export const startSocialLink = (token: string, provider: string, proof: { password?: string; signature?: string }) =>
  call<{ url: string }>(`/api/auth/social/${encodeURIComponent(provider)}/link/start`, { token, body: proof });

// Email + password registration/login (backend email-auth.ts). Register and
// resend intentionally return the same anti-enumeration shape whether the
// address is new, unverified or already registered.
// The UI locale travels with mail-triggering calls so the backend can send
// the verification/reset email in the same language as the interface.
const uiLocale = (): string | undefined => storedLocale();

export const emailRegister = (email: string, password: string, turnstileToken?: string) =>
  call<{ status: 'verification-sent' }>('/api/auth/email/register', { body: { email, password, locale: uiLocale(), turnstileToken } });

export const emailResend = (email: string, turnstileToken?: string) =>
  call<{ status: 'verification-sent' }>('/api/auth/email/resend', { body: { email, locale: uiLocale(), turnstileToken } });

export const emailVerify = (email: string, verificationToken: string) =>
  call<{ token: string; expiresAt: number; account: CommunityAccount; isOperator?: boolean }>('/api/auth/email/verify', {
    body: { email, token: verificationToken },
  });

export const emailLogin = (email: string, password: string) =>
  call<VerifyChallengeResult>('/api/auth/email/login', {
    body: { email, password },
  });

// Password reset (backend email-auth.ts): same anti-enumeration response for
// unknown, unverified and verified addresses. A successful confirm revokes
// every existing session for the account.
export const emailResetRequest = (email: string, turnstileToken?: string) =>
  call<{ status: 'reset-sent' }>('/api/auth/email/reset-request', { body: { email, locale: uiLocale(), turnstileToken } });

export const emailResetConfirm = (email: string, resetToken: string, password: string) =>
  call<{ status: 'password-reset' }>('/api/auth/email/reset-confirm', { body: { email, token: resetToken, password } });

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

// --- Investment documents (investor-entitled, approved-only) ---
export type InvestmentDocumentMeta = {
  id: string;
  campaignId: string;
  title: string;
  kind: 'kiis' | 'terms' | 'project' | 'other';
  status: 'pending' | 'approved';
  demo: true;
  createdAt: number;
  approvedAt: number | null;
};

export const fetchInvestmentDocuments = (token: string, campaignId: string) =>
  call<{ documents: InvestmentDocumentMeta[]; demo: true }>(`/api/campaigns/${encodeURIComponent(campaignId)}/investment-documents`, {
    token,
  });

// Authorized download: fetches the file with the session bearer and hands a
// blob to the caller (no token in any URL).
export async function downloadInvestmentDocument(token: string, docId: string): Promise<{ blob: Blob; filename: string }> {
  const r = await fetch(`/api/investment-documents/${encodeURIComponent(docId)}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const v = (await r.json().catch(() => ({}))) as { error?: string; code?: string };
    throw new Error(localizedApiError(v.code) ?? v.error ?? requestFailedMessage(r.status));
  }
  const dispo = r.headers.get('content-disposition') ?? '';
  const m = /filename="([^"]+)"/.exec(dispo);
  return { blob: await r.blob(), filename: m?.[1] ?? `${docId}.txt` };
}

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
    const v = (await r.json().catch(() => ({}))) as { reports?: PostFundingReport[]; error?: string; code?: string };
    if (r.ok) return { ok: true, reports: v.reports ?? [] };
    const text = localizedApiError(v.code) ?? v.error;
    if (r.status === 401) return { ok: false, reason: 'unauthenticated', message: text };
    if (r.status === 403) return { ok: false, reason: 'not-investor', message: text };
    if (r.status === 404) return { ok: false, reason: 'unknown-campaign', message: text };
    return { ok: false, reason: 'unavailable', message: text ?? requestFailedMessage(r.status) };
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
export const setOperatorApplicationStatus = (token: string, id: string, status: string, note?: string) =>
  call<{ ok: true }>(`/api/operator/issuer-applications/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: note ? { status, note } : { status },
    token,
  });
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
  noteCodes?: string[];
  noteParams?: Record<string, string>[];
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

// --- Operator campaign deployment (testnet; wallet-signed two-step flow) ---
// Build returns an unsigned single-operation envelope (reviewed Wasm upload,
// then instance creation); the wallet signs; submit broadcasts and, for the
// create step, returns a registry entry the operator adds to
// SOROBAN_CAMPAIGNS_JSON by hand. The server never edits the registry.
export type CampaignDeployBuild = {
  hash: string;
  xdr: string;
  networkPassphrase: string;
  action: 'deploy';
  contractSet?: 'v1' | 'v2';
  // v1: 'upload' | 'create'. v2: 'upload-token' | 'upload-offering' |
  // 'create-token' | 'create-offering' | 'set-minter'.
  step: string;
  id: string;
  name: string;
  feeStroops: string;
  testOnly: boolean;
};
export type CampaignDeploySubmit = {
  hash: string;
  status: string;
  confirmed: boolean;
  contractSet?: 'v1' | 'v2';
  step: string;
  contractId?: string;
  complete?: boolean;
  tokenContractId?: string;
  offeringContractId?: string;
  registryEntry?: { id: string; name: string; contractId?: string; contractSet?: string; tokenContractId?: string; offeringContractId?: string };
  note?: string;
  message?: string;
  testOnly?: boolean;
};
export type CampaignDeployV2Params = { symbol: string; decimals: number; minPerInvestor: string; maxPerInvestor: string };
export const buildCampaignDeploy = (
  token: string,
  input: { id: string; name: string; goal: string; deadline: number; contractSet?: 'v1' | 'v2'; v2?: CampaignDeployV2Params },
) => call<CampaignDeployBuild>('/api/operator/campaign-deploy/build', { method: 'POST', body: input, token });
export const submitCampaignDeploy = (token: string, input: { xdr: string; name?: string; contractSet?: 'v1' | 'v2' }) =>
  call<CampaignDeploySubmit>('/api/operator/campaign-deploy/submit', { method: 'POST', body: input, token });

// Identity-only providers (Telegram): the provider proved who you are but not
// an email. The ticket from #social-email is bound server-side to this
// browser (httpOnly cookie) and needs a mailed 6-digit code to finish.
export const requestSocialEmailCode = (ticket: string, email: string) =>
  call<{ status: 'code-sent' }>('/api/auth/social/email/request', { body: { ticket, email } });

export const confirmSocialEmailCode = (ticket: string, code: string) =>
  call<{ token: string; expiresAt: number; account: CommunityAccount; isOperator?: boolean; totpTicket?: string }>('/api/auth/social/email/confirm', {
    body: { ticket, code },
  });

// Sign In With Farcaster. The relay (relay.farcaster.xyz) carries the signed
// message from the user's Farcaster app back to this browser; the BACKEND
// verifies it against a server-issued, browser-bound nonce and our domain.
export const farcasterNonce = (turnstileToken?: string) =>
  call<{ nonce: string; domain: string; siweUri: string }>('/api/auth/farcaster/nonce', { body: turnstileToken ? { turnstileToken } : {} });

export const farcasterVerify = (nonce: string, message: string, signature: string) =>
  call<{ token?: string; expiresAt: number; account?: CommunityAccount; totpTicket?: string; socialEmailTicket?: string; isOperator?: boolean }>(
    '/api/auth/farcaster/verify',
    {
      body: { nonce, message, signature },
    },
  );

const FARCASTER_RELAY = 'https://relay.farcaster.xyz/v1';
export const farcasterCreateChannel = async (nonce: string, domain: string, siweUri: string) => {
  const r = await fetch(`${FARCASTER_RELAY}/channel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce, domain, siweUri }),
  });
  const j = (await r.json().catch(() => ({}))) as { channelToken?: string; url?: string };
  if (!r.ok || typeof j.channelToken !== 'string' || typeof j.url !== 'string' || !/^https:\/\//.test(j.url))
    throw new ApiError('Farcaster relay unavailable', 'social_exchange_failed');
  return { channelToken: j.channelToken, url: j.url };
};
export const farcasterChannelStatus = async (channelToken: string) => {
  const r = await fetch(`${FARCASTER_RELAY}/channel/status`, { headers: { Authorization: `Bearer ${channelToken}`, 'Content-Type': 'application/json' } });
  const j = (await r.json().catch(() => ({}))) as { state?: string; message?: string; signature?: string };
  return { state: r.ok ? (j.state ?? 'pending') : 'error', message: j.message, signature: j.signature };
};

export const farcasterLinkNonce = (token: string, proof: { password?: string; signature?: string }) =>
  call<{ nonce: string; domain: string; siweUri: string }>('/api/auth/farcaster/link/nonce', { token, body: proof });

// Corporate actions (prototype): operator-session cap table and distribution
// preview. Read-only; nothing is saved, no funds move, never declarable.
export type CapTableRow = {
  confirmedCashflow?: { contributed: string; refunded: string; net: string; missing: number };
  publicKey: string;
  position: string;
  positionSource: 'on-chain' | 'journal-intended' | 'unknown';
  basisPoints: number | null;
  note?: string;
};
export type CapTableResponse = {
  campaignId: string;
  knownBase: string;
  holdersKnown: number;
  holdersUnknown: number;
  complete: boolean;
  basis: { onChain: number; journalIntended: number; unknown: number; mixed: boolean };
  rows: CapTableRow[];
};
export type DistributionPreviewResponse = {
  status: 'illustration' | 'unavailable';
  unavailableReason?: string;
  declarable: false;
  total: string;
  excludedUnknownHolderCount: number;
  rows: { publicKey: string; position: string; amount: string }[];
  notice: string;
};
export const fetchOperatorCapTable = (token: string, campaignId: string) =>
  call<CapTableResponse>(`/api/operator/campaigns/${encodeURIComponent(campaignId)}/corporate-actions/cap-table`, { token });
export const postOperatorDistributionPreview = (token: string, campaignId: string, total: string) =>
  call<DistributionPreviewResponse>(`/api/operator/campaigns/${encodeURIComponent(campaignId)}/corporate-actions/distribution-preview`, {
    token,
    body: { total },
  });

export type DemoOnboardingResponse = {
  progress: { identity: 'not_started' | 'pending' | 'passed' | 'rejected'; risksAcknowledged: boolean; updatedAt: number };
  assessmentSaved: boolean;
  assessmentCurrent: boolean;
  warningReady: boolean;
  eligibility: 'demo_incomplete' | 'demo_blocked' | 'demo_ready';
  demo: true;
  realInvestmentEligible: false;
  realIdentityVerified: false;
};
export const fetchDemoOnboarding = (token: string) => call<DemoOnboardingResponse>('/api/auth/demo-onboarding', { token });
export const saveDemoOnboarding = (token: string, body: Pick<DemoOnboardingResponse['progress'], 'identity' | 'risksAcknowledged'>) =>
  call<DemoOnboardingResponse>('/api/auth/demo-onboarding', { token, method: 'PUT', body });
