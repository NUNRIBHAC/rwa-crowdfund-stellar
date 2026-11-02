// Investor-entitled investment documents for one invested campaign: approved
// documents from the platform's entitled delivery (synthetic demo content in
// this prototype), downloaded with the community session bearer - never a
// public URL. Load failure shows an honest unavailable note, never an empty
// state that could be misread as "no documents".
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { downloadInvestmentDocument, fetchInvestmentDocuments, loadCommunityToken, type InvestmentDocumentMeta } from '../community/api';

export default function AccountInvestmentDocuments({ campaignId }: { campaignId: string }) {
  const { m } = useI18n();
  const [docs, setDocs] = useState<InvestmentDocumentMeta[] | null>(null);
  const [failed, setFailed] = useState(false);
  const token = loadCommunityToken();

  useEffect(() => {
    if (!token) {
      setFailed(false);
      setDocs(null);
      return;
    }
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
    const { blob, filename } = await downloadInvestmentDocument(token, docId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!token) return null;
  if (failed) {
    return (
      <p className="community-error" role="status">
        {m.account.investorDocsUnavailable}
      </p>
    );
  }
  if (!docs || docs.length === 0) {
    return <p className="empty-state">{m.account.investorDocsEmpty}</p>;
  }
  return (
    <ul className="document-list">
      {docs.map((d) => (
        <li key={d.id}>
          <button type="button" className="btn btn-ghost" onClick={() => void onDownload(d.id)}>
            {m.account.investorDocsDownload}: {d.title}
          </button>{' '}
          <span className="status-chip chip-demo">{m.community.demoBadge}</span>
        </li>
      ))}
    </ul>
  );
}
