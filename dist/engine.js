import {openNegotiations,prepareSignature,finishSignature,closeNegotiations} from './representation.js?v=3.8.0';
import {observeLife} from './life-context.js?v=3.8.0';
import {initStatistics,recordStatistics,recordInjury,recordWorldTitle,closeStatistics,beginStatistics,settleAwards,validateStatistics} from './statistics.js?v=3.8.0';
import {initEnvironment,environmentDay,validateEnvironment} from './environment.js?v=3.8.0';
import {initCareerPlan,recordCoachMatch,reviewCoach,recordTeamMatch,discussionDay,closeTeamWork,validateDiscussions} from './career-plan.js?v=3.8.0';
import {beginChapters,updateChapters,closeChapters} from './chapters.js?v=3.8.0';
import {canChange,retireCareer} from './commands.js?v=3.8.0';
import {initSimulation,validateSimulation} from './simulation.js?v=3.8.0';
import {initSportEvents,sportingPause,hasSportPause} from './sport-events.js?v=3.8.0';
import {initCollective,validateCollective} from './collective-state.js?v=3.8.0';
import {collectiveDay,syncCollective} from './collective.js?v=3.8.0';
import {finishCollectiveMatch,collectiveSummary,validateCollectiveMatch} from './collective-match.js?v=3.8.0';
import {initMastery,masteryMatch,transferMastery} from './system.js?v=3.8.0';
import {seedPostseason,makeSeries,seriesHome,syncRound,recoverPostseason} from './postseason.js?v=3.8.0';
import {initCareerLedger,openStint,recordStintMatch,awardTitle,seasonTitles,seasonStints} from './career-ledger.js?v=3.8.0';
import {initLegacy,beginLegacySeason,refreshAmbition,recordLegacyMatch,recordLegacySeries,finishLegacySeason,recordLegacyTitle,validateLegacy} from './legacy.js?v=3.8.0';
import {KEYS,WEIGHTS,CFG,STYLES,BADGES,TECHNIQUES,VERSION,MATCH_RULES} from './config.js?v=3.8.0';
import {startMatch,stepMatch} from './match.js?v=3.8.0';
export {startMatch,stepMatch} from './match.js?v=3.8.0';
import {initDevelopment,spendXP,awardXP,matchXP,trainingDay,ageAttributes,closeDevelopmentYear,costFor,DOMAINS,domainOf} from './progression.js?v=3.8.0';
import {initLife,lifeDay,resolveLife} from './life.js?v=3.8.0';
import {realRoster,initWorld,refreshWorld,marketDay} from './world.js?v=3.8.0';
import {LEAGUES,REFERENCE,leagueDef,clubCatalog,clubId,makeCalendar} from './leagues.js?v=3.8.0';
export const clamp=(x,a=0,b=100)=>Math.max(a,Math.min(b,x));
export function rng(s,stream='career'){let x=s.rng[stream]>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng[stream]=x>>>0;return (x>>>0)/4294967296}
const pick=(s,a,stream)=>a[Math.floor(rng(s,stream)*a.length)];
export const overall=p=>Math.round(KEYS.reduce((n,k)=>n+p.attrs[k]*(WEIGHTS[p.pos]?.[k]||.35),0)/KEYS.reduce((n,k)=>n+(WEIGHTS[p.pos]?.[k]||.35),0));
export function limits(){return Object.fromEntries(KEYS.map(k=>[k,99]))}
export const potentialCost=()=>0;
export function badgeLevel(p,b){return p.attrs[b.attr]<b.threshold?0:Math.min(b.max,1+Math.floor((p.badges[b.id]||0)/80),1+Math.floor((p.attrs[b.attr]-60)/7))}
function bonus(p,context){let b=BADGES.reduce((v,b)=>v+(b.context===context?badgeLevel(p,b)*b.effect:0),0);let t=TECHNIQUES.find(t=>p.equipped.includes(t.id)&&t.context===context&&p.attrs[t.attr]>=t.threshold);return Math.min(.09,b+(t?.effect||0))}
function usage(p,context){for(let b of BADGES)if(b.context===context&&p.attrs[b.attr]>=b.threshold)p.badges[b.id]=(p.badges[b.id]||0)+1}
export function learn(s,id){if(!canChange(s))return false;let p=hero(s),t=TECHNIQUES.find(t=>t.id===id);if(!t||p.attrs[t.attr]<t.threshold||p.learned.includes(id))return false;let d=domainOf(t.attr),cost=t.cost*25;if(s.development.xp[d]<cost)return false;s.development.xp[d]-=cost;p.learned.push(id);return true}
export function equip(s,id){if(!canChange(s))return false;let p=hero(s);if(!p.learned.includes(id))return;p.equipped=p.equipped.includes(id)?p.equipped.filter(x=>x!==id):[...p.equipped.slice(-2),id]}

export function defaultBuild(){let b={name:'Stéphane',age:16,nation:'France · Martinique',path:'young',height:195,weight:88,wingspan:202,pos:'AR',secondary:'MJ',style:'Shooteur',seed:2026};b.caps=buildCaps(b);return b}
export function buildCaps(){return limits()}
export const totals=()=>({gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,fgm:0,fga:0,tpm:0,tpa:0,ftm:0,fta:0,min:0});
const indexes=new WeakMap();
export function getPlayer(s,id){let index=indexes.get(s.players);if(!index||index.size!==s.players.length){index=new Map(s.players.map(p=>[p.id,p]));indexes.set(s.players,index)}return index.get(id)}
export const hero=s=>getPlayer(s,s.hero);
const teamIndexes=new WeakMap();
export const team=(s,id=s.team)=>{let index=teamIndexes.get(s.teams);if(!index){index=new Map(s.teams.map(t=>[t.id,t]));teamIndexes.set(s.teams,index)}return index.get(id)};
export const competition=(s,id=s.league)=>s.competitions.find(c=>c.id===id);
export const activeLeague=s=>leagueDef(s.league);
export const allGames=s=>s.competitions.flatMap(c=>c.schedule);
export function playerGames(s){return allGames(s).filter(g=>g.home===s.team||g.away===s.team).sort((a,b)=>a.day-b.day||a.id.localeCompare(b.id))}
export function syncLeague(s){syncCollective(s);let c=competition(s);s.schedule=c.schedule;s.round=c.schedule.filter(g=>g.stage==='regular'&&g.result&&(g.home===s.team||g.away===s.team)).length;s.phase=s.retired?'Retraite':s.pending?.type==='draft-choice'?'Orientation':c.phase;for(let t of s.teams){let r=c.records[t.id];t.wins=r?.wins||0;t.losses=r?.losses||0}return s}
export function log(s,title,text){let e={id:'e'+s.nextId++,day:s.day,season:s.season,title,text};s.log.unshift(e);s.log=s.log.slice(0,120);s.journal??=[];s.journal.push(e)}
export function generatedPlayer(s,id,club,age){let def=leagueDef(club.league),level=Math.max(...club.competitions.map(id=>leagueDef(id).level));let pos=pick(s,Object.keys(WEIGHTS),'players'),base=level-8+rng(s,'players')*12;
 return {id,name:pick(s,['Noah','Elias','Jules','Amir','Léo','Malik','Isaac','Gabriel','Tiago','Sacha','Liam','Jayden','Mateo','Luca','Nikola','Kai'],'players')+' '+pick(s,['Laurent','Diallo','Moreau','Baptiste','Santos','Martin','Bernard','Joseph','Durand','Koné','Williams','Wilson','Miller','Silva','Rossi','Keller'],'players'),age:age??(def.amateur?(def.id==='highschool'?16:19):20+Math.floor(rng(s,'players')*14)),pos,attrs:Object.fromEntries(KEYS.map(k=>[k,Math.round(clamp(base+rng(s,'players')*12+(WEIGHTS[pos][k]?3:-4),25,94))])),fatigue:0,injury:0,season:totals(),byLeague:{},contract:{years:def.amateur?1:1+Math.floor(rng(s,'players')*3),salary:def.amateur?0:Math.round(def.salary*(1+Math.max(0,base-50)/9)),guarantee:1,option:'Aucune'},badges:{},learned:[],equipped:[],practice:{}};
}
function scheduleDay(s,g,preferred){let day=preferred;let games=allGames(s);while(games.some(q=>q!==g&&q.day===day&&(q.home===g.home||q.away===g.home||q.home===g.away||q.away===g.away)))day++;g.day=day;return g}
export function setupCompetitions(s){s.competitions=LEAGUES.map(def=>({id:def.id,phase:'Saison régulière',records:Object.fromEntries(def.teams.map(n=>[clubId(n),{wins:0,losses:0,for:0,against:0}])),schedule:makeCalendar(def,s.season,s.teams),post:null,champion:null}));
 // Reconcile clubs playing both domestic competition and EuroLeague.
 let used=new Set();for(let g of allGames(s).sort((a,b)=>a.day-b.day||a.league.localeCompare(b.league)||a.id.localeCompare(b.id))){while(used.has(g.home+':'+g.day)||used.has(g.away+':'+g.day))g.day++;used.add(g.home+':'+g.day);used.add(g.away+':'+g.day)}
 s.schedule=competition(s).schedule;
}
export function createGame(input){let b={...input};b.age=b.path==='young'?clamp(b.age,16,17):b.path==='prospect'?clamp(b.age,18,21):Math.max(19,b.age);let stage=b.path==='young'?'highschool':b.path==='prospect'?'college':'pro';let seed=(b.seed>>>0)||2026;
 let s={schema:4,engine:VERSION,pack:'world-2025-v3',packMetadata:REFERENCE,season:1,day:0,phase:'Saison régulière',rng:{match:seed,players:((seed+771)>>>0)||771,career:((seed+991)>>>0)||991,life:((seed+1777)>>>0)||1777},teams:[],players:[],competitions:[],schedule:[],log:[],history:[],archives:[],pending:null,match:null,round:0,training:STYLES[b.style][0],activity:'individuel',auto:true,mode:'key',money:0,relationships:{coach:55,team:55,agent:50,mentor:50,family:60},xp:0,points:18,takeover:'three',trust:55,form:75,iq:55,discipline:65,system:45,charge:0,role:stage==='pro'?'Développement':'Titulaire',minutes:stage==='pro'?18:26,grade:55,recent:[],offers:[],retired:false,trophies:[],applied:[],nextId:1,hero:'hero',league:stage==='highschool'?'highschool':stage==='college'?'ncaa':'nba',career:{stage,hsYears:0,collegeYears:0,academics:72,exposure:15,draftEntered:stage==='pro',milestones:[]},development:{gained:0,last:[]},freeAgents:[]};
 for(let [i,data] of clubCatalog().entries()){let def=leagueDef(data.league),t={...data,roster:[],wins:0,losses:0,budget:def.budget,system:['pace','defense','balanced'][i%3],coach:'Coach '+(i+1),goal:i%4===0?'Titre':'Développement',assets:[2]};for(let j=0;j<10;j++){let p=generatedPlayer(s,`p${i}-${j}`,t);t.roster.push(p.id);s.players.push(p)}s.teams.push(t)}
 let caps=limits();let base=stage==='highschool'?46:stage==='college'?54:63;
 let p={...b,id:'hero',caps,absolute:limits(b),attrs:Object.fromEntries(KEYS.map(k=>[k,Math.min(caps[k],base+(STYLES[b.style].includes(k)?12:4))])),fatigue:0,injury:0,season:totals(),byLeague:{},contract:{years:stage==='pro'?2:1,salary:stage==='pro'?1200000:0,guarantee:1,option:stage==='pro'?'Équipe':'Aucune'},badges:{},learned:[],equipped:[],practice:{}};s.players.push(p);let choices=s.teams.filter(t=>t.league===s.league);s.team=choices[stage==='pro'?29:0].id;for(let t of s.teams){let real=realRoster(s,t);if(real){let remove=new Set(t.roster);s.players=s.players.filter(p=>!remove.has(p.id));s.players.push(...real);t.roster=real.map(p=>p.id)}}team(s).roster.push('hero');s.points=0;initDevelopment(s);initLife(s);initWorld(s);setupCompetitions(s);initLegacy(s);initV33(s);initV34(s);log(s,'Nouvelle trajectoire',`${p.name} rejoint ${team(s).name}. ${stage==='highschool'?'Objectif : décrocher une place à l’université.':stage==='college'?'Faites vos preuves avant de vous déclarer à la draft.':'Votre première saison NBA commence.'}`);return syncLeague(s)
}
export const calendar=(teams,season,league='nba')=>makeCalendar(leagueDef(league),season,teams);
export const upgradeCost=costFor;
export function upgrade(s,k){return canChange(s)&&spendXP(s,hero(s),k)}
export function addXP(s,n){return awardXP(s,hero(s),Object.fromEntries(DOMAINS.map(d=>[d,n/DOMAINS.length])),'training')}
function advanceDay(s,day){
 if(day!==s.day+1)throw Error('La chronologie doit avancer un jour à la fois');
 observeLife(s);s.day=day;for(let p of s.players){p.fatigue=clamp(p.fatigue-5);if(p.injury){p.injury--;if(!p.injury){p.returning=6;if(p.id===s.hero)sportingPause(s,`return-${s.day}`,'Le retour se prépare','La blessure est guérie. La reprise sera progressive pendant six matchs.');}}}
 let p=hero(s);if(p.rehabDeficit&&s.health?.rehab!=='pause'&&!p.injury){for(let k of ['speed','agility','vertical']){let gain=Math.min(.08,p.rehabDeficit[k]||0);p.rehabDeficit[k]-=gain;p.attrs[k]=Math.min(99,p.attrs[k]+gain);}if(Object.values(p.rehabDeficit).every(v=>v<.001))delete p.rehabDeficit;}
 s.charge=clamp(s.charge-1);environmentDay(s);trainingDay(s,p);collectiveDay(s);discussionDay(s);reviewCoach(s);if(s.life?.bonusTraining){addXP(s,55);s.life.bonusTraining=false;}lifeDay(s);marketDay(s);discussionDay(s);
}
function queueDecision(s,event){s.decisionQueue??=[];s.decisionQueue.push(event)}
function surfaceDecision(s){if(!s.pending&&s.decisionQueue?.length)s.pending=s.decisionQueue.shift()}

export function standings(s,id=s.league){let c=competition(s,id);return Object.entries(c.records).map(([tid,r])=>({...team(s,tid),...r})).sort((a,b)=>b.wins-a.wins||(b.for-b.against)-(a.for-a.against)||a.id.localeCompare(b.id))}
export function finalizeMatch(s,g,m){
 if(g.result)return false;if(!m.done)throw Error('Match incomplet');
 const c=competition(s,g.league),winner=m.score[0]>m.score[1]?g.home:g.away,loser=winner===g.home?g.away:g.home,mine=g.home===s.team||g.away===s.team;
 recordStatistics(s,g,m);
 finishCollectiveMatch(s,m);
 g.result={score:[...m.score],ot:m.ot,duration:m.duration,...(mine?{box:m.box,heroTeam:s.team,...(m.collective?{collective:collectiveSummary(m,s.hero)}:{})}:{} )};
 if(g.stage==='regular'){c.records[winner].wins++;c.records[loser].losses++;[g.home,g.away].forEach((id,i)=>{c.records[id].for+=m.score[i];c.records[id].against+=m.score[1-i]});}
 for(let b of Object.values(m.box)){let p=getPlayer(s,b.id);if(!b.min)continue;p.byLeague[g.league]??=totals();for(let stats of [p.season,p.byLeague[g.league]]){stats.gp++;for(let k of Object.keys(stats))if(k!=='gp')stats[k]+=b[k]||0;}
 if(p.returning)p.returning--;p.fatigue=clamp(p.fatigue+b.min*.34);
 const risk=.0019*(1+p.fatigue/80+(p.age>33?.3:0));if(rng(s,'career')<risk){let serious=rng(s,'career')<.09;p.injury=serious?60+Math.floor(rng(s,'career')*100):3+Math.floor(rng(s,'career')*15);
 recordInjury(s,p,p.injury,serious);
 if(p.id===s.hero){s.health??={rehab:'active',history:[]};s.health.history.push({season:s.season,day:s.day,days:p.injury,serious});if(serious){p.rehabDeficit={speed:3,agility:3,vertical:3};for(let k of Object.keys(p.rehabDeficit))p.attrs[k]=Math.max(25,p.attrs[k]-3);}
 queueDecision(s,{type:'medical',title:serious?'Blessure importante':'Passage à l’infirmerie',text:`${p.injury} jours estimés d’absence. Les matchs continuent et votre progression reprend avec la rééducation.`,choices:[['rehab','Suivre le programme de soins']]});log(s,'Blessure',`${p.injury} jours d’absence. ${serious?'Récupération complète possible avec la rééducation.':''}`);}}
 }
 if(mine){let p=hero(s),b=m.box[s.hero];s.lastMatch=structuredClone(m);s.grade=m.grade;s.records??={pts:0,reb:0,ast:0,stl:0,blk:0};for(let k of Object.keys(s.records)){if((b?.[k]||0)>s.records[k]){s.records[k]=b[k];if(k==='pts'&&b.pts>=20)log(s,'Record personnel',`${b.pts} points face à ${team(s,g.home===s.team?g.away:g.home).name}.`);}}
 if(b?.min){s.recent.push(m.grade);s.recent=s.recent.slice(-6);s.trust=clamp(s.trust*.8+s.recent.reduce((a,b)=>a+b,0)/s.recent.length*.2);s.relationships.coach=s.trust;let competitors=team(s).roster.map(id=>getPlayer(s,id)).filter(q=>q.id!==s.hero&&q.pos===p.pos),rival=competitors.length?Math.max(...competitors.map(overall)):leagueDef(s.league).level;
 let oldRole=s.role;let expected=19+(overall(p)-rival)*.62+(s.trust-50)*.19;s.minutes=Math.round(clamp(expected,10,Math.min(m.duration-4,38)));if(s.career.stage!=='pro')s.minutes=Math.max(21,s.minutes);s.role=s.minutes>=33?'Joueur majeur':s.minutes>=27?'Titulaire':s.minutes>=23?'Sixième homme':s.minutes>=17?'Rotation':'Développement';
 s.roleReason=`Niveau ${overall(p)} ; concurrence ${rival} au poste ; confiance ${Math.round(s.trust)}/100 ; dernières performances ${Math.round(s.recent.reduce((a,b)=>a+b,0)/s.recent.length)}/100.`;
 if(oldRole!==s.role&&s.day-(s.lastRoleNotice??-100)>=21){s.lastRoleNotice=s.day;if(['Titulaire','Joueur majeur'].includes(oldRole)||['Titulaire','Joueur majeur'].includes(s.role))sportingPause(s,`role-${s.day}-${s.role}`,'Votre place évolue : '+s.role,s.roleReason);log(s,'Rotation',`${s.role}, environ ${s.minutes} minutes. ${s.roleReason}`);}
 matchXP(s,p,b,g.league);masteryMatch(s,b.min);recordStintMatch(s,g,b);s.career.exposure=clamp(s.career.exposure+.3+(b.pts+b.ast+b.reb)/80);s.life.fame=clamp(s.life.fame+.08+Math.max(0,m.grade-65)*.012);if(s.career.stage!=='pro'&&p.season.gp%5===0)s.career.academics=clamp(s.career.academics-1);
 if(p.season.gp===1&&s.history.length===0)log(s,'Premier match',`${b.pts} points, ${b.ast} passes, ${b.reb} rebonds avec ${team(s).name}.`);
 }recordLegacyMatch(s,g,m);recordCoachMatch(s,m);recordTeamMatch(s,m);updateChapters(s,g,m);if(b?.min)s.form=clamp(s.form*.9+m.grade*.1);log(s,winner===s.team?'Victoire':'Défaite',`${leagueDef(g.league).name} · ${team(s,g.home).name} ${m.score[0]} – ${m.score[1]} ${team(s,g.away).name}. ${b?.pts||0} points, ${b?.ast||0} passes.`);
 }
 return true;
}

export function simulate(s,g){let m=startMatch(s,g);stepMatch(s,m,20000);finalizeMatch(s,g,m);return m}
function addFixture(s,c,home,away,day,meta={}){let g={id:`s${s.season}-${c.id}-post-${s.nextId++}`,league:c.id,round:100+(c.post?.round||0),home,away,day,result:null,stage:'post',...meta};scheduleDay(s,g,day);c.schedule.push(g);return g}
function winner(g){return g.result.score[0]>g.result.score[1]?g.home:g.away}
function loser(g){return winner(g)===g.home?g.away:g.home}
function orderedBracket(seeds){if(seeds.length===8)return [seeds[0],seeds[7],seeds[3],seeds[4],seeds[1],seeds[6],seeds[2],seeds[5]];if(seeds.length===4)return [seeds[0],seeds[3],seeds[1],seeds[2]];let out=[];for(let i=0;i<seeds.length/2;i++)out.push(seeds[i],seeds[seeds.length-1-i]);return out}
function beginSeries(s,c,seeds,day){
 c.post.stage='series';c.post.series=[];
 for(let i=0;i<seeds.length;i+=2){
  const pair=makeSeries(c,seeds[i],seeds[i+1],i/2);
  const g=addFixture(s,c,pair.a,pair.b,day,{series:i/2,seriesId:pair.id,roundId:pair.roundId,gameNumber:1,neutral:pair.neutral});
  pair.games.push(g.id);c.post.series.push(pair);
 }
 syncRound(c);
}
function postNotice(s,c,status,text){
 sportingPause(s,`${c.post.id}-${status}`,
  status==='qualified'?'Qualification en playoffs':status==='playin'?'Le play-in commence':'Fin de parcours',text,c.id);
}
function startPostseason(s,c){
 const def=leagueDef(c.id),rank=standings(s,c.id),day=Math.max(...c.schedule.map(g=>g.day))+3;
 settleAwards(s,c);
 c.phase='Playoffs';c.post={stage:'',round:0,groups:[]};seedPostseason(s,c,rank);
 const pools=def.id==='nba'?['Est','Ouest'].map(conf=>rank.filter(t=>t.conference===conf)):[rank];
 if(def.playIn){
  c.phase='Play-in';c.post.stage='playin';
  for(const pool of pools){
   const direct=def.id==='nbl'?2:6,group={locked:pool.slice(0,direct).map(t=>t.id),a:null,b:null,last:null,seeds:null};
   group.a=addFixture(s,c,pool[direct].id,pool[direct+1].id,day,{stage:'playin',playInRole:'upper'}).id;
   group.b=addFixture(s,c,pool[direct+2].id,pool[direct+3].id,day,{stage:'playin',playInRole:'lower'}).id;
   c.post.groups.push(group);
   const index=pool.findIndex(t=>t.id===s.team);
   if(index>=0)postNotice(s,c,index<direct?'qualified':index<direct+4?'playin':'out',index<direct?`${team(s).name} est directement qualifié en ${def.name}.`:index<direct+4?`${team(s).name} doit passer par le play-in pour rejoindre les playoffs.`:`${team(s).name} ne se qualifie pas. Le tournoi reste consultable dans Monde → Playoffs.`);
  }
 }else{
  beginSeries(s,c,orderedBracket(rank.slice(0,def.playoff).map(t=>t.id)),day);
  const index=rank.findIndex(t=>t.id===s.team);
  if(index>=0)postNotice(s,c,index<def.playoff?'qualified':'out',index<def.playoff?`${team(s).name} est qualifié en ${def.name}.`:`${team(s).name} ne se qualifie pas. Vous pouvez suivre toutes les séries dans Monde → Playoffs.`);
 }
}
function updateCompetition(s,c){
 if(c.phase==='Terminée')return;
 if(!c.post){if(c.schedule.every(g=>g.result))startPostseason(s,c);return;}
 if(c.post.stage==='playin'){
  for(const group of c.post.groups){
   const a=c.schedule.find(g=>g.id===group.a),b=c.schedule.find(g=>g.id===group.b);
   if(a.result&&b.result&&!group.last)group.last=addFixture(s,c,loser(a),winner(b),Math.max(a.day,b.day)+3,{stage:'playin',playInRole:'last'}).id;
   const last=c.schedule.find(g=>g.id===group.last);
   if(a.result&&winner(a)===s.team)postNotice(s,c,'qualified','Votre victoire au play-in vous ouvre les playoffs.');
   if(b.result&&loser(b)===s.team)postNotice(s,c,'out','La défaite au play-in met fin à votre course au titre.');
   if(last?.result){
    group.seeds=[...group.locked,winner(a),winner(last)];
    for(const [i,id] of group.seeds.entries())c.post.seeds[id]=i+1;
    if(winner(last)===s.team)postNotice(s,c,'qualified','La dernière place en playoffs est pour votre équipe.');
    if(loser(last)===s.team)postNotice(s,c,'out','Votre parcours s’arrête au dernier match de play-in.');
   }
  }
  if(c.post.groups.every(g=>g.seeds)){c.phase='Playoffs';beginSeries(s,c,c.post.groups.flatMap(g=>orderedBracket(g.seeds)),Math.max(...c.schedule.map(g=>g.day))+3);}
  return;
 }
 for(const pair of c.post.series){
  if(pair.winner)continue;
  const games=pair.games.map(id=>c.schedule.find(g=>g.id===id)),last=games.at(-1);
  if(!last.result)continue;
  pair.wins=[games.filter(g=>g.result&&winner(g)===pair.a).length,games.filter(g=>g.result&&winner(g)===pair.b).length];
  const target=Math.ceil(pair.best/2);
  if(Math.max(...pair.wins)>=target){
   pair.winner=pair.wins[0]>=target?pair.a:pair.b;recordLegacySeries(s,c,pair);updateChapters(s);
   if([pair.a,pair.b].includes(s.team)){
    const won=pair.winner===s.team,final=c.post.series.length===1;
    if(!won||!final)sportingPause(s,`${pair.id}-result`,won?'Un tour de plus':'Élimination',`${pair.name} · ${team(s,pair.a).name} ${pair.wins[0]}–${pair.wins[1]} ${team(s,pair.b).name}. ${won?'Votre équipe poursuit sa course.':'La suite du tournoi reste consultable.'}`,c.id);
   }
   continue;
  }
  const home=seriesHome(c.id,pair,games.length);
  const g=addFixture(s,c,home,home===pair.a?pair.b:pair.a,last.day+2,{series:c.post.series.indexOf(pair),seriesId:pair.id,roundId:pair.roundId,gameNumber:games.length+1,neutral:pair.neutral});
  pair.games.push(g.id);
 }
 syncRound(c);
 if(c.post.series.every(p=>p.winner)){
  const winners=c.post.series.map(p=>p.winner);
  if(winners.length===1){
   c.champion=winners[0];c.phase='Terminée';
   const title=awardTitle(s,c);recordWorldTitle(s,c);settleAwards(s,c,'finals');updateChapters(s);if(title?.eligible){recordLegacyTitle(s);sportingPause(s,title.id,'Vous êtes champion !',`${team(s,c.champion).name} remporte ${leagueDef(c.id).name}. Le titre rejoint immédiatement votre palmarès.`,c.id);}
   log(s,'Champion',`${team(s,c.champion).name} remporte ${leagueDef(c.id).name}.`);
  }else{c.post.round++;beginSeries(s,c,winners,Math.max(...c.schedule.map(g=>g.day))+3);}
 }
}
export function continueMatch(s,_ignored,count=50){if(s.retired||!s.match)return;let m=s.match;stepMatch(s,m,count);if(m.done){let c=competition(s,m.league),g=c.schedule.find(g=>g.id===m.id);finalizeMatch(s,g,m);s.match=null;updateCompetition(s,c);surfaceDecision(s);syncLeague(s);}}
export function next(s,{interactive=true,untilDay=null}={}){
 if(s.retired||s.pending||s.match||hasSportPause(s))return false;
 surfaceDecision(s);if(s.pending)return false;
 for(let c of s.competitions)updateCompetition(s,c);
 if(hasSportPause(s)){syncLeague(s);return true;}
 let games=allGames(s).filter(g=>!g.result).sort((a,b)=>a.day-b.day||a.id.localeCompare(b.id));
 if(!games.length){finishYear(s,untilDay);return true;}
 let target=games.find(g=>g.home===s.team||g.away===s.team)?.day??games[0].day;
 if(untilDay!==null)target=Math.min(target,untilDay);target=Math.max(s.day,target);
 for(;;){
 let due=allGames(s).filter(g=>!g.result&&g.day<=s.day).sort((a,b)=>a.day-b.day||a.id.localeCompare(b.id));
 for(let g of due){let mine=g.home===s.team||g.away===s.team;
 if(interactive&&mine&&s.mode!=='quick'){s.match=startMatch(s,g);syncLeague(s);return true;}
 simulate(s,g);updateCompetition(s,competition(s,g.league));surfaceDecision(s);if(s.pending||hasSportPause(s)){syncLeague(s);return true;}
 }
 for(let c of s.competitions)updateCompetition(s,c);
 if(hasSportPause(s)||s.day>=target){surfaceDecision(s);syncLeague(s);return true;}
 advanceDay(s,s.day+1);surfaceDecision(s);if(s.pending||hasSportPause(s)){syncLeague(s);return true;}
 }
}

export function scouting(s){let p=hero(s),st=p.season,production=st.min?(st.pts+st.ast*1.5+st.reb)*30/st.min:0;let score=overall(p)*.91+Math.min(30,production)*.26+(22-p.age)*.45+(s.career.exposure-50)*.02-(p.injury?3:0);return {score:+score.toFixed(1),production:+production.toFixed(1),projection:score>=83?'Top 10':score>=76?'Premier tour':score>=70?'Second tour':score>=66?'Fin de draft / non-drafté':'Non-drafté probable'}}

function offerFor(s,t,{academic=false,draftRank=null}={}){let p=hero(s),def=leagueDef(t.league),score=overall(p),rivals=t.roster.map(id=>getPlayer(s,id)).filter(q=>q.pos===p.pos&&q.id!==s.hero),rival=rivals.length?Math.max(...rivals.map(overall)):def.level;let payroll=t.roster.filter(id=>id!==s.hero).map(id=>getPlayer(s,id)).sort((a,b)=>overall(b)-overall(a)).reduce((n,q)=>n+q.contract.salary,0);let salary=academic?0:Math.min(Math.max(def.salary,def.salary*(1+(score-def.minOffer)/8)),Math.max(def.salary,t.budget-payroll));return {id:`offer-${s.nextId++}`,team:t.id,league:t.league,years:academic?1:draftRank?2:2+(score>78?1:0),salary:Math.round(salary),guarantee:1,option:draftRank?'Équipe':'Aucune',role:score>=rival?'Titulaire':score>=rival-8?'Rotation':'Développement',minutes:Math.round(clamp(24+(score-rival)*.7,12,34)),expires:s.day+14,academic,draftRank,reason:academic?`Programme ${rival>=65?'sélectif':'accessible'} · concurrence ${rival} · résultats scolaires ${Math.round(s.career.academics)}/100`:`${def.name} · niveau ${score} face à une concurrence de ${rival} au poste`}}
export function marketOffers(s,{includeNBA=true}={}){let p=hero(s),rating=overall(p)+(s.grade-50)/20+Math.min(3,s.career.exposure/30),offers=[];for(let def of LEAGUES.filter(l=>!l.amateur)){if(def.id==='nba'&&!includeNBA)continue;let clubs=s.teams.filter(t=>t.league===def.id&&t.id!==s.team&&rating>=def.minOffer&&(!t.competitions.includes('euroleague')||rating>=67));clubs.sort((a,b)=>{let fit=t=>t.roster.filter(id=>getPlayer(s,id).pos===p.pos).reduce((n,id)=>Math.max(n,overall(getPlayer(s,id))),45);return fit(a)-fit(b)});if(clubs.length)offers.push(offerFor(s,clubs[0]));}if(!offers.length){let club=s.teams.filter(t=>t.league==='elite'&&!t.competitions.includes('euroleague')).sort((a,b)=>a.roster.reduce((n,id)=>n+overall(getPlayer(s,id)),0)-b.roster.reduce((n,id)=>n+overall(getPlayer(s,id)),0))[0];let o=offerFor(s,club);o.role='Développement';o.minutes=8;o.salary=45000;o.reason='Contrat de développement : faible salaire, temps de jeu à gagner.';offers.push(o)}return offers}
function collegeOffers(s){let score=(s.lastSeasonScouting||scouting(s)).score,clubs=s.teams.filter(t=>t.league==='ncaa');let ranked=clubs.sort((a,b)=>b.roster.reduce((n,id)=>n+overall(getPlayer(s,id)),0)-a.roster.reduce((n,id)=>n+overall(getPlayer(s,id)),0));let start=score>=67&&s.career.academics>=65?0:score>=60?9:23;return ranked.slice(start,start+3).map(t=>offerFor(s,t,{academic:true}))}
function moveHero(s,destination){if(destination!==s.team)closeTeamWork(s,'Le changement de club met fin à ce travail.');if(destination!==s.team)reviewCoach(s,'Le changement de club clôt cette évaluation. Un nouveau coach évaluera votre rôle.');let old=team(s),dest=team(s,destination),p=hero(s);if(old.id===dest.id)return;old.roster=old.roster.filter(id=>id!==s.hero);if(old.roster.length<10){let free=(s.freeAgents||[]).map(id=>getPlayer(s,id)).find(q=>q&&!q.injury);if(free){old.roster.push(free.id);s.freeAgents=s.freeAgents.filter(id=>id!==free.id)}else{let replacement=generatedPlayer(s,`replacement-${s.season}-${s.nextId++}`,old);s.players.push(replacement);old.roster.push(replacement.id);}}
 if(dest.roster.length>=19){let weakest=dest.roster.map(id=>getPlayer(s,id)).sort((a,b)=>overall(a)-overall(b))[0];dest.roster=dest.roster.filter(id=>id!==weakest.id);s.freeAgents.push(weakest.id);}dest.roster.push(s.hero);s.team=dest.id;s.league=dest.league;transferMastery(s,old.system,dest.system);openStint(s);s.trust=55;s.recent=[];p.fatigue=clamp(p.fatigue-10);syncCollective(s);}

export function openContractNegotiations(s,{exempt=false}={}){
 const p=hero(s);
 return openNegotiations(s,s.offers.map(o=>{const t=team(s,o.team),rivals=t.roster.map(id=>getPlayer(s,id)).filter(q=>q.id!==s.hero&&q.pos===p.pos),rival=rivals.length?Math.max(...rivals.map(overall)):leagueDef(t.league).level;
 return {offerId:o.id,salary:o.salary,years:o.years,age:p.age,gap:overall(p)-rival,budget:t.budget,payroll:t.roster.filter(id=>id!==s.hero).reduce((n,id)=>n+getPlayer(s,id).contract.salary,0),exempt:exempt||!!o.academic||!!o.draftRank};}));
}
export function sign(s,index,choice=null){if(!canChange(s,{pending:true}))return false;let o=s.offers[index];if(!o||s.pending?.type!=='contract')return false;if(!team(s,o.team))return false;let prepared=null;
 if(s.representation?.session){const e=s.representation.session.offers.find(e=>e.offerId===o.id);if(choice&&choice.offerId!==o.id)return false;prepared=prepareSignature(s,choice||{offerId:o.id,source:'initial',revision:e?.revision});if(!prepared.ok)return false;o={...o,...prepared.terms};}else if(choice)return false;
 let origin=team(s).name;moveHero(s,o.team);let p=hero(s);p.contract={years:o.years,salary:o.salary,guarantee:o.guarantee,option:o.option};s.role=o.role;s.minutes=o.minutes;if(o.academic){s.career.stage='college';s.career.collegeYears=0}else s.career.stage='pro';if(prepared)finishSignature(s,prepared);s.pending=null;s.offers=[];s.lastTransfer=s.day;s.career.milestones.push({season:s.season,day:s.day,text:`${origin} → ${team(s).name} (${leagueDef(s.league).name})`});log(s,o.academic?'Université choisie':'Contrat signé',`${team(s).name} · ${leagueDef(s.league).name} · ${o.academic?'Scolarité et basket universitaire':`${o.years} ans · ${o.salary.toLocaleString('fr-FR')} € par saison (simulation)`} · rôle ${o.role}.`);refreshAmbition(s);syncLeague(s);return true}
export function requestTrade(s){if(s.pending||s.match||s.retired)return false;if(s.career.stage!=='pro'){log(s,'Orientation','Terminez votre saison : les choix universitaires et professionnels arrivent à l’intersaison.');return false}if(s.lastMarketDay!==undefined&&s.day-s.lastMarketDay<20){log(s,'Agent','Les clubs attendent de nouvelles performances. Prochaine démarche après vingt jours.');return false}s.lastMarketDay=s.day;if(hero(s).contract.years>1&&s.round<8){log(s,'Transfert refusé','Votre club ne vous libère pas aussi tôt. Huit matchs et de nouvelles performances sont nécessaires avant une autre démarche.');s.relationships.agent=clamp(s.relationships.agent+3);return false}s.offers=marketOffers(s);s.pending={type:'contract',title:'Votre marché international',text:'Offres filtrées selon votre niveau, votre production et les besoins des clubs. Le changement de pays conserve votre carrière ; vous rejoignez le calendrier en cours.',canDecline:true};openContractNegotiations(s);return true}
export function enterDraft(s){if(!canChange(s,{pending:s.pending?.type==='draft-choice'}))return false;if(s.career.draftEntered||s.career.stage!=='college'||hero(s).age<19||s.career.collegeYears<1)return false;let estimate=s.lastSeasonScouting||scouting(s);let prospects=s.world.draftPool?.length?s.world.draftPool:Array.from({length:60},(_,i)=>({id:'prospect-'+s.season+'-'+i,score:58+rng(s,'players')*26+(i<8?4:0)}));let actual=estimate.score+(rng(s,'career')-.5)*4;let rank=1+prospects.filter(p=>p.score>actual).length;s.career.draftEntered=true;s.draftResult={season:s.season-1,rank:rank<=60?rank:null,projection:estimate.projection,evaluation:actual};
 let prior=s.archives.at(-1)?.competitions?.find(c=>c.id==='nba')?.records;let nba=prior?Object.entries(prior).sort((a,b)=>a[1].wins-b[1].wins||(a[1].for-a[1].against)-(b[1].for-b[1].against)).map(([id])=>team(s,id)):standings(s,'nba').reverse();if(rank<=60){let t=nba[(rank-1)%30];let displaced=s.lastDraft?.find(q=>q.pick===rank);if(displaced){let prospect=getPlayer(s,displaced.id);if(prospect)prospect.draft={season:s.season-1,pick:null,team:null};hero(s).draft={season:s.season-1,pick:rank,team:t.id};let club=s.teams.find(q=>q.roster.includes(displaced.id));if(club)club.roster=club.roster.filter(id=>id!==displaced.id);if(!s.freeAgents.includes(displaced.id))s.freeAgents.push(displaced.id);s.lastDraft=s.lastDraft.filter(q=>q.pick!==rank);s.lastDraft.push({id:s.hero,name:hero(s).name,team:t.name,league:'nba',pos:hero(s).pos,ovr:overall(hero(s)),age:hero(s).age,pick:rank});s.lastDraft.sort((a,b)=>a.pick-b.pick);if(s.world.drafts.length)s.world.drafts.at(-1).picks=s.lastDraft;}s.offers=[offerFor(s,t,{draftRank:rank}),...marketOffers(s,{includeNBA:false}).slice(0,3)];s.pending={type:'contract',title:`Draft NBA · choix n° ${rank}`,text:`${t.name} vous sélectionne. Vous pouvez signer dans cette franchise ou choisir une offre hors NBA. Aucune autre franchise NBA ne vous est proposée à la draft.`};log(s,'Draft NBA',`${hero(s).name} sélectionné n° ${rank} par ${t.name}.`)}else{s.offers=marketOffers(s,{includeNBA:false});s.pending={type:'contract',title:'Non-drafté : votre carrière continue',text:'Aucune franchise ne vous a sélectionné. Voici les possibilités concrètes à l’étranger. De bonnes performances pourront ouvrir une porte en NBA lors d’un prochain marché.'};log(s,'Draft NBA','Non-drafté. Votre agent recherche des clubs dans les championnats compatibles avec votre niveau.')}openContractNegotiations(s,{exempt:true});return true}
export function decide(s,choice){if(!canChange(s,{pending:true})||!s.pending)return false;if(s.pending.type==='life')return resolveLife(s,choice);if(['medical','sport','offseason'].includes(s.pending.type)){if(!s.pending.choices?.some(c=>c[0]===choice))return false;if(s.pending.type==='medical'){s.health??={history:[]};s.health.rehab='active';}if(s.pending.type==='offseason'){s.activity=choice==='rest'?'repos':'individuel';if(choice==='shoot')s.trainingPlan.domain='Tir';if(choice==='body')s.trainingPlan.domain='Physique';}s.pending=null;return true;}if(choice==='decline'&&s.pending.canDecline){closeNegotiations(s,'Offres déclinées.');s.pending=null;s.offers=[];syncLeague(s);return true}if(s.pending.type==='draft-choice'){if(choice==='stay'&&s.career.collegeYears<4){s.pending=null;syncLeague(s);log(s,'Retour à l’université',`Année ${s.career.collegeYears+1} avec ${team(s).name}. Votre progression et votre exposition se poursuivent.`);return true}if(choice==='draft')return enterDraft(s)}return false}
function refreshAI(s){refreshWorld(s);discussionDay(s);reviewCoach(s)}
function finishYear(s,untilDay=null){let p=hero(s),stage=s.career.stage,oldYear=s.season;if(s.day<s.season*365){if(!s.offseasonStarted){s.offseasonStarted=true;s.pending={type:'offseason',title:'Votre intersaison commence',text:'Une période distincte pour récupérer ou travailler un domaine avant les nouveaux contrats.',choices:[['rest','Récupérer'],['shoot','Travailler le tir'],['body','Renforcer le physique']]};return;}while(s.day<Math.min(s.season*365,untilDay??Infinity)){advanceDay(s,s.day+1);surfaceDecision(s);if(s.pending||hasSportPause(s))return;}if(s.day<s.season*365)return;}s.offseasonStarted=false;const closingStint=s.careerLedger.stints.at(-1);if(closingStint?.to===null)closingStint.to=s.day;let primary=competition(s);const mvp=s.statistics.awards.find(a=>a.season===s.season&&a.league===s.league&&a.kind==='mvp')?.winners[0];const yearStatistics=closeStatistics(s);closeChapters(s);s.history.push({season:s.season,team:seasonStints(s).map(t=>team(s,t.team).name).filter((n,i,a)=>a.indexOf(n)===i).join(' → ')||team(s).name,stints:structuredClone(seasonStints(s)),opening:s.careerLedger.opening?.season===s.season?structuredClone(s.careerLedger.opening):null,titles:structuredClone(seasonTitles(s)),league:s.league,stage,stats:structuredClone(p.season),ovr:overall(p),champion:primary.champion?team(s,primary.champion).name:'—',mvp:mvp?.name||'Non attribué · données insuffisantes',salary:p.contract.salary});s.archives.push({season:s.season,team:s.team,league:s.league,statistics:yearStatistics,players:s.players.filter(q=>q.season.gp).map(q=>({id:q.id,name:q.name,age:q.age,pos:q.pos,stats:q.season,ovr:overall(q)})),competitions:s.competitions.map(c=>({id:c.id,champion:c.champion,post:structuredClone(c.post),records:structuredClone(c.records),games:c.schedule.map(g=>({id:g.id,home:g.home,away:g.away,round:g.round,league:g.league,day:g.day,stage:g.stage,seriesId:g.seriesId,roundId:g.roundId,gameNumber:g.gameNumber,neutral:g.neutral,score:g.result?.score||null}))}))});
 finishLegacySeason(s,mvp?.id);s.lastSeasonScouting=scouting(s);s.lastSeasonStats=structuredClone(p.season);p.age++;if(stage==='highschool')s.career.hsYears++;if(stage==='college')s.career.collegeYears++;if(stage==='pro'){if(p.contract.years===1&&p.contract.option==='Équipe'&&overall(p)>=72){p.contract.years++;p.contract.option='Aucune';log(s,'Option exercée','Votre club prolonge votre contrat d’une saison.')}p.contract.years=Math.max(0,p.contract.years-1)}
 s.season++;s.lastDraft=[];refreshAI(s);p.season=totals();p.byLeague={};p.fatigue=Math.max(0,p.fatigue-15);let aging=ageAttributes(p,{care:s.activity==='repos'?1.35:1.15});closeDevelopmentYear(s,p,aging);if(Object.values(aging).some(v=>v<0))log(s,'Évolution avec l’âge',`${p.age} ans : l’explosivité demande davantage d’entretien ; le tir et la lecture du jeu se conservent plus longtemps. Le bilan détaillé est dans Joueur.`);s.activity='individuel';setupCompetitions(s);beginLegacySeason(s);openStint(s);beginStatistics(s);beginChapters(s);s.lastMatch=null;log(s,'Nouvelle saison',`Saison ${s.season}. ${p.age} ans · ${overall(p)} de général · ${s.development.gained} améliorations depuis le début.`);
 if(p.age>=47){retireCareer(s);log(s,'Retraite','Votre carrière se termine. Les archives, contrats et statistiques restent consultables.')}else if(stage==='highschool'&&p.age>=18){s.offers=collegeOffers(s);s.pending={type:'contract',title:'Du lycée à l’université',text:`Deux éléments comptent : le basket et les études. Votre dossier (${Math.round(s.career.academics)}/100) et vos performances ont retenu l’attention de ces programmes.`}}else if(stage==='college'){s.pending={type:'draft-choice',title:s.career.collegeYears>=4?'Dernière année universitaire terminée':'Rester à l’université ou tenter la NBA ?',text:`${s.career.collegeYears} saison(s) universitaire(s). Projection : ${s.lastSeasonScouting.projection}. ${s.career.collegeYears<4?'Une autre saison peut améliorer votre niveau et votre position.':'Votre éligibilité universitaire est épuisée : place au passage professionnel.'}`}}else if(stage==='pro'&&p.contract.years===0){s.offers=marketOffers(s);s.offers.unshift(offerFor(s,team(s)));s.pending={type:'contract',title:'Fin de contrat · quel championnat ensuite ?',text:'Restez dans votre club ou changez de ligue selon les propositions obtenues.'}}
 if(s.pending?.type==='contract')openContractNegotiations(s);
 sportingPause(s,`review-${oldYear}`,'Le bilan de votre saison',`La saison ${oldYear} est archivée. Retrouvez son bilan et votre parcours dans Carrière.`);
 syncLeague(s)
}
export function grade(n){return n>=90?'A+':n>=80?'A':n>=70?'B+':n>=60?'B':n>=50?'C':n>=40?'D':'F'}
function migrateV1(old){if(!old||![1,2].includes(old.schema)||!Array.isArray(old.players)||!Array.isArray(old.teams))throw Error('Ancienne sauvegarde invalide');let p=old.players.find(p=>p.id===old.hero);if(!p?.attrs||KEYS.some(k=>!Number.isFinite(p.attrs[k])||p.attrs[k]<25||p.attrs[k]>99))throw Error('Ancien joueur invalide');let build={...defaultBuild(),...p,path:old.phase==='Formation'?(p.age<18?'young':'prospect'):'rookie',seed:old.rng.players,caps:p.caps};let s=createGame(build),q=hero(s);for(let key of ['name','age','attrs','badges','learned','equipped','height','weight','wingspan','pos','secondary','nation','style'])q[key]=structuredClone(p[key]);q.practice={};s.points=old.points;s.xp=old.xp;s.auto=old.auto??true;s.money=old.money;delete s.life.finance;s.history=structuredClone(old.history||[]);s.trophies=structuredClone(old.trophies||[]);s.records=structuredClone(old.records||{});s.legacyArchive={season:old.season,team:old.teams.find(t=>t.id===old.team)?.name,stats:p.season,calendar:old.schedule,match:old.match,log:old.log};s.season=old.season+1;s.day=(s.season-1)*365;setupCompetitions(s);s.pending=null;if(s.career.stage==='pro'){s.offers=marketOffers(s);s.pending={type:'contract',title:'Votre carrière rejoint les ligues réelles',text:'Votre joueur, ses attributs, points, revenus et historique ont été conservés. L’ancienne saison est archivée ; choisissez une offre pour commencer dans le nouveau championnat.'}}log(s,'Mise à jour 3.0','Progression accélérée, monde multi-ligues et nouveau parcours scolaire. Une copie intégrale de l’ancienne sauvegarde est conservée séparément.');return syncLeague(s)}

export function migrateLegacy(old){
 if(!old||![1,2,3,4].includes(old.schema))throw Error('Sauvegarde incompatible');
 if(old.schema===4){
  if(old.engine===VERSION)return validate(old);
  if(!['3.0.0','3.1.0','3.2.0','3.3.0','3.4.0','3.5.0','3.6.0','3.7.0'].includes(old.engine))throw Error('Version de moteur incompatible');
  let s=structuredClone(old);delete s.collective;if(old.engine!=='3.7.0')delete s.environment;else s.environment.trainingProcessedDay??=null;s.engine=VERSION;initDevelopment(s);
  // Recover prior selections from V3 archives so an existing rookie cannot be drafted again.
  for(let year of s.world?.drafts||[])for(let pick of year.picks||[]){let p=getPlayer(s,pick.id);if(p&&!p.draft&&Number.isInteger(pick.pick)&&pick.pick>0)p.draft={season:year.season,pick:pick.pick,team:s.teams.find(t=>t.name===pick.team)?.id||null};}
  initLegacy(s,true);initV33(s,true);initV34(s,true);initLife(s);initWorld(s);log(s,'Mise à jour 3.8','Collectif : automatismes partagés et préparation facultative. Aucun stage acheté automatiquement. Votre coach payé et votre match commencé restent conservés.');return validate(s);
 }
 let s=old.schema===3?structuredClone(old):migrateV1(old),p=hero(s);
 if(!p)throw Error('Joueur principal absent');
 delete s.environment;delete s.collective;s.schema=4;s.engine=VERSION;s.pack='world-2025-v3';s.rng.life??=((s.rng.career+1777)>>>0)||1777;
 for(let q of s.players){q.caps=limits();q.absolute=limits();q.tendencyMode??='auto';}
 initDevelopment(s);initLife(s);initWorld(s);s.health??={rehab:'active',history:[]};s.journal??=structuredClone(s.log||[]).reverse();
 let credit=Math.max(0,Number(s.points)||0)*75+Math.max(0,Number(s.xp)||0);for(let d of DOMAINS)s.development.xp[d]+=Math.floor(credit/DOMAINS.length);s.points=0;s.xp=0;
 // The old partial match is kept as evidence; replay starts before its first possession.
 if(s.match){s.legacyMatch=structuredClone(s.match);s.match=null;log(s,'Migration de match','Le match V2 inachevé est conservé dans l’archive et sera rejoué avec le moteur automatique. Les matchs terminés restent inchangés.');}
 delete s.legacy;delete s.statistics;delete s.chapters;initLegacy(s,true);initV33(s,true);initV34(s,true);log(s,'Mise à jour 3.0','XP par domaine, plafond commun de 99 et matchs automatiques. Votre carrière et vos joueurs existants sont conservés. Les effectifs NBA réels concernent les nouvelles parties.');return validate(s);
}
function initV33(s,recovered=false){
 initSimulation(s);initSportEvents(s);initMastery(s,recovered);initCareerLedger(s,recovered);
 for(const c of s.competitions){recoverPostseason(s,c,standings(s,c.id));if(recovered&&c.champion){const title=awardTitle(s,c,{recovered:true});if(title?.eligible)recordLegacyTitle(s);}}
}
function initV34(s,recovered=false){initStatistics(s,recovered);initCareerPlan(s);beginChapters(s);initEnvironment(s);initCollective(s);s.mastery.sources.collective??=0;}
export function validate(s){
 if(!s||s.schema!==4||s.engine!==VERSION||!Array.isArray(s.players)||!Array.isArray(s.teams)||!Array.isArray(s.competitions)||s.competitions.length!==LEAGUES.length||!s.career||!s.rng)throw Error('Sauvegarde incompatible');
 let ids=new Set();for(let p of s.players){if(typeof p.id!=='string'||!/^[a-zA-Z0-9-]{1,150}$/.test(p.id)||ids.has(p.id))throw Error('Identifiant joueur invalide');ids.add(p.id);if(!WEIGHTS[p.pos]||typeof p.name!=='string'||!Number.isFinite(p.age)||p.age<16||p.age>80||KEYS.some(k=>!Number.isFinite(p.attrs?.[k])||p.attrs[k]<25||p.attrs[k]>99)||!p.season||!p.byLeague||!p.contract||!Number.isFinite(p.contract.salary)||p.contract.salary<0||!p.badges||!Array.isArray(p.equipped)||!Array.isArray(p.learned)||!Number.isFinite(p.injury)||p.injury<0)throw Error('Joueur invalide');}
 let active=new Set(),clubs=new Set();for(let t of s.teams){if(clubs.has(t.id)||!leagueDef(t.league)||typeof t.name!=='string'||t.roster?.length<5||t.roster?.length>20)throw Error('Club invalide');clubs.add(t.id);for(let id of t.roster){if(!ids.has(id)||active.has(id))throw Error('Effectif incohérent');active.add(id);}}
 let p=hero(s);if(!p||!active.has(s.hero)||!clubs.has(s.team)||!STYLES[p.style])throw Error('Profil invalide');
 for(let k of ['day','season','points','xp','money','trust','minutes','grade','nextId'])if(!Number.isFinite(s[k])||s[k]<0)throw Error('Progression invalide');
 for(let key of ['match','players','career','life'])if(!Number.isInteger(s.rng[key])||s.rng[key]<=0||s.rng[key]>4294967295)throw Error('Aléatoire invalide');
 if(!team(s).roster.includes(s.hero)||!team(s).competitions.includes(s.league)||!['highschool','college','pro'].includes(s.career.stage)||!KEYS.includes(s.training)||!['quick','key','detail'].includes(s.mode))throw Error('Carrière invalide');
 for(let d of DOMAINS)if(!Number.isFinite(s.development?.xp?.[d])||s.development.xp[d]<0)throw Error('XP invalide');
 if(!s.life||!Number.isFinite(s.life.investments)||s.life.investments<0||!Array.isArray(s.life.children)||!s.trainingPlan||!DOMAINS.includes(s.trainingPlan.domain))throw Error('Vie personnelle invalide');
 const finance=s.life.finance,policies=s.life.policies;
 if(!finance||![0,10,20,30,50].includes(finance.percent)||![0,5000,25000,100000].includes(finance.reserve)||![30,90].includes(finance.frequency)||typeof finance.automatic!=='boolean'||!Number.isFinite(finance.lastDay)||!finance.start||!finance.totals||['cash','investments','property'].some(k=>!Number.isFinite(finance.totals[k]))||s.life.property&&(!Number.isFinite(s.life.property.value)||s.life.property.value<0))throw Error('Consigne financière invalide');
 if(!policies||!['manual','family','rest','work'].includes(policies.routine)||!['manual','team','rest','ambition'].includes(policies.media)||!['manual','local','rest'].includes(policies.agent)||!s.life.preferences||!['local','national','none'].includes(s.life.preferences.exposure)||['stories','history','ledger','delegationLog','storySeen'].some(k=>!Array.isArray(s.life[k]))||!s.life.people)throw Error('Suivi personnel invalide');
 for(let o of s.offers||[])if(!clubs.has(o.team)||!Number.isFinite(o.salary)||o.salary<0||!Number.isInteger(o.years)||o.years<1||!Number.isFinite(o.minutes)||o.minutes<0||o.minutes>48)throw Error('Offre invalide');
 let gids=new Set(),cids=new Set();for(let c of s.competitions){if(cids.has(c.id)||!leagueDef(c.id)||!Array.isArray(c.schedule)||!c.records)throw Error('Compétition invalide');cids.add(c.id);for(let g of c.schedule){if(gids.has(g.id)||g.league!==c.id||!clubs.has(g.home)||!clubs.has(g.away)||g.home===g.away||!Number.isFinite(g.day))throw Error('Calendrier invalide');gids.add(g.id);if(g.result&&(!Array.isArray(g.result.score)||g.result.score.length!==2||g.result.score.some(x=>!Number.isInteger(x)||x<0)))throw Error('Résultat invalide');}}
 if(s.match&&(!gids.has(s.match.id)||!s.match.box||!Number.isInteger(s.match.n)||!Number.isInteger(s.match.regulation)||s.match.rulesVersion&&!['3.0.0','3.1.0','3.2.0','3.3.0','3.4.0','3.5.0','3.8.0'].includes(s.match.rulesVersion)))throw Error('Match invalide');
 for(let k of ['log','history','archives','offers','trophies','recent','journal'])if(!Array.isArray(s[k]))throw Error('Historique invalide');
 if(s.pending&&!['contract','draft-choice','life','medical','sport','offseason'].includes(s.pending.type))throw Error('Décision invalide');validateLegacy(s);validateSimulation(s);validateStatistics(s);
 if(!s.careerPlan||!s.chapters||s.chapters.current?.season!==s.season)throw Error('Suivi V3.4 invalide');validateDiscussions(s);validateEnvironment(s);validateCollective(s);validateCollectiveMatch(s,s.match);validateCollectiveMatch(s,s.lastMatch,{historical:true});
 if(!s.mastery||!Number.isFinite(s.system)||s.system<0||s.system>100||!s.careerLedger||!Array.isArray(s.careerLedger.stints)||!Array.isArray(s.careerLedger.titles)||!s.sportEvents||!Array.isArray(s.sportEvents.seen)||s.sportEvents.notice&&!Array.isArray(s.sportEvents.notice.items))throw Error('Suivi V3.3 invalide');
 if(s.mastery.version!==1||!Array.isArray(s.mastery.recent)||['match','training','video','collective'].some(k=>!Number.isFinite(s.mastery.sources?.[k])||s.mastery.sources[k]<0))throw Error('Maîtrise invalide');
 if(s.careerLedger.version!==1||new Set(s.careerLedger.titles.map(t=>t.id)).size!==s.careerLedger.titles.length||s.careerLedger.stints.some(t=>!clubs.has(t.team)||!Array.isArray(t.games)||!t.stats||Object.values(t.stats).some(v=>!Number.isFinite(v)||v<0))||s.careerLedger.titles.some(t=>typeof t.id!=='string'||typeof t.name!=='string'||typeof t.eligible!=='boolean'))throw Error('Parcours par club invalide');
 if(s.sportEvents.seen.some(id=>typeof id!=='string')||s.sportEvents.notice?.items.some(e=>typeof e.id!=='string'||typeof e.title!=='string'||typeof e.text!=='string'))throw Error('Étape sportive invalide');
 return syncLeague(s);
}
