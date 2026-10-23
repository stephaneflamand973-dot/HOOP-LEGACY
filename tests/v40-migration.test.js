import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {createGame,defaultBuild,migrateLegacy,validate} from '../dist/engine.js';
import {save,load,parseSave} from '../dist/storage.js';

const make=()=>createGame({...defaultBuild(),path:'rookie'});
test('V4 migration preserves acquired state and is idempotent',()=>{
 const old=make();delete old.v40;const before=structuredClone(old),current=migrateLegacy(old);
 assert.equal(current.v40?.version,1);
 for(const key of ['players','money','simulation','archives','environment','representation','rng','match'])assert.deepEqual(current[key],before[key],key);
 assert.deepEqual(old,before);assert.deepEqual(migrateLegacy(current),current);
});
test('V4 rejects corrupt extension and future versions without mutating input',()=>{
 const s=make();assert.ok(s.v40);
 for(const mutate of [x=>x.v40.version=2,x=>x.v40.sinceDay=NaN,x=>x.v40.services.nextId=Infinity,x=>x.v40.roles.unknown={},x=>x.v40.moments.mode='invalid',x=>x.v40.services.active.unknown={}]){
  const bad=structuredClone(s);mutate(bad);const before=structuredClone(bad);assert.throws(()=>validate(bad));assert.deepEqual(bad,before);
 }
 const future=structuredClone(s);future.engine='9.0.0';assert.throws(()=>parseSave(JSON.stringify(future)));
});
test('V4 storage retains raw pre-migration backup and blocks legacy database writer',async()=>{
 const old=make();delete old.v40;await save(old,'v40-old');const s=await load('v40-old');assert.equal(s.v40?.version,1);
 const backup=await new Promise((resolve,reject)=>{const r=indexedDB.open('hoop-legacy-v1');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,q=db.transaction('slots').objectStore('slots').get('backup-before-3.9.0-v40-old');q.onsuccess=()=>{resolve(q.result);db.close()};};});
 assert.equal(backup.v40,undefined);assert.deepEqual(backup.players,old.players);
 await assert.rejects(new Promise((resolve,reject)=>{const r=indexedDB.open('hoop-legacy-v1',3);r.onerror=()=>reject(r.error);r.onsuccess=()=>{r.result.close();resolve()};}),{name:'VersionError'});
});
test('V4 concurrent clients cannot overwrite a more recent save',async()=>{
 const second=await import('../dist/storage.js?client=second');await save(make(),'v40-race');const a=await load('v40-race'),b=await second.load('v40-race');
 a.money=123;await save(a,'v40-race');b.money=999;await assert.rejects(second.save(b,'v40-race'),/autre onglet|récente/);
 assert.equal((await load('v40-race')).money,123);assert.equal(b.money,999);
 const refreshed=await second.load('v40-race');refreshed.money=124;await second.save(refreshed,'v40-race');assert.equal((await load('v40-race')).money,124);
});
test('V4 aborted transaction leaves the previous saved state readable',async()=>{
 await save(make(),'v40-abort');const s=await load('v40-abort');s.money=444;
 const original=IDBDatabase.prototype.transaction;let injected=false;
 IDBDatabase.prototype.transaction=function(...args){const tx=original.apply(this,args);if(args[1]==='readwrite'&&!injected){injected=true;queueMicrotask(()=>tx.abort());}return tx;};
 try{await assert.rejects(save(s,'v40-abort'));}finally{IDBDatabase.prototype.transaction=original;}
 assert.equal((await load('v40-abort')).money,0);assert.equal(s.money,444);
});
