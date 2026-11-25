import { useEffect, useState } from 'react';
import { api } from '../api';
import IssuerEvidence, { type EvidenceCopy, type EvidenceDossier } from './IssuerEvidence';

export default function CampaignIssuerEvidence({ campaignId, copy }: { campaignId: string; copy: EvidenceCopy }) {
  const [result, setResult] = useState<{ campaignId: string; evidence: EvidenceDossier | null } | null>(null);
  useEffect(() => {
    let active = true;
    api('/api/campaigns/' + encodeURIComponent(campaignId) + '/evidence')
      .then((response) => {
        const evidence = response?.evidence;
        if (
          !evidence ||
          evidence.campaignId !== campaignId ||
          !['available', 'not_provided', 'unavailable'].includes(evidence.state) ||
          !Array.isArray(evidence.sources) ||
          !Array.isArray(evidence.claims) ||
          !Array.isArray(evidence.corrections) ||
          !Array.isArray(evidence.unknownAreas) ||
          evidence.unknownAreas.some(
            (area: unknown) => !['issuer', 'team', 'track_record', 'financials', 'offer_documents', 'milestones'].includes(String(area)),
          )
        ) {
          throw new Error('invalid evidence response');
        }
        if (active) setResult({ campaignId, evidence });
      })
      .catch(() => {
        if (active) setResult({ campaignId, evidence: null });
      });
    return () => {
      active = false;
    };
  }, [campaignId]);
  const current = result?.campaignId === campaignId ? result : null;
  return <IssuerEvidence evidence={current?.evidence ?? null} copy={copy} loading={!current} />;
}
