import {WEIGHTS,KEYS} from './config.js?v=4.0.0';
import {leagueDef} from './leagues.js?v=4.0.0';
import {V40_RULES} from './v40-rules.js?v=4.0.0';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const overall=p=>Math.round(KEYS.reduce((n,k)=>n+p.attrs[k]*(WEIGHTS[p.pos]?.[k]||.35),0)/KEYS.reduce((n,k)=>n+(WEIGHTS[p.pos]?.[k]||.35),0));
export const roleLabel=n=>n>=33?'Joueur majeur':n>=27?'Titulaire':n>=23?'Sixième homme':n>=17?'Rotation':'Développement';
export function projectRole(s,playerId,teamId){
 const p=s.players.find(p=>p.id===playerId),t=s.teams.find(t=>t.id===teamId);if(!p||!t)throw Error('Projection : joueur ou club inconnu.');
 const def=leagueDef(t.league),ids=new Set(t.roster),rivals=s.players.filter(q=>ids.has(q.id)&&q.id!==p.id&&q.pos===p.pos&&!q.injury).map(q=>({id:q.id,name:q.name,level:overall(q)})).sort((a,b)=>b.level-a.level||a.id.localeCompare(b.id));
 const rival=rivals[0]?.level??def.level,recent=s.v40?.roles[p.id]?.recent||[],form=recent.length>=3?recent.reduce((n,r)=>n+r.grade,0)/recent.length:50;
 const r=V40_RULES.role,trust=p.id===s.hero?s.trust:50,mastery=p.id===s.hero&&teamId===s.team?s.system:50;
 const contributions={base:r.base,level:(overall(p)-rival)*r.level,trust:(trust-50)*r.trust,form:(form-50)*r.form,mastery:(mastery-50)*r.mastery};
 const available=p.injury?0:p.returning?.65:1,raw=Object.values(contributions).reduce((a,b)=>a+b,0),minutes=Math.round(clamp(raw,r.min,Math.min(r.max,def.minutes-4))*available);
 return {minutes,role:roleLabel(minutes),contributions,availability:available,rivals,rival,level:overall(p),form,raw};
}
export function recordRoleMatch(s,g,m){
 if(!s.v40||!m.done)return;
 const ids=new Set(s.players.map(p=>p.id));
 for(const b of Object.values(m.box)){
  if(!b.min||!ids.has(b.id))continue;
  const row=s.v40.roles[b.id]??={recent:[],seenSeason:s.season,seen:[]};
  if(row.seenSeason!==s.season){row.seenSeason=s.season;row.seen=[];}
  if(row.seen.includes(g.id))continue;
  const grade=clamp(50+25*(((b.pts+.9*b.ast+.5*b.reb+1.6*(b.stl+b.blk)-1.1*b.tov-.65*(b.fga-b.fgm))/Math.max(8,b.min*.62))-1),0,100);
  row.seen.push(g.id);row.recent.push({id:g.id,grade,day:s.day});row.recent=row.recent.slice(-5);
  const club=[m.home,m.away].find(id=>s.teams.find(t=>t.id===id)?.roster.includes(b.id));
  if(club){const q=projectRole(s,b.id,club),prior=Object.values(m.rotation||{}).flat().find(r=>r.playerId===b.id)?.score??q.minutes;row.rotationMinutes=q.availability===1?clamp(q.minutes,Math.max(0,prior-2),prior+2):q.minutes;}
 }
}
export function applyRole(s,reason='match'){
 const q=projectRole(s,s.hero,s.team),before=s.minutes;
 s.minutes=reason==='match'&&q.availability===1?clamp(q.minutes,Math.max(0,before-2),before+2):q.minutes;s.role=roleLabel(s.minutes);if(s.v40?.roles[s.hero])s.v40.roles[s.hero].rotationMinutes=s.minutes;
 s.roleReason=`Niveau ${q.level} ; concurrence ${q.rival} ; confiance ${Math.round(s.trust)}/100 ; forme ${Math.round(q.form)}/100 ; maîtrise ${Math.round(s.system)}/100. ${before} → ${s.minutes} minutes projetées (${reason==='match'?'évolution après match':reason==='transfer'?'changement de club':'disponibilité ou effectif'}), sans garantie de temps joué.`;
 return q;
}
export function rotationPlan(s,teamId,duration){
 const t=s.teams.find(t=>t.id===teamId);if(!t)throw Error('Club inconnu.');
 const rows=t.roster.map(id=>s.players.find(p=>p.id===id)).filter(p=>p&&!p.injury).map(p=>{const q=projectRole(s,p.id,teamId);return {playerId:p.id,targetMinutes:0,score:Math.max(1,q.availability!==1?q.minutes:p.id===s.hero?s.minutes:s.v40?.roles[p.id]?.rotationMinutes??q.minutes)};});
 let remaining=Math.min(5,rows.length)*duration,free=[...rows];
 while(free.length&&remaining>1e-9){const weight=free.reduce((n,r)=>n+r.score,0),capped=free.filter(r=>remaining*r.score/weight>=duration);if(!capped.length){for(const r of free)r.targetMinutes=remaining*r.score/weight;break;}for(const r of capped){r.targetMinutes=duration;remaining-=duration;}free=free.filter(r=>!capped.includes(r));}
 return rows;
}
export function validateRotation(m){
 if(m?.rulesVersion!=='4.0.0')return;
 const fail=()=>{throw Error('Rotation de match invalide');};
 if(!m.rotation||typeof m.rotation!=='object'||Array.isArray(m.rotation)||Object.keys(m.rotation).length!==2)fail();
 const all=new Set();
 for(const id of [m.home,m.away]){
  const rows=m.rotation[id];if(!Array.isArray(rows)||rows.length>20)fail();let sum=0;
  for(const r of rows){if(!r||typeof r.playerId!=='string'||!Object.hasOwn(m.box,r.playerId)||all.has(r.playerId)||!Number.isFinite(r.targetMinutes)||r.targetMinutes<0||r.targetMinutes>m.duration||!Number.isFinite(r.score)||r.score<1||r.score>48)fail();all.add(r.playerId);sum+=r.targetMinutes;}
  if(Math.abs(sum-Math.min(5,rows.length)*m.duration)>1e-6)fail();
 }
}
