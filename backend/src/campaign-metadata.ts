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

export type CampaignMetadata = {
  campaignId: string;
  industry: string; // taxonomy key, e.g. 'energy-utilities'
  industryLabel: string;
  documents: CampaignDocument[];
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
