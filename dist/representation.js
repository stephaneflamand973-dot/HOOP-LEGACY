import {MANDATES,validMandate} from './representation-catalog.js?v=3.8.0';
import {initRepresentation,appendNegotiation,validateRepresentation} from './representation-state.js?v=3.8.0';
import {negotiationLimits} from './negotiation-rules.js?v=3.8.0';
const fail=reason=>({ok:false,reason});
export function setMandate(s,id){
 if(s.retired||s.match||s.pending||!validMandate(id))return fail('Mandat indisponible.');
 initRepresentation(s).mandate=id;return {ok:true,reason:'Mandat futur modifié.'};
}
export function openNegotiations(s,inputs){
 const r=initRepresentation(s),mandate=r.mandate;
 const offers=inputs.map(x=>({offerId:x.offerId,initial:{salary:x.salary,years:x.years},current:{salary:x.salary,years:x.years},limits:x.exempt?{}:negotiationLimits({...x,mandate}),attempts:0,revision:0,eligible:!x.exempt}));
 r.session=offers.length?{id:r.nextId++,day:s.day,mandate,offers}:null;return r.session;
}
export function closeNegotiations(s,_reason){if(s.representation)s.representation.session=null;}
export function prepareSignature(s,{offerId,source='initial',revision}){
 if(s.retired||s.match||s.pending?.type!=='contract'||!['initial','current'].includes(source))return fail('Signature indisponible.');
 const r=s.representation,session=r?.session,e=session?.offers.find(o=>o.offerId===offerId),offer=s.offers.find(o=>o.id===offerId);
 if(!e||!offer||e.revision!==revision||!s.teams.some(t=>t.id===offer.team))return fail('Offre périmée.');
 try{validateRepresentation(s);}catch{return fail('Offre incohérente.');}
 const mandate=e.eligible?session.mandate:'self',terms={...e[source]};
 return {ok:true,reason:'Prêt à signer.',terms,tracking:{id:r.nextId,offerId,team:offer.team,mandate,rate:MANDATES[mandate].rate,started:s.day,commission:0},sessionId:session.id};
}
export function finishSignature(s,prepared){
 const r=s.representation;r.nextId++;r.contract=prepared.tracking;
 appendNegotiation(s,{kind:'signed',day:s.day,sessionId:prepared.sessionId,offerId:prepared.tracking.offerId,team:prepared.tracking.team,mandate:prepared.tracking.mandate,...prepared.terms,commission:0,outcome:'Signé'});
 closeNegotiations(s,'Contrat signé.');
}
export function offerNet(s,o){
 const session=s.representation?.session,e=session?.offers.find(e=>e.offerId===o.id),rate=e?.eligible?MANDATES[session.mandate].rate:0;
 const terms=e?.current||o;return {salary:terms.salary,years:terms.years,rate,net:terms.salary*.76*(1-rate)};
}
export function commissionForDay(s,net){
 const c=s.representation?.contract;
 if(s.retired||s.career.stage!=='pro'||!c||net<=0)return 0;
 return Math.round(net*c.rate*100)/100;
}
export function recordCommission(s,amount){
 if(!amount)return;
 const r=s.representation,c=r.contract;
 c.commission=Math.round((c.commission+amount)*100)/100;r.totals.commission=Math.round((r.totals.commission+amount)*100)/100;
 const entry=r.history.findLast(e=>e.kind==='signed'&&e.offerId===c.offerId&&e.day===c.started);
 if(entry)entry.commission=c.commission;
}
export function closeRepresentation(s,_reason){
 const r=s.representation;if(!r)return;r.session=null;r.contract=null;r.mandate='self';
}
