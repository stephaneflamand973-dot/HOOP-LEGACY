import {leagueDef} from './leagues.js?v=3.6.0';
const keys=['gp','pts','reb','ast','stl','blk','tov','fgm','fga','tpm','tpa','ftm','fta','min'];
const zero=()=>Object.fromEntries(keys.map(k=>[k,0]));
const hero=s=>s.players.find(p=>p.id===s.hero);
export function initCareerLedger(s,recovered=false) {
  if (s.careerLedger) return;
  s.careerLedger={version:1,stints:[],titles:[],opening:recovered&&hero(s).season.gp?{season:s.season,stats:structuredClone(hero(s).season),byLeague:structuredClone(hero(s).byLeague),unattributed:true}:null};
  // A trophy already granted by an old version remains part of the career, with honest provenance.
  for (const trophy of s.trophies) {
    const match=trophy.match(/^(.*?) · champion saison (\d+)$/);
    if (match) s.careerLedger.titles.push({id:`legacy-${match[2]}-${match[1]}`,season:Number(match[2]),name:match[1],team:null,day:null,eligible:true,recovered:true});
  }
  openStint(s);
}
export function openStint(s) {
  const l=s.careerLedger,previous=l.stints.at(-1);
  if (previous?.season===s.season&&previous.team===s.team&&previous.to===null) return previous;
  if (previous?.to===null) previous.to=s.day;
  const stint={id:`s${s.season}-${s.team}-${l.stints.length}`,season:s.season,team:s.team,league:s.league,from:s.day,to:null,stats:zero(),competitions:{},games:[]};
  l.stints.push(stint);return stint;
}
export function recordStintMatch(s,g,b) {
  if (!b?.min) return;
  const stint=openStint(s);
  if (stint.games.includes(g.id)) return;
  stint.games.push(g.id);
  const competition=stint.competitions[g.league]??={};
  const phase=competition[g.stage]??=zero();
  for (const stats of [stint.stats,phase]) for (const k of keys) stats[k]+=k==='gp'?1:b[k]||0;
}
export function awardTitle(s,c,{recovered=false}={}) {
  const l=s.careerLedger,id=`s${s.season}-${c.id}-title`;
  if (!c.champion || l.titles.some(t=>t.id===id)) return null;
  const club=s.teams.find(t=>t.id===c.champion);
  const final=c.post?.series?.find(p=>p.winner===c.champion),last=final?.games.map(id=>c.schedule.find(g=>g.id===id)).filter(g=>g?.result).at(-1);
  const eligible=club.roster.includes(s.hero)&&(!recovered||!!last?.result?.box?.[s.hero]);
  const record={id,season:s.season,league:c.id,name:leagueDef(c.id).name,team:c.champion,day:last?.day??s.day,roster:recovered?null:[...club.roster],eligible,recovered,eligibilityKnown:!recovered||eligible};
  const prior=l.titles.find(t=>t.season===s.season&&t.name===record.name&&t.eligible);
  if(prior&&eligible)Object.assign(prior,record);else l.titles.push(record);
  if (eligible) {
    const text=`${record.name} · champion saison ${s.season}`;
    if (!s.trophies.includes(text)) s.trophies.push(text);
  }
  return record;
}
export function seasonTitles(s,season=s.season) { return [...new Map(s.careerLedger.titles.filter(t=>t.season===season&&t.eligible).map(t=>[t.name,t])).values()]; }
export function seasonStints(s,season=s.season) { return s.careerLedger.stints.filter(t=>t.season===season); }
