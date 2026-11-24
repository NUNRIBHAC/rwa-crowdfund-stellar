import { useI18n } from '../i18n';
import TileWall from '../components/TileWall';
import './FoundingCampaign.css';

const IDS = ['origem', 'via', 'construir', 'meta', 'azulejo', 'reembolso', 'tecnologia', 'futuro'] as const;
export default function FoundingCampaign() {
  const { m, locale } = useI18n();
  const campaign = m.foundingCampaign;
  const sections = IDS.map((id) => ({ id, ...campaign[id] }));
  return (
    <article className="founding-campaign" lang={locale === 'pt' ? 'pt-PT' : locale}>
      <header>
        <p className="founding-preview" role="note">
          {campaign.previewNotice}
        </p>
        <h1>{campaign.title}</h1>
      </header>
      <TileWall />
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`founding-${section.id}`}>
          <h2 id={`founding-${section.id}`}>{section.heading}</h2>
          {[section.paragraph1, ...('paragraph2' in section ? [section.paragraph2] : [])].map((paragraph, i) => (
            <p key={i} data-approved-paragraph>
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <p className="founding-future">{m.tileWall.futureDoor}</p>
      <aside className="founding-funds" role="note">
        <p>{campaign.fundsDecision}</p>
      </aside>
    </article>
  );
}
