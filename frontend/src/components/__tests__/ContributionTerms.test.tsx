import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import ContributionTerms from '../ContributionTerms';
import { I18nProvider, LOCALES } from '../../i18n';
import { en } from '../../i18n/locales/en';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function setup(fixtureMode: boolean, locale = 'en') {
  localStorage.setItem('blockallisto-language', locale);
  return render(
    <I18nProvider>
      <ContributionTerms fixtureMode={fixtureMode} />
    </I18nProvider>,
  );
}

test('live escrow explains the record, no security or return rights, manual outcomes and unavailable offer facts', () => {
  setup(false);
  expect(screen.getByRole('region', { name: en.contributionTerms.title })).toBeTruthy();
  for (const key of ['record', 'rights', 'missing', 'fees'] as const) expect(screen.getByText(en.contributionTerms[key])).toBeTruthy();
  expect(screen.getByText(en.contributionPreview.outcomes)).toBeTruthy();
  expect(screen.getByText(en.campaign.widgetRisk)).toBeTruthy();
  expect(screen.queryByText(en.contributionTerms.fixture)).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});

test('fixture preview cannot claim a deployed contract, balance record, fee policy or refund mechanism', () => {
  setup(true);
  expect(screen.getByText(en.contributionTerms.fixture)).toBeTruthy();
  expect(screen.getByText(en.contributionTerms.missing)).toBeTruthy();
  for (const text of [en.contributionTerms.record, en.contributionTerms.rights, en.contributionTerms.fees, en.contributionPreview.outcomes])
    expect(screen.queryByText(text)).toBeNull();
});

test.each(LOCALES.map(({ id }) => id))('contribution terms are present and localized in %s', (locale) => {
  setup(false, locale);
  const region = screen.getByRole('region');
  expect(region.textContent!.trim().length).toBeGreaterThan(180);
  expect(region.querySelectorAll('p').length).toBe(6);
  if (locale !== 'en') expect(screen.queryByText(en.contributionTerms.title)).toBeNull();
});
