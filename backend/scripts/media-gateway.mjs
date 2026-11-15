// No local media files or disk media cache. Dependencies are injected for tests.
import { readFile, open, mkdir, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
const PAGES = 'https://blockallisto-public-media.pages.dev';
const WORKER = 'https://blockallisto-media.nunrib-df6.workers.dev';
const BUCKET = 'blockallisto-media';
const BUCKET_ID = '435986d81e2ab338a91e071a';
const types = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  avif: 'image/avif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  css: 'text/css',
  woff: 'font/woff',
  woff2: 'font/woff2',
  txt: 'text/plain',
  json: 'application/json',
};
export function canonical(key) {
  if (key === 'social/og-image.png') return key;
  if (key.startsWith('social/')) return 'social icons/' + key.slice(7);
  if (/^(favicon\.ico|favicon\.svg|favicon-(48|32|16)\.png|apple-touch-icon\.png|icon-192\.png|icon-512(?:-maskable)?\.png)$/.test(key)) return 'icons/' + key;
  if (key === 'og-image.png') return 'social/og-image.png';
  if (key === 'about-accumulation.svg' || key === 'faq-question.svg') return 'animations/' + key;
  if (/^blockallisto-lockup-horizontal(?:-reversed)?\.svg$/.test(key)) return 'logo/' + key;
  if (key === 'demo-solar-farm.jpg') return 'campaigns/' + key;
  return key;
}
async function jsonBody(response) {
  if (!response.ok || response.redirected || !response.body) throw Error('provider');
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > 16384) throw Error('metadata');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}
const encoded = (key) => key.split('/').map(encodeURIComponent).join('/');
function trustedHost(value) {
  const u = new URL(value);
  if (
    u.protocol !== 'https:' ||
    !/^(?:api|f)[a-z0-9-]*\.backblazeb2\.com$/.test(u.hostname) ||
    u.port ||
    u.username ||
    u.password ||
    u.pathname !== '/' ||
    u.search ||
    u.hash
  )
    throw Error('provider');
  return u.origin;
}
export async function reserveBudget(file, delta, now = Date.now()) {
  if (!file) throw Error('disabled');
  const day = new Date(now).toISOString().slice(0, 10);
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const lock = file + '.lock';
  await mkdir(lock, { mode: 0o700 }); // Cross-process exclusive; stale locks fail closed.
  const temp = file + '.tmp';
  try {
    let state = JSON.parse(await readFile(file, 'utf8'));
    if (!state || !/^\d{4}-\d{2}-\d{2}$/.test(state.day) || !['bytes', 'downloads', 'operations'].every((k) => Number.isSafeInteger(state[k]) && state[k] >= 0))
      throw Error('accounting');
    if (state?.day > day) throw Error('clock');
    if (state.day < day) state = { day, bytes: 0, downloads: 0, operations: 0 };
    for (const [key, limit] of Object.entries({ bytes: 64 * 1024 * 1024, downloads: 256, operations: 256 })) {
      const value = delta[key] || 0;
      if (!Number.isSafeInteger(value) || value < 0 || state[key] + value > limit) throw Error('budget');
      state[key] += value;
    }
    const handle = await open(temp, 'w', 0o600);
    try {
      await handle.writeFile(JSON.stringify(state));
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temp, file);
    const directory = await open(dirname(file), 'r');
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
    return state;
  } finally {
    await rm(temp, { force: true });
    await rm(lock, { recursive: true, force: true });
  }
}
async function bodyBytes(response, size) {
  if (!response.ok || response.redirected || !response.body) throw Error('provider');
  const length = response.headers.get('content-length');
  if (length && Number(length) !== size) throw Error('size');
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > size || total > 1024 * 1024) throw Error('size');
    chunks.push(chunk);
  }
  if (total !== size) throw Error('size');
  return Buffer.concat(chunks);
}
export function createMediaGateway({ index, fetchImpl = fetch, budgetFile, keyFiles, now = Date.now, timeoutMs = 4000 }) {
  if (!Array.isArray(index) || index.length > 1000) throw Error('index');
  const assets = new Map();
  for (const row of index) {
    if (
      !/^[A-Za-z0-9._/ -]+$/.test(row.key) ||
      row.key.includes('..') ||
      row.key.includes('//') ||
      row.key.startsWith('/') ||
      !['bytes', 'pagesBytes'].every((key) => Number.isSafeInteger(row[key]) && row[key] > 0 && row[key] <= 1024 * 1024) ||
      !['sha256', 'pagesSha256'].every((key) => /^[a-f0-9]{64}$/.test(row[key])) ||
      assets.has(row.key)
    )
      throw Error('index');
    assets.set(row.key, row);
  }
  if (keyFiles && (keyFiles.length !== 2 || !budgetFile)) throw Error('config');
  // Serialize local accounting so parallel keys do not collide on the cross-process lock.
  let accounting = Promise.resolve();
  const reserve = (delta) => {
    const next = accounting.then(() => reserveBudget(budgetFile, delta, now()));
    accounting = next.catch(() => {});
    return next;
  };
  const inFlight = new Map();
  const rates = new Map();
  let minute = 0,
    globalCount = 0,
    active = 0,
    directActive = 0,
    workerUntil = 0,
    pagesUntil = 0;
  let auth = null,
    authorizing = null;
  const negative = new Map();
  const directQueue = [];
  const enterDirect = async (signal) => {
    if (signal.aborted) throw Error('cancelled');
    if (directActive < 4) {
      directActive++;
      return;
    }
    if (directQueue.length >= 28) throw Error('busy');
    await new Promise((resolve, reject) => {
      const item = {
        resolve: () => {
          signal.removeEventListener('abort', cancel);
          resolve();
        },
      };
      const cancel = () => {
        const i = directQueue.indexOf(item);
        if (i >= 0) directQueue.splice(i, 1);
        reject(Error('cancelled'));
      };
      directQueue.push(item);
      signal.addEventListener('abort', cancel, { once: true });
    });
  };
  const leaveDirect = () => {
    const next = directQueue.shift();
    if (next) next.resolve();
    else directActive--;
  };
  const rate = (ip) => {
    const current = Math.floor(now() / 60000);
    if (current !== minute) {
      minute = current;
      globalCount = 0;
      rates.clear();
    }
    if (globalCount >= 600 || (rates.get(ip) || 0) >= 120 || (!rates.has(ip) && rates.size >= 600)) return false;
    globalCount++;
    rates.set(ip, (rates.get(ip) || 0) + 1);
    return true;
  };
  const request = async (url, options, signal) => fetchImpl(url, { ...options, redirect: 'error', signal });
  async function account(signal) {
    if (auth && auth.until > now()) return auth;
    if (authorizing) return authorizing;
    authorizing = (async () => {
      await reserve({ operations: 1 });
      const [id, secret] = await Promise.all(keyFiles.map((file) => readFile(file, 'utf8')));
      const response = await request(
        'https://api.backblazeb2.com/b2api/v3/b2_authorize_account',
        { headers: { Authorization: 'Basic ' + Buffer.from(id.trim() + ':' + secret.trim()).toString('base64') } },
        signal,
      );
      if (!response.ok) throw Error('auth');
      const j = await jsonBody(response);
      const storage = j.apiInfo?.storageApi;
      const allowed = storage?.allowed || storage;
      const caps = allowed?.capabilities;
      if (!Array.isArray(caps) || !caps.includes('shareFiles') || !caps.includes('readFiles') || caps.some((cap) => !['shareFiles', 'readFiles'].includes(cap)))
        throw Error('capability');
      if (allowed.bucketId !== BUCKET_ID || allowed.namePrefix !== 'public/') throw Error('scope');
      auth = { token: j.authorizationToken, api: trustedHost(storage.apiUrl), download: trustedHost(storage.downloadUrl), until: now() + 3600000 };
      return auth;
    })();
    try {
      return await authorizing;
    } finally {
      authorizing = null;
    }
  }
  async function direct(entry, signal) {
    if (!keyFiles || !budgetFile) throw Error('disabled');
    await enterDirect(signal);
    try {
      // Reserve before every attempt; failures consume the reservation too.
      await reserve({ bytes: entry.bytes, downloads: 1 });
      const a = await account(signal);
      await reserve({ operations: 1 });
      const response = await request(
        a.api + '/b2api/v3/b2_get_download_authorization',
        {
          method: 'POST',
          headers: { Authorization: a.token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucketId: BUCKET_ID, fileNamePrefix: 'public/' + entry.key, validDurationInSeconds: 120 }),
        },
        signal,
      );
      if (!response.ok) {
        if (response.status === 401) auth = null;
        throw Error('token');
      }
      const j = await jsonBody(response);
      if (j.bucketId !== BUCKET_ID || j.fileNamePrefix !== 'public/' + entry.key || typeof j.authorizationToken !== 'string') throw Error('token');
      const file = await request(
        a.download + '/file/' + BUCKET + '/' + encoded('public/' + entry.key),
        { headers: { Authorization: j.authorizationToken } },
        signal,
      );
      if (file.status === 401) auth = null;
      return await bodyBytes(file, entry.bytes);
    } finally {
      leaveDirect();
    }
  }
  function verify(bytes, entry, stage) {
    if (createHash('sha256').update(bytes).digest('hex') !== (stage === 'pages' ? entry.pagesSha256 : entry.sha256)) throw Error('hash');
    if (!entry.key.endsWith('.css')) return bytes;
    return Buffer.from(
      bytes.toString().replace(/url\((['"]?)([^)'"\s]+)\1\)/g, (_all, _quote, value) => {
        const u = new URL(value, PAGES + '/' + entry.key);
        if (![PAGES, WORKER].includes(u.origin) || u.search || u.hash || !assets.has(canonical(decodeURIComponent(u.pathname.slice(1))))) throw Error('css');
        return "url('/media/" + encoded(canonical(decodeURIComponent(u.pathname.slice(1)))) + "?retry=1')";
      }),
    );
  }
  async function obtain(entry, skipPrimary, cancelled) {
    const whole = AbortSignal.any([cancelled, AbortSignal.timeout(timeoutMs * 3)]);
    for (const stage of ['pages', 'worker', 'direct']) {
      if (whole.aborted) break;
      if (stage === 'pages' && (skipPrimary || pagesUntil > now())) continue;
      if (stage === 'worker' && workerUntil > now()) continue;
      const signal = AbortSignal.any([whole, AbortSignal.timeout(timeoutMs)]);
      try {
        let response;
        if (stage === 'direct') return { bytes: verify(await direct(entry, signal), entry, stage), stage };
        else {
          const workerKey = entry.key.startsWith('social icons/') ? 'social/' + entry.key.slice(13) : entry.key;
          response = await request((stage === 'pages' ? PAGES : WORKER) + '/' + encoded(stage === 'pages' ? entry.key : workerKey), {}, signal);
          if ([403, 429, 500, 502, 503, 504].includes(response.status)) {
            if (stage === 'pages') pagesUntil = now() + 30000;
            else workerUntil = now() + 30000;
          }
        }
        const bytes = await bodyBytes(response, stage === 'pages' ? entry.pagesBytes : entry.bytes);
        return { bytes: verify(bytes, entry, stage), stage };
      } catch {
        if (stage === 'pages') pagesUntil = now() + 30000;
        if (stage === 'worker') workerUntil = now() + 30000;
        if (whole.aborted) break;
      }
    }
    throw Error('unavailable');
  }
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(req.method)) return res.sendStatus(405);
    let key;
    try {
      const raw = req.url.split('?')[0].replace(/^\//, '');
      key = decodeURIComponent(raw);
      if (key.includes('%') || key.includes('..') || key.includes('//') || !/^[A-Za-z0-9._/ -]+$/.test(key)) throw Error('path');
      key = canonical(key);
    } catch {
      return res.sendStatus(404);
    }
    const entry = assets.get(key);
    if (!entry || req.headers.range) return res.sendStatus(404);
    if (!rate(req.socket.remoteAddress || 'unknown') || active >= 32) {
      res.setHeader('Retry-After', '60');
      return res.sendStatus(429);
    }
    if ((negative.get(key) || 0) > now()) return res.sendStatus(503);
    active++;
    const skip = new URL(req.url, 'http://local').searchParams.get('retry') === '1';
    const flightKey = key + ':' + skip;
    if (!inFlight.has(flightKey)) {
      const controller = new AbortController();
      const job = { controller, users: 0, promise: null };
      job.promise = obtain(entry, skip, controller.signal).finally(() => inFlight.delete(flightKey));
      inFlight.set(flightKey, job);
    }
    const job = inFlight.get(flightKey);
    job.users++;
    let detached = false;
    const detach = () => {
      if (detached) return;
      detached = true;
      job.users--;
      if (job.users === 0) job.controller.abort();
    };
    res.once('close', detach);
    try {
      const result = await job.promise;
      if (res.destroyed) return;
      res.setHeader('Content-Type', types[key.split('.').at(-1)] || 'application/octet-stream');
      res.setHeader('Content-Length', String(result.bytes.length));
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Media-Stage', result.stage);
      res.status(200).end(req.method === 'HEAD' ? undefined : result.bytes);
    } catch {
      negative.set(key, now() + 30000);
      if (!res.destroyed) {
        res.setHeader('Retry-After', '60');
        res.sendStatus(503);
      }
    } finally {
      active--;
      res.off('close', detach);
      detach();
    }
  };
}
