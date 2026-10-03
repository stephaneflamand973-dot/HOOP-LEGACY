// All observations are recorded at finalization. Reading a table never changes state.
import {getPlayer,team} from './engine.js?v=3.5.0';
import {leagueDef} from './leagues.js?v=3.5.0';
const keys=['gp','pts','reb','oreb','ast','stl','blk','tov','fgm','fga','tpm','tpa','ftm','fta','min'];
export const emptyStats=()=>Object.fromEntries(keys.map(k=>[k,0]));
const add=(a,b)=>{for(const k of keys)a[k]+=(b[k]||0);return a;};
const club=(s,id)=>team(s,id);
const identity=(s,p)=>s.statistics.people[p.id]??=({id:p.id,name:p.name,pos:p.pos,real:!!p.real,firstTracked:s.season,years:[],records:{},injuries:[],titles:[],debut:{}});
const seenCache=new WeakMap();
function seen(book){let v=seenCache.get(book);if(!v||v.size!==book.seen.length){v=new Set(book.seen);seenCache.set(book,v);}return v;}
export function initStatistics(s,recovered=false){
 if(s.statistics)return;
 s.statistics={version:1,since:{season:s.season,day:s.day},season:s.season,partial:recovered&&s.players.some(p=>p.season.gp),rows:{},seen:[],people:{},awards:[]};
 for(const p of s.players){const q=identity(s,p);q.priorUnknown=!!recovered;}
 if(!recovered)return;
 for(const p of s.players){
  const q=bookPerson(s,p),history=p.id===s.hero?s.history:(p.history||[]);
  q.years=history.filter(y=>y.stats?.gp).map(y=>({season:y.season,age:y.age??null,teams:y.stints?[...new Set(y.stints.map(t=>t.team))]:s.teams.filter(t=>t.name===y.team).map(t=>t.id),leagues:y.league?[y.league]:[],stats:{...y.stats},partial:true}));
  q.firstTracked=Math.min(s.season,...q.years.map(y=>y.season));
  if(p.id===s.hero)q.titles=(s.careerLedger.titles||[]).filter(t=>t.eligible&&t.league).map(t=>({id:`${t.season}-${t.league}`,season:t.season,league:t.league,team:t.team}));
 }
 // Boxes prove team and phase. Residual aggregate stays unassigned; never guess.
 for(const c of s.competitions)for(const g of c.schedule)if(g.result?.box)recordStatistics(s,g,{box:g.result.box,score:g.result.score},true);
 for(const p of s.players)for(const [league,total] of Object.entries(p.byLeague||{})){
  const known=Object.values(s.statistics.rows).filter(r=>r.id===p.id&&r.league===league).reduce((a,r)=>add(a,r.stats),emptyStats());
  const missing=Object.fromEntries(keys.map(k=>[k,Math.max(0,(total[k]||0)-known[k])]));
  if(missing.gp>0)s.statistics.rows[[p.id,'unknown',league,'unknown'].join('|')]={id:p.id,name:p.name,pos:p.pos,team:null,league,phase:'unknown',stats:missing,wins:0,finals:emptyStats(),recovered:true};
 }
}
const bookPerson=(s,p)=>identity(s,p);
export function recordStatistics(s,g,m,recovered=false){
 const book=s.statistics;if(seen(book).has(g.id))return false;
 seen(book).add(g.id);book.seen.push(g.id);
 const c=s.competitions.find(c=>c.id===g.league),final=g.stage==='post'&&c?.post?.series?.length===1&&c.post.series[0].games.includes(g.id);
 const win=m.score[0]>m.score[1]?g.home:g.away;
 for(const b of Object.values(m.box)){
  if(!b.min)continue;
  const p=getPlayer(s,b.id);if(!p)continue;
  const home=club(s,g.home).roster.includes(p.id),away=club(s,g.away).roster.includes(p.id);
  // Old transfers make today's roster unreliable. Only an explicit saved heroTeam proves it.
  const tid=recovered?(p.id===s.hero?g.result.heroTeam||null:null):home?g.home:away?g.away:null;
  const phase=g.stage==='regular'?'regular':g.stage==='playin'?'playin':'post',key=[p.id,tid||'unknown',g.league,phase].join('|');
  const row=book.rows[key]??={id:p.id,name:p.name,pos:p.pos,team:tid,league:g.league,phase,stats:emptyStats(),wins:0,finals:emptyStats(),recovered};
  const line={...b,gp:1};add(row.stats,line);row.wins+=Number(tid===win);if(final)add(row.finals,line);
  const q=identity(s,p);
  if(q.debut[g.league]===undefined){
   const knownRookie=!recovered&&!q.priorUnknown&&(p.id===s.hero?!s.history.some(h=>h.league===g.league&&h.stats.gp):p.real?p.referenceRookie&&s.season===1:p.id.startsWith('rookie-')||p.id.startsWith('academy-')||p.age<=19);
   q.debut[g.league]=knownRookie?s.season:0;
  }
  for(const k of ['pts','reb','ast','stl','blk'])if(b[k]>(q.records[k]?.value||0))q.records[k]={value:b[k],season:s.season,day:g.day,league:g.league,opponent:tid===g.home?g.away:tid===g.away?g.home:null};
 }
 return true;
}
export function recordInjury(s,p,days,serious){if(serious)identity(s,p).injuries.push({season:s.season,day:s.day,days});}
export function recordWorldTitle(s,c){
 if(!c.champion)return;
 for(const id of club(s,c.champion).roster){const p=getPlayer(s,id),q=identity(s,p),key=`${s.season}-${c.id}`;
  if(!q.titles.some(t=>t.id===key))q.titles.push({id:key,season:s.season,league:c.id,team:c.champion});
 }
}
export function closeStatistics(s){
 const rows=Object.values(s.statistics.rows);
 for(const p of s.players){
  if(!p.season.gp)continue;const q=identity(s,p),mine=rows.filter(r=>r.id===p.id),teams=[...new Set(mine.map(r=>r.team).filter(Boolean))];
  if(!q.years.some(y=>y.season===s.season))q.years.push({season:s.season,age:p.age,teams,leagues:[...new Set(mine.map(r=>r.league))],stats:{...p.season},partial:s.statistics.partial});
 }
 return {version:1,partial:s.statistics.partial,rows:structuredClone(rows)};
}
export function beginStatistics(s){s.statistics.season=s.season;s.statistics.partial=false;s.statistics.rows={};s.statistics.seen=[];}
export function statisticsRows(s,{season=s.season,league=s.league,team='all',phase='regular',sort='pts',direction='desc',query=''}={}){
 const archive=Number(season)===s.season?null:s.archives.find(a=>a.season===Number(season));
 const source=archive?archive.statistics?.rows||[]:Object.values(s.statistics.rows);
 const grouped=new Map();
 for(const r of source){if(r.league!==league||team!=='all'&&r.team!==team||phase!=='all'&&r.phase!==phase)continue;
  let row=grouped.get(r.id);if(!row){row={id:r.id,name:r.name,pos:r.pos,teams:[],stats:emptyStats(),wins:0,finals:emptyStats(),partial:false};grouped.set(r.id,row);}
  if(r.team&&!row.teams.includes(r.team))row.teams.push(r.team);add(row.stats,r.stats);add(row.finals,r.finals);row.wins+=r.wins;row.partial||=r.phase==='unknown'||r.recovered;
 }
 const average=(r,k)=>r.stats[k]/Math.max(1,r.stats.gp),pct=(r,make,att)=>r.stats[att]?r.stats[make]/r.stats[att]:-1;
 const value=r=>sort==='name'?r.name:sort==='gp'?r.stats.gp:sort==='fg'?pct(r,'fgm','fga'):sort==='three'?pct(r,'tpm','tpa'):sort==='free'?pct(r,'ftm','fta'):average(r,keys.includes(sort)?sort:'pts');
 let list=[...grouped.values()].filter(r=>!query||r.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 list.sort((a,b)=>(typeof value(a)==='string'?value(a).localeCompare(value(b)):value(a)-value(b))*(direction==='asc'?1:-1)||a.id.localeCompare(b.id));
 return {rows:list,partial:archive?!archive.statistics||archive.statistics.partial:s.statistics.partial,unavailable:!!archive&&!archive.statistics};
}
export function awardRanking(s,league,kind='mvp'){
 const c=s.competitions.find(c=>c.id===league),def=leagueDef(league),rows=statisticsRows(s,{league,phase:kind==='finals'?'post':'regular'}).rows;
 const unavailable=s.statistics.partial&&Object.values(s.statistics.rows).some(r=>r.league===league&&(r.phase==='unknown'||r.recovered));
 const minGames=Math.ceil(def.games*.6),finalGames=c?.post?.series?.length===1?c.post.series[0].games.length:0;
 const candidates=rows.map(r=>{
  const st=kind==='finals'?r.finals:r.stats,per36=36/Math.max(st.min,st.gp*18,1),ts=st.fga+.44*st.fta?st.pts/(2*(st.fga+.44*st.fta)):0;
  const production=(st.pts*.55+st.ast*1.2+st.reb*.7+st.stl*2+st.blk*2-st.tov*1.5)*per36;
  const defense=(st.stl*2.5+st.blk*2.5+Math.max(0,st.reb-st.oreb)*.3)*per36;
  const available=Math.min(1,st.gp/Math.max(1,kind==='finals'?finalGames:def.games));
  const wins=r.wins/Math.max(1,r.stats.gp),score=kind==='defense'?defense*(.65+.35*available)+wins*2:production*(.65+.35*available)+Math.max(-4,Math.min(4,(ts-.52)*20))+wins*3;
  const required=kind==='finals'?Math.max(1,Math.ceil(finalGames*.5)):minGames;
  let reason=unavailable?'Données de phase incomplètes':st.gp<required?`${st.gp}/${required} matchs requis`:st.min<st.gp*def.minutes*.2?'Temps de jeu insuffisant':kind==='rookie'&&s.statistics.people[r.id]?.debut[league]!==s.season?'Première saison non établie':kind==='finals'&&!r.teams.includes(c.champion)?'Équipe non championne':null;
  return {...r,stats:st,score:+score.toFixed(3),eligible:!reason,reason,components:{production:+production.toFixed(1),defense:+defense.toFixed(1),ts:+ts.toFixed(3),participation:+available.toFixed(3),wins:+wins.toFixed(3)}};
 }).sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.score-a.score||a.id.localeCompare(b.id));
 return {candidates,minGames,unavailable};
}
export const AWARD_NAMES={mvp:'MVP',rookie:'Rookie de l’année',defense:'Défenseur de l’année',team:'Cinq de la saison',finals:'MVP des finales'};
export function settleAwards(s,c,phase='regular'){
 for(const kind of phase==='finals'?['finals']:['mvp','rookie','defense','team']){
  const id=`${s.season}-${c.id}-${kind}`;if(s.statistics.awards.some(a=>a.id===id))continue;
  const ranking=awardRanking(s,c.id,kind==='team'?'mvp':kind),eligible=ranking.candidates.filter(r=>r.eligible);
  let winners=eligible.slice(0,1);
  if(kind==='team'){winners=[];for(const [positions,count] of [[['MJ','AR'],2],[['AI','AF'],2],[['P'],1]])winners.push(...eligible.filter(r=>positions.includes(r.pos)).slice(0,count));}
  const result={id,season:s.season,league:c.id,kind,day:s.day,winners:winners.map(r=>({id:r.id,name:r.name,teams:r.teams})),candidates:ranking.candidates.slice(0,8).map(r=>({id:r.id,name:r.name,score:r.score,eligible:r.eligible,reason:r.reason,stats:r.stats,components:r.components})),unavailable:ranking.unavailable};
  s.statistics.awards.push(result);
  if(winners.some(p=>p.id===s.hero)){const label=`${AWARD_NAMES[kind]} ${leagueDef(c.id).name} · saison ${s.season}`;if(!s.trophies.includes(label))s.trophies.push(label);}
 }
}
export function validateStatistics(s){
 const b=s.statistics;if(!b||b.version!==1||b.season!==s.season||!b.rows||!b.people||!Array.isArray(b.seen)||!Array.isArray(b.awards))throw Error('Statistiques V3.4 invalides');
 for(const r of Object.values(b.rows))if(!['regular','playin','post','unknown'].includes(r.phase)||!r.stats||keys.some(k=>!Number.isFinite(r.stats[k])||r.stats[k]<0))throw Error('Ligne statistique invalide');
 if(new Set(b.awards.map(a=>a.id)).size!==b.awards.length)throw Error('Distinction dupliquée');
}
