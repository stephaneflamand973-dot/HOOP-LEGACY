import {MANDATES,validMandate} from './representation-catalog.js?v=3.8.0';
import {negotiationLimits,evaluateCounter} from './negotiation-rules.js?v=3.8.0';

export function initRepresentation(s){
 if(s.representation===undefined)s.representation={version:1,mandate:'self',nextId:1,session:null,contract:null,history:[],totals:{commission:0}};
 return s.representation;
}
export function appendNegotiation(s,entry){
 const r=s.representation;r.history.push(structuredClone(entry));r.history=r.history.slice(-40);
}
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const nonnegative=x=>Number.isFinite(x)&&x>=0;
const money=x=>nonnegative(x)&&Number.isSafeInteger(Math.round(x*100))&&Math.abs(x*100-Math.round(x*100))<.001;
const text=x=>typeof x==='string'&&x.length>0&&x.length<=500;
const identifier=x=>typeof x==='string'&&/^[a-zA-Z0-9-]{1,150}$/.test(x);
const terms=x=>object(x)&&money(x.salary)&&Number.isInteger(x.years)&&x.years>=1&&x.years<=4;
export function validateRepresentation(s){
 const fail=()=>{throw Error('Représentation invalide');},r=s.representation;
 if(!object(r)||r.version!==1||!validMandate(r.mandate)||!Number.isSafeInteger(r.nextId)||r.nextId<1||!object(r.totals)||!money(r.totals.commission)||!Array.isArray(r.history)||r.history.length>40)fail();
 const id=x=>Number.isSafeInteger(x)&&x>0&&x<r.nextId;
 const day=x=>Number.isSafeInteger(x)&&x>=0&&x<=s.day;
 const clubs=new Set((s.teams||[]).map(t=>t.id));
 if(r.contract!==null){const c=r.contract;
  if(!object(c)||!id(c.id)||!identifier(c.offerId)||!clubs.has(c.team)||!validMandate(c.mandate)||c.rate!==MANDATES[c.mandate].rate||!day(c.started)||!money(c.commission)||c.commission>r.totals.commission)fail();
 }
 let previous=-1;
 for(const e of r.history){
  if(!object(e)||!['counter','signed','closed'].includes(e.kind)||!day(e.day)||e.day<previous||!(e.sessionId===null||id(e.sessionId))||!identifier(e.offerId)||!clubs.has(e.team)||!validMandate(e.mandate)||!terms(e)||!money(e.commission)||!text(e.outcome))fail();
  previous=e.day;
 }
 if(r.session!==null){const session=r.session;
  if(!object(session)||!id(session.id)||!day(session.day)||!validMandate(session.mandate)||!Array.isArray(session.offers)||!session.offers.length||s.pending?.type!=='contract'||!Array.isArray(s.offers)||session.offers.length!==s.offers.length)fail();
  const seen=new Set();
  for(const e of session.offers){
   if(!object(e)||!identifier(e.offerId)||seen.has(e.offerId)||!terms(e.initial)||!terms(e.current)||typeof e.eligible!=='boolean'||!Number.isInteger(e.attempts)||e.attempts<0||e.attempts>2||e.revision!==e.attempts)fail();
   const o=s.offers.find(o=>o.id===e.offerId);
   if(!o||o.salary!==e.initial.salary||o.years!==e.initial.years||!clubs.has(o.team)||!object(e.limits))fail();
   if(!e.eligible&&(e.attempts!==0||e.current.salary!==e.initial.salary||e.current.years!==e.initial.years))fail();
   if(e.eligible){
    let limits;try{limits=negotiationLimits(e.limits);}catch{fail();}
    if(limits.mandate!==session.mandate||limits.salary!==e.initial.salary||limits.years!==e.initial.years||Object.keys(limits).some(k=>limits[k]!==e.limits[k]))fail();
    if(e.attempts===0&&(e.current.salary!==e.initial.salary||e.current.years!==e.initial.years))fail();
    const outcomes=[];
    for(const raise of [0,5,10,15])for(let years=Math.max(1,e.initial.years-1);years<=Math.min(4,e.initial.years+1);years++)outcomes.push(evaluateCounter(e.initial,e.initial,limits,{raise,years}));
    if(!outcomes.some(o=>o.salary===e.current.salary&&o.years===e.current.years))fail();
   }
   seen.add(e.offerId);
  }
 }
 return s;
}
