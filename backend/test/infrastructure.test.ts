import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { generateKeyPairSync, sign } from 'node:crypto';
import express from 'express';
import { Infrastructure, MockCashoutAdapter, valuationPayload, type Actor, type CashoutAdapter } from '../src/infrastructure/service.js';
import { Store } from '../src/infrastructure/store.js';
import { infrastructureRouter } from '../src/infrastructure/router.js';
const a = (id: string, role: Actor['role']): Actor => ({ id, role });
const op=a('op','operator'), compliance=a('compliance','compliance'), val=a('val','valuation'), g1=a('g1','governor'),g2=a('g2','governor'),g3=a('g3','governor');
const hash='a'.repeat(64); const {publicKey,privateKey}=generateKeyPairSync('ed25519');
function fixture(adapter: CashoutAdapter = new MockCashoutAdapter()) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rwa-infra-')); const store=new Store(path.join(dir,'state.json')); let now=1000000;
 const service=new Infrastructure(store,{valuer:publicKey.export({type:'spki',format:'pem'}).toString()},()=>now,adapter);
 const v={assetId:'test_asset',amountMinor:'12500000',currency:'EUR',observedAt:now,expiresAt:now+60000,evidenceHash:hash,method:'independent_appraisal',signer:'valuer'};
 const publish=(data=v)=>service.publishValuation(val,data,sign(null,Buffer.from(valuationPayload(data)),privateKey).toString('base64'));
 const policy=(kind='pilot_policy')=>service.propose(g1,{kind,assetId:'test_asset',jurisdiction:'PT',rightsHash:hash,economicModel:'loan',assetClass:'fixture_only'});
 const ready=()=>{service.recordIdentity(compliance,{subject:'alice',country:'PT',outcome:'demo_pass',reference:'fixture'});publish();const p=policy();service.approve(g2,p.id);service.approve(g3,p.id);};
 const request={subject:'alice',assetId:'test_asset',amountMinor:'100',currency:'EUR',destinationRef:'fake-beneficiary',idempotencyKey:'one'};
 return {service,store,publish,policy,ready,request,v,setNow:(n:number)=>now=n};
}
test('status cannot claim production eligibility or payments',()=>{const f=fixture();assert.equal(f.service.status().livePayments,false);assert.throws(()=>f.service.eligibility('alice','test_asset','mainnet'),/testnet/);});
test('identity input is strict and role separated',()=>{const f=fixture(); assert.throws(()=>f.service.recordIdentity(op,{}),/compliance/);assert.throws(()=>f.service.recordIdentity(compliance,{subject:'alice',country:'PT',outcome:'verified',reference:'x'}));});
test('missing policy, identity and valuation fail closed',()=>{const f=fixture();assert.throws(()=>f.service.eligibility('alice','test_asset','testnet'));});
test('valid mock identity is simulation only and expires',()=>{const f=fixture();f.ready();assert.equal(f.service.eligibility('alice','test_asset','testnet').productionEligible,false);f.setNow(5000000);assert.throws(()=>f.service.eligibility('alice','test_asset','testnet'));});
test('rejected and wrong-country identities denied',()=>{const f=fixture();f.ready();for(const [country,outcome] of [['PT','rejected'],['US','demo_pass']]){f.service.recordIdentity(compliance,{subject:'alice',country,outcome,reference:'x'});assert.throws(()=>f.service.eligibility('alice','test_asset','testnet'));}});
test('valuation signature binds asset, amount and evidence',()=>{const f=fixture();assert.throws(()=>f.service.publishValuation(val,f.v,'invalid'),/signature/);const sig=sign(null,Buffer.from(valuationPayload(f.v)),privateKey).toString('base64');assert.throws(()=>f.service.publishValuation(val,{...f.v,amountMinor:'1'},sig),/signature/);f.publish();});
test('valuation rejects stale, future, replay, unknown signer, fractional amount',()=>{const f=fixture();f.publish();assert.throws(()=>f.publish(),/replay/);for(const v of [{...f.v,expiresAt:999999},{...f.v,observedAt:1000001},{...f.v,signer:'unknown'},{...f.v,amountMinor:'0.1'}]) assert.throws(()=>f.publish(v));});
test('governance requires proposer plus two distinct other governors',()=>{const f=fixture();const p=f.policy();assert.throws(()=>f.service.approve(g1,p.id),/independent/);f.service.approve(g2,p.id);assert.throws(()=>f.service.approve(g2,p.id),/distinct/);assert.equal(f.service.approve(g3,p.id).state,'approved');assert.throws(()=>f.service.approve(g2,p.id),/closed/);});
test('governance expires and forbids wrong role',()=>{const f=fixture();const p=f.policy();assert.throws(()=>f.service.approve(op,p.id),/governor/);f.setNow(5000000);assert.throws(()=>f.service.approve(g2,p.id),/expired/);});
test('approved pause blocks eligibility and dispatch',async()=>{const f=fixture();f.ready();f.service.requestCashout(op,f.request);f.service.approveCashout(compliance,'one');const p=f.policy('pause');f.service.approve(g2,p.id);f.service.approve(g3,p.id);await assert.rejects(f.service.dispatchCashout(op,'one'),/paused/);});
test('cashout idempotency binds full request',()=>{const f=fixture();f.ready();const c=f.service.requestCashout(op,f.request);assert.equal(f.service.requestCashout(op,f.request).id,c.id);assert.throws(()=>f.service.requestCashout(op,{...f.request,amountMinor:'101'}),/conflicts/);});
test('cashout approval role and independent principal enforced',()=>{const f=fixture();f.ready();f.service.requestCashout(op,f.request);assert.throws(()=>f.service.approveCashout(op,'one'),/compliance/);assert.throws(()=>f.service.approveCashout(a('op','compliance'),'one'),/independent/);});
test('mock dispatch persists intent and never reports fiat paid',async()=>{let calls=0;const adapter:CashoutAdapter={mode:'test_only',submit:async()=>{calls++;assert.equal(f.store.read().cashouts.one.state,'dispatching');return{outcome:'simulated'};}};const f=fixture(adapter);f.ready();f.service.requestCashout(op,f.request);f.service.approveCashout(compliance,'one');assert.equal((await f.service.dispatchCashout(op,'one')).state,'simulated');await f.service.dispatchCashout(op,'one');assert.equal(calls,1);});
test('timeout holds durable unknown and never blindly resends',async()=>{let calls=0;const f=fixture({mode:'test_only',submit:async()=>{calls++;throw Error('timeout');}});f.ready();f.service.requestCashout(op,f.request);f.service.approveCashout(compliance,'one');assert.equal((await f.service.dispatchCashout(op,'one')).state,'unknown');await assert.rejects(f.service.dispatchCashout(op,'one'),/manual/);assert.equal(calls,1);});
test('restart preserves dispatching hold after crash',async()=>{const f=fixture();f.ready();f.service.requestCashout(op,f.request);f.service.approveCashout(compliance,'one');f.store.change(s=>{s.cashouts.one.state='dispatching';});const restarted=new Infrastructure(new Store(f.store.filename));await assert.rejects(restarted.dispatchCashout(op,'one'));assert.equal(restarted.store.read().cashouts.one.state,'dispatching');});
test('corrupted storage fails closed; audit excludes bearer credentials',()=>{const f=fixture();f.ready();assert.ok(f.store.read().audit.length>0);assert.equal(JSON.stringify(f.store.read()).includes('Bearer'),false);fs.writeFileSync(f.store.filename,'broken');assert.throws(()=>f.service.status()&&f.store.read());});
test('HTTP auth, strict body, role checks and audit privacy',async()=>{const f=fixture();const token='a'.repeat(40),other='b'.repeat(40);const app=express();app.use('/infra',infrastructureRouter(f.service,[{...op,token},{...a('audit','auditor'),token:other}]));const srv=app.listen(0,'127.0.0.1');await new Promise(r=>srv.once('listening',r));const base=`http://127.0.0.1:${(srv.address() as any).port}/infra`;try{assert.equal((await fetch(base+'/status')).status,200);assert.equal((await fetch(base+'/cashouts',{method:'POST'})).status,401);assert.equal((await fetch(base+'/identities',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:'{}'})).status,422);assert.equal((await fetch(base+'/audit',{headers:{authorization:`Bearer ${token}`}})).status,403);assert.equal((await fetch(base+'/audit',{headers:{authorization:`Bearer ${other}`}})).status,200);}finally{await new Promise<void>(r=>srv.close(()=>r()));}});
test('duplicate identities, weak or duplicate credentials rejected',()=>{const f=fixture();assert.throws(()=>infrastructureRouter(f.service,[{...op,token:'short'}]));assert.throws(()=>infrastructureRouter(f.service,[{...op,token:'x'.repeat(40)},{...compliance,token:'x'.repeat(40)}]));});
test('reserved object keys cannot become subject, asset or idempotency identifiers',()=>{const f=fixture();for(const subject of ['__proto__','constructor','prototype']) assert.throws(()=>f.service.recordIdentity(compliance,{subject,country:'PT',outcome:'demo_pass',reference:'x'}));});
test('two concurrent dispatches reach the adapter at most once',async()=>{let calls=0;let done!:(v:{outcome:'simulated'})=>void;const f=fixture({mode:'test_only',submit:async()=>{calls++;return new Promise(r=>done=r);}});f.ready();f.service.requestCashout(op,f.request);f.service.approveCashout(compliance,'one');const first=f.service.dispatchCashout(op,'one');await assert.rejects(f.service.dispatchCashout(op,'one'),/manual/);done({outcome:'simulated'});await first;assert.equal(calls,1);});
test('control uses approval order, not proposal insertion order',()=>{const f=fixture();f.ready();const resume=f.policy('resume');const pause=f.policy('pause');f.service.approve(g2,pause.id);f.service.approve(g3,pause.id);assert.throws(()=>f.service.eligibility('alice','test_asset','testnet'));f.service.approve(g2,resume.id);f.service.approve(g3,resume.id);assert.equal(f.service.eligibility('alice','test_asset','testnet').allowedForSimulation,true);});
test('expired valuation blocks a previously approved cashout',async()=>{const f=fixture();f.ready();f.service.requestCashout(op,f.request);f.service.approveCashout(compliance,'one');f.setNow(1060001);await assert.rejects(f.service.dispatchCashout(op,'one'),/valuation/);assert.equal(f.store.read().cashouts.one.state,'approved');});
test('cashout never accepts floating point, zero, negative or unrecognised bank data',()=>{const f=fixture();f.ready();for(const amountMinor of ['0','-1','1.5','1e3',100])assert.throws(()=>f.service.requestCashout(op,{...f.request,amountMinor}));assert.throws(()=>f.service.requestCashout(op,{...f.request,iban:'PTFAKE'}));});
test('rights changes invalidate a previously approved cashout',async()=>{const f=fixture();f.ready();f.service.requestCashout(op,f.request);f.service.approveCashout(compliance,'one');const p=f.service.propose(g1,{kind:'pilot_policy',assetId:'test_asset',jurisdiction:'PT',rightsHash:'b'.repeat(64),economicModel:'equity',assetClass:'fixture_only'});f.service.approve(g2,p.id);f.service.approve(g3,p.id);await assert.rejects(f.service.dispatchCashout(op,'one'),/rights changed/);});
test('valuation evidence tampering and role confusion fail closed',()=>{const f=fixture();const signature=sign(null,Buffer.from(valuationPayload(f.v)),privateKey).toString('base64');assert.throws(()=>f.service.publishValuation(val,{...f.v,evidenceHash:'b'.repeat(64)},signature),/signature/);assert.throws(()=>f.service.publishValuation(op,f.v,signature),/valuation/);});
test('operator resolution unwedges dispatching and unknown cashouts with audit',async()=>{
  // Crash wedge: state stuck at dispatching rejects dispatch (existing behavior).
  const f=fixture();f.ready();f.service.requestCashout(op,f.request);f.service.approveCashout(compliance,'one');
  f.store.change(s=>{s.cashouts.one.state='dispatching';});
  // Role boundary: only operator resolves.
  for(const role of ['compliance','valuation','governor','auditor'] as const) assert.throws(()=>f.service.resolveCashout(a('x',role),'one',{outcome:'not_dispatched',reason:'adapter confirmed nothing sent'}),/operator/);
  // Reason is required and meaningful.
  assert.throws(()=>f.service.resolveCashout(op,'one',{outcome:'not_dispatched',reason:'short'}));
  // Confirmed payout requires a reference.
  assert.throws(()=>f.service.resolveCashout(op,'one',{outcome:'simulated',reason:'bank confirmed payout sent'}));
  // not_dispatched returns to approved; the same record can dispatch again.
  const before=f.store.read().audit.length;
  const resolved=f.service.resolveCashout(op,'one',{outcome:'not_dispatched',reason:'adapter confirmed nothing sent'});
  assert.equal(resolved.state,'approved');
  const audit=f.store.read().audit;
  assert.equal(audit.length,before+1);
  assert.equal(audit.at(-1).action,'cashout.resolved_not_dispatched');
  assert.equal(audit.at(-1).role,'operator');
  assert.equal((await f.service.dispatchCashout(op,'one')).state,'simulated');
  // Terminal state is never rewritten by resolution.
  assert.throws(()=>f.service.resolveCashout(op,'one',{outcome:'not_dispatched',reason:'adapter confirmed nothing sent'}),/never rewritten/);
});
test('operator resolution of unknown state records reference and stays simulation-only',async()=>{
  const f=fixture({mode:'test_only',submit:async()=>{throw Error('timeout');}});f.ready();f.service.requestCashout(op,f.request);f.service.approveCashout(compliance,'one');
  assert.equal((await f.service.dispatchCashout(op,'one')).state,'unknown');
  const r=f.service.resolveCashout(op,'one',{outcome:'simulated',reference:'bank:reconciled-1',reason:'bank statement confirms payout'});
  assert.equal(r.state,'simulated');assert.equal(r.reference,'bank:reconciled-1');assert.equal(r.simulationOnly,true);
  assert.equal(f.store.read().audit.at(-1).action,'cashout.resolved_simulated');
  assert.throws(()=>f.service.resolveCashout(op,'one',{outcome:'simulated',reference:'bank:x',reason:'bank statement confirms payout'}),/never rewritten/);
});
