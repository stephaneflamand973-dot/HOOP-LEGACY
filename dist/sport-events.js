import {emitMoment} from './career-moments.js?v=4.0.0';
export function initSportEvents(s) { s.sportEvents??={seen:[],notice:null}; }
export function sportingPause(s,id,title,text,league=s.league) {
  if(s.v40)return emitMoment(s,{id,title,text,league});
  initSportEvents(s);
  const events=s.sportEvents;
  if (events.seen.includes(id) || s.retired) return false;
  events.seen.push(id);
  const item={id,title,text,league};
  // Several results at the same boundary are presented together, with one resume action.
  if (events.notice) events.notice.items.push(item);
  else events.notice={day:s.day,items:[item]};
  return true;
}
export function acknowledgeSport(s) {
  if (s.retired || !s.sportEvents?.notice) return false;
  s.sportEvents.notice=null;
  return true;
}
export const hasSportPause=s=>!!s.sportEvents?.notice;
