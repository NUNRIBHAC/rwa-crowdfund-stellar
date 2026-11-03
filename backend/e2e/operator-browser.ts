/** Isolated operator UI -> HTTP -> real community service/file store exercise.
 * No hosted URLs, mail transport, chain submitter, or persistent credentials.
 * Synthetic funding/entitlement providers are explicitly not chain evidence.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { stop } from 'esbuild';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createCommunityRouter } from '../src/community-routes.js';

const root = fileURLToPath(new URL('../../frontend/', import.meta.url));
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'operator-browser-'));
const previousAllowlist = process.env.OPERATOR_WALLETS;
const operator = Keypair.random();
const owner = Keypair.random();
process.env.OPERATOR_WALLETS = operator.publicKey();
const storePath = path.join(dir, 'community.json');
const service = new CommunityService(new FileCommunityStore(storePath), { retentionDays: 90 });
const app = express();
app.use(express.json());
app.use(
  createCommunityRouter({
    service,
    requireAdmin: (_req, res) => {
      res.status(403).json({ error: 'No external admin in isolated exercise' });
      return false;
    },
    fundingState: async (id) => ({ id, goal: '100', raised: '50', deadlineSeconds: Math.floor(Date.now() / 1000) - 100, withdrawn: false }),
    reconciliation: async () => ({ generatedAt: new Date().toISOString(), network: 'isolated-synthetic', quarantinedIntents: 0, campaigns: [] }),
    investorEntitlement: async () => ({ registered: true, balanceUnits: 1n, contributedBefore: true }),
  }),
);
const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
app.get('/__isolated_operator', async (_req, res) => {
  const html = `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';import {I18nProvider} from '/src/i18n/index.tsx';import {CommunityAuthProvider} from '/src/community/CommunityAuth.tsx';import OperatorSection from '/src/components/OperatorSection.tsx';import '/src/styles.css';import '/src/content-surfaces.css';
const h=React.createElement;createRoot(document.getElementById('root')).render(h(I18nProvider,null,h('main',{className:'page'},h('p',null,'ISOLATED SYNTHETIC DATA - REAL LOCAL HTTP - NO CHAIN OR EMAIL'),h(CommunityAuthProvider,{messages:{freighterMissing:'Unavailable in isolated exercise',walletNoSign:'No external wallet'}},h(OperatorSection,{campaigns:[{id:'fixture',name:'ISOLATED CAMPAIGN'}]})))));
</script></body></html>`;
  res.type('html').send(await vite.transformIndexHtml('/__isolated_operator', html));
});
app.use(vite.middlewares);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve) => server.once('listening', resolve));
const address = server.address();
assert(address && typeof address !== 'string');
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  args: ['--no-sandbox'],
});
try {
  const request = async (route: string, token?: string, body?: unknown) => {
    const res = await fetch(origin + route, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await res.json();
    assert(res.ok, `${route}: ${res.status} ${JSON.stringify(result)}`);
    return result;
  };
  const login = async (key: Keypair) => {
    const challenge = await request('/api/auth/challenge', undefined, { publicKey: key.publicKey() });
    const result = await request('/api/auth/verify', undefined, {
      publicKey: key.publicKey(),
      signature: Buffer.from(key.signMessage(challenge.message)).toString('base64'),
    });
    return result.token as string;
  };
  const operatorToken = await login(operator);
  const ownerToken = await login(owner);
  await request('/api/issuer-applications', ownerToken, {
    projectName: 'ISOLATED SYNTHETIC PROJECT',
    country: 'PT',
    instrumentType: 'test',
    targetAmount: '1',
    description: 'Local test only',
  });
  await request('/api/support/tickets', ownerToken, { kind: 'support', subject: 'ISOLATED SYNTHETIC TICKET', body: 'Local test only' });
  await request('/api/campaigns/fixture/comments', ownerToken, { body: 'ISOLATED SYNTHETIC COMMENT' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript((token) => {
    localStorage.setItem('blockallisto-community-token', token);
    localStorage.setItem('blockallisto-language', 'en');
  }, operatorToken);
  await page.goto(origin + '/__isolated_operator');
  await page.getByText('ISOLATED SYNTHETIC PROJECT', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Mark under review', exact: true }).click();
  await page.getByText('Status updated.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByText('Approved', { exact: true }).waitFor();
  await page.reload();
  await page.getByText('Approved', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Comments', exact: true }).click();
  await page.getByRole('button', { name: 'Hide', exact: true }).click();
  await page.getByLabel('Reason for hiding (optional, shown to the author)').fill('ISOLATED TEST');
  await page.getByRole('button', { name: 'Confirm hide', exact: true }).click();
  await page.getByRole('button', { name: 'Unhide', exact: true }).click();
  await page.getByRole('button', { name: 'Hide', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Tickets', exact: true }).click();
  await page.getByRole('button', { name: 'Close ticket', exact: true }).click();
  await page.getByRole('button', { name: 'Close ticket', exact: true }).waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'News', exact: true }).click();
  await page.locator('form select').first().selectOption('fixture');
  await page.getByLabel('Title', { exact: true }).fill('ISOLATED NEWS');
  await page.getByLabel('Body', { exact: true }).fill('Synthetic local news body');
  await page.getByRole('button', { name: 'Publish news post', exact: true }).click();
  await page.getByText('News post published.', { exact: true }).waitFor();
  assert.equal((await service.listNews('fixture'))[0].title, 'ISOLATED NEWS');
  await page.getByRole('button', { name: 'Reports', exact: true }).click();
  await page.locator('form select').first().selectOption('fixture');
  await page.getByLabel('Title', { exact: true }).fill('ISOLATED REPORT');
  await page.getByLabel('Body', { exact: true }).fill('Synthetic funding provider; not real chain evidence');
  await page.getByRole('button', { name: 'Publish report', exact: true }).click();
  await page.getByText('Report published as platform demo content.', { exact: true }).waitFor();
  assert.equal((await service.listReports('fixture'))[0].title, 'ISOLATED REPORT');
  await page.getByRole('button', { name: 'Podcast', exact: true }).click();
  await page.getByLabel('Episode title', { exact: true }).fill('ISOLATED EPISODE');
  await page.getByLabel('Description', { exact: true }).fill('Synthetic audio reference; never fetched');
  await page.getByLabel('Audio URL (https)', { exact: true }).fill('https://example.invalid/never-fetched.mp3');
  await page.getByRole('button', { name: 'Publish episode', exact: true }).click();
  await page.getByText('Episode published as platform demo content.', { exact: true }).waitFor();
  assert.equal((await service.listEpisodes())[0].title, 'ISOLATED EPISODE');
  await page.getByRole('button', { name: 'Audit log', exact: true }).click();
  await page.getByText('ticket.close', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Tickets', exact: true }).click();
  assert.equal(await page.getByText('Episode published as platform demo content.', { exact: true }).count(), 0);
  const notifications = await request('/api/notifications', ownerToken);
  for (const kind of ['application_status', 'comment_moderated', 'ticket_closed'])
    assert(
      notifications.notifications.some((n: { kind: string }) => n.kind === kind),
      kind,
    );
  // Reopen the file store independently: browser state alone is not persistence proof.
  const persisted = await new CommunityService(new FileCommunityStore(storePath), { retentionDays: 90 }).adminListApplications();
  assert.equal(persisted[0].status, 'approved');
  const denied = await fetch(origin + '/api/operator/issuer-applications', { headers: { authorization: `Bearer ${ownerToken}` } });
  assert.equal(denied.status, 403);
  if (process.env.OPERATOR_SCREENSHOT_DIR) {
    await fs.mkdir(process.env.OPERATOR_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.OPERATOR_SCREENSHOT_DIR, 'ticket-closed.png'), fullPage: true });
    await page.getByRole('button', { name: 'Applications', exact: true }).click();
    await page.screenshot({ path: path.join(process.env.OPERATOR_SCREENSHOT_DIR, 'application-approved.png'), fullPage: true });
  }
  console.log('PASS isolated operator browser + real HTTP + durable file store + owner notifications + role denial; no chain/email execution');
} finally {
  await browser.close();
  await vite.close();
  stop();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await fs.rm(dir, { recursive: true, force: true });
  if (previousAllowlist === undefined) delete process.env.OPERATOR_WALLETS;
  else process.env.OPERATOR_WALLETS = previousAllowlist;
}
