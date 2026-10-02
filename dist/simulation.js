export const ADVANCE_MODES=[['1','Prochain événement'],['match','Prochain match'],['2','Une semaine'],['10','Dix jours'],['40','Fin de saison / décision']];
export function initSimulation(s) {
  s.simulation??={mode:'1',cursor:null};
  return s.simulation;
}
export function setAdvanceMode(s,mode) {
  if (s.retired || !ADVANCE_MODES.some(([id])=>id===mode)) return false;
  const pref=initSimulation(s);
  if (pref.mode!==mode) { pref.mode=mode; pref.cursor=null; }
  return true;
}
export function beginAdvance(s) {
  const pref=initSimulation(s);
  if (pref.cursor && !destinationReached(s)) return pref.cursor;
  const mode=pref.mode, cursor={mode,fromDay:s.day,fromSeason:s.season};
  if (mode==='40') cursor.targetSeason=s.season+1;
  else if (mode==='2' || mode==='10') cursor.targetDay=s.day+(mode==='2'?7:10);
  else if (mode==='match') {
    cursor.matchId=s.competitions.flatMap(c=>c.schedule).filter(g=>!g.result&&(g.home===s.team||g.away===s.team)).sort((a,b)=>a.day-b.day||a.id.localeCompare(b.id))[0]?.id||null;
    if (!cursor.matchId) cursor.targetSeason=s.season+1;
  }
  pref.cursor=cursor;
  return cursor;
}
export function destinationReached(s) {
  const c=s.simulation?.cursor;
  if (!c) return true;
  if (c.targetSeason) return s.season>=c.targetSeason;
  if (c.targetDay!==undefined) return s.day>=c.targetDay && !s.competitions.some(l=>l.schedule.some(g=>!g.result&&g.day<=c.targetDay));
  if (c.matchId) return s.competitions.some(l=>l.schedule.some(g=>g.id===c.matchId&&g.result)) || s.season>c.fromSeason;
  return false;
}
export function settleAdvance(s, eventCompleted=false) {
  const c=s.simulation?.cursor;
  if (c && (destinationReached(s) || c.mode==='1'&&eventCompleted&&!s.match)) s.simulation.cursor=null;
}
export function destinationLabel(s) {
  const c=s.simulation?.cursor;
  if (!c) return '';
  if (c.targetSeason) return `Destination conservée : bilan de la saison ${c.fromSeason}.`;
  if (c.targetDay!==undefined) return `Destination conservée : jour ${c.targetDay-(c.fromSeason-1)*365} de la saison ${c.fromSeason}.`;
  return c.matchId?'Destination conservée : le prochain match.':'Prochain événement.';
}
export function validateSimulation(s) {
  const p=s.simulation;
  if (!p || !ADVANCE_MODES.some(([id])=>id===p.mode)) throw Error('Préférence de simulation invalide');
  const c=p.cursor;
  if (c && (c.mode!==p.mode || !Number.isInteger(c.fromDay) || c.fromDay<0 || !Number.isInteger(c.fromSeason) || c.fromSeason<1 || c.targetDay!==undefined&&(!Number.isInteger(c.targetDay)||c.targetDay<c.fromDay) || c.targetSeason!==undefined&&(!Number.isInteger(c.targetSeason)||c.targetSeason<=c.fromSeason) || c.matchId!==undefined&&c.matchId!==null&&typeof c.matchId!=='string')) throw Error('Destination de simulation invalide');
}
