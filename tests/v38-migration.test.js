import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,competition,validate,migrateLegacy} from '../dist/engine.js';
import {parseSave,save,load} from '../dist/storage.js';
import {hireCoach,setCoachRenewal} from '../dist/environment.js';
import {initCollective,duoFor} from '../dist/collective-state.js';
import {stageQuote,bookStage} from '../dist/collective.js';
import {startMatch,stepMatch} from '../dist/match.js';
import {startMatch as oldStart,stepMatch as oldStep} from '../dist/match-v35.js';
import {splitWorkerState,joinWorkerState} from '../dist/worker-state.js';
import {masteryPanel} from '../dist/v33-view.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});s.money=20000;return s;};
test('maîtrise : la nouvelle source possède un libellé lisible dès la création',()=>{const html=masteryPanel(make());assert.doesNotMatch(html,/undefined/);assert.match(html,/collective/i);});
test('V3.8 : migrations historiques neutres, coach V3.7 conservé et match ancien exact',()=>{
 for(const version of ['3.0.0','3.1.0','3.2.0','3.3.0','3.4.0','3.5.0','3.6.0','3.7.0']){
  const s=make();hireCoach(s,'local','Tir');setCoachRenewal(s,true);s.engine=version;delete s.environment.trainingProcessedDay;s.collective={injected:true};s.match=oldStart(s,competition(s).schedule[0]);oldStep(s,s.match,30);const old=structuredClone(s),m=parseSave(JSON.stringify(s));
  assert.equal(m.engine,'3.8.0');assert.equal(m.collective.stage,null);assert.equal(m.collective.routine,'none');assert.deepEqual(m.collective.duos,{});assert.equal(m.money,old.money);assert.deepEqual(m.rng,old.rng);assert.equal(m.system,old.system);assert.deepEqual(m.match,old.match);
  if(version==='3.7.0')assert.deepEqual(m.environment,{...old.environment,trainingProcessedDay:null});else assert.equal(m.environment.contract,null);
  assert.deepEqual(migrateLegacy(m),m);stepMatch(m,m.match,20000);oldStep(old,old.match,20000);assert.deepEqual(m.match,old.match);assert.deepEqual(m.rng,old.rng);
 }
});
test('V3.8 : état courant obligatoire et compteurs match hostiles refusés',()=>{
 const s=make();assert.equal(s.collective?.version,1);s.match=startMatch(s,competition(s).schedule[0]);stepMatch(s,s.match,15);validate(s);
 const key=Object.keys(s.match.collective.scores[s.match.home])[0];
 for(const change of [x=>delete x.collective,x=>x.collective.processedDay=x.day+1,x=>x.environment.trainingProcessedDay=x.day+1,x=>delete x.match.collective,x=>x.match.collective.scores[x.match.home][key]=101,x=>x.match.collective.minutes[x.match.home][key]=1e9,x=>x.match.collective.effects[x.match.home].shotSum=1e9,x=>x.match.collective.scores[x.match.home]['["hero","ghost"]']=80]){const bad=structuredClone(s);change(bad);assert.throws(()=>parseSave(JSON.stringify(bad)));}
});
test('V3.8 : worker et export conservent stage, duos, match et destination',()=>{
 const s=make();initCollective(s);const id=s.teams.find(t=>t.id===s.team).roster.find(id=>id!==s.hero);duoFor(s,s.team,s.hero,id,{create:true}).score=60;assert.equal(bookStage(s,stageQuote(s,'video')).ok,true);s.simulation.mode='40';s.match=startMatch(s,competition(s).schedule[0]);stepMatch(s,s.match,20);
 const {prefix,state}=splitWorkerState(s);assert.equal(JSON.stringify(joinWorkerState(structuredClone(state),prefix)),JSON.stringify(s));const copy=parseSave(JSON.stringify(s));assert.equal(JSON.stringify(copy),JSON.stringify(s));stepMatch(s,s.match,20000);stepMatch(copy,copy.match,20000);assert.deepEqual(copy,s);
});
test('V3.8 : IndexedDB garde le secours V3.7 avec coach payé',async()=>{
 await import('fake-indexeddb/auto');const s=make();hireCoach(s,'local','Tir');setCoachRenewal(s,true);s.engine='3.7.0';delete s.collective;delete s.environment.trainingProcessedDay;await save(s,'v38-old');const m=await load('v38-old');assert.equal(m.engine,'3.8.0');assert.equal(m.environment.contract.price,300);assert.equal(m.environment.renew,true);
 const backup=await new Promise((resolve,reject)=>{const r=indexedDB.open('hoop-legacy-v1');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const q=r.result.transaction('slots').objectStore('slots').get('backup-before-3.7.0-v38-old');q.onsuccess=()=>{resolve(q.result);r.result.close();};q.onerror=()=>reject(q.error);};});assert.equal(backup.engine,'3.7.0');assert.equal(backup.collective,undefined);assert.deepEqual(backup.environment,s.environment);
});
