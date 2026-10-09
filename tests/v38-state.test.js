import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,defaultBuild,team} from '../dist/engine.js';
import {initCollective,pairKey,duoFor,reconcileCollective,validateCollective} from '../dist/collective-state.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});initCollective(s);return s;};
test('collectif : duos symétriques, clubs séparés, sans argent ni RNG cachés',()=>{
 const s=make(),before=structuredClone(s),t=team(s),b=t.roster.find(x=>x!==s.hero);
 assert.equal(s.collective.routine,'none');assert.equal(duoFor(s,t.id,s.hero,b),null);
 const d=duoFor(s,t.id,s.hero,b,{create:true});assert.equal(d.score,0);d.score=80;
 assert.equal(duoFor(s,t.id,b,s.hero).score,80);assert.equal(duoFor(s,s.teams.find(x=>x.id!==t.id).id,s.hero,b),null);
 assert.equal(s.money,before.money);assert.deepEqual(s.rng,before.rng);assert.equal(s.day,before.day);
 assert.equal(pairKey('a','b'),pairKey('b','a'));assert.notEqual(pairKey('a,b','c'),pairKey('a','b,c'));
 for(const id of ['__proto__','constructor','missing',s.hero])assert.equal(duoFor(s,t.id,s.hero,id,{create:true}),null);
});
test('collectif : départ et retour restaurent une archive une seule fois dans son club',()=>{
 const s=make(),t=team(s),b=t.roster.find(x=>x!==s.hero);const d=duoFor(s,t.id,s.hero,b,{create:true});d.score=80;s.collective.partners=[b];
 t.roster=t.roster.filter(x=>x!==b);reconcileCollective(s);assert.equal(s.collective.archived.length,1);assert.deepEqual(s.collective.partners,[]);assert.equal(duoFor(s,t.id,s.hero,b),null);
 t.roster.push(b);reconcileCollective(s);assert.equal(duoFor(s,t.id,s.hero,b).score,60);assert.equal(s.collective.archived.length,0);reconcileCollective(s);assert.equal(duoFor(s,t.id,s.hero,b).score,60);
 t.roster=t.roster.filter(x=>x!==b);reconcileCollective(s);t.roster.push(b);reconcileCollective(s);assert.equal(duoFor(s,t.id,s.hero,b).score,45);
 t.roster=t.roster.filter(x=>![s.hero,b].includes(x));const other=s.teams.find(x=>x.id!==t.id);other.roster.push(s.hero,b);s.team=other.id;reconcileCollective(s);assert.equal(duoFor(s,other.id,s.hero,b,{create:true}).score,0);
});
test('collectif : archives du héros bornées et aucun ancien duo IA conservé',()=>{
 const s=make(),t=team(s),ids=t.roster.filter(x=>x!==s.hero);duoFor(s,t.id,ids[0],ids[1],{create:true}).score=80;t.roster=t.roster.filter(x=>x!==ids[0]);reconcileCollective(s);assert.equal(s.collective.archived.length,0);
 const b=ids[1];for(let i=0;i<51;i++){const id='temp'+i;s.players.push({...s.players.find(p=>p.id===b),id});t.roster.push(id);duoFor(s,t.id,s.hero,id,{create:true}).score=50;t.roster=t.roster.filter(x=>x!==id);s.day=i;reconcileCollective(s);}
 assert.equal(s.collective.archived.length,50);assert.equal(s.collective.archived.some(x=>x.ids.includes('temp0')),false);validateCollective(s);
});
test('collectif : imports incohérents rejetés',()=>{
 const s=make(),t=team(s),b=t.roster.find(x=>x!==s.hero);duoFor(s,t.id,s.hero,b,{create:true});validateCollective(s);
 for(const change of [x=>delete x.collective,x=>x.collective.processedDay=1,x=>x.collective.partners=['missing'],x=>x.collective.archived=Array(51).fill({}),x=>x.collective.duos[t.id][pairKey(s.hero,b)].score=NaN,x=>x.collective.duos[t.id][pairKey(s.hero,b)].score=101,x=>x.collective.duos[t.id][pairKey(s.hero,b)].score=-1,x=>x.collective.duos[t.id][pairKey(s.hero,b)].minutes=Infinity,x=>x.collective.duos[t.id][pairKey(s.hero,b)].sources.match=-1,x=>x.collective.duos[t.id].bad=x.collective.duos[t.id][pairKey(s.hero,b)],x=>x.collective.partners=[b,b]]){const a=structuredClone(s);change(a);assert.throws(()=>validateCollective(a),/Collectif/);}
});
