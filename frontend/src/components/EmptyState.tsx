type Props = {
  fixtureMode: boolean;
  onToggleFixtures: () => void;
};

export default function EmptyState({ fixtureMode, onToggleFixtures }: Props) {
  if (fixtureMode) {
    return (
      <div className="fixture-banner" role="note">
        <strong>Sample preview active.</strong> The campaigns below are fixtures to show the layout. They are not deployed contracts, not live offers, and
        cannot accept contributions.{' '}
        <button className="btn btn-ghost" onClick={onToggleFixtures}>
          Back to live registry
        </button>
      </div>
    );
  }
  return (
    <section className="empty-state">
      <h2>No deployed campaign configured</h2>
      <p>
        An operator must deploy and verify the reviewed contract separately, then set SOROBAN_CAMPAIGNS_JSON. Deployment and migration are not performed here.
        Legacy campaigns are read-only and require reconciliation.
      </p>
      <button className="btn" onClick={onToggleFixtures}>
        Preview with sample campaigns
      </button>
    </section>
  );
}
