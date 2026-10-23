import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero} from '../dist/engine.js';import * as dev from '../dist/progression.js';import {hireCoach,environmentDay} from '../dist/environment.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});s.auto=false;s.trainingPlan.domain='Tir';s.trainingPlan.intensity='normal';s.activity='individuel';hero(s).fatigue=0;return s;};
test('V4 progressive XP costs make elite skills more expensive without deleting acquired XP',()=>{
 const s=make(),p=hero(s);p.age=20;for(const [note,cost] of [[75,65],[90,147],[95,476]]){p.attrs.three=note;assert.equal(dev.costFor(p,'three'),cost);}
 p.attrs.three=99;s.development.xp.Tir=10000;assert.equal(dev.spendXP(s,p,'three'),false);assert.equal(s.development.xp.Tir,10000);assert.equal(p.attrs.three,99);
});
test('V4 focused training grants real gains and records an idempotent source breakdown',()=>{
 const s=make();s.day=2;dev.trainingDay(s,hero(s));assert.equal(s.development.xp.Tir,23);assert.equal(s.development.xp.Création,5);assert.equal(s.v40.training.history.length,1);
 const row=s.v40.training.history[0];assert.equal(row.amounts.Tir,23);assert.equal(row.coachXP,0);const before=structuredClone(s);dev.trainingDay(s,hero(s));assert.deepEqual(s,before);
});
test('V4 honors prepaid V3 coaching through the inclusive last day',()=>{
 const s=make();s.money=20000;hireCoach(s,'local','Tir');s.environment.contract.catalogVersion=1;s.day=30;environmentDay(s);dev.trainingDay(s,hero(s));
 assert.equal(s.development.xp.Tir,26);assert.equal(s.development.xp.Création,10);assert.equal(s.environment.contract.extraXP,3);assert.equal(s.v40.training.history.at(-1).legacyAssiette,true);
 s.day=31;environmentDay(s);s.day=32;hero(s).fatigue=0;const before=s.development.xp.Création;dev.trainingDay(s,hero(s));assert.equal(s.development.xp.Création-before,5);
});
test('V4 profiles explain specialization without mutating attributes or RNG',()=>{
 const s=make(),p=hero(s);for(const k in p.attrs)p.attrs[k]=60;p.attrs.pass=95;p.attrs.handle=95;p.attrs.ballSpeed=95;const before=structuredClone(s);
 assert.equal(dev.developmentProfile(p).label,'Créateur');assert.deepEqual(s,before);for(const k in p.attrs)p.attrs[k]=70;assert.equal(dev.developmentProfile(p).label,'Polyvalent');
});
test('V4 aging differentiates explosive, physical and technical decline',()=>{
 const s=make(),p=hero(s);p.age=35;for(const k in p.attrs)p.attrs[k]=80;const changes=dev.ageAttributes(p,{care:1,random:()=>.5});
 assert.equal(changes.speed,-1);assert.equal(p.attrs.three,80);assert.ok(Math.abs(p.aging.speed-(-.2))<1e-8);assert.ok(Math.abs(p.aging.strength-(-.42))<1e-8);assert.ok(p.attrs.speed<p.attrs.three);
});
