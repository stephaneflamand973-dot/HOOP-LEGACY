import {GROUPS} from './config.js?v=3.7.0';
import {canChange} from './commands.js?v=3.7.0';
import {receipt,cents} from './finance.js?v=3.7.0';

export const COACHES=Object.freeze({
 local:Object.freeze({name:'Coach de proximité',price:300,rate:.1}),
 confirmed:Object.freeze({name:'Coach confirmé',price:1200,rate:.15}),
 expert:Object.freeze({name:'Coach expert',price:4000,rate:.2})
});
const offerFor=id=>Object.hasOwn(COACHES,id)?COACHES[id]:null;
const player=s=>s.players.find(p=>p.id===s.hero);
const capped=(s,domain)=>GROUPS[domain].every(k=>player(s).attrs[k]>=99);
export function initEnvironment(s){
 s.environment??={version:1,nextId:1,contract:null,renew:false,processedDay:null,lastTrainingDay:null,history:[],totals:{paid:0,sessions:0,extraXP:0},notice:null};
}
export function coachQuote(s,offerId,domain){
 const offer=offerFor(offerId),validDomain=Object.hasOwn(GROUPS,domain),reserve=s.life.finance.reserve;
 const q={ok:false,reason:'',offerId,domain,price:offer?.price??null,rate:offer?.rate??null,start:s.day+1,end:s.day+30,balanceAfter:offer?cents(s.money-offer.price):null,reserve};
 if(!offer||!validDomain)q.reason='Offre ou spécialité inconnue.';
 else if(!canChange(s))q.reason='Action indisponible pendant un match, une décision ou après la retraite.';
 else if(s.environment?.contract)q.reason='Un coach est déjà réservé pour cette période.';
 else if(capped(s,domain))q.reason='Toutes les compétences de ce domaine sont à 99.';
 else if(q.balanceAfter<reserve)q.reason='Fonds insuffisants après maintien de votre réserve.';
 else q.ok=true;
 return q;
}
function beginPeriod(s,offerId,domain,start){
 const e=s.environment,o=offerFor(offerId),id=e.nextId++;
 s.money=cents(s.money-o.price);receipt(s,`${o.name} · période #${id}`,-o.price);
 e.contract={id,catalogVersion:1,offerId,domain,price:o.price,rate:o.rate,bought:s.day,start,end:start+29,lastSessionDay:null,sessions:0,extraXP:0};
 e.totals.paid=cents(e.totals.paid+o.price);e.notice=null;
}
export function hireCoach(s,offerId,domain,{busy=false}={}){
 if(!canChange(s,{busy}))return false;
 const q=coachQuote(s,offerId,domain);if(!q.ok)return false;
 initEnvironment(s);beginPeriod(s,offerId,domain,q.start);s.environment.renew=false;return true;
}
export function setCoachRenewal(s,enabled,{busy=false}={}){
 if(!canChange(s,{busy})||typeof enabled!=='boolean'||!s.environment?.contract||s.day>s.environment.contract.end)return false;
 s.environment.renew=enabled;return true;
}
export function closeEnvironment(s,reason){
 const e=s.environment;if(!e?.contract)return;
 e.history.push({...e.contract,closed:s.day,reason});e.history=e.history.slice(-24);e.contract=null;e.renew=false;e.notice=reason;
}
export function environmentDay(s){
 initEnvironment(s);const e=s.environment;
 if(s.retired){closeEnvironment(s,'La retraite termine votre accompagnement.');return;}
 if(e.processedDay===s.day)return;e.processedDay=s.day;
 const c=e.contract;if(!c||s.day<=c.end)return;
 const renew=e.renew;closeEnvironment(s,'Période terminée, sans remboursement.');
 if(!renew)return;
 if(capped(s,c.domain)){e.notice='Renouvellement arrêté : domaine entièrement à 99.';return;}
 if(cents(s.money-offerFor(c.offerId).price)<s.life.finance.reserve){e.notice='Renouvellement arrêté : fonds insuffisants après maintien de votre réserve.';return;}
 beginPeriod(s,c.offerId,c.domain,s.day);e.renew=true;e.notice='Coach renouvelé pour 30 jours.';
}
export function coachTraining(s,p,raw){
 const amounts={...raw},e=s.environment,c=e?.contract;
 if(!c||s.retired||s.day<c.start||s.day>c.end||c.lastSessionDay===s.day||p.injury||s.activity==='repos'||s.day%2!==0||s.trainingPlan.domain!==c.domain||capped(s,c.domain))return {amounts,extraXP:0,assisted:false};
 const extraXP=Math.round(raw[c.domain]*(1+c.rate))-Math.round(raw[c.domain]);amounts[c.domain]=raw[c.domain]*(1+c.rate);
 c.lastSessionDay=s.day;c.sessions++;c.extraXP+=extraXP;e.totals.sessions++;e.totals.extraXP+=extraXP;
 return {amounts,extraXP,assisted:true};
}
export function validateEnvironment(s){
 const e=s.environment,integer=n=>Number.isSafeInteger(n)&&n>=0,date=n=>integer(n)&&n<=s.day,optionalDate=n=>n===null||date(n);
 const fail=()=>{throw Error('Environnement invalide');};
 if(!e||e.version!==1||!integer(e.nextId)||e.nextId<1||typeof e.renew!=='boolean'||!optionalDate(e.processedDay)||!optionalDate(e.lastTrainingDay)||e.lastTrainingDay!==null&&e.lastTrainingDay%2!==0||!Array.isArray(e.history)||e.history.length>24||!e.totals||['paid','sessions','extraXP'].some(k=>!integer(e.totals[k]))||e.notice!==null&&(typeof e.notice!=='string'||e.notice.length>500)||e.contract===undefined||!e.contract&&e.renew)fail();
 const periods=[...e.history,...(e.contract?[e.contract]:[])],ids=new Set();let paid=0,sessions=0,extraXP=0,previous=null;
 if(e.totals.extraXP>(s.development?.sources?.training??0))fail();
 for(const c of periods){
  if(!c||!integer(c.id)||c.id<1||c.id>=e.nextId||ids.has(c.id)||c.catalogVersion!==1||!offerFor(c.offerId)||!Object.hasOwn(GROUPS,c.domain))fail();
  const o=offerFor(c.offerId),archived=c!==e.contract;
  // At most 38 raw XP in the coached domain (hard pro training plus video).
  if(c.extraXP>c.sessions*Math.ceil(38*o.rate)||!archived&&c.end<s.day)fail();
  if(c.price!==o.price||c.rate!==o.rate||!date(c.bought)||!integer(c.start)||!integer(c.end)||![c.bought,c.bought+1].includes(c.start)||c.end!==c.start+29||!integer(c.sessions)||c.sessions>15||!integer(c.extraXP)||!optionalDate(c.lastSessionDay))fail();
  if(c.sessions===0&&(c.lastSessionDay!==null||c.extraXP!==0)||c.sessions>0&&(c.lastSessionDay===null||c.lastSessionDay<c.start||c.lastSessionDay>c.end||c.lastSessionDay%2!==0||c.sessions>Math.floor(c.lastSessionDay/2)-Math.floor((c.start-1)/2)||e.lastTrainingDay===null||c.lastSessionDay>e.lastTrainingDay))fail();
  if(archived&&(!date(c.closed)||c.closed<c.bought||c.lastSessionDay!==null&&c.closed<c.lastSessionDay||typeof c.reason!=='string'||c.reason.length>500))fail();
  if(archived&&c.closed<c.end&&(!s.retired||c!==e.history.at(-1)))fail();
  if(previous&&(c.id<=previous.id||c.bought<previous.closed||c.start<=previous.end))fail();
  ids.add(c.id);paid+=c.price;sessions+=c.sessions;extraXP+=c.extraXP;previous=c;
 }
 if(e.totals.paid<paid||e.totals.sessions<sessions||e.totals.extraXP<extraXP||e.totals.extraXP>e.totals.sessions*8||e.nextId-1<periods.length||s.retired&&e.contract)fail();
 if(e.nextId-1<=24&&(e.totals.paid!==paid||e.totals.sessions!==sessions||e.totals.extraXP!==extraXP||periods.length!==e.nextId-1))fail();
}
