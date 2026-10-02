import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {createGame,defaultBuild,hero,team,competition,startMatch,stepMatch,next,continueMatch,learn,equip,upgrade,sign,decide,enterDraft,requestTrade,validate} from '../dist/engine.js';
import {BADGES,TECHNIQUES,KEYS} from '../dist/config.js';
import {rawBonus} from '../dist/match.js';
import {finishKind,shotBoost,freeChance,reboundWeight,stealChance} from '../dist/match-effects.js';
import {masteryMatch,masteryTraining,transferMastery,playerReading} from '../dist/system.js';
import {beginAdvance,setAdvanceMode,destinationReached,settleAdvance} from '../dist/simulation.js';
import {sportingPause,acknowledgeSport,hasSportPause} from '../dist/sport-events.js';
import {makeSeries,seedPostseason,seriesHome,syncRound,recoverPostseason,archivedRounds} from '../dist/postseason.js';
import {initCareerLedger,recordStintMatch,awardTitle,seasonTitles} from '../dist/career-ledger.js';
import {recordLegacyTitle,chooseAmbition} from '../dist/legacy.js';
import {playoffsView,masteryPanel} from '../dist/v33-view.js';
import {lifeDay,lifeAction} from '../dist/life.js';
import {save,load,listSlots,deleteSlot,parseSave} from '../dist/storage.js';
const make=()=>createGame({...defaultBuild(),path:'rookie'});

test('destination persistante : pause, décision, import, reprise et nouvelle semaine',()=>{
 const s=make();s.day=20;setAdvanceMode(s,'2');beginAdvance(s);assert.equal(s.simulation.cursor.targetDay,27);
 s.day=23;s.pending={type:'sport',choices:[['accept','OK']]};
 const resumed=parseSave(JSON.stringify(s));assert.equal(resumed.simulation.mode,'2');assert.equal(beginAdvance(resumed).targetDay,27);
 decide(resumed,'accept');resumed.day=27;
 for(const c of resumed.competitions)for(const g of c.schedule)if(g.day<=27)g.result={score:[1,0]};
 assert.equal(destinationReached(resumed),true);settleAdvance(resumed);assert.equal(resumed.simulation.mode,'2');assert.equal(beginAdvance(resumed).targetDay,34);
 setAdvanceMode(resumed,'40');assert.equal(beginAdvance(resumed).targetSeason,2);
 resumed.pending={type:'offseason',choices:[['rest','Repos']]};assert.equal(destinationReached(resumed),false);assert.equal(beginAdvance(resumed).targetSeason,2);
 resumed.season=2;assert.equal(destinationReached(resumed),true);settleAdvance(resumed);assert.equal(resumed.simulation.mode,'40');assert.equal(resumed.simulation.cursor,null);
});
test('pauses sportives regroupées, dédoublonnées, aucun choix fictif et aucun avancement involontaire',()=>{
 const s=make();sportingPause(s,'qualified','Qualifié','Playoffs');sportingPause(s,'qualified','Qualifié','Playoffs');sportingPause(s,'role','Rôle','Titulaire');
 assert.equal(s.sportEvents.notice.items.length,2);assert.equal(s.pending,null);const before=structuredClone(s);assert.equal(next(s,{interactive:false}),false);assert.deepEqual(s,before);
 acknowledgeSport(s);assert.equal(hasSportPause(s),false);sportingPause(s,'qualified','Qualifié','Playoffs');assert.equal(hasSportPause(s),false);
});
test('maîtrise : gains de minutes et de séances, vidéo, conservation et effet mesuré',()=>{
 const s=make();const original=s.system;
 for(let i=0;i<20;i++)masteryMatch(s,26);
 assert.ok(s.system-original>=9.8&&s.system-original<=10.5);const played=s.system;masteryMatch(s,0);assert.equal(s.system,played);
 s.day=10;masteryTraining(s,1);const once=s.system;masteryTraining(s,1);assert.equal(s.system,once);
 s.day=12;s.activity='video';masteryTraining(s,1);assert.ok(s.mastery.sources.video>s.mastery.sources.training);
 const current=s.system;transferMastery(s,'pace','pace');assert.equal(s.system,current*.85);transferMastery(s,'pace','defense');assert.equal(s.system,current*.85*.65);
 const p=hero(s);s.system=45;s.iq=55;assert.deepEqual(playerReading(s,p),{system:0,iq:0});s.system=100;s.iq=99;assert.ok(playerReading(s,p).system<=.0165);assert.ok(playerReading(s,p).iq<=.011);
 const season=make();season.system=50;for(let day=1;day<=250;day++){season.day=day;if(day%3===0)masteryMatch(season,26);if(day%2===0)masteryTraining(season,1);}assert.ok(season.system>=80&&season.system<95,season.system);
});
test('migration de maîtrise idempotente, sans retoucher RNG, XP ou match commencé',()=>{
 const s=make(),g=competition(s).schedule.find(g=>g.home===s.team||g.away===s.team);s.match=startMatch(s,g);stepMatch(s,s.match,25);s.engine='3.2.0';s.system=3;delete s.mastery;delete s.simulation;delete s.careerLedger;delete s.sportEvents;
 const old=structuredClone(s),m=parseSave(JSON.stringify(s));assert.equal(m.system,45);assert.equal(m.mastery.compensation.from,3);
 for(const k of ['rng','match','history'])assert.deepEqual(m[k],old[k]);assert.deepEqual(m.development.xp,old.development.xp);assert.deepEqual(hero(m).attrs,hero(old).attrs);
 assert.deepEqual(parseSave(JSON.stringify(m)),m);
});
test('22 badges et 16 techniques : seuils, contexte, cumul plafonné, usages et effets réels',()=>{
 const base=make(),p=hero(base);for(const k of KEYS)p.attrs[k]=88;base.minutes=40;p.badges={};
 for(const badge of BADGES){const q=structuredClone(p);for(const k of KEYS)q.attrs[k]=59;assert.equal(rawBonus(q,badge.context),0);q.attrs[badge.attr]=99;q.badges[badge.id]=10000;assert.ok(rawBonus(q,badge.context)>0&&rawBonus(q,badge.context)<=.07);}
 for(const t of TECHNIQUES){const q=structuredClone(p);q.learned=[t.id];q.equipped=[t.id];const on=rawBonus(q,t.context);q.equipped=[];assert.ok(on>rawBonus(q,t.context),t.id);q.equipped=[t.id];q.attrs[t.attr]=t.threshold-1;assert.equal(rawBonus(q,t.context),rawBonus({...q,equipped:[]},t.context),t.id);}
 const contexts=[...new Set(BADGES.map(b=>b.context))],changed=new Set(),used=new Set();
 for(let seed=1;seed<=60&&(changed.size<contexts.length||used.size<BADGES.length);seed++){
  base.rng.match=seed*1777;const g=competition(base).schedule.find(g=>g.home===base.team||g.away===base.team),m=startMatch(base,g);
  for(const id in m.bonuses)for(const c of contexts)m.bonuses[id][c]=0;
  const a=structuredClone(base),normal=structuredClone(m);stepMatch(a,normal,20000);const outcome=x=>JSON.stringify([x.score,x.box,x.events]);
  for(const c of contexts){if(changed.has(c))continue;const s=structuredClone(base),boost=structuredClone(m);boost.bonuses[s.hero][c]=.06;stepMatch(s,boost,20000);if(outcome(boost)!==outcome(normal))changed.add(c);}
  for(const b of BADGES)if(hero(a).badges[b.id]>0)used.add(b.id);
 }
 assert.deepEqual(contexts.filter(c=>!changed.has(c)),[],'Every context must alter an on-court outcome or its actual probability');
 assert.deepEqual(BADGES.filter(b=>!used.has(b.id)).map(b=>b.id),[],'Every badge must earn usage in its actual context');
 // No effects when the player never takes the floor.
 const s=structuredClone(base);hero(s).injury=10;const g=competition(s).schedule.find(g=>g.home===s.team||g.away===s.team),m=startMatch(s,g),a=structuredClone(s),b=structuredClone(s),ma=structuredClone(m),mb=structuredClone(m);
 for(const c of contexts)mb.bonuses[s.hero][c]=.07;stepMatch(a,ma,20000);stepMatch(b,mb,20000);assert.deepEqual(ma.score,mb.score);assert.deepEqual(ma.events,mb.events);
});
test('effets bornés et directionnels ; 99 en lay-up conserve le dunk et le tir proche',()=>{
 const s=make(),p=hero(s),d=s.players.find(p=>p.id!==s.hero);for(const k of KEYS)p.attrs[k]=99;const m={bonuses:{[p.id]:{free:.07,rebound:.07,offReb:.07,steal:.07,three:.07,catch:.07,drive:.07,dunk:.07}}},zero={bonuses:{}};
 assert.ok(freeChance(m,p)>freeChance(zero,p)&&freeChance(m,p)<=.96);assert.ok(stealChance(m,p)>stealChance(zero,p));assert.ok(reboundWeight(m,p,true)>reboundWeight(zero,p,true));assert.ok(reboundWeight(m,p,false)>reboundWeight(zero,p,false));
 assert.equal(shotBoost(m,p,{action:'three',kind:'three',catchShot:true}),.07);assert.equal(shotBoost(m,p,{action:'mid',kind:'mid'}),0);
 const kinds=new Set(Array.from({length:100},(_,i)=>finishKind(p,d,i/100)));assert.deepEqual(kinds,new Set(['dunk','close','layup']));
});
test('playoffs : 2-2-1-1-1 NBA, têtes de série, archives par tour et consultation sans RNG',()=>{
 const s=make(),c=competition(s),rank=Object.keys(c.records).map((id,i)=>({...team(s,id),wins:30-i}));c.post={round:0,stage:'series',groups:[]};seedPostseason(s,c,rank);
 const pair=makeSeries(c,rank[1].id,rank[0].id,0);assert.equal(pair.a,rank[0].id);assert.deepEqual(Array.from({length:7},(_,i)=>seriesHome('nba',pair,i)),[pair.a,pair.a,pair.b,pair.b,pair.a,pair.b,pair.a]);
 pair.games=['test-post'];pair.wins=[4,2];pair.winner=pair.a;c.post.series=[pair];c.schedule.push({id:'test-post',league:'nba',day:200,home:pair.a,away:pair.b,stage:'post',round:100,result:{score:[100,90]},seriesId:pair.id});syncRound(c);
 c.post.round=1;c.post.series=[makeSeries(c,rank[0].id,rank[2].id,0)];syncRound(c);assert.equal(c.post.rounds.length,2);assert.equal(c.post.rounds[0].series[0].winner,pair.a);
 const saved=structuredClone(s),html=playoffsView(s,'nba');assert.match(html,/Premier tour/);assert.match(html,/Demi-finales/);assert.match(html,/100 – 90/);assert.ok(!/undefined|NaN/.test(html));masteryPanel(s);assert.deepEqual(s,saved);
 const archive={id:'nba',games:c.schedule.filter(g=>g.stage==='post').map(g=>({...g,score:g.result.score,result:undefined}))};assert.equal(archivedRounds(1,archive)[0].series[0].seeds[0],null);
});
test('titres attribués au moment du sacre, conservés après transfert, non acquis après coup',()=>{
 const s=make(),c=competition(s);chooseAmbition(s,'contend');c.champion=s.team;const title=awardTitle(s,c);recordLegacyTitle(s);assert.ok(title.eligible);assert.equal(s.trophies.length,1);assert.equal(s.legacy.season.goals.find(g=>g.id==='title').completed,s.day);assert.equal(awardTitle(s,c),null);
 const previous=s.team,dest=s.teams.find(t=>t.league==='nba'&&t.id!==previous);s.pending={type:'contract'};s.offers=[{team:dest.id,league:'nba',years:2,salary:1000000,guarantee:1,option:'Aucune',role:'Rotation',minutes:25}];sign(s,0);assert.equal(seasonTitles(s).length,1);assert.equal(seasonTitles(s)[0].team,previous);
 const other=make(),oc=competition(other);oc.champion=dest.id;awardTitle(other,oc);other.pending={type:'contract'};other.offers=s.offers.length?s.offers:[{team:dest.id,league:'nba',years:2,salary:1000000,guarantee:1,option:'Aucune',role:'Rotation',minutes:25}];sign(other,0);assert.equal(seasonTitles(other).length,0);
 const b={min:30,pts:12,ast:2};recordStintMatch(s,{id:'one',league:'nba',stage:'regular'},b);recordStintMatch(s,{id:'one',league:'nba',stage:'regular'},b);assert.equal(s.careerLedger.stints.at(-1).stats.gp,1);
});
test('retraite : commandes sportives et financières sans mutation',()=>{
 const s=make();hero(s).learned=['cross'];s.retired=true;const before=structuredClone(s);
 for(const run of [()=>upgrade(s,'three'),()=>learn(s,'cross'),()=>equip(s,'cross'),()=>requestTrade(s),()=>enterDraft(s),()=>sign(s,0),()=>decide(s,'accept'),()=>lifeAction(s,'invest'),()=>next(s),()=>continueMatch(s)])run();assert.deepEqual(s,before);
});
test('finances : résidence sans placement et journal basé sur les montants effectivement encaissés',()=>{
 const s=make();s.money=1e6;s.life.property={value:250000};s.life.investments=0;s.day=365;s.life.nextEvent=9999;lifeDay(s);assert.equal(s.life.property.value,253750);
 s.life.month={income:0,expense:0,days:0};s.life.ledger=[];for(let day=1;day<=30;day++){s.day=day;hero(s).contract.salary=day<=15?36500:73000;lifeDay(s);}assert.equal(s.life.ledger.find(e=>e.label.startsWith('Salaire')).amount,3420);
});
test('emplacements identifiés, suppression et archives partagées non effacées prématurément',async()=>{
 const s=make();s.archives=[{season:9,players:[],competitions:[]}];await save(s,'gc-a');await save(s,'gc-b');const meta=(await listSlots()).find(m=>m.key==='gc-a');assert.equal(meta.name,hero(s).name);assert.equal(meta.club,team(s).name);assert.ok(meta.savedAt);
 await deleteSlot('gc-a');assert.equal(await load('gc-a'),null);assert.deepEqual((await load('gc-b')).archives,s.archives);await deleteSlot('gc-b');
 const keys=await new Promise((resolve,reject)=>{let req=indexedDB.open('hoop-legacy-v1');req.onsuccess=()=>{const db=req.result,q=db.transaction('archives').objectStore('archives').getAllKeys();q.onsuccess=()=>{db.close();resolve(q.result)};q.onerror=()=>reject(q.error)}});assert.equal(keys.some(k=>k.startsWith('season-9-')),false);
});
