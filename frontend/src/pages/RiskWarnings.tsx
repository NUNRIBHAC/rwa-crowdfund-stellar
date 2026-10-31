import { useI18n } from '../i18n';

export default function RiskWarnings() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.riskWarnings.title}</h1>
      <ol className="risk-list">
        {m.riskWarnings.items.map((item) => (
          <li key={item.h}>
            <h2>{item.h}</h2>
            <p>{item.p}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
