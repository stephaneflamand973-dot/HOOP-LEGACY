import {getPlayer,overall,hero,log} from './engine.js?v=3.5.0';
import {leagueDef} from './leagues.js?v=3.5.0';
const positions=['MJ','AR','AI','AF','P'];
export const payroll=(s,t)=>t.roster.reduce((n,id)=>n+(getPlayer(s,id)?.contract.salary||0),0);
export function projectSnapshot(s,t){const players=t.roster.map(id=>getPlayer(s,id)).filter(Boolean),best=players.map(overall).sort((a,b)=>b-a).slice(0,8),strength=best.reduce((n,v)=>n+v,0)/Math.max(1,best.length),age=players.reduce((n,p)=>n+p.age,0)/Math.max(1,players.length),level=leagueDef(t.league).level;
 const counts=Object.fromEntries(positions.map(pos=>[pos,players.filter(p=>p.pos===pos).length]));const needs=[...positions].sort((a,b)=>counts[a]-counts[b]||positions.indexOf(a)-positions.indexOf(b)).slice(0,2);
 const strategy=strength>=level+3?'Titre':age>28&&strength<level?'Reconstruction':strength>=level-3?'Continuité':'Développement';
 return {strategy,strength:+strength.toFixed(1),age:+age.toFixed(1),needs,counts,reason:`Huit meilleurs : ${strength.toFixed(1)} ; âge moyen : ${age.toFixed(1)} ans ; priorités : ${needs.join(', ')}.`,payroll:payroll(s,t),overBudget:Math.max(0,payroll(s,t)-t.budget)};
}
export function updateProject(s,t){const p=projectSnapshot(s,t);t.project={...p,season:s.season};t.strategy=p.strategy;return p;}
export function recruitmentValue(s,t,p){const project=t.project||projectSnapshot(s,t),development=['Reconstruction','Développement'].includes(project.strategy);return overall(p)+(project.needs.includes(p.pos)?10:0)+(development?Math.max(-6,(25-p.age)*.9):p.age<=32?2:0);}
export function developmentBonus(t,p){return ['Reconstruction','Développement'].includes(t.strategy)&&p.age<=23?3:0;}
export function clubNotice(s,t,title,text){t.projectHistory??=[];const entry={day:s.day,season:s.season,title,text};t.projectHistory.unshift(entry);t.projectHistory=t.projectHistory.slice(0,40);if(t.id===s.team)log(s,title,text);}
export function validTrade(s,a,b,p,q){if(!a||!b||!p||!q||a.id===b.id||a.league!==b.league||p.id===s.hero||q.id===s.hero||p.injury||q.injury||p.contract.years<=0||q.contract.years<=0)return false;
 if(!a.roster.includes(p.id)||!b.roster.includes(q.id))return false;
 const fit=(t,out,incoming)=>{const players=t.roster.map(id=>getPlayer(s,id)),count=pos=>players.filter(x=>x.pos===pos).length;return count(out.pos)>count(incoming.pos)&&recruitmentValue(s,t,incoming)>=recruitmentValue(s,t,out)-4;};
 return fit(a,p,q)&&fit(b,q,p)&&payroll(s,a)-p.contract.salary+q.contract.salary<=Math.max(a.budget,payroll(s,a))&&payroll(s,b)-q.contract.salary+p.contract.salary<=Math.max(b.budget,payroll(s,b));
}
export function executeTrade(s,a,b,p,q){if(!validTrade(s,a,b,p,q))return false;a.roster=a.roster.map(id=>id===p.id?q.id:id);b.roster=b.roster.map(id=>id===q.id?p.id:id);const reason='Rééquilibrer les postes en respectant les contrats et le projet du club.';
 s.world.transactions.unshift({day:s.day,season:s.season,type:'Échange',player:p.name+' / '+q.name,from:a.name,to:b.name,reason});s.world.transactions=s.world.transactions.slice(0,300);
 for(const [t,incoming,out] of [[a,q,p],[b,p,q]]){updateProject(s,t);clubNotice(s,t,'Mouvement de votre club',`${incoming.name} (${incoming.pos}) arrive ; ${out.name} part. ${reason}${incoming.pos===hero(s).pos?' La concurrence à votre poste évolue.':''}`);}return true;
}
