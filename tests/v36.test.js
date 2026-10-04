import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,team,competition,migrateLegacy,validate,sign,next} from '../dist/engine.js';
import {VERSION} from '../dist/config.js';
import * as plan from '../dist/career-plan.js';
import {retireCareer} from '../dist/commands.js';
import {startMatch,stepMatch} from '../dist/match.js';
const make=()=>createGame({...defaultBuild(),path:'rookie'});
test('discussions : délais partagés, priorité persistante, sans RNG ni journée cachée',()=>{
 const s=make(),rng=structuredClone(s.rng),trust=s.trust,minutes=s.minutes,activity=s.activity;
 assert.ok(plan.discuss(s,'coach-plan'));assert.match(s.careerPlan.discussions.history.at(-1).text,/concurrence/i);assert.equal(plan.discuss(s,'coach-plan'),false);
 assert.ok(plan.discuss(s,'agent-title'));assert.equal(s.careerPlan.preference,'title');assert.equal(plan.discuss(s,'agent-salary'),false);assert.ok(plan.discuss(s,'team-work'));assert.equal(plan.discuss(s,'team-work'),false);
 assert.equal(s.day,0);assert.deepEqual(s.rng,rng);assert.equal(s.trust,trust);assert.equal(s.minutes,minutes);assert.equal(s.activity,activity);s.day=7;assert.ok(plan.discuss(s,'agent-salary'));assert.equal(s.careerPlan.preference,'salary');assert.deepEqual(migrateLegacy(structuredClone(s)),s);
});
test('commandes interdites ou sujet inconnu : aucune mutation',()=>{
 for(const flag of ['match','pending','retired']){const s=make();s[flag]=true;const old=structuredClone(s);assert.equal(plan.discuss(s,'team-work'),false);assert.deepEqual(s,old);}
 const s=make(),old=structuredClone(s);assert.equal(plan.discuss(s,'agent-__proto__'),false);assert.deepEqual(s,old);
});
test('engagement : compteurs idempotents, prime unique au bilan',()=>{
 const s=make();s.activity='video';plan.discuss(s,'team-work');const initial=s.relationships.team;
 for(let day=1;day<=3;day++){s.day=day;plan.discussionDay(s);plan.discussionDay(s);}
 const fixture=id=>({id,home:s.team,away:'other',box:{[s.hero]:{min:12}},done:true});plan.recordTeamMatch(s,fixture('a'));plan.recordTeamMatch(s,fixture('a'));plan.recordTeamMatch(s,fixture('b'));
 assert.equal(s.careerPlan.discussions.teamwork.videoDays,3);assert.equal(s.careerPlan.discussions.teamwork.games.length,2);assert.equal(s.relationships.team,initial);s.day=22;plan.discussionDay(s);assert.equal(s.relationships.team,initial+3);assert.equal(s.careerPlan.discussions.teamwork,null);
 const old=structuredClone(s);plan.discussionDay(s);assert.deepEqual(s,old);assert.equal(plan.discuss(s,'team-work'),false);s.day=30;assert.ok(plan.discuss(s,'team-work'));
});
test('blessure et calendrier sans match : pas de prime ni pénalité',()=>{
 const s=make();plan.discuss(s,'team-work');const initial=s.relationships.team;hero(s).injury=30;s.activity='video';s.day=1;plan.discussionDay(s);assert.equal(s.careerPlan.discussions.teamwork.videoDays,0);s.day=22;plan.discussionDay(s);assert.equal(s.relationships.team,initial);assert.match(s.careerPlan.discussions.history.at(-1).text,/sans pénalité/);
});
test('transfert et départ du référent : clôture sans prime',()=>{
 const s=make();plan.discuss(s,'team-work');const dest=s.teams.find(t=>t.id!==s.team&&t.league==='nba');s.pending={type:'contract'};s.offers=[{team:dest.id,years:2,salary:1e6,role:'Titulaire',minutes:30}];sign(s,0);assert.equal(s.careerPlan.discussions.teamwork,null);assert.match(s.careerPlan.discussions.history.at(-1).text,/changement de club/);
 const a=make();plan.discuss(a,'team-work');const e=a.careerPlan.discussions.teamwork;team(a).roster=team(a).roster.filter(id=>id!==e.personId);plan.discussionDay(a);assert.equal(a.careerPlan.discussions.teamwork,null);assert.match(a.careerPlan.discussions.history.at(-1).text,/quitté/);
});
test('retraite manuelle et changement de coach : engagements clos',()=>{
 const s=make();plan.discuss(s,'team-work');assert.ok(retireCareer(s));assert.equal(s.careerPlan.discussions.teamwork,null);
 const a=make();plan.requestRole(a);a.pending=null;team(a).coach='Nouveau coach';plan.reviewCoach(a);assert.equal(a.careerPlan.evaluation,null);assert.match(a.careerPlan.reviews.at(-1).text,/coach/);
});
test('migration 3.5 : neutre, idempotente, match commencé exact',()=>{
 const s=make();s.engine='3.5.0';delete s.careerPlan.discussions;s.match=startMatch(s,competition(s).schedule[0]);stepMatch(s,s.match,36);const old=structuredClone(s),m=migrateLegacy(s);assert.equal(m.engine,VERSION);assert.deepEqual(m.rng,old.rng);assert.deepEqual(m.match,old.match);assert.deepEqual(m.careerPlan.discussions,{version:1,history:[],cooldowns:{},teamwork:null});stepMatch(m,m.match,10000);stepMatch(old,old.match,10000);assert.deepEqual(m.match,old.match);assert.deepEqual(migrateLegacy(m),m);
});
test('import invalide : préférence, compteur, échéance, interlocuteur, historique',()=>{
 const cases=[s=>s.careerPlan.preference='bogus',s=>s.careerPlan.discussions.cooldowns.agent=NaN,s=>s.careerPlan.discussions.teamwork.videoDays=-1,s=>s.careerPlan.discussions.teamwork.due=NaN,s=>s.careerPlan.discussions.teamwork.personId=null,s=>s.careerPlan.discussions.history.push({text:4})];for(const change of cases){const s=make();plan.discuss(s,'team-work');change(s);assert.throws(()=>validate(s),/Discussion|Engagement|Priorité/);}
});
test('historique borné et anciennes évaluations sans coach conservées',()=>{
 const s=make();for(let i=0;i<50;i++){s.day=i*7;assert.ok(plan.discuss(s,'coach-plan'));}assert.equal(s.careerPlan.discussions.history.length,40);
 const a=make();plan.requestRole(a);a.pending=null;a.engine='3.5.0';delete a.careerPlan.discussions;delete a.careerPlan.evaluation.coach;const m=migrateLegacy(a);plan.reviewCoach(m);assert.ok(m.careerPlan.evaluation);assert.equal(m.careerPlan.evaluation.coach,undefined);
});
test('moteur réel : journées vidéo et premier match alimentent le suivi',()=>{
 const s=make();plan.discuss(s,'team-work');s.activity='video';s.life.policies={routine:'family',media:'team',agent:'local'};let steps=0;while(s.day<4&&steps++<20){s.pending=null;s.sportEvents.notice=null;next(s,{interactive:false});}assert.equal(s.careerPlan.discussions.teamwork.videoDays,s.day);assert.equal(s.careerPlan.discussions.teamwork.games.length,1);
});
test('vue : échappement, absence de mutation et boutons bloqués',async()=>{
 const {discussionsView}=await import('../dist/v36-view.js');const s=make();team(s).coach='<script>test</script>';plan.discuss(s,'coach-plan');plan.discuss(s,'team-work');const old=structuredClone(s),html=discussionsView(s);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/0\/2 matchs/);assert.deepEqual(s,old);s.pending={type:'sport'};assert.ok([...discussionsView(s).matchAll(/<button[^>]+>/g)].every(([b])=>b.includes('disabled')));
});
test('dernier jour : le second match compte avant le bilan du lendemain',()=>{
 const s=make();plan.discuss(s,'team-work');const e=s.careerPlan.discussions.teamwork;e.videoDays=3;e.games=['first'];const initial=s.relationships.team;s.day=e.due;plan.discussionDay(s);assert.ok(s.careerPlan.discussions.teamwork);plan.recordTeamMatch(s,{id:'last-day',home:s.team,away:'other',done:true,box:{[s.hero]:{min:20}}});s.day++;plan.discussionDay(s);assert.equal(s.relationships.team,initial+3);assert.equal(s.careerPlan.discussions.teamwork,null);
});
function yearEnd(s){s.day=365;s.pending=null;s.sportEvents.notice=null;for(const c of s.competitions){c.phase='Terminée';c.champion=Object.keys(c.records)[0];for(const g of c.schedule)g.result={score:[100,90],winner:g.home};}}
test('retraite automatique : les deux engagements sont fermés',()=>{
 const s=make();yearEnd(s);hero(s).age=46;plan.discuss(s,'team-work');plan.requestRole(s);s.pending=null;next(s,{interactive:false});assert.equal(s.retired,true);assert.equal(s.careerPlan.discussions.teamwork,null);assert.equal(s.careerPlan.evaluation,null);assert.equal(s.simulation.cursor,null);
});
test('départ annuel du référent : clôture immédiate pendant le bilan',()=>{
 const s=make();yearEnd(s);plan.discuss(s,'team-work');const e=s.careerPlan.discussions.teamwork;s.players.find(p=>p.id===e.personId).age=41;next(s,{interactive:false});assert.equal(team(s).roster.includes(e.personId),false);assert.equal(s.careerPlan.discussions.teamwork,null);assert.match(s.careerPlan.discussions.history.at(-1).text,/quitté/);
});
