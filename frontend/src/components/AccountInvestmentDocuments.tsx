// Investor-entitled demo documents. Session/campaign changes replace the
// request scope before stale lists or downloads can reach the new view.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { downloadInvestmentDocument, fetchInvestmentDocuments, type InvestmentDocumentMeta } from '../community/api';

export default function AccountInvestmentDocuments({ campaignId, token }: { campaignId: string; token: string }) {
  if (!token) return null;
  return <DocumentSession key={`${token}:${campaignId}`} campaignId={campaignId} token={token} />;
}

function DocumentSession({ campaignId, token }: { campaignId: string; token: string }) {
  const { m } = useI18n();
  const [docs, setDocs] = useState<InvestmentDocumentMeta[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const active = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const pending = useRef(false);

  useLayoutEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      controller.current?.abort();
    };
  }, []);

  useEffect(() => {
    let live = true;
    fetchInvestmentDocuments(token, campaignId)
      .then((j) => {
        if (live) setDocs(j.documents);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [token, campaignId]);

  const onDownload = async (docId: string) => {
    if (pending.current || !active.current) return;
    pending.current = true;
    setDownloading(true);
    setDownloadFailed(false);
    const request = new AbortController();
    controller.current = request;
    try {
      const { blob, filename } = await downloadInvestmentDocument(token, docId, request.signal);
      if (!active.current || request.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch {
      if (active.current && !request.signal.aborted) setDownloadFailed(true);
    } finally {
      pending.current = false;
      if (active.current) setDownloading(false);
    }
  };

  if (failed) {
    return (
      <p className="community-error" role="status">
        {m.account.investorDocsUnavailable}
      </p>
    );
  }
  if (docs === null) {
    return (
      <p className="community-loading" role="status">
        {m.community.loading}
      </p>
    );
  }
  if (docs.length === 0) {
    return <p className="empty-state">{m.account.investorDocsEmpty}</p>;
  }
  return (
    <>
      {downloadFailed && (
        <p className="community-error" role="status">
          {m.errors.apiUnavailable}
        </p>
      )}
      <ul className="document-list">
        {docs.map((d) => (
          <li key={d.id}>
            <button type="button" className="btn btn-ghost" disabled={downloading} onClick={() => void onDownload(d.id)}>
              {m.account.investorDocsDownload}: {d.title}
            </button>{' '}
            <span className="status-chip chip-demo">{m.community.demoBadge}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
