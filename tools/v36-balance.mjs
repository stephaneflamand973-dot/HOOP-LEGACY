import fs from 'node:fs';import assert from 'node:assert/strict';import {createGame,defaultBuild,hero,competition} from '../dist/engine.js';import {KEYS,VERSION} from '../dist/config.js';import {startMatch,stepMatch} from '../dist/match.js';
const profiles=[],seeds=32;
for(const pos of ['MJ','AR','AI','AF','P'])for(const level of [65,80,99]){
 const base=createGame({...defaultBuild(),path:'rookie',pos}),player=hero(base),id=player.id,club=base.team,g=competition(base).schedule.find(g=>g.home===club||g.away===club);for(const k of KEYS)player.attrs[k]=level;const contexts={};
 for(const label of ['neutral','maximal','ai']){const sum={pts:0,min:0,fga:0,fgm:0,tov:0,wins:0,teamPoints:0};
  for(let seed=1;seed<=seeds;seed++){const s=structuredClone(base);s.rng.match=seed*7919;s.minutes=32;s.trust=50;s.system=45;s.iq=55;s.relationships.team=50;s.life.morale=50;
   if(label==='maximal'){s.trust=100;s.system=100;s.iq=100;s.relationships.team=100;s.life.morale=100;}
   if(label==='ai'){const observer=s.teams.find(t=>t.id!==g.home&&t.id!==g.away);s.hero=observer.roster[0];s.team=observer.id;}
   const m=startMatch(s,g);stepMatch(s,m,20000);assert.ok(m.done);const b=m.box[id],side=g.home===club?0:1;for(const k of ['pts','min','fga','fgm','tov'])sum[k]+=b[k];sum.wins+=Number(m.score[side]>m.score[1-side]);sum.teamPoints+=m.score[side];assert.ok(b.min<=m.duration+m.ot*5+.001);assert.ok(b.fgm<=b.fga);assert.equal(Object.values(m.box).reduce((n,b)=>n+b.pts,0),m.score[0]+m.score[1]);
  }
  contexts[label]={...Object.fromEntries(Object.entries(sum).map(([k,v])=>[k,+(v/seeds).toFixed(3)])),pointsPer36:+(sum.pts/sum.min*36).toFixed(2),fieldGoalPercent:+(100*sum.fgm/sum.fga).toFixed(2)};
 }profiles.push({pos,level,...contexts});
}
const report={engine:VERSION,rules:'3.5.0',seeds,matches:profiles.length*3*seeds,notes:'Synthetic paired initial seeds; changing context changes subsequent draws. Heroes plan 32 minutes; AI decides its minutes. Uniform attributes and no equipped techniques. Not a test of long-term championship balance.',profiles};fs.writeFileSync(new URL('../tests/v36-balance.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify({matches:report.matches,level99:profiles.filter(p=>p.level===99)}));
