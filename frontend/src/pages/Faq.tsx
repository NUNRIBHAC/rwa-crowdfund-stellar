import { useState } from 'react';
import { INVESTOR_FAQ, ISSUER_FAQ } from '../data/faq';

export default function Faq() {
  const [tab, setTab] = useState<'investors' | 'issuers'>('investors');
  const entries = tab === 'investors' ? INVESTOR_FAQ : ISSUER_FAQ;
  return (
    <>
      <h1 className="page-title">Frequently asked questions</h1>
      <div className="tab-bar" role="group" aria-label="FAQ audience">
        <button className={`chip ${tab === 'investors' ? 'chip-active' : ''}`} aria-pressed={tab === 'investors'} onClick={() => setTab('investors')}>
          For investors
        </button>
        <button className={`chip ${tab === 'issuers' ? 'chip-active' : ''}`} aria-pressed={tab === 'issuers'} onClick={() => setTab('issuers')}>
          For companies
        </button>
      </div>
      {entries.map((e) => (
        <details key={e.q} className="accordion">
          <summary>{e.q}</summary>
          <p>{e.a}</p>
        </details>
      ))}
    </>
  );
}
