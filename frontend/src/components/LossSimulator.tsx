import { useState } from 'react';
import { useI18n } from '../i18n';
import { simulate, type ScenarioId } from '../loss-simulator';

export default function LossSimulator() {
  const { m, locale } = useI18n();
  const t = m.lossSimulator;
  const [scenario, setScenario] = useState<ScenarioId>('base');
  const result = simulate(scenario);
  const money = (value: bigint) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })
      .formatToParts(value / 100n)
      .map((p) =>
        p.type === 'fraction' ? new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }).format(Number(value % 100n)) : p.value,
      )
      .join('');
  const bp = (value: bigint) => `${value / 100n}.${String(value % 100n).padStart(2, '0')}%`;
  const fields = ['ead', 'recovered', 'realized', 'expected', 'unresolved', 'interest', 'costs'] as const;
  return (
    <section className="loss-simulator" aria-labelledby="loss-simulator-title">
      <h2 id="loss-simulator-title">{t.title}</h2>
      <p className="risk-note">{t.notice}</p>
      <p>{t.convention}</p>
      <p>{t.concentrationNote}</p>
      <label htmlFor="loss-scenario">{t.scenario}</label>{' '}
      <select id="loss-scenario" value={scenario} onChange={(e) => setScenario(e.target.value as ScenarioId)}>
        {(['base', 'adverse', 'severe'] as const).map((id) => (
          <option key={id} value={id}>
            {t[id]}
          </option>
        ))}
      </select>
      <div className="loss-summary" aria-live="polite">
        <h3>{t.portfolio}</h3>
        <dl>
          {fields.map((key) => (
            <div key={key}>
              <dt>{t[key]}</dt>
              <dd>{money(result.totals[key])}</dd>
            </div>
          ))}
        </dl>
        <p>
          {t.platform}: {money(result.platformOperatingLoss)}. {t.platformNote}
        </p>
      </div>
      <h3>{t.loans}</h3>
      <div className="loss-table-scroll" tabIndex={0} role="region" aria-label={t.loans}>
        <table>
          <thead>
            <tr>
              <th>{t.loan}</th>
              <th>{t.stateLabel}</th>
              {fields.map((k) => (
                <th key={k}>{t[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.loan.id}>
                <th scope="row">
                  {r.loan.id} / {r.loan.campaign} / {r.loan.promoter}
                </th>
                <td>{t.states[r.state]}</td>
                {fields.map((k) => (
                  <td key={k}>{money(r[k])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="loss-groups">
        {(['campaigns', 'promoters'] as const).map((kind) => (
          <section key={kind}>
            <h3>{t[kind]}</h3>
            <dl>
              {Object.entries(result[kind]).map(([id, value]) => (
                <div key={id}>
                  <dt>{id}</dt>
                  <dd>
                    {t.ead}: {money(value.ead)}; {t.recovered}: {money(value.recovered)}; {t.realized}: {money(value.loss)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <section>
          <h3>{t.investors}</h3>
          <dl>
            {Object.entries(result.investors).map(([id, value]) => (
              <div key={id}>
                <dt>{id}</dt>
                <dd>
                  {t.ead}: {money(value.ead)}; {t.recovered}: {money(value.recovered)}; {t.realized}: {money(value.loss)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <h3>{t.register}</h3>
      {result.rows.map((r) => (
        <details key={r.loan.id}>
          <summary>
            {r.loan.id}: {t.states[r.state]}
          </summary>
          <dl>
            {(
              [
                ['principal', r.loan.principal],
                ['received', r.loan.principalReceived],
                ['collateral', r.loan.collateralValue],
              ] as const
            ).map(([k, value]) => (
              <div key={k}>
                <dt>{t[k]}</dt>
                <dd>{money(value)}</dd>
              </div>
            ))}
            <div>
              <dt>{t.rate}</dt>
              <dd>{bp(r.loan.annualRateBps)}</dd>
            </div>
            <div>
              <dt>PD / LGD</dt>
              <dd>
                <bdi dir="ltr">
                  {bp(r.pdBps)} / {bp(10000n - r.recoveryBps)}
                </bdi>
              </dd>
            </div>
            <div>
              <dt>{t.days}</dt>
              <dd>{r.days.toString()}</dd>
            </div>
          </dl>
          <h4>{t.received}</h4>
          <ul>
            {r.loan.payments.map((s) => (
              <li key={s.received}>
                <time dateTime={s.received}>{s.received}</time>: {money(s.principal)}
              </li>
            ))}
          </ul>
          <h4>{t.schedule}</h4>
          <ul>
            {r.loan.schedule.map((s) => (
              <li key={s.due}>
                <time dateTime={s.due}>{s.due}</time>: {money(s.principal)}
              </li>
            ))}
          </ul>
          <h4>{t.events}</h4>
          <ol>
            {r.events.map((event, i) => (
              <li key={i}>{t.states[event]}</li>
            ))}
          </ol>
        </details>
      ))}
      <p>{t.formula}</p>
      <p>{t.legal}</p>
    </section>
  );
}
