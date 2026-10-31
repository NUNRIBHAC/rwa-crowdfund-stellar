// Server-side campaign metadata: industry classification (blueprint section
// 11A chips/filters) and per-campaign document listings. The Soroban contract
// stores only escrow parameters; presentation metadata lives here, curated by
// the operator, overridable with CAMPAIGN_METADATA_JSON.
//
// Honesty rules: documents flagged `demo: true` are fictional templates and
// every client must show them as such. A KIIS here is NOT a real key
// investment information sheet; no document here is an offer or advice.

export type CampaignDocument = {
  id: string;
  title: string;
  kind: 'kiis' | 'terms' | 'project' | 'other';
  url: string;
  demo: boolean;
};

// Rewards are issuer-authored marketing content supplied per campaign, exactly
// like documents. The platform stores and displays them; it does not promise
// claimability, fulfillment or any eligibility rule of its own. No competitor's
// terms are copied into platform copy.
export type CampaignRewardTier = {
  id: string;
  /** Issuer-authored threshold text, e.g. "from EUR 500" - wording is the issuer's, never platform-computed. */
  threshold: string;
  /** Issuer-authored reward description. */
  description: string;
  /** Issuer-authored eligibility/terms text, when supplied. */
  terms?: string;
  /** Fictional sample content; every client must show it as such. */
  demo?: boolean;
};

export type CampaignMetadata = {
  campaignId: string;
  industry: string; // taxonomy key, e.g. 'energy-utilities'
  industryLabel: string;
  documents: CampaignDocument[];
  /** Issuer-supplied reward tiers; absent or empty means none announced - render that honestly. */
  rewards?: CampaignRewardTier[];
};

// Checked-in defaults for the known demo campaign. The live campaign id comes
// from the operator-configured registry (SOROBAN_CAMPAIGNS_JSON).
const DEFAULTS: CampaignMetadata[] = [
  {
    campaignId: 'demo-solar',
    industry: 'energy-utilities',
    industryLabel: 'Energy and utilities',
    documents: [
      {
        id: 'demo-solar-kiis',
        title: '[DEMO] Key investment information sheet - fictional template, not an offer',
        kind: 'kiis',
        url: '/documents/demo-solar-kiis.html',
        demo: true,
      },
      {
        id: 'demo-solar-project',
        title: '[DEMO] Project overview - fictional sample document',
        kind: 'project',
        url: '/documents/demo-solar-project.html',
        demo: true,
      },
    ],
    rewards: [
      {
        id: 'demo-solar-reward-1',
        threshold: '[DEMO] fictional sample: from EUR 250',
        description: '[DEMO] Fictional sample reward tier - not a real offer, no reward exists',
        terms: "[DEMO] Fictional issuer terms placeholder. Real rewards would carry the issuer's own eligibility terms here.",
        demo: true,
      },
    ],
  },
];

export function campaignMetadata(): CampaignMetadata[] {
  const raw = process.env.CAMPAIGN_METADATA_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as CampaignMetadata[];
    } catch {
      // Fall through to defaults; a bad env must not break reads.
    }
  }
  return DEFAULTS;
}

export function metadataFor(campaignId: string): CampaignMetadata | null {
  return campaignMetadata().find((m) => m.campaignId === campaignId) ?? null;
}
