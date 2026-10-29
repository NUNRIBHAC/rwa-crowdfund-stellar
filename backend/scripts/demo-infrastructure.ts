// Entirely offline. All people, rights, asset class and bank references are fixtures.
import { generateKeyPairSync, sign } from 'node:crypto';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { Infrastructure, valuationPayload, type Actor } from '../src/infrastructure/service.js';
import { Store } from '../src/infrastructure/store.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rwa-infrastructure-demo-'));
try {
 const {publicKey,privateKey}=generateKeyPairSync('ed25519');
 const api=new Infrastructure(new Store(path.join(dir,'state.json')),{fixture_valuer:publicKey.export({type:'spki',format:'pem'}).toString()});
 const actor=(id:string,role:Actor['role']):Actor=>({id,role}); const compliance=actor('reviewer','compliance'),operator=actor('operator','operator');
 api.recordIdentity(compliance,{subject:'fixture_investor',country:'PT',outcome:'demo_pass',reference:'not-real-kyc'});
 const now=Date.now();const value={assetId:'fixture_asset',amountMinor:'10000000',currency:'EUR',observedAt:now,expiresAt:now+60000,evidenceHash:'0'.repeat(64),method:'independent_appraisal',signer:'fixture_valuer'};
 api.publishValuation(actor('valuer','valuation'),value,sign(null,Buffer.from(valuationPayload(value)),privateKey).toString('base64'));
 const p=api.propose(actor('proposer','governor'),{kind:'pilot_policy',assetId:'fixture_asset',jurisdiction:'PT',rightsHash:'0'.repeat(64),economicModel:'loan',assetClass:'fixture_only_not_a_selection'});
 api.approve(actor('reviewer_one','governor'),p.id);api.approve(actor('reviewer_two','governor'),p.id);
 const eligibility=api.eligibility('fixture_investor','fixture_asset','testnet');
 api.requestCashout(operator,{subject:'fixture_investor',assetId:'fixture_asset',amountMinor:'100',currency:'EUR',destinationRef:'fake-bank-reference',idempotencyKey:'demo-one'});
 api.approveCashout(compliance,'demo-one'); const result=await api.dispatchCashout(operator,'demo-one');
 console.log(JSON.stringify({status:api.status(),eligibility,cashoutState:result.state,fiatMoved:false,auditEvents:api.store.read().audit.length},null,2));
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
