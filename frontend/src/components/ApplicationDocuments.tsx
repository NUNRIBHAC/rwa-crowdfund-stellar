import { useState } from 'react';
import { readApplicationDocument, uploadApplicationDocument, linkApplicationCampaign, type IssuerApplication } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import { notifyCommunityActivityChanged } from '../community/events';
import { useI18n } from '../i18n';
import { routeHash } from '../router';

// Deliberately bounded DEMO upload: UTF-8 text only, no identity documents.
// Review and listing remain separate; linking never deploys a contract.

export default function ApplicationDocuments({
  application,
  operator = false,
  campaigns = [],
  onChange,
}: {
  application: IssuerApplication;
  operator?: boolean;
  campaigns?: { id: string; name: string }[];
  onChange?: () => void;
}) {
  const { token } = useCommunityAuth();
  const { m } = useI18n();
  const t = m.applicationDocuments;
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
      notifyCommunityActivityChanged();
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="application-documents" aria-label={m.campaign.tabs[2]}>
      <p className="community-note">{t.reviewNote}</p>
      {application.reviewNote && <p>{application.reviewNote}</p>}
      <ul>
        {application.documents?.map((d) => (
          <li key={d.id}>
            <button
              className="btn"
              disabled={busy}
              onClick={() => void run(async () => setContent(await readApplicationDocument(token, application.id, d.id, operator)))}
            >
              {t.view}: {d.filename}
            </button>
            <small className="document-hash" dir="ltr">
              SHA-256: {d.sha256}
            </small>
          </li>
        ))}
      </ul>
      {content !== null && <pre className="application-document-content">{content}</pre>}
      {!operator && !application.campaign && ['received', 'under_review'].includes(application.status) && (
        <div>
          <label>
            {t.uploadNote}
            <input type="file" accept=".txt,text/plain" disabled={busy} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button
            className="btn"
            disabled={!file || busy}
            onClick={() =>
              void run(async () => {
                if (!file || file.size > 16000 || !/\.txt$/i.test(file.name)) throw new Error(t.uploadNote);
                const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
                await uploadApplicationDocument(token, application.id, file.name, text);
                setFile(null);
              })
            }
          >
            {t.save}
          </button>
        </div>
      )}
      {application.campaign ? (
        <a href={routeHash({ name: 'campaign', campaignId: application.campaign.id })}>{application.campaign.id}</a>
      ) : (
        <p>{t.unlinked}</p>
      )}
      {operator && application.status === 'approved' && !application.campaign && (
        <div>
          <label>
            {t.link}
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">-</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" disabled={!selected || busy} onClick={() => void run(() => linkApplicationCampaign(token, application.id, selected))}>
            {t.link}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
    </section>
  );
}
