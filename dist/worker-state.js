// History is immutable. Transfer the active season, then reattach the retained prefix.
export function splitWorkerState(s){
 const prefix={archives:s.archives.slice(0,-1),awards:s.statistics.awards.filter(a=>a.season<s.season),years:{}};
 const people=Object.fromEntries(Object.entries(s.statistics.people).map(([id,p])=>{prefix.years[id]=p.years;return [id,{...p,years:[]}];}));
 return {prefix,state:{...s,archives:s.archives.slice(-1),statistics:{...s.statistics,people,awards:s.statistics.awards.filter(a=>a.season>=s.season)}}};
}
export function joinWorkerState(state,prefix){
 const people=Object.fromEntries(Object.entries(state.statistics.people).map(([id,p])=>[id,{...p,years:[...(prefix.years[id]||[]),...p.years]}]));
 return {...state,archives:[...prefix.archives,...state.archives],statistics:{...state.statistics,people,awards:[...prefix.awards,...state.statistics.awards]}};
}
