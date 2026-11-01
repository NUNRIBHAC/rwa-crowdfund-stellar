import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import type {
  CompanyApplication,
  Account,
  Comment,
  CommunityStore,
  IssuerApplication,
  NewsPost,
  PodcastEpisode,
  AppropriatenessRecord,
  Notification,
  NotificationKind,
  Ticket,
  AuditEntry,
} from './community-store.js';
import { FileCommunityStore, PostgresCommunityStore } from './community-store.js';
import { RateLimiter } from './ratelimit.js';

// Community and support features for the demo platform: campaign comments,
// campaign news, support/feedback tickets and issuer applications.
//
// Security and privacy posture (reviewed before deployment):
//  - Writes require a wallet-login session (accounts.ts); there is no
//    anonymous write path. Auth proves key ownership only, never identity.
//  - Ownership: users see only their own tickets/applications. Admin reads
//    and moderation sit behind the existing x-admin-key gate (demo-grade
//    shared secret; production needs real admin identities).
//  - Abuse: per-account and per-IP sliding-window rate limits, strict length
//    caps, no HTML rendering contract (clients must render as plain text),
//    no links in display names.
//  - Data minimization: no email, name or IP is persisted beyond the
//    submitted content itself; display name is optional.
//  - Retention: tickets and issuer applications are hard-deleted after
//    COMMUNITY_RETENTION_DAYS (default 90); hidden comments after 30 days;
//    expired challenges and sessions are pruned. pruneCommunity runs on boot
//    and hourly.
//  - Errors are safe JSON {error} strings; internals are never returned.

export class CommunityError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const LIMITS = {
  campaignId: /^[a-z0-9][a-z0-9-]{0,63}$/,
  commentBody: 1000,
  ticketSubject: 120,
  ticketBody: 4000,
  applicationField: 200,
  applicationDescription: 4000,
  newsTitle: 160,
  newsBody: 4000,
  commentsPage: 100,
  notificationsPage: 50,
  notificationsPerAccount: 100,
};

const commentInput = z.object({
  body: z.string().min(1).max(LIMITS.commentBody),
});
const ticketInput = z.object({
  kind: z.enum(['support', 'feedback']),
  subject: z.string().trim().min(1).max(LIMITS.ticketSubject),
  body: z.string().trim().min(1).max(LIMITS.ticketBody),
});
const applicationInput = z.object({
  projectName: z.string().trim().min(1).max(LIMITS.applicationField),
  country: z.string().trim().min(1).max(LIMITS.applicationField),
  instrumentType: z.string().trim().min(1).max(LIMITS.applicationField),
  targetAmount: z.string().trim().min(1).max(LIMITS.applicationField),
  description: z.string().trim().min(1).max(LIMITS.applicationDescription),
  contactEmail: z.union([z.literal(''), z.string().trim().email().max(LIMITS.applicationField)]).optional(),
});
const companyInput = z.object({
  companyName: z.string().trim().min(1).max(LIMITS.applicationField),
  legalForm: z.string().trim().min(1).max(120),
  registrationNumber: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
});
const newsInput = z.object({
  title: z.string().trim().min(1).max(LIMITS.newsTitle),
  body: z.string().trim().min(1).max(LIMITS.newsBody),
});

const episodeInput = z.object({
  title: z.string().trim().min(1).max(LIMITS.newsTitle),
  description: z.string().trim().min(1).max(LIMITS.newsBody),
  // External https audio URL only: the platform does not host audio files.
  // The URL must parse and use https; anything else is rejected.
  audioUrl: z
    .string()
    .trim()
    .max(500)
    .url()
    .refine((u) => u.startsWith('https://'), { message: 'audioUrl must use https' }),
  campaignId: z.string().trim().regex(LIMITS.campaignId).nullish(),
});

// ECSPR Art. 21 / RTS 2022/2114 appropriateness flow inputs. Knowledge-test
// answers are scored and then discarded (only the outcome is stored);
// simulation transmits ONLY the result (net worth + 10% capacity), never the
// income/asset/commitment breakdown (RTS Art. 5(5) provider non-access).
const knowledgeInput = z
  .object({
    experienceLevel: z.enum(['none', 'some', 'experienced']),
    objective: z.enum(['capital_preservation', 'income', 'growth', 'other']),
    answers: z.array(z.number().int().min(0)).min(1).max(50),
  })
  .strict();
// .strict(): any financial input field (income, assets, commitments
// breakdown) sent by a client is REJECTED, not silently stripped - the
// server structurally cannot receive the simulation inputs (RTS Art. 5(5)).
const simulationResultInput = z
  .object({
    netWorthEur: z.number().finite().min(0).max(1_000_000_000),
    capacityEur: z.number().finite().min(0).max(100_000_000),
  })
  .strict();

// Demo knowledge test (synthetic content, marked demo in the UI). Scope
// follows RTS 2022/2114 Art. 1: risks of investing in general plus risks of
// crowdfunding services specifically. The server scores; raw answers are
// never stored.
export const KNOWLEDGE_QUESTIONS: { id: string; correct: number }[] = [
  { id: 'lose-all', correct: 0 }, // "Can you lose the entirety of the money invested?" -> yes
  { id: 'deposit-guarantee', correct: 1 }, // covered by deposit guarantee schemes? -> no
  { id: 'liquidity', correct: 1 }, // easily resold at any time? -> no
  { id: 'default-risk', correct: 0 }, // early-stage loans riskier than listed bonds? -> yes
  { id: 'diversification', correct: 0 }, // spreading investments reduces risk? -> yes
];
const KNOWLEDGE_PASS = 4; // of 5; below this ECSPR Art. 21(4) warning path applies

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

export function requireCampaignId(id: unknown): string {
  if (typeof id !== 'string' || !LIMITS.campaignId.test(id)) throw new CommunityError(400, 'invalid campaign id');
  return id;
}

export type PublicComment = Pick<Comment, 'id' | 'campaignId' | 'body' | 'createdAt'> & { author: string };

// An owner's own comment, including moderation state they are entitled to see.
export type OwnComment = PublicComment & { hidden: boolean };

function publicComment(c: Comment): PublicComment {
  return {
    id: c.id,
    campaignId: c.campaignId,
    body: c.body,
    createdAt: c.createdAt,
    // Never expose the full wallet key; display name if set, else a hint.
    author: c.displayName ?? `${c.publicKey.slice(0, 4)}…${c.publicKey.slice(-4)}`,
  };
}

export class CommunityService {
  readonly limiter = new RateLimiter();
  constructor(
    public readonly store: CommunityStore,
    private opts: { retentionDays: number; now?: () => number } = {
      retentionDays: 90,
    },
  ) {}
  private now(): number {
    return this.opts.now?.() ?? Date.now();
  }

  checkRate(key: string, limit: number, windowMs: number): void {
    if (!this.limiter.allow(key, limit, windowMs)) throw new CommunityError(429, 'rate limit exceeded; slow down and retry later');
  }

  async listComments(campaignId: string): Promise<PublicComment[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.comments)
      .filter((c) => c.campaignId === campaignId && !c.hiddenAt)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, LIMITS.commentsPage)
      .map(publicComment);
  }

  async addComment(campaignId: string, account: Account, input: unknown, ip?: string): Promise<PublicComment> {
    requireCampaignId(campaignId);
    const { body } = commentInput.parse(input ?? {});
    this.checkRate(`comment:${account.publicKey}`, 10, 60 * 60 * 1000);
    if (ip) this.checkRate(`comment-ip:${ip}`, 30, 60 * 60 * 1000);
    const now = this.now();
    const comment: Comment = {
      id: newId('cmt'),
      campaignId,
      publicKey: account.publicKey,
      displayName: account.displayName,
      body,
      createdAt: now,
      hiddenAt: null,
      hiddenReason: null,
    };
    await this.store.change((state) => {
      state.comments[comment.id] = comment;
    });
    return publicComment(comment);
  }

  async listNews(campaignId: string): Promise<NewsPost[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.news)
      .filter((n) => n.campaignId === campaignId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, LIMITS.commentsPage);
  }

  // Admin-gated at the router. News are platform stand-in posts for the demo
  // campaign: the author label is fixed so readers are never misled into
  // thinking a verified issuer published them.
  async addNews(campaignId: string, input: unknown, actor = 'admin-area'): Promise<NewsPost> {
    requireCampaignId(campaignId);
    const { title, body } = newsInput.parse(input ?? {});
    const post: NewsPost = {
      id: newId('news'),
      campaignId,
      title,
      body,
      authorLabel: 'platform-demo',
      createdAt: this.now(),
    };
    await this.store.change((state) => {
      state.news[post.id] = post;
    });
    await this.recordAudit(actor, 'news.post', post.id, `campaign=${campaignId} title=${post.title}`);
    return post;
  }

  // Podcast episodes. Admin/operator-gated at the router, same honesty
  // posture as news: the author label is fixed 'platform-demo' because there
  // is no verified issuer identity. Audio is never hosted by the platform;
  // only an external https URL is stored. Metadata-only entries (no audioUrl)
  // are refused by episodeInput, so no fake episodes can be published.
  async addEpisode(input: unknown, actor = 'admin-area'): Promise<PodcastEpisode> {
    const { title, description, audioUrl, campaignId } = episodeInput.parse(input ?? {});
    if (campaignId) requireCampaignId(campaignId);
    const episode: PodcastEpisode = {
      id: newId('ep'),
      campaignId: campaignId ?? null,
      title,
      description,
      audioUrl,
      authorLabel: 'platform-demo',
      createdAt: this.now(),
    };
    await this.store.change((state) => {
      state.episodes[episode.id] = episode;
    });
    await this.recordAudit(actor, 'podcast.publish', episode.id, `campaign=${episode.campaignId ?? 'platform'} title=${episode.title}`);
    return episode;
  }

  // Latest episodes across the platform, newest first. Episodes are public
  // (same visibility as news); the podcast page and campaign tabs read
  // through these.
  async listEpisodes(limit = 20): Promise<PodcastEpisode[]> {
    const state = await this.store.read();
    return Object.values(state.episodes)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.min(Math.max(limit, 1), 50));
  }

  async listCampaignEpisodes(campaignId: string): Promise<PodcastEpisode[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.episodes)
      .filter((e) => e.campaignId === campaignId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // --- ECSPR Art. 21 appropriateness test + loss simulation (RTS 2022/2114) ---
  // Synthetic QA scope: the flow is fully implemented, but it is demo
  // infrastructure; no live sensitive-data collection and no real-money
  // gating until activation is separately approved. Every account is treated
  // as non-sophisticated: quiz success never labels sophistication (that
  // requires ECSPR Art. 2(1)(j) + Annex II, not implemented).

  async getAppropriateness(account: Account): Promise<AppropriatenessRecord | null> {
    const state = await this.store.read();
    return state.appropriateness[account.publicKey] ?? null;
  }

  // Knowledge test + self-declared experience/objectives (Art. 21(1)-(2)).
  // Scored server-side; answers are used for scoring and then dropped.
  async submitKnowledgeAssessment(account: Account, input: unknown): Promise<AppropriatenessRecord> {
    const { experienceLevel, objective, answers } = knowledgeInput.parse(input ?? {});
    if (answers.length !== KNOWLEDGE_QUESTIONS.length) throw new CommunityError(400, `expected ${KNOWLEDGE_QUESTIONS.length} answers`);
    let score = 0;
    answers.forEach((a, i) => {
      if (a === KNOWLEDGE_QUESTIONS[i].correct) score += 1;
    });
    const outcome: AppropriatenessRecord['outcome'] = score >= KNOWLEDGE_PASS ? 'appropriate' : 'warning_issued';
    const now = this.now();
    const record: AppropriatenessRecord = {
      publicKey: account.publicKey,
      version: 1,
      experienceLevel,
      objective,
      knowledgeScore: score,
      knowledgeTotal: KNOWLEDGE_QUESTIONS.length,
      outcome,
      // A retake starts a new warning cycle: any prior acknowledgment is
      // reset so the Art. 21(4) warning must be expressly acknowledged again.
      warningAcknowledgedAt: null,
      simulation: null,
      completedAt: now,
      reviewAssessmentDueAt: now + 2 * 365 * 24 * 60 * 60 * 1000,
      reviewSimulationDueAt: null,
    };
    await this.store.change((state) => {
      // Preserve a previously transmitted simulation across a retake; its
      // yearly review date stands on its own cycle (Art. 21(6)).
      const prev = state.appropriateness[account.publicKey];
      if (prev?.simulation) {
        record.simulation = prev.simulation;
        record.reviewSimulationDueAt = prev.reviewSimulationDueAt;
      }
      state.appropriateness[account.publicKey] = record;
    });
    await this.recordAudit(
      `account:${account.publicKey}`,
      'appropriateness.assess',
      account.publicKey,
      `score=${score}/${KNOWLEDGE_QUESTIONS.length} outcome=${outcome}`,
    );
    return record;
  }

  // Transmitted simulation result (RTS Art. 12). Only the two result
  // figures arrive here; the input breakdown never leaves the investor's
  // browser (RTS Art. 5(5): the provider must not access or record the
  // inputs or interfere with the result - our implementation computes
  // client-side as the chosen way to meet that rule).
  async transmitSimulationResult(account: Account, input: unknown): Promise<AppropriatenessRecord> {
    const { netWorthEur, capacityEur } = simulationResultInput.parse(input ?? {});
    // Capacity is 10% of net worth (Art. 21(5)); tolerate 1 cent rounding.
    if (Math.abs(capacityEur - netWorthEur * 0.1) > 0.01)
      throw new CommunityError(400, 'capacityEur must equal 10% of netWorthEur (rounding to cents tolerated)');
    const now = this.now();
    const record = await this.store.change((state) => {
      const rec = state.appropriateness[account.publicKey];
      if (!rec) throw new CommunityError(409, 'complete the knowledge assessment before transmitting a simulation result');
      rec.simulation = { netWorthEur, capacityEur, transmittedAt: now };
      rec.reviewSimulationDueAt = now + 365 * 24 * 60 * 60 * 1000;
      return rec;
    });
    await this.recordAudit(`account:${account.publicKey}`, 'appropriateness.simulation', account.publicKey, `capacity=${capacityEur}`);
    return record;
  }

  // Art. 21(4): the risk warning must be expressly acknowledged. Only
  // meaningful on the warning path; acknowledging an 'appropriate' outcome
  // is a no-op error so the UI state machine stays honest.
  async acknowledgeWarning(account: Account): Promise<AppropriatenessRecord> {
    const record = await this.store.change((state) => {
      const rec = state.appropriateness[account.publicKey];
      if (!rec) throw new CommunityError(409, 'no assessment on record');
      if (rec.outcome !== 'warning_issued') throw new CommunityError(409, 'no risk warning is pending acknowledgment');
      if (rec.warningAcknowledgedAt) throw new CommunityError(409, 'risk warning already acknowledged');
      rec.warningAcknowledgedAt = this.now();
      return rec;
    });
    await this.recordAudit(`account:${account.publicKey}`, 'appropriateness.warning_ack', account.publicKey, 'art21(4) warning acknowledged');
    return record;
  }

  async createTicket(account: Account, input: unknown): Promise<Ticket> {
    const parsed = ticketInput.parse(input ?? {});
    this.checkRate(`ticket:${account.publicKey}`, 5, 24 * 60 * 60 * 1000);
    const ticket: Ticket = {
      id: newId('tkt'),
      kind: parsed.kind,
      publicKey: account.publicKey,
      subject: parsed.subject,
      body: parsed.body,
      status: 'open',
      createdAt: this.now(),
      closedAt: null,
    };
    await this.store.change((state) => {
      state.tickets[ticket.id] = ticket;
    });
    return ticket;
  }

  async listOwnTickets(account: Account): Promise<Ticket[]> {
    const state = await this.store.read();
    return Object.values(state.tickets)
      .filter((t) => t.publicKey === account.publicKey)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Latest news across every campaign, newest first. News are public
  // (same visibility as the per-campaign endpoint); the account feed and any
  // site-wide news view read through this.
  async listAllNews(limit = 20): Promise<NewsPost[]> {
    const state = await this.store.read();
    return Object.values(state.news)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.min(Math.max(limit, 1), 50));
  }

  async listOwnApplications(account: Account): Promise<IssuerApplication[]> {
    const state = await this.store.read();
    return Object.values(state.applications)
      .filter((a) => a.publicKey === account.publicKey)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async listOwnComments(account: Account): Promise<OwnComment[]> {
    const state = await this.store.read();
    return Object.values(state.comments)
      .filter((c) => c.publicKey === account.publicKey)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((c) => ({ ...publicComment(c), hidden: Boolean(c.hiddenAt) }));
  }

  async submitApplication(account: Account, input: unknown): Promise<IssuerApplication> {
    const parsed = applicationInput.parse(input ?? {});
    this.checkRate(`application:${account.publicKey}`, 3, 24 * 60 * 60 * 1000);
    const application: IssuerApplication = {
      id: newId('app'),
      publicKey: account.publicKey,
      projectName: parsed.projectName,
      country: parsed.country,
      instrumentType: parsed.instrumentType,
      targetAmount: parsed.targetAmount,
      description: parsed.description,
      contactEmail: parsed.contactEmail ? parsed.contactEmail : null,
      status: 'received',
      createdAt: this.now(),
    };
    await this.store.change((state) => {
      state.applications[application.id] = application;
    });
    await this.notify(
      account.publicKey,
      'application_received',
      'Issuer application received',
      `Your issuer application for "${application.projectName}" was received. The operator reviews applications manually; submission is not an approval, a listing or an offer.`,
      application.id,
      { projectName: application.projectName },
    );
    return application;
  }

  // --- Owner-scoped notifications ---
  // Generated only from real events on the owner's own content; there is no
  // path that fabricates notification content. notify() runs as its own
  // store.change AFTER the triggering change completes: nesting a change
  // inside another change's fn would deadlock the Postgres advisory lock.
  private async notify(
    publicKey: string,
    kind: NotificationKind,
    title: string,
    body: string,
    refId: string | null,
    vars: Record<string, string>,
  ): Promise<void> {
    const n: Notification = {
      id: newId('ntf'),
      publicKey,
      kind,
      title,
      body,
      vars,
      refId,
      createdAt: this.now(),
      readAt: null,
    };
    await this.store.change((state) => {
      state.notifications[n.id] = n;
      // Bound growth per account: keep the newest notificationsPerAccount.
      const own = Object.values(state.notifications)
        .filter((x) => x.publicKey === publicKey)
        .sort((a, b) => b.createdAt - a.createdAt);
      for (const stale of own.slice(LIMITS.notificationsPerAccount)) delete state.notifications[stale.id];
    });
  }

  async listNotifications(account: Account): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const state = await this.store.read();
    const own = Object.values(state.notifications)
      .filter((n) => n.publicKey === account.publicKey)
      .sort((a, b) => b.createdAt - a.createdAt);
    return {
      notifications: own.slice(0, LIMITS.notificationsPage),
      unreadCount: own.filter((n) => n.readAt === null).length,
    };
  }

  async markNotificationRead(account: Account, id: string): Promise<void> {
    const now = this.now();
    await this.store.change((state) => {
      const n = state.notifications[id];
      // Same 404 for missing and other-owned: no cross-account enumeration.
      if (!n || n.publicKey !== account.publicKey) throw new CommunityError(404, 'notification not found');
      if (n.readAt === null) n.readAt = now;
    });
  }

  async markAllNotificationsRead(account: Account): Promise<{ marked: number }> {
    const now = this.now();
    let marked = 0;
    await this.store.change((state) => {
      for (const n of Object.values(state.notifications)) {
        if (n.publicKey === account.publicKey && n.readAt === null) {
          n.readAt = now;
          marked++;
        }
      }
    });
    return { marked };
  }

  // Admin operations (router gates them behind x-admin-key).
  // Recent-history audit of gated mutations. Audit write failures are
  // logged but never mask a committed mutation; the entry records the gate
  // the action came through, not a verified identity beyond that.
  async recordAudit(actor: string, action: string, target: string, detail?: string): Promise<void> {
    try {
      await this.store.change((state) => {
        state.audit.push({ id: newId('audit'), at: this.now(), actor, action, target, ...(detail ? { detail } : {}) });
        if (state.audit.length > 500) state.audit.splice(0, state.audit.length - 500);
      });
    } catch (err) {
      console.error('audit write failed:', err instanceof Error ? err.message : err);
    }
  }

  async adminAuditLog(limit = 100): Promise<AuditEntry[]> {
    const state = await this.store.read();
    const capped = Math.max(1, Math.min(500, Math.floor(limit)));
    return [...state.audit].sort((a, b) => b.at - a.at).slice(0, capped);
  }

  async adminListComments(): Promise<Comment[]> {
    const state = await this.store.read();
    return Object.values(state.comments).sort((a, b) => b.createdAt - a.createdAt);
  }
  async adminSetCommentHidden(id: string, hidden: boolean, reason?: string, actor = 'admin-area'): Promise<void> {
    let target: Comment | undefined;
    await this.store.change((state) => {
      const c = state.comments[id];
      if (!c) throw new CommunityError(404, 'comment not found');
      c.hiddenAt = hidden ? this.now() : null;
      c.hiddenReason = hidden ? (reason ?? null) : null;
      target = c;
    });
    await this.recordAudit(actor, hidden ? 'comment.hide' : 'comment.unhide', id, hidden ? reason : undefined);
    if (hidden && target) {
      const c: Comment = target;
      await this.notify(
        c.publicKey,
        'comment_moderated',
        'Comment hidden by moderation',
        `Your comment on campaign "${c.campaignId}" was hidden by the moderator.${c.hiddenReason ? ` Reason: ${c.hiddenReason}` : ''}`,
        c.id,
        c.hiddenReason ? { campaignId: c.campaignId, reason: c.hiddenReason } : { campaignId: c.campaignId },
      );
    }
  }
  async adminListTickets(): Promise<Ticket[]> {
    const state = await this.store.read();
    return Object.values(state.tickets).sort((a, b) => b.createdAt - a.createdAt);
  }
  async adminCloseTicket(id: string, actor = 'admin-area'): Promise<void> {
    let target: Ticket | undefined;
    await this.store.change((state) => {
      const t = state.tickets[id];
      if (!t) throw new CommunityError(404, 'ticket not found');
      t.status = 'closed';
      t.closedAt = this.now();
      target = t;
    });
    await this.recordAudit(actor, 'ticket.close', id);
    if (target) {
      const t: Ticket = target;
      await this.notify(t.publicKey, 'ticket_closed', 'Support ticket closed', `Your ${t.kind} ticket "${t.subject}" was closed.`, t.id, {
        ticketKind: t.kind,
        subject: t.subject,
      });
    }
  }
  async applyForCompany(account: Account, input: unknown): Promise<CompanyApplication> {
    const parsed = companyInput.parse(input ?? {});
    this.checkRate(`company:${account.publicKey}`, 3, 24 * 60 * 60 * 1000);
    const company: CompanyApplication = {
      id: newId('co'),
      publicKey: account.publicKey,
      companyName: parsed.companyName,
      legalForm: parsed.legalForm,
      registrationNumber: parsed.registrationNumber,
      country: parsed.country,
      status: 'pending',
      createdAt: this.now(),
      decidedAt: null,
    };
    await this.store.change((state) => {
      state.companies[company.id] = company;
    });
    await this.notify(
      account.publicKey,
      'company_received',
      'Company account application received',
      `Your company account application for "${company.companyName}" was received and is pending manual review.`,
      company.id,
      { companyName: company.companyName },
    );
    return company;
  }

  async myCompanies(publicKey: string): Promise<CompanyApplication[]> {
    const state = await this.store.read();
    return Object.values(state.companies)
      .filter((c) => c.publicKey === publicKey)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async adminListCompanies(): Promise<CompanyApplication[]> {
    const state = await this.store.read();
    return Object.values(state.companies).sort((a, b) => b.createdAt - a.createdAt);
  }

  async adminSetCompanyStatus(id: string, status: unknown, actor = 'admin-area'): Promise<void> {
    if (status !== 'approved' && status !== 'rejected') throw new CommunityError(400, 'status must be approved or rejected');
    const company = await this.store.change((state) => {
      const c = state.companies[id];
      if (!c) return null;
      c.status = status;
      c.decidedAt = this.now();
      return { ...c };
    });
    if (!company) throw new CommunityError(404, 'company application not found');
    await this.recordAudit(actor, 'company.status', id, String(status));
    await this.notify(
      company.publicKey,
      'company_status',
      'Company account application update',
      `Your company account application for "${company.companyName}" is now ${status}.`,
      company.id,
      { companyName: company.companyName, status },
    );
  }

  async adminListApplications(): Promise<IssuerApplication[]> {
    const state = await this.store.read();
    return Object.values(state.applications).sort((a, b) => b.createdAt - a.createdAt);
  }
  async adminSetApplicationStatus(id: string, status: unknown, actor = 'admin-area'): Promise<void> {
    if (status !== 'received' && status !== 'under_review' && status !== 'closed') throw new CommunityError(400, 'invalid status');
    let target: IssuerApplication | undefined;
    await this.store.change((state) => {
      const a = state.applications[id];
      if (!a) throw new CommunityError(404, 'application not found');
      a.status = status;
      target = a;
    });
    await this.recordAudit(actor, 'application.status', id, String(status));
    if (target) {
      const t: IssuerApplication = target;
      await this.notify(
        t.publicKey,
        'application_status',
        'Issuer application update',
        `Your issuer application for "${t.projectName}" is now "${status}".`,
        t.id,
        { projectName: t.projectName, status },
      );
    }
  }

  // Retention: hard-delete personal submitted content after its retention
  // window, hidden comments after 30 days, and expired auth artifacts.
  async prune(): Promise<{ removed: number }> {
    const now = this.now();
    const retentionMs = this.opts.retentionDays * 24 * 60 * 60 * 1000;
    const hiddenCommentMs = 30 * 24 * 60 * 60 * 1000;
    let removed = 0;
    await this.store.change((state) => {
      for (const [id, t] of Object.entries(state.tickets)) {
        if (now - t.createdAt > retentionMs) {
          delete state.tickets[id];
          removed++;
        }
      }
      for (const [id, a] of Object.entries(state.applications)) {
        if (now - a.createdAt > retentionMs) {
          delete state.applications[id];
          removed++;
        }
      }
      for (const [id, n] of Object.entries(state.notifications)) {
        if (now - n.createdAt > retentionMs) {
          delete state.notifications[id];
          removed++;
        }
      }
      for (const [id, c] of Object.entries(state.comments)) {
        if (c.hiddenAt && now - c.hiddenAt > hiddenCommentMs) {
          delete state.comments[id];
          removed++;
        }
      }
      for (const [id, ch] of Object.entries(state.challenges)) {
        if (ch.expiresAt <= now) {
          delete state.challenges[id];
          removed++;
        }
      }
      for (const [id, s] of Object.entries(state.sessions)) {
        if (s.expiresAt <= now) {
          delete state.sessions[id];
          removed++;
        }
      }
    });
    this.limiter.sweep(24 * 60 * 60 * 1000);
    return { removed };
  }
}

export async function communityStoreFromEnv(): Promise<CommunityStore> {
  const url = process.env.COMMUNITY_DATABASE_URL ?? process.env.SOROBAN_JOURNAL_DATABASE_URL;
  if (url) return PostgresCommunityStore.connect(url);
  // Fail closed where durable storage is expected: hosted deployments set
  // SOROBAN_JOURNAL_BACKEND=postgres (Render filesystem is ephemeral, so a
  // silent file fallback would lose user content on every deploy).
  if (process.env.SOROBAN_JOURNAL_BACKEND === 'postgres' || process.env.COMMUNITY_REQUIRE_POSTGRES === '1') {
    throw new Error('community storage requires COMMUNITY_DATABASE_URL or SOROBAN_JOURNAL_DATABASE_URL; refusing to fall back to a volatile file store');
  }
  return new FileCommunityStore(process.env.COMMUNITY_STORE_PATH ?? './data/community-store.json');
}
