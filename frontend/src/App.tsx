import { useEffect, useState } from 'react';
import { requestAccess, signTransaction } from '@stellar/freighter-api';
type Campaign = { id: string; name: string; contractId: string; raised: string; balance: string | null; withdrawn: boolean;
  config: { creator: string; token: string; goal: string; deadline: string } };
type Intent = { hash: string; xdr: string; campaign: string; actor: string; action: string; status: string; signedXdr?: string; amount?: string; feeStroops?: string; contractId?: string };
const units = (v: string) => { const n = BigInt(v); return `${n/10000000n}.${String(n%10000000n).padStart(7,'0')}`; };
async function api(url: string, body?: unknown) {
  const r = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const v = await r.json(); if (!r.ok) throw new Error(v.error ?? 'API request failed'); return v;
}
export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]), [actor, setActor] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [amounts, setAmounts] = useState<Record<string,string>>({});
  const [intent, setIntent] = useState<Intent | null>(() => { try { return JSON.parse(localStorage.getItem('rwa-soroban-intent') ?? 'null'); } catch { return null; } });
  const [loaded, setLoaded] = useState(false);
  async function refresh(address = actor) {
    const data = await api(`/api/campaigns${address ? `?actor=${encodeURIComponent(address)}` : ''}`);
    setCampaigns(data.campaigns); setLoaded(true);
  }
  useEffect(() => { localStorage.removeItem('rwa-admin-key'); refresh().catch(e => setError(e.message)); }, []);
  function retain(i: Intent) { setIntent(i); localStorage.setItem('rwa-soroban-intent', JSON.stringify(i)); }
  async function run(fn: () => Promise<void>) { setBusy(true); setError(''); try { await fn(); } catch(e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } }
  async function connect() { const r = await requestAccess(); if (r.error || !r.address) throw new Error(r.error?.message ?? 'Wallet access failed'); setActor(r.address); await refresh(r.address); }
  async function prepare(c: Campaign, action: string) {
    if (!actor) throw new Error('Connect Freighter first.');
    if (intent && !['SUCCESS','FAILED','CANCELLED_UNSIGNED'].includes(intent.status)) throw new Error('Resolve the saved transaction before preparing another.');
    const result = await api(`/api/campaigns/${c.id}/soroban/build`, { actor, action, amount: amounts[c.id] });
    retain({ ...result, campaign: c.id, actor, status: 'BUILT' });
  }
  async function submit() {
    if (!intent) return;
    if (actor !== intent.actor) throw new Error('Connect the wallet that prepared this transaction.');
    let current = intent;
    if (!current.signedXdr) {
      const result = await signTransaction(current.xdr, { networkPassphrase: 'Test SDF Network ; September 2015' });
      if (result.error || !result.signedTxXdr) throw new Error(result.error?.message ?? 'Wallet did not sign');
      current = { ...current, signedXdr: result.signedTxXdr, status: 'SIGNED' }; retain(current);
    }
    // Persist exact signed XDR before the first send. Network errors retain it.
    const result = await api(`/api/campaigns/${current.campaign}/soroban/submit`, { actor: current.actor, xdr: current.signedXdr });
    retain({ ...current, status: result.status });
  }
  async function check() { if (!intent) return; const r = await api(`/api/soroban/transactions/${intent.hash}`); retain({ ...intent, status: r.status }); await refresh(); }
  return <main style={{ fontFamily: 'system-ui', maxWidth: 850, margin: 'auto', padding: 24, lineHeight: 1.5, overflowWrap: 'anywhere' }}>
    <h1>Soroban crowdfunding</h1>
    <p>Testnet integration preview. Not deployed by this app. Not audited or production-ready.</p>
    <p>All campaigns use contract escrow and nontransferable contribution records. Payments and cap checks execute atomically. No CRWD receipt tokens or platform-signed refunds.</p>
    <button disabled={busy} onClick={() => run(connect)}>Connect Freighter (testnet)</button>
    {actor && <p>Wallet: {actor}</p>}
    <button disabled={busy} onClick={() => run(() => refresh())}>Refresh contract state</button>
    {error && <p role="alert" style={{ background: '#fff0ef', padding: 12, color: '#8c1c13' }}>{error}</p>}
    {intent && <section style={{ border: '2px solid #9a6700', padding: 16, marginTop: 20 }}>
      <h2>Saved transaction</h2><p>{intent.action}{intent.amount ? ` ${intent.amount}` : ''} - {intent.campaign}</p>
      <p>Contract: {intent.contractId}</p><p>Maximum transaction fee: {intent.feeStroops ? units(intent.feeStroops) : "check wallet"} testnet XLM</p><p>Hash: {intent.hash}</p><p>Status: {intent.status}</p>
      <p>Submission is not confirmation. A missing result does not mean failure. Check status or retry this exact signed transaction, never create a replacement while uncertain.</p>
      {!['SUCCESS','FAILED','CANCELLED_UNSIGNED'].includes(intent.status) && <button disabled={busy} onClick={() => run(submit)}>{intent.signedXdr ? 'Retry identical transaction' : 'Sign and submit'}</button>}
      {intent.signedXdr && <button disabled={busy} onClick={() => run(check)}>Check ledger result</button>}
      {!intent.signedXdr && intent.status === 'BUILT' && <button disabled={busy} onClick={() => retain({ ...intent, status: 'CANCELLED_UNSIGNED' })}>Cancel unsigned transaction</button>}
      {intent.status === 'NOT_FOUND' && <p>Uncertain outcome retained. The RPC may have limited history. Do not clear or replace it based on expiry.</p>}
    </section>}
    {loaded && !campaigns.length && <section><h2>No deployed campaign configured</h2><p>An operator must deploy and verify the reviewed contract separately, then set SOROBAN_CAMPAIGNS_JSON. Deployment and migration are not performed here. Legacy campaigns are read-only and require reconciliation.</p></section>}
    {campaigns.map(c => <section key={c.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginTop: 20 }}>
      <h2>{c.name}</h2><p>Contract: {c.contractId}</p><p>Asset contract: {c.config.token}</p>
      <p>Raised: {units(c.raised)} / {units(c.config.goal)} asset units</p><p>Deadline: {new Date(Number(c.config.deadline)*1000).toISOString()}</p>
      <p>Creator: {c.config.creator}. {c.withdrawn ? 'Withdrawn.' : 'Not withdrawn.'}</p>
      {c.balance !== null && <p>Your contribution record: {units(c.balance)}</p>}
      <label>Contribution amount <input value={amounts[c.id] ?? ''} onChange={e => setAmounts({ ...amounts, [c.id]: e.target.value })} placeholder="10.00" inputMode="decimal" /></label>
      <p><button disabled={busy || !actor} onClick={() => run(() => prepare(c,'contribute'))}>Prepare contribution</button>{' '}
      <button disabled={busy || !actor} onClick={() => run(() => prepare(c,'refund'))}>Prepare my refund</button>{' '}
      <button disabled={busy || actor !== c.config.creator} onClick={() => run(() => prepare(c,'withdraw'))}>Prepare creator withdrawal</button></p>
      <p>Contribute before the deadline, up to the remaining goal. After the deadline: creator withdraws if fully funded; otherwise each contributor signs their own refund. The contract enforces these rules.</p>
    </section>)}
    <footer style={{ marginTop: 32 }}><p>No automatic deployment or legacy balance conversion. Existing classic intents and balances are preserved, not cleared. The separate identity/valuation infrastructure remains mock-only.</p></footer>
  </main>;
}
