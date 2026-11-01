// Regression: browser automation layers and some extensions wrap native
// <select> elements in their own container, MOVING the select out of its
// React-managed parent (observed in the cloud browser: the sort select ended
// up inside an injected .bb-custom-select-container). When React later
// inserts a sibling before the select (the industry chips arriving after the
// metadata fetch), insertBefore references a node that is no longer a child
// of the discovery bar and the whole tree unmounts (blank page). The select
// therefore renders inside a stable wrapper that tools have no reason to
// move; the wrapper is React's anchor, not the select.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import Investments from '../Investments';

const LIVE_CAMPAIGN = {
  id: 'staging-load',
  name: 'Staging Load Test Campaign',
  contractId: 'CCWQACVKAEGPRRSCM4YLY64ISNOEQSJQ33JCDPKTK4HTZSUFCUNGC7NK',
  mode: 'soroban',
  config: {
    creator: 'GATD42VPUY7ZMBBYAVSOZA43RJSHZ6VKYQFOIRWKLOVH2BNVQPPF5CYQ',
    deadline: '1798675200',
    goal: '10000000000000',
    token: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  },
  raised: '2390000000',
  withdrawn: false,
  balance: null,
  network: 'testnet',
  productionEligible: false,
};

const market: any = {
  campaigns: [LIVE_CAMPAIGN],
  loaded: true,
  fixtureMode: false,
  actor: '',
  busy: false,
  amounts: {},
  amountErrors: {},
  prepareErrors: {},
  onAmount: () => {},
  onPrepare: () => {},
  onRefresh: () => {},
  onToggleFixtures: () => {},
};

const METADATA = { metadata: { campaignId: 'staging-load', industry: 'energy-utilities', industryLabel: 'Energy and utilities', documents: [] } };

describe('Investments select anchor', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('survives an external tool moving the sort select before the industry chips insert', async () => {
    let resolveFetch: (r: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise<Response>((res) => {
            resolveFetch = res;
          }),
      ),
    );
    render(
      <I18nProvider>
        <Investments market={market} />
      </I18nProvider>,
    );
    const sort = document.querySelector('select.discovery-sort');
    expect(sort).toBeTruthy();
    if (!sort) throw new Error('sort select missing');
    // Simulate the extension: move the select into its own injected container.
    const extBox = document.createElement('div');
    extBox.className = 'bb-custom-select-container';
    sort.parentNode!.insertBefore(extBox, sort);
    extBox.appendChild(sort);
    // The metadata fetch now resolves: the industry chips insert into the
    // discovery bar. On the unfixed structure React's insertBefore anchor is
    // the moved select and this throws NotFoundError.
    await act(async () => {
      resolveFetch(new Response(JSON.stringify(METADATA), { status: 200 }));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(document.querySelector('h1')?.textContent).toBeTruthy();
    expect(document.querySelector('.discovery-bar')).toBeTruthy();
  });
});
