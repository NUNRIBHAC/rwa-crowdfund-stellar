import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import CampaignBuilderDraft from '../CampaignBuilderDraft';
import CampaignCard from '../CampaignCard';
import CampaignPhoto from '../CampaignPhoto';
import SignInPanel from '../SignInPanel';
import { FIXTURE_CAMPAIGNS } from '../../fixtures';
const { auth, build, submit, sign } = vi.hoisted(() => ({ auth: { value: {} as Record<string, unknown> }, build: vi.fn(), submit: vi.fn(), sign: vi.fn() }));
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => auth.value }));
vi.mock('../../community/api', () => ({ buildCampaignDeploy: build, submitCampaignDeploy: submit, COMMUNITY_LIMITS: { displayName: 80 } }));
vi.mock('@stellar/freighter-api', () => ({ signTransaction: sign }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});
function builder(operator = true) {
  auth.value = { account: { publicKey: 'G'.repeat(56) }, token: 'synthetic', isOperator: operator };
  return render(
    <I18nProvider>
      <CampaignBuilderDraft />
    </I18nProvider>,
  );
}
function assertDescription(field: Element, text: string) {
  const ids = field.getAttribute('aria-describedby')?.split(' ') ?? [];
  expect(ids.some((id) => document.getElementById(id)?.textContent === text)).toBe(true);
}
describe('builder validation accessibility', () => {
  it('shows required errors on submit and focuses the first invalid field without invoking deployment', () => {
    const { container } = builder();
    const fields = Array.from(container.querySelectorAll('input[required]'));
    expect(fields).toHaveLength(4);
    expect(fields.every((field) => !field.hasAttribute('aria-invalid'))).toBe(true);
    const button = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(document.activeElement).toBe(fields[0]);
    for (const field of fields) {
      expect(field.getAttribute('aria-invalid')).toBe('true');
      assertDescription(field, 'Please fill in this field.');
    }
    expect(build).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    expect(sign).not.toHaveBeenCalled();
  });
  it('validates after blur and clears errors after correction, preserving deadline help', () => {
    const { container } = builder();
    const goal = container.querySelector('input[inputmode="decimal"]')!;
    fireEvent.change(goal, { target: { value: 'bad' } });
    expect(goal.hasAttribute('aria-invalid')).toBe(false);
    fireEvent.blur(goal);
    expect(goal.getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(goal, { target: { value: '100' } });
    expect(goal.hasAttribute('aria-invalid')).toBe(false);
    const deadline = container.querySelector('input[type="date"]')!;
    expect(deadline.getAttribute('aria-describedby')).toContain('deadline-note');
  });
  it('includes all v2 required fields in submit validation without deploying', () => {
    const { container } = builder();
    const selects = container.querySelectorAll('select');
    fireEvent.change(selects[1], { target: { value: 'v2' } });
    fireEvent.submit(container.querySelector('form')!);
    const fields = Array.from(container.querySelectorAll('input[required]'));
    expect(fields).toHaveLength(8);
    expect(fields.filter((field) => field.getAttribute('aria-invalid') === 'true')).toHaveLength(7); // decimals defaults to 7
    expect(build).not.toHaveBeenCalled();
  });
  it('keeps non-operator deployment disabled and guarded even on a valid direct form submission', () => {
    const { container } = builder(false);
    expect((container.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
    const fields = container.querySelectorAll('input[required]');
    for (const [i, value] of ['Project', 'project', '100', '2099-01-01'].entries()) fireEvent.change(fields[i], { target: { value } });
    fireEvent.submit(container.querySelector('form')!);
    expect(build).not.toHaveBeenCalled();
  });
});
it('card field errors have unique references even when the same campaign is rendered twice', () => {
  const props = {
    campaign: FIXTURE_CAMPAIGNS[0],
    actor: 'G'.repeat(56),
    busy: false,
    readOnly: false,
    amount: 'bad',
    amountError: 'Invalid amount',
    onAmount: vi.fn(),
    onPrepare: vi.fn(),
  };
  const { container } = render(
    <I18nProvider>
      <CampaignCard {...props} />
      <CampaignCard {...props} />
    </I18nProvider>,
  );
  const fields = container.querySelectorAll('input');
  expect(fields).toHaveLength(2);
  fields.forEach((field) => assertDescription(field, 'Invalid amount'));
  expect(fields[0].getAttribute('aria-describedby')).not.toBe(fields[1].getAttribute('aria-describedby'));
});
it('sign-in methods are an exclusively checked native radio group with a named fieldset', () => {
  auth.value = { account: null, restored: true, clearError: vi.fn(), socialProviders: [] };
  render(
    <I18nProvider>
      <SignInPanel actor="" />
    </I18nProvider>,
  );
  expect(screen.queryByRole('tablist')).toBeNull();
  expect(screen.getByRole('group').textContent).toContain('Wallet');
  const radios = screen.getAllByRole('radio') as HTMLInputElement[];
  expect(radios[0].checked).toBe(true);
  expect(radios[1].checked).toBe(false);
  expect(radios[0].name).toBe(radios[1].name);
  fireEvent.click(radios[1]);
  expect(radios[1].checked).toBe(true);
  expect(radios[0].checked).toBe(false);
  expect(auth.value.clearError).toHaveBeenCalled();
});
it('only the measured campaign hero is high-priority, listing cards stay lazy', () => {
  const { container } = render(
    <I18nProvider>
      <CampaignPhoto campaignId="qa-postclose" variant="campaign" />
      <CampaignPhoto campaignId="qa-postclose" variant="card" />
    </I18nProvider>,
  );
  const images = container.querySelectorAll('img');
  expect(images[0].hasAttribute('loading')).toBe(false);
  expect(images[0].getAttribute('fetchpriority')).toBe('high');
  expect(images[1].getAttribute('loading')).toBe('lazy');
  expect(images[1].hasAttribute('fetchpriority')).toBe(false);
});

describe('invalid deployment responses never call Freighter', () => {
  const safe = { xdr: 'unsigned-test-xdr', step: 'create', networkPassphrase: 'Test SDF Network ; September 2015', testOnly: true };
  for (const [label, response] of [
    ['missing testOnly', { ...safe, testOnly: undefined }],
    ['false testOnly', { ...safe, testOnly: false }],
    ['string testOnly', { ...safe, testOnly: 'true' }],
    ['missing network', { ...safe, networkPassphrase: undefined }],
    ['wrong network', { ...safe, networkPassphrase: 'Public Global Stellar Network ; September 2015' }],
    ['empty response', null],
  ] as const)
    it(label, async () => {
      build.mockResolvedValueOnce(response);
      const { container } = builder();
      const fields = container.querySelectorAll('input[required]');
      for (const [i, value] of ['Project', 'project', '100', '2099-01-01'].entries()) fireEvent.change(fields[i], { target: { value } });
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() => expect(build).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(container.textContent).toContain('unavailable'));
      expect(sign).not.toHaveBeenCalled();
      expect(submit).not.toHaveBeenCalled();
      expect(container.textContent).not.toContain('invalid testnet deployment build response');
    });
});
