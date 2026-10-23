import {GROUPS} from './config.js?v=3.9.0';
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const finiteTree=x=>typeof x==='number'?Number.isFinite(x):x&&typeof x==='object'?Object.entries(x).every(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&finiteTree(v)):true;
export function initV40(s){
 if(s.v40!==undefined)return;
 s.v40={version:1,sinceDay:s.day,sinceSeason:s.season,roles:{},services:{nextId:1,active:{},history:[],processedDay:null,totals:{}},moments:{mode:'highlights',seen:[],history:[],notice:null},training:{lastDay:null,history:[]}};
}
export function validateV40(s){
 const v=s.v40,fail=()=>{throw Error('Données V4 invalides : import annulé.');};
 if(!object(v)||v.version!==1||!integer(v.sinceDay)||v.sinceDay>s.day||!integer(v.sinceSeason)||v.sinceSeason>s.season||!finiteTree(v))fail();
 const playerIds=new Set(s.players?.map(p=>p.id)||[]);
 if(!object(v.roles)||Object.keys(v.roles).some(id=>!playerIds.has(id)))fail();
 for(const row of Object.values(v.roles)){if(!object(row)||!Array.isArray(row.recent)||row.recent.length>5||!integer(row.seenSeason)||row.seenSeason>s.season||!Array.isArray(row.seen)||row.seen.length>1000||row.seen.some(id=>typeof id!=='string'||id.length>200)||new Set(row.seen).size!==row.seen.length||row.recent.some(r=>!object(r)||typeof r.id!=='string'||!Number.isFinite(r.grade)||r.grade<0||r.grade>100||!integer(r.day)||r.day>s.day))fail();}
 const e=v.services,m=v.moments,t=v.training;
 if(!object(e)||!integer(e.nextId)||e.nextId<1||!object(e.active)||Object.keys(e.active).some(k=>!['recovery','installation','formation'].includes(k))||!Array.isArray(e.history)||e.history.length>24||!object(e.totals))fail();
 for(const [kind,c] of Object.entries(e.active))if(!object(c)||c.kind!==kind)fail();
 for(const c of [...Object.values(e.active),...e.history]){
  if(!object(c)||!integer(c.id)||c.id<1||c.id>=e.nextId||!integer(c.bought)||c.bought>s.day)fail();
  if(!['recovery','installation','proximity','maintenance','formation'].includes(c.kind))fail();
  if(c.kind==='formation'&&(!['coaching','video','physical'].includes(c.domain)||c.price!==3000||c.start!==c.bought+1||!integer(c.sessions)||c.sessions>30||c.hours!==c.sessions*2||c.qualified!==(c.sessions===30)||c.lastDay!==null&&(!integer(c.lastDay)||c.lastDay>s.day||c.lastDay%2!==0)))fail();
  if(c.kind==='installation'&&(!Object.hasOwn(GROUPS,c.domain)||c.price!==20300||!integer(c.start)||c.start>s.day+1||c.end!==c.start+29||!integer(c.sessions)||!integer(c.extraXP)||c.extraXP>c.sessions*8||!integer(c.maintenancePaid)||c.maintenancePaid<300||c.maintenancePaid%300!==0||c.renew!==false||c.lastDay!==null&&(!integer(c.lastDay)||c.lastDay>s.day)))fail();
  if(c.kind==='recovery'&&(!integer(c.start)||!integer(c.end)||![c.bought,c.bought+1].includes(c.start)||c.end!==c.start+29||c.price!==900||typeof c.renew!=='boolean'||!integer(c.days)||c.days>30||!Number.isFinite(c.effect)||c.effect<0||c.effect>c.days||c.lastDay!==null&&(!integer(c.lastDay)||c.lastDay<c.start||c.lastDay>Math.min(s.day,c.end))))fail();
 }
 if(e.qualifications!==undefined&&(!Array.isArray(e.qualifications)||e.qualifications.length>3||new Set(e.qualifications.map(q=>q.domain)).size!==e.qualifications.length||e.qualifications.some(q=>!object(q)||!['coaching','video','physical'].includes(q.domain)||q.hours!==60||!integer(q.day)||q.day>s.day)))fail();
 const property=s.life?.property;if(property?.proximity&&(!object(property.proximity)||property.proximity.paid!==7500||!integer(property.proximity.since)||property.proximity.since>s.day+1))fail();
 for(const value of Object.values(e.totals))if(!Number.isFinite(value)||value<0)fail();
 if(!object(m)||!['highlights','decisions','summary'].includes(m.mode)||!Array.isArray(m.seen)||!Array.isArray(m.history)||m.history.length>80||new Set(m.seen).size!==m.seen.length||m.seen.some(id=>typeof id!=='string'||id.length>200))fail();
 if(!object(t)||!Array.isArray(t.history)||t.history.length>24)fail();
 for(const day of [e.processedDay,t.lastDay])if(day!==null&&(!integer(day)||day>s.day))fail();
 return s;
}
