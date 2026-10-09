import {initCollective,duoFor,pairKey} from './collective-state.js?v=3.8.0';
export function snapshotCollective(s,m){
 initCollective(s);const c={version:1,scores:{},minutes:{},effects:{},applied:false};
 for(const tid of [m.home,m.away]){c.scores[tid]={};c.minutes[tid]={};c.effects[tid]={passes:0,turnoverActions:0,shotActions:0,turnoverSum:0,shotSum:0};const ids=s.teams.find(t=>t.id===tid).roster;for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)c.scores[tid][pairKey(ids[i],ids[j])]=duoFor(s,tid,ids[i],ids[j])?.score||0;}
 return c;
}
export function recordSharedPossession(m,lineups){
 const c=m.collective;if(!c||m.done)return;const dt=m.duration/m.regulation;
 for(const tid of [m.home,m.away]){const ids=lineups[tid];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const key=pairKey(ids[i],ids[j]);c.minutes[tid][key]=(c.minutes[tid][key]||0)+dt;}}
}
export function collectiveEffect(m,teamId,handlerId,shooterId){
 const score=handlerId===shooterId?0:m.collective?.scores?.[teamId]?.[pairKey(handlerId,shooterId)]||0;
 const effect=Math.max(0,Math.min(100,score))*.00005;return {turnover:effect?-effect:0,shot:effect};
}
export function finishCollectiveMatch(s,m){
 const c=m.collective;if(!m.done||!c||c.applied)return;c.applied=true;initCollective(s);c.gains={};
 for(const tid of [m.home,m.away]){c.gains[tid]={};for(const [key,minutes] of Object.entries(c.minutes[tid])){
  const d=duoFor(s,tid,...JSON.parse(key),{create:true});if(!d)continue;
  const gain=Math.min(100-d.score,.04*minutes*(1-c.scores[tid][key]/100));d.score+=gain;d.minutes+=minutes;d.sources.match+=gain;c.gains[tid][key]=gain;
 }}
}
export function collectiveSummary(m,heroId){
 if(!m.collective)return null;const c=m.collective,duos=[];
 for(const tid of [m.home,m.away])for(const [key,minutes] of Object.entries(c.minutes[tid])){const ids=JSON.parse(key);if(ids.includes(heroId))duos.push({team:tid,ids,minutes,gain:c.gains?.[tid]?.[key]||0});}
 return {version:1,effects:structuredClone(c.effects),duos};
}
export function validateCollectiveMatch(s,m){
 if(!m||m.rulesVersion!=='3.8.0')return;
 const c=m.collective,fail=()=>{throw Error('Collectif de match invalide');},finite=x=>Number.isFinite(x)&&x>=0;
 if(!c||c.version!==1||typeof c.applied!=='boolean'||c.applied&&!m.done||!c.scores||!c.minutes||!c.effects||!finite(m.duration)||m.duration<=0||!Number.isSafeInteger(m.regulation)||m.regulation<=0||!Number.isSafeInteger(m.n)||m.n<0)fail();
 for(const map of [c.scores,c.minutes,c.effects])if(Object.keys(map).length!==2||!Object.hasOwn(map,m.home)||!Object.hasOwn(map,m.away))fail();
 for(const tid of [m.home,m.away]){
  const ids=s.teams.find(t=>t.id===tid)?.roster,valid=new Set();if(!ids)fail();
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const k=pairKey(ids[i],ids[j]);valid.add(k);const score=c.scores[tid]?.[k];if(!finite(score)||score>100)fail();}
  if(Object.keys(c.scores[tid]).some(k=>!valid.has(k))||!c.minutes[tid])fail();
  for(const [k,n] of Object.entries(c.minutes[tid]))if(!valid.has(k)||!finite(n)||n>m.n*m.duration/m.regulation+1e-7)fail();
  const e=c.effects[tid];if(!e||['passes','turnoverActions','shotActions'].some(k=>!Number.isSafeInteger(e[k])||e[k]<0||e[k]>m.n)||e.turnoverActions>e.passes||e.shotActions>e.turnoverActions||!Number.isFinite(e.turnoverSum)||e.turnoverSum>1e-8||e.turnoverSum<-.005*e.turnoverActions-1e-8||!finite(e.shotSum)||e.shotSum>.005*e.shotActions+1e-8)fail();
 }
}
