import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import IntentPanel from '../IntentPanel';
import { I18nProvider, LOCALES, useI18n } from '../../i18n';
import type { Intent } from '../../types';

afterEach(cleanup);

const statuses = ['BUILT', 'SIGNED', 'PENDING', 'SUCCESS', 'FAILED', 'NOT_FOUND', 'CANCELLED_UNSIGNED'];
const knownCases = LOCALES.flatMap(({ id }) => statuses.map((status) => ({ locale: id, status })));
const unknownCases = LOCALES.flatMap(({ id }) => ['FUTURE_STATUS', '__proto__', 'constructor'].map((status) => ({ locale: id, status })));

function Panel({ status, unknown = false }: { status: string; unknown?: boolean }) {
  const { m } = useI18n();
  const intent: Intent = { hash: 'a'.repeat(64), campaign: 'status-label-fixture', actor: 'G'.repeat(56), action: 'contribute', xdr: 'FIXTURE', status };
  return (
    <>
      <output data-testid="expected-label">{unknown ? m.account.savedTxUnknown : m.intent.statusLabels[status]}</output>
      <IntentPanel intent={intent} busy={false} onSubmit={vi.fn()} onCheck={vi.fn()} onCancel={vi.fn()} onClear={vi.fn()} />
    </>
  );
}

test.each(knownCases)('$locale: IntentPanel renders the localized $status label', ({ locale, status }) => {
  const { container } = render(
    <I18nProvider initialLocale={locale}>
      <Panel status={status} />
    </I18nProvider>,
  );
  expect(container.querySelector('.intent-head .status-chip')?.textContent).toBe(screen.getByTestId('expected-label').textContent);
});

test.each(unknownCases)('$locale: IntentPanel never prints unknown wire value $status', ({ locale, status }) => {
  const { container } = render(
    <I18nProvider initialLocale={locale}>
      <Panel status={status} unknown />
    </I18nProvider>,
  );
  const label = container.querySelector('.intent-head .status-chip')?.textContent;
  expect(label).toBe(screen.getByTestId('expected-label').textContent);
  expect(label).not.toBe(status);
});
