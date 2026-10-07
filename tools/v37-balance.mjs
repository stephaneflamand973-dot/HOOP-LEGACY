import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,next,decide,sign,validate,overall} from '../dist/engine.js';
import {hasSportPause,acknowledgeSport} from '../dist/sport-events.js';
import {hireCoach,setCoachRenewal,coachQuote} from '../dist/environment.js';
const fingerprint=crypto.createHash('sha256').update(['environment','finance','progression','engine','config'].map(n=>fs.readFileSync('dist/'+n+'.js','utf8')).join('')).digest('hex');
const rows=[],seeds=process.argv.length>2?process.argv.slice(2).map(Number):[2026,973];
for(const seed of seeds)for(const path of ['highschool','rookie'])for(const offer of [null,'local','confirmed','expert']){
 const s=createGame({...defaultBuild(),seed,path:path==='highschool'?'young':path});assert.equal(s.career.stage,path==='highschool'?'highschool':'pro');s.trainingPlan.domain='Tir';s.life.delegated=true;s.life.policies={routine:'family',media:'team',agent:'local'};let steps=0,minCash=s.money,trajectory=[],lastPaid=0;
 while(s.season<=3&&!s.retired&&steps++<6000){
  if(offer&&!s.environment.contract&&coachQuote(s,offer,'Tir').ok){assert.ok(hireCoach(s,offer,'Tir'));assert.ok(setCoachRenewal(s,true));assert.ok(s.money>=s.life.finance.reserve);}
  if(hasSportPause(s))acknowledgeSport(s);
  else if(s.pending){if(s.pending.type==='contract'){const i=s.offers.findIndex(o=>o.league==='nba');sign(s,i<0?0:i);}else decide(s,s.pending.type==='draft-choice'?'draft':s.pending.type==='offseason'?'shoot':s.pending.choices[0][0]);}
  else next(s,{interactive:false,untilDay:s.day+1});
  minCash=Math.min(minCash,s.money);assert.ok(Number.isFinite(s.money)&&s.money>=0);assert.ok(Object.values(hero(s).attrs).every(n=>Number.isFinite(n)&&n<=99));
  const f=s.life.finance;assert.ok(Math.abs(s.money-f.start.cash-f.totals.cash)<.02);assert.ok(s.environment.history.length<=24);
  if(s.environment.totals.paid>lastPaid){assert.ok(s.environment.contract);lastPaid=s.environment.totals.paid;}
  if(s.history.length>trajectory.length){validate(s);trajectory.push({season:s.history.length,overall:overall(hero(s)),three:hero(s).attrs.three,mid:hero(s).attrs.mid,free:hero(s).attrs.free,money:s.money,...s.environment.totals});}
 }
 assert.equal(s.history.length,3);validate(s);if(!offer)assert.deepEqual(s.environment.totals,{paid:0,sessions:0,extraXP:0});
 const row={seed,path,offer:offer||'none',steps,minCash,...s.environment.totals,trajectory};rows.push(row);console.log(JSON.stringify(row));
 fs.writeFileSync('tests/v37-balance'+(seeds.length===1?'-'+seed:'')+'.json',JSON.stringify({engine:'3.7.0',fingerprint,seasons:3,rows},null,2));
}
