import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CampaignIssuerEvidence from './CampaignIssuerEvidence';
import { api } from '../api';
import copy from './issuer-evidence-test-copy.json';
vi.mock('../api', () => ({ api: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const dossier = (campaignId: string) => ({ campaignId, state: 'not_provided', revisedOn: null, sources: [], claims: [], corrections: [], unknownAreas: [] });
describe('campaign evidence read', () => {
  it('loads the public read and presents missing evidence honestly', async () => {
    vi.mocked(api).mockResolvedValue({ evidence: dossier('sample') });
    render(<CampaignIssuerEvidence campaignId="sample" copy={copy} />);
    await screen.findByText(copy.notProvided);
    expect(api).toHaveBeenCalledWith('/api/campaigns/sample/evidence');
  });
  it('presents failure without exposing a raw backend error', async () => {
    vi.mocked(api).mockRejectedValue(new Error('private diagnostic'));
    render(<CampaignIssuerEvidence campaignId="sample" copy={copy} />);
    await screen.findByText(copy.unavailable);
    expect(screen.queryByText('private diagnostic')).toBeNull();
  });
  it('rejects an evidence response for another campaign', async () => {
    vi.mocked(api).mockResolvedValue({ evidence: dossier('wrong') });
    render(<CampaignIssuerEvidence campaignId="sample" copy={copy} />);
    await screen.findByText(copy.unavailable);
  });
  it('rejects an incomplete evidence response', async () => {
    vi.mocked(api).mockResolvedValue({ evidence: { campaignId: 'sample', state: 'available' } });
    render(<CampaignIssuerEvidence campaignId="sample" copy={copy} />);
    await screen.findByText(copy.unavailable);
  });
  it('does not show an old response after a campaign change', async () => {
    let resolveOld: (value: unknown) => void = () => {};
    vi.mocked(api)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValue({ evidence: dossier('next') });
    const view = render(<CampaignIssuerEvidence campaignId="first" copy={copy} />);
    view.rerender(<CampaignIssuerEvidence campaignId="next" copy={copy} />);
    await screen.findByText(copy.notProvided);
    resolveOld({ evidence: dossier('first') });
    await waitFor(() => expect(screen.queryByText(copy.loading)).toBeNull());
    expect(api).toHaveBeenLastCalledWith('/api/campaigns/next/evidence');
  });
});
