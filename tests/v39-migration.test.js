import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,competition,requestTrade,sign,migrateLegacy,validate} from '../dist/engine.js';
import {parseSave,save,load} from '../dist/storage.js';
import {stepMatch} from '../dist/match.js';
import {startMatch} from '../dist/match-v38.js';
import {hireCoach} from '../dist/environment.js';
import {stageQuote,bookStage} from '../dist/collective.js';
import {setMandate} from '../dist/representation.js';
const make=()=>createGame({...defaultBuild(),path:'rookie'});
test('V3.9 : signature historique rejette les termes invalides avant tout transfert',()=>{
 const s=make();hero(s).contract.years=1;requestTrade(s);s.representation.session=null;
 for(const change of [o=>o.salary=-1,o=>o.years=0,o=>o.minutes=NaN]){const bad=structuredClone(s);change(bad.offers[0]);const before=JSON.stringify(bad);assert.equal(sign(bad,0),false);assert.equal(JSON.stringify(bad),before);}
});
test('V3.9 : création gratuite et contrôle obligatoire des données natives',()=>{
 const s=make();assert.equal(s.engine,'3.9.0');assert.equal(s.representation.mandate,'self');assert.equal(s.representation.contract,null);
 for(const mutate of [x=>delete x.representation,x=>x.representation=null,x=>x.representation.mandate='invalid',x=>x.representation.totals.commission=Infinity]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>parseSave(JSON.stringify(bad)),/Représentation/);}
});
test('V3.9 : migration V3.8 conserve les services payés, le match et ses règles',()=>{
 const s=make();s.money=20000;hireCoach(s,'local','Tir');bookStage(s,stageQuote(s,'video'));s.match=startMatch(s,competition(s).schedule[0]);stepMatch(s,s.match,25);s.engine='3.8.0';delete s.representation;const old=structuredClone(s);
 const migrated=parseSave(JSON.stringify(s));assert.equal(migrated.engine,'3.9.0');assert.equal(migrated.representation.mandate,'self');
 for(const key of ['money','environment','collective','match','rng','simulation'])assert.deepEqual(migrated[key],old[key]);assert.equal(migrated.match.rulesVersion,'3.8.0');assert.deepEqual(migrateLegacy(migrated),migrated);
 stepMatch(s,s.match,20000);stepMatch(migrated,migrated.match,20000);assert.deepEqual(migrated.match,s.match);assert.deepEqual(migrated.rng,s.rng);
});
test('V3.9 : neuf versions anciennes restent signables sans facturation rétroactive',()=>{
 for(const version of ['3.0.0','3.1.0','3.2.0','3.3.0','3.4.0','3.5.0','3.6.0','3.7.0','3.8.0']){
  const s=make();hero(s).contract.years=1;setMandate(s,'international');requestTrade(s);const offers=structuredClone(s.offers);s.engine=version;delete s.representation;const cash=s.money,contract=structuredClone(hero(s).contract);
  const migrated=parseSave(JSON.stringify(s));assert.deepEqual(migrated.offers,offers);assert.deepEqual(hero(migrated).contract,contract);assert.equal(migrated.money,cash);assert.equal(migrated.representation.totals.commission,0);assert.equal(sign(migrated,0),true);assert.equal(migrated.representation.contract?.rate||0,0);validate(migrated);
 }
});
test('V3.9 : IndexedDB conserve le secours V3.8 intact',async()=>{
 await import('fake-indexeddb/auto');const s=make();s.engine='3.8.0';delete s.representation;await save(s,'v39-old');const migrated=await load('v39-old');assert.equal(migrated.engine,'3.9.0');
 const backup=await new Promise((resolve,reject)=>{const r=indexedDB.open('hoop-legacy-v1');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,q=db.transaction('slots').objectStore('slots').get('backup-before-3.8.0-v39-old');q.onsuccess=()=>{resolve(q.result);db.close();};q.onerror=()=>reject(q.error);};});assert.equal(backup.engine,'3.8.0');assert.equal(backup.representation,undefined);
});
