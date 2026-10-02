import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {createGame,defaultBuild,hero,team,competition,simulate,sign,decide,validate,startMatch,stepMatch,migrateLegacy} from '../dist/engine.js';
import {statisticsRows,recordStatistics,emptyStats,awardRanking,settleAwards,closeStatistics} from '../dist/statistics.js';
import {requestRole,recordCoachMatch,reviewCoach,orderedOffers} from '../dist/career-plan.js';
import {beginChapters,updateChapters,closeChapters} from '../dist/chapters.js';
import {physicalContest,aerialFinish,physicalBlock,physicalRebound,coveragePlan,coverageEffect} from '../dist/physical.js';
import {save,load,completeExport,hydrateArchive,deleteSlot,parseSave} from '../dist/storage.js';
import {splitWorkerState,joinWorkerState} from '../dist/worker-state.js';
import {statsView,profileView,awardsView,directoryView,chaptersPanel,marketOffersView} from '../dist/v34-view.js';
import {KEYS} from '../dist/config.js';
import {retireCareer} from '../dist/commands.js';
const make=()=>createGame({...defaultBuild(),path:'rookie'});
const own=s=>competition(s).schedule.find(g=>g.home===s.team||g.away===s.team);

test('statistiques : phases séparées, transfert, agrégats exacts et finalisation unique',()=>{
 const s=make(),g=own(s);s.day=g.day;simulate(s,g);const regular=statisticsRows(s,{phase:'regular'}).rows.find(r=>r.id===s.hero).stats;
 const game={...g,id:'final-test',result:null,stage:'post'},c=competition(s);c.post={series:[{games:[game.id]}]};c.schedule.push(game);simulate(s,game);
 assert.deepEqual(statisticsRows(s,{phase:'regular'}).rows.find(r=>r.id===s.hero).stats,regular);
 assert.equal(statisticsRows(s,{phase:'post'}).rows.find(r=>r.id===s.hero).stats.gp,1);
 const before=structuredClone(s.statistics);recordStatistics(s,g,s.lastMatch);assert.deepEqual(s.statistics,before);
 const old=s.team,dest=s.teams.find(t=>t.league==='nba'&&t.id!==s.team);s.match=null;s.pending={type:'contract'};s.offers=[{team:dest.id,years:2,salary:1e6,role:'Titulaire',minutes:30}];sign(s,0);
 const g2=competition(s).schedule.find(g=>!g.result&&(g.home===s.team||g.away===s.team));simulate(s,g2);
 const all=statisticsRows(s,{phase:'all'}).rows.find(r=>r.id===s.hero);assert.equal(all.stats.gp,hero(s).season.gp);assert.equal(all.stats.pts,hero(s).season.pts);assert.deepEqual(new Set(all.teams),new Set([old,dest.id]));
 assert.equal(statisticsRows(s,{phase:'all',team:old}).rows.find(r=>r.id===s.hero).stats.gp,2);
 const archive=closeStatistics(s);assert.equal(archive.rows.filter(r=>r.id===s.hero).reduce((n,r)=>n+r.stats.pts,0),hero(s).season.pts);
});

test('distinctions : six matchs ne suffisent pas, défense, rookies et playoffs isolés',()=>{
 const s=make(),ids=team(s).roster.slice(0,3),c=competition(s);
 const row=(id,gp,pts,stl,blk)=>({id,name:s.players.find(p=>p.id===id).name,pos:'AR',team:s.team,league:'nba',phase:'regular',wins:gp*.6,finals:emptyStats(),stats:{...emptyStats(),gp,min:gp*30,pts:gp*pts,reb:gp*5,ast:gp*5,stl:gp*stl,blk:gp*blk,tov:gp*2,fga:gp*15,fgm:gp*8,fta:gp*4,ftm:gp*3}});
 s.statistics.rows={a:row(ids[0],6,70,2,2),b:row(ids[1],70,30,1,1),c:row(ids[2],72,15,4,4)};
 const r=awardRanking(s,'nba');assert.equal(r.candidates.find(r=>r.id===ids[0]).eligible,false);assert.equal(r.candidates[0].id,ids[1]);assert.equal(awardRanking(s,'nba','defense').candidates[0].id,ids[2]);
 s.statistics.people[ids[1]].debut.nba=1;assert.equal(awardRanking(s,'nba','rookie').candidates.find(r=>r.id===ids[1]).eligible,true);
 settleAwards(s,c);const awards=structuredClone(s.statistics.awards);s.statistics.rows.post={...row(ids[0],30,99,10,10),phase:'post'};settleAwards(s,c);assert.deepEqual(s.statistics.awards,awards);
 c.champion=s.team;c.post={series:[{games:['f1','f2','f3','f4','f5']}]};s.statistics.rows.post.finals={...s.statistics.rows.post.stats,gp:5};settleAwards(s,c,'finals');assert.equal(s.statistics.awards.at(-1).winners[0].id,ids[0]);
 const rng=structuredClone(s.rng);assert.deepEqual(awardRanking(s,'nba'),awardRanking(s,'nba'));assert.deepEqual(s.rng,rng);
});

test('migration V3.3 : phases inconnues conservées, aucun trophée ou résultat inventé',()=>{
 const s=make(),g=own(s);simulate(s,g);const p=hero(s);p.byLeague.nba.gp+=6;p.byLeague.nba.pts+=120;p.season.gp+=6;p.season.pts+=120;
 s.engine='3.3.0';delete s.statistics;delete s.careerPlan;delete s.chapters;
 const old=structuredClone(s),m=migrateLegacy(s);assert.deepEqual(m.competitions,old.competitions);assert.deepEqual(m.rng,old.rng);assert.deepEqual(m.trophies,old.trophies);
 const all=statisticsRows(m,{phase:'all'}).rows.find(r=>r.id===m.hero);assert.equal(all.stats.gp,hero(m).season.gp);assert.equal(all.stats.pts,hero(m).season.pts);
 assert.equal(statisticsRows(m,{phase:'unknown'}).rows.find(r=>r.id===m.hero).stats.pts,120);
 assert.ok(awardRanking(m,'nba').unavailable);assert.deepEqual(parseSave(JSON.stringify(m)),m);
});

test('coach : contrat d’évaluation durable, blessure, bilan expliqué, transfert et retraite',()=>{
 const s=make();assert.ok(requestRole(s));assert.equal(requestRole(s),false);decide(s,'accept');
 for(let i=0;i<3;i++)recordCoachMatch(s,{grade:80,box:{hero:{min:30}}});
 const restored=parseSave(JSON.stringify(s));restored.day=21;assert.ok(reviewCoach(restored));assert.ok(restored.careerPlan.reviews[0].met);assert.match(restored.careerPlan.reviews[0].text,/concurrence/);assert.equal(reviewCoach(restored),false);
 const hurt=make();requestRole(hurt);decide(hurt,'accept');hero(hurt).injury=30;hurt.day=21;assert.equal(reviewCoach(hurt),false);assert.equal(hurt.careerPlan.evaluation.due,35);hurt.day=35;reviewCoach(hurt);assert.equal(hurt.careerPlan.evaluation,null);
 const retired=make();requestRole(retired);decide(retired,'accept');assert.ok(retireCareer(retired));assert.equal(retired.careerPlan.evaluation,null);assert.equal(requestRole(retired),false);
 const moved=make();requestRole(moved);decide(moved,'accept');moved.pending={type:'contract'};moved.offers=[{team:moved.teams.find(t=>t.league==='nba'&&t.id!==moved.team).id,years:2,salary:1e6,role:'Rotation',minutes:20}];sign(moved,0);assert.equal(moved.careerPlan.evaluation,null);assert.match(moved.careerPlan.reviews[0].text,/changement de club/);
});

test('offres : priorité lisible et tri stable sans modifier contrats ni RNG',()=>{
 const s=make(),teams=s.teams.filter(t=>t.league==='nba').slice(0,3);s.offers=teams.map((t,i)=>({team:t.id,league:'nba',salary:(3-i)*1e6,minutes:20+i*5,years:2,role:'Rotation'}));
 const old=structuredClone(s.offers),rng=structuredClone(s.rng);s.careerPlan.preference='salary';assert.equal(orderedOffers(s)[0].index,0);s.careerPlan.preference='minutes';assert.equal(orderedOffers(s)[0].index,2);assert.deepEqual(s.offers,old);assert.deepEqual(s.rng,rng);assert.match(marketOffersView(s),/Concurrence/);
});

test('physique : effets directs, bornés et contextuels ; couverture identique pour tous',()=>{
 const s=make(),p=hero(s),d=structuredClone(p);for(const k of KEYS)p.attrs[k]=d.attrs[k]=65;
 p.wingspan=p.height+6;d.wingspan=d.height+6;p.attrs.agility=99;assert.ok(physicalContest(p,d,'drive')<0);assert.equal(physicalContest(p,d,'three'),0);
 p.attrs.vertical=99;assert.ok(aerialFinish(p,'dunk')>0);assert.equal(aerialFinish(p,'three'),0);assert.ok(physicalBlock(p,true)>physicalBlock(d,true));assert.equal(physicalBlock(p,false),0);
 d.wingspan=240;assert.ok(physicalContest(p,d,'three')>0);assert.ok(physicalRebound(d)>1);assert.ok(physicalRebound(d)<=1.13);
 const plan=coveragePlan([{id:'a'},{id:'b'}],{a:99,b:80});assert.equal(plan.target,'a');assert.ok(coverageEffect(plan,{id:'a'})<0);assert.ok(coverageEffect(plan,{id:'b'})>0);assert.equal(coveragePlan([{id:'a'},{id:'b'}],{a:88,b:80}),null);
});

test('chapitres au sommet : faits de carrière, revanche réelle et dix bilans conservés',()=>{
 const s=make();for(const k of KEYS)hero(s).attrs[k]=99;hero(s).age=35;s.chapters.current=null;
 s.careerLedger.titles.push({id:'old',eligible:true,season:0,team:s.team,league:'nba'});
 const rival=s.teams.find(t=>t.league==='nba'&&t.id!==s.team);s.legacy.rivals.push({team:rival.id,name:rival.name,lastSeries:{season:0,won:false},post:4});beginChapters(s);
 assert.equal(s.chapters.current.entries.length,3);assert.ok(s.chapters.current.entries.some(e=>e.kind==='revenge'));assert.ok(s.chapters.current.entries.some(e=>e.kind==='defend'));
 s.legacy.rivals[0].lastSeries={season:1,won:true};updateChapters(s);assert.equal(s.chapters.current.entries.find(e=>e.kind==='revenge').completed,s.day);
 for(let year=1;year<=10;year++){s.season=year;s.chapters.current=null;beginChapters(s);assert.ok(s.chapters.current.entries.length>=2);closeChapters(s);closeChapters(s);}assert.equal(s.chapters.history.length,10);
});

test('archives à la demande : rechargement léger, export intégral et références partagées',async()=>{
 const s=make();s.archives=Array.from({length:3},(_,i)=>({season:i+1,team:s.team,league:s.league,competitions:[],players:[],proof:'x'.repeat(50000)}));await save(s,'v34-lazy');
 const lazy=await load('v34-lazy',{lazy:true});assert.equal(lazy.archives.filter(a=>a.deferred).length,2);assert.ok(JSON.stringify(lazy.archives).length<JSON.stringify(s.archives).length/2);assert.throws(()=>parseSave(JSON.stringify(lazy)),/incomplet/);
 await save(lazy,'v34-shared');await deleteSlot('v34-lazy');await hydrateArchive(lazy,1);assert.equal(lazy.archives[0].proof.length,50000);await completeExport(lazy);assert.deepEqual(lazy.archives,s.archives);assert.deepEqual((await load('v34-shared')).archives,s.archives);
});

test('worker : historiques immuables retirés du message et réassemblés sans doublon',()=>{
 const s=make();s.statistics.people.hero.years=[{season:0,stats:{gp:10}}];s.statistics.awards=[{season:0,id:'old'}];s.archives=[{season:0},{season:1}];
 const {state,prefix}=splitWorkerState(s);assert.equal(state.statistics.people.hero.years.length,0);assert.equal(state.statistics.awards.length,0);assert.deepEqual(joinWorkerState(state,prefix),s);
 state.statistics.people.hero.years.push({season:1,stats:{gp:10}});const merged=joinWorkerState(state,prefix);assert.equal(merged.statistics.people.hero.years.length,2);assert.deepEqual(joinWorkerState(state,prefix),merged);
});

test('dossiers, statistiques et distinctions : aucun changement de simulation ou RNG',()=>{
 const s=make();simulate(s,own(s));const old=structuredClone(s);const f={phase:'regular',team:'all',sort:'pts',direction:'desc',query:''};
 for(const html of [statsView(s,s.league,f),profileView(s,s.hero),directoryView(s),awardsView(s,s.league,{kind:'mvp'}),chaptersPanel(s)])assert.ok(!/undefined|NaN/.test(html));assert.deepEqual(s,old);validate(s);
});
