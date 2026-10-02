import {awardTitle} from '../dist/career-ledger.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,team,competition,simulate,finalizeMatch,totals,sign,validate} from '../dist/engine.js';
import {initLegacy,chooseAmbition,beginLegacySeason,refreshAmbition,recordLegacyMatch,recordLegacySeries,finishLegacySeason,careerTotals,rivalries,nextStakes} from '../dist/legacy.js';
import {ambitionPanel,legacyPanel,reviewPanel,stakesPanel,highlightsPanel} from '../dist/legacy-view.js';
import {parseSave} from '../dist/storage.js';
const make=()=>createGame({...defaultBuild(),path:'rookie'});
function fixture(s,{id='memory-1',min=30,pts=30,reb=10,ast=10,stage='regular',score=[101,100]}={}){
 const opponent=s.teams.find(t=>t.league===s.league&&t.id!==s.team);
 const g={id,home:s.team,away:opponent.id,league:s.league,stage};
 const b={id:s.hero,min,pts,reb,ast,stl:1,blk:1};
 return {g,m:{score,box:{[s.hero]:b},grade:82},b};
}
test('ambition facultative : choix avant le premier match, aucun bonus ni RNG',()=>{
 const s=make(),rng=structuredClone(s.rng),attrs={...hero(s).attrs},xp=structuredClone(s.development.xp);
 assert.ok(chooseAmbition(s,'contend'));assert.equal(chooseAmbition(s,'invalid'),false);
 const {g,m}=fixture(s);recordLegacyMatch(s,g,m);assert.equal(chooseAmbition(s,'emerge'),false);
 assert.deepEqual(s.rng,rng);assert.deepEqual(hero(s).attrs,attrs);assert.deepEqual(s.development.xp,xp);
 assert.equal(s.pending,null);
});
test('match officiel : un seul décompte malgré une nouvelle finalisation',()=>{
 const s=make(),g=competition(s).schedule.find(g=>g.home===s.team||g.away===s.team);s.day=g.day;
 const m=simulate(s,g),before=structuredClone(s.legacy);assert.equal(finalizeMatch(s,g,m),false);recordLegacyMatch(s,g,m);
 assert.deepEqual(s.legacy,before);assert.equal(s.legacy.season.metrics.gp,hero(s).season.gp);assert.equal(careerTotals(s).pts,hero(s).season.pts);
});
test('absence : aucun duel, victoire ou double-double personnel crédité',()=>{
 const s=make(),{g,m}=fixture(s,{min:0});recordLegacyMatch(s,g,m);
 assert.equal(s.legacy.doubleDoubles,0);assert.equal(s.legacy.rivals.length,0);assert.equal(s.legacy.season.metrics.gp,0);assert.equal(s.legacy.season.locked,true);
});
test('rivalité : rencontres serrées, séries et identité conservées après transfert',()=>{
 const s=make();let last;
 for(let i=0;i<3;i++){last=fixture(s,{id:'rival-'+i});recordLegacyMatch(s,last.g,last.m);}
 const rival=rivalries(s)[0];assert.equal(rival.gp,3);assert.equal(rival.wins,3);assert.equal(s.legacy.tripleDoubles,3);
 const c=competition(s),pair={a:s.team,b:rival.team,winner:rival.team,games:['post-test'],wins:[0,1],best:1};
 c.post={round:0,series:[pair]};c.schedule.push({...last.g,id:'post-test',day:10,stage:'post',result:{score:[90,91],box:{[s.hero]:{min:20}}}});
 recordLegacySeries(s,c,pair);recordLegacySeries(s,c,pair);assert.equal(rival.seriesLosses,1);
 const oldTeam=s.team,dest=s.teams.find(t=>t.league==='nba'&&t.id!==oldTeam&&t.id!==rival.team);
 s.pending={type:'contract'};s.offers=[{team:dest.id,league:'nba',years:2,salary:1e6,role:'Titulaire',minutes:30,guarantee:1,option:'Aucune'}];assert.ok(sign(s,0));
 assert.equal(s.legacy.rivals[0].team,rival.team);assert.equal(s.legacy.rivals[0].gp,3);assert.equal(s.legacy.season.locked,true);
 assert.match(nextStakes(s,{home:s.team,away:rival.team,league:'nba',stage:'regular'}).text,/3 victoire/);
});
test('enjeux des playoffs : élimination, balle de titre et match décisif',()=>{
 const s=make(),{g}=fixture(s,{stage:'post'}),c=competition(s),pair={a:g.home,b:g.away,games:[g.id],best:7,wins:[1,3]};c.post={series:[pair]};
 assert.equal(nextStakes(s,g).title,'Dos au mur');pair.wins=[3,1];assert.equal(nextStakes(s,g).title,'Une victoire du titre');pair.wins=[3,3];assert.equal(nextStakes(s,g).title,'Match décisif');
});
test('fin de saison : bilan figé, titre unique, pas de statistiques comptées deux fois',()=>{
 const s=make();chooseAmbition(s,'contend');hero(s).season={...totals(),gp:60,pts:600};s.history.push({season:1,stats:{...hero(s).season}});
 competition(s).champion=s.team;awardTitle(s,competition(s));finishLegacySeason(s,s.hero);finishLegacySeason(s,s.hero);
 assert.equal(s.legacy.reviews.length,1);assert.equal(s.legacy.reviews[0].goals.find(g=>g.id==='title').completed,0);
 assert.equal(s.legacy.milestones.filter(m=>m.id==='titles-1').length,1);assert.ok(!s.legacy.milestones.some(m=>m.id==='career-pts-1000'));
 s.season=2;hero(s).season=totals();beginLegacySeason(s);assert.equal(careerTotals(s).pts,600);assert.equal(s.legacy.reviews[0].stats.pts,600);
 assert.equal(s.legacy.season.metrics.gp,0);assert.equal(s.legacy.reviews[0].mvp,true);assert.ok(chooseAmbition(s,'lead'));
});
test('migration V3.1 : totaux récupérés, dates inconnues et aucun rival inventé',()=>{
 const old=make();old.engine='3.1.0';delete old.legacy;old.history=[{season:1,stats:{...totals(),gp:80,pts:2000}}];old.records={pts:45};
 const s=parseSave(JSON.stringify(old));assert.deepEqual(s.rng,old.rng);assert.deepEqual(s.history,old.history);assert.deepEqual(hero(s).attrs,hero(old).attrs);
 assert.equal(careerTotals(s).pts,2000);assert.equal(s.legacy.rivals.length,0);assert.equal(s.legacy.doubleDoubles,0);
 const milestone=s.legacy.milestones.find(m=>m.id==='career-pts-1000');assert.equal(milestone.recovered,true);assert.equal(milestone.day,null);
 assert.deepEqual(parseSave(JSON.stringify(s)),s);validate(s);
 const bad=structuredClone(s);bad.legacy.season.metrics.gp=-1;assert.throws(()=>validate(bad));
});
test('consultation mobile : mémoire et RNG strictement inchangés par les rendus',()=>{
 const s=make(),{g,m}=fixture(s);for(let i=0;i<3;i++)recordLegacyMatch(s,{...g,id:'view-'+i},m);
 const before=structuredClone(s);
 for(let i=0;i<3;i++)for(const html of [ambitionPanel(s,true),legacyPanel(s),reviewPanel(s,true),stakesPanel(s,g),highlightsPanel(s)])assert.ok(!/undefined|NaN/.test(html));
 assert.deepEqual(s,before);
});
