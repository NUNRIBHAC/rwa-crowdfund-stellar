import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import SignInPanel from '../SignInPanel';
import { I18nProvider } from '../../i18n';
const { auth } = vi.hoisted(() => ({ auth: { value: {} as Record<string, unknown> } }));
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => auth.value }));
afterEach(cleanup);
test('empty credential submit is enabled for native validation but never calls authentication', () => {
  const signup = vi.fn();
  auth.value = { account: null, busy: false, restored: true, error: '', clearError: vi.fn(), emailSignUp: signup, socialProviders: [] };
  const { container, rerender } = render(
    <I18nProvider>
      <SignInPanel actor="" />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('radio', { name: 'Email' }));
  const form = container.querySelector('form')!;
  const fields = [...form.querySelectorAll('input')];
  const ids = fields.map((field) => field.id);
  expect(ids.every(Boolean)).toBe(true);
  expect(fields.map((field) => field.name)).toEqual(['email', 'password']);
  expect((form.querySelector('button') as HTMLButtonElement).disabled).toBe(false);
  fireEvent.submit(form);
  expect(signup).not.toHaveBeenCalled();
  rerender(
    <I18nProvider>
      <SignInPanel actor="" />
    </I18nProvider>,
  );
  expect([...form.querySelectorAll('input')].map((field) => field.id)).toEqual(ids);
});
test('announces busy authentication with existing localized status text', () => {
  auth.value = { account: null, busy: true, restored: true, error: '', socialProviders: [] };
  render(
    <I18nProvider>
      <SignInPanel actor="GTEST" />
    </I18nProvider>,
  );
  expect(screen.getByRole('status').textContent?.trim()).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Sign in with wallet' }).hasAttribute('disabled')).toBe(true);
});
