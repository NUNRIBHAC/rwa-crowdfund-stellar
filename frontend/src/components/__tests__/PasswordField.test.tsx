import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import SignInPanel from '../SignInPanel';
import { I18nProvider } from '../../i18n';
const { auth } = vi.hoisted(() => ({ auth: { value: {} as Record<string, unknown> } }));
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => auth.value }));
afterEach(cleanup);

function openEmail() {
  auth.value = { account: null, busy: false, restored: true, error: '', clearError: vi.fn(), emailSignUp: vi.fn(), emailSignIn: vi.fn(), socialProviders: [] };
  render(
    <I18nProvider>
      <SignInPanel actor="" />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('radio', { name: 'Email' }));
}

test('sign-up password field can be shown and hidden without losing the value', () => {
  openEmail();
  const input = screen.getByLabelText('Password') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'my secret value' } });
  expect(input.type).toBe('password');
  const toggle = screen.getByRole('button', { name: 'Show' });
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(toggle);
  expect(input.type).toBe('text');
  expect(input.value).toBe('my secret value');
  expect(screen.getByRole('button', { name: 'Hide' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
  expect(input.type).toBe('password');
});

test('sign-up shows an indicative strength, login does not', () => {
  openEmail();
  const input = screen.getByLabelText('Password');
  expect(document.querySelector('.password-strength')!.textContent).toBe('');
  fireEvent.change(input, { target: { value: 'short' } });
  expect(document.querySelector('.password-strength')!.textContent).toContain('Too short');
  fireEvent.change(input, { target: { value: 'Tr4vel-Lisbon-Tiles-2026' } });
  expect(document.querySelector('.password-strength')!.textContent).toContain('strong');
  fireEvent.click(screen.getByRole('button', { name: 'I already have an account' }));
  expect(screen.getByLabelText('Password')).toBeTruthy();
  expect(document.querySelector('.password-strength')).toBeNull();
  expect(screen.getByRole('button', { name: 'Show' })).toBeTruthy();
});
