import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,team,hero,next,sign} from '../dist/engine.js';
import {initCollective,duoFor,validateCollective} from '../dist/collective-state.js';
import {collectiveDay,stageQuote,bookStage,setCollectiveRoutine} from '../dist/collective.js';
import {trainingDay} from '../dist/progression.js';
import {retireCareer} from '../dist/commands.js';
import {refreshWorld} from '../dist/world.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});initCollective(s);s.money=20000;s.system=0;hero(s).fatigue=0;hero(s).injury=0;s.activity='individuel';for(const c of s.competitions)c.schedule=[];return s;};
const ids=s=>team(s).roster.filter(id=>id!==s.hero).slice(0,2);
test('préparation : programmes et stages donnent leurs gains amortis sans XP cachés',()=>{
 for(const paid of [false,true])for(const [mode,gain,fatigue] of [['video',paid?.4:.2,0],['tactical',paid?.7:.35,2],['partners',paid?.5:.25,2]]){
  const s=make(),p=mode==='partners'?ids(s):[];for(const id of p)duoFor(s,s.team,s.hero,id,{create:true}).score=50;
  if(paid)assert.equal(bookStage(s,stageQuote(s,mode,p)).ok,true);else setCollectiveRoutine(s,mode,p);
  s.day=2;const before=structuredClone(s);collectiveDay(s);
  assert.equal(hero(s).fatigue,fatigue);assert.deepEqual(s.development,before.development);assert.deepEqual(s.environment,before.environment);assert.deepEqual(s.rng,before.rng);
  if(mode==='partners'){for(const id of p)assert.equal(duoFor(s,s.team,s.hero,id).score,50+gain);assert.equal(s.system,0);}else {assert.equal(s.system,gain);assert.equal(s.mastery.sources.collective,gain);}
  if(paid)assert.equal(s.collective.stage.sessions,1);
 }
});
test('préparation : exclusions et répétition de journée sont sans gain supplémentaire',()=>{
 for(const reason of ['odd','injury','rest','fatigue','game','other-league']){
  let s=make();setCollectiveRoutine(s,'tactical');s.day=reason==='odd'?3:2;
  if(reason==='injury')hero(s).injury=1;if(reason==='rest')s.activity='repos';if(reason==='fatigue')hero(s).fatigue=66;if(['game','other-league'].includes(reason))s.competitions[reason==='game'?0:1].schedule.push({day:2,home:s.team,away:'other'});
  collectiveDay(s);assert.equal(s.system,0);const fatigue=hero(s).fatigue;s=JSON.parse(JSON.stringify(s));const before=structuredClone(s);collectiveDay(s);assert.deepEqual(s,before);assert.equal(hero(s).fatigue,fatigue);
 }
 const s=make();s.day=2;hero(s).fatigue=65;setCollectiveRoutine(s,'tactical');collectiveDay(s);assert.equal(s.system,.35);assert.equal(hero(s).fatigue,67);
});
test('préparation : partenaires absents et séance sautée ne deviennent pas une deuxième séance',()=>{
 const s=make(),p=ids(s);setCollectiveRoutine(s,'partners',p);for(const id of p)s.players.find(x=>x.id===id).injury=1;s.day=2;collectiveDay(s);assert.equal(hero(s).fatigue,0);for(const id of p)s.players.find(x=>x.id===id).injury=0;collectiveDay(s);assert.equal(duoFor(s,s.team,s.hero,p[0]),null);
 s.day=4;s.players.find(x=>x.id===p[0]).injury=1;collectiveDay(s);assert.equal(duoFor(s,s.team,s.hero,p[0]),null);assert.equal(duoFor(s,s.team,s.hero,p[1]).score,.5);assert.equal(hero(s).fatigue,2);
});
test('préparation : fin inclusive, routine mémorisée, transfert et retraite sans pause',()=>{
 const s=make();s.day=1;setCollectiveRoutine(s,'video');bookStage(s,stageQuote(s,'tactical'));collectiveDay(s);assert.equal(s.collective.stage.sessions,0);s.day=2;collectiveDay(s);assert.equal(s.system,.7);s.day=14;collectiveDay(s);assert.equal(s.collective.stage.sessions,2);s.day=16;collectiveDay(s);assert.equal(s.collective.stage,null);assert.equal(s.system,1.5999999999999999);assert.equal(s.collective.history.length,1);
 const a=make();bookStage(a,stageQuote(a,'video'));const simulation=structuredClone(a.simulation);a.team=a.teams.find(t=>t.id!==a.team).id;collectiveDay(a);assert.equal(a.collective.stage,null);assert.deepEqual(a.simulation,simulation);assert.equal(a.pending,null);
 const b=make();bookStage(b,stageQuote(b,'video'));assert.equal(retireCareer(b),true);assert.equal(b.collective.stage,null);
});
test('entraînement : récupération répétée ne crée pas de séance après sérialisation',()=>{
 let s=make();s.day=2;hero(s).fatigue=70;trainingDay(s,hero(s));assert.equal(hero(s).fatigue,63);assert.equal(s.environment.lastTrainingDay,null);s=JSON.parse(JSON.stringify(s));const before=structuredClone(s);trainingDay(s,hero(s));assert.deepEqual(s,before);
});
test('préparation : le moteur quotidien et le départ annuel réconcilient le collectif',()=>{
 const s=createGame({...defaultBuild(),path:'rookie'});initCollective(s);setCollectiveRoutine(s,'video');next(s,{interactive:false,untilDay:2});assert.equal(s.collective.processedDay,2);assert.ok(s.mastery.sources.collective>0);
 const a=make(),p=ids(a)[0];duoFor(a,a.team,a.hero,p,{create:true}).score=80;setCollectiveRoutine(a,'partners',[p]);a.players.find(q=>q.id===p).age=99;a.day=365;a.season=2;refreshWorld(a);assert.equal(duoFor(a,a.team,a.hero,p),null);assert.deepEqual(a.collective.partners,[]);assert.equal(a.collective.archived.length,1);validateCollective(a);
});
