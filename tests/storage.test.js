import test from 'node:test';import assert from 'node:assert/strict';import 'fake-indexeddb/auto';
import {createGame,defaultBuild} from '../dist/engine.js';import {save,load,parseSave} from '../dist/storage.js';
test('IndexedDB : archives séparées, restauration, secours et écriture atomique',async()=>{let s=createGame(defaultBuild());s.archives=[{season:1,competitions:[],players:[]}];await save(s);let restored=await load();assert.deepEqual(restored,s);s.money=120;await save(s);assert.equal((await load('rollback')).money,0);assert.equal((await load()).money,120);assert.deepEqual(parseSave(JSON.stringify(await load())),s);});

import {v3Fixture} from './fixtures/v3-compatible.js';

test('migration IndexedDB V3 : secours versionné et lecture idempotente',async()=>{
 let old=v3Fixture().save;await save(old,'v3-slot');let current=await load('v3-slot');assert.equal(current.engine,'3.5.0');assert.deepEqual(current.rng,old.rng);let count=current.journal.length;
 current=await load('v3-slot');assert.equal(current.journal.length,count);
 const raw=await new Promise((resolve,reject)=>{let r=indexedDB.open('hoop-legacy-v1');r.onsuccess=()=>{let q=r.result.transaction('slots').objectStore('slots').get('backup-before-3.0.0-v3-slot');q.onsuccess=()=>{resolve(q.result);r.result.close()};q.onerror=()=>reject(q.error)}});
 assert.equal(raw.engine,'3.0.0');assert.deepEqual(raw.match,old.match);assert.deepEqual(raw.development.xp,old.development.xp);
});
