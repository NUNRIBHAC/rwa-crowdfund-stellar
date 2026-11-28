import { useEffect, useState } from 'react';
import { api } from '../api';
import { parseMissingTrustEvidence, type MissingTrustEvidence, type TrustCriterion } from '../trust-evidence';

export type TrustEvidenceCopy = {
  title: string;
  notice: string;
  loading: string;
  unavailable: string;
  missing: string;
  criteria: Record<TrustCriterion, string>;
};
// Not mounted until copy completes the canonical eleven-language translation
// workflow. No English fallback and no backend text becomes a public label.
export default function TrustEvidencePanel({ copy }: { copy: TrustEvidenceCopy }) {
  const [data, setData] = useState<MissingTrustEvidence | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    api('/api/transparency/evidence')
      .then((value) => {
        const parsed = parseMissingTrustEvidence(value, new Date().toISOString().slice(0, 10));
        if (active) setData(parsed);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="trust-evidence-panel" aria-labelledby="trust-evidence-title">
      <h2 id="trust-evidence-title">{copy.title}</h2>
      <p>{copy.notice}</p>
      {failed ? (
        <p role="alert">{copy.unavailable}</p>
      ) : !data ? (
        <p role="status">{copy.loading}</p>
      ) : (
        <ol>
          {data.criteria.map((row) => (
            <li key={row.criterion}>
              <h3>{copy.criteria[row.criterion]}</h3>
              <p>{copy.missing}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
