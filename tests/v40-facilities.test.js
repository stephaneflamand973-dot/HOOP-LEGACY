import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,team,validate} from '../dist/engine.js';import {financeAction} from '../dist/finance.js';import {trainingDay} from '../dist/progression.js';import {hireCoach} from '../dist/environment.js';import {quoteService,buyService,serviceDay} from '../dist/services.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});s.money=400000;s.life.finance.start.cash=400000;financeAction(s,'property');s.auto=false;s.activity='individuel';s.trainingPlan.domain='Tir';hero(s).fatigue=0;return s;};
test('housing recovery is bounded and inactive before activation or away games',()=>{
 const s=make();assert.equal(quoteService(s,'proximity').price,7500);buyService(s,quoteService(s,'proximity'));buyService(s,quoteService(s,'recovery'));hero(s).fatigue=10;serviceDay(s);assert.equal(hero(s).fatigue,10);s.day=1;serviceDay(s);assert.equal(hero(s).fatigue,8.5);
 const g=s.competitions.find(c=>c.id==='euroleague').schedule[0];g.away=s.team;g.day=3;s.day=2;hero(s).fatigue=10;serviceDay(s);assert.equal(hero(s).fatigue,9);
 assert.equal(s.money,141600);assert.equal(s.money-s.life.finance.start.cash,s.life.finance.totals.cash);validate(s);
});
test('facilities grant XP only during actual offseason home sessions and cap coach stacking',()=>{
 for(const coach of [null,'confirmed','expert']){const s=make();const q=quoteService(s,'installation',{domain:'Tir'});assert.equal(q.price,20300);assert.equal(buyService(s,q).ok,true);if(coach)hireCoach(s,coach,'Tir');s.offseasonStarted=true;s.day=2;trainingDay(s,hero(s));const received=s.development.xp.Tir;assert.equal(received,coach?28:26);assert.ok(s.v40.services.active.installation.extraXP<=(coach==='expert'?0:3));const old=structuredClone(s);trainingDay(s,hero(s));assert.deepEqual(s,old);validate(s);}
 const s=make();buyService(s,quoteService(s,'installation',{domain:'Tir'}));s.day=2;trainingDay(s,hero(s));assert.equal(s.v40.services.active.installation.extraXP,0);
});
test('facilities survive a sale but require residence and prepaid maintenance to work',()=>{
 const s=make();buyService(s,quoteService(s,'installation',{domain:'Tir'}));buyService(s,quoteService(s,'proximity'));financeAction(s,'sell');assert.equal(s.life.property,null);assert.ok(s.v40.services.active.installation);s.offseasonStarted=true;for(const c of s.competitions)for(const g of c.schedule)g.day=0;s.day=2;trainingDay(s,hero(s));assert.equal(s.v40.services.active.installation.extraXP,0);
 financeAction(s,'property');s.day=32;hero(s).fatigue=0;serviceDay(s);trainingDay(s,hero(s));assert.equal(s.v40.services.active.installation.extraXP,0);assert.equal(s.life.property.proximity,undefined);
 s.money=5300;const q=quoteService(s,'maintenance');assert.equal(q.price,300);assert.equal(buyService(s,q).ok,true);assert.equal(s.money,5000);assert.equal(buyService(s,q).ok,false);s.day=34;hero(s).fatigue=0;trainingDay(s,hero(s));assert.ok(s.v40.services.active.installation.extraXP>0);
});
test('relocation postpones housing effects until the next day and injuries grant no facility XP',()=>{
 const s=make();buyService(s,quoteService(s,'proximity'));buyService(s,quoteService(s,'installation',{domain:'Tir'}));s.life.property.city='Ancienne ville';s.life.property.team=s.teams.find(t=>t.id!==s.team).id;s.day=1;financeAction(s,'move');hero(s).fatigue=10;serviceDay(s);assert.equal(hero(s).fatigue,10);s.day=2;serviceDay(s);assert.equal(hero(s).fatigue,9.5);hero(s).injury=5;s.offseasonStarted=true;trainingDay(s,hero(s));assert.equal(s.v40.services.active.installation.extraXP,0);
});
test('facility imports reject invented domains and unbounded benefits',()=>{
 const s=make();buyService(s,quoteService(s,'installation',{domain:'Tir'}));
 for(const change of [c=>c.domain='unknown',c=>c.extraXP=-1,c=>c.maintenancePaid=0,c=>c.end=9999]){const bad=structuredClone(s);change(bad.v40.services.active.installation);assert.throws(()=>validate(bad),/V4/);}
});
