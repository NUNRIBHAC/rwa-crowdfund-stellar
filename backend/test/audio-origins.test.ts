import { test } from 'node:test';
import assert from 'node:assert/strict';
import { audioOrigins, audioUrlAllowed } from '../src/audio-origins.js';

test('audio defaults closed and exact allowlist preserves HTTPS origin boundaries', () => {
  assert.deepEqual(audioOrigins({}), []);
  assert.equal(audioUrlAllowed('https://audio.example.com/episode.mp3', {}), false);
  const env = { COMMUNITY_AUDIO_ORIGINS: 'https://audio.example.com,https://cdn.example.com,https://audio.example.com' };
  assert.deepEqual(audioOrigins(env), ['https://audio.example.com', 'https://cdn.example.com']);
  assert.equal(audioUrlAllowed('https://audio.example.com/path/episode.mp3?q=1', env), true);
  for (const url of [
    'http://audio.example.com/x.mp3',
    'https://audio.example.com.attacker.invalid/x',
    'https://a.audio.example.com/x',
    'https://user:password@audio.example.com/x',
    'https://audio.example.com:444/x',
    'data:audio/mp3,evil',
    'javascript:alert(1)',
  ])
    assert.equal(audioUrlAllowed(url, env), false, url);
});
test('audio CSP configuration rejects wildcard, path, credentials and noncanonical entries', () => {
  for (const value of [
    'https:',
    '*',
    'https://*.example.com',
    'https://audio.example.com/',
    'https://audio.example.com/path',
    'http://audio.example.com',
    'https://user:password@audio.example.com',
    'https://audio.example.com?x=1',
    'https://audio.example.com#x',
  ])
    assert.throws(() => audioOrigins({ COMMUNITY_AUDIO_ORIGINS: value }), value);
});
