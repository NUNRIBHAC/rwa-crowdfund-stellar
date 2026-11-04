// Non-binding fixture participation only. No legal quorum, rights, invitations,
// chain voting or entitlement checks are inferred from a simulated ballot.
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { CommunityStore } from './community-store.js';
const actorSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_.:-]{1,120}$/)
  .refine((s) => !['__proto__', 'prototype', 'constructor'].includes(s), 'reserved actor');
const choiceSchema = z.enum(['for', 'against', 'abstain']);
const inputSchema = z
  .object({
    campaignId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
    title: z.string().trim().min(1).max(160),
    resolution: z.string().trim().min(1).max(4000),
    participants: z.array(actorSchema).min(1).max(500),
    idempotencyKey: z.string().regex(/^[a-zA-Z0-9_.:-]{1,120}$/),
  })
  .strict();
export type SimulatedMeeting = {
  id: string;
  campaignId: string;
  title: string;
  resolution: string;
  participants: string[];
  organizer: string;
  idempotencyKey: string;
  inputHash: string;
  state: 'draft' | 'open' | 'closed' | 'cancelled';
  ballots: Record<string, { choice: 'for' | 'against' | 'abstain'; at: number }>;
  audit: { actor: string; at: number; event: string }[];
};
const copy = <T>(value: T): T => structuredClone(value);
export class MeetingSimulationService {
  constructor(
    private store: CommunityStore,
    private clock = () => Date.now(),
  ) {}
  private view(meeting: SimulatedMeeting, actor: string) {
    const organizer = meeting.organizer === actor;
    if (!organizer && !meeting.participants.includes(actor)) throw new Error('not a fixture participant');
    const counts = { for: 0, against: 0, abstain: 0 };
    for (const ballot of Object.values(meeting.ballots)) counts[ballot.choice]++;
    return {
      id: meeting.id,
      campaignId: meeting.campaignId,
      title: meeting.title,
      resolution: meeting.resolution,
      state: meeting.state,
      simulation: true as const,
      legalEffect: false as const,
      binding: false as const,
      participationBasis: 'one fixture account, one choice; not share-weighted or a legal quorum',
      participantCount: meeting.participants.length,
      castCount: Object.keys(meeting.ballots).length,
      // No interim totals to participants and never other participants' ballots.
      totals: meeting.state === 'closed' || organizer ? counts : null,
      ownChoice: meeting.ballots[actor]?.choice ?? null,
      canParticipate: meeting.state === 'open' && meeting.participants.includes(actor) && !meeting.ballots[actor],
      ...(organizer ? { audit: copy(meeting.audit) } : {}),
    };
  }
  async create(organizer: string, input: unknown) {
    actorSchema.parse(organizer);
    const parsed = inputSchema.parse(input);
    if (new Set(parsed.participants).size !== parsed.participants.length) throw new Error('duplicate fixture participant');
    const normalized = { ...parsed, participants: [...parsed.participants].sort() };
    const inputHash = createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
    let id = '';
    await this.store.change((s) => {
      if (!s.accounts[organizer] || parsed.participants.some((p) => !s.accounts[p])) throw new Error('fixture accounts must exist');
      const meetings = (s.simulatedMeetings ??= {});
      const existing = Object.values(meetings).find((m) => m.organizer === organizer && m.idempotencyKey === parsed.idempotencyKey);
      if (existing) {
        if (existing.inputHash !== inputHash) throw new Error('idempotency inputs differ');
        id = existing.id;
        return;
      }
      id = randomUUID();
      meetings[id] = {
        id,
        ...normalized,
        inputHash,
        organizer,
        state: 'draft',
        ballots: {},
        audit: [{ actor: organizer, at: this.clock(), event: 'simulation.meeting.created' }],
      };
    });
    return this.read(organizer, id);
  }
  async read(actor: string, id: string) {
    actorSchema.parse(actor);
    const meeting = (await this.store.read()).simulatedMeetings?.[id];
    if (!meeting) throw new Error('simulated meeting not found');
    return this.view(meeting, actor);
  }
  async transition(organizer: string, id: string, next: 'open' | 'closed' | 'cancelled') {
    actorSchema.parse(organizer);
    z.enum(['open', 'closed', 'cancelled']).parse(next);
    await this.store.change((s) => {
      const meeting = s.simulatedMeetings?.[id];
      if (!meeting || meeting.organizer !== organizer) throw new Error('organizer required');
      if (!((meeting.state === 'draft' && (next === 'open' || next === 'cancelled')) || (meeting.state === 'open' && next === 'closed')))
        throw new Error('meeting transition rejected');
      meeting.state = next;
      meeting.audit.push({ actor: organizer, at: this.clock(), event: `simulation.meeting.${next}` });
    });
    return this.read(organizer, id);
  }
  async participate(actor: string, id: string, input: unknown) {
    actorSchema.parse(actor);
    const { choice } = z.object({ choice: choiceSchema }).strict().parse(input);
    await this.store.change((s) => {
      const meeting = s.simulatedMeetings?.[id];
      if (!meeting || meeting.state !== 'open' || !meeting.participants.includes(actor)) throw new Error('open meeting and fixture participant required');
      const previous = meeting.ballots[actor];
      if (previous) {
        if (previous.choice === choice) return;
        throw new Error('choice already recorded; fixture changes not supported');
      }
      meeting.ballots[actor] = { choice, at: this.clock() };
      meeting.audit.push({ actor, at: this.clock(), event: 'simulation.meeting.choice-recorded' });
    });
    return this.read(actor, id);
  }
}
