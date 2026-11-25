import { useEffect, useRef, useState } from 'react';
import { appendOperatorEvidence, fetchOperatorEvidence, type OperatorEvidence } from '../community/api';
import { useCommunityAuth } from '../community/CommunityAuth';
import IssuerEvidence, { type EvidenceCopy } from './IssuerEvidence';

export type EvidenceEditorCopy = {
  title: string;
  note: string;
  campaign: string;
  claim: string;
  action: string;
  correction: string;
  review: string;
  reviewText: string;
  reviewNote: string;
  sources: string;
  humanReviewed: string;
  preview: string;
  publish: string;
  back: string;
  saved: string;
  failed: string;
  reload: string;
  addSource: string;
  sourceTitle: string;
  sourceUrl: string;
  sourcePublisher: string;
  sourceRetrieved: string;
  sourcePublicOnly: string;
};

// The dashboard integration waits for this new copy batch to complete Weblate.
// Rendering this component never grants a role: the server checks every write.
export default function OperatorEvidenceEditor(props: { campaigns: { id: string; name: string }[]; copy: EvidenceEditorCopy; evidenceCopy: EvidenceCopy }) {
  const { account, token, isOperator } = useCommunityAuth();
  if (!account || !token || !isOperator) return null;
  return <OperatorSession key={JSON.stringify([account.publicKey, token])} {...props} token={token} />;
}
function OperatorSession(props: { campaigns: { id: string; name: string }[]; copy: EvidenceEditorCopy; evidenceCopy: EvidenceCopy; token: string }) {
  const [campaignId, setCampaignId] = useState('');
  return (
    <section className="issuer-evidence evidence-editor">
      <h2>{props.copy.title}</h2>
      <p>{props.copy.note}</p>
      <label>
        <span dir="auto">{props.copy.campaign}</span>
        <select aria-label={props.copy.campaign} value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
          <option value="">-</option>
          {props.campaigns.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      {campaignId && <CampaignEditor key={campaignId} {...props} campaignId={campaignId} />}
    </section>
  );
}
function CampaignEditor({
  campaignId,
  token,
  copy,
  evidenceCopy,
}: {
  campaignId: string;
  token: string;
  copy: EvidenceEditorCopy;
  evidenceCopy: EvidenceCopy;
}) {
  const [evidence, setEvidence] = useState<OperatorEvidence | null>(null);
  const [failed, setFailed] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [claimId, setClaimId] = useState('');
  const [action, setAction] = useState<'correction' | 'review'>('correction');
  const [note, setNote] = useState('');
  const [text, setText] = useState('');
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [addSource, setAddSource] = useState(false);
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourcePublisher, setSourcePublisher] = useState<'issuer' | 'independent'>('independent');
  const [humanReviewed, setHumanReviewed] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const live = useRef(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setEvidence(null);
    setFailed(false);
    fetchOperatorEvidence(campaignId)
      .then(({ evidence }) => {
        if (
          !evidence ||
          evidence.campaignId !== campaignId ||
          !/^[a-f0-9]{64}$/.test(evidence.revision) ||
          !['available', 'not_provided', 'unavailable'].includes(evidence.state) ||
          !Array.isArray(evidence.claims) ||
          !Array.isArray(evidence.sources) ||
          !Array.isArray(evidence.corrections) ||
          !Array.isArray(evidence.unknownAreas)
        ) {
          throw new Error('invalid evidence response');
        }
        if (active) setEvidence(evidence);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [campaignId, epoch]);
  const claim = evidence?.claims.find((item) => item.id === claimId);
  const canReview =
    !!claim && evidence!.corrections.some((item) => item.claimId === claim.id) && !evidence!.claims.some((item) => item.supersedes === claim.id);
  const newSource = addSource
    ? {
        id: 'source-' + requestId.current,
        title: sourceTitle.trim(),
        url: sourceUrl.trim(),
        publisher: sourcePublisher,
        retrievedOn: new Date().toISOString().slice(0, 10),
      }
    : undefined;
  const newSourceValid = !addSource || (!!sourceTitle.trim() && /^https:\/\/[^/?#:@]+\.[^/?#:@]+(?:\/[^?#]*)?$/.test(sourceUrl.trim()));
  const valid =
    !!evidence &&
    evidence.state === 'available' &&
    !!claim &&
    !!note.trim() &&
    (sourceIds.length > 0 || addSource) &&
    newSourceValid &&
    (action !== 'review' ||
      (canReview &&
        humanReviewed &&
        !!text.trim() &&
        ((addSource && sourcePublisher === 'independent') ||
          sourceIds.some((id) => evidence!.sources.find((item) => item.id === id)?.publisher === 'independent'))));
  async function publish() {
    if (!valid || !preview || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await appendOperatorEvidence(token, campaignId, {
        revision: evidence!.revision,
        requestId: requestId.current,
        action,
        claimId,
        note: note.trim(),
        sourceIds: [...sourceIds, ...(newSource ? [newSource.id] : [])],
        ...(newSource ? { newSource } : {}),
        ...(action === 'review' ? { text: text.trim(), humanReviewed: true as const } : {}),
      });
      if (!live.current) return;
      setAddSource(false);
      setSourceTitle('');
      setSourceUrl('');
      setSaved(true);
      setPreview(false);
      setNote('');
      setText('');
      setSourceIds([]);
      setHumanReviewed(false);
      requestId.current = crypto.randomUUID();
      setEpoch((value) => value + 1);
    } catch {
      if (live.current) setFailed(true);
    } finally {
      if (live.current) setBusy(false);
    }
  }
  function changed() {
    setPreview(false);
    setSaved(false);
    requestId.current = crypto.randomUUID();
  }
  return (
    <>
      {failed && (
        <p role="alert">
          {copy.failed}{' '}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              changed();
              setEpoch((value) => value + 1);
            }}
          >
            <span dir="auto">{copy.reload}</span>
          </button>
        </p>
      )}
      {saved && <p role="status">{copy.saved}</p>}
      <IssuerEvidence evidence={evidence} copy={evidenceCopy} loading={!evidence && !failed} />
      {evidence?.state === 'available' && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) setPreview(true);
          }}
        >
          <fieldset disabled={busy || preview}>
            <label>
              <span dir="auto">{copy.claim}</span>
              <select
                aria-label={copy.claim}
                required
                value={claimId}
                onChange={(e) => {
                  changed();
                  setClaimId(e.target.value);
                  setAction('correction');
                  setSourceIds([]);
                  setHumanReviewed(false);
                }}
              >
                <option value="">-</option>
                {evidence.claims
                  .filter((item) => !evidence.claims.some((entry) => entry.supersedes === item.id))
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.text}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span dir="auto">{copy.action}</span>
              <select
                aria-label={copy.action}
                value={action}
                onChange={(e) => {
                  changed();
                  setAction(e.target.value as 'correction' | 'review');
                  setHumanReviewed(false);
                }}
              >
                <option value="correction">{copy.correction}</option>
                <option value="review" disabled={!canReview}>
                  {copy.review}
                </option>
              </select>
            </label>
            <label>
              <span dir="auto">{copy.reviewNote}</span>
              <textarea
                required
                maxLength={1000}
                value={note}
                onChange={(e) => {
                  changed();
                  setNote(e.target.value);
                }}
              />
            </label>
            {action === 'review' && (
              <label>
                <span dir="auto">{copy.reviewText}</span>
                <textarea
                  required
                  maxLength={2000}
                  value={text}
                  onChange={(e) => {
                    changed();
                    setText(e.target.value);
                  }}
                />
              </label>
            )}
            <fieldset>
              <legend>{copy.sources}</legend>
              {evidence.sources.map((item) => (
                <label key={item.id}>
                  <input
                    type="checkbox"
                    checked={sourceIds.includes(item.id)}
                    onChange={(e) => {
                      changed();
                      setSourceIds(e.target.checked ? [...sourceIds, item.id] : sourceIds.filter((id) => id !== item.id));
                    }}
                  />
                  <span dir="auto">{item.title}</span>
                </label>
              ))}
            </fieldset>
            <label className="evidence-editor-check">
              <input
                type="checkbox"
                checked={addSource}
                onChange={(e) => {
                  changed();
                  setAddSource(e.target.checked);
                }}
              />
              <span dir="auto">{copy.addSource}</span>
            </label>
            {addSource && (
              <fieldset>
                <legend>{copy.addSource}</legend>
                <p className="evidence-editor-source-note">{copy.sourcePublicOnly}</p>
                <label>
                  <span dir="auto">{copy.sourceTitle}</span>
                  <input
                    required
                    maxLength={200}
                    value={sourceTitle}
                    onChange={(e) => {
                      changed();
                      setSourceTitle(e.target.value);
                    }}
                  />
                </label>
                <label>
                  <span dir="auto">{copy.sourceUrl}</span>
                  <input
                    required
                    type="url"
                    maxLength={2048}
                    value={sourceUrl}
                    onChange={(e) => {
                      changed();
                      setSourceUrl(e.target.value);
                    }}
                  />
                </label>
                <label>
                  <span dir="auto">{copy.sourcePublisher}</span>
                  <select
                    value={sourcePublisher}
                    onChange={(e) => {
                      changed();
                      setSourcePublisher(e.target.value as 'issuer' | 'independent');
                    }}
                  >
                    <option value="issuer">{evidenceCopy.issuerSource}</option>
                    <option value="independent">{evidenceCopy.independentSource}</option>
                  </select>
                </label>
                <p>
                  {copy.sourceRetrieved}: <bdi dir="ltr">{newSource?.retrievedOn}</bdi>
                </p>
              </fieldset>
            )}
            {action === 'review' && (
              <label className="evidence-editor-check">
                <input
                  type="checkbox"
                  checked={humanReviewed}
                  onChange={(e) => {
                    changed();
                    setHumanReviewed(e.target.checked);
                  }}
                />
                <span dir="auto">{copy.humanReviewed}</span>
              </label>
            )}
          </fieldset>
          {!preview && (
            <button className="btn" disabled={busy || !valid}>
              <span dir="auto">{copy.preview}</span>
            </button>
          )}
          {preview && (
            <section aria-label={copy.preview}>
              <h3>{action === 'review' ? copy.review : copy.correction}</h3>
              <p>
                <bdi dir="auto">{claim?.text}</bdi>
              </p>
              {action === 'review' && (
                <p>
                  <bdi dir="auto">{text}</bdi>
                </p>
              )}
              <p>
                <bdi dir="auto">{note}</bdi>
              </p>
              <ul>
                {newSource && (
                  <li>
                    <bdi dir="auto">{newSource.title}</bdi>: <bdi dir="ltr">{newSource.url}</bdi> (
                    {newSource.publisher === 'issuer' ? evidenceCopy.issuerSource : evidenceCopy.independentSource},{' '}
                    <bdi dir="ltr">{newSource.retrievedOn}</bdi>)
                  </li>
                )}
                {sourceIds.map((id) => (
                  <li key={id}>
                    <bdi dir="auto">{evidence.sources.find((item) => item.id === id)?.title}</bdi>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn" disabled={busy} onClick={() => setPreview(false)}>
                <span dir="auto">{copy.back}</span>
              </button>
              <button type="button" className="btn btn-primary" disabled={busy || !valid} onClick={() => void publish()}>
                <span dir="auto">{copy.publish}</span>
              </button>
            </section>
          )}
        </form>
      )}
    </>
  );
}
