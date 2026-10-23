import test from 'node:test';import assert from 'node:assert/strict';import {createGame,defaultBuild,hero,validate} from '../dist/engine.js';import {retireCareer} from '../dist/commands.js';import {trainingDay} from '../dist/progression.js';import {quoteService,buyService} from '../dist/services.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});s.money=10000;s.auto=false;s.activity='etudes';return s;};
test('reconversion replaces thirty training sessions with sixty study hours',()=>{
 const s=make();assert.equal(buyService(s,quoteService(s,'formation',{domain:'coaching'})).ok,true);assert.equal(s.money,7000);
 for(let i=1;i<=29;i++){s.day=i*2;hero(s).fatigue=0;trainingDay(s,hero(s));}assert.equal(s.v40.services.active.formation.sessions,29);assert.equal(s.v40.services.qualifications?.length||0,0);assert.equal(s.development.sources.training,0);
 const before=structuredClone(s);trainingDay(s,hero(s));assert.deepEqual(s,before);s.day=60;trainingDay(s,hero(s));assert.equal(s.v40.services.qualifications[0].hours,60);assert.equal(s.v40.services.qualifications[0].domain,'coaching');assert.equal(s.v40.services.active.formation,undefined);assert.equal(s.money,7000);validate(s);
 assert.equal(quoteService(s,'formation',{domain:'coaching'}).ok,false);
});
test('reconversion allows training instead and preserves study progress through relocation',()=>{
 const s=make();buyService(s,quoteService(s,'formation',{domain:'video'}));s.day=2;trainingDay(s,hero(s));s.activity='individuel';s.day=4;trainingDay(s,hero(s));assert.equal(s.v40.services.active.formation.sessions,1);assert.ok(s.development.sources.training>0);
 s.team=s.teams.find(t=>t.id!==s.team).id;s.activity='etudes';s.day=6;hero(s).fatigue=0;trainingDay(s,hero(s));assert.equal(s.v40.services.active.formation.sessions,2);hero(s).injury=3;s.day=8;trainingDay(s,hero(s));assert.equal(s.v40.services.active.formation.sessions,2);
});
test('reconversion closes unfinished at retirement and rejects invalid purchases',()=>{
 const s=make();assert.equal(quoteService(s,'formation',{domain:'unknown'}).ok,false);s.money=7999;assert.equal(quoteService(s,'formation',{domain:'physical'}).ok,false);s.money=8000;assert.equal(buyService(s,quoteService(s,'formation',{domain:'physical'})).ok,true);s.day=2;trainingDay(s,hero(s));retireCareer(s);const c=s.v40.services.history.at(-1);assert.equal(c.sessions,1);assert.equal(c.qualified,false);assert.equal(s.v40.services.active.formation,undefined);
});
