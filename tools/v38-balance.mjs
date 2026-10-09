import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {VERSION} from '../dist/config.js';
import {createGame,defaultBuild,hero,team,next,decide,sign,validate,overall} from '../dist/engine.js';
import {hasSportPause,acknowledgeSport} from '../dist/sport-events.js';
import {bookStage,stageQuote,setCollectiveRoutine} from '../dist/collective.js';
const fingerprint=crypto.createHash('sha256').update(['collective','collective-state','collective-catalog','collective-match','environment','finance','progression','engine','match','config'].map(n=>fs.readFileSync('dist/'+n+'.js','utf8')).join('')).digest('hex');
const rows=[],seeds=process.argv.length>2?process.argv.slice(2).map(Number):[2026,973];
for(const seed of seeds)for(const path of ['highschool','rookie'])for(const offer of ['none','routine-video','routine-tactical','routine-partners','stage-video','stage-tactical','stage-partners']){
 const s=createGame({...defaultBuild(),seed,path:path==='highschool'?'young':path});s.life.delegated=true;s.life.policies={routine:'family',media:'team',agent:'local'};let steps=0,minCash=s.money,fatigue=0,days=0,lastDay=-1,buys=0,injuries=0,injuryDays=0,lastInjury=0,trajectory=[],skipped={},preparation={sessions:0,mastery:0,duo:0};
 while(s.season<=3&&!s.retired&&steps++<6000){
  const [kind,mode]=offer.split('-'),ids=mode==='partners'?team(s).roster.filter(id=>id!==s.hero&&s.players.some(p=>p.id===id&&!p.injury)).sort().slice(0,2):[];
  if(kind==='routine')setCollectiveRoutine(s,mode,ids);
  if(kind==='stage'&&!s.collective.stage){const q=stageQuote(s,mode,ids);if(q.ok){const cash=s.money;assert.equal(bookStage(s,q).ok,true);assert.equal(s.money,q.balanceAfter);assert.equal(Math.round((cash-s.money)*100),q.price*100);assert.ok(s.money>=s.life.finance.reserve);buys++;}}
  if(hasSportPause(s))acknowledgeSport(s);
  else if(s.pending){if(s.pending.type==='contract'){const i=s.offers.findIndex(o=>o.league==='nba');sign(s,i<0?0:i);}else decide(s,s.pending.type==='draft-choice'?'draft':s.pending.type==='offseason'?'shoot':s.pending.choices[0][0]);}
  else next(s,{interactive:false,untilDay:s.day+1});
  minCash=Math.min(minCash,s.money);if(s.day!==lastDay){fatigue+=hero(s).fatigue;if(hero(s).injury>lastInjury)injuries++;if(hero(s).injury)injuryDays++;lastInjury=hero(s).injury;days++;const daily=s.collective.recent.at(-1);if(daily?.day===s.day){if(daily.reason)skipped[daily.reason]=(skipped[daily.reason]||0)+1;else {preparation.sessions++;preparation.mastery+=daily.mastery;preparation.duo+=daily.duo;}}lastDay=s.day;}
  assert.ok(Number.isFinite(s.money)&&s.money>=0);assert.ok(Object.values(hero(s).attrs).every(n=>Number.isFinite(n)&&n<=99));const f=s.life.finance;assert.ok(Math.abs(s.money-f.start.cash-f.totals.cash)<.02);assert.ok(s.collective.history.length<=24&&s.collective.archived.length<=50);
  if(s.history.length>trajectory.length){validate(s);const duos=Object.values(s.collective.duos[s.team]||{}).filter(d=>d.ids.includes(s.hero));trajectory.push({season:s.history.length,overall:overall(hero(s)),systemMastery:s.system,duoMean:duos.length?duos.reduce((n,d)=>n+d.score,0)/duos.length:0,minutes:s.history.at(-1).stats.min,injuries,injuryDays,titles:s.careerLedger.titles.filter(t=>t.eligible).length,money:s.money,...s.collective.totals});}
 }
 assert.equal(s.history.length,3);validate(s);if(offer==='none'||offer.startsWith('routine'))assert.equal(s.collective.totals.paid,0);
 const row={seed,path,offer,steps,buys,minCash,meanFatigue:fatigue/days,...s.collective.totals,preparation,skips:skipped,trajectory};rows.push(row);console.log(JSON.stringify(row));
 fs.writeFileSync('tests/v38-balance'+(seeds.length===1?'-'+seed:'')+'.json',JSON.stringify({engine:VERSION,fingerprint,seasons:3,seeds,rows},null,2));
}
