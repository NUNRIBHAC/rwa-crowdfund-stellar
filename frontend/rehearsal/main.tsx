// Served only by the explicit loopback development harness, never production.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import RehearsalPanel from '../src/rehearsal/RehearsalPanel';
type Fixture = { label: string; token: string; account: string };
function Harness() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    fetch('/local-rehearsal/fixture-sessions')
      .then((r) => {
        if (!r.ok) throw Error('Local fixtures unavailable');
        return r.json();
      })
      .then(setFixtures);
  }, []);
  if (!fixtures.length) return <p>Loading local fixtures</p>;
  return (
    <>
      <label style={{ display: 'block', padding: 16 }}>
        Local fixture account{' '}
        <select value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
          {fixtures.map((f, i) => (
            <option key={f.account} value={i}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <RehearsalPanel token={fixtures[selected].token} campaignId="synthetic" fixtureAccounts={fixtures.map((f) => f.account)} />
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Harness />);
