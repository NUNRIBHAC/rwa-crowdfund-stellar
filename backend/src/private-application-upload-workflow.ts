import { createHash } from 'node:crypto';
import type { PrivateTextRef } from './oci-private-text-store.js';

// Offline integration model. Not connected to CommunityService/routes or OCI.
export type UploadDocument = {
  id: string;
  filename: string;
  sha256: string;
  uploadedAt: number;
  content?: string;
  object?: PrivateTextRef;
};
export type UploadApplication = {
  id: string;
  publicKey: string;
  status: string;
  submittedAt?: number;
  campaign?: unknown;
  documents?: UploadDocument[];
};
export type UploadIntent = {
  id: string;
  applicationId: string;
  owner: string;
  filename: string;
  object: PrivateTextRef;
  status: 'uploading' | 'uncertain' | 'cleanup' | 'committed' | 'deleted';
  documentId?: string;
};
export type UploadState = {
  applications: Record<string, UploadApplication>;
  intents: Record<string, UploadIntent>;
};
export interface UploadRepository {
  // Production binding must provide committed atomic changes, not a JS mutex.
  read(): Promise<UploadState>;
  change<T>(fn: (state: UploadState) => T): Promise<T>;
}
export interface PrivateTextObjects {
  plan(content: string): PrivateTextRef;
  upload(ref: PrivateTextRef, content: string): Promise<void>;
  read(ref: PrivateTextRef): Promise<string>;
  remove?(ref: PrivateTextRef): Promise<void>;
}
export const documentMetadata = (document: UploadDocument) => ({
  id: document.id,
  filename: document.filename,
  sha256: document.sha256,
  uploadedAt: document.uploadedAt,
});
function fail(message: string): never {
  throw new Error(message);
}
const ownedOpen = (s: UploadState, id: string, owner: string) => {
  const a = s.applications[id];
  if (!a || a.publicKey !== owner) return fail('document not found');
  if (a.campaign || a.status !== 'draft' || a.submittedAt !== undefined) return fail('application review is closed');
  return a;
};
export class PrivateApplicationUploadWorkflow {
  constructor(
    private repo: UploadRepository,
    private objects: PrivateTextObjects | undefined,
    private now: () => number = Date.now,
  ) {}
  async upload(owner: string, applicationId: string, operationId: string, filename: string, content: string) {
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(operationId)) fail('invalid upload operation');
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._ -]{0,99}\.txt$/.test(filename)) fail('invalid plain-text document');
    const bytes = Buffer.from(content, 'utf8');
    if (!bytes.length || bytes.length > 16000 || [...content].some((c) => c.charCodeAt(0) < 32 && !['\t', '\n', '\r'].includes(c)))
      fail('invalid plain-text document');
    const contentHash = createHash('sha256').update(bytes).digest('hex');
    const reservation = await this.repo.change((state) => {
      const a = state.applications[applicationId];
      if (!a || a.publicKey !== owner) fail('document not found');
      const old = state.intents[operationId];
      if (old) {
        if (
          old.owner !== owner ||
          old.applicationId !== applicationId ||
          old.filename !== filename ||
          old.object.sha256 !== contentHash ||
          old.object.bytes !== bytes.length
        )
          fail('upload operation conflict');
        if (old.status === 'committed') {
          const doc = a.documents?.find((d) => d.id === old.documentId);
          if (
            !doc ||
            doc.filename !== old.filename ||
            doc.sha256 !== old.object.sha256 ||
            !doc.object ||
            doc.object.key !== old.object.key ||
            doc.object.sha256 !== old.object.sha256 ||
            doc.object.storageId !== old.object.storageId ||
            doc.object.bytes !== old.object.bytes
          )
            fail('upload reconciliation required');
          return {
            existing: documentMetadata(doc),
            intent: old,
            created: false,
          };
        }
        if (old.status === 'deleted') fail('document not found');
        fail('upload reconciliation required');
      }
      ownedOpen(state, applicationId, owner);
      if (!this.objects) fail('private document storage unavailable');
      const planned = this.objects.plan(content);
      const sameObject = (ref: PrivateTextRef) => ref.storageId === planned.storageId && ref.key === planned.key;
      if (
        Object.values(state.intents).some((i) => sameObject(i.object)) ||
        Object.values(state.applications).some((app) => app.documents?.some((doc) => doc.object && sameObject(doc.object)))
      )
        fail('upload operation conflict');
      const reserved = Object.values(state.intents).filter(
        (i) => i.applicationId === applicationId && i.status !== 'committed' && i.status !== 'deleted',
      ).length;
      if ((a.documents?.length ?? 0) + reserved >= 5) fail('document limit reached');
      const intent: UploadIntent = {
        id: operationId,
        applicationId,
        owner,
        filename,
        object: planned,
        status: 'uploading',
      };
      state.intents[operationId] = intent;
      return { existing: undefined, intent, created: true };
    });
    if (reservation.existing) return reservation.existing;
    const intent = reservation.intent;
    const objects = this.objects;
    if (!objects) fail('private document storage unavailable');
    try {
      await objects.upload(intent.object, content);
    } catch {
      // Possible provider success before timeout. Persist the original key;
      // do not claim failure means no object exists, and do not auto-retry.
      await this.repo
        .change((s) => {
          const i = s.intents[operationId];
          if (i?.status === 'uploading' && i.object.key === intent.object.key) i.status = 'uncertain';
        })
        .catch(() => {});
      fail('upload reconciliation required');
    }
    try {
      return await this.repo.change((s) => {
        const a = ownedOpen(s, applicationId, owner);
        const i = s.intents[operationId];
        if (!i || i.status !== 'uploading' || i.owner !== owner || i.object.key !== intent.object.key) fail('upload operation conflict');
        if ((a.documents?.length ?? 0) >= 5) fail('document limit reached');
        const doc: UploadDocument = {
          id: `appdoc_${operationId}`,
          filename,
          sha256: i.object.sha256,
          uploadedAt: this.now(),
          object: { ...i.object },
        };
        (a.documents ??= []).push(doc);
        i.status = 'committed';
        i.documentId = doc.id;
        return documentMetadata(doc);
      });
    } catch {
      // Never delete here: DB commit acknowledgement itself can be ambiguous.
      // Reconciliation checks whether a committed doc references this key.
      await this.repo
        .change((s) => {
          const i = s.intents[operationId];
          if (i && i.status !== 'committed' && i.status !== 'deleted' && i.owner === owner && i.object.key === intent.object.key) i.status = 'cleanup';
        })
        .catch(() => {});
      fail('upload reconciliation required');
    }
  }
  async read(owner: string, applicationId: string, documentId: string, authorizedOperator = false): Promise<string> {
    // Production routes must establish authorizedOperator on the server only.
    const s = await this.repo.read();
    const a = s.applications[applicationId];
    if (!a || (!authorizedOperator && a.publicKey !== owner)) fail('document not found');
    const doc = a.documents?.find((d) => d.id === documentId);
    if (!doc) fail('document not found');
    if (doc.object) {
      if (!this.objects) fail('private document storage unavailable');
      return this.objects.read(doc.object);
    }
    if (typeof doc.content !== 'string') fail('document not found');
    // Legacy inline text is returned unchanged, never migrated or rewritten.
    return doc.content;
  }
}
