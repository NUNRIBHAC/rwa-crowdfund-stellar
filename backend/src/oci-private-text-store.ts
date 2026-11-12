import { createHash, createHmac, randomUUID } from 'node:crypto';

// Private synthetic application text only. Runtime wiring is explicitly gated.
// No disk fallback, public URL, bucket creation, IAM change or legacy migration.
export type PrivateTextRef = {
  storageId: string;
  key: string;
  sha256: string;
  bytes: number;
};
export type OciTextConfig = {
  enabled: true;
  namespace: string;
  region: string;
  bucket: string;
  prefix: string;
  accessKey: string;
  secretKey: string;
};
const hash = (body: string | Buffer) => createHash('sha256').update(body).digest('hex');
const hmac = (key: string | Buffer, body: string) => createHmac('sha256', key).update(body).digest();

export function privateStorageIdentity(config: Pick<OciTextConfig, 'namespace' | 'region' | 'bucket' | 'prefix'>) {
  return hash(JSON.stringify([config.namespace, config.region, config.bucket, config.prefix]));
}

// S3 SigV4, header authentication only; never query-string credentials.
export function signPrivateObjectRequest(
  method: string,
  url: URL,
  body: Buffer,
  config: Pick<OciTextConfig, 'region' | 'accessKey' | 'secretKey'>,
  date: Date,
  extra: Record<string, string> = {},
) {
  if (url.search || url.username || url.password) throw new Error('invalid object request');
  const timestamp = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = timestamp.slice(0, 8);
  const digest = hash(body);
  const headers: Record<string, string> = {
    ...extra,
    host: url.host,
    'x-amz-content-sha256': digest,
    'x-amz-date': timestamp,
  };
  const names = Object.keys(headers).sort();
  const signed = names.join(';');
  const canonical = [method, url.pathname, '', names.map((name) => `${name}:${headers[name].trim()}\n`).join(''), signed, digest].join('\n');
  const scope = `${day}/${config.region}/s3/aws4_request`;
  const key = hmac(hmac(hmac(hmac(`AWS4${config.secretKey}`, day), config.region), 's3'), 'aws4_request');
  const signature = createHmac('sha256', key)
    .update(`AWS4-HMAC-SHA256\n${timestamp}\n${scope}\n${hash(canonical)}`)
    .digest('hex');
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${scope},SignedHeaders=${signed},Signature=${signature}`;
  return headers;
}

export class OciPrivateTextStore {
  private config: OciTextConfig;
  constructor(
    config: OciTextConfig,
    private transport: typeof fetch = fetch,
    private now: () => Date = () => new Date(),
    private id: () => string = randomUUID,
  ) {
    if (
      config.enabled !== true ||
      !/^[a-z0-9]{1,63}$/.test(config.namespace) ||
      !/^[a-z]{2}-[a-z]+-\d+$/.test(config.region) ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/.test(config.bucket) ||
      !/^[a-z0-9][a-z0-9 -]{0,62}$/.test(config.prefix) ||
      config.prefix.trim() !== config.prefix ||
      !/^[A-Za-z0-9+=]{1,128}$/.test(config.accessKey) ||
      !config.secretKey ||
      config.secretKey.length > 1024
    )
      throw new Error('private document storage is not configured');
    this.config = { ...config };
  }
  private keyValid(key: string) {
    return new RegExp(`^${this.config.prefix}/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.txt$`).test(key);
  }
  private async request(method: 'PUT' | 'GET' | 'DELETE', key: string, body = Buffer.alloc(0)) {
    if (!this.keyValid(key)) throw new Error('invalid private document reference');
    const c = this.config;
    const url = new URL(`https://${c.namespace}.compat.objectstorage.${c.region}.oci.customer-oci.com/${c.bucket}/${key}`);
    const headers = signPrivateObjectRequest(method, url, body, c, this.now(), method === 'PUT' ? { 'content-type': 'text/plain; charset=utf-8' } : {});
    try {
      const response = await this.transport(url, {
        method,
        headers,
        body: method === 'PUT' ? new Uint8Array(body) : undefined,
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
        cache: 'no-store',
      });
      if (!response.ok && !(method === 'DELETE' && response.status === 404)) {
        await response.body?.cancel();
        throw new Error('object request failed');
      }
      return response;
    } catch {
      // Neither provider response bodies, credential-bearing headers nor URLs
      // are propagated to callers. No retry can silently repeat a write.
      throw new Error('private document storage unavailable');
    }
  }
  plan(content: string): PrivateTextRef {
    const bytes = Buffer.from(content, 'utf8');
    if (!bytes.length || bytes.length > 16_000 || [...content].some((c) => c.charCodeAt(0) < 32 && !['\t', '\n', '\r'].includes(c)))
      throw new Error('invalid private text document');
    const key = `${this.config.prefix}/${this.id()}.txt`;
    if (!this.keyValid(key)) throw new Error('invalid private document reference');
    return {
      storageId: privateStorageIdentity(this.config),
      key,
      sha256: hash(bytes),
      bytes: bytes.length,
    };
  }
  async upload(ref: PrivateTextRef, content: string): Promise<void> {
    if (ref.storageId !== privateStorageIdentity(this.config)) throw new Error('private document storage identity mismatch');
    // The caller persists this reference BEFORE transport. A timeout can leave
    // an object stored, so never allocate a new key inside this operation.
    const bytes = Buffer.from(content, 'utf8');
    if (
      !bytes.length ||
      bytes.length > 16_000 ||
      bytes.length !== ref.bytes ||
      hash(bytes) !== ref.sha256 ||
      [...content].some((c) => c.charCodeAt(0) < 32 && !['\t', '\n', '\r'].includes(c))
    )
      throw new Error('private document integrity failure');
    const response = await this.request('PUT', ref.key, bytes);
    await response.body?.cancel().catch(() => {});
  }
  async read(ref: PrivateTextRef): Promise<string> {
    if (ref.storageId !== privateStorageIdentity(this.config)) throw new Error('private document storage identity mismatch');
    if (!Number.isInteger(ref.bytes) || ref.bytes < 1 || ref.bytes > 16_000 || !/^[a-f0-9]{64}$/.test(ref.sha256))
      throw new Error('invalid private document reference');
    const response = await this.request('GET', ref.key);
    const reader = response.body?.getReader();
    if (!reader) throw new Error('private document storage unavailable');
    const chunks: Buffer[] = [];
    let size = 0;
    try {
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.length;
        if (size > ref.bytes) throw new Error('private document integrity failure');
        chunks.push(Buffer.from(next.value));
      }
    } catch {
      throw new Error('private document integrity failure');
    } finally {
      await reader.cancel().catch(() => {});
    }
    const bytes = Buffer.concat(chunks);
    if (size !== ref.bytes || hash(bytes) !== ref.sha256) throw new Error('private document integrity failure');
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      throw new Error('private document integrity failure');
    }
  }
  // Only durable owned cleanup jobs may call this; never caller-supplied refs.
  async remove(ref: PrivateTextRef): Promise<void> {
    if (ref.storageId !== privateStorageIdentity(this.config)) throw new Error('private document storage identity mismatch');
    const response = await this.request('DELETE', ref.key);
    await response.body?.cancel().catch(() => {});
  }
}
