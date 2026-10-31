import { test, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('../../community/CommunityAuth', () => ({
  useCommunityAuth: vi.fn(),
}));

import { useCommunityAuth } from '../../community/CommunityAuth';
import IssuerApplicationPreview from '../IssuerApplicationPreview';
import { I18nProvider } from '../../i18n';

afterEach(cleanup);

const auth = vi.mocked(useCommunityAuth);

function authState(over: Record<string, unknown>) {
  auth.mockReturnValue({ account: null, restored: true, ...over } as unknown as ReturnType<typeof useCommunityAuth>);
}

test('signed-out visitor sees the labeled preview with disabled fields and no way to submit', () => {
  authState({});
  render(
    <I18nProvider>
      <IssuerApplicationPreview />
    </I18nProvider>,
  );
  expect(screen.getByText('Application (preview)')).toBeTruthy();
  expect(screen.getByText(/Nothing entered here is sent or stored/)).toBeTruthy();
  for (const input of screen.getAllByPlaceholderText('Preview only - sign in to apply')) {
    expect((input as HTMLInputElement).disabled).toBe(true);
  }
  const submit = screen.getByRole('button', { name: 'Submit application (sign in first)' });
  expect((submit as HTMLButtonElement).disabled).toBe(true);
  expect(document.querySelector('form')).toBeNull();
});

test('signed-in visitor does not see the preview (the real form takes over)', () => {
  authState({ account: { publicKey: 'G'.repeat(56) } });
  const { container } = render(
    <I18nProvider>
      <IssuerApplicationPreview />
    </I18nProvider>,
  );
  expect(container.firstChild).toBeNull();
});
