import { useId } from 'react';
export type EvidenceArea = 'issuer' | 'team' | 'track_record' | 'financials' | 'offer_documents' | 'milestones';
export type EvidenceDossier = {
  campaignId: string;
  state: 'not_provided' | 'available' | 'unavailable';
  revisedOn: string | null;
  sources: { id: string; title: string; url: string; publisher: 'issuer' | 'independent'; retrievedOn: string; publishedOn?: string }[];
  claims: {
    id: string;
    area: EvidenceArea;
    text: string;
    status: 'issuer_claim' | 'checked_fact';
    supersedes?: string;
    sourceIds: string[];
    review?: { checkedOn: string; note: string };
  }[];
  corrections: { id: string; claimId: string; correctedOn: string; note: string; sourceIds: string[] }[];
  unknownAreas: EvidenceArea[];
};
export type EvidenceCopy = {
  title: string;
  note: string;
  loading: string;
  notProvided: string;
  unavailable: string;
  revisedOn: string;
  issuerClaim: string;
  checkedFact: string;
  corrected: string;
  unknown: string;
  sources: string;
  issuerSource: string;
  independentSource: string;
  retrievedOn: string;
  publishedOn: string;
  reviewedOn: string;
  corrections: string;
  areas: Record<EvidenceArea, string>;
};
function safeSource(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      host.includes('.') &&
      !host.endsWith('.local') &&
      !host.endsWith('.localhost') &&
      !host.endsWith('.internal') &&
      !host.endsWith('.invalid') &&
      !/^\d+(?:\.\d+){3}$/.test(host) &&
      !host.includes(':')
      ? url.href
      : null;
  } catch {
    return null;
  }
}
// Pure presentation: callers supply localized labels. No private issuer records,
// write controls, fetching, scores or investment recommendations are introduced.
export default function IssuerEvidence({ evidence, copy, loading = false }: { evidence: EvidenceDossier | null; copy: EvidenceCopy; loading?: boolean }) {
  const sourceLinks = (ids: string[]) =>
    ids.map((id) => {
      const source = evidence?.sources.find((item) => item.id === id);
      const href = source && safeSource(source.url);
      return source && href ? (
        <li key={id}>
          <a href={href} target="_blank" rel="noopener noreferrer">
            <bdi dir="auto">{source.title}</bdi>
          </a>
          <p>
            {source.publisher === 'issuer' ? copy.issuerSource : copy.independentSource} · {copy.retrievedOn}:{' '}
            <time dir="ltr" dateTime={source.retrievedOn}>
              {source.retrievedOn}
            </time>
            {source.publishedOn && (
              <>
                {' '}
                · {copy.publishedOn}:{' '}
                <time dir="ltr" dateTime={source.publishedOn}>
                  {source.publishedOn}
                </time>
              </>
            )}
          </p>
        </li>
      ) : null;
    });
  const headingId = useId();
  return (
    <section className="issuer-evidence" aria-labelledby={headingId}>
      <h2 id={headingId}>{copy.title}</h2>
      <p>{copy.note}</p>
      {loading ? (
        <p role="status">{copy.loading}</p>
      ) : !evidence || evidence.state === 'unavailable' ? (
        <p role="status">{copy.unavailable}</p>
      ) : evidence.state === 'not_provided' ? (
        <p>{copy.notProvided}</p>
      ) : (
        <>
          {evidence.revisedOn && (
            <p>
              {copy.revisedOn}:{' '}
              <time dir="ltr" dateTime={evidence.revisedOn}>
                {evidence.revisedOn}
              </time>
            </p>
          )}
          {evidence.claims.map((claim) => {
            const corrections = evidence.corrections.filter((item) => item.claimId === claim.id);
            return (
              <article key={claim.id}>
                <h3>{copy.areas[claim.area]}</h3>
                <p className="status-chip">{corrections.length ? copy.corrected : claim.status === 'issuer_claim' ? copy.issuerClaim : copy.checkedFact}</p>
                <p>
                  <bdi dir="auto">{claim.text}</bdi>
                </p>
                {claim.review && (
                  <p>
                    {copy.reviewedOn}:{' '}
                    <time dir="ltr" dateTime={claim.review.checkedOn}>
                      {claim.review.checkedOn}
                    </time>
                    . <bdi dir="auto">{claim.review.note}</bdi>
                  </p>
                )}
                <h4>{copy.sources}</h4>
                <ul>{sourceLinks(claim.sourceIds)}</ul>
                {corrections.length > 0 && (
                  <section>
                    <h4>{copy.corrections}</h4>
                    {corrections.map((item) => (
                      <div key={item.id}>
                        <p>
                          <time dir="ltr" dateTime={item.correctedOn}>
                            {item.correctedOn}
                          </time>
                          : <bdi dir="auto">{item.note}</bdi>
                        </p>
                        <ul>{sourceLinks(item.sourceIds)}</ul>
                      </div>
                    ))}
                  </section>
                )}
              </article>
            );
          })}
        </>
      )}
      {!loading && evidence && evidence.state !== 'unavailable' && evidence.unknownAreas.length > 0 && (
        <section>
          <h3>{copy.unknown}</h3>
          <ul>
            {evidence.unknownAreas.map((area) => (
              <li key={area}>{copy.areas[area]}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
