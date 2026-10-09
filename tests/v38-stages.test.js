import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,team,hero} from '../dist/engine.js';
import {initCollective,duoFor,validateCollective} from '../dist/collective-state.js';
import {stageQuote,bookStage,closeStage,setCollectiveRoutine,syncCollective} from '../dist/collective.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});initCollective(s);s.money=10000;s.system=50;hero(s).injury=0;for(const c of s.competitions)c.schedule=[];return s;};
const partners=s=>team(s).roster.filter(id=>id!==s.hero).slice(0,2);
test('stages : retour au club après clôture anticipée permet un nouveau stage valide',()=>{
 const s=make(),original=team(s),other=s.teams.find(t=>t.id!==s.team);
 assert.equal(bookStage(s,stageQuote(s,'video')).ok,true);s.day=1;
 original.roster=original.roster.filter(id=>id!==s.hero);other.roster.push(s.hero);s.team=other.id;syncCollective(s);
 other.roster=other.roster.filter(id=>id!==s.hero);original.roster.push(s.hero);s.team=original.id;syncCollective(s);
 assert.equal(s.collective.history[0].closed,1);assert.equal(bookStage(s,stageQuote(s,'video')).ok,true);
 assert.doesNotThrow(()=>validateCollective(s));
 const invalid=structuredClone(s);invalid.collective.history[0].closed=3;invalid.day=3;
 assert.throws(()=>validateCollective(invalid),/Collectif/);
});
test('stages : devis pur et paiement unique couvrant les dates annoncées',()=>{
 for(const [offer,price,end] of [['video',600,7],['tactical',2000,14],['partners',3500,14]]){
  const s=make(),p=offer==='partners'?partners(s):[],old=structuredClone(s),q=stageQuote(s,offer,p);assert.equal(q.ok,true);assert.deepEqual(s,old);assert.equal(q.start,1);assert.equal(q.end,end);assert.equal(q.price,price);assert.equal(q.slots.length,offer==='video'?3:7);
  assert.equal(bookStage(s,q).ok,true);assert.equal(s.money,10000-price);assert.equal(s.collective.totals.paid,price);assert.equal(s.life.finance.totals.cash,old.life.finance.totals.cash-price);assert.deepEqual(s.rng,old.rng);assert.equal(s.day,old.day);
  const paid=structuredClone(s);assert.equal(bookStage(s,q).ok,false);assert.deepEqual(s,paid);
 }
});
test('stages : réserve exacte et devis changé demandent une nouvelle confirmation',()=>{
 for(const cash of [5600,5599.99]){const s=make();s.money=cash;const result=bookStage(s,stageQuote(s,'video'));assert.equal(result.ok,cash===5600);assert.equal(s.money,cash===5600?5000:cash);}
 for(const mutate of [s=>s.money++,s=>s.competitions[1].schedule.push({day:2,home:s.team,away:s.teams.find(t=>t.id!==s.team).id}),s=>team(s).roster.splice(team(s).roster.indexOf(partners(s)[0]),1),s=>s.players.find(p=>p.id===partners(s)[0]).injury=5,s=>duoFor(s,s.team,s.hero,partners(s)[0],{create:true}).score=10]){
  const s=make(),q=stageQuote(s,'partners',partners(s));mutate(s);const old=structuredClone(s),r=bookStage(s,q);assert.equal(r.ok,false);assert.ok(r.quote);assert.deepEqual(s,old);
 }
});
test('stages : garde disponibilité, plafonds, calendrier et sélection',()=>{
 for(const mode of ['injury','full','calendar','match','pending','retired','busy','unknown','partners']){
  const s=make();if(mode==='injury')hero(s).injury=1;if(mode==='full')s.system=100;if(mode==='calendar')for(let day=2;day<=7;day+=2)s.competitions[0].schedule.push({day,home:s.team,away:'other'});if(['match','pending','retired'].includes(mode))s[mode]=true;
  const q=stageQuote(s,mode==='unknown'?'__proto__':mode==='partners'?'partners':'video',mode==='partners'?[s.hero]:[]),old=structuredClone(s);assert.equal(bookStage(s,q,{busy:mode==='busy'}).ok,false);assert.deepEqual(s,old);
 }
 const s=make(),p=partners(s);for(const id of p)duoFor(s,s.team,s.hero,id,{create:true}).score=100;assert.equal(stageQuote(s,'partners',p).ok,false);
 for(const ids of [[p[0],p[0]],[...p,'missing'],[s.hero],['missing']])assert.equal(setCollectiveRoutine(s,'partners',ids),false);
 assert.equal(setCollectiveRoutine(s,'partners',p),true);assert.deepEqual(s.collective.partners,p);s.pending=true;assert.equal(setCollectiveRoutine(s,'video'),false);
});
test('stages : clôture sans remboursement, historique et imports cohérents',()=>{
 const s=make();assert.equal(bookStage(s,stageQuote(s,'video')).ok,true);validateCollective(s);
 for(const mutate of [x=>x.collective.stage.price=1,x=>x.collective.stage.end=50,x=>x.collective.stage.catalogVersion=2,x=>x.collective.totals.paid=0,x=>x.collective.stage.sessions=10,x=>x.collective.stage.team='missing',x=>x.day=20]){const b=structuredClone(s);mutate(b);assert.throws(()=>validateCollective(b),/Collectif/);}
 s.day=8;closeStage(s,'Période terminée');assert.equal(s.money,9400);assert.equal(s.collective.stage,null);assert.equal(s.collective.history.length,1);assert.equal(s.collective.totals.paid,600);validateCollective(s);
 const before=structuredClone(s);closeStage(s,'encore');assert.deepEqual(s,before);
});
