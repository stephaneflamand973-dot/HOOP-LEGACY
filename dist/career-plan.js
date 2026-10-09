import {canChange} from './commands.js?v=3.8.0';
import {hero,team,getPlayer,overall,clamp,log} from './engine.js?v=3.8.0';
import {leagueDef} from './leagues.js?v=3.8.0';
import {sportingPause} from './sport-events.js?v=3.8.0';
export const PREFERENCES={balanced:'Équilibre',minutes:'Temps de jeu',title:'Projet de titre',salary:'Salaire'};
export function initCareerPlan(s){s.careerPlan??={version:1,preference:'balanced',evaluation:null,reviews:[]};s.careerPlan.discussions??={version:1,history:[],cooldowns:{},teamwork:null};}
export function roleProjection(s,club=team(s)){
 const p=hero(s),rivals=club.roster.map(id=>getPlayer(s,id)).filter(q=>q.id!==s.hero&&q.pos===p.pos),rival=rivals.length?Math.max(...rivals.map(overall)):leagueDef(club.league).level;
 let minutes=Math.round(clamp(19+(overall(p)-rival)*.62+(s.trust-50)*.19,10,Math.min(leagueDef(club.league).minutes-4,38)));
 if(s.career.stage!=='pro')minutes=Math.max(21,minutes);
 return {minutes,role:minutes>=33?'Joueur majeur':minutes>=27?'Titulaire':minutes>=23?'Sixième homme':minutes>=17?'Rotation':'Développement',rival};
}
export function requestRole(s){
 if(!canChange(s)||s.careerPlan.evaluation||s.day-(s.lastRoleRequest??-100)<21)return false;
 s.lastRoleRequest=s.day;
 s.careerPlan.evaluation={id:`coach-${s.season}-${s.day}`,team:s.team,coach:team(s).coach,start:s.day,due:s.day+21,startMinutes:s.minutes,startRole:s.role,gp:0,grades:0,minutes:0,extended:false,targetGrade:65,targetGames:3};
 s.pending={type:'sport',title:'Trois semaines pour convaincre',text:'Le coach évaluera au moins trois matchs joués, avec une note moyenne de 65/100 attendue. Votre niveau, la concurrence au poste et votre disponibilité détermineront ensuite votre rôle.',choices:[['accept','Commencer cette période']]};
 log(s,'Objectif du coach','Bilan dans 21 jours : au moins 3 matchs et 65/100 de moyenne. Aucune place garantie.');return true;
}
export function recordCoachMatch(s,m){const e=s.careerPlan.evaluation,b=m.box[s.hero];if(!e||s.team!==e.team||!b?.min)return;e.gp++;e.grades+=m.grade;e.minutes+=b.min;}
export function reviewCoach(s,reason=null){
 const e=s.careerPlan.evaluation;if(!e)return false;if(!reason&&e.coach&&e.coach!==team(s).coach)reason='Le changement de coach clôt cette évaluation. Votre nouveau coach fixe désormais les attentes.';if(!reason&&s.day<e.due)return false;
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

// Conversations never advance time or consume random draws.
export function teamContact(s){return team(s).roster.map(id=>getPlayer(s,id)).filter(p=>p.id!==s.hero).sort((a,b)=>b.age-a.age||overall(b)-overall(a)||a.id.localeCompare(b.id))[0]||null;}
export function discussionWait(s,actor){return Math.max(0,(s.careerPlan.discussions.cooldowns[actor]||0)-s.day);}
function conversation(s,actor,person,title,text){const d=s.careerPlan.discussions;d.history.push({day:s.day,season:s.season,team:s.team,actor,person,title,text});d.history=d.history.slice(-40);log(s,title,`${person} : ${text}`);}
export function discuss(s,topic){
 if(!canChange(s))return false;
 const actor=topic==='coach-plan'?'coach':topic==='team-work'?'team':typeof topic==='string'&&topic.startsWith('agent-')&&Object.hasOwn(PREFERENCES,topic.slice(6))?'agent':null;
 if(!actor||discussionWait(s,actor))return false;
 const d=s.careerPlan.discussions;
 if(actor==='coach'){
  const p=hero(s),r=roleProjection(s),e=s.careerPlan.evaluation;
  conversation(s,actor,team(s).coach,'Les attentes du coach',`Votre niveau : ${overall(p)} ; concurrence au poste : ${r.rival}. Projection actuelle : ${r.role}, ${r.minutes} minutes. ${p.injury?'Votre blessure impose de préparer le retour. ':''}${e?`Évaluation en cours : ${e.gp}/${e.targetGames} matchs, bilan au jour ${e.due}.`:'Pour demander plus de responsabilités, lancez une évaluation de trois semaines ci-dessus.'} La projection dépend du niveau, de la confiance et de la concurrence ; elle ne garantit pas les minutes jouées.`);
 }else if(actor==='agent'){
  s.careerPlan.preference=topic.slice(6);
  conversation(s,actor,s.life.people.agent.name,'Le mandat de votre agent',`Priorité retenue : ${PREFERENCES[s.careerPlan.preference]}. ${s.career.stage==='pro'?`Contrat actuel : ${hero(s).contract.years} saison(s) restante(s).`:'Votre parcours amateur se poursuit ; les offres seront comparées à la prochaine étape.'} Les prochaines offres seront présentées selon cette priorité. Ce mandat ne crée aucune offre et ne garantit ni salaire, ni titularisation, ni transfert.`);
 }else{
  const p=teamContact(s);if(d.teamwork||!p)return false;
  d.teamwork={id:`team-${s.season}-${s.day}`,team:s.team,personId:p.id,person:p.name,start:s.day,due:s.day+21,games:[],videoDays:0,lastDay:s.day};
  conversation(s,actor,p.name,'Préparer le jeu collectif',`Sur 21 jours : jouer 2 matchs et réaliser 3 journées vidéo. Récompense au bilan : cohésion +3 (maximum 100), sinon aucun malus. Choisissez « Vidéo et lecture du jeu » dans votre programme si vous acceptez ce travail ; votre activité n’a pas été modifiée.`);
 }
 d.cooldowns[actor]=s.day+(actor==='team'?30:7);return true;
}
export function closeTeamWork(s,reason){
 const d=s.careerPlan?.discussions,e=d?.teamwork;if(!e)return false;
 conversation(s,'team',e.person,'Bilan du travail collectif',`${reason} Engagement clos sans pénalité ni prime. ${e.games.length}/2 matchs et ${e.videoDays}/3 journées vidéo.`);d.teamwork=null;return true;
}
export function recordTeamMatch(s,m){
 const e=s.careerPlan.discussions.teamwork;
 if(!e||e.team!==s.team||s.day<e.start||s.day>e.due||!m.done||![m.home,m.away].includes(e.team)||!m.box[s.hero]?.min||e.games.includes(m.id))return;
 e.games.push(m.id);
}
export function discussionDay(s){
 const d=s.careerPlan.discussions,e=d.teamwork;if(!e)return;
 if(s.retired){closeTeamWork(s,'La retraite met fin à ce travail.');return;}
 if(e.team!==s.team){closeTeamWork(s,'Le changement de club met fin à ce travail.');return;}
 if(!team(s).roster.includes(e.personId)){closeTeamWork(s,`${e.person} a quitté le club.`);return;}
 if(s.day>e.lastDay&&s.day<=e.due){e.lastDay=s.day;if(s.activity==='video'&&!hero(s).injury)e.videoDays++;}
 if(s.day<=e.due)return;
 const met=e.games.length>=2&&e.videoDays>=3,before=s.relationships.team;
 if(met)s.relationships.team=clamp(before+3);
 conversation(s,'team',e.person,'Bilan du travail collectif',`${e.games.length}/2 matchs et ${e.videoDays}/3 journées vidéo. ${met?`Objectif rempli. Cohésion +${+(s.relationships.team-before).toFixed(2)} : ${Math.round(before)} → ${Math.round(s.relationships.team)}/100.`:'Objectif non rempli : engagement clos sans pénalité. Le calendrier et votre disponibilité peuvent limiter les occasions.'}`);d.teamwork=null;
}
export function validateDiscussions(s){
 const d=s.careerPlan?.discussions,finite=n=>Number.isInteger(n)&&n>=0,str=x=>typeof x==='string'&&x.length>0;
 if(!Object.hasOwn(PREFERENCES,s.careerPlan?.preference))throw Error('Priorité de carrière invalide');
 if(!d||d.version!==1||!Array.isArray(d.history)||d.history.length>40||!d.cooldowns||typeof d.cooldowns!=='object'||Array.isArray(d.cooldowns)||Object.entries(d.cooldowns).some(([k,v])=>!['coach','agent','team'].includes(k)||!finite(v))||d.history.some(h=>!h||!finite(h.day)||!finite(h.season)||!['coach','agent','team'].includes(h.actor)||!['team','person','title','text'].every(k=>str(h[k]))))throw Error('Discussion sportive invalide');
 const e=d.teamwork;
 if(e!==null&&(!e||!str(e.id)||!str(e.personId)||!str(e.person)||!s.teams.some(t=>t.id===e.team)||!finite(e.start)||!finite(e.due)||e.due!==e.start+21||!finite(e.lastDay)||e.lastDay<e.start||e.lastDay>e.due||!finite(e.videoDays)||e.videoDays>21||!Array.isArray(e.games)||e.games.length>40||new Set(e.games).size!==e.games.length||e.games.some(id=>!str(id))))throw Error('Engagement collectif invalide');
}
