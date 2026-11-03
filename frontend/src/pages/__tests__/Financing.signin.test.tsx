import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Financing from '../Financing';
import { I18nProvider } from '../../i18n';
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => ({ account: null }) }));
test('Financing routes signed-out visitors to My account instead of duplicating sign-in', () => {
  localStorage.setItem('blockallisto-language', 'en');
  const { container } = render(
    <I18nProvider>
      <Financing />
    </I18nProvider>,
  );
  expect(screen.getByRole('link', { name: 'My account' }).getAttribute('href')).toBe('/account');
  expect(screen.queryByText('Community sign-in')).toBeNull();
  expect(container.querySelector('input[type=password]')).toBeNull();
});
