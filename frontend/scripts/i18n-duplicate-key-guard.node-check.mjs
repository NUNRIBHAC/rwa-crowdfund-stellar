import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { duplicateKeys, catalogFiles } from './i18n-duplicate-key-guard.mjs';

test('detects repeated raw keys even when effective values match', () => {
  assert.deepEqual(
    duplicateKeys('{"a":1,"a":1}').map((x) => x.path),
    [['a']],
  );
});
test('detects different and escaped-equivalent keys inside nested arrays', () => {
  const text = '{"rows":[{"name":"old","na\\u006de":"new"}]}';
  assert.deepEqual(
    duplicateKeys(text).map((x) => x.path),
    [['rows', 0, 'name']],
  );
  assert.equal(JSON.parse(text).rows[0].name, 'new');
});
test('same names in separate objects are valid, strings are not key tokens', () => {
  assert.deepEqual(duplicateKeys('{"a":{"name":"a\\\"b"},"b":{"name":"{name:name}"},"c":[],"n":null,"x":true}'), []);
});
test('rejects malformed JSON rather than guessing its token structure', () => {
  assert.throws(() => duplicateKeys('{"a":}'), SyntaxError);
});
test('all committed UI, legal, mail and baseline catalogs reject duplicate keys', () => {
  const files = catalogFiles(new URL('../i18n-json', import.meta.url).pathname);
  assert.ok(files.length >= 33);
  for (const file of files) assert.deepEqual(duplicateKeys(readFileSync(file, 'utf8')), [], file);
});
