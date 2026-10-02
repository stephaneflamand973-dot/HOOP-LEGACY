import {seasonTitles,seasonStints} from './career-ledger.js?v=3.4.0';
// Career memory is driven only by completed games and seasons. No random draws,
// attribute bonuses or blocking decisions are made by this module.
import {leagueDef} from './leagues.js?v=3.4.0';

const player = s => s.players.find(p => p.id === s.hero);
const club = (s, id = s.team) => s.teams.find(t => t.id === id);
const statKeys = ['gp', 'pts', 'reb', 'ast', 'stl', 'blk', 'tpm', 'min'];
const number = n => Number.isFinite(n) ? n : 0;
export const AMBITIONS = {emerge:'Gagner ma place', lead:'Porter mon équipe', contend:'Jouer le titre'};

export function careerTotals(s) {
  return Object.fromEntries(statKeys.map(k => [k, (s.history || []).reduce((n, h) => n + number(h.stats?.[k]), 0) + number(player(s).season[k])]));
}

function newSeason(s) {
  const p = player(s), average = Object.values(p.attrs).reduce((a,b) => a+b,0) / Object.keys(p.attrs).length;
  const ambition = s.career.stage !== 'pro' || average < 80 ? 'emerge' : average < 91 ? 'lead' : 'contend';
  return {season:s.season, league:s.league, team:s.team, ambition, custom:false, locked:p.season.gp > 0,
    metrics:{gp:p.season.gp, pts:p.season.pts, reb:p.season.reb, ast:p.season.ast, wins:0, impact:0, postWins:0, titles:0},
    seen:[], goals:[], moments:[], partial:p.season.gp > 0};
}

function makeGoals(s, ambition) {
  const y = s.legacy.season, p = player(s), games = leagueDef(y.league).games;
  const metric = p.pos === 'MJ' ? 'ast' : ['AF','P'].includes(p.pos) ? 'reb' : 'pts';
  const label = {ast:'passes décisives', reb:'rebonds', pts:'points'}[metric];
  const target = Math.round(games * .65 * (ambition === 'emerge' ? {ast:3,reb:5,pts:10}[metric] : {ast:5,reb:8,pts:18}[metric]));
  const goal = (id, title, metric, target) => ({id,title,metric,target,completed:null});
  if (ambition === 'contend') return [
    goal('wins', 'Gagner ensemble', 'wins', Math.ceil(games * .55)),
    goal('post', 'Gagner en phase finale', 'postWins', 1),
    goal('title', 'Décrocher le titre', 'titles', 1)
  ];
  return [
    ambition === 'emerge' ? goal('games','Installer ma présence','gp',Math.ceil(games*.65)) : goal('impact','Peser dans les matchs','impact',Math.ceil(games*.2)),
    goal('production', `Cumuler ${target} ${label}`, metric, target),
    goal('wins','Gagner ensemble','wins',Math.ceil(games*(ambition==='emerge'?.3:.45)))
  ];
}

export function beginLegacySeason(s) {
  s.legacy.season = newSeason(s);
  s.legacy.season.goals = makeGoals(s, s.legacy.season.ambition);
  s.legacy.lastHighlights = [];
}

export function chooseAmbition(s, value) {
  const y = s.legacy?.season;
  if (!y || y.locked || s.match || s.retired || !(value in AMBITIONS)) return false;
  y.ambition = value; y.custom = true; y.goals = makeGoals(s,value);
  return true;
}

export function refreshAmbition(s) {
  const y = s.legacy?.season;
  if (!y || y.locked) return;
  const previous = y.custom ? y.ambition : null;
  beginLegacySeason(s);
  if (previous) chooseAmbition(s, previous);
}

export function goalProgress(s, goal) {
  return Math.max(0, number(s.legacy?.season.metrics[goal.metric]));
}

function addMoment(s, item, recovered = false) {
  const l = s.legacy;
  if (l.milestones.some(m => m.id === item.id)) return;
  const moment = {...item, season:recovered ? null : s.season, day:recovered ? null : s.day, recovered};
  l.milestones.push(moment);
  if (!recovered) { l.lastHighlights.push(item.title); l.season.moments.push(item.id); }
}

export function syncMilestones(s, recovered = false, totals = careerTotals(s)) {
  const l = s.legacy;
  const thresholds = {gp:[1,100,500,1000,1500,2000], pts:[1000,5000,10000,20000,30000,40000], ast:[1000,5000,10000], reb:[1000,5000,10000], tpm:[100,1000,3000]};
  const names = {gp:'matchs joués',pts:'points en carrière',ast:'passes en carrière',reb:'rebonds en carrière',tpm:'tirs à trois points réussis'};
  for (const [metric, values] of Object.entries(thresholds)) for (const value of values) {
    if (totals[metric] >= value) addMoment(s,{id:`career-${metric}-${value}`,title:metric==='gp'&&value===1?'Premier match joué':`${value.toLocaleString('fr-FR')} ${names[metric]}`,kind:'career'},recovered);
  }
  for (const value of [30,40,50,60,70]) if ((s.records?.pts || 0) >= value) addMoment(s,{id:'score-'+value,title:`Un match à ${value} points ou plus`,kind:'performance'},recovered);
  for (const [metric, title] of [['doubleDoubles','Premier double-double'],['tripleDoubles','Premier triple-double']]) if (l[metric] > 0) addMoment(s,{id:metric,title,kind:'performance'},recovered);
  const titles = (s.trophies || []).filter(t => t.includes('champion saison')).length;
  const mvps = (s.trophies || []).filter(t => t.startsWith('MVP ')&&!t.startsWith('MVP des finales ')).length;
  for (const value of [1,3,5,10]) if (titles >= value) addMoment(s,{id:'titles-'+value,title:value===1?'Premier titre':`${value} titres remportés`,kind:'title'},recovered);
  for (const value of [1,3,5]) if (mvps >= value) addMoment(s,{id:'mvp-'+value,title:value===1?'Premier trophée de MVP':`${value} trophées de MVP`,kind:'title'},recovered);
}

function checkGoals(s) {
  const y = s.legacy.season;
  for (const g of y.goals) if (g.completed === null && goalProgress(s,g) >= g.target) {
    g.completed = s.day;
    s.legacy.lastHighlights.push('Objectif atteint · '+g.title);
  }
}

function rememberRival(s, g, m, box) {
  const opponent = g.home === s.team ? g.away : g.home, l = s.legacy;
  let r = l.rivals.find(r => r.team === opponent);
  if (!r) {
    r = {team:opponent,name:club(s,opponent).name,gp:0,wins:0,pts:0,against:0,close:0,post:0,seriesWins:0,seriesLosses:0,firstSeason:s.season,lastSeason:s.season,last:null,leader:null};
    l.rivals.push(r);
  }
  const side = g.home === s.team ? 0 : 1;
  r.gp++; r.wins += Number(m.score[side] > m.score[1-side]); r.pts += box.pts;
  r.against += Number(m.score[side] < m.score[1-side]);
  r.close += Number(Math.abs(m.score[0]-m.score[1]) <= 5); r.post += Number(g.stage !== 'regular');
  r.lastSeason = s.season;
  r.last = {season:s.season,day:s.day,score:[m.score[side],m.score[1-side]],league:g.league,club:s.team};
  const leader = club(s,opponent).roster.map(id => m.box[id]).filter(b => b?.min > 0).sort((a,b) => (b.pts+b.ast+b.reb)-(a.pts+a.ast+a.reb) || a.id.localeCompare(b.id))[0];
  if (leader) r.leader = {id:leader.id,name:playerName(s,leader.id),pts:leader.pts};
  if (!r.emerged && (r.post >= 2 || r.gp >= 3 && r.close >= 1)) {
    r.emerged = s.day;
    l.lastHighlights.push('Une rivalité se dessine · '+r.name);
  }
}
function playerName(s,id) { return s.players.find(p => p.id === id)?.name || 'Joueur'; }

export function recordLegacyMatch(s, g, m) {
  const l = s.legacy, y = l.season, b = m.box[s.hero];
  if (y.seen.includes(g.id)) return;
  y.seen.push(g.id); y.locked = true; l.lastHighlights = [];
  if (!b?.min) return; // Missing a game never counts as a personal achievement.
  const side = g.home === s.team ? 0 : 1, won = m.score[side] > m.score[1-side];
  for (const key of ['pts','ast','reb']) y.metrics[key] += b[key];
  y.metrics.gp++; y.metrics.wins += Number(won); y.metrics.impact += Number(m.grade >= 75);
  y.metrics.postWins += Number(won && g.stage !== 'regular');
  const doubles = ['pts','reb','ast','stl','blk'].filter(k => b[k] >= 10).length;
  l.doubleDoubles += Number(doubles >= 2); l.tripleDoubles += Number(doubles >= 3);
  for (const key of ['pts','reb','ast','stl','blk']) if (b[key] > (l.records[key]?.value || 0)) l.records[key] = {value:b[key],season:s.season,day:s.day,opponent:g.home===s.team?g.away:g.home,league:g.league};
  rememberRival(s,g,m,b); syncMilestones(s); checkGoals(s);
}

export function recordLegacySeries(s,c,pair) {
  if (![pair.a,pair.b].includes(s.team)) return;
  const key = `${s.season}-${c.id}-${c.post.round}-${pair.a}-${pair.b}`;
  if (s.legacy.seriesSeen.includes(key)) return;
  s.legacy.seriesSeen.push(key);
  const opponent = pair.a === s.team ? pair.b : pair.a;
  const r = s.legacy.rivals.find(r => r.team === opponent);
  // A series is personal only if at least one of its games was played by the hero.
  if (!r || !pair.games.some(id => c.schedule.find(g => g.id===id)?.result?.box?.[s.hero]?.min > 0)) return;
  r[pair.winner===s.team?'seriesWins':'seriesLosses']++;
  r.lastSeries = {season:s.season,league:c.id,won:pair.winner===s.team};
}

export function recordLegacyTitle(s) {
  s.legacy.season.metrics.titles=seasonTitles(s).length;
  syncMilestones(s);checkGoals(s);
}

export function finishLegacySeason(s, mvpId) {
  const l = s.legacy, y = l.season;
  if (l.reviews.some(r => r.season === s.season)) return;
  const titles = seasonTitles(s).map(t=>t.league||t.name);
  y.metrics.titles = titles.length; checkGoals(s);
  // history already contains this season; count the completed history only.
  const live = player(s).season;
  syncMilestones(s,false,Object.fromEntries(statKeys.map(k=>[k,(s.history||[]).reduce((n,h)=>n+number(h.stats?.[k]),0)])));
  const primary = s.competitions.find(c => c.id === s.league);
  const elimination = primary.schedule.filter(g => g.stage!=='regular' && g.result && (g.home===s.team||g.away===s.team)).at(-1);
  const outcome = titles.length ? 'Une saison couronnée' : elimination ? 'La course au titre s’arrête ici' : 'Une saison pour construire';
  l.reviews.push({season:s.season,teams:[...new Set(seasonStints(s).map(t=>t.team))],team:s.team,league:s.league,ambition:y.ambition,partial:y.partial,
    title:outcome,titles,mvp:mvpId===s.hero,stats:{...live},goals:y.goals.map(g=>({...g,value:goalProgress(s,g)})),
    moments:[...y.moments],wins:y.metrics.wins,losses:y.metrics.gp-y.metrics.wins});
  l.seriesSeen = [];
}

export function rivalries(s) {
  return [...s.legacy.rivals].filter(r => r.emerged !== undefined).sort((a,b) => {
    const weight = r => r.post*3 + r.close*2 + r.gp + (r.lastSeason===s.season?12:0);
    return weight(b)-weight(a) || a.team.localeCompare(b.team);
  });
}

export function nextStakes(s,g) {
  if (!g) return null;
  const c = s.competitions.find(c=>c.id===g.league), opponent = g.home===s.team?g.away:g.home;
  const r = s.legacy.rivals.find(r=>r.team===opponent && r.emerged!==undefined);
  if (g.stage === 'playin') return {title:'Une place en playoffs en jeu',text:'Ce match compte pour la qualification.',rival:r};
  const pair = g.stage==='post' ? c.post?.series?.find(p=>p.games.includes(g.id)) : null;
  if (pair) {
    const mine = pair.a===s.team?0:1, target = Math.ceil(pair.best/2), win = pair.wins[mine], loss = pair.wins[1-mine];
    const final = c.post.series.length===1;
    const title = win===target-1 && loss===target-1 ? 'Match décisif' : loss===target-1 ? 'Dos au mur' : win===target-1 ? final?'Une victoire du titre':'Une victoire de la qualification' : final?'La finale':'La série continue';
    return {title,text:`${final?'Finale':'Playoffs'} · ${win}–${loss} dans la série · ${target} victoire(s) pour passer.`,rival:r};
  }
  if (r) return {title:r.last?.score[0]<r.last?.score[1]?'L’occasion de prendre votre revanche':'Retrouvailles avec un rival',text:`${r.wins} victoire(s), ${r.gp-r.wins} défaite(s) face à ${r.name} lorsque vous avez joué.`,rival:r};
  return null;
}

export function initLegacy(s, recovered = false) {
  if (s.legacy) return s.legacy;
  s.legacy = {version:1,since:{season:s.season,day:s.day},milestones:[],rivals:[],reviews:[],records:{},doubleDoubles:0,tripleDoubles:0,seriesSeen:[],lastHighlights:[]};
  beginLegacySeason(s);
  for (const [key,value] of Object.entries(s.records||{})) if (value>0) s.legacy.records[key]={value,season:null,day:null,opponent:null,league:null};
  // Existing totals are reliable; old archives do not retain personal match boxes.
  // Do not invent historic rivals, double-doubles, or dates for recovered milestones.
  const y = s.legacy.season;
  for (const c of s.competitions) for (const g of c.schedule) if (g.result?.box?.[s.hero]) {
    y.seen.push(g.id); y.locked=true;
    const b=g.result.box[s.hero]; if (!b.min) continue;
    const side=g.home===s.team?0:g.away===s.team?1:null;
    if(side===null)continue;
    const won=g.result.score[side]>g.result.score[1-side];
    y.metrics.wins+=Number(won); y.metrics.postWins+=Number(won&&g.stage!=='regular');
  }
  syncMilestones(s,recovered); checkGoals(s); s.legacy.lastHighlights=[];
  return s.legacy;
}

export function validateLegacy(s) {
  const l=s.legacy, y=l?.season;
  if (!l || l.version!==1 || !y || y.season!==s.season || !(y.ambition in AMBITIONS) || !Array.isArray(y.goals) || y.goals.length!==3 || !Array.isArray(y.seen) || !Array.isArray(y.moments) || !y.metrics || !l.records || !Number.isFinite(l.since?.day) || !Number.isInteger(l.since?.season)) throw Error('Suivi de carrière invalide');
  for (const key of ['milestones','rivals','reviews','seriesSeen','lastHighlights']) if (!Array.isArray(l[key])) throw Error('Mémoire de carrière invalide');
  for (const key of ['doubleDoubles','tripleDoubles']) if(!Number.isInteger(l[key])||l[key]<0)throw Error('Performance invalide');
  if(Object.values(y.metrics).some(n=>!Number.isFinite(n)||n<0))throw Error('Bilan de saison invalide');
  for (const g of y.goals) if (!Number.isFinite(g.target)||g.target<=0||!Number.isFinite(y.metrics[g.metric])||y.metrics[g.metric]<0||!(g.completed===null||Number.isFinite(g.completed))) throw Error('Objectif invalide');
  if (new Set(l.rivals.map(r=>r.team)).size!==l.rivals.length || new Set(l.milestones.map(m=>m.id)).size!==l.milestones.length) throw Error('Mémoire de carrière dupliquée');
  for (const r of l.rivals) if (!club(s,r.team)||!Number.isInteger(r.gp)||r.gp<0||!Number.isInteger(r.wins)||r.wins<0||r.wins>r.gp||!Array.isArray(r.last?.score)||r.last.score.length!==2) throw Error('Rivalité invalide');
}
