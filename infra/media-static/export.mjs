#!/usr/bin/env node
// Offline, deterministic public-only export. No credentials, bucket writes or
// network requests. Every input is hash checked before any output is emitted.
import process from 'node:process';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const manifest = JSON.parse(readFileSync(resolve(root, 'infra/media-static/manifest.json'), 'utf8'));
export function canonicalKey(key) {
  if (key === 'social/og-image.png') return key;
  if (key.startsWith('social/')) return 'social icons/' + key.slice(7);
  if (/^(favicon\.ico|favicon\.svg|favicon-(48|32|16)\.png|apple-touch-icon\.png|icon-192\.png|icon-512(?:-maskable)?\.png)$/.test(key)) return 'icons/' + key;
  if (key === 'og-image.png') return 'social/og-image.png';
  if (key === 'about-accumulation.svg' || key === 'faq-question.svg') return 'animations/' + key;
  if (/^blockallisto-lockup-horizontal(?:-reversed)?\.svg$/.test(key)) return 'logo/' + key;
  if (key === 'demo-solar-farm.jpg') return 'campaigns/' + key;
  return key;
}
export function staticAsset(key) {
  const entry = manifest.find((x) => x.key === canonicalKey(key));
  if (!entry) throw new Error('Unknown public media key: ' + key);
  const data = readFileSync(resolve(root, entry.source));
  if (data.length !== entry.bytes || createHash('sha256').update(data).digest('hex') !== entry.sha256)
    throw new Error('Public media hash mismatch: ' + entry.key);
  if (!key.endsWith('.css')) return data;
  // CSS must not retain absolute Worker URLs, or the supposedly independent
  // font mirror would still depend on that Worker. Relative URLs work on both
  // Pages /fonts/css and Oracle /media/fonts/css.
  return Buffer.from(
    data
      .toString()
      .replaceAll(/https:\/\/blockallisto-media\.nunrib-df6\.workers\.dev\/([^)'"\s]+)/g, (_all, target) => posix.relative(posix.dirname(key), target)),
  );
}
export function exportStatic(destination) {
  const aliases = [
    'favicon.ico',
    'favicon.svg',
    'favicon-48.png',
    'favicon-32.png',
    'favicon-16.png',
    'apple-touch-icon.png',
    'icon-192.png',
    'icon-512.png',
    'icon-512-maskable.png',
    'og-image.png',
    'about-accumulation.svg',
    'faq-question.svg',
    'blockallisto-lockup-horizontal.svg',
    'blockallisto-lockup-horizontal-reversed.svg',
    'demo-solar-farm.jpg',
  ];
  const keys = [
    ...new Set([
      ...manifest.map((x) => x.key),
      ...manifest.filter((x) => x.key.startsWith('social icons/')).map((x) => 'social/' + x.key.slice(13)),
      ...aliases,
    ]),
  ];
  const files = keys.map((key) => ({ key, data: staticAsset(key) }));
  if (existsSync(destination)) throw new Error('Refusing to overwrite an existing export: ' + destination);
  for (const { key, data } of files) {
    const path = resolve(destination, key);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, data);
  }
  writeFileSync(
    resolve(destination, '_headers'),
    '/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=86400\n  X-Content-Type-Options: nosniff\n',
  );
  // Static only. No _worker.js and no functions directory are ever exported.
  writeFileSync(
    resolve(destination, 'checksums.json'),
    JSON.stringify(
      files.map(({ key, data }) => ({ key, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') })),
      null,
      2,
    ) + '\n',
  );
  return files.length;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Usage: node infra/media-static/export.mjs NEW_OUTPUT_DIRECTORY');
  console.log('Exported public files:', exportStatic(resolve(process.argv[2])));
}
