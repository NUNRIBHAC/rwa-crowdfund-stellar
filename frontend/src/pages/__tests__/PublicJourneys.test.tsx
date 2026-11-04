import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import HowItWorks from '../HowItWorks';
import Learn from '../Learn';
import Financing from '../Financing';
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => ({ account: null, restored: true }) }));
afterEach(cleanup);
function show(component: React.ReactNode) {
  localStorage.setItem('blockallisto-language', 'en');
  return render(<I18nProvider>{component}</I18nProvider>);
}
test('journey selector changes the mobile panel without hiding desktop content', () => {
  const { container } = show(<HowItWorks />);
  expect(container.querySelector('.journey-selected')?.getAttribute('aria-label')).toBe('Investor journey');
  fireEvent.click(screen.getByRole('button', { name: 'Issuer journey' }));
  expect(container.querySelector('.journey-selected')?.getAttribute('aria-label')).toBe('Issuer journey');
  expect(screen.getByRole('region', { name: 'Investor journey' })).toBeTruthy();
  expect(screen.getAllByText('Partial prototype').length).toBe(6);
  expect(screen.getByText(/no approval process runs on this deployment/)).toBeTruthy();
});
test('Learn separates debt parents from participation and retains taxonomy anchors', () => {
  show(<Learn />);
  const debt = screen.getByRole('region', { name: 'Debt instruments' });
  expect(within(debt).getByRole('heading', { name: 'Loan', level: 3 })).toBeTruthy();
  expect(within(debt).getByRole('heading', { name: 'Bond', level: 3 })).toBeTruthy();
  const participation = screen.getByRole('region', { name: 'Participation instruments' });
  expect(within(participation).queryByRole('heading', { name: 'Loan' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Debt instruments' }).getAttribute('href')).toBe('#learn-debt');
});
test('financing preview remains disabled with sign-in and non-submission notices', () => {
  show(<Financing />);
  expect(screen.getByRole('heading', { name: 'Application (preview)' })).toBeTruthy();
  expect(screen.getByText(/Nothing entered here is sent or stored/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Submit application (sign in first)' }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('link', { name: 'My account' }).getAttribute('href')).toBe('/account');
});
