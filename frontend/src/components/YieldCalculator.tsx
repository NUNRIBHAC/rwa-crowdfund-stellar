import './yield-calculator.css';
import { calculatePortfolio, PORTUGAL_STANDARD_CAPITAL_TAX, type PortfolioInputs } from '../portfolio-return';
import { useState } from 'react';
import { calculateYield, type YieldScenario, type YieldStrategy } from '../yield-calculator';
import { SAMPLE_CATALOG } from '../data/sampleCatalog';
import { SAMPLE_YIELD_TERMS } from '../data/yield-calculator-instruments';
import { useI18n } from '../i18n';
import { instrumentLabel } from '../data/instruments';

// All calculator copy comes from the verified Weblate return catalogs.
// The independent engines do not access accounts, wallets or persistence.
export type YieldCalculatorCopy = {
  title: string;
  advanced: string;
  chart: string;
  chartNote: string;
  idleCash: string;
  annualDefault: string;
  recovery: string;
  recoveryDelay: string;
  fee: string;
  taxRate: string;
  taxBasis: string;
  taxSource: string;
  platformMonth: string;
  platformExposure: string;
  platformRecovery: string;
  platformDelay: string;
  stress: string;
  advancedNote: string;
  breakdown: string;
  interestReceived: string;
  taxPaid: string;
  feesPaid: string;
  principalLost: string;
  pendingRecovery: string;
  availableAssets: string;
  recovered: string;
  idleEffect: string;
  borrowerEffect: string;
  platformEffect: string;
  feeEffect: string;
  taxEffect: string;
  waterfallNote: string;
  portfolioTable: string;
  performing: string;
  idleBalance: string;
  payouts: string;
  interest: string;
  tax: string;
  feeAmount: string;
  lossAmount: string;
  recoveryAmount: string;
  pendingAmount: string;
  nominalWealth: string;

  notice: string;
  sample: string;
  campaign: string;
  manual: string;
  amount: string;
  rate: string;
  months: string;
  strategy: string;
  reinvest: string;
  withdraw: string;
  scenario: string;
  optimistic: string;
  base: string;
  pessimistic: string;
  discount: string;
  assumptions: string;
  assumptionsNote: string;
  inflation: string;
  realTerms: string;
  etfRate: string;
  depositRate: string;
  reference: string;
  referenceWarning: string;
  negativeWarning: string;
  variableWarning: string;
  conditionalWarning: string;
  projection: string;
  gain: string;
  gross: string;
  reduction: string;
  annualized: string;
  monthly: string;
  etf: string;
  deposit: string;
  month: string;
  table: string;
  formula: string;
  taxes: string;
  invalid: string;
};
export default function YieldCalculator({ copy: t }: { copy: YieldCalculatorCopy }) {
  const { m, locale } = useI18n();
  const [campaignId, setCampaignId] = useState('fixture-lisbon-riverside');
  const [amount, setAmount] = useState('50000');
  const [rate, setRate] = useState('6.5');
  const [months, setMonths] = useState('24');
  const [strategy, setStrategy] = useState<YieldStrategy>('reinvest');
  const [scenario, setScenario] = useState<YieldScenario>('base');
  const [discount, setDiscount] = useState('2.5');
  const [inflation, setInflation] = useState('2');
  const [etfRate, setEtfRate] = useState('7');
  const [depositRate, setDepositRate] = useState('2.5');
  const [realTerms, setRealTerms] = useState(false);
  const [reference, setReference] = useState(false);
  const [stress, setStress] = useState(false);
  const [advanced, setAdvanced] = useState({
    idleCashPct: '0',
    annualDefaultPct: '0',
    recoveryPct: '0',
    recoveryDelayMonths: '0',
    annualFeePct: '0',
    taxPct: '28',
    platformFailureMonth: '0',
    platformExposurePct: '100',
    platformRecoveryPct: '0',
    platformRecoveryDelayMonths: '0',
  });
  const setAdvancedField = (key: keyof typeof advanced, value: string) => setAdvanced((a) => ({ ...a, [key]: value }));
  const terms = SAMPLE_YIELD_TERMS.find((x) => x.campaignId === campaignId);
  const unsupported = terms !== undefined && terms.annualRatePct === null;
  let result: ReturnType<typeof calculateYield> | null = null;
  try {
    if (![amount, rate, months, discount, inflation, etfRate, depositRate].some((x) => x.trim() === '') && !unsupported) {
      result = calculateYield({
        amount: Number(amount),
        annualRatePct: Number(rate),
        months: Number(months),
        strategy,
        scenario,
        discountPp: Number(discount),
        inflationPct: Number(inflation),
        etfRatePct: Number(etfRate),
        depositRatePct: Number(depositRate),
        realTerms,
        referenceZeroFloor: reference,
      });
    }
  } catch {
    /* A translated validation message replaces invalid output. */
  }
  let portfolio: ReturnType<typeof calculatePortfolio> | null = null;
  try {
    if (![amount, rate, months, inflation, ...Object.values(advanced)].some((v) => v.trim() === '') && !unsupported) {
      portfolio = calculatePortfolio({
        amount: Number(amount),
        annualCouponPct: Number(rate),
        months: Number(months),
        inflationPct: Number(inflation),
        reinvest: strategy === 'reinvest',
        immediateDefaultPct: stress ? 50 : 0,
        ...Object.fromEntries(Object.entries(advanced).map(([k, v]) => [k, Number(v)])),
      } as PortfolioInputs);
    }
  } catch {
    /* Translated validation replaces invalid output. */
  }
  const chartValues = portfolio ? [Number(amount), ...portfolio.rows.map((r) => r.nominalWealth)] : [];
  const chartMax = Math.max(Number(amount), ...chartValues, 1);
  const chartPoints = chartValues.map((value, i) => `${40 + (i / (chartValues.length - 1)) * 520},${180 - (value / chartMax) * 150}`).join(' ');
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  const ledgerMoney = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const percent = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100);
  const numberInput = (id: string, label: string, value: string, set: (value: string) => void, min: number, max: number, step: number) => (
    <label key={id} htmlFor={`yield-${id}`}>
      {label}
      <input id={`yield-${id}`} type="number" inputMode="decimal" value={value} min={min} max={max} step={step} onChange={(e) => set(e.target.value)} />
    </label>
  );
  const selectCampaign = (id: string) => {
    setCampaignId(id);
    const next = SAMPLE_YIELD_TERMS.find((x) => x.campaignId === id);
    if (next?.annualRatePct !== null && next?.annualRatePct !== undefined) setRate(String(next.annualRatePct));
  };
  return (
    <section className="yield-calculator" aria-labelledby="yield-title">
      <h2 id="yield-title">{t.title}</h2>
      <p className="risk-note">{t.notice}</p>
      <p>{t.sample}</p>
      <div className="yield-controls">
        <label htmlFor="yield-campaign">
          {t.campaign}
          <select id="yield-campaign" value={campaignId} onChange={(e) => selectCampaign(e.target.value)}>
            <option value="manual">{t.manual}</option>
            {SAMPLE_CATALOG.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {instrumentLabel(m, c.instrument)}
              </option>
            ))}
          </select>
        </label>
        {terms?.couponModel === 'conditional' && <p className="risk-note">{t.conditionalWarning}</p>}
        {unsupported && <p role="status">{t.variableWarning}</p>}
        {numberInput('amount', t.amount, amount, setAmount, 1, 1e12, 0.01)}
        {numberInput('rate', t.rate, rate, setRate, reference ? -99.99 : 0, 100, 0.1)}
        {numberInput('months', t.months, months, setMonths, 1, 1200, 1)}
        <label htmlFor="yield-strategy">
          {t.strategy}
          <select id="yield-strategy" value={strategy} onChange={(e) => setStrategy(e.target.value as YieldStrategy)}>
            <option value="reinvest">{t.reinvest}</option>
            <option value="withdraw">{t.withdraw}</option>
          </select>
        </label>
        {reference && (
          <label htmlFor="yield-scenario">
            {t.scenario}
            <select
              id="yield-scenario"
              value={scenario}
              onChange={(e) => {
                const next = e.target.value as YieldScenario;
                setScenario(next);
                setDiscount(String({ optimistic: 0.5, base: 2.5, pessimistic: 6 }[next]));
              }}
            >
              {(['optimistic', 'base', 'pessimistic'] as const).map((s) => (
                <option key={s} value={s}>
                  {t[s]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <details>
        <summary>{t.assumptions}</summary>
        {reference && <p>{t.assumptionsNote}</p>}
        <div className="yield-controls">
          {reference && numberInput('discount', t.discount, discount, setDiscount, 0, 100, 0.1)}
          {numberInput('inflation', t.inflation, inflation, setInflation, -99.99, 100, 0.1)}
          {reference && numberInput('etf', t.etfRate, etfRate, setEtfRate, -99.99, 100, 0.1)}
          {reference && numberInput('deposit', t.depositRate, depositRate, setDepositRate, -99.99, 100, 0.1)}
        </div>
        {reference && <p>{t.formula}</p>}
        {reference && <p>{t.taxes}</p>}
      </details>
      {!reference && (
        <>
          <div className="yield-controls">{numberInput('tax-rate', t.taxRate, advanced.taxPct, (v) => setAdvancedField('taxPct', v), 0, 100, 0.1)}</div>
          <p>{t.taxBasis}</p>
          <a href={PORTUGAL_STANDARD_CAPITAL_TAX.source} target="_blank" rel="noopener noreferrer">
            {t.taxSource}
          </a>
          <details>
            <summary>{t.advanced}</summary>
            <p>{t.advancedNote}</p>
            <div className="yield-controls">
              {(
                [
                  ['idleCashPct', t.idleCash, 100],
                  ['annualDefaultPct', t.annualDefault, 100],
                  ['recoveryPct', t.recovery, 100],
                  ['recoveryDelayMonths', t.recoveryDelay, 1200],
                  ['annualFeePct', t.fee, 100],
                  ['platformFailureMonth', t.platformMonth, 1200],
                  ['platformExposurePct', t.platformExposure, 100],
                  ['platformRecoveryPct', t.platformRecovery, 100],
                  ['platformRecoveryDelayMonths', t.platformDelay, 1200],
                ] as const
              ).map(([key, label, max]) => numberInput(key, label, advanced[key], (v) => setAdvancedField(key, v), 0, max, key.includes('Month') ? 1 : 0.1))}
            </div>
          </details>
          <label className="yield-checkbox">
            <input type="checkbox" checked={stress} onChange={(e) => setStress(e.target.checked)} />
            {t.stress}
          </label>
        </>
      )}
      <label className="yield-checkbox">
        <input type="checkbox" checked={realTerms} onChange={(e) => setRealTerms(e.target.checked)} />
        {t.realTerms}
      </label>
      <details className="yield-reference">
        <summary>{t.reference}</summary>
        <p>{t.referenceWarning}</p>
        <label className="yield-checkbox">
          <input type="checkbox" checked={reference} onChange={(e) => setReference(e.target.checked)} />
          {t.reference}
        </label>
        <a href="https://crowdindex.org/pt/calculator/" target="_blank" rel="noopener noreferrer">
          CrowdIndex
        </a>
      </details>
      {reference && <p className="risk-note">{t.referenceWarning}</p>}
      {!reference && <p>{t.negativeWarning}</p>}
      {!(reference ? result : portfolio) && !unsupported && <p role="alert">{t.invalid}</p>}
      {reference && result && (
        <div className="yield-results" aria-live="polite" aria-atomic="true">
          <h3>{t.projection}</h3>
          <p className="yield-total">
            <bdi>{money(result.projected)}</bdi>
          </p>
          <dl className="yield-summary">
            {[
              [t.gain, money(result.gain)],
              [t.gross, money(result.grossSameStrategy)],
              [t.reduction, money(result.scenarioReduction)],
              [t.annualized, result.annualizedPct === null ? '-' : percent(result.annualizedPct)],
              ...(strategy === 'withdraw' ? [[t.monthly, money(result.nominalMonthlyIncome)]] : []),
              [t.etf, money(result.etf)],
              [t.deposit, money(result.deposit)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <bdi>{value}</bdi>
                </dd>
              </div>
            ))}
          </dl>
          <details>
            <summary>{t.table}</summary>
            <div className="loss-table-scroll" role="region" aria-label={t.table} tabIndex={0}>
              <table>
                <thead>
                  <tr>
                    <th>{t.month}</th>
                    <th>{t.projection}</th>
                    <th>{t.etf}</th>
                    <th>{t.deposit}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.series.map((row) => (
                    <tr key={row.month}>
                      <th scope="row">{new Intl.NumberFormat(locale).format(row.month)}</th>
                      <td>
                        <bdi>{money(row.projected)}</bdi>
                      </td>
                      <td>
                        <bdi>{money(row.etf)}</bdi>
                      </td>
                      <td>
                        <bdi>{money(row.deposit)}</bdi>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
      {!reference && portfolio && (
        <div className="yield-results" aria-live="polite" aria-atomic="true">
          <h3>{t.projection}</h3>
          <p className="yield-total">
            <bdi>{money(realTerms ? portfolio.realWealth : portfolio.final.nominalWealth)}</bdi>
          </p>
          <dl className="yield-summary">
            {[
              [t.gain, money((realTerms ? portfolio.realWealth : portfolio.final.nominalWealth) - Number(amount))],
              [
                t.annualized,
                percent((Math.pow((realTerms ? portfolio.realWealth : portfolio.final.nominalWealth) / Number(amount), 12 / Number(months)) - 1) * 100),
              ],
              [t.interestReceived, money(portfolio.grossInterestReceived)],
              [t.taxPaid, money(portfolio.tax)],
              [t.feesPaid, money(portfolio.fees)],
              [t.principalLost, money(portfolio.principalLost)],
              [t.recovered, money(portfolio.recovered)],
              [t.pendingRecovery, money(portfolio.final.pendingRecovery)],
              [t.availableAssets, money(portfolio.final.liquidAndPerforming)],
              ...(strategy === 'withdraw' ? [[t.monthly, money(portfolio.final.paidOut / Number(months))]] : []),
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <bdi>{value}</bdi>
                </dd>
              </div>
            ))}
          </dl>
          <figure className="yield-chart">
            <svg viewBox="0 0 600 220" role="img" aria-labelledby="yield-chart-title yield-chart-desc">
              <title id="yield-chart-title">{t.chart}</title>
              <desc id="yield-chart-desc">{t.chartNote}</desc>
              <text x="40" y="16">
                {money(chartMax)}
              </text>
              <text x="24" y="180" textAnchor="end">
                0
              </text>
              <path d="M40 20V180H560" fill="none" stroke="currentColor" />
              <line
                x1="40"
                x2="560"
                y1={180 - (Number(amount) / chartMax) * 150}
                y2={180 - (Number(amount) / chartMax) * 150}
                stroke="currentColor"
                strokeDasharray="5 5"
                opacity=".5"
              />
              <polyline points={chartPoints} fill="none" stroke="currentColor" strokeWidth="3" />
              <text x="40" y="207">
                0
              </text>
              <text x="560" y="207" textAnchor="end">
                {months}
              </text>
            </svg>
            <figcaption>{t.chartNote}</figcaption>
          </figure>
          <details>
            <summary>{t.breakdown}</summary>
            <p>{t.waterfallNote}</p>
            <dl className="yield-summary">
              {[
                [t.gross, money(portfolio.waterfall.gross)],
                [t.idleEffect, money(portfolio.waterfall.idleCashEffect)],
                [t.borrowerEffect, money(portfolio.waterfall.borrowerEffect)],
                [t.platformEffect, money(portfolio.waterfall.platformEffect)],
                [t.feeEffect, money(portfolio.waterfall.feeEffect)],
                [t.taxEffect, money(portfolio.waterfall.taxEffect)],
                [t.nominalWealth, money(portfolio.waterfall.final)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    <bdi>{value}</bdi>
                  </dd>
                </div>
              ))}
            </dl>
          </details>
          <details>
            <summary>{t.portfolioTable}</summary>
            <div className="loss-table-scroll" role="region" aria-label={t.portfolioTable} tabIndex={0}>
              <table>
                <thead>
                  <tr>
                    {[
                      t.month,
                      t.performing,
                      t.idleBalance,
                      t.payouts,
                      t.interest,
                      t.tax,
                      t.feeAmount,
                      t.lossAmount,
                      t.recoveryAmount,
                      t.pendingAmount,
                      t.nominalWealth,
                    ].map((v, i) => (
                      <th key={i}>{v}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolio.rows.map((r) => (
                    <tr key={r.month}>
                      <th scope="row">{r.month}</th>
                      {[r.performing, r.idle, r.paidOut, r.interest, r.tax, r.fees, r.principalLost, r.recovered, r.pendingRecovery, r.nominalWealth].map(
                        (v, i) => (
                          <td key={i}>
                            <bdi>{ledgerMoney(v)}</bdi>
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
