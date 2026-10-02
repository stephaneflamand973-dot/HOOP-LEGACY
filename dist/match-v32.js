import {KEYS,BADGES,TECHNIQUES} from './config.js?v=3.3.0';
import {leagueDef} from './leagues.js?v=3.3.0';
import {clamp,rng,team,getPlayer,overall,hero,badgeLevel} from './engine.js?v=3.3.0';
const line=p=>({id:p.id,name:p.name,pts:0,reb:0,oreb:0,ast:0,stl:0,blk:0,tov:0,fgm:0,fga:0,tpm:0,tpa:0,ftm:0,fta:0,pf:0,min:0});
function weighted(s,list,value){let weights=list.map(value),r=rng(s,'match')*weights.reduce((a,b)=>a+b,0);for(let i=0;i<list.length;i++){r-=weights[i];if(r<=0)return list[i]}return list.at(-1)}
export function tendencies(p){let a=p.attrs;return {three:Math.max(5,(a.three-30)*1.8),drive:Math.max(5,a.layup+a.ballSpeed-70),post:Math.max(5,a.post+a.strength-80),mid:Math.max(5,a.mid-35),pass:Math.max(10,a.pass),...(p.tendencyMode==='manual'?p.tendencies:{})};}
const byContext=Object.groupBy?Object.groupBy(BADGES,b=>b.context):BADGES.reduce((o,b)=>{(o[b.context]??=[]).push(b);return o},{});
function rawBonus(p,context){let total=(byContext[context]||[]).reduce((v,b)=>v+badgeLevel(p,b)*b.effect,0),tech=TECHNIQUES.filter(t=>p.equipped.includes(t.id)&&t.context===context&&p.attrs[t.attr]>=t.threshold);return Math.min(.07,total+(tech.length?Math.max(...tech.map(t=>t.effect)):0));}
const bonus=(m,p,context)=>m.bonuses[p.id]?.[context]||0;
function used(p,context){for(let b of byContext[context]||[])if(p.attrs[b.attr]>=b.threshold)p.badges[b.id]=(p.badges[b.id]||0)+1;}
export function startMatch(s,g){if(g.result)throw Error('Match déjà résolu');let clubs=[team(s,g.home),team(s,g.away)],players=clubs.flatMap(t=>t.roster.map(id=>getPlayer(s,id)));
 let duration=leagueDef(g.league).minutes;
 let total=Math.round((duration===48?198:duration===40?146:128)+(clubs.filter(t=>t.system==='pace').length*8-clubs.filter(t=>t.system==='defense').length*5));total+=total%2;
 return {id:g.id,league:g.league,home:g.home,away:g.away,duration,regulation:total,total,n:0,ot:0,score:[0,0],done:false,box:Object.fromEntries(players.map(p=>[p.id,line(p)])),ratings:Object.fromEntries(players.map(p=>[p.id,overall(p)])),bonuses:Object.fromEntries(players.map(p=>[p.id,Object.fromEntries(Object.keys(byContext).map(c=>[c,rawBonus(p,c)]))])),tendencies:Object.fromEntries(players.map(p=>[p.id,tendencies(p)])),events:[],grade:50,reasons:{},retain:g.home===s.team||g.away===s.team};
}
function lineup(s,m,tid){let all=team(s,tid).roster.map(id=>getPlayer(s,id)).filter(p=>!p.injury);let eligible=all.filter(p=>m.box[p.id].pf<(m.duration===48?6:5));if(eligible.length<5)eligible=all; // Emergency last eligible player rule; no injured player takes the floor.
 let chosen=[],phase=Math.floor(m.n/12)%5;
 for(let pos of ['MJ','AR','AI','AF','P']){
 let options=eligible.filter(p=>!chosen.includes(p));if(!options.length)break;
 const score=p=>m.ratings[p.id]+(p.pos===pos?12:p.secondary===pos?6:0)-m.box[p.id].min*.48-p.fatigue*.09+(phase===3&&m.box[p.id].min<4?15:0)+(p.id===s.hero?(s.trust-50)*.08:0);
 options.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));chosen.push(options[0]);
 }
 // Coaching allocates the user's minutes; presentation and UI have no sporting effect.
 let h=eligible.find(p=>p.id===s.hero);if(h){let fraction=s.minutes/m.duration*(h.returning?.65:1),want=(m.n%100)<fraction*100;
 if(want&&!chosen.includes(h))chosen[chosen.length-1]=h;
 if(!want&&chosen.includes(h)){let q=eligible.find(p=>p!==h&&!chosen.includes(p));if(q)chosen[chosen.indexOf(h)]=q;}}
 return chosen;
}
export function stepMatch(s,m,count=1){if(Object.getPrototypeOf(m.box)!==null)for(let key of ['box','ratings','bonuses','tendencies'])m[key]=Object.assign(Object.create(null),m[key]);for(let n=0;n<count&&!m.done;n++){
 const side=m.n%2,tid=side?m.away:m.home,opp=side?m.home:m.away;
 // Recompute rotations every 12 actions, but immediately replace a fouled-out player.
 if(!m.lineups||m.n%12===0||Object.values(m.lineups).flat().some(id=>m.box[id].pf>=(m.duration===48?6:5))){m.lineups={[m.home]:lineup(s,m,m.home).map(p=>p.id),[m.away]:lineup(s,m,m.away).map(p=>p.id)};}
 const atk=m.lineups[tid].map(id=>getPlayer(s,id)),def=m.lineups[opp].map(id=>getPlayer(s,id));
 if(!atk.length||!def.length)throw Error('Effectif indisponible : aucun joueur valide');
 const seconds=m.n<m.regulation?m.duration*60/m.regulation:15;
 for(let p of [...atk,...def])m.box[p.id].min+=seconds/60;
 let handler=weighted(s,atk,p=>Math.max(1,p.attrs.handle+p.attrs.pass-65)),p=weighted(s,atk,q=>Math.max(8,Math.max(q.attrs.three,q.attrs.close,q.attrs.layup,q.attrs.post)-45)**1.6);
 let d=def.reduce((best,q)=>Math.abs(['MJ','AR','AI','AF','P'].indexOf(q.pos)-['MJ','AR','AI','AF','P'].indexOf(p.pos))<Math.abs(['MJ','AR','AI','AF','P'].indexOf(best.pos)-['MJ','AR','AI','AF','P'].indexOf(p.pos))?q:best,def[0]);
 const t=m.tendencies[p.id],action=weighted(s,['three','drive','post','mid'],k=>Math.max(1,t[k]));
 let k=action==='three'?'three':action==='mid'?'mid':action==='post'?'post':p.attrs.dunk>p.attrs.layup+6?'dunk':'layup',context=action==='mid'?'pull':action==='drive'?k:action;
 const three=k==='three',interior=!three&&k!=='mid',b=m.box[p.id],db=m.box[d.id];
 let passer=handler!==p?handler:weighted(s,atk.filter(q=>q!==p),q=>q.attrs.pass);
 const spacing=atk.filter(q=>q!==p).reduce((v,q)=>v+q.attrs.three,0)/Math.max(1,atk.length-1),screen=atk.filter(q=>q!==p).reduce((v,q)=>Math.max(v,q.attrs.strength+bonus(m,q,'screen')*100),0);
 const fit=team(s,tid).system==='pace'?(p.attrs.speed-65)*.0006:team(s,tid).system==='defense'?-.005:.008;
 const tired=p.fatigue*.0006+b.min/(3500+p.attrs.stamina*22),defense=(interior?d.attrs.interior:d.attrs.perimeter),heightAdv=clamp(((p.height||200)-(d.height||200))*.001,-.025,.025);
 let turnover=clamp(.125+(d.attrs.steal-p.attrs.handle)/850+(70-passer.attrs.pass)/1600+tired*.3-bonus(m,p,'handle'),.04,.22);
 let text='',made=false,probability=0,assist=false;
 if(rng(s,'match')<turnover){b.tov++;let steal=rng(s,'match')<.58;if(steal){db.stl++;used(d,'steal')}text=steal?`${d.name} intercepte le ballon de ${p.name}.`:`${p.name} perd le ballon hors des limites.`;}
 else{
 const contest=clamp(.5+(defense-p.attrs.ballSpeed)*.002-(spacing-65)*.002-(screen-65)*.0007,.12,.82);
 probability=clamp((three?.18:interior?.32:.23)+p.attrs[k]*.0042-contest*.16-tired+(passer.attrs.pass-65)*.0005+heightAdv+fit+(tid===s.team?(s.relationships.team-50)*.0002:0)+(p.id===s.hero?(s.life.morale-50)*.00025:0)+bonus(m,p,context)-bonus(m,d,interior?'interior':'perimeter'),.1,three?.58:.84);
 let foul=rng(s,'match')<(interior?.135:.045),blocked=!foul&&rng(s,'match')<clamp((interior?d.attrs.block:25)/1800+bonus(m,d,'block')*.3,.008,.08);
 if(foul){db.pf++;let attempts=three?3:2;b.fta+=attempts;for(let i=0;i<attempts;i++)if(rng(s,'match')<clamp(.29+p.attrs.free*.006,.45,.94)){b.ftm++;b.pts++;m.score[side]++;}text=`${p.name} obtient ${attempts} lancers francs.`;used(p,'free');}
 else{
 b.fga++;if(three)b.tpa++;made=!blocked&&rng(s,'match')<probability;
 if(made){let pts=three?3:2;b.fgm++;if(three)b.tpm++;b.pts+=pts;m.score[side]+=pts;assist=rng(s,'match')<clamp(.44+(passer.attrs.pass-60)*.006+bonus(m,passer,'assist'),.35,.8);if(assist){m.box[passer.id].ast++;used(passer,'assist');used(passer,'pass');}text=`${p.name} marque ${pts} points${assist?', servi par '+passer.name:''}.`;}
 else{if(blocked){db.blk++;used(d,'block');}let offensive=rng(s,'match')<clamp(.24+(atk.reduce((n,q)=>n+q.attrs.offReb,0)-def.reduce((n,q)=>n+q.attrs.defReb,0))/1600,.12,.36);
 let r=weighted(s,offensive?atk:def,q=>Math.max(1,((offensive?q.attrs.offReb:q.attrs.defReb)-20)**2)*(1+((q.height||200)-190)/120));m.box[r.id].reb++;if(offensive)m.box[r.id].oreb++;used(r,offensive?'offReb':'rebound');text=`${p.name} ${blocked?'est contré':'rate'}. Rebond ${r.name}.`;
 if(offensive){let rb=m.box[r.id];rb.fga++;if(rng(s,'match')<clamp(.21+r.attrs.close*.004,.3,.68)){rb.fgm++;rb.pts+=2;m.score[side]+=2;text+=' Deuxième chance convertie.';}else{let dr=weighted(s,def,q=>q.attrs.defReb**2);m.box[dr.id].reb++;}}}
 }
 used(p,context);used(p,action==='drive'?'drive':'team');used(d,interior?'interior':'perimeter');
 }
 if(m.retain)m.events.push({n:m.n,score:[...m.score],text,action,probability:+probability.toFixed(3),key:made&&(three||Math.abs(m.score[0]-m.score[1])<=5&&m.n>m.regulation*.85)});
 m.n++;
 if(m.n>=m.total){if(m.score[0]===m.score[1]){m.ot++;m.total+=20;m.lineups=null;}else m.done=true;}
 }
 if(m.done){let b=m.box[s.hero];if(b?.min){let value=(b.pts+b.reb*.8+b.ast*1.4+b.stl*2+b.blk*2-b.tov*1.7-(b.fga-b.fgm)*.6)/Math.max(12,b.min)*30;m.grade=clamp(43+value*1.25,20,99);m.reasons={'Production et efficacité':Math.round(value*1.25),'Présence sur le terrain':+b.min.toFixed(1)};}delete m.lineups;for(let key of ['box','ratings','bonuses','tendencies'])m[key]=Object.assign({},m[key]);}
 return m;
}
