import { useId, useState } from 'react';
import { useI18n } from '../i18n';
import FundingGrid from './FundingGrid';

// A local illustration only. No campaign data, wallet, signing or API path.
export default function FundingIllustration() {
  const { m } = useI18n();
  const [reached, setReached] = useState(true);
  const id = useId();
  return (
    <section className="funding-illustration" aria-labelledby={id}>
      <p id={id} className="community-note">
        {m.hero.illustration}
      </p>
      <div className="hero-actions" role="group" aria-label={m.hero.illustration}>
        <button className="btn btn-outline" aria-pressed={reached} onClick={() => setReached(true)}>
          {m.hero.goalReached}
        </button>
        <button className="btn btn-outline" aria-pressed={!reached} onClick={() => setReached(false)}>
          {m.hero.goalMissed}
        </button>
      </div>
      <FundingGrid raised={reached ? '100' : '60'} goal="100" layout="block" />
      <p className="community-note">{m.hero.blockScale}</p>
      <p aria-live="polite">{reached ? m.hero.reachedOutcome : m.hero.missedOutcome}</p>
    </section>
  );
}
