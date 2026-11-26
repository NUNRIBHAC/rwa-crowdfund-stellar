#!/usr/bin/env node
// JSON.parse keeps the last duplicate key. Validate the raw token stream first
// so projection/equality checks cannot silently hide earlier translator text.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function duplicateKeys(text) {
  JSON.parse(text); // Reject malformed syntax before the bounded token walk.
  let pos = 0;
  const duplicates = [];
  const space = () => {
    while (/\s/.test(text[pos] || '') && pos < text.length) pos++;
  };
  function string() {
    const start = pos++;
    while (pos < text.length) {
      if (text[pos] === '\\') {
        pos += 2;
        continue;
      }
      if (text[pos++] === '"') return JSON.parse(text.slice(start, pos));
    }
    throw new Error('Unterminated JSON string');
  }
  function value(path) {
    space();
    if (text[pos] === '{') {
      pos++;
      space();
      const seen = new Set();
      while (text[pos] !== '}') {
        space();
        const keyOffset = pos;
        const key = string();
        const next = [...path, key];
        if (seen.has(key)) duplicates.push({ path: next, offset: keyOffset });
        seen.add(key);
        space();
        pos++;
        value(next);
        space();
        if (text[pos] !== ',') break;
        pos++;
      }
      pos++;
    } else if (text[pos] === '[') {
      pos++;
      space();
      let index = 0;
      while (text[pos] !== ']') {
        value([...path, index++]);
        space();
        if (text[pos] !== ',') break;
        pos++;
      }
      pos++;
    } else if (text[pos] === '"') string();
    else {
      while (pos < text.length && !/[\s,}\]]/.test(text[pos])) pos++;
    }
  }
  value([]);
  return duplicates;
}

export function catalogFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? catalogFiles(path) : entry.name.endsWith('.json') ? [path] : [];
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../i18n-json');
  const files = catalogFiles(root);
  let count = 0;
  for (const file of files) {
    for (const duplicate of duplicateKeys(readFileSync(file, 'utf8'))) {
      console.error(`${file}: duplicate ${JSON.stringify(duplicate.path)} at offset ${duplicate.offset}`);
      count++;
    }
  }
  if (count) {
    console.error(`Duplicate-key guard failed: ${count} repeated object keys`);
    process.exitCode = 1;
  } else console.log(`Duplicate-key guard: ${files.length} catalogs contain no repeated object keys`);
}
