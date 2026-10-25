import { useEffect, useState } from 'react';
import { isConnected, getPublicKey } from '@stellar/freighter-api';

function App() {
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<unknown[]>([]);

  async function connect() {
    try {
      if (!(await isConnected())) {
        throw new Error('Freighter não está instalado ou ativo');
      }
      setPubKey(await getPublicKey());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((data) => setCampaigns(data.campaigns))
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 720, margin: '0 auto', padding: 32 }}>
      <h1>RWA Crowdfund — Stellar Testnet</h1>

      {pubKey ? (
        <p>
          Conta Freighter: <code>{pubKey}</code>
        </p>
      ) : (
        <button onClick={connect}>Ligar Freighter</button>
      )}

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <h2>Campanhas ({campaigns.length})</h2>
      <p>Scaffold OK. Lista/UI de investimento no próximo passo.</p>
    </main>
  );
}

export default App;