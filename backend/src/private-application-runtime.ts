import type { CommunityService } from './community.js';
import { OciPrivateTextStore } from './oci-private-text-store.js';

// Dormant until a separately approved deployment sets ALL activation gates.
// Reading the configuration never sends a request or creates a bucket.
export function privateApplicationOptionsFromEnv(env: NodeJS.ProcessEnv = process.env, transport: typeof fetch = fetch) {
  const mode = env.COMMUNITY_APPLICATION_UPLOAD_MODE?.trim() || 'legacy-inline';
  if (mode === 'legacy-inline') return { applicationUploadMode: 'legacy-inline' as const };
  if (mode !== 'oracle-private' || env.COMMUNITY_PRIVATE_UPLOAD_ENABLED !== '1' || env.COMMUNITY_PRIVATE_CLEANUP_ENABLED !== '1') {
    throw new Error('private application storage activation is incomplete');
  }
  return {
    applicationUploadMode: 'oracle-private' as const,
    privateApplicationObjects: new OciPrivateTextStore(
      {
        enabled: true,
        namespace: env.COMMUNITY_PRIVATE_OCI_NAMESPACE ?? '',
        region: env.COMMUNITY_PRIVATE_OCI_REGION ?? '',
        bucket: env.COMMUNITY_PRIVATE_OCI_BUCKET ?? '',
        prefix: env.COMMUNITY_PRIVATE_OCI_PREFIX ?? '',
        accessKey: env.COMMUNITY_PRIVATE_OCI_ACCESS_KEY ?? '',
        secretKey: env.COMMUNITY_PRIVATE_OCI_SECRET_KEY ?? '',
      },
      transport,
    ),
  };
}

// A finite pass over durable, explicitly owned cleanup work only. Never infer
// completion from age, promote uncertain PUTs, list a bucket or retry a PUT.
// The cursor prevents blocked old jobs from starving later jobs.
export async function runPrivateApplicationCleanup(service: CommunityService, cursor = '', limit = 25) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('invalid private cleanup limit');
  const state = await service.store.read();
  const keys = [
    ...Object.values(state.privateApplicationUploads?.intents ?? {})
      .filter((i) => i.status === 'cleanup' && !state.privateApplicationDeletions?.[i.documentId ?? `appdoc_${i.id}`])
      .map((i) => `upload:${i.id}`),
    ...Object.entries(state.privateApplicationDeletions ?? {})
      .filter(([, job]) => job.status !== 'deleted')
      .map(([id]) => `delete:${id}`),
  ].sort();
  const after = keys.filter((key) => key > cursor);
  const selected = (after.length ? after : keys).slice(0, limit);
  const result = { deleted: 0, pending: 0, blocked: 0, failed: 0, processed: selected.length, cursor: selected.at(-1) ?? '' };
  for (const key of selected) {
    try {
      const status = key.startsWith('upload:')
        ? await service.queueFailedApplicationUploadCleanup(key.slice(7))
        : await service.reconcileApplicationDocumentDeletion(key.slice(7));
      result[status]++;
    } catch {
      result.failed++;
    }
  }
  return result;
}

let cleanupTimer: ReturnType<typeof setInterval> | undefined;
// One scheduler per process. Database claims still arbitrate other processes.
// Configuration changes require a restart; no runtime provider switching.
export function startPrivateApplicationCleanup(service: CommunityService) {
  if (cleanupTimer) return;
  let running = false;
  let cursor = '';
  cleanupTimer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const result = await runPrivateApplicationCleanup(service, cursor);
      cursor = result.cursor;
      if (result.deleted || result.failed)
        console.info(JSON.stringify({ event: 'private_application.cleanup', deleted: result.deleted, failed: result.failed }));
    } catch {
      console.error(JSON.stringify({ event: 'private_application.cleanup_failed' }));
    } finally {
      running = false;
    }
  }, 60_000);
  cleanupTimer.unref();
}
