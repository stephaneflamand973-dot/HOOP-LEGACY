import {STAGES} from './collective-catalog.js?v=3.8.0';
const own=(o,k)=>o&&Object.hasOwn(o,k);
const safe=id=>typeof id==='string'&&!['__proto__','constructor','prototype'].includes(id);
export const pairKey=(a,b)=>JSON.stringify([a,b].sort());
export function initCollective(s){s.collective??={version:1,routine:'none',partners:[],processedDay:null,team:s.team,duos:{},archived:[],stage:null,nextId:1,history:[],totals:{paid:0,sessions:0,mastery:0,duo:0},recent:[],notice:null};}
export function duoFor(s,teamId,a,b,{create=false}={}){
 const t=s.teams.find(t=>t.id===teamId);if(!safe(teamId)||!safe(a)||!safe(b)||a===b||!t||!t.roster.includes(a)||!t.roster.includes(b))return null;
 if(!s.collective){if(!create)return null;initCollective(s);}
 const e=s.collective,key=pairKey(a,b);if(!own(e.duos,teamId)){if(!create)return null;e.duos[teamId]={};}
 if(!own(e.duos[teamId],key)&&create)e.duos[teamId][key]={ids:[a,b].sort(),score:0,minutes:0,sources:{match:0,routine:0,stage:0}};
 return own(e.duos[teamId],key)?e.duos[teamId][key]:null;
}
export function reconcileCollective(s){
 initCollective(s);const e=s.collective,clubs=new Map(s.teams.map(t=>[t.id,new Set(t.roster)]));
 for(const [tid,duos] of Object.entries(e.duos))for(const [key,d] of Object.entries(duos)){
  if(d.ids.every(id=>clubs.get(tid)?.has(id)))continue;
  if(d.ids.includes(s.hero)){
   e.archived=e.archived.filter(a=>a.team!==tid||pairKey(...a.ids)!==key);
   e.archived.push({...structuredClone(d),team:tid,closed:s.day});
  }delete duos[key];
 }
 e.archived.sort((a,b)=>a.closed-b.closed||a.team.localeCompare(b.team)||pairKey(...a.ids).localeCompare(pairKey(...b.ids)));e.archived=e.archived.slice(-50);
 e.archived=e.archived.filter(a=>{
  if(a.team!==s.team||!a.ids.every(id=>clubs.get(a.team)?.has(id)))return true;
  const d=duoFor(s,a.team,...a.ids,{create:true});Object.assign(d,{ids:[...a.ids],score:a.score*.75,minutes:a.minutes,sources:{...a.sources}});return false;
 });
 const selected=e.partners.filter(id=>id!==s.hero&&clubs.get(s.team)?.has(id));
 if(selected.length!==e.partners.length)e.notice='Un partenaire a quitté votre effectif. Sélection mise à jour.';
 e.partners=selected;e.team=s.team;
}
export function validateCollective(s){
 const e=s.collective,fail=()=>{throw Error('Collectif invalide');},finite=x=>Number.isFinite(x)&&x>=0,date=x=>Number.isSafeInteger(x)&&x>=0&&x<=s.day;
 if(!e||e.version!==1||!['none','video','tactical','partners'].includes(e.routine)||!Array.isArray(e.partners)||e.partners.length>2||new Set(e.partners).size!==e.partners.length||e.processedDay!==null&&!date(e.processedDay)||e.team!==s.team||!e.duos||Array.isArray(e.duos)||!Array.isArray(e.archived)||e.archived.length>50||!Array.isArray(e.history)||e.history.length>24||!Array.isArray(e.recent)||e.recent.length>24||!Number.isSafeInteger(e.nextId)||e.nextId<1||e.stage===undefined||!e.totals||['paid','sessions','mastery','duo'].some(k=>!finite(e.totals[k]))||!Number.isSafeInteger(e.totals.sessions)||e.notice!==null&&(typeof e.notice!=='string'||e.notice.length>500))fail();
 const clubs=new Map(s.teams.map(t=>[t.id,new Set(t.roster)])),people=new Set([...s.players.map(p=>p.id),...Object.keys(s.world?.people||{})]);
 if(e.partners.some(id=>!safe(id)||id===s.hero||!clubs.get(s.team)?.has(id)))fail();
 let lastDay=-1;
 for(const r of e.recent){
  if(!r||!date(r.day)||r.day<=lastDay||!['none','video','tactical','partners'].includes(r.mode)||r.stageId!==null&&(!Number.isSafeInteger(r.stageId)||r.stageId<1||r.stageId>=e.nextId)||typeof r.reason!=='string'||r.reason.length>500||!finite(r.mastery)||!finite(r.duo)||!finite(r.fatigue)||r.fatigue>2||!Array.isArray(r.partners)||r.partners.length>2||new Set(r.partners).size!==r.partners.length||r.partners.some(id=>!safe(id)||id===s.hero||!people.has(id)))fail();
  const max=r.stageId===null?(r.mode==='video'?.2:r.mode==='tactical'?.35:r.mode==='partners'?.5:0):(STAGES[r.mode]?.gain||0);
  if(r.mastery>max+1e-8||r.duo>max*r.partners.length+1e-8||(r.mode==='partners'?r.mastery!==0:r.duo!==0)||r.reason&&(r.mastery!==0||r.duo!==0||r.fatigue!==0)||['none','video'].includes(r.mode)&&r.fatigue!==0)fail();
  lastDay=r.day;
 }
 const check=d=>{if(!d||!Array.isArray(d.ids)||d.ids.length!==2||d.ids[0]>=d.ids[1]||d.ids.some(id=>!safe(id)||!people.has(id))||!finite(d.score)||d.score>100||!finite(d.minutes)||!d.sources||['match','routine','stage'].some(k=>!finite(d.sources[k])))fail();};
 for(const [tid,duos] of Object.entries(e.duos)){if(!safe(tid)||!clubs.has(tid)||!duos||Array.isArray(duos))fail();for(const [key,d] of Object.entries(duos)){check(d);if(key!==pairKey(...d.ids)||!d.ids.every(id=>clubs.get(tid).has(id)))fail();}}
 const seen=new Set();for(const a of e.archived){check(a);const key=JSON.stringify([a.team,...a.ids]);if(!clubs.has(a.team)||!a.ids.includes(s.hero)||!date(a.closed)||seen.has(key))fail();seen.add(key);}
 const stages=[...e.history,...(e.stage?[e.stage]:[])],ids=new Set();let previous=null,paid=0,sessions=0,mastery=0,duo=0;
 for(const c of stages){
  const o=own(STAGES,c?.offerId)?STAGES[c.offerId]:null,archived=c!==e.stage;
  if(!o||c.catalogVersion!==1||!Number.isSafeInteger(c.id)||c.id<1||c.id>=e.nextId||ids.has(c.id)||!clubs.has(c.team)||!date(c.bought)||c.start!==c.bought+1||c.end!==c.bought+o.days||c.price!==o.price||!Array.isArray(c.partners)||new Set(c.partners).size!==c.partners.length||c.partners.some(id=>id===s.hero||!people.has(id))||(c.offerId==='partners'?(c.partners.length<1||c.partners.length>2):c.partners.length!==0)||!Array.isArray(c.estimatedSlots)||!c.estimatedSlots.length||c.estimatedSlots.some((day,i)=>!Number.isSafeInteger(day)||day<c.start||day>c.end||day%2!==0||i>0&&day<=c.estimatedSlots[i-1])||!Number.isSafeInteger(c.sessions)||c.sessions<0||c.sessions>Math.max(0,Math.floor(Math.min(s.day,c.end)/2)-Math.floor((c.start-1)/2))||!finite(c.mastery)||!finite(c.duo)||c.mastery>c.sessions*o.gain+1e-8||c.duo>c.sessions*o.gain*c.partners.length+1e-8||!c.skips||Object.values(c.skips).some(n=>!Number.isSafeInteger(n)||n<0))fail();
  if(c.offerId==='partners'?c.mastery!==0:c.duo!==0)fail();
  if(archived?(!date(c.closed)||c.closed<c.bought||typeof c.reason!=='string'||c.reason.length>500):(c.team!==s.team||c.end<s.day||s.retired))fail();
  if(previous&&(c.id<=previous.id||c.bought<previous.closed))fail();
  ids.add(c.id);paid+=c.price;sessions+=c.sessions;mastery+=c.mastery;duo+=c.duo;previous=c;
 }
 if(e.nextId-1<stages.length||e.totals.paid<paid||e.totals.sessions<sessions||e.totals.mastery+1e-8<mastery||e.totals.duo+1e-8<duo)fail();
 if(e.nextId<=25&&(stages.length!==e.nextId-1||e.totals.paid!==paid||e.totals.sessions!==sessions||Math.abs(e.totals.mastery-mastery)>1e-8||Math.abs(e.totals.duo-duo)>1e-8))fail();
}
