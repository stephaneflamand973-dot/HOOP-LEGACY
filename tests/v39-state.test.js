import test from 'node:test';
import assert from 'node:assert/strict';
import {MANDATES} from '../dist/representation-catalog.js';
import {initRepresentation,validateRepresentation,appendNegotiation} from '../dist/representation-state.js';

const make=()=>{const s={day:50,team:'club',teams:[{id:'club'}],offers:[],pending:null};initRepresentation(s);return s;};
const entry=i=>({kind:'signed',day:i,sessionId:1,offerId:'offer-1',team:'club',mandate:'local',salary:100000,years:2,commission:0,outcome:'Signé'});
test('représentation : démarrage neutre et initialisation non destructive',()=>{
 const s=make(),r=s.representation;assert.equal(r.mandate,'self');assert.equal(r.totals.commission,0);assert.equal(r.session,null);assert.equal(r.contract,null);
 r.mandate='national';r.totals.commission=12.25;assert.equal(initRepresentation(s),r);assert.equal(r.mandate,'national');assert.equal(r.totals.commission,12.25);validateRepresentation(s);
});
test('représentation : historique limité à 40 sans perdre les cumuls ni conserver une référence mutable',()=>{
 const s=make();s.representation.nextId=2;s.representation.totals.commission=45.32;
 for(let i=1;i<=41;i++)appendNegotiation(s,entry(i));
 assert.equal(s.representation.history.length,40);assert.equal(s.representation.history[0].day,2);assert.equal(s.representation.totals.commission,45.32);
 const last=entry(42);appendNegotiation(s,last);last.salary=999;assert.equal(s.representation.history.at(-1).salary,100000);validateRepresentation(s);
});
test('représentation : données natives invalides rejetées sans réparation',()=>{
 for(const mutate of [r=>r.mandate='constructor',r=>r.nextId=0,r=>r.totals.commission=NaN,r=>r.totals.commission=-1,r=>r.history=[null],r=>r.history=Array(41).fill(entry(1)),r=>r.session={id:1},r=>r.version=2]){
  const s=make();mutate(s.representation);assert.throws(()=>validateRepresentation(s),/Représentation/);
 }
 const s=make();s.representation=null;assert.throws(()=>validateRepresentation(s),/Représentation/);initRepresentation(s);assert.equal(s.representation,null);
});
test('représentation : taux du contrat lié au mandat, sans dépendance à un ancien effectif',()=>{
 for(const [mandate,rate] of [['self',0],['local',.01],['national',.02],['international',.03]]){
  const s=make();s.representation.nextId=2;s.representation.contract={id:1,offerId:'offer-1',team:'club',mandate,rate,started:0,commission:0};
  validateRepresentation(s);assert.equal(MANDATES[mandate].rate,rate);
  s.representation.contract.rate=.04;assert.throws(()=>validateRepresentation(s),/Représentation/);
 }
});
test('représentation : dates futures et termes historiques mal formés refusés',()=>{
 for(const mutate of [e=>e.day=51,e=>e.salary=Infinity,e=>e.years=5,e=>e.commission=-1,e=>e.outcome=null,e=>e.team='unknown']){
  const s=make();s.representation.nextId=2;const e=entry(1);mutate(e);s.representation.history=[e];assert.throws(()=>validateRepresentation(s),/Représentation/);
 }
});
test('représentation : sessions liées aux offres réelles, révisions et limites de tentatives',()=>{
 const s=make();s.pending={type:'contract'};s.offers=[{id:'offer-1',team:'club',salary:100000,years:2}];s.representation.nextId=2;
 s.representation.session={id:1,day:20,mandate:'self',offers:[{offerId:'offer-1',initial:{salary:100000,years:2},current:{salary:100000,years:2},limits:{},eligible:false,attempts:0,revision:0}]};
 validateRepresentation(s);
 for(const mutate of [x=>x.pending=null,x=>x.representation.session.day=51,x=>x.representation.session.offers[0].attempts=3,x=>x.representation.session.offers[0].revision=1,x=>x.representation.session.offers[0].offerId='missing',x=>x.representation.session.offers[0].current.salary=105000]){
  const bad=structuredClone(s);mutate(bad);assert.throws(()=>validateRepresentation(bad),/Représentation/);
 }
});
