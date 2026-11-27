import { useId } from 'react';
import { useI18n } from '../i18n';

// Historical documentary example, deliberately outside the issuer-evidence
// model. Assistant review never becomes checked_fact or human attestation.
export const KIPSTER_SOURCES = {
  kiis: 'https://kapilendo-public.imgix.net/files/projects/kipster-01/f81411f6-d320-414a-8339-c15a98f467fe_KIIS_EN_NL.pdf',
  result: 'https://kipster.nl/deelnemers-bedankt/',
  lei: 'https://api.gleif.org/api/v1/lei-records/7245007JQYIGW328K081',
  afm: 'https://www.afm.nl/~/profmedia/files/registers/register-crowdfunding-platformen.pdf',
  accounts: 'https://dl.invesdor.de/projects/public/33b141d4-3ce6-483d-9860-de77b1cbd7c4/plink/20240521_Kipster_Production_BV_Jaarrekening_2023_getekend.pdf',
  impact: 'https://kipster.nl/app/uploads/2025/05/Impactreport-2024-NL.pdf',
} as const;

export default function AssistantDocumentaryReview() {
  const { m } = useI18n();
  const copy = m.assistantDocumentaryReview;
  const id = useId();
  return (
    <section className="assistant-documentary-review" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{copy.title}</h2>
      <p className="community-note">{copy.notice}</p>
      <ol className="documentary-findings">
        {(['identity', 'offer', 'platform', 'outcome', 'financials'] as const).map((key) => (
          <li key={key}>
            <p>{copy[key]}</p>
          </li>
        ))}
      </ol>
      <p>{copy.coverage}</p>
      <p className="community-note">{copy.limits}</p>
      <h3>{copy.sources}</h3>
      <ul className="documentary-sources">
        {Object.entries(KIPSTER_SOURCES).map(([key, href]) => (
          <li key={key}>
            <a href={href} target="_blank" rel="noopener noreferrer">
              {copy[key as keyof typeof KIPSTER_SOURCES]}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
