import test from 'node:test';import assert from 'node:assert/strict';import 'fake-indexeddb/auto';
import {createGame,defaultBuild,hero,validate} from '../dist/engine.js';
import {applyRole,rotationPlan} from '../dist/role.js';
import {hireCoach,setCoachRenewal,environmentDay} from '../dist/environment.js';
import * as a from '../dist/storage.js?review-a';import * as b from '../dist/storage.js?review-b';
test('confirmed manual slot replacement uses listed revision and still rejects a concurrent replacement',async()=>{
 const s=createGame(defaultBuild());await a.save(s,'slot1');const meta=(await b.listSlots()).find(x=>x.key==='slot1');
 await b.save(s,'slot1',{expectedRevision:meta.revision});
 await assert.rejects(a.save(s,'slot1',{expectedRevision:meta.revision}),/autre onglet/);
});
test('role smoothing feeds the match rotation weight',()=>{const s=createGame(defaultBuild());s.minutes=6;applyRole(s);assert.equal(s.minutes,8);assert.equal(rotationPlan(s,s.team,48).find(r=>r.playerId===s.hero).score,8);});
test('malformed moment and training histories are rejected before rendering',()=>{
 for(const entry of [null,{}, {id:'x',title:42,text:'x',season:1,day:0}]){const s=createGame(defaultBuild());s.v40.moments.history=[entry];assert.throws(()=>validate(s),/V4/);}
 const s=createGame(defaultBuild());s.v40.training.history=[null];assert.throws(()=>validate(s),/V4/);
});
test('new coaching periods do not silently renew while injured or resting',()=>{
 for(const reason of ['injury','rest']){const s=createGame({...defaultBuild(),path:'rookie'});s.money=20000;hireCoach(s,'confirmed','Physique');setCoachRenewal(s,true);const money=s.money;s.day=31;if(reason==='injury')hero(s).injury=20;else s.activity='repos';environmentDay(s);assert.equal(s.money,money);assert.equal(s.environment.contract,null);}
});
