import { useI18n } from '../i18n';

type Props = {
  fixtureMode: boolean;
  onToggleFixtures: () => void;
};

export default function EmptyState({ fixtureMode, onToggleFixtures }: Props) {
  const { m } = useI18n();
  if (fixtureMode) {
    return (
      <div className="fixture-banner" role="note">
        <strong>{m.emptyState.fixtureStrong}</strong> {m.emptyState.fixtureText}{' '}
        <button className="btn btn-ghost" onClick={onToggleFixtures}>
          {m.emptyState.fixtureBack}
        </button>
      </div>
    );
  }
  return (
    <section className="empty-state">
      <h2>{m.emptyState.emptyTitle}</h2>
      <p>{m.emptyState.emptyText}</p>
      <button className="btn" onClick={onToggleFixtures}>
        {m.emptyState.emptyCta}
      </button>
    </section>
  );
}
