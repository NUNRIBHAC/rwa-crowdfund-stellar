import { useEffect, useState } from 'react';
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';

type Investment = {
  id: string;
  investorPub: string;
  amountUsdc: number;
  tokens: number;
  usdcTx: string;
  tokenTx: string;
  clawbackTx?: string;
  refundTx?: string;
};

type Campaign = {
  id: string;
  code: string;
  name: string;
  goalUsdc: number;
  deadline: string;
  creatorPub: string;
  supply: number;
  state: 'funding' | 'finalized' | 'refunded';
  createdAt: string;
  mintTx: string;
  payoutTx?: string;
  finalizedAt?: string;
  refundedAt?: string;
  investments: Investment[];
};

function investedUsdc(c: Campaign): number {
  return c.investments.reduce((sum, i) => sum + i.amountUsdc, 0);
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

const TESTNET_EXPLORER = 'https://stellar.expert/explorer/testnet';

const stateLabel: Record<Campaign['state'], string> = {
  funding: 'Funding',
  finalized: 'Finalized',
  refunded: 'Refunded',
};

const stateColor: Record<Campaign['state'], string> = {
  funding: '#1a7f37',
  finalized: '#0969da',
  refunded: '#bc4c00',
};

export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [demoInvestors, setDemoInvestors] = useState<string[]>([]);
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [trustlineHash, setTrustlineHash] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('100');
  const [selected, setSelected] = useState('');
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  async function refresh() {
    const [c, inv] = await Promise.all([
      fetch('/api/campaigns').then((r) => r.json()),
      fetch('/api/demo/investors').then((r) => r.json()),
    ]);
    setCampaigns(c.campaigns ?? []);
    setDemoInvestors(inv.investors ?? []);
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected && demoInvestors.length > 0) setSelected(demoInvestors[0]);
  }, [demoInvestors, selected]);

  async function connect() {
    try {
      setError(null);
      const conn = await isConnected();
      if (conn.error) throw new Error(conn.error.message);
      if (!conn.isConnected) {
        throw new Error('Freighter is not installed or active. Install the extension and reload.');
      }
      const acc = await requestAccess();
      if (acc.error) throw new Error(acc.error.message);
      if (!acc.address) throw new Error('Could not get the account address.');
      setPubKey(acc.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function addUsdcTrustline() {
    try {
      setError(null);
      if (!pubKey) throw new Error('Connect Freighter first.');
      setBusy(true);

      const buildRes = await fetch('/api/wallet/trustline/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investorPub: pubKey }),
      });
      const buildData = await buildRes.json();
      if (!buildRes.ok) throw new Error(buildData.error ?? 'Failed to prepare trustline.');

      const signed = await signTransaction(buildData.xdr, {
        networkPassphrase: buildData.networkPassphrase,
      });
      if (signed.error) throw new Error(signed.error.message);
      const signedXdr = signed.signedTxXdr;

      const submitRes = await fetch('/api/wallet/trustline/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investorPub: pubKey, xdr: signedXdr }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error ?? 'Failed to add trustline.');

      setTrustlineHash(submitData.hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function createCampaign() {
    try {
      setError(null);
      const name = newName.trim();
      const goal = Number(newGoal);
      if (!name) throw new Error('Enter a name for the campaign.');
      if (!Number.isFinite(goal) || goal <= 0) throw new Error('Invalid goal.');
      setBusy(true);
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, goalUsdc: goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create campaign.');
      setNewName('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function invest(c: Campaign) {
    try {
      setError(null);
      if (!selected) throw new Error('Pick a demo investor or connect Freighter.');
      const inputAmt = Number(amounts[c.id]);
      if (!Number.isFinite(inputAmt) || inputAmt <= 0) throw new Error('Invalid amount.');
      setBusy(true);
      const res = await fetch(`/api/campaigns/${c.id}/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investorPub: selected, amountUsdc: inputAmt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Investment failed.');
      setAmounts((prev) => ({ ...prev, [c.id]: '' }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function investFreighter(c: Campaign) {
    try {
      setError(null);
      if (!pubKey) throw new Error('Connect Freighter first.');
      const inputAmt = Number(amounts[c.id]);
      if (!Number.isFinite(inputAmt) || inputAmt <= 0) throw new Error('Invalid amount.');
      setBusy(true);

      const buildRes = await fetch(`/api/campaigns/${c.id}/invest/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investorPub: pubKey, amountUsdc: inputAmt }),
      });
      const buildData = await buildRes.json();
      if (!buildRes.ok) throw new Error(buildData.error ?? 'Failed to prepare investment.');

      const signed = await signTransaction(buildData.xdr, {
        networkPassphrase: buildData.networkPassphrase,
      });
      if (signed.error) throw new Error(signed.error.message);
      const signedXdr = signed.signedTxXdr;

      const submitRes = await fetch(`/api/campaigns/${c.id}/invest/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investorPub: pubKey, xdr: signedXdr }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error ?? 'Failed to submit investment.');

      setAmounts((prev) => ({ ...prev, [c.id]: '' }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function act(c: Campaign, action: 'finalize' | 'refund') {
    try {
      setError(null);
      setBusy(true);
      const res = await fetch(`/api/campaigns/${c.id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed to ${action}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function txLink(hash: string): string {
    return `${TESTNET_EXPLORER}/tx/${hash}`;
  }

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 760, margin: '0 auto', padding: 32 }}>
      <h1>RWA Crowdfund — Stellar Testnet</h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {demoInvestors.length === 0 && <option value="">No demo accounts</option>}
          {demoInvestors.map((pk) => (
            <option key={pk} value={pk}>
              {pk.slice(0, 6)}…{pk.slice(-4)}
            </option>
          ))}
        </select>
        {pubKey ? (
          <code>{pubKey.slice(0, 6)}…{pubKey.slice(-4)} (Freighter)</code>
        ) : (
          <button onClick={connect} disabled={busy}>
            Connect Freighter
          </button>
        )}
      </div>

      {pubKey && (
        <div style={{ marginBottom: 8 }}>
          <button onClick={addUsdcTrustline} disabled={busy}>
            Add USDC (Freighter)
          </button>
          {trustlineHash && (
            <span style={{ marginLeft: 8, fontSize: 13 }}>
              Trustline:{' '}
              <a href={txLink(trustlineHash)} target="_blank" rel="noreferrer">
                {trustlineHash.slice(0, 16)}…
              </a>
            </span>
          )}
        </div>
      )}

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <section style={{ border: '1px solid #d0d7de', borderRadius: 8, padding: 16, margin: '16px 0' }}>
        <h2 style={{ marginTop: 0 }}>New campaign</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Name (e.g. Solar Lisbon #2)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: 1, padding: 8 }}
          />
          <input
            placeholder="Goal USDC"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            style={{ width: 120, padding: 8 }}
          />
          <button onClick={createCampaign} disabled={busy}>
            Create
          </button>
        </div>
      </section>

      <h2>Campaigns ({campaigns.length})</h2>
      {loading && <p>Loading…</p>}

      {campaigns.map((c) => {
        const raised = investedUsdc(c);
        const pct = Math.min(100, (raised / c.goalUsdc) * 100);
        const full = raised >= c.goalUsdc;
        return (
          <article
            key={c.id}
            style={{ border: '1px solid #d0d7de', borderRadius: 8, padding: 16, marginBottom: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{c.name}</h3>
              <span style={{ color: stateColor[c.state], fontWeight: 600 }}>{stateLabel[c.state]}</span>
            </div>
            <p style={{ margin: '6px 0' }}>
              <code>{c.code}</code> · Goal {fmt(c.goalUsdc)} USDC · Supply {fmt(c.supply)}{' '}
              tokens · {c.investments.length} investors
            </p>
            <div style={{ background: '#eaeef2', borderRadius: 4, height: 10, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: full ? '#1a7f37' : '#0969da',
                }}
              />
            </div>
            <p style={{ margin: '6px 0' }}>
              {fmt(raised)} / {fmt(c.goalUsdc)} USDC ({fmt(pct)}%) · Minted {fmt(raised === 0 ? 0 : (raised / c.goalUsdc) * c.supply)} tokens
            </p>

            {c.mintTx && (
              <p style={{ margin: '4px 0', fontSize: 13 }}>
                Mint:{' '}
                <a href={txLink(c.mintTx)} target="_blank" rel="noreferrer">
                  {c.mintTx.slice(0, 16)}…
                </a>
              </p>
            )}

            {c.payoutTx && (
              <p style={{ margin: '4px 0', fontSize: 13 }}>
                Payout:{' '}
                <a href={txLink(c.payoutTx)} target="_blank" rel="noreferrer">
                  {c.payoutTx.slice(0, 16)}…
                </a>
              </p>
            )}

            {c.state === 'funding' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  type="number"
                  min="1"
                  placeholder="USDC"
                  value={amounts[c.id] ?? ''}
                  onChange={(e) => setAmounts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  style={{ width: 110, padding: 8 }}
                />
                {pubKey ? (
                  <button onClick={() => investFreighter(c)} disabled={busy}>
                    Invest (Freighter)
                  </button>
                ) : (
                  <button onClick={() => invest(c)} disabled={busy}>
                    Invest
                  </button>
                )}
                {full && (
                  <button onClick={() => act(c, 'finalize')} disabled={busy}>
                    Finalize (pay creator)
                  </button>
                )}
                <button onClick={() => act(c, 'refund')} disabled={busy}>
                  Refund
                </button>
              </div>
            )}

            {c.investments.length > 0 && (
              <ul style={{ fontSize: 13, margin: '8px 0 0', paddingLeft: 20 }}>
                {c.investments.map((inv) => (
                  <li key={inv.id}>
                    {inv.investorPub.slice(0, 6)}… +{fmt(inv.amountUsdc)} USDC → +{fmt(inv.tokens)}{' '}
                    tokens ·{' '}
                    <a href={txLink(inv.usdcTx)} target="_blank" rel="noreferrer">
                      USDC
                    </a>{' '}
                    ·{' '}
                    <a href={txLink(inv.tokenTx)} target="_blank" rel="noreferrer">
                      tokens
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </main>
  );
}