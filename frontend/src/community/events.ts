// Cross-component invalidation for the account community-activity panel:
// submit forms dispatch this after a successful write so the account's own
// records lists refetch immediately instead of only on the next page load.
export const COMMUNITY_ACTIVITY_CHANGED = 'blockallisto-community-activity-changed';

export const notifyCommunityActivityChanged = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(COMMUNITY_ACTIVITY_CHANGED));
};
