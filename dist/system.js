const bound=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
export function initMastery(s, recovered=false) {
  if (s.mastery) return;
  const before=s.system;
  // Old versions only reduced this value on transfers; never retroactively award XP.
  if (recovered) s.system=Math.max(45,s.system||0);
  s.mastery={version:1,since:s.day,start:s.system,sources:{match:0,training:0,video:0},recent:[],lastTrainingDay:null,compensation:recovered&&s.system>before?{from:before,to:s.system}:null};
}
function gain(s,amount,source) {
  initMastery(s);
  const before=s.system;
  s.system=bound(before+amount*(1-Math.max(0,before-50)*.012));
  const delta=s.system-before;
  s.mastery.sources[source]+=delta;
  if (delta>0) {
    s.mastery.recent.push({day:s.day,source,delta});
    s.mastery.recent=s.mastery.recent.slice(-24);
  }
  return delta;
}
export function masteryMatch(s,minutes) { return minutes>0?gain(s,.52*Math.min(1.35,minutes/26),'match'):0; }
export function masteryCollective(s,raw){initMastery(s);s.mastery.sources.collective??=0;return gain(s,raw,'collective');}
export function masteryTraining(s,intensity) {
  initMastery(s);
  if (s.mastery.lastTrainingDay===s.day) return 0;
  s.mastery.lastTrainingDay=s.day;
  return gain(s,(s.activity==='video'?.23:.1)*intensity,s.activity==='video'?'video':'training');
}
export function transferMastery(s,oldSystem,newSystem) {
  initMastery(s);
  const before=s.system;
  s.system=bound(before*(oldSystem===newSystem?.85:.65));
  s.mastery.recent.push({day:s.day,source:'transfer',delta:s.system-before,sameSystem:oldSystem===newSystem});
  s.mastery.recent=s.mastery.recent.slice(-24);
}
export function playerReading(s,p) {
  return p.id===s.hero?{system:bound((s.system-45)*.0003,-.012,.0165),iq:bound((s.iq-55)*.00025,-.01,.011)}:{system:0,iq:0};
}
