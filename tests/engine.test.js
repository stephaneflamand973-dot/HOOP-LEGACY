import {beginStatistics} from '../dist/statistics.js';
import {beginChapters} from '../dist/chapters.js';
import {acknowledgeSport,hasSportPause} from '../dist/sport-events.js';
import {beginLegacySeason} from '../dist/legacy.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {KEYS} from '../dist/config.js';
import {LEAGUES} from '../dist/leagues.js';
import {createGame,defaultBuild,hero,team,getPlayer,overall,allGames,competition,startMatch,stepMatch,simulate,finalizeMatch,next,continueMatch,decide,sign,enterDraft,requestTrade,upgrade,upgradeCost,validate} from '../dist/engine.js';
import {DOMAINS,matchXP,ageAttributes} from '../dist/progression.js';
import {refreshWorld} from '../dist/world.js?v=3.8.0';
import {lifeAction,resolveLife} from '../dist/life.js';
import {parseSave} from '../dist/storage.js';
const make=(path='young',seed=2026)=>createGame({...defaultBuild(),path,seed});
const answer=s=>s.pending?.type==='contract'?sign(s,0):s.pending?.type==='draft-choice'?decide(s,'draft'):decide(s,s.pending?.choices?.[0][0]);
function advanceTo(s,day,granularity){let steps=0;while(s.day<day&&steps++<1000){if(hasSportPause(s))acknowledgeSport(s);else if(s.pending)answer(s);else next(s,{interactive:false,untilDay:Math.min(day,s.day+granularity)});}acknowledgeSport(s);while(s.pending)answer(s);next(s,{interactive:false,untilDay:day});return s;}
test('formats réels, 82 matchs NBA et calendriers sans double réservation',()=>{let s=make(),used=new Set();validate(s);for(let def of LEAGUES)for(let id of Object.keys(competition(s,def.id).records)){let games=competition(s,def.id).schedule;assert.equal(games.filter(g=>g.home===id||g.away===id).length,def.games);if(def.id==='nba')assert.equal(games.filter(g=>g.home===id).length,41);}for(let g of allGames(s))for(let id of [g.home,g.away]){let key=id+':'+g.day;assert.ok(!used.has(key));used.add(key);}assert.ok(s.players.filter(p=>p.real).length>500);assert.equal(new Set(s.players.map(p=>p.id)).size,s.players.length);assert.ok(s.players.find(p=>p.name==='Victor Wembanyama'&&p.real));});
test('points, tirs et minutes émergent des possessions en 32, 40 et 48 minutes',()=>{for(let lid of ['highschool','ncaa','nba']){let s=make(),g=competition(s,lid).schedule[0],m=simulate(s,g);for(let [i,tid] of [g.home,g.away].entries()){let rows=team(s,tid).roster.map(id=>m.box[id]);assert.equal(rows.reduce((n,b)=>n+b.pts,0),m.score[i]);assert.ok(Math.abs(rows.reduce((n,b)=>n+b.min,0)-(m.duration*5+m.ot*25))<1e-6);for(let b of rows){assert.equal(b.pts,2*b.fgm+b.tpm+b.ftm);assert.ok(b.fgm<=b.fga&&b.tpm<=b.tpa&&b.ftm<=b.fta);}}assert.equal(finalizeMatch(s,g,m),false);}});
test('trois présentations, commandes ignorées et sauvegarde à mi-match donnent le même match',()=>{let a=make(),g=competition(a).schedule[0];a.day=g.day;let fast=structuredClone(a),manual=structuredClone(a),restored;let m=simulate(fast,competition(fast).schedule[0]);manual.match=startMatch(manual,competition(manual).schedule[0]);continueMatch(manual,'attack',83);assert.equal(upgrade(manual,'three'),false);restored=parseSave(JSON.stringify(manual));while(manual.match)continueMatch(manual,'pass',10);continueMatch(restored,'screen',20000);assert.deepEqual(manual.lastMatch,m);assert.deepEqual(restored.lastMatch,m);assert.deepEqual(hero(manual).attrs,hero(fast).attrs);assert.deepEqual(manual.rng,fast.rng);assert.deepEqual(restored.rng,fast.rng);});
test('jour, semaine et grand saut conservent chronologie, RNG, XP et blessures',()=>{let a=make(),b=structuredClone(a),c=structuredClone(a);a.life.delegated=b.life.delegated=c.life.delegated=true;getPlayer(a,a.teams[0].roster[0]).injury=18;getPlayer(b,b.teams[0].roster[0]).injury=18;getPlayer(c,c.teams[0].roster[0]).injury=18;advanceTo(a,48,1);advanceTo(b,48,7);advanceTo(c,48,48);assert.deepEqual(a,b);assert.deepEqual(a,c);});
test('XP par domaine, efficacité et maximum commun de 99',()=>{let s=make(),p=hero(s);s.auto=false;for(let d of DOMAINS)s.development.xp[d]=0;assert.equal(upgrade(s,'three'),false);s.development.xp.Tir=10000;let original=p.attrs.three;assert.ok(upgrade(s,'three'));assert.equal(p.attrs.three,original+1);assert.equal(upgrade(s,'layup'),false);p.attrs.three=98;assert.ok(upgrade(s,'three'));assert.equal(p.attrs.three,99);assert.equal(upgrade(s,'three'),false);let b={min:30,pts:18,ast:5,reb:5,stl:1,blk:1,tov:2,fgm:7,fga:13,tpm:2,ftm:2};let good=make(),bad=make();good.auto=bad.auto=false;matchXP(good,hero(good),b,'nba');matchXP(bad,hero(bad),{...b,fga:35,tov:10},'nba');assert.ok(good.development.performance.efficiency>bad.development.performance.efficiency);assert.ok(good.development.xp.Tir>bad.development.xp.Tir);});
test('migration V1 et V2, historique conservé, plafonds retirés, formats invalides refusés',()=>{for(let file of ['v1-in-progress.json','v2-career.json']){let old=JSON.parse(file.startsWith('v2')?gunzipSync(fs.readFileSync(new URL('./fixtures/'+file+'.gz',import.meta.url))):fs.readFileSync(new URL('./fixtures/'+file,import.meta.url))),s=parseSave(JSON.stringify(old));assert.equal(s.schema,4);assert.deepEqual(hero(s).attrs,old.players.find(p=>p.id===old.hero).attrs);assert.ok(KEYS.every(k=>hero(s).caps[k]===99));if(old.schema===3){assert.deepEqual(s.competitions,old.competitions);assert.equal(s.day,old.day);}else assert.deepEqual(s.legacyArchive.match,old.match);validate(s);}for(let v of ['null','{}','bad','{"schema":9}'])assert.throws(()=>parseSave(v));let bad=make();hero(bad).attrs.three=1000;assert.throws(()=>validate(bad));});
test('choix de draft et marché international gardent la même identité et les résultats',()=>{for(let score of [100,20]){let s=make('prospect');hero(s).age=19;s.career.collegeYears=1;s.lastSeasonScouting={score,projection:'Test'};assert.ok(enterDraft(s));let nba=s.offers.filter(o=>o.league==='nba');assert.equal(nba.length,score===100?1:0);assert.ok(s.offers.length);let p=hero(s);assert.ok(sign(s,0));assert.equal(hero(s),p);assert.equal(s.teams.flatMap(t=>t.roster).filter(id=>id==='hero').length,1);validate(s);}});
test('argent, placements et décisions personnelles ne se dupliquent pas',()=>{let s=make('rookie');s.money=300000;assert.ok(lifeAction(s,'property'));assert.equal(s.money,50000);assert.equal(lifeAction(s,'property'),false);assert.ok(lifeAction(s,'invest'));assert.equal(s.money,41000);assert.equal(s.life.investments,9000);s.pending={type:'life',title:'Famille',choices:[['child','Un enfant']]};assert.ok(resolveLife(s,'child'));assert.equal(resolveLife(s,'child'),false);assert.equal(s.life.expecting,s.day+270);assert.equal(s.life.children.length,0);validate(s);});
test('vieillissement différencié, aucune baisse identique imposée à tous les attributs',()=>{let p=hero(make('rookie'));p.age=36;for(let k of KEYS)p.attrs[k]=85;ageAttributes(p,{care:1});assert.ok(p.attrs.speed<p.attrs.pass);assert.equal(p.attrs.three,85);});
test('une blessure et une décision importante arrêtent une avance longue',()=>{let s=make();hero(s).injury=3;s.life.nextEvent=200;s.mode='quick';next(s,{interactive:false,untilDay:100});assert.equal(s.day,3);assert.equal(hasSportPause(s),true);assert.match(s.sportEvents.notice.items[0].title,/retour/);assert.equal(hero(s).season.gp,0);let before=structuredClone(s);assert.equal(next(s,{interactive:false}),false);assert.deepEqual(s,before);assert.ok(acknowledgeSport(s));assert.equal(hero(s).returning,6);});

test('marché IA : distribution des talents après expiration simultanée, sans premier club privilégié',()=>{let s=make();s.season=2;for(let p of s.players)if(p.id!==s.hero)p.contract.years=0;refreshWorld(s);beginLegacySeason(s);beginStatistics(s);beginChapters(s);let means=s.teams.filter(t=>t.league==='nba').map(t=>t.roster.reduce((n,id)=>n+overall(getPlayer(s,id)),0)/t.roster.length);assert.ok(Math.max(...means)-Math.min(...means)<12);validate(s);});

import {v3Fixture} from './fixtures/v3-compatible.js';

test('V3 → V3.4 : XP, attributs, décisions et RNG conservés, reprise du match',()=>{
 const fixture=v3Fixture(),old=fixture.save,s=parseSave(JSON.stringify(old));assert.equal(s.engine,'3.8.0');
 assert.deepEqual(s.rng,old.rng);assert.deepEqual(hero(s).attrs,hero(old).attrs);assert.deepEqual(s.development.xp,old.development.xp);assert.deepEqual(s.match,old.match);assert.deepEqual(s.history,old.history);assert.deepEqual(s.pending,old.pending);
 continueMatch(s,null,10000);assert.deepEqual(JSON.parse(JSON.stringify(s.lastMatch)),fixture.finished);
 const again=parseSave(JSON.stringify(s));assert.equal(again.journal.length,s.journal.length);assert.deepEqual(again.rng,s.rng);
 assert.throws(()=>parseSave(JSON.stringify({...old,engine:'99.0.0'})));
 const drafted=old.players.find(p=>!p.real&&p.id!==old.hero),club=old.teams.find(t=>t.roster.includes(drafted.id));
 old.world.drafts=[{season:1,picks:[{id:drafted.id,pick:8,team:club.name}]}];
 const restored=parseSave(JSON.stringify(old));assert.deepEqual(getPlayer(restored,drafted.id).draft,{season:1,pick:8,team:club.id});
});
test('entretien du vétéran : effort physique croissant, technique accessible et aucun plafond personnel',()=>{
 const young=hero(make('rookie')),older=structuredClone(young);young.age=24;older.age=40;
 assert.ok(upgradeCost(older,'speed')>upgradeCost(young,'speed')*20);assert.ok(upgradeCost(older,'speed')>upgradeCost(older,'three')*10);
 let s=make('rookie'),p=hero(s);p.age=42;s.auto=false;p.attrs.speed=98;s.development.xp.Physique=upgradeCost(p,'speed');assert.ok(upgrade(s,'speed'));assert.equal(p.attrs.speed,99);assert.equal(s.development.xp.Physique,0);
});
test('développement IA : temps de jeu, accompagnement, maturité et développement tardif',()=>{
 let base=hero(make('rookie'));base.age=21;base.developmentRate=1;for(let k of KEYS)base.attrs[k]=72;
 const play=structuredClone(base),bench=structuredClone(base),late=structuredClone(base),steady=structuredClone(base);
 play.season={gp:60,min:60*32};bench.season={gp:60,min:60*4};
 for(let y=0;y<3;y++){play.age++;bench.age++;ageAttributes(play,{ai:true,coach:85});ageAttributes(bench,{ai:true,coach:55});}
 assert.ok(overall(play)>overall(bench));late.age=steady.age=27;late.developmentTiming=.95;steady.developmentTiming=.2;late.season=steady.season={gp:60,min:60*24};
 for(let y=0;y<3;y++){late.age++;steady.age++;ageAttributes(late,{ai:true});ageAttributes(steady,{ai:true});}assert.ok(overall(late)>overall(steady));
});
test('un joueur déjà drafté ne retourne pas dans une nouvelle draft',()=>{
 const s=make();s.season=2;refreshWorld(s);let id=s.lastDraft[0].id,p=getPlayer(s,id);assert.ok(p.draft);p.age=19;p.contract.years=0;s.season++;refreshWorld(s);assert.ok(!s.lastDraft.some(q=>q.id===id));assert.ok(getPlayer(s,id).draft);
});
