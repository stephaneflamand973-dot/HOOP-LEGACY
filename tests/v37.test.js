import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,next,team,migrateLegacy,validate,competition} from '../dist/engine.js';
import {startMatch,stepMatch} from '../dist/match.js';
import {parseSave} from '../dist/storage.js';
import {GROUPS} from '../dist/config.js';
import {trainingDay} from '../dist/progression.js';
import {financeDay} from '../dist/finance.js';
import {retireCareer} from '../dist/commands.js';
import * as env from '../dist/environment.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});env.initEnvironment(s);s.money=10000;s.life.finance.reserve=5000;return s;};

test('coach : devis pur, débit unique, période future et bilan financier',()=>{
 for(const [offer,price,rate] of [['local',300,.1],['confirmed',1200,.15],['expert',4000,.2]]){
  const s=make(),old=structuredClone(s),q=env.coachQuote(s,offer,'Tir');
  assert.deepEqual(s,old);assert.equal(q.price,price);assert.equal(q.rate,rate);assert.equal(q.ok,true);
  assert.equal(env.hireCoach(s,offer,'Tir'),true);assert.equal(s.money,10000-price);assert.equal(s.life.finance.totals.cash,old.life.finance.totals.cash-price);
  assert.equal(s.environment.contract.start,1);assert.equal(s.environment.contract.end,30);assert.equal(s.environment.renew,false);assert.equal(s.environment.totals.paid,price);
  assert.match(s.life.ledger[0].label,/#1/);const paid=structuredClone(s);assert.equal(env.hireCoach(s,offer,'Tir'),false);assert.deepEqual(s,paid);assert.deepEqual(s.rng,old.rng);assert.equal(s.day,0);
 }
});
test('coach : réserve exacte et devis périmé ne contournent pas les fonds',()=>{
 const s=make();s.money=5300;assert.equal(env.hireCoach(s,'local','Tir'),true);assert.equal(s.money,5000);
 const a=make();assert.ok(env.coachQuote(a,'local','Tir').ok);a.money=5299.99;const old=structuredClone(a);assert.equal(env.coachQuote(a,'local','Tir').ok,false);assert.equal(env.hireCoach(a,'local','Tir'),false);assert.deepEqual(a,old);
});
test('coach : invalides et blocages refusés sans mutation',()=>{
 for(const flag of ['match','pending','retired','busy','cap','offer','domain']){
  const s=make();if(['match','pending','retired'].includes(flag))s[flag]=true;if(flag==='cap')for(const k of GROUPS.Tir)hero(s).attrs[k]=99;
  const offer=flag==='offer'?'__proto__':'local',domain=flag==='domain'?'constructor':'Tir',old=structuredClone(s);
  assert.equal(env.hireCoach(s,offer,domain,{busy:flag==='busy'}),false);assert.deepEqual(s,old);
 }
});
test('coach : renouvellement volontaire booléen et protégée',()=>{
 const s=make(),old=structuredClone(s);assert.equal(env.setCoachRenewal(s,true),false);assert.deepEqual(s,old);env.hireCoach(s,'local','Tir');
 assert.equal(env.setCoachRenewal(s,true),true);assert.equal(s.environment.renew,true);assert.equal(env.setCoachRenewal(s,false),true);assert.equal(s.environment.renew,false);
 for(const value of ['false',1,null]){const before=structuredClone(s);assert.equal(env.setCoachRenewal(s,value),false);assert.deepEqual(s,before);}
 for(const flag of ['match','pending','retired','busy']){const a=structuredClone(s);if(flag!=='busy')a[flag]=true;const before=structuredClone(a);assert.equal(env.setCoachRenewal(a,true,{busy:flag==='busy'}),false);assert.deepEqual(a,before);}
});
test('coach : échéance inclusive et renouvellement unique après sérialisation',()=>{
 let s=make();env.hireCoach(s,'local','Tir');env.setCoachRenewal(s,true);const simulation=structuredClone(s.simulation);
 s.day=30;env.environmentDay(s);assert.equal(s.environment.contract.id,1);assert.equal(s.money,9700);
 s.day=31;env.environmentDay(s);assert.equal(s.environment.contract.id,2);assert.equal(s.environment.contract.start,31);assert.equal(s.environment.contract.end,60);assert.equal(s.money,9400);assert.equal(s.environment.history.length,1);
 s=JSON.parse(JSON.stringify(s));const old=structuredClone(s);env.environmentDay(s);assert.deepEqual(s,old);assert.deepEqual(s.simulation,simulation);assert.equal(s.pending,null);
});
test('coach : renouvellement avant revenus et placements, sans retry après refus',()=>{
 const s=make();env.hireCoach(s,'local','Tir');env.setCoachRenewal(s,true);s.money=5299;s.day=31;env.environmentDay(s);assert.equal(s.environment.contract,null);assert.equal(s.environment.renew,false);assert.equal(s.money,5299);financeDay(s);assert.ok(s.money>5300);s.day++;env.environmentDay(s);assert.equal(s.environment.contract,null);assert.equal(s.environment.totals.paid,300);
 const a=make();env.hireCoach(a,'local','Tir');env.setCoachRenewal(a,true);a.money=6000;a.day=31;a.life.finance.automatic=true;a.life.finance.percent=20;const b=structuredClone(a);b.money=5700;financeDay(b);env.environmentDay(a);financeDay(a);assert.equal(a.money,b.money);assert.equal(a.life.investments,b.life.investments);
});
test('coach : résiliation, plafond et blessure sans prolongation, transfert portable',()=>{
 for(const mode of ['cancel','cap','injury','transfer']){const s=make();env.hireCoach(s,'local','Tir');env.setCoachRenewal(s,true);if(mode==='cancel')env.setCoachRenewal(s,false);if(mode==='cap')for(const k of GROUPS.Tir)hero(s).attrs[k]=99;if(mode==='injury')hero(s).injury=40;if(mode==='transfer')s.team=s.teams.find(t=>t.id!==s.team).id;s.day=30;env.environmentDay(s);assert.equal(s.environment.contract.end,30);s.day=31;env.environmentDay(s);assert.equal(!!s.environment.contract,['injury','transfer'].includes(mode));assert.equal(s.environment.totals.paid,['injury','transfer'].includes(mode)?600:300);}
});
test('coach : matrice domaines, intensités et activités, XP réels sans effets cachés',()=>{
 for(const domain of Object.keys(GROUPS))for(const [intensity,factor] of [['light',.7],['normal',1],['hard',1.25]])for(const activity of ['individuel','video','etudes','famille']){
  const s=make();s.auto=false;s.trainingPlan={mode:'manual',domain,intensity};s.activity=activity;s.life.children=[];s.life.sponsors=[];hero(s).fatigue=0;hero(s).injury=0;const a=structuredClone(s);env.hireCoach(s,'expert',domain);s.day=a.day=2;
  trainingDay(s,hero(s));trainingDay(a,hero(a));let raw=29*factor*.8;if(activity==='video'&&['Création','Défense'].includes(domain))raw+=9;if(['etudes','famille'].includes(activity))raw*=.8;const extra=Math.round(raw*1.2)-Math.round(raw);
  for(const d of Object.keys(GROUPS))assert.equal(s.development.earned[d]-a.development.earned[d],d===domain?extra:0);
  assert.equal(s.environment.contract.extraXP,extra);assert.equal(s.environment.contract.sessions,1);assert.equal(s.environment.totals.extraXP,extra);assert.equal(hero(s).fatigue,hero(a).fatigue);assert.equal(s.system,a.system);assert.deepEqual(s.rng,a.rng);
 }
});
test('coach : journées inéligibles sans supplément et séance entière idempotente',()=>{
 for(const mode of ['injury','rest','fatigue','odd','other','cap','not-started']){const s=make();s.day=0;s.trainingPlan.domain='Tir';env.hireCoach(s,'local','Tir');s.day=2;if(mode==='injury')hero(s).injury=1;if(mode==='rest')s.activity='repos';if(mode==='fatigue')hero(s).fatigue=66;if(mode==='odd')s.day=3;if(mode==='other')s.trainingPlan.domain='Rebond';if(mode==='cap')for(const k of GROUPS.Tir)hero(s).attrs[k]=99;if(mode==='not-started')s.day=0;trainingDay(s,hero(s));assert.equal(s.environment.totals.extraXP,0);assert.equal(s.environment.totals.sessions,0);}
 let s=make();s.trainingPlan.domain='Tir';env.hireCoach(s,'local','Tir');s.day=2;hero(s).fatigue=0;trainingDay(s,hero(s));assert.equal(s.environment.contract.sessions,1);s=JSON.parse(JSON.stringify(s));const old=structuredClone(s);trainingDay(s,hero(s));assert.deepEqual(s,old);
});
test('coach : historique borné, cumuls conservés, retraite immédiate',()=>{
 const s=make();s.money=100000;env.hireCoach(s,'local','Tir');env.setCoachRenewal(s,true);for(let i=1;i<=30;i++){s.day=i*30+1;env.environmentDay(s);}assert.equal(s.environment.history.length,24);assert.equal(s.environment.totals.paid,9300);assert.equal(retireCareer(s),true);assert.equal(s.environment.contract,null);assert.equal(s.environment.renew,false);const old=structuredClone(s);env.closeEnvironment(s,'Retraite');assert.deepEqual(s,old);
 const a=make();env.hireCoach(a,'local','Tir');env.setCoachRenewal(a,true);a.day=365;hero(a).age=46;a.pending=null;for(const c of a.competitions){c.phase='Terminée';c.champion=Object.keys(c.records)[0];for(const g of c.schedule)g.result={score:[100,90],winner:g.home};}next(a,{interactive:false});assert.equal(a.retired,true);assert.equal(a.environment.contract,null);
});
test('environnement : nouvelle carrière initialisée et import courant incomplet refusé',()=>{
 const s=createGame({...defaultBuild(),path:'rookie'});assert.equal(s.environment?.version,1);assert.equal(s.environment.contract,null);assert.equal(s.environment.totals.paid,0);delete s.environment;assert.throws(()=>validate(s),/Environnement/);
});
test('migration 3.0–3.6 : aucun coach payé, match et RNG intacts, idempotence',()=>{
 for(const version of ['3.0.0','3.1.0','3.2.0','3.3.0','3.4.0','3.5.0','3.6.0']){
  const s=make();s.engine=version;delete s.environment;s.match=startMatch(s,competition(s).schedule[0]);stepMatch(s,s.match,36);const old=structuredClone(s),m=migrateLegacy(s);
  assert.equal(m.engine,'3.7.0');assert.equal(m.environment.contract,null);assert.equal(m.environment.renew,false);assert.equal(m.environment.totals.paid,0);assert.equal(m.money,old.money);assert.deepEqual(m.rng,old.rng);assert.deepEqual(m.match,old.match);assert.deepEqual(hero(m).attrs,hero(old).attrs);assert.deepEqual(migrateLegacy(m),m);stepMatch(m,m.match,10000);stepMatch(old,old.match,10000);assert.deepEqual(m.match,old.match);assert.deepEqual(m.rng,old.rng);
 }
});
test('environnement : import hostile rejeté sans remplacer la partie',()=>{
 const changes=[s=>s.environment.totals.paid=NaN,s=>s.environment.totals.paid=-1,s=>s.environment.contract.offerId='__proto__',s=>s.environment.contract.price=1,s=>s.environment.contract.rate=99,s=>s.environment.contract.domain='constructor',s=>s.environment.contract.start=.5,s=>s.environment.contract.end=90,s=>s.environment.contract.sessions=16,s=>s.environment.history=[{...s.environment.contract,closed:s.day,reason:'test'}],s=>s.environment.history=Array(25).fill({...s.environment.contract,closed:s.day,reason:'test'}),s=>s.environment.totals.paid=0,s=>s.environment.nextId=1,s=>s.environment.lastTrainingDay=s.day+1,s=>s.environment.renew='false'];
 for(const change of changes){const s=make();env.hireCoach(s,'local','Tir');const old=structuredClone(s),bad=structuredClone(s);change(bad);assert.throws(()=>validate(bad),/Environnement/);assert.throws(()=>parseSave(JSON.stringify(bad)),/Environnement/);assert.deepEqual(s,old);}
 const s=make();env.hireCoach(s,'local','Tir');assert.deepEqual(parseSave(JSON.stringify(s)),s);
});
test('migration IndexedDB V3.6 : sauvegarde de secours avant remplacement',async()=>{
 await import('fake-indexeddb/auto');const {save,load}=await import('../dist/storage.js');const s=make();s.engine='3.6.0';delete s.environment;
 await save(s,'v37-upgrade');const m=await load('v37-upgrade');assert.equal(m.engine,'3.7.0');assert.equal(m.environment.contract,null);assert.equal(m.money,s.money);
 const backup=await new Promise((resolve,reject)=>{const r=indexedDB.open('hoop-legacy-v1');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const q=r.result.transaction('slots').objectStore('slots').get('backup-before-3.6.0-v37-upgrade');q.onsuccess=()=>{resolve(q.result);r.result.close();};q.onerror=()=>reject(q.error);};});assert.equal(backup.engine,'3.6.0');assert.equal(backup.environment,undefined);assert.deepEqual(backup.rng,s.rng);
});
test('environnement : imports aux gains ou périodes impossibles refusés',()=>{
 const makeContract=()=>{const s=make();env.hireCoach(s,'local','Tir');return s;};
 for(const mutate of [
  s=>{s.day=2;hero(s).fatigue=0;trainingDay(s,hero(s));s.environment.contract.extraXP=s.environment.totals.extraXP=1e9;},
  s=>{s.day=2;hero(s).fatigue=0;trainingDay(s,hero(s));s.development.sources.training=0;},
  s=>{const e=s.environment;e.history=[{...e.contract,closed:0,reason:'Période terminée'}];e.contract={...e.contract,id:2};e.nextId=3;e.totals.paid=600;},
  s=>{s.day=50;s.environment.processedDay=50;}
 ]){const s=makeContract();mutate(s);assert.throws(()=>parseSave(JSON.stringify(s)),/Environnement/);}
});
test('migration : les champs environnement injectés dans une ancienne version sont ignorés',()=>{
 for(const version of ['3.0.0','3.1.0','3.2.0','3.3.0','3.4.0','3.5.0','3.6.0']){
  const s=make();env.hireCoach(s,'local','Tir');env.setCoachRenewal(s,true);s.engine=version;
  const m=parseSave(JSON.stringify(s));assert.equal(m.environment.contract,null);assert.equal(m.environment.renew,false);assert.deepEqual(m.environment.totals,{paid:0,sessions:0,extraXP:0});assert.equal(m.money,s.money);
 }
});
