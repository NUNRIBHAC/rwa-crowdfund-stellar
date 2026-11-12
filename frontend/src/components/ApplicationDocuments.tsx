import { useEffect, useRef, useState } from 'react';
import {
  readApplicationDocument,
  uploadApplicationDocument,
  deleteApplicationDocument,
  submitIssuerApplicationDraft,
  linkApplicationCampaign,
  type IssuerApplication,
} from '../community/api';
import { uploadOperation, forgetUploadDocument } from '../community/upload-operation';
import { useCommunityAuth } from '../community/CommunityAuth';
import { notifyCommunityActivityChanged } from '../community/events';
import { useI18n } from '../i18n';
import { routeHash } from '../router';

type Props = { application: IssuerApplication; operator?: boolean; campaigns?: { id: string; name: string }[]; onChange?: () => void };
export default function ApplicationDocuments(props: Props) {
  const { token } = useCommunityAuth();
  return <ScopedDocuments key={`${token}:${props.application.id}:${Boolean(props.operator)}`} {...props} />;
}
function ScopedDocuments({ application, operator = false, campaigns = [], onChange }: Props) {
  const { token, account } = useCommunityAuth();
  const { m } = useI18n();
  const t = m.applicationDocuments;
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [deletionPending, setDeletionPending] = useState(Boolean(application.documentCleanupPending));
  useEffect(() => {
    setDeletionPending(Boolean(application.documentCleanupPending));
  }, [application]);
  const alive = useRef(true);
  const running = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function run(action: () => Promise<unknown>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      if (alive.current) {
        notifyCommunityActivityChanged();
        onChange?.();
      }
    } catch (e) {
      if (alive.current)
        setError(
          e && typeof e === 'object' && 'code' in e && ['upload_reconciliation', 'upload_conflict'].includes(String(e.code))
            ? t.reconciliation
            : e instanceof Error
              ? e.message
              : String(e),
        );
    } finally {
      running.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const editable = !operator && !application.campaign && application.status === 'draft' && application.submittedAt === undefined;
  return (
    <section className="application-documents" aria-label={m.campaign.tabs[2]}>
      <p className="community-note">{t.reviewNote}</p>
      {application.reviewNote && <p>{application.reviewNote}</p>}
      <ul>
        {application.documents
          ?.filter((d) => !removed.has(d.id))
          .map((d) => (
            <li key={d.id}>
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const text = await readApplicationDocument(token, application.id, d.id, operator);
                    if (alive.current) setContent(text);
                  })
                }
              >
                {t.view}: {d.filename}
              </button>
              <small className="document-hash" dir="ltr">
                SHA-256: {d.sha256}
              </small>
              {editable && (
                <button className="btn" disabled={busy} onClick={() => setConfirmDelete(d.id)}>
                  {t.delete}: {d.filename}
                </button>
              )}
              {editable && confirmDelete === d.id && (
                <div role="group" aria-label={t.confirmDelete}>
                  <p>{t.confirmDelete}</p>
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const result = await deleteApplicationDocument(token, application.id, d.id);
                        await forgetUploadDocument(d.id).catch(() => {});
                        if (alive.current) {
                          setContent(null);
                          setRemoved((prev) => new Set([...prev, d.id]));
                          setConfirmDelete('');
                          setDeletionPending(result.status === 'deletion_pending');
                        }
                      })
                    }
                  >
                    {t.confirm}
                  </button>
                  <button className="btn" disabled={busy} onClick={() => setConfirmDelete('')}>
                    {t.cancel}
                  </button>
                </div>
              )}
            </li>
          ))}
      </ul>
      {content !== null && <pre className="application-document-content">{content}</pre>}
      {deletionPending && (
        <div>
          <p role="status">{t.deletionPending}</p>
          <button
            className="btn"
            disabled={busy}
            onClick={() => {
              notifyCommunityActivityChanged();
              onChange?.();
            }}
          >
            {t.refresh}
          </button>
        </div>
      )}
      {editable && (
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
                if (!file || file.size > 16000 || !/^[a-zA-Z0-9][a-zA-Z0-9._ -]{0,99}\.txt$/.test(file.name)) throw new Error(t.uploadNote);
                const bytes = await file.arrayBuffer();
                if (!alive.current) return;
                let text: string;
                try {
                  text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
                } catch {
                  throw new Error(t.uploadNote);
                }
                let operation;
                try {
                  operation = await uploadOperation(account?.publicKey ?? application.publicKey, application.id, file.name, text);
                } catch {
                  throw new Error(t.operationUnavailable);
                }
                if (!alive.current) return;
                const saved = await uploadApplicationDocument(token, application.id, file.name, text, operation.id);
                // Cleanup failure cannot turn confirmed upload into a false failure.
                await operation.complete(saved.document.id).catch(() => {});
                if (alive.current) setFile(null);
              })
            }
          >
            {t.save}
          </button>
        </div>
      )}
      {editable && (
        <div>
          {!confirmSubmit ? (
            <button className="btn btn-primary" disabled={busy || deletionPending} onClick={() => setConfirmSubmit(true)}>
              {t.submit}
            </button>
          ) : (
            <div role="group" aria-label={t.submit}>
              <p>{t.submitWarning}</p>
              <button
                className="btn btn-primary"
                disabled={busy || deletionPending}
                onClick={() =>
                  void run(async () => {
                    await submitIssuerApplicationDraft(token, application.id);
                    if (alive.current) setConfirmSubmit(false);
                  })
                }
              >
                {t.confirm}
              </button>
              <button className="btn" disabled={busy} onClick={() => setConfirmSubmit(false)}>
                {t.cancel}
              </button>
            </div>
          )}
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
