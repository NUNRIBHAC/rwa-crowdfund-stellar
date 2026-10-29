import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { Infrastructure } from './service.js';
import { Store } from './store.js';
import { infrastructureRouter, type Credential } from './router.js';
if (process.env.INFRA_MODE !== 'test_only') throw new Error('Set INFRA_MODE=test_only. Live infrastructure mode is not implemented.');
const credentials = JSON.parse(process.env.INFRA_CREDENTIALS_JSON ?? '[]') as Credential[];
if (credentials.length === 0) throw new Error('No infrastructure credentials configured');
const keys = JSON.parse(process.env.INFRA_VALUATION_KEYS_JSON ?? '{}');
const app = express();
app.use('/api/infrastructure', infrastructureRouter(new Infrastructure(new Store(process.env.INFRA_STORE_PATH ?? path.resolve('data/infrastructure.json')), keys), credentials));
// Deliberately never mount legacy payment routes or a live anchor adapter here.
const port = Number(process.env.INFRA_PORT ?? 4100);
app.listen(port, '127.0.0.1', () => console.log(`Test-only infrastructure API at http://127.0.0.1:${port}/api/infrastructure/status`));
