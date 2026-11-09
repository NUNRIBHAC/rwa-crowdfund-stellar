import { useI18n } from '../i18n';

/** The campaign route uses the v1 escrow model, not the separate offering
 * or share-token contracts. Fixture profiles never establish real rights. */
export default function ContributionTerms({ fixtureMode }: { fixtureMode: boolean }) {
  const { m } = useI18n();
  const t = m.contributionTerms;
  return (
    <section className="contribution-terms" aria-label={t.title}>
      <h2 className="section-title">{t.title}</h2>
      <p>{fixtureMode ? t.fixture : t.record}</p>
      {!fixtureMode && <p>{t.rights}</p>}
      {!fixtureMode && <p>{m.contributionPreview.outcomes}</p>}
      <h3>{t.missingTitle}</h3>
      <p>{t.missing}</p>
      {!fixtureMode && <p>{t.fees}</p>}
      <p className="widget-risk">{m.campaign.widgetRisk}</p>
    </section>
  );
}
