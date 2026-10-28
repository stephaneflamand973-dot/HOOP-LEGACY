// Presentation only: never consumes randomness or changes a simulation destination.
export const MOMENT_MODES=[['highlights','Temps forts'],['decisions','Décisions uniquement'],['summary','Résumé dans le journal']];
export function setMomentMode(s,mode){
 if(s.retired||!s.v40||!MOMENT_MODES.some(([id])=>id===mode))return false;
 s.v40.moments.mode=mode;
 if(mode!=='highlights'&&s.sportEvents)s.sportEvents.notice=null;
 return true;
}
export function emitMoment(s,{id,kind='sport',title,text,league=s.league}){
 if(!s.v40||s.retired)return false;
 const m=s.v40.moments;s.sportEvents??={seen:[],notice:null};
 // Old saves may already have displayed this event before V4 migration.
 const key=s.season+':'+id;
 if(m.seen.includes(key)||s.sportEvents.seen.includes(id))return false;
 if(typeof id!=='string'||id.length>180||typeof title!=='string'||typeof text!=='string')return false;
 m.seen.push(key);
 const item={id,kind,title,text,league,day:s.day,season:s.season};
 m.history.push(item);m.history=m.history.slice(-80);
 if(m.mode==='highlights'){
  if(s.sportEvents.notice)s.sportEvents.notice.items.push({...item});
  else s.sportEvents.notice={day:s.day,items:[{...item}]};
 }
 return true;
}
