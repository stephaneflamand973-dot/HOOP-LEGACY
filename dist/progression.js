import {canChange} from './commands.js?v=3.7.0';
import {initEnvironment,coachTraining} from './environment.js?v=3.7.0';
import {masteryTraining} from './system.js?v=3.7.0';
import {GROUPS,KEYS,STYLES,WEIGHTS} from './config.js?v=3.7.0';
export const DOMAINS=Object.keys(GROUPS);
export const domainOf=k=>DOMAINS.find(d=>GROUPS[d].includes(k));
export const LEAGUE_XP={highschool:.5,ncaa:.72,nba:1.15,euroleague:1.08,acb:1,elite:.92,bbl:.9,lba:.94,nbl:.92};
const EXPLOSIVE=new Set(['speed','agility','vertical','ballSpeed','dunk']);
const ATHLETIC=new Set(['stamina','strength','standing','steal','block','offReb','defReb','perimeter']);
export function costDetails(p,k){
 const base=38+Math.max(0,p.attrs[k]-55)*1.35+Math.max(0,p.attrs[k]-80)**2*.22+Math.max(0,p.attrs[k]-90)**3*.9;
 // Development remains possible at every age, with no personal rating ceiling.
 // Physical maintenance consumes reserves increasingly; technique stays cheaper.
 const onset=EXPLOSIVE.has(k)?28:ATHLETIC.has(k)?30:36;
 const ageFactor=1+Math.pow(Math.max(0,p.age-onset)/(EXPLOSIVE.has(k)?3.5:ATHLETIC.has(k)?3.5:5),EXPLOSIVE.has(k)||ATHLETIC.has(k)?3:2);
 return {base:Math.round(base),ageFactor,total:Math.round(base*ageFactor)};
}
export const costFor=(p,k)=>costDetails(p,k).total;
export function initDevelopment(s){
 s.development??={gained:0};let d=s.development;
 d.xp??=Object.fromEntries(DOMAINS.map(k=>[k,0]));d.earned??=Object.fromEntries(DOMAINS.map(k=>[k,0]));
 d.last??=[];d.sources??={match:0,training:0};d.weekXP??={};
 s.trainingPlan??={mode:'assisted',domain:domainOf(s.training)||'Tir',intensity:'normal'};
 const p=s.players?.find(p=>p.id===s.hero);if(p)d.year??={season:s.season,start:{...p.attrs},sources:{match:0,training:0},gains:0};
}
export function spendXP(s,p,k,internal=false){initDevelopment(s);let d=domainOf(k),cost=costFor(p,k);if(!internal&&!canChange(s)||!d||p.attrs[k]>=99||s.development.xp[d]<cost)return false;
 s.development.xp[d]-=cost;p.attrs[k]=Math.min(99,p.attrs[k]+1);s.development.gained++;s.development.year.gains++;s.development.last.push(k);s.development.last=s.development.last.slice(-22);return true;
}
export function autoSpend(s,p){if(!s.auto)return;for(let domain of DOMAINS){for(let i=0;i<100;i++){
 let candidates=GROUPS[domain].filter(k=>p.attrs[k]<99&&s.development.xp[domain]>=costFor(p,k));
 // Raise weaker skills in the domain; a chosen focus remains a preference, never a cap.
 candidates.sort((a,b)=>(p.attrs[a]-(a===s.training?7:STYLES[p.style]?.includes(a)?3:0))-(p.attrs[b]-(b===s.training?7:STYLES[p.style]?.includes(b)?3:0))||KEYS.indexOf(a)-KEYS.indexOf(b));
 if(!candidates.length||!spendXP(s,p,candidates[0],true))break;
 }}}
export function awardXP(s,p,amounts,source){initDevelopment(s);let granted={};for(let d of DOMAINS){let n=Math.max(0,Math.round(amounts[d]||0));s.development.xp[d]+=n;s.development.earned[d]+=n;s.development.sources[source]+=n;s.development.year.sources[source]+=n;granted[d]=n;}s.development.lastAward={source,day:s.day,amounts:granted};autoSpend(s,p);return granted;}
export function matchXP(s,p,b,league){if(!b?.min)return null;initDevelopment(s);
 const efficiency=Math.max(.6,Math.min(1.25,(b.pts+.9*b.ast+.5*b.reb+1.6*(b.stl+b.blk)-1.1*b.tov-.65*(b.fga-b.fgm))/Math.max(8,b.min*.62)));
 const played=Math.min(1.15,b.min/26),coef=LEAGUE_XP[league]||1;
 // A shared weekly allowance covers domestic and continental fixtures together.
 // It reduces schedule-length advantages, without erasing useful extra appearances.
 const week=Math.floor(s.day/7),already=s.development.weekXP[week]||0;
 const normalizer=already>460?.22:already>260?.55:1;
 const base=coef*played*efficiency*normalizer;
 const raw={Finition:(12+Math.max(0,b.fgm-b.tpm)*2.2)*base,Tir:(12+b.tpm*4+b.ftm)*base,Création:(14+b.ast*3-b.tov)*base,Défense:(18+b.stl*5+b.blk*5)*base,Rebond:(12+b.reb*2.3)*base,Physique:(15+b.min*.3)*base};
 let out=awardXP(s,p,raw,'match');s.development.weekXP={[week]:already+Object.values(out).reduce((a,b)=>a+b,0)};
 s.development.performance={efficiency:+efficiency.toFixed(2),coefficient:coef,normalizer,minutes:+b.min.toFixed(1),amounts:out};return out;
}
export function trainingDay(s,p){initDevelopment(s);initEnvironment(s);if(p.injury||s.environment.lastTrainingDay===s.day)return;
 let plan=s.trainingPlan,rest=s.activity==='repos'||p.fatigue>65;
 if(rest){p.fatigue=Math.max(0,p.fatigue-7);return;}
 if(s.day%2!==0)return; // Fixed dates: clicking or splitting time cannot farm a session.
 s.environment.lastTrainingDay=s.day;
 let intensity=plan.intensity==='light'?.7:plan.intensity==='hard'?1.25:1;
 if(plan.mode==='assisted'&&p.fatigue>40)intensity=.65;intensity*=Math.max(.85,1-(s.life?.sponsors.reduce((n,c)=>n+c.obligation,0)||0)*.025-(s.life?.children.length||0)*.015);
 const focus=plan.domain,raw=Object.fromEntries(DOMAINS.map(d=>[d,(d===focus?29:12)*intensity*(s.career.stage==='highschool'?.25:s.career.stage==='college'?.45:.8)]));
 if(s.activity==='video'){raw.Création+=9;raw.Défense+=9;s.iq=Math.min(99,s.iq+.1);}
 if(s.activity==='etudes'){s.career.academics=Math.min(100,s.career.academics+.6);for(let d of DOMAINS)raw[d]*=.8;}
 if(s.activity==='famille')for(let d of DOMAINS)raw[d]*=.8;
 const coached=coachTraining(s,p,raw);
 masteryTraining(s,intensity);p.fatigue=Math.min(100,p.fatigue+intensity*3);awardXP(s,p,coached.amounts,'training');
}
export function ageAttributes(p,{care=1,ai=false,coach=65,random=()=>.5}={}){
 const changes={},minutes=p.season?.gp?p.season.min/p.season.gp:0;
 const opportunity=.42+Math.min(.58,minutes/38),support=.85+Math.max(0,coach-50)/160;
 const late=(p.developmentTiming??0)>=.8;
 for(let k of KEYS){
  let delta=0;
  if(ai&&p.age<32){
   const window=p.age<23?1.45:p.age<27?.85:late&&p.age<=30?1.65:.12;
   const mastery=1/(1+(Math.max(0,p.attrs[k]-76)/12)**2);
   delta=window*(p.developmentRate??1)*opportunity*support*mastery*(WEIGHTS[p.pos]?.[k]?1.08:.65)*(.7+random()*.6);
  }
  if(EXPLOSIVE.has(k)&&p.age>=30)delta-=(p.age-29)*.17/care;
  else if(ATHLETIC.has(k)&&p.age>=33)delta-=(p.age-32)*.12/care;
  else if(['pass','interior','post'].includes(k)){
   if(p.age>=28&&p.age<36)delta+=.2;
   else if(p.age>=40)delta-=(p.age-39)*.05/care;
  }else if(p.age>=36)delta-=(p.age-35)*.06/care;
  p.aging??={};p.aging[k]=(p.aging[k]||0)+delta;
  const whole=p.aging[k]>=0?Math.floor(p.aging[k]):Math.ceil(p.aging[k]);
  const before=p.attrs[k];p.attrs[k]=Math.max(25,Math.min(99,before+whole));p.aging[k]-=whole;
  if(p.attrs[k]!==before)changes[k]=p.attrs[k]-before;
 }
 if(!ai)p.lastAging={age:p.age,changes};return changes;
}
export function closeDevelopmentYear(s,p,aging){
 initDevelopment(s);const d=s.development;
 d.lastSeason={...d.year,end:{...p.attrs},aging:{...aging}};
 d.year={season:s.season,start:{...p.attrs},sources:{match:0,training:0},gains:0};
 return d.lastSeason;
}
