// Development-only interface. Deliberately not mounted by App/Account/server.
import { useEffect, useRef, useState } from 'react';
import { rehearsalRequest, type Distribution, type Meeting } from './api';
type Props = { token: string; campaignId: string; fixtureAccounts: string[] };
export default function RehearsalPanel({ token, campaignId, fixtureAccounts }: Props) {
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [total, setTotal] = useState('10');
  const [key, setKey] = useState('');
  const [distributionId, setDistributionId] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [reason, setReason] = useState('');
  const [title, setTitle] = useState('Fixture meeting');
  const [resolution, setResolution] = useState('Non-binding fixture proposal');
  const [choice, setChoice] = useState('abstain');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const pending = useRef(false);
  const context = `${token}\n${campaignId}\n${JSON.stringify(fixtureAccounts)}`;
  const previous = useRef(context);
  // Invalidate even before effects run: old requests may settle during a rerender.
  if (previous.current !== context) {
    previous.current = context;
    generation.current++;
  }
  useEffect(() => {
    const epoch = generation;
    epoch.current++;
    pending.current = false;
    setDistribution(null);
    setMeeting(null);
    setDistributionId('');
    setMeetingId('');
    setKey('');
    setReason('');
    setError('');
    setBusy(false);
    setTotal('10');
    return () => {
      epoch.current++;
    };
  }, [context]);
  const run = async <T,>(path: string, body: unknown | undefined, apply: (v: T) => void) => {
    if (pending.current || !token) return;
    pending.current = true;
    const current = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const value = await rehearsalRequest<T>(token, path, body);
      if (current === generation.current) apply(value);
    } catch (e) {
      if (current === generation.current) setError(e instanceof Error ? e.message : 'Rehearsal unavailable');
    } finally {
      if (current === generation.current) {
        pending.current = false;
        setBusy(false);
      }
    }
  };
  const saveDistribution = (value: Distribution) => {
    setDistribution(value);
    setDistributionId(value.id);
  };
  const saveMeeting = (value: Meeting) => {
    setMeeting(value);
    setMeetingId(value.id);
  };
  const field = (label: string, value: string, update: (s: string) => void) => (
    <label style={{ display: 'block', margin: '12px 0', overflowWrap: 'anywhere' }}>
      {label}
      <input
        style={{ display: 'block', boxSizing: 'border-box', width: '100%', minWidth: 0, padding: 10 }}
        value={value}
        onChange={(e) => update(e.target.value)}
        disabled={busy}
      />
    </label>
  );
  return (
    <section aria-label="Isolated rehearsal" style={{ maxWidth: 960, margin: 'auto', padding: 16, overflowWrap: 'anywhere' }}>
      <h1>TEST ONLY - isolated rehearsal</h1>
      <p>
        No funds, signatures, invitations, legal rights or binding votes. Local fixture accounts only. This interface is not enabled on the hosted application.
      </p>
      <p>
        Campaign: {campaignId}. Authentication and permissions are checked by the local server on every request. Never paste credentials or session tokens here.
      </p>
      {error && <p role="alert">{error}</p>}
      {busy && <p role="status">Waiting for local rehearsal response. Do not repeat the action.</p>}
      <fieldset disabled={busy || !token} style={{ minWidth: 0 }}>
        <legend>Distribution rehearsal</legend>
        {field('Total fictional units', total, setTotal)}
        {field('Idempotency key (reuse only for identical inputs)', key, setKey)}
        <button
          disabled={!key || !total || !campaignId}
          onClick={() => void run(`/campaigns/${encodeURIComponent(campaignId)}/distributions`, { total, idempotencyKey: key }, saveDistribution)}
        >
          Prepare fixture distribution
        </button>
        {field('Distribution ID', distributionId, (value) => {
          setDistributionId(value);
          setDistribution(null);
        })}
        <button
          disabled={!distributionId}
          onClick={() => {
            setDistribution(null);
            void run(`/distributions/${encodeURIComponent(distributionId)}`, undefined, saveDistribution);
          }}
        >
          Read distribution
        </button>
        {distribution && (
          <article>
            <h2>Distribution: {distribution.state}</h2>
            <p>ID: {distribution.id}</p>
            <p>Snapshot: {distribution.snapshotHash}</p>
            <p>
              Prepared by: {distribution.preparedBy}. Reviewed by: {distribution.reviewedBy ?? 'not reviewed'}.
            </p>
            <p>Allocation: {distribution.total} fictional units. Not a payment instruction.</p>
            <ul>
              {distribution.rows.map((r) => (
                <li key={r.publicKey}>
                  {r.publicKey}: {r.amount}
                </li>
              ))}
            </ul>
            <button
              disabled={distribution.state !== 'draft'}
              onClick={() => void run(`/distributions/${distribution.id}`, { action: 'approve' }, saveDistribution)}
            >
              Review with distinct fixture account
            </button>{' '}
            <button
              disabled={distribution.state !== 'approved'}
              onClick={() => void run(`/distributions/${distribution.id}`, { action: 'simulate' }, saveDistribution)}
            >
              Run mock distribution
            </button>
            {(distribution.state === 'unknown' || distribution.state === 'dispatching') && (
              <p role="status">Outcome unknown or dispatch in progress. No automatic retry. Inspect the local ledger before any recovery.</p>
            )}
            {field('Cancellation reason (at least 10 characters)', reason, setReason)}
            <button
              disabled={!['draft', 'approved'].includes(distribution.state) || reason.trim().length < 10}
              onClick={() => void run(`/distributions/${distribution.id}`, { action: 'cancel', reason }, saveDistribution)}
            >
              Cancel undispatched fixture
            </button>
            <h3>Mock receipts</h3>
            {distribution.receipts.length ? (
              <ul>
                {distribution.receipts.map((r) => (
                  <li key={r.reference}>
                    {r.reference}: {r.amount} to {r.publicKey}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No mock receipts.</p>
            )}
            <h3>Audit</h3>
            <ol>
              {distribution.audit.map((r, n) => (
                <li key={n}>
                  {r.event}: {r.actor}
                  {r.reason ? ` (${r.reason})` : ''}
                </li>
              ))}
            </ol>
          </article>
        )}
      </fieldset>
      <fieldset disabled={busy || !token} style={{ minWidth: 0, marginTop: 24 }}>
        <legend>Non-binding meeting rehearsal</legend>
        {field('Fixture title', title, setTitle)}
        {field('Fixture resolution', resolution, setResolution)}
        <p>Fixed fixture participants: {fixtureAccounts.join(', ') || 'none'}.</p>
        <button
          disabled={!key || !title.trim() || !resolution.trim() || !fixtureAccounts.length}
          onClick={() => void run('/meetings', { campaignId, title, resolution, participants: fixtureAccounts, idempotencyKey: key }, saveMeeting)}
        >
          Create fixture meeting
        </button>
        {field('Meeting ID', meetingId, (value) => {
          setMeetingId(value);
          setMeeting(null);
        })}
        <button
          disabled={!meetingId}
          onClick={() => {
            setMeeting(null);
            void run(`/meetings/${encodeURIComponent(meetingId)}`, undefined, saveMeeting);
          }}
        >
          Read meeting
        </button>
        {meeting && (
          <article>
            <h2>
              {meeting.title}: {meeting.state}
            </h2>
            <p>ID: {meeting.id}</p>
            <p>{meeting.resolution}</p>
            <p>{meeting.participationBasis}</p>
            <p>
              {meeting.castCount} choices / {meeting.participantCount} fixture accounts. No legal quorum calculation.
            </p>
            {meeting.audit && (
              <>
                <button disabled={meeting.state !== 'draft'} onClick={() => void run(`/meetings/${meeting.id}/state`, { state: 'open' }, saveMeeting)}>
                  Open fixture meeting
                </button>{' '}
                <button disabled={meeting.state !== 'open'} onClick={() => void run(`/meetings/${meeting.id}/state`, { state: 'closed' }, saveMeeting)}>
                  Close fixture meeting
                </button>{' '}
                <button disabled={meeting.state !== 'draft'} onClick={() => void run(`/meetings/${meeting.id}/state`, { state: 'cancelled' }, saveMeeting)}>
                  Cancel draft meeting
                </button>
              </>
            )}
            <label style={{ display: 'block', margin: '12px 0' }}>
              Your fixture choice{' '}
              <select value={choice} onChange={(e) => setChoice(e.target.value)} disabled={!meeting.canParticipate}>
                <option value="for">For</option>
                <option value="against">Against</option>
                <option value="abstain">Abstain</option>
              </select>
            </label>
            <button disabled={!meeting.canParticipate} onClick={() => void run(`/meetings/${meeting.id}/participation`, { choice }, saveMeeting)}>
              Record immutable fixture choice
            </button>
            <p>Your choice: {meeting.ownChoice ?? 'not cast'}. Other accounts' choices are private.</p>
            {meeting.totals ? (
              <p>
                Totals: for {meeting.totals.for}, against {meeting.totals.against}, abstain {meeting.totals.abstain}.
              </p>
            ) : (
              <p>Totals withheld until close.</p>
            )}
            {meeting.audit && (
              <>
                <h3>Organizer audit</h3>
                <ol>
                  {meeting.audit.map((r, n) => (
                    <li key={n}>
                      {r.event}: {r.actor}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </article>
        )}
      </fieldset>
    </section>
  );
}
