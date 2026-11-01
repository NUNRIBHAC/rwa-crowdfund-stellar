// Post-funding investor reports. Distinct from the news feed: reports are
// published only after the campaign's on-chain funding deadline passes, and
// content (titles included) is served only to wallets with a verified
// contribution history in the campaign (plus operators). Publishing is
// operator-only. Every report carries the fixed platform-demo stand-in label
// - there is no verified issuer identity. A use_of_proceeds report means the
// withdrawal was seen on-chain; how proceeds were used is operator-stated
// and platform-unverified, and the copy says so. When the backend cannot
// verify entitlement it fails closed, so the unavailable state is phrased as
// temporary - never as "you are not an investor".
import { useEffect, useState } from 'react';
import type { PostFundingReport, ReportsResult } from '../community/api';
import { fetchReports } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { useI18n } from '../i18n';

export default function ReportsList({ campaignId }: { campaignId: string }) {
  const { m, locale } = useI18n();
  const { token } = useCommunityAuth();
  const [result, setResult] = useState<ReportsResult | null>(null);

  useEffect(() => {
    let live = true;
    setResult(null);
    fetchReports(campaignId, token)
      .then((r) => live && setResult(r))
      .catch(() => live && setResult({ ok: false, reason: 'unavailable' }));
    return () => {
      live = false;
    };
  }, [campaignId, token]);

  const t = m.community;
  const kindLabel = (k: PostFundingReport['kind']) => t.reportKinds[k] ?? k;

  return (
    <section className="community-section" aria-labelledby="campaign-reports">
      <h2 id="campaign-reports">{t.reportsTitle}</h2>
      <p className="community-note">{t.reportsNote}</p>
      {result === null && <p className="community-loading">{t.loading}</p>}
      {result !== null && !result.ok && result.reason === 'unauthenticated' && <p className="community-note">{t.reportsSignIn}</p>}
      {result !== null && !result.ok && result.reason === 'not-investor' && <p className="community-note">{t.reportsInvestorsOnly}</p>}
      {result !== null && !result.ok && (result.reason === 'unavailable' || result.reason === 'unknown-campaign') && (
        <p className="community-note">{t.reportsUnavailable}</p>
      )}
      {result !== null && result.ok && result.reports.length === 0 && <p className="community-note">{t.reportsEmpty}</p>}
      {result !== null &&
        result.ok &&
        result.reports.map((r) => (
          <article key={r.id} className="news-post">
            <h3>{r.title}</h3>
            <p className="news-meta">
              {new Date(r.createdAt).toLocaleDateString(locale)} - {kindLabel(r.kind)} - {t.newsAuthorDemo}
            </p>
            <p>{r.body}</p>
            {r.kind === 'use_of_proceeds' && <p className="community-note">{t.reportUseUnverified}</p>}
          </article>
        ))}
    </section>
  );
}
