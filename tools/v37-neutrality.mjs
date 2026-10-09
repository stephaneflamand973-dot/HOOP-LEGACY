import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as old from '../.qa-previous36/dist/engine.js';
// Historical V3.7 check only. V3.8 intentionally grows free chemistry for every club.
import * as current from '../.qa-previous37/dist/engine.js';
import * as oldSport from '../.qa-previous36/dist/sport-events.js';
import * as currentSport from '../.qa-previous37/dist/sport-events.js';
function step(s,engine,sport){
 if(sport.hasSportPause(s))sport.acknowledgeSport(s);
 else if(s.pending){if(s.pending.type==='contract'){const i=s.offers.findIndex(o=>o.league==='nba');engine.sign(s,i<0?0:i);}else engine.decide(s,s.pending.type==='draft-choice'?'draft':s.pending.type==='offseason'?'shoot':s.pending.choices[0][0]);}
 else engine.next(s,{interactive:false});
}
const reports=[];
for(const seed of [2026,973]){
 const a=old.createGame({...old.defaultBuild(),seed}),b=current.createGame({...current.defaultBuild(),seed});for(const s of [a,b]){s.life.delegated=true;s.life.policies={routine:'family',media:'team',agent:'local'};}
 let steps=0;
 while(a.season<=2&&steps++<4000){step(a,old,oldSport);step(b,current,currentSport);assert.equal(b.day,a.day);assert.equal(b.money,a.money);assert.deepEqual(b.rng,a.rng);assert.deepEqual(b.development,a.development);assert.deepEqual(current.hero(b).attrs,old.hero(a).attrs);}
 assert.equal(a.history.length,2);const normalized=structuredClone(b);delete normalized.environment;normalized.engine=a.engine;assert.deepEqual(normalized,a);reports.push({seed,seasons:2,steps,identical:true});console.log(JSON.stringify(reports.at(-1)));
}
fs.writeFileSync('tests/v37-neutrality.json',JSON.stringify({engine:'3.7.0',reference:'ce85a69df13a294be685555122ce4f2b5c09bf9e',reports},null,2));
