import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,validate} from '../dist/engine.js';import {hireCoach} from '../dist/environment.js';import {retireCareer} from '../dist/commands.js';
import {quoteService,buyService,serviceDay,setServiceRenewal} from '../dist/services.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});s.money=20000;s.life.finance.reserve=5000;return s;};
test('services protect reserve and charge a confirmed quote only once',()=>{
 const s=make();s.money=5899;const before=structuredClone(s),q=quoteService(s,'recovery');assert.equal(q.price,900);assert.equal(q.ok,false);assert.deepEqual(s,before);
 s.money=5900;const ready=quoteService(s,'recovery');assert.equal(buyService(s,ready).ok,true);assert.equal(s.money,5000);assert.equal(s.v40.services.active.recovery.start,1);assert.equal(s.v40.services.active.recovery.end,30);assert.equal(s.v40.services.active.recovery.renew,false);
 assert.equal(buyService(s,ready).ok,false);assert.equal(s.money,5000);assert.equal(s.life.finance.totals.cash,-900);validate(s);
});
test('services reject stale or tampered quotes without mutation',()=>{
 for(const alter of [(s,q)=>s.day++,(s,q)=>s.money++,(s,q)=>s.team=s.teams.find(t=>t.id!==s.team).id,(s,q)=>q.price=1,(s,q)=>s.life.finance.reserve=25000,(s,q)=>q.kind='__proto__']){
  const s=make(),q=quoteService(s,'recovery');alter(s,q);const before=structuredClone(s);assert.equal(buyService(s,q).ok,false);assert.deepEqual(s,before);
 }
 for(const key of ['match','pending','retired']){const s=make(),q=quoteService(s,'recovery');s[key]=true;const before=structuredClone(s);assert.equal(buyService(s,q).ok,false);assert.deepEqual(s,before);}
});
test('physical preparation shares the existing coaching slot',()=>{
 const s=make();assert.equal(buyService(s,quoteService(s,'physical')).ok,true);assert.equal(s.money,18800);assert.equal(s.environment.contract.domain,'Physique');assert.equal(s.environment.contract.rate,.15);
 const a=make();hireCoach(a,'local','Tir');const before=structuredClone(a);assert.equal(buyService(a,quoteService(a,'physical')).ok,false);assert.deepEqual(a,before);
});
test('recovery records actual benefits once, respects injury, inclusive end and retirement',()=>{
 const s=make();buyService(s,quoteService(s,'recovery'));hero(s).fatigue=.5;s.day=1;serviceDay(s);assert.equal(hero(s).fatigue,0);assert.equal(s.v40.services.totals.recovery,.5);const once=structuredClone(s);serviceDay(s);assert.deepEqual(s,once);
 s.day=2;hero(s).injury=10;hero(s).fatigue=20;serviceDay(s);assert.equal(hero(s).fatigue,20);assert.equal(hero(s).injury,10);
 s.day=30;hero(s).injury=0;s.activity='repos';serviceDay(s);assert.equal(hero(s).fatigue,19);assert.ok(s.v40.services.active.recovery);
 s.day=31;serviceDay(s);assert.equal(s.v40.services.active.recovery,undefined);assert.equal(s.v40.services.history.length,1);
 const a=make();buyService(a,quoteService(a,'recovery'));retireCareer(a);assert.equal(a.v40.services.active.recovery,undefined);assert.equal(a.v40.services.history.length,1);
});
test('recovery renewal stops on insufficient funds and never retries later',()=>{
 const s=make();buyService(s,quoteService(s,'recovery'));assert.equal(setServiceRenewal(s,'recovery',true),true);s.money=5000;s.day=31;serviceDay(s);assert.equal(s.v40.services.active.recovery,undefined);s.money=20000;s.day=32;serviceDay(s);assert.equal(s.money,20000);
 const a=make();buyService(a,quoteService(a,'recovery'));setServiceRenewal(a,'recovery',true);a.day=31;serviceDay(a);assert.equal(a.money,18200);assert.equal(a.v40.services.active.recovery.start,31);const paid=a.money;serviceDay(a);assert.equal(a.money,paid);validate(a);
});
test('service imports reject impossible paid periods and effects',()=>{
 const s=make();buyService(s,quoteService(s,'recovery'));
 for(const change of [c=>c.price=-1,c=>c.end+=100,c=>c.effect=100,c=>c.renew='true',c=>c.id=999]){const bad=structuredClone(s);change(bad.v40.services.active.recovery);assert.throws(()=>validate(bad),/V4/);}
});
