// Small, local effects. Unknown measurements use a neutral reach, without rewriting a player.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const reach=p=>clamp((p.wingspan??((p.height||200)+6))-(p.height||200)-6,-20,30);
export function physicalContest(p,d,action){
 const change=action==='drive'?clamp((d.attrs.agility-p.attrs.agility)*.0012,-.06,.06):0;
 return change+clamp(reach(d)*.001,-.015,.025);
}
export function aerialFinish(p,kind){return ['dunk','layup','close'].includes(kind)?clamp((p.attrs.vertical-65)*.00045,-.018,.016):0;}
export function physicalBlock(d,interior){return interior?clamp((d.attrs.vertical-65)*.00022+reach(d)*.00016,-.009,.012):0;}
export function physicalRebound(p){return clamp(1+(p.attrs.vertical-65)*.002+reach(p)*.002,.88,1.13);}
export function coveragePlan(players,ratings){
 const ranked=[...players].sort((a,b)=>ratings[b.id]-ratings[a.id]||a.id.localeCompare(b.id));
 const best=ranked[0],next=ranked[1];
 return best&&ratings[best.id]>=90&&ratings[best.id]-(next?ratings[next.id]:80)>=4?{target:best.id,pressure:clamp(.018+(ratings[best.id]-90)*.002,0,.036)}:null;
}
export function coverageEffect(plan,p){return !plan?0:plan.target===p.id?-plan.pressure:plan.pressure*.4;}
