import test from 'node:test';
import assert from 'node:assert/strict';
import {negotiationLimits,evaluateCounter,negotiationQuote,submitCounter} from '../dist/negotiation.js';
import {initRepresentation,validateRepresentation} from '../dist/representation-state.js';
const input={salary:100000,years:2,age:30,gap:6,budget:150000,payroll:0,mandate:'national'};
const initial={salary:100000,years:2};
const make=()=>{const s={day:2,team:'club',teams:[{id:'club'}],offers:[{id:'offer-1',team:'club',...initial}],pending:{type:'contract'},rng:{career:123}};const r=initRepresentation(s);r.nextId=2;r.session={id:1,day:2,mandate:'national',offers:[{offerId:'offer-1',initial:{...initial},current:{...initial},limits:negotiationLimits(input),attempts:0,revision:0,eligible:true}]};return s;};
test('négociation : plafond sportif, mandat et budget donnent un compromis explicable',()=>{
 const limits=negotiationLimits(input);assert.equal(limits.maxSalary,108000);
 const answer=evaluateCounter(initial,initial,limits,{raise:10,years:3});assert.equal(answer.salary,108000);assert.equal(answer.years,3);assert.equal(answer.outcome,'compromise');assert.equal(answer.reasons.length,4);
 const yes=evaluateCounter(initial,initial,limits,{raise:5,years:3});assert.equal(yes.salary,105000);assert.equal(yes.outcome,'accepted');
});
test('négociation : âge, concurrence et bornes de durée',()=>{
 for(const [change,requested,want] of [[{age:31},3,2],[{gap:-1},3,2],[{age:30,gap:0},3,3],[{years:1},1,1],[{years:4},4,4]]){
  const source={...input,...change},terms={salary:source.salary,years:source.years};const result=evaluateCounter(terms,terms,negotiationLimits(source),{raise:5,years:requested});assert.equal(result.years,want);
 }
 for(const years of [0,4,5,2.5])assert.throws(()=>evaluateCounter(initial,initial,negotiationLimits(input),{raise:5,years}),/Négociation/);
});
test('négociation : budget dépassé conserve exactement l’offre initiale et marges bornées',()=>{
 assert.equal(negotiationLimits({...input,budget:90000}).maxSalary,100000);
 assert.equal(negotiationLimits({...input,gap:-90,mandate:'self'}).maxSalary,100000);
 assert.equal(negotiationLimits({...input,gap:90,mandate:'international'}).maxSalary,115000);
 assert.equal(negotiationLimits({...input,salary:100001,budget:100003.75}).maxSalary,100003);
 const limits=negotiationLimits({...input,budget:0});assert.equal(evaluateCounter(initial,initial,limits,{raise:15,years:2}).outcome,'refused');
 for(const change of [{mandate:'constructor'},{salary:NaN},{budget:Infinity},{payroll:-1},{years:0}])assert.throws(()=>negotiationLimits({...input,...change}),/Négociation/);
});
test('négociation : devis pur, deux tentatives persistantes et double clic idempotent',()=>{
 const s=make(),before=JSON.stringify(s),q=negotiationQuote(s,'offer-1',{raise:10,years:3});assert.equal(JSON.stringify(s),before);assert.equal(q.response.salary,108000);
 assert.equal(submitCounter(s,q).ok,true);const once=JSON.stringify(s);assert.equal(submitCounter(s,q).ok,false);assert.equal(JSON.stringify(s),once);
 const loaded=JSON.parse(JSON.stringify(s)),q2=negotiationQuote(loaded,'offer-1',{raise:15,years:3});assert.equal(submitCounter(loaded,q2).ok,true);
 const e=loaded.representation.session.offers[0];assert.equal(e.attempts,2);assert.equal(e.current.salary,108000);assert.equal(loaded.representation.history.at(-1).outcome,'refused');assert.deepEqual(loaded.rng,{career:123});validateRepresentation(loaded);
 const twice=JSON.stringify(loaded);assert.equal(negotiationQuote(loaded,'offer-1',{raise:5,years:2}),null);assert.equal(submitCounter(loaded,q2).ok,false);assert.equal(JSON.stringify(loaded),twice);
});
test('négociation : demande inchangée, périmée, invalide ou bloquée ne consomme rien',()=>{
 const s=make(),before=JSON.stringify(s);assert.equal(negotiationQuote(s,'offer-1',{raise:0,years:2}),null);assert.equal(negotiationQuote(s,'offer-1',{raise:7,years:2}),null);assert.equal(JSON.stringify(s),before);
 const q=negotiationQuote(s,'offer-1',{raise:5,years:3});
 for(const mutate of [x=>x.retired=true,x=>x.match={},x=>x.pending=null,x=>x.representation.session.id=2,x=>x.representation.session.offers[0].eligible=false]){
  const bad=structuredClone(s);mutate(bad);const unchanged=JSON.stringify(bad);assert.equal(submitCounter(bad,q).ok,false);assert.equal(JSON.stringify(bad),unchanged);
 }
 const bad=structuredClone(q);bad.request.raise=15;assert.equal(submitCounter(s,bad).ok,false);assert.equal(JSON.stringify(s),before);
});
test('négociation : validation recalcule les contraintes et les termes atteignables',()=>{
 const s=make();validateRepresentation(s);
 for(const mutate of [e=>e.limits.maxSalary=200000,e=>e.current.salary=108000,e=>{e.current.salary=107000;e.attempts=1;e.revision=1;},e=>e.limits.mandate='international']){
  const bad=structuredClone(s);mutate(bad.representation.session.offers[0]);assert.throws(()=>validateRepresentation(bad),/Représentation/);
 }
});
