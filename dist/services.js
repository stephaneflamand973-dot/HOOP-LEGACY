import {GROUPS} from './config.js?v=3.9.0';
import {canChange} from './commands.js?v=3.9.0';
import {coachQuote,hireCoach} from './environment.js?v=3.9.0';
import {receipt,cents} from './finance.js?v=3.9.0';
const player=s=>s.players.find(p=>p.id===s.hero);
export const RECONVERSION_DOMAINS={coaching:'Coaching',video:'Analyse vidéo',physical:'Préparation physique'};
const CATALOG={formation:{price:3000,name:'Formation de reconversion',effect:'30 séances de 2 h remplacent l’entraînement individuel les jours d’étude admissibles. Aucun salaire automatique.'},proximity:{price:7500,name:'Proximité de la résidence',effect:'Jusqu’à 0,5 point de fatigue par jour à domicile.'},installation:{price:20300,name:'Installation personnelle',effect:'+10 % XP ciblés hors saison à domicile ; cumul avec coach limité à 20 %. Entretien initial de 300 € inclus.'},maintenance:{price:300,name:'Entretien de l’installation',effect:'30 jours d’entretien, sans renouvellement automatique.'},physical:{price:1200,name:'Préparateur physique',effect:'+15 % XP Physique sur les séances admissibles, emplacement coach individuel.'},recovery:{price:900,name:'Accompagnement récupération',effect:'Jusqu’à 1 point de fatigue récupéré par jour, sans effet sur les blessures.'}};
function totals(s){const t=s.v40.services.totals;for(const k of ['paid','recovery','extraXP','sessions'])t[k]??=0;return t;}
export function quoteService(s,kind,options={}){
 const offer=Object.hasOwn(CATALOG,kind)?CATALOG[kind]:null,e=s.v40.services;
 const q={ok:false,reason:'',kind,options:['installation','formation'].includes(kind)?{domain:options?.domain}: {},token:'',price:offer?.price??null,start:s.day+1,end:s.day+30,effects:offer?.effect||'',conditions:'Paiement immédiat. Activation demain. Pas de remboursement ni de prolongation. Renouvellement désactivé par défaut.'};
 if(!offer)q.reason='Service inconnu.';
 else if(!canChange(s))q.reason='Action indisponible pendant une décision, un match ou après la retraite.';
 else if(kind==='physical'&&!coachQuote(s,'confirmed','Physique').ok)q.reason=coachQuote(s,'confirmed','Physique').reason;
 else if(kind==='formation'&&(!Object.hasOwn(RECONVERSION_DOMAINS,options?.domain)||(e.qualifications||[]).some(q=>q.domain===options.domain)))q.reason='Domaine inconnu ou qualification déjà obtenue.';
 else if(['proximity','installation','maintenance'].includes(kind)&&!s.life.property)q.reason='Une résidence est nécessaire.';
 else if(kind==='proximity'&&s.life.property.proximity)q.reason='La proximité est déjà acquise pour cette résidence.';
 else if(kind==='installation'&&!Object.hasOwn(GROUPS,options?.domain))q.reason='Domaine inconnu.';
 else if(kind==='maintenance'&&(!e.active.installation||s.day<=e.active.installation.end))q.reason='L’installation est absente ou son entretien est encore payé.';
 else if(e.active[kind])q.reason='Ce service est déjà actif.';
 else if(cents(s.money-offer.price)<s.life.finance.reserve)q.reason='Fonds insuffisants après maintien de votre réserve.';
 else q.ok=true;
 if(kind==='formation'){q.end=null;q.conditions='30 séances à votre rythme. Paiement immédiat, sans remboursement. Formation interrompue à la retraite.';}
 q.token=JSON.stringify([kind,s.day,s.team,s.money,s.life.finance.reserve,e.nextId,s.environment.contract?.id??null,s.life.property??null]);
 return q;
}
export function buyService(s,quote,{busy=false}={}){
 if(!canChange(s,{busy})||!quote||typeof quote.kind!=='string')return {ok:false,reason:'Action indisponible.'};
 const fresh=quoteService(s,quote.kind,quote.options);
 if(!fresh.ok)return {ok:false,reason:fresh.reason};
 if(JSON.stringify(quote)!==JSON.stringify(fresh))return {ok:false,reason:'Le devis a changé : consultez le nouveau montant avant de confirmer.'};
 if(quote.kind==='physical'){if(!hireCoach(s,'confirmed','Physique',{busy}))return {ok:false,reason:'Coach indisponible.'};s.v40.services.nextId++;return {ok:true,reason:''};}
 if(quote.kind==='formation'){const e=s.v40.services,id=e.nextId++;s.money=cents(s.money-3000);receipt(s,'Formation de reconversion #'+id,-3000);totals(s).paid=cents(totals(s).paid+3000);e.active.formation={id,kind:'formation',domain:quote.options.domain,price:3000,bought:s.day,start:s.day+1,sessions:0,hours:0,qualified:false,lastDay:null};return {ok:true,reason:''};}
 if(['proximity','installation','maintenance'].includes(quote.kind)){
  const e=s.v40.services,id=e.nextId++;s.money=cents(s.money-fresh.price);receipt(s,CATALOG[quote.kind].name+' #'+id,-fresh.price);totals(s).paid=cents(totals(s).paid+fresh.price);
  if(quote.kind==='proximity'){s.life.property.proximity={since:s.day+1,paid:7500};e.history.push({id,kind:'proximity',bought:s.day,price:7500,closed:s.day,reason:'Aménagement acquis.'});e.history=e.history.slice(-24);}
  else if(quote.kind==='installation')e.active.installation={id,kind:'installation',domain:quote.options.domain,price:20300,bought:s.day,start:s.day+1,end:s.day+30,renew:false,extraXP:0,sessions:0,lastDay:null,maintenancePaid:300};
  else {const c=e.active.installation;c.start=s.day+1;c.end=s.day+30;c.maintenancePaid+=300;e.history.push({id,kind:'maintenance',bought:s.day,price:300,closed:s.day,reason:'Entretien payé.'});e.history=e.history.slice(-24);}
  return {ok:true,reason:''};
 }
 beginRecovery(s,s.day+1,false);return {ok:true,reason:''};
}
function beginRecovery(s,start,renew){
 const e=s.v40.services,id=e.nextId++;s.money=cents(s.money-900);receipt(s,'Accompagnement récupération · période #'+id,-900);totals(s).paid=cents(totals(s).paid+900);
 e.active.recovery={id,kind:'recovery',price:900,bought:s.day,start,end:start+29,renew,days:0,effect:0,lastDay:null};
}
function close(s,kind,reason){const e=s.v40.services,c=e.active[kind];if(!c)return;e.history.push({...c,closed:s.day,reason});e.history=e.history.slice(-24);delete e.active[kind];}
export function closeServices(s,reason){if(!s.v40)return;for(const kind of Object.keys(s.v40.services.active))close(s,kind,reason);}
export function setServiceRenewal(s,kind,enabled,{busy=false}={}){if(!canChange(s,{busy})||typeof enabled!=='boolean'||!Object.hasOwn(s.v40.services.active,kind)||kind!=='recovery')return false;s.v40.services.active[kind].renew=enabled;return true;}
export function serviceDay(s){
 if(!s.v40)return;const e=s.v40.services;if(e.processedDay===s.day)return;e.processedDay=s.day;
 if(s.retired){closeServices(s,'La retraite clôt le service.');return;}
 const p=player(s);let c=e.active.recovery;
 if(c&&s.day>c.end){const renew=c.renew;close(s,'recovery',!renew?'Période terminée.':p.injury?'Renouvellement arrêté : blessure.':cents(s.money-900)<s.life.finance.reserve?'Renouvellement arrêté : réserve financière insuffisante.':'Période renouvelée.');if(renew&&!p.injury&&cents(s.money-900)>=s.life.finance.reserve)beginRecovery(s,s.day,true);c=e.active.recovery;}
 if(s.life.property?.proximity&&s.day>=s.life.property.proximity.since&&!p.injury&&atHome(s)){const extra=Math.min(.5,p.fatigue);p.fatigue-=extra;totals(s).recovery+=extra;totals(s).housingRecovery=(totals(s).housingRecovery||0)+extra;}
 if(c&&s.day>=c.start&&s.day<=c.end&&!p.injury){const applied=Math.min(1,p.fatigue);p.fatigue-=applied;c.days++;c.effect+=applied;c.lastDay=s.day;totals(s).recovery+=applied;}
}
export function atHome(s){return !!s.life.property&&s.life.property.team===s.team&&s.day>=(s.life.property.readyDay??0)&&!s.competitions.some(c=>c.schedule.some(g=>g.away===s.team&&g.day>=s.day&&g.day<=s.day+1));}
export function serviceTraining(s,p,raw,coached={amounts:raw}){
 const amounts={...coached.amounts},c=s.v40?.services.active.installation,skip=reason=>({amounts,extraXP:0,reason});
 if(!c||!s.offseasonStarted||!atHome(s)||p.injury||s.activity==='repos'||s.day<c.start||s.day>c.end||c.lastDay===s.day||s.trainingPlan.domain!==c.domain)return skip('Installation indisponible pour cette séance.');
 const domain=c.domain,extra=Math.max(0,Math.min(raw[domain]*.1,raw[domain]*1.2-amounts[domain]));amounts[domain]+=extra;
 const extraXP=Math.max(0,Math.round(amounts[domain])-Math.round(coached.amounts[domain]));c.lastDay=s.day;c.sessions++;c.extraXP+=extraXP;totals(s).extraXP+=extraXP;totals(s).sessions++;
 return {amounts,extraXP,reason:extraXP?'Installation utilisée.':'Plafond de bonus déjà atteint.'};
}

export function formationSession(s,p){
 const e=s.v40?.services,c=e?.active.formation;
 if(!c||s.retired||s.activity!=='etudes'||p.injury||p.fatigue>65||s.day%2!==0||s.day<c.start||c.lastDay===s.day)return false;
 c.lastDay=s.day;c.sessions++;c.hours=c.sessions*2;
 if(c.sessions===30){c.qualified=true;e.qualifications??=[];e.qualifications.push({domain:c.domain,day:s.day,hours:60});close(s,'formation','Qualification obtenue.');}
 return true;
}
