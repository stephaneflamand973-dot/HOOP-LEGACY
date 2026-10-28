import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {createGame,defaultBuild} from '../dist/engine.js';
import * as first from '../dist/storage.js?v40-client-a';
import * as second from '../dist/storage.js?v40-client-b';
test('another tab cannot overwrite a career loaded before a newer save',async()=>{
 const s=createGame(defaultBuild());await first.save(s,'v40-tabs');
 const a=await first.load('v40-tabs'),b=await second.load('v40-tabs');
 a.money=123;await first.save(a,'v40-tabs');
 b.money=456;await assert.rejects(second.save(b,'v40-tabs'),/autre onglet/);
 assert.equal((await first.load('v40-tabs')).money,123);
 const refreshed=await second.load('v40-tabs');refreshed.money=789;await second.save(refreshed,'v40-tabs');
 assert.equal((await first.load('v40-tabs')).money,789);
});
test('V3.9 migration preserves an original backup and destination',async()=>{
 const old=createGame(defaultBuild());delete old.v40;old.engine='3.9.0';
 old.simulation={mode:'40',cursor:{mode:'40',fromDay:old.day,fromSeason:old.season,targetSeason:old.season+1}};
 await first.save(old,'v40-old');
 const migrated=await first.load('v40-old');assert.equal(migrated.v40.version,1);
 assert.deepEqual(migrated.simulation,old.simulation);
 const raw=await new Promise((resolve,reject)=>{
  const r=indexedDB.open('hoop-legacy-v1');
  r.onsuccess=()=>{const db=r.result,q=db.transaction('slots').objectStore('slots').get('backup-before-3.9.0-v40-old');
   q.onsuccess=()=>{db.close();resolve(q.result);};q.onerror=()=>{db.close();reject(q.error);};};
  r.onerror=()=>reject(r.error);
 });
 assert.equal(raw.v40,undefined);assert.deepEqual(raw.simulation,old.simulation);
});
test('old database clients cannot open an obsolete schema',async()=>{
 await first.save(createGame(defaultBuild()),'v40-db');
 await assert.rejects(new Promise((resolve,reject)=>{
  const r=indexedDB.open('hoop-legacy-v1',3);
  r.onsuccess=()=>{r.result.close();resolve();};r.onerror=()=>reject(r.error);
 }),{name:'VersionError'});
});
