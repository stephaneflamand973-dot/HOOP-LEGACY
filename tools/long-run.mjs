import fs from 'node:fs';
import crypto from 'node:crypto';
const cache=new URL('../.qa-cache/',import.meta.url);fs.mkdirSync(cache,{recursive:true});
const fingerprint=crypto.createHash('sha256').update(['engine','match','world','life','progression','config','leagues'].map(n=>fs.readFileSync(new URL('../dist/'+n+'.js',import.meta.url),'utf8')).join('')).digest('hex');
import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,overall,next,decide,sign,validate,competition,getPlayer,team} from '../dist/engine.js';
const seeds=process.argv.slice(2).map(Number);if(!seeds.length)seeds.push(2026,973);
let results=[];const target=Number(process.env.QA_SEASONS||30);
for(let seed of seeds){let checkpointFile=new URL('state-'+seed+'.json',cache),previous=fs.existsSync(checkpointFile)?JSON.parse(fs.readFileSync(checkpointFile)):null;if(previous?.fingerprint!==fingerprint)previous=null;let s=previous?.state||createGame({...defaultBuild(),seed}),steps=previous?.steps||0,start=performance.now(),checkpoints=previous?.checkpoints||[];s.life.delegated=true;
 while(s.season<=target&&!s.retired&&steps++<30000){
  if(s.pending){if(s.pending.type==='contract'){let i=s.offers.findIndex(o=>o.league==='nba');sign(s,i<0?0:i);}else if(s.pending.type==='draft-choice')decide(s,'draft');else decide(s,s.pending.type==='offseason'?'shoot':s.pending.choices[0][0]);}
  else next(s,{interactive:false});
  if(s.history.length>=(checkpoints.at(-1)?.season||0)+1){let yr=s.history.length;
   validate(s);for(let c of s.archives.at(-1).competitions){assert.ok(c.champion);assert.ok(c.games.every(g=>g.score));}
   const nba=s.teams.filter(t=>t.league==='nba'),players=nba.flatMap(t=>t.roster.map(id=>getPlayer(s,id))),ratings=players.map(overall),archive=s.archives.at(-1).competitions.find(c=>c.id==='nba');
   let reg=archive.games.filter(g=>g.stage==='regular'),averageScore=reg.reduce((n,g)=>n+g.score[0]+g.score[1],0)/reg.length/2;
   assert.ok(averageScore>80&&averageScore<150,`Score NBA moyen ${averageScore}`);assert.ok(ratings.every(n=>n>=25&&n<=99));
   for(let t of s.teams)assert.ok(t.roster.length>=10&&t.roster.length<=20);
   let row={season:yr,hero:overall(hero(s)),heroTeam:team(s).name,age:hero(s).age,athletics:+(['speed','agility','vertical','ballSpeed','dunk'].reduce((n,k)=>n+hero(s).attrs[k],0)/5).toFixed(1),shooting:+(['three','mid','free'].reduce((n,k)=>n+hero(s).attrs[k],0)/3).toFixed(1),speed:hero(s).attrs.speed,three:hero(s).attrs.three,league:s.league,nbaMean:+(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1),nba90:ratings.filter(x=>x>=90).length,nbaAi90:players.filter(p=>p.id!==s.hero&&overall(p)>=90).length,nbaMax:Math.max(...ratings),score:+averageScore.toFixed(1),players:s.players.length,champion:team(s,archive.champion).name,draft:s.lastDraft.length,money:Math.round(s.money),injuries:s.health?.history.length||0};checkpoints.push(row);fs.writeFileSync(checkpointFile.pathname+'.tmp',JSON.stringify({fingerprint,state:s,steps,checkpoints}));fs.renameSync(checkpointFile.pathname+'.tmp',checkpointFile);
   if([1,5,10,20,30].includes(yr)){console.log(JSON.stringify({seed,...row,elapsed:Math.round((performance.now()-start)/1000)}));}
  }
 }
 assert.equal(s.history.length,target);const champions={};for(let c of checkpoints)champions[c.champion]=(champions[c.champion]||0)+1;if(target>=20)assert.ok(Math.max(...Object.values(champions))<=target*.5,'Une franchise remporte plus de la moitié des saisons : vérifier le marché');let report={fingerprint,champions,seed,steps,seconds:+((performance.now()-start)/1000).toFixed(1),saveMB:+(JSON.stringify(s).length/1e6).toFixed(2),checkpoints};results.push(report);fs.writeFileSync(`tests/long-run-${seed}.json`,JSON.stringify(report,null,2));
}
