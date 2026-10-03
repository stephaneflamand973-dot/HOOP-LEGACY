import {canChange} from './commands.js?v=3.5.0';
import {hero,team,getPlayer,overall,clamp,log} from './engine.js?v=3.5.0';
import {leagueDef} from './leagues.js?v=3.5.0';
import {sportingPause} from './sport-events.js?v=3.5.0';
export const PREFERENCES={balanced:'Équilibre',minutes:'Temps de jeu',title:'Projet de titre',salary:'Salaire'};
export function initCareerPlan(s){s.careerPlan??={version:1,preference:'balanced',evaluation:null,reviews:[]};}
export function roleProjection(s,club=team(s)){
 const p=hero(s),rivals=club.roster.map(id=>getPlayer(s,id)).filter(q=>q.id!==s.hero&&q.pos===p.pos),rival=rivals.length?Math.max(...rivals.map(overall)):leagueDef(club.league).level;
 let minutes=Math.round(clamp(19+(overall(p)-rival)*.62+(s.trust-50)*.19,10,Math.min(leagueDef(club.league).minutes-4,38)));
 if(s.career.stage!=='pro')minutes=Math.max(21,minutes);
 return {minutes,role:minutes>=33?'Joueur majeur':minutes>=27?'Titulaire':minutes>=23?'Sixième homme':minutes>=17?'Rotation':'Développement',rival};
}
export function requestRole(s){
 if(!canChange(s)||s.careerPlan.evaluation||s.day-(s.lastRoleRequest??-100)<21)return false;
 s.lastRoleRequest=s.day;
 s.careerPlan.evaluation={id:`coach-${s.season}-${s.day}`,team:s.team,start:s.day,due:s.day+21,startMinutes:s.minutes,startRole:s.role,gp:0,grades:0,minutes:0,extended:false,targetGrade:65,targetGames:3};
 s.pending={type:'sport',title:'Trois semaines pour convaincre',text:'Le coach évaluera au moins trois matchs joués, avec une note moyenne de 65/100 attendue. Votre niveau, la concurrence au poste et votre disponibilité détermineront ensuite votre rôle.',choices:[['accept','Commencer cette période']]};
 log(s,'Objectif du coach','Bilan dans 21 jours : au moins 3 matchs et 65/100 de moyenne. Aucune place garantie.');return true;
}
export function recordCoachMatch(s,m){const e=s.careerPlan.evaluation,b=m.box[s.hero];if(!e||s.team!==e.team||!b?.min)return;e.gp++;e.grades+=m.grade;e.minutes+=b.min;}
export function reviewCoach(s,reason=null){
 const e=s.careerPlan.evaluation;if(!e||!reason&&s.day<e.due)return false;
 const p=hero(s);
 if(!reason&&e.gp<e.targetGames&&p.injury&&!e.extended){e.due=s.day+14;e.extended=true;log(s,'Évaluation reportée','La blessure reporte le bilan du coach de quatorze jours.');return false;}
 const avg=e.gp?e.grades/e.gp:0,projection=roleProjection(s),met=e.gp>=e.targetGames&&avg>=e.targetGrade;
 if(!reason&&met&&!p.injury){s.minutes=projection.minutes;s.role=projection.role;}
 const outcome=reason||e.gp<e.targetGames?'Évaluation interrompue':s.minutes>e.startMinutes?'Responsabilités en hausse':'Rôle maintenu';
 const text=reason||`${e.gp} matchs, ${avg.toFixed(1)}/100 de moyenne. ${met?'Attentes remplies.':'Attentes non remplies.'} Niveau ${overall(p)}, concurrence ${projection.rival}. ${p.injury?'Retour de blessure nécessaire. ':''}${s.role} : ${e.startMinutes} → ${s.minutes} minutes prévues. Le rôle continue d’évoluer avec vos matchs.`;
 s.careerPlan.reviews.push({...e,closed:s.day,average:avg,met,outcome,text,endMinutes:s.minutes,endRole:s.role});s.careerPlan.evaluation=null;
 log(s,'Bilan du coach',text);sportingPause(s,e.id+'-review','Bilan du coach · '+outcome,text);return true;
}
export function offerComparison(s,o){
 const t=team(s,o.team),p=hero(s),rivals=t.roster.map(id=>getPlayer(s,id)).filter(q=>q.id!==s.hero&&q.pos===p.pos).sort((a,b)=>overall(b)-overall(a)||a.id.localeCompare(b.id));
 const best=t.roster.map(id=>getPlayer(s,id)).filter(q=>q.id!==s.hero).map(overall).sort((a,b)=>b-a).slice(0,8),strength=best.length?best.reduce((a,b)=>a+b,0)/best.length:50;
 return {project:t.strategy||t.goal,strength:+strength.toFixed(1),rank:1+rivals.filter(q=>overall(q)>overall(p)).length,rivals:rivals.slice(0,3).map(q=>({id:q.id,name:q.name,ovr:overall(q)})),system:t.system,sameSystem:t.system===team(s).system,retention:t.system===team(s).system?85:65,minutes:[Math.max(0,o.minutes-3),Math.min(leagueDef(o.league).minutes,o.minutes+3)]};
}
export function orderedOffers(s){
 return s.offers.map((o,index)=>({o,index,c:offerComparison(s,o)})).sort((a,b)=>{
  const value=x=>s.careerPlan.preference==='salary'?x.o.salary:s.careerPlan.preference==='minutes'?x.o.minutes:s.careerPlan.preference==='title'?x.c.strength:x.o.minutes+x.c.strength*.25;
  return value(b)-value(a)||a.index-b.index;
 });
}
