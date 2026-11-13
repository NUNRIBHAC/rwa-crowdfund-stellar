import { StrictMode } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider, currentLocale, localizedApiError, requestFailedMessage, useI18n } from './index';
import { emailRegister, emailResend, emailResetRequest } from '../community/api';
import { ar } from './locales/ar';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});
it('country-selected UI and non-React API/errors use the same locale without persistence', () => {
  localStorage.clear();
  function Probe() {
    return <span>{useI18n().locale}</span>;
  }
  render(
    <StrictMode>
      <I18nProvider initialLocale="ar">
        <Probe />
      </I18nProvider>
    </StrictMode>,
  );
  expect(screen.getByText('ar')).toBeTruthy();
  expect(currentLocale()).toBe('ar');
  expect(localizedApiError('API_UNAVAILABLE')).toBe(ar.errors.apiUnavailable);
  expect(requestFailedMessage(503)).toBe(ar.community.requestFailed.replace('{status}', '503'));
  expect(localStorage.getItem('blockallisto-language')).toBeNull();
});

it('mail requests use the country-selected UI language without persisting it', async () => {
  localStorage.clear();
  const bodies: Record<string, unknown>[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ status: 'verification-sent' }), { status: 200 });
    }),
  );
  render(
    <I18nProvider initialLocale="ar">
      <span>country</span>
    </I18nProvider>,
  );
  await emailRegister('a@b.c', 'synthetic-password');
  await emailResend('a@b.c');
  await emailResetRequest('a@b.c');
  expect(bodies).toHaveLength(3);
  for (const body of bodies) expect(body.locale).toBe('ar');
  expect(localStorage.getItem('blockallisto-language')).toBeNull();
});
