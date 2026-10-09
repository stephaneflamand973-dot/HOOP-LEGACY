import {STAGES} from './collective-catalog.js?v=3.8.0';
import {initCollective,duoFor,reconcileCollective} from './collective-state.js?v=3.8.0';
import {masteryCollective} from './system.js?v=3.8.0';
import {canChange} from './commands.js?v=3.8.0';
import {receipt,cents} from './finance.js?v=3.8.0';
export {STAGES};
const offerFor=id=>Object.hasOwn(STAGES,id)?STAGES[id]:null;
const player=s=>s.players.find(p=>p.id===s.hero);
const validPartners=(s,ids)=>Array.isArray(ids)&&ids.length>=1&&ids.length<=2&&new Set(ids).size===ids.length&&ids.every(id=>id!==s.hero&&s.teams.find(t=>t.id===s.team)?.roster.includes(id)&&s.players.some(p=>p.id===id));
export const collectiveGameDay=(s,day)=>s.competitions.some(c=>c.schedule.some(g=>g.day===day&&(g.home===s.team||g.away===s.team)));
export function stageQuote(s,offerId,partners=[]){
 const o=offerFor(offerId),ids=Array.isArray(partners)?[...partners].sort():[],start=s.day+1,end=s.day+(o?.days||0),slots=[];
 for(let day=start;day<=end;day++)if(day%2===0&&!collectiveGameDay(s,day))slots.push(day);
 const q={ok:false,reason:'',offerId,partners:ids,team:s.team,price:o?.price??null,start,end,balanceAfter:o?cents(s.money-o.price):null,reserve:s.life.finance.reserve,slots,mastery:s.system,scores:ids.map(id=>duoFor(s,s.team,s.hero,id)?.score||0),availability:ids.map(id=>!!s.players.find(p=>p.id===id)?.injury)};
 if(!o)q.reason='Stage inconnu.';
 else if(!canChange(s))q.reason='Action indisponible pendant un match, une décision ou après la retraite.';
 else if(s.collective?.stage)q.reason='Un stage est déjà réservé.';
 else if(player(s).injury)q.reason='Attendez la fin de votre blessure.';
 else if(offerId==='partners'&&(!validPartners(s,partners)||q.availability.some(Boolean)))q.reason='Choisissez un ou deux coéquipiers disponibles.';
 else if(offerId!=='partners'&&ids.length)q.reason='Ce stage ne demande pas de partenaire.';
 else if(offerId==='partners'?q.scores.every(n=>n>=100):s.system>=100)q.reason='Le plafond est déjà atteint.';
 else if(!slots.length)q.reason='Aucun créneau sans match connu sur cette période.';
 else if(q.balanceAfter<q.reserve)q.reason='Fonds insuffisants après maintien de votre réserve.';
 else q.ok=true;
 return q;
}
export function bookStage(s,quote,{busy=false}={}){
 const q=stageQuote(s,quote?.offerId,quote?.partners);
 if(!canChange(s,{busy})||!q.ok)return {ok:false,reason:q.reason||'Action indisponible.',quote:q};
 if(JSON.stringify(q)!==JSON.stringify(quote))return {ok:false,reason:'Les conditions ont changé. Vérifiez ce nouveau devis avant de confirmer.',quote:q};
 initCollective(s);const e=s.collective,id=e.nextId++;
 s.money=q.balanceAfter;receipt(s,`${STAGES[q.offerId].name} · stage #${id}`,-q.price);
 e.stage={id,catalogVersion:1,offerId:q.offerId,team:s.team,partners:[...q.partners],bought:s.day,start:q.start,end:q.end,price:q.price,estimatedSlots:[...q.slots],sessions:0,skips:{},mastery:0,duo:0};
 e.totals.paid=cents(e.totals.paid+q.price);e.notice=null;return {ok:true,reason:'',quote:q};
}
export function closeStage(s,reason){const e=s.collective;if(!e?.stage)return;e.history.push({...e.stage,closed:s.day,reason});e.history=e.history.slice(-24);e.stage=null;e.notice=reason;}
export function setCollectiveRoutine(s,routine,partners=[],{busy=false}={}){
 if(!canChange(s,{busy})||!['none','video','tactical','partners'].includes(routine)||routine==='partners'&&!validPartners(s,partners))return false;
 initCollective(s);s.collective.routine=routine;s.collective.partners=routine==='partners'?[...partners]:[];return true;
}
export function syncCollective(s){
 if(!s.collective)return;
 if(s.collective.stage&&(s.retired||s.collective.stage.team!==s.team))closeStage(s,s.retired?'La retraite clôt le stage, sans remboursement.':'Le changement de club clôt le stage, sans remboursement.');
 reconcileCollective(s);
}
export function collectiveDay(s){
 initCollective(s);syncCollective(s);const e=s.collective;
 if(e.stage&&s.day>e.stage.end)closeStage(s,'Période terminée, sans remboursement.');
 if(e.processedDay===s.day)return;e.processedDay=s.day;
 const stage=e.stage&&s.day>=e.stage.start?e.stage:null,mode=stage?.offerId||e.routine,ids=stage?.partners||e.partners,p=player(s);
 let reason='',mastery=0,duo=0,fatigue=0,partners=[];
 if(s.retired)reason='Retraite';else if(mode==='none')reason='Aucune préparation';else if(s.day%2)reason='Jour sans séance';else if(p.injury)reason='Blessure';else if(s.activity==='repos')reason='Repos';else if(p.fatigue>65)reason='Fatigue';else if(collectiveGameDay(s,s.day))reason='Match';
 if(!reason){
  if(mode==='partners'){
   partners=ids.filter(id=>s.teams.find(t=>t.id===s.team).roster.includes(id)&&s.players.some(q=>q.id===id&&!q.injury));
   if(!partners.length)reason='Partenaires indisponibles';
   else for(const id of partners){const d=duoFor(s,s.team,s.hero,id,{create:true}),gain=(stage?1:.5)*(1-d.score/100);d.score=Math.min(100,d.score+gain);d.sources[stage?'stage':'routine']+=gain;duo+=gain;}
   if(!reason&&duo===0)reason='Plafond atteint';
  }else {mastery=masteryCollective(s,stage?STAGES[mode].gain:mode==='video'?.2:.35);if(!mastery)reason='Plafond atteint';}
  if(!reason){fatigue=mode==='video'?0:2;p.fatigue=Math.min(100,p.fatigue+fatigue);}
 }
 if(stage){if(!reason){stage.sessions++;stage.mastery+=mastery;stage.duo+=duo;e.totals.sessions++;e.totals.mastery+=mastery;e.totals.duo+=duo;}else stage.skips[reason]=(stage.skips[reason]||0)+1;}
 e.recent.push({day:s.day,mode,stageId:stage?.id??null,reason,mastery,duo,fatigue,partners});e.recent=e.recent.slice(-24);
}
