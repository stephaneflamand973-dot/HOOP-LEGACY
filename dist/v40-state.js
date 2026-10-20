// V4 extension foundation. Runtime integration follows with migration and storage tests.
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const finiteTree=x=>typeof x==='number'?Number.isFinite(x):x&&typeof x==='object'?Object.entries(x).every(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&finiteTree(v)):true;
export function initV40(s){
 if(s.v40!==undefined)return;
 s.v40={version:1,sinceDay:s.day,sinceSeason:s.season,roles:{},
  services:{nextId:1,active:{},history:[],processedDay:null,totals:{}},
  moments:{mode:'highlights',seen:[],history:[],notice:null},
  training:{lastDay:null,history:[]}};
}
export function validateV40(s){
 const v=s.v40,fail=()=>{throw Error('Données V4 invalides : import annulé.');};
 if(!object(v)||v.version!==1||!integer(v.sinceDay)||v.sinceDay>s.day||!integer(v.sinceSeason)||v.sinceSeason<1||v.sinceSeason>s.season||!finiteTree(v))fail();
 if(!object(v.roles))fail();
 const e=v.services,m=v.moments,t=v.training;
 if(!object(e)||!integer(e.nextId)||e.nextId<1||!object(e.active)||!Array.isArray(e.history)||e.history.length>24||!object(e.totals))fail();
 for(const n of Object.values(e.totals))if(!Number.isFinite(n)||n<0)fail();
 if(!object(m)||!['highlights','decisions','summary'].includes(m.mode)||!Array.isArray(m.seen)||!Array.isArray(m.history)||m.history.length>80||new Set(m.seen).size!==m.seen.length||m.seen.some(id=>typeof id!=='string'||id.length>200))fail();
 if(!object(t)||!Array.isArray(t.history)||t.history.length>24)fail();
 for(const day of [e.processedDay,t.lastDay])if(day!==null&&(!integer(day)||day>s.day))fail();
 return s;
}
