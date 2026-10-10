import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,team,requestTrade,marketOffers,sign,decide,enterDraft,openContractNegotiations} from '../dist/engine.js';
import {setMandate,prepareSignature} from '../dist/representation.js';
import {validateRepresentation} from '../dist/representation-state.js';
import {negotiationQuote,submitCounter} from '../dist/negotiation.js';
import {orderedOffers,PREFERENCES} from '../dist/career-plan.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});hero(s).contract.years=1;return s;};
test('contrats : mandat futur sans frais, session figée et signature négociée',()=>{
 const s=make(),rng=structuredClone(s.rng),cash=s.money;assert.equal(setMandate(s,'national').ok,true);assert.deepEqual(s.rng,rng);assert.equal(s.money,cash);assert.equal(s.offers.length,0);
 marketOffers(s);assert.equal(s.representation.session,null);assert.equal(requestTrade(s),true);const session=s.representation.session;assert.equal(session.mandate,'national');assert.equal(setMandate(s,'self').ok,false);
 const o=s.offers[0],e=session.offers[0],q=negotiationQuote(s,o.id,{raise:15,years:o.years});assert.ok(q);assert.equal(submitCounter(s,q).ok,true);
 assert.equal(sign(s,0,{offerId:o.id,source:'current',revision:e.revision}),true);assert.equal(hero(s).contract.salary,q.response.salary);assert.equal(s.representation.contract.rate,.02);assert.equal(s.money,cash);assert.equal(s.representation.session,null);validateRepresentation(s);
 assert.equal(sign(s,0),false);assert.equal(setMandate(s,'self').ok,true);assert.equal(s.representation.contract.rate,.02);
});
test('contrats : devis de signature périmé, club absent ou index incohérent refusé avant mutation',()=>{
 const s=make();setMandate(s,'local');requestTrade(s);const id=s.offers[0].id;
 for(const opts of [{offerId:id,source:'current',revision:9},{offerId:'missing',source:'initial',revision:0},{offerId:id,source:'raw',revision:0}]){const before=JSON.stringify(s);assert.equal(sign(s,0,opts),false);assert.equal(JSON.stringify(s),before);}
 const bad=structuredClone(s);bad.offers[0].team='missing';const before=JSON.stringify(bad);assert.equal(sign(bad,0),false);assert.equal(JSON.stringify(bad),before);
 const prepared=prepareSignature(s,{offerId:id,source:'initial',revision:0});assert.equal(prepared.ok,true);assert.equal(prepared.terms.salary,s.offers[0].salary);
});
test('contrats : refus laisse l’offre initiale disponible et clôture respecte le délai du marché',()=>{
 const s=make();setMandate(s,'international');requestTrade(s);const o=s.offers[0];const initial=o.salary;
 submitCounter(s,negotiationQuote(s,o.id,{raise:15,years:o.years}));assert.equal(sign(s,0),true);assert.equal(hero(s).contract.salary,initial);assert.equal(s.representation.contract.rate,.03);
 const b=make();setMandate(b,'self');requestTrade(b);assert.equal(decide(b,'decline'),true);assert.equal(b.representation.session,null);assert.equal(requestTrade(b),false);assert.equal(b.lastMarketDay,0);
});
test('contrats : renouvellement dans le même club et offre universitaire exempte',()=>{
 for(const academic of [false,true]){
  const s=make();setMandate(s,'international');s.offers=[{id:'offer-test',team:s.team,league:s.league,salary:academic?0:100000,years:2,academic,role:'Rotation',minutes:20,guarantee:1,option:'Aucune'}];s.pending={type:'contract'};openContractNegotiations(s);
  const origin=s.team,roster=[...team(s).roster];assert.equal(s.representation.session.offers[0].eligible,!academic);assert.equal(sign(s,0),true);assert.equal(s.team,origin);assert.deepEqual(team(s).roster,roster);assert.equal(s.representation.contract.rate,academic?0:.03);validateRepresentation(s);
 }
});
test('contrats : passage à la draft sans commission sur aucune offre de cette session',()=>{
 const s=createGame({...defaultBuild(),path:'prospect'});setMandate(s,'international');s.career.stage='college';s.career.collegeYears=1;s.career.draftEntered=false;hero(s).age=20;s.lastSeasonScouting={score:90,projection:'Premier tour'};
 assert.equal(enterDraft(s),true);assert.ok(s.representation.session.offers.every(o=>!o.eligible));assert.equal(sign(s,0),true);assert.equal(s.representation.contract.rate,0);validateRepresentation(s);
});
test('contrats : autogestion conserve les projections, priorité stabilité départage par net total',()=>{
 const s=make();setMandate(s,'national');requestTrade(s);const first=s.offers[0];s.offers=[{...first,id:'a',years:2,salary:200000},{...first,id:'b',years:3,salary:100000},{...first,id:'c',years:3,salary:100000}];openContractNegotiations(s);assert.equal(PREFERENCES.stability,'Stabilité');
 s.careerPlan.preference='stability';assert.deepEqual(orderedOffers(s).map(x=>x.o.id),['b','c','a']);s.careerPlan.preference='salary';assert.equal(orderedOffers(s)[0].o.id,'a');assert.ok(orderedOffers(s).every(x=>x.o.minutes===first.minutes));
});
test('contrats : choix de mandat interdit en match ou après retraite sans mutation',()=>{
 for(const key of ['match','retired']){const s=make();s[key]=key==='match'?{}:true;const before=JSON.stringify(s);assert.equal(setMandate(s,'local').ok,false);assert.equal(JSON.stringify(s),before);}
});
