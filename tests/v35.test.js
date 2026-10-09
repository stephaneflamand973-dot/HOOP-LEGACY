import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,team,getPlayer,migrateLegacy,validate,sign,competition} from '../dist/engine.js';
import {initLife,lifeDay,resolveLife,lifeAction} from '../dist/life.js';
import {initFinance,financeDay,setFinance,investmentQuote,cents} from '../dist/finance.js';
import {initContext,observeLife,contextEvent,setPolicy,delegateChoice} from '../dist/life-context.js';
import {projectSnapshot,updateProject,executeTrade,developmentBonus} from '../dist/club-project.js';
import {refreshWorld,marketDay} from '../dist/world.js';
import {lifeView,clubProjectView} from '../dist/v35-view.js';
import {startMatch as oldStart,stepMatch as oldStep} from '../dist/match-v34.js';
import {stepMatch} from '../dist/match.js';
const make=()=>createGame({...defaultBuild(),path:'rookie'});
test('V3.4 → V3.5 : proches conservés, identité stable, RNG et match identiques',()=>{
 const s=make();s.engine='3.4.0';s.life.partner={name:'Morgan',since:10,bond:76};s.life.children=[{id:'child-old',name:'Léa',born:12}];s.life.delegated=true;for(const k of ['people','policies','finance','observed','stories','storySeen','preferences','delegationLog'])delete s.life[k];
 s.match=oldStart(s,competition(s).schedule[0]);oldStep(s,s.match,36);const old=structuredClone(s),m=migrateLegacy(s);assert.deepEqual(m.rng,old.rng);assert.equal(m.life.partner.name,'Morgan');assert.deepEqual(m.life.children,old.life.children);assert.equal(m.life.policies.routine,'family');assert.deepEqual(m.match,old.match);oldStep(old,old.match,10000);stepMatch(m,m.match,10000);assert.deepEqual(m.match,old.match);assert.deepEqual(m.rng,old.rng);assert.deepEqual(migrateLegacy(m),m);
});
test('histoires : transfert réel, décision majeure, suivi persistant et clôture unique',()=>{
 const s=make();s.life.partner={id:'partner',name:'Alex',since:0,bond:60};const dest=s.teams.find(t=>t.id!==s.team&&t.league==='nba');s.pending={type:'contract'};s.offers=[{team:dest.id,years:2,salary:1e6,role:'Titulaire',minutes:30}];sign(s,0);observeLife(s);assert.equal(s.life.stories.length,1);s.day+=3;const e=contextEvent(s);assert.equal(e.major,true);setPolicy(s,'routine','family');assert.equal(delegateChoice(s,e),null);s.pending=e;resolveLife(s,'family');assert.equal(s.life.stories[0].step,1);assert.equal(contextEvent(s),null);const m=structuredClone(s);m.day+=21;m.pending=contextEvent(m);resolveLife(m,'rest');observeLife(m);assert.equal(m.life.stories.length,1);assert.equal(m.life.stories[0].status,'closed');assert.equal(contextEvent(m),null);
});
test('délégation : saison sans pause de routine, grandes décisions et consignes conservées',()=>{
 const s=make();s.life.partner={name:'Camille',bond:70,since:0};s.life.children=[{id:'c1',born:0},{id:'c2',born:0},{id:'c3',born:0}];for(const [d,v] of [['routine','work'],['media','team'],['agent','local']])setPolicy(s,d,v);s.life.fame=60;
 for(let day=1;day<=365;day++){s.day=day;lifeDay(s);assert.equal(s.pending,null,`J${day}`);}assert.ok(s.life.delegationLog.length>=7);assert.deepEqual(structuredClone(s).life.policies,s.life.policies);
 s.life.children=[];hero(s).age=22;s.life.sequence=1;s.life.nextEvent=s.day;s.day++;lifeDay(s);assert.equal(s.pending.kind,'family');assert.equal(s.pending.major,true);const before=structuredClone(s.pending);initLife(s);assert.deepEqual(s.pending,before);resolveLife(s,'rest');assert.ok(s.life.preferences.familyAfter>s.day+300);
});
test('finances : règle exacte, réserve, absence de plafond et double action protégée',()=>{
 const s=make();s.money=2000000;delete s.life.finance;initFinance(s);assert.equal(investmentQuote(s),399000);assert.ok(lifeAction(s,'invest'));assert.equal(s.money,1601000);assert.equal(s.life.investments,399000);assert.ok(lifeAction(s,'property'));assert.equal(lifeAction(s,'property'),false);let worth=s.money+s.life.investments+s.life.property.value;assert.ok(lifeAction(s,'sell'));assert.equal(lifeAction(s,'sell'),false);assert.equal(s.money+s.life.investments,worth-12500);assert.equal(cents(s.life.finance.start.cash+s.life.finance.totals.cash),s.money);assert.equal(cents(s.life.finance.start.investments+s.life.finance.totals.investments),s.life.investments);assert.equal(s.life.finance.start.property+s.life.finance.totals.property,0);
});
test('relevé : salaire mi-mois, patrimoine séparé et échéance automatique idempotente',()=>{
 const s=make();s.money=100000;delete s.life.finance;initFinance(s);setFinance(s,'automatic',true);for(let day=1;day<=30;day++){s.day=day;hero(s).contract.salary=day<=15?36500:73000;financeDay(s);}assert.equal(s.life.ledger.filter(e=>e.label==='Salaire net et sponsors').reduce((n,e)=>n+e.cash,0),3420);assert.equal(s.life.delegationLog.length,1);const old=structuredClone(s);financeDay(s);assert.deepEqual(s,old);assert.equal(cents(s.life.finance.start.cash+s.life.finance.totals.cash),s.money);assert.equal(cents(s.life.finance.totals.investments),s.life.investments);
 const a=make(),b=make();a.life.property={value:250000,city:'Paris'};b.life.property={value:250000,city:'Paris'};b.life.investments=1000;a.day=b.day=365;financeDay(a);financeDay(b);assert.equal(a.life.property.value,b.life.property.value);assert.equal(a.life.property.value,253750);
});
test('contrats : déficit budgétaire sans réduction rétroactive et effectifs complets',()=>{
 const s=make(),t=team(s),p=getPlayer(s,t.roster.find(id=>id!==s.hero));p.age=25;p.contract={years:3,salary:999999999,guarantee:1,option:'Aucune'};t.budget=1000;refreshWorld(s);const after=getPlayer(s,p.id);assert.equal(after.contract.salary,999999999);assert.equal(after.contract.years,2);assert.ok(t.project.overBudget>0);for(const club of s.teams)assert.ok(club.roster.length>=10);validate(s);
});
test('club du héros : échange admissible, identité et contrats conservés, motif visible',()=>{
 const s=make(),a=team(s),b=s.teams.find(t=>t.id!==a.id&&t.league===a.league);a.budget=b.budget=1e12;const pa=a.roster.map(id=>getPlayer(s,id)).filter(p=>p.id!==s.hero),pb=b.roster.map(id=>getPlayer(s,id));pa.forEach(p=>p.pos='MJ');pb.forEach(p=>p.pos='P');const p=pa[0],q=pb[0];p.age=q.age=24;p.contract.years=q.contract.years=2;p.injury=q.injury=0;for(const k in p.attrs)q.attrs[k]=p.attrs[k];updateProject(s,a);updateProject(s,b);const pc=structuredClone(p.contract),qc=structuredClone(q.contract);assert.ok(executeTrade(s,a,b,p,q));assert.ok(a.roster.includes(q.id));assert.ok(b.roster.includes(p.id));assert.deepEqual(p.contract,pc);assert.deepEqual(q.contract,qc);assert.ok(s.log.some(e=>e.title==='Mouvement de votre club'));assert.equal(executeTrade(s,a,b,p,q),false);assert.equal(executeTrade(s,a,b,hero(s),q),false);
});
test('projets : besoins déterministes, développement modéré et vues sans mutation',()=>{
 const s=make(),t=team(s);assert.deepEqual(projectSnapshot(s,t),projectSnapshot(s,t));assert.equal(developmentBonus({strategy:'Reconstruction'},{age:20}),3);assert.equal(developmentBonus({strategy:'Titre'},{age:20}),0);const old=structuredClone(s);assert.match(lifeView(s),/consignes durables/);assert.match(clubProjectView(s),/PROJET DU CLUB/);assert.deepEqual(s,old);
});
test('import : une consigne financière ou personnelle invalide est refusée',()=>{
 const s=make();s.life.finance.percent=NaN;assert.throws(()=>validate(s),/financi/);s.life.finance.percent=20;s.life.policies.routine='invalid';assert.throws(()=>validate(s),/personnel/);
});
test('sauvegarde V3.4 : copie de secours créée avant remplacement automatique',async()=>{
 await import('fake-indexeddb/auto');const {save,load}=await import('../dist/storage.js');const s=make();s.engine='3.4.0';delete s.life.finance;delete s.life.policies;await save(s,'v35-upgrade-test');const upgraded=await load('v35-upgrade-test');assert.equal(upgraded.engine,'3.8.0');const backup=await new Promise((resolve,reject)=>{const r=indexedDB.open('hoop-legacy-v1');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const q=r.result.transaction('slots').objectStore('slots').get('backup-before-3.4.0-v35-upgrade-test');q.onsuccess=()=>{resolve(q.result);r.result.close();};q.onerror=()=>reject(q.error);};});assert.equal(backup.engine,'3.4.0');assert.equal(backup.money,s.money);
});
test('ancienne carrière financée : le relevé part du solde importé',()=>{
 const s=make();s.schema=2;s.money=123456;const m=migrateLegacy(s);assert.equal(m.life.finance.start.cash,123456);m.day++;financeDay(m);assert.equal(cents(m.life.finance.start.cash+m.life.finance.totals.cash),m.money);
});
test('blessure de quatorze jours et transfert sans couple : histoires contextuelles présentes',async()=>{
 const s=make();hero(s).injury=14;const {next}=await import('../dist/engine.js');next(s);assert.ok(s.life.stories.some(x=>x.kind==='injury'));
 const moved=make(),dest=moved.teams.find(t=>t.id!==moved.team&&t.league==='nba');moved.pending={type:'contract'};moved.offers=[{team:dest.id,years:2,salary:1e6,role:'Titulaire',minutes:30}];sign(moved,0);observeLife(moved);assert.ok(moved.life.stories.some(x=>x.kind==='move'));
});
test('joueur libéré sous contrat : une nouvelle affectation conserve le salaire garanti',()=>{
 const s=make(),t=team(s),p=getPlayer(s,t.roster.find(id=>id!==s.hero));t.roster=t.roster.filter(id=>id!==p.id);s.freeAgents.push(p.id);p.age=25;delete p.lastLeague;for(const k in p.attrs)p.attrs[k]=99;p.contract={salary:9876543,years:3,guarantee:1,option:'Aucune'};refreshWorld(s);assert.ok(s.teams.some(t=>t.roster.includes(p.id)));assert.equal(p.contract.salary,9876543);assert.equal(p.contract.years,2);
});
