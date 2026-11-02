// ECSPR Art. 21 appropriateness section: the knowledge test submits answers
// for server-side scoring; the loss simulation computes client-side and
// transmits ONLY the two result figures (never the income/asset/commitment
// inputs); the mandated risk warning (RTS Art. 4(2) verbatim sentence) stays
// visible until acknowledged; held (503) and allowlist (403) deployments
// render honest states.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import AppropriatenessSection from '../AppropriatenessSection';

function ok(v: unknown) {
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function err(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { 'Content-Type': 'application/json' } });
}

const MANDATED = 'An investment in a crowdfunding project includes the risk of losing the entirety of the money invested.';

const ASSESSMENT_OK = {
  publicKey: 'GABC',
  version: 2,
  experienceLevel: 'some',
  objective: 'growth',
  information: null,
  categorisation: { status: 'non_sophisticated', request: null },
  knowledgeScore: 5,
  knowledgeTotal: 5,
  outcome: 'knowledge_check_passed',
  warningAcknowledgedAt: null,
  simulation: null,
  completedAt: 1730000000000,
  reviewAssessmentDueAt: 1793093600000,
  reviewSimulationDueAt: null,
};

const ASSESSMENT_WARN = { ...ASSESSMENT_OK, knowledgeScore: 2, outcome: 'warning_issued' };

vi.mock('../../community/CommunityAuth', () => ({
  useCommunityAuth: () => globalThis.__authMock,
}));

function auth() {
  return {
    account: { id: 'a1', wallet: 'GABC', displayName: 'QA', createdAt: 1, totpEnabled: false },
    token: 'tok',
    busy: false,
    error: '',
    restored: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
    setDisplayName: vi.fn(),
    totpPending: null,
    completeTotp: vi.fn(),
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __authMock: unknown;
}

describe('AppropriatenessSection', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the held note when the deployment does not collect (503)', async () => {
    globalThis.__authMock = auth();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(err(503, 'appropriateness collection is disabled on this deployment (held)')));
    render(
      <I18nProvider>
        <AppropriatenessSection />
      </I18nProvider>,
    );
    expect(await screen.findByText('The appropriateness assessment is not collecting responses on this deployment.')).toBeTruthy();
    expect(screen.queryByText('Entry knowledge test')).toBeNull();
  });

  it('renders the limited note for non-allowlisted accounts (403)', async () => {
    globalThis.__authMock = auth();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(err(403, 'appropriateness collection is limited to designated QA accounts')));
    render(
      <I18nProvider>
        <AppropriatenessSection />
      </I18nProvider>,
    );
    expect(await screen.findByText('On this deployment the assessment is limited to designated test accounts.')).toBeTruthy();
  });

  it('submits the knowledge test, shows the warning until acknowledged, then unlocks the simulation', async () => {
    globalThis.__authMock = auth();
    const spy = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const u = String(url);
      const method = init?.method ?? 'GET';
      if (u.endsWith('/api/auth/appropriateness') && method === 'GET') return Promise.resolve(ok({ record: null }));
      if (u.endsWith('/knowledge')) return Promise.resolve(ok({ record: ASSESSMENT_WARN }));
      if (u.endsWith('/acknowledge-warning')) return Promise.resolve(ok({ record: { ...ASSESSMENT_WARN, warningAcknowledgedAt: 1730000001000 } }));
      if (u.endsWith('/simulation-result'))
        return Promise.resolve(
          ok({
            record: {
              ...ASSESSMENT_WARN,
              warningAcknowledgedAt: 1730000001000,
              simulation: { netWorthEur: 42000, capacityEur: 4200, transmittedAt: 1730000002000 },
              reviewSimulationDueAt: 1761542000000,
            },
          }),
        );
      return Promise.resolve(ok({}));
    });
    vi.stubGlobal('fetch', spy);
    render(
      <I18nProvider>
        <AppropriatenessSection />
      </I18nProvider>,
    );

    // Knowledge form: five yes/no questions plus experience/objective selects.
    await screen.findByText('Can you lose the entirety of the money you invest in a crowdfunding project?');
    const submit = screen.getByText('Submit answers') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    const selects = document.querySelectorAll('select');
    fireEvent.change(selects[0], { target: { value: 'some' } });
    fireEvent.change(selects[1], { target: { value: 'growth' } });
    for (let i = 0; i < 5; i++) {
      const radios = document.querySelectorAll(`input[name="appr-q-${i}"]`);
      fireEvent.click(radios[0]);
    }
    // Submit stays disabled until the Art. 21(2) information set is complete.
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Savings and deposits'));
    fireEvent.click(screen.getByLabelText('No past transactions'));
    fireEvent.change(selects[2], { target: { value: '0' } }); // frequency
    fireEvent.change(selects[3], { target: { value: '0' } }); // volume
    fireEvent.change(selects[4], { target: { value: 'none' } }); // period
    fireEvent.change(selects[5], { target: { value: 'none_relevant' } }); // education
    fireEvent.change(selects[6], { target: { value: 'under_1y' } }); // holding
    fireEvent.change(selects[7], { target: { value: 'conservative' } }); // risk
    fireEvent.change(selects[8], { target: { value: 'none' } }); // sustainability
    fireEvent.click(document.querySelectorAll('input[name="appr-crowdfund-exp"]')[1]); // no professional experience
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);
    await waitFor(() => {
      const call = spy.mock.calls.find((c) => String(c[0]).endsWith('/knowledge'));
      expect(call).toBeTruthy();
      const body = JSON.parse(String(call![1]?.body));
      expect(body).toEqual({
        experienceLevel: 'some',
        objective: 'growth',
        answers: [0, 0, 0, 0, 0],
        information: {
          familiarInvestmentTypes: ['deposits'],
          pastTransactions: { natures: ['none'], annualFrequencyBand: '0', totalVolumeBandEur: '0', periodYearsBand: 'none' },
          educationLevel: 'none_relevant',
          professionOrFormer: null,
          crowdfundingProfessionalExperience: false,
          holdingPeriod: 'under_1y',
          riskProfile: 'conservative',
          sustainabilityPreference: 'none',
        },
      });
    });

    // Warning path: mandated sentence visible verbatim, simulation not yet offered.
    expect(await screen.findByText(MANDATED)).toBeTruthy();
    expect(screen.queryByText('Loss-bearing capacity simulation')).toBeNull();
    fireEvent.click(screen.getByText('I have read and acknowledge this risk warning'));
    await waitFor(() => {
      expect(spy.mock.calls.some((c) => String(c[0]).endsWith('/acknowledge-warning'))).toBe(true);
    });

    // Simulation computes client-side; transmission carries ONLY the results.
    await screen.findByText('Loss-bearing capacity simulation');
    const inputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(inputs[0], { target: { value: '30000' } });
    fireEvent.change(inputs[1], { target: { value: '20000' } });
    fireEvent.change(inputs[2], { target: { value: '8000' } });
    fireEvent.click(screen.getByText('Calculate'));
    await screen.findByText(/Estimated net worth/);
    fireEvent.click(screen.getByText('Transmit result'));
    await waitFor(() => {
      const call = spy.mock.calls.find((c) => String(c[0]).endsWith('/simulation-result'));
      expect(call).toBeTruthy();
      const body = JSON.parse(String(call![1]?.body));
      // (30000 + 20000 - 8000) = 42000; 10% = 4200. Raw inputs must never appear.
      expect(body).toEqual({ netWorthEur: 42000, capacityEur: 4200 });
      expect(JSON.stringify(body)).not.toContain('30000');
      expect(JSON.stringify(body)).not.toContain('8000');
    });
  });

  it('shows an existing assessment with its review dates', async () => {
    globalThis.__authMock = auth();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ record: ASSESSMENT_OK })));
    render(
      <I18nProvider>
        <AppropriatenessSection />
      </I18nProvider>,
    );
    expect(await screen.findByText('Your results')).toBeTruthy();
    expect(screen.getByText('Passed')).toBeTruthy();
    expect(screen.getByText(/5 of 5 correct/)).toBeTruthy();
    expect(screen.getByText('This result does not classify you as a sophisticated or professional investor.')).toBeTruthy();
    expect(screen.getByText(/not the appropriateness assessment required by ECSPR Article 21\(1\)/)).toBeTruthy();
    // Categorisation: default non-sophisticated with the capture-only note.
    expect(screen.getByText('Non-sophisticated investor')).toBeTruthy();
  });

  it('captures an Annex II sophistication request (natural person, 2 of 3 criteria)', async () => {
    globalThis.__authMock = auth();
    const spy = vi.fn().mockImplementation((url: unknown, _init?: RequestInit) => {
      const u = String(url);
      if (u.endsWith('/sophistication-request'))
        return Promise.resolve(
          ok({
            record: {
              ...ASSESSMENT_OK,
              categorisation: {
                status: 'sophistication_requested',
                request: {
                  route: 'annex_ii_attestation',
                  personType: 'natural',
                  attestedCriteria: ['np_income_60k_or_portfolio_over_100k', 'np_financial_sector_1y_or_exec_12m'],
                  professionalClientProof: null,
                  awarenessStatementAccepted: true,
                  liabilityStatementAccepted: true,
                  requestedAt: 1730000003000,
                },
              },
            },
          }),
        );
      return Promise.resolve(ok({ record: ASSESSMENT_OK }));
    });
    vi.stubGlobal('fetch', spy);
    render(
      <I18nProvider>
        <AppropriatenessSection />
      </I18nProvider>,
    );
    await screen.findByText('Investor categorisation');
    const submitSoph = screen.getByText('Submit categorisation request') as HTMLButtonElement;
    expect(submitSoph.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('A natural person (individual)'));
    fireEvent.click(screen.getByLabelText(/Personal gross income of at least EUR 60,000/));
    fireEvent.click(screen.getByLabelText(/worked in the financial sector for at least one year/));
    fireEvent.click(screen.getByLabelText(/I am aware of the consequences of losing/));
    fireEvent.click(screen.getByLabelText(/I remain liable for the veracity/));
    expect(submitSoph.disabled).toBe(false);
    fireEvent.click(submitSoph);
    await waitFor(() => {
      const call = spy.mock.calls.find((c) => String(c[0]).endsWith('/sophistication-request'));
      expect(call).toBeTruthy();
      const body = JSON.parse(String(call![1]?.body));
      expect(body).toEqual({
        route: 'annex_ii_attestation',
        personType: 'natural',
        attestedCriteria: ['np_income_60k_or_portfolio_over_100k', 'np_financial_sector_1y_or_exec_12m'],
        professionalClientProof: null,
        awarenessStatementAccepted: true,
        liabilityStatementAccepted: true,
      });
    });
    // Capture-only: the recorded request status renders, never an approval.
    expect(await screen.findByText(/Sophisticated-investor treatment requested/)).toBeTruthy();
  });
});
