import {hero,team,overall} from './engine.js?v=3.8.0';
import {leagueDef} from './leagues.js?v=3.8.0';
import {careerTotals} from './legacy.js?v=3.8.0';
export function beginChapters(s){
 s.chapters??={version:1,current:null,history:[]};
 if(s.chapters.current?.season===s.season)return;
 const p=hero(s),n=leagueDef(s.league).games,entries=[];
 const add=(kind,title,text,target,extra={})=>entries.push({id:`${s.season}-${kind}`,kind,title,text,target,value:0,completed:null,...extra});
 const previous=s.careerLedger.titles.find(t=>t.eligible&&t.season===s.season-1&&t.team===s.team);
 const injury=s.health?.history?.findLast(h=>h.serious&&h.season>=s.season-1);
 const rival=s.legacy.rivals.filter(r=>r.lastSeries&&!r.lastSeries.won&&r.lastSeries.season>=s.season-2).sort((a,b)=>b.lastSeries.season-a.lastSeries.season||b.post-a.post)[0];
 const years=new Set(s.careerLedger.stints.filter(t=>t.team===s.team).map(t=>t.season)).size;
 if(injury)add('return','Revenir sur le terrain','Rejouer cinq matchs après votre blessure importante.',5);
 if(previous)add('defend','Défendre votre titre',`${team(s).name} repart après son sacre de la saison ${previous.season}.`,1,{team:s.team,league:previous.league});
 if(rival)add('revenge','Retrouver votre adversaire',`Gagner une nouvelle série face à ${rival.name}, qui vous a éliminé en saison ${rival.lastSeries.season}. La rencontre dépend de vos qualifications.`,1,{opponent:rival.team});
 if(p.age>=32&&overall(p)>=90)add('longevity','Prolonger votre sommet','Disputer une saison régulière complète à au moins 92 de général.',Math.ceil(n*.65));
 if(years>=3)add('loyalty','L’histoire d’un club',`Une ${years}e saison avec ${team(s).name} : y jouer ${Math.ceil(n*.65)} matchs.`,Math.ceil(n*.65),{team:s.team});
 if(overall(p)>=90&&!s.chapters.history.some(y=>y.entries.some(e=>e.kind==='final'&&e.completed!==null)))add('final','Atteindre la finale','Jouer une finale dans votre compétition.',1);
 const total=careerTotals(s).pts,target=(Math.floor(total/1000)+1)*1000;
 add('record',`${target.toLocaleString('fr-FR')} points en carrière`,'Un cap personnel fondé sur vos points déjà inscrits.',target);
 add('place','Gagner votre place','Jouer régulièrement et atteindre 27 minutes prévues par le coach.',Math.ceil(n*.5));
 s.chapters.current={season:s.season,entries:entries.slice(0,3)};
 updateChapters(s);
}
export function updateChapters(s,g=null,m=null){
 const y=s.chapters?.current;if(!y||y.season!==s.season)return;
 const p=hero(s),gp=!!m?.box[s.hero]?.min;
 for(const e of y.entries){
  if(e.kind==='record')e.value=careerTotals(s).pts;
  if(e.kind==='return'&&gp&&!p.injury)e.value++;
  if(e.kind==='defend')e.value=Number(s.careerLedger.titles.some(t=>t.eligible&&t.season===s.season&&t.team===e.team&&t.league===e.league));
  if(e.kind==='revenge')e.value=Number(s.legacy.rivals.find(r=>r.team===e.opponent)?.lastSeries?.season===s.season&&s.legacy.rivals.find(r=>r.team===e.opponent).lastSeries.won);
  if(e.kind==='loyalty'&&gp&&s.team===e.team)e.value++;
  if(e.kind==='longevity'&&gp&&g.stage==='regular'&&overall(p)>=92)e.value++;
  if(e.kind==='place'&&gp&&s.minutes>=27)e.value++;
  if(e.kind==='final'&&gp&&g.stage==='post'&&s.competitions.find(c=>c.id===g.league)?.post?.series.length===1)e.value=1;
  if(e.value>=e.target&&e.completed===null)e.completed=s.day;
 }
}
export function closeChapters(s){
 if(s.chapters.history.some(y=>y.season===s.season))return;
 s.chapters.history.push(structuredClone(s.chapters.current));
}
