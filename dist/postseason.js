import {leagueDef} from './leagues.js?v=3.4.0';
export const editionId=(season,league)=>`s${season}-${league}`;
export function roundName(league,index) {
  const def=leagueDef(league),left=def.series.length-index;
  if (league==='nba') return ['Premier tour','Demi-finales de conférence','Finales de conférence','Finale NBA'][index]||'Playoffs';
  return left===1?'Finale':left===2?'Demi-finales':left===3?'Quarts de finale':left===4?'Huitièmes de finale':'Premier tour';
}
// Simulation formats: every league has an explicit pattern, independent of series length.
const PATTERNS={nba:{7:[0,0,1,1,0,1,0]},elite:{3:[0,1,0],5:[0,0,1,1,0]},acb:{3:[0,1,0],5:[0,0,1,1,0]},bbl:{5:[0,0,1,1,0]},lba:{5:[0,0,1,1,0]},nbl:{3:[0,1,0],5:[0,1,0,1,0]},euroleague:{5:[0,0,1,1,0],1:[0]},ncaa:{1:[0]},highschool:{1:[0]}};
export function seriesHome(league,pair,index) {
  const pattern=PATTERNS[league]?.[pair.best];
  if (!pattern || index>=pattern.length) throw Error('Format de série invalide');
  return pattern[index]===0?pair.a:pair.b;
}
export const neutralRound=(league,round)=>league==='ncaa'||league==='euroleague'&&round>0;
export function syncRound(c) {
  if (!c.post?.series) return;
  c.post.rounds??=[];
  const round={id:`${c.post.id}-r${c.post.round}`,index:c.post.round,name:roundName(c.id,c.post.round),series:c.post.series};
  const index=c.post.rounds.findIndex(r=>r.index===round.index);
  if (index<0) c.post.rounds.push(round); else c.post.rounds[index]=round;
}
export function seedPostseason(s,c,rank) {
  const p=c.post;
  p.version=1;p.id=editionId(s.season,c.id);p.rounds=[];
  p.rank=rank.map(t=>t.id);
  p.seeds={};p.conferences={};
  for (const t of rank) {
    const pool=c.id==='nba'?rank.filter(q=>q.conference===t.conference):rank;
    p.seeds[t.id]=pool.findIndex(q=>q.id===t.id)+1;
    p.conferences[t.id]=t.conference||'Tous';
  }
}
export function preferredClub(c,a,b) {
  const p=c.post;
  const same=p.conferences?.[a]===p.conferences?.[b];
  const rank=id=>same?(p.seeds?.[id]??999):p.rank.indexOf(id);
  return rank(a)<=rank(b)?[a,b]:[b,a];
}
export function makeSeries(c,a,b,index) {
  [a,b]=preferredClub(c,a,b);
  const p=c.post;
  return {id:`${p.id}-r${p.round}-s${index}`,roundId:`${p.id}-r${p.round}`,round:p.round,name:roundName(c.id,p.round),a,b,seeds:[p.seeds?.[a]??null,p.seeds?.[b]??null],conference:p.conferences?.[a]===p.conferences?.[b]?p.conferences[a]:'Interconférences',wins:[0,0],games:[],best:leagueDef(c.id).series[p.round]||1,winner:null,neutral:neutralRound(c.id,p.round)};
}
function recoveredRounds(season,c,games) {
  const groups=new Map();
  for (const g of games.filter(g=>g.stage==='post'&&g.round>=100)) {
    const clubs=[g.home,g.away].sort(),key=`${g.round}-${clubs.join('/')}`;
    if (!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(g);
  }
  const rounds=new Map();
  for (const list of groups.values()) {
    list.sort((a,b)=>a.day-b.day||a.id.localeCompare(b.id));
    const first=list[0],index=first.round-100,a=first.home,b=first.away,best=leagueDef(c.id).series[index]||1;
    const wins=[a,b].map(id=>list.filter(g=>{const score=g.result?.score||g.score;return score&&score[0]!==score[1]&&(score[0]>score[1]?g.home:g.away)===id}).length);
    const pair={id:`${editionId(season,c.id)}-r${index}-recovered-${a}-${b}`,roundId:`${editionId(season,c.id)}-r${index}`,round:index,name:roundName(c.id,index),a,b,seeds:[null,null],conference:null,wins,games:list.map(g=>g.id),best,winner:Math.max(...wins)>=Math.ceil(best/2)?(wins[0]>wins[1]?a:b):null,recovered:true,neutral:neutralRound(c.id,index)};
    if (!rounds.has(index)) rounds.set(index,{id:pair.roundId,index,name:pair.name,series:[]});
    rounds.get(index).series.push(pair);
  }
  return [...rounds.values()].sort((a,b)=>a.index-b.index);
}
export function recoverPostseason(s,c,rank) {
  if (!c.post || c.post.version===1) return;
  const old=c.post, rounds=recoveredRounds(s.season,c,c.schedule);
  seedPostseason(s,c,rank);
  old.rounds=rounds;
  for(const group of old.groups||[])for(const [i,id] of (group.seeds||group.locked||[]).entries())old.seeds[id]=i+1;
  if (old.stage==='series') {
    old.series=old.series.map((pair,index)=>({...makeSeries(c,pair.a,pair.b,index),...pair,id:`${old.id}-r${old.round}-s${index}`,seeds:[old.seeds[pair.a]??null,old.seeds[pair.b]??null],recovered:true}));
    syncRound(c);
  }
  for (const r of old.rounds) for (const pair of r.series) for (const [i,id] of pair.games.entries()) {
    const g=c.schedule.find(g=>g.id===id);
    if (g) { g.seriesId=pair.id;g.gameNumber=i+1;g.roundId=pair.roundId; }
  }
}
export function archivedRounds(season,c) { return c.post?.rounds || c.rounds || recoveredRounds(season,c,c.games||c.schedule||[]); }
export function seriesStakes(pair,club) {
  if (pair.winner) return pair.winner===club?'Série remportée':'Série perdue';
  const side=pair.a===club?0:pair.b===club?1:null,target=Math.ceil(pair.best/2);
  if (side===null) return `${target} victoire${target>1?'s':''} pour passer`;
  if (pair.wins[0]===target-1&&pair.wins[1]===target-1) return 'Match décisif';
  if (pair.wins[1-side]===target-1) return 'Élimination en cas de défaite';
  if (pair.wins[side]===target-1) return pair.name.startsWith('Finale')&&!pair.name.includes('conférence')?'Balle de titre':'Balle de qualification';
  return 'La série continue';
}
