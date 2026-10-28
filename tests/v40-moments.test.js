import test from 'node:test';
import assert from 'node:assert/strict';
import {initV40} from '../dist/v40-state.js';
import {emitMoment,setMomentMode} from '../dist/career-moments.js';
import {sportingPause,acknowledgeSport,hasSportPause} from '../dist/sport-events.js';
const make=()=>{const s={day:30,season:1,league:'nba',simulation:{mode:'40',cursor:{targetSeason:2}},rng:{career:973},pending:null};initV40(s);return s;};
test('moment preferences preserve pending decisions, RNG and destination',()=>{
 for(const mode of ['highlights','decisions','summary']){const s=make(),simulation=structuredClone(s.simulation);setMomentMode(s,mode);s.pending={type:'contract'};
 assert.equal(emitMoment(s,{id:'title',kind:'playoffs',title:'Titre',text:'Champion'}),true);
 assert.equal(hasSportPause(s),mode==='highlights');assert.equal(s.pending.type,'contract');assert.deepEqual(s.simulation,simulation);assert.equal(s.rng.career,973);
 assert.equal(s.v40.moments.history.length,1);}
});
test('simultaneous results are grouped and deduplicated after reload',()=>{
 let s=make();sportingPause(s,'series-a','Série A','Victoire');sportingPause(s,'series-b','Série B','Défaite');assert.equal(s.sportEvents.notice.items.length,2);
 s=JSON.parse(JSON.stringify(s));acknowledgeSport(s);assert.equal(sportingPause(s,'series-a','Série A','Victoire'),false);assert.equal(hasSportPause(s),false);
});
test('history is bounded without reopening old events and mode changes clear only information',()=>{
 const s=make();setMomentMode(s,'summary');for(let i=0;i<90;i++)emitMoment(s,{id:'m'+i,title:'Record',text:'Résultat'});
 assert.equal(s.v40.moments.history.length,80);assert.equal(emitMoment(s,{id:'m0',title:'Record',text:'Résultat'}),false);
 setMomentMode(s,'highlights');emitMoment(s,{id:'new',title:'Suite',text:'Suite'});s.pending={type:'contract'};setMomentMode(s,'decisions');assert.equal(hasSportPause(s),false);assert.ok(s.pending);
 const before=structuredClone(s);assert.equal(setMomentMode(s,'bad'),false);assert.deepEqual(s,before);
 s.retired=true;assert.equal(emitMoment(s,{id:'after',title:'Après',text:'Après'}),false);
});
