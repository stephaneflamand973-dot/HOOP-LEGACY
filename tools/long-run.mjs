import {acknowledgeSport,hasSportPause} from '../dist/sport-events.js';
import fs from 'node:fs';
import crypto from 'node:crypto';
const cache=new URL('../.qa-cache/',import.meta.url);fs.mkdirSync(cache,{recursive:true});
const fingerprint=crypto.createHash('sha256').update(['finance','life-context','club-project','match-v34','statistics','career-plan','chapters','physical','engine','match','match-v33','match-v32','match-effects','world','life','progression','config','leagues','legacy','system','postseason','career-ledger','simulation','sport-events','commands'].map(n=>fs.readFileSync(new URL('../dist/'+n+'.js',import.meta.url),'utf8')).join('')).digest('hex');
import assert from 'node:assert/strict';
import {careerTotals} from '../dist/legacy.js';
import {createGame,defaultBuild,hero,overall,next,decide,sign,validate,competition,getPlayer,team} from '../dist/engine.js';
const seeds=process.argv.slice(2).map(Number);if(!seeds.length)seeds.push(2026,973);
let results=[];const target=Number(process.env.QA_SEASONS||30),control=process.env.QA_CONTROL==='1';
for(let seed of seeds){let checkpointFile=new URL('state-'+seed+(control?'-control':'')+'.json',cache),previous=fs.existsSync(checkpointFile)?JSON.parse(fs.readFileSync(checkpointFile)):null;if(previous?.fingerprint!==fingerprint)previous=null;let s=previous?.state||createGame({...defaultBuild(),seed}),steps=previous?.steps||0,start=performance.now(),checkpoints=previous?.checkpoints||[];s.life.delegated=true;s.life.policies={routine:'family',media:'team',agent:'local'};if(control&&!previous)hero(s).injury=100000;
 while(s.season<=target&&!s.retired&&steps++<30000){
  if(hasSportPause(s))acknowledgeSport(s);
  else if(s.pending){if(s.pending.type==='contract'){let i=s.offers.findIndex(o=>o.league==='nba');sign(s,i<0?0:i);}else if(s.pending.type==='draft-choice')decide(s,'draft');else decide(s,s.pending.type==='offseason'?'shoot':s.pending.choices[0][0]);}
  else next(s,{interactive:false});
  if(s.history.length>=(checkpoints.at(-1)?.season||0)+1){let yr=s.history.length;
   validate(s);assert.equal(s.legacy.reviews.length,yr);assert.equal(s.legacy.rivals.reduce((n,r)=>n+r.gp,0),careerTotals(s).gp);assert.equal(new Set(s.legacy.milestones.map(m=>m.id)).size,s.legacy.milestones.length);for(let c of s.archives.at(-1).competitions){assert.ok(c.champion);assert.ok(c.games.every(g=>g.score));
    const allIds=new Set();for(const round of c.post.rounds)for(const series of round.series){
     assert.ok(!allIds.has(series.id));allIds.add(series.id);const games=series.games.map(id=>c.games.find(g=>g.id===id)),wins=[0,0],target=Math.ceil(series.best/2);
     for(const [i,g] of games.entries()){assert.ok(g&&g.score&&g.score[0]!==g.score[1]);assert.ok(Math.max(...wins)<target,'Rencontre programmée après le sacre');wins[(g.score[0]>g.score[1]?g.home:g.away)===series.a?0:1]++;if(c.id==='nba')assert.equal(g.home,[series.a,series.a,series.b,series.b,series.a,series.b,series.a][i]);}
     assert.deepEqual(wins,series.wins);assert.equal(Math.max(...wins),target);
    }
    if(c.id==='nba')assert.deepEqual(c.post.rounds.map(r=>r.series.length),[8,4,2,1]);
   }
   const seasonStints=s.careerLedger.stints.filter(t=>t.season===yr);for(const key of ['gp','pts','ast','reb'])assert.equal(seasonStints.reduce((n,t)=>n+t.stats[key],0),s.history.at(-1).stats[key]);
   const nba=s.teams.filter(t=>t.league==='nba'),players=nba.flatMap(t=>t.roster.map(id=>getPlayer(s,id))),ratings=players.map(overall),archive=s.archives.at(-1).competitions.find(c=>c.id==='nba');
   let reg=archive.games.filter(g=>g.stage==='regular'),averageScore=reg.reduce((n,g)=>n+g.score[0]+g.score[1],0)/reg.length/2;
   assert.ok(averageScore>80&&averageScore<150,`Score NBA moyen ${averageScore}`);assert.ok(ratings.every(n=>n>=25&&n<=99));
   for(let t of s.teams)assert.ok(t.roster.length>=10&&t.roster.length<=20);
   let row={season:yr,mastery:+s.system.toFixed(2),titles:s.careerLedger.titles.filter(t=>t.eligible).length,hero:overall(hero(s)),heroTeam:team(s).name,age:hero(s).age,athletics:+(['speed','agility','vertical','ballSpeed','dunk'].reduce((n,k)=>n+hero(s).attrs[k],0)/5).toFixed(1),shooting:+(['three','mid','free'].reduce((n,k)=>n+hero(s).attrs[k],0)/3).toFixed(1),speed:hero(s).attrs.speed,three:hero(s).attrs.three,league:s.league,nbaMean:+(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1),nba90:ratings.filter(x=>x>=90).length,nbaAi90:players.filter(p=>p.id!==s.hero&&overall(p)>=90).length,nbaMax:Math.max(...ratings),score:+averageScore.toFixed(1),players:s.players.length,champion:team(s,archive.champion).name,draft:s.lastDraft.length,money:Math.round(s.money),injuries:s.health?.history.length||0,accomplishments:s.legacy.milestones.length,rivalries:s.legacy.rivals.filter(r=>r.emerged!==undefined).length,seasonObjectives:s.legacy.reviews.at(-1).goals.filter(g=>g.completed!==null).length};checkpoints.push(row);fs.writeFileSync(checkpointFile.pathname+'.tmp',JSON.stringify({fingerprint,state:s,steps,checkpoints}));fs.renameSync(checkpointFile.pathname+'.tmp',checkpointFile);
   if([1,5,10,20,30].includes(yr)){console.log(JSON.stringify({seed,...row,elapsed:Math.round((performance.now()-start)/1000)}));}
  }
 }
 assert.equal(s.history.length,target);const champions={};for(let c of checkpoints)champions[c.champion]=(champions[c.champion]||0)+1;const aiChampions={};for(const c of checkpoints)if(c.champion!==c.heroTeam)aiChampions[c.champion]=(aiChampions[c.champion]||0)+1;const dominanceWarning=Math.max(...Object.values(champions))>target*.5;if(target>=20)assert.ok(Math.max(...Object.values(aiChampions))<=target*.5,'Une franchise sans le héros domine plus de la moitié des saisons : vérifier le marché');let report={fingerprint,champions,aiChampions,control,dominanceWarning,seed,steps,seconds:+((performance.now()-start)/1000).toFixed(1),saveMB:+(JSON.stringify(s).length/1e6).toFixed(2),checkpoints};results.push(report);fs.writeFileSync(`tests/long-run-${seed}${control?'-control':''}.json`,JSON.stringify(report,null,2));
}
