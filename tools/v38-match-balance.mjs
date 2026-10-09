import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {createGame,defaultBuild,competition} from '../dist/engine.js';import {startMatch,stepMatch} from '../dist/match.js';import {duoFor} from '../dist/collective-state.js';import {collectiveEffect} from '../dist/collective-match.js';import {VERSION} from '../dist/config.js';
const fingerprint=crypto.createHash('sha256').update(['match','collective-match','collective-state','config'].map(n=>fs.readFileSync('dist/'+n+'.js','utf8')).join('')).digest('hex');
const rows=[];
for(let seed=1;seed<=400;seed++){
 const baseline=createGame({...defaultBuild(),path:'rookie',seed}),game=competition(baseline).schedule[0];
 for(const inverted of [false,true])for(const score of [0,50,100]){
  const s=structuredClone(baseline),g={...game,...(inverted?{home:game.away,away:game.home}:{})};
  // Prepare one fixed club; swap home/away to test both orientations.
  const ids=s.teams.find(t=>t.id===game.home).roster;
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)duoFor(s,game.home,ids[i],ids[j],{create:true}).score=score;
  const m=startMatch(s,g),effect=collectiveEffect(m,game.home,ids[0],ids[1]);assert.equal(effect.shot,score*.00005);assert.equal(collectiveEffect(m,game.home,ids[1],ids[0]).shot,effect.shot);stepMatch(s,m,20000);assert.ok(m.done);
  for(const e of Object.values(m.collective.effects)){assert.ok(e.shotSum<=.005*e.shotActions+1e-8);assert.ok(e.turnoverSum>=-.005*e.turnoverActions-1e-8);}
  const index=inverted?1:0;
  const stats=ids.map(id=>m.box[id]).filter(Boolean),sum=k=>stats.reduce((n,p)=>n+(p[k]||0),0);
  rows.push({seed,inverted,score,points:m.score[index],against:m.score[1-index],turnovers:sum('tov'),fgm:sum('fgm'),fga:sum('fga'),win:m.score[index]>m.score[1-index]});
 }
 if(seed%50===0)console.log('paired seeds',seed);
}
const summarize=values=>{const sorted=[...values].sort((a,b)=>a-b);return {mean:values.reduce((a,b)=>a+b,0)/values.length,p05:sorted[Math.floor(sorted.length*.05)],p95:sorted[Math.floor(sorted.length*.95)],min:sorted[0],max:sorted.at(-1)};};
const comparisons=[];for(const score of [50,100])for(const inverted of [false,true]){const subset=rows.filter(r=>r.score===score&&r.inverted===inverted),base=rows.filter(r=>r.score===0&&r.inverted===inverted);comparisons.push({score,inverted,pointDelta:summarize(subset.map((r,i)=>r.points-base[i].points)),turnoverDelta:summarize(subset.map((r,i)=>r.turnovers-base[i].turnovers)),fgRate:subset.reduce((n,r)=>n+r.fgm,0)/subset.reduce((n,r)=>n+r.fga,0),wins:subset.filter(r=>r.win).length,baselineWins:base.filter(r=>r.win).length});}
assert.equal(rows.length,2400);fs.writeFileSync('tests/v38-match-balance.json',JSON.stringify({engine:VERSION,fingerprint,seeds:400,matches:rows.length,comparisons,note:'Intervalles descriptifs des écarts appariés, pas des garanties. Une divergence de possession change la trajectoire des tirages ultérieurs.',rows},null,2));console.log(JSON.stringify(comparisons));
