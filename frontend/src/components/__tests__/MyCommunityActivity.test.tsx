// Regression: the account activity panel shows the wallet's OWN records
// (applications, tickets, comments) and must NOT re-introduce the unscoped
// site-wide news feed - invested-campaign news lives only in
// AccountNewsSection, filtered to the wallet's positions.
import { test, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

vi.mock('../../community/CommunityAuth', () => ({
  useCommunityAuth: vi.fn(),
}));

const mocks = vi.hoisted(() => ({
  fetchMyApplications: vi.fn().mockResolvedValue({ applications: [] }),
  fetchMyTickets: vi.fn().mockResolvedValue({ tickets: [] }),
  fetchMyComments: vi.fn().mockResolvedValue({ comments: [] }),
  fetchNewsFeed: vi.fn().mockResolvedValue({ news: [] }),
}));

vi.mock('../../community/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../community/api')>();
  return { ...actual, ...mocks };
});

import { useCommunityAuth } from '../../community/CommunityAuth';
import { COMMUNITY_ACTIVITY_CHANGED } from '../../community/events';
import MyCommunityActivity from '../MyCommunityActivity';
import { I18nProvider } from '../../i18n';

afterEach(cleanup);

const auth = vi.mocked(useCommunityAuth);

test('renders own-record sections and no site-wide news feed', async () => {
  auth.mockReturnValue({
    account: 'G'.repeat(56),
    token: 'tok',
    signIn: vi.fn(),
    busy: false,
    error: '',
    restored: true,
    signOut: vi.fn(),
    setDisplayName: vi.fn(),
  } as unknown as ReturnType<typeof useCommunityAuth>);

  render(
    <I18nProvider>
      <MyCommunityActivity />
    </I18nProvider>,
  );

  await waitFor(() => expect(mocks.fetchMyTickets).toHaveBeenCalled());
  expect(mocks.fetchMyApplications).toHaveBeenCalled();
  expect(mocks.fetchMyComments).toHaveBeenCalled();
  expect(mocks.fetchNewsFeed).not.toHaveBeenCalled();
  expect(screen.queryByText('Latest campaign news')).toBeNull();
  expect(screen.queryByText('Campaign news')).toBeNull();
});

test('refetches own records when a submit form announces a write', async () => {
  auth.mockReturnValue({
    account: 'G'.repeat(56),
    token: 'tok',
    signIn: vi.fn(),
    busy: false,
    error: '',
    restored: true,
    signOut: vi.fn(),
    setDisplayName: vi.fn(),
  } as unknown as ReturnType<typeof useCommunityAuth>);

  render(
    <I18nProvider>
      <MyCommunityActivity />
    </I18nProvider>,
  );

  await waitFor(() => expect(mocks.fetchMyTickets).toHaveBeenCalledTimes(1));
  window.dispatchEvent(new CustomEvent(COMMUNITY_ACTIVITY_CHANGED));
  await waitFor(() => expect(mocks.fetchMyTickets).toHaveBeenCalledTimes(2));
  expect(mocks.fetchMyApplications).toHaveBeenCalledTimes(2);
  expect(mocks.fetchMyComments).toHaveBeenCalledTimes(2);
});
