import {negotiationLimits,evaluateCounter} from './negotiation-rules.js?v=3.8.0';
import {appendNegotiation} from './representation-state.js?v=3.8.0';
export {negotiationLimits,evaluateCounter};
export function negotiationQuote(s,offerId,request){
 const session=s.representation?.session,e=session?.offers.find(e=>e.offerId===offerId),o=s.offers?.find(o=>o.id===offerId);
 if(s.retired||s.match||s.pending?.type!=='contract'||!e?.eligible||!o||e.attempts>=2)return null;
 try{
  const response=evaluateCounter(e.initial,e.current,e.limits,request),requested=Math.floor(e.initial.salary*(100+request.raise)/100);
  if(requested===e.current.salary&&request.years===e.current.years)return null;
  const choice={raise:request.raise,years:request.years};
  const fingerprint=JSON.stringify([session.id,session.day,session.mandate,offerId,o.team,e.revision,e.initial,e.current,e.limits,choice]);
  return {sessionId:session.id,offerId,revision:e.revision,request:choice,response,fingerprint};
 }catch{return null;}
}
export function submitCounter(s,quote){
 const fail=reason=>({ok:false,reason});if(!quote)return fail('Demande invalide.');
 const fresh=negotiationQuote(s,quote.offerId,quote.request);
 if(!fresh||fresh.sessionId!==quote.sessionId||fresh.revision!==quote.revision||fresh.fingerprint!==quote.fingerprint)return fail('Devis périmé ou négociation indisponible.');
 const session=s.representation.session,e=session.offers.find(e=>e.offerId===quote.offerId),o=s.offers.find(o=>o.id===e.offerId);
 e.current={salary:fresh.response.salary,years:fresh.response.years};e.attempts++;e.revision++;
 appendNegotiation(s,{kind:'counter',day:s.day,sessionId:session.id,offerId:e.offerId,team:o.team,mandate:session.mandate,...e.current,commission:0,outcome:fresh.response.outcome});
 return {ok:true,reason:fresh.response.outcome};
}
