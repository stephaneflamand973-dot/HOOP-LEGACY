import {closeTeamWork} from './career-plan.js?v=3.8.0';
import {closeEnvironment} from './environment.js?v=3.8.0';
import {closeStage} from './collective.js?v=3.8.0';
import {closeRepresentation} from './representation.js?v=3.8.0';
// A single boundary for user commands; background sporting updates use their own functions.
export function canChange(s, {busy=false, pending=false, match=false}={}) {
  return !!s && !busy && !s.retired && (pending || !s.pending) && (match || !s.match);
}
export function retireCareer(s) {
  if (!canChange(s)) return false;
  if(s.careerPlan?.evaluation){const e=s.careerPlan.evaluation;s.careerPlan.reviews.push({...e,closed:s.day,average:e.gp?e.grades/e.gp:0,met:false,outcome:'Évaluation interrompue',text:'La retraite clôt l’évaluation en cours.',endMinutes:s.minutes,endRole:s.role});s.careerPlan.evaluation=null;}
  closeTeamWork(s,'La retraite met fin à ce travail.');
  closeEnvironment(s,'La retraite termine votre accompagnement.');
  closeStage(s,'La retraite clôt le stage, sans remboursement.');
  closeRepresentation(s,'La retraite clôt votre représentation.');
  s.retired=true;
  s.phase='Retraite';
  if (s.simulation) s.simulation.cursor=null;
  return true;
}
