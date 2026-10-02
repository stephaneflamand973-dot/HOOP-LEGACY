import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,competition} from '../dist/engine.js';
import {KEYS} from '../dist/config.js';
import * as current from '../dist/match.js';
import * as previous from '../dist/match-v33.js';
const report=[];
for(const pos of ['MJ','AR','AI','AF','P'])for(const level of [65,80,99]){
 const base=createGame({...defaultBuild(),path:'rookie',pos}),g=competition(base).schedule.find(g=>g.home===base.team||g.away===base.team);
 for(const k of KEYS)hero(base).attrs[k]=level;base.minutes=32;base.trust=75;
 const versions={};
 for(const [label,rules] of [['3.3',previous],['3.4',current]]){
  const sums={pts:0,fga:0,fgm:0,ast:0,reb:0,stl:0,blk:0,tov:0,pf:0,min:0,wins:0,teamPoints:0};
  for(let seed=1;seed<=16;seed++){
   const s=structuredClone(base);s.rng.match=seed*7919;const m=rules.startMatch(s,g);rules.stepMatch(s,m,20000);assert.ok(m.done);
   const b=m.box[s.hero];for(const k of Object.keys(sums))if(k in b)sums[k]+=b[k];const side=g.home===s.team?0:1;sums.wins+=Number(m.score[side]>m.score[1-side]);sums.teamPoints+=m.score[side];
   assert.ok(b.min>=0&&b.min<=m.duration+m.ot*5+.001);assert.ok(b.fgm<=b.fga);
   assert.equal(Object.values(m.box).reduce((n,b)=>n+b.pts,0),m.score[0]+m.score[1]);
  }
  versions[label]=Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,+(v/16).toFixed(3)]));
 }
 report.push({pos,level,...versions});
}
fs.writeFileSync(new URL('../tests/v34-balance.json',import.meta.url),JSON.stringify({seeds:16,matches:480,notes:'Paired seeds, uniform attributes, 32 planned minutes. Context changes can change later random draws. These synthetic match samples do not establish season balance.',profiles:report},null,2));
console.log(JSON.stringify(report.filter(r=>r.level===99)));
