import {KEYS,WEIGHTS} from './config.js?v=3.0.0';
import {leagueDef} from './leagues.js?v=3.0.0';
import {NBA_ROSTERS,ROSTER_SOURCE} from './nba-rosters.js?v=3.0.0';
import {generatedPlayer,overall,getPlayer,team,rng,log,totals,clamp} from './engine.js?v=3.0.0';
import {ageAttributes} from './progression.js?v=3.0.0';
// Bespoke game ratings, not an official or licensed ratings dataset.
const STARS={
'Nikola Jokic':[96,'P',30],'Shai Gilgeous-Alexander':[95,'MJ',27],'Giannis Antetokounmpo':[95,'AF',30],'Luka Doncic':[94,'MJ',26],'Stephen Curry':[92,'MJ',37],'Anthony Edwards':[90,'AR',24],'LeBron James':[90,'AI',40],'Kevin Durant':[90,'AI',37],'Victor Wembanyama':[91,'P',21],'Jayson Tatum':[91,'AI',27],'Jalen Brunson':[90,'MJ',29],'Donovan Mitchell':[89,'AR',29],'Anthony Davis':[90,'P',32],'Joel Embiid':[89,'P',31],'Devin Booker':[88,'AR',28],'Kawhi Leonard':[88,'AI',34],'James Harden':[88,'MJ',36],'Tyrese Haliburton':[88,'MJ',25],'Ja Morant':[87,'MJ',26],'Trae Young':[87,'MJ',27],'Cade Cunningham':[88,'MJ',24],'Paolo Banchero':[87,'AF',22],'Karl-Anthony Towns':[88,'P',29],'Domantas Sabonis':[87,'P',29],'Jimmy Butler III':[87,'AI',36],'Jaylen Brown':[88,'AR',29],'Jalen Williams':[87,'AI',24],'Chet Holmgren':[85,'P',23],'Jamal Murray':[85,'MJ',28],'Alperen Sengun':[86,'P',23],'Bam Adebayo':[86,'P',28],'Pascal Siakam':[86,'AF',31],'Scottie Barnes':[84,'AI',24],'Franz Wagner':[85,'AI',24],'LaMelo Ball':[85,'MJ',24],'Tyrese Maxey':[86,'MJ',24],'Kyrie Irving':[86,'MJ',33],'De\'Aaron Fox':[85,'MJ',27],'Derrick White':[84,'AR',31],'Evan Mobley':[86,'AF',24],'Jaren Jackson Jr.':[85,'AF',26],'Zion Williamson':[85,'AF',25],'Cooper Flagg':[79,'AF',18],'Damian Lillard':[84,'MJ',35],'Rudy Gobert':[83,'P',33],'Chris Paul':[74,'MJ',40],'Al Horford':[76,'P',39],'Kevin Love':[72,'AF',37],'Russell Westbrook':[76,'MJ',36],'Mike Conley':[75,'MJ',38],'Nicolas Batum':[75,'AI',36],'Joe Ingles':[69,'AI',38],'Kyle Lowry':[70,'MJ',39],'Garrett Temple':[65,'AR',39],'Jeff Green':[70,'AF',39]};
function hash(text){let n=2166136261;for(let c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function realRoster(s,t){let data=NBA_ROSTERS[t.name];if(!data)return null;return data.map((row,i)=>{
 let h=hash(row.name),star=STARS[row.name],p=generatedPlayer(s,`nba-${row.nbaId||h}`,t),height=row.height?Number(row.height.split('-')[0])*30.48+Number(row.height.split('-')[1])*2.54:195+h%17;
 let position=row.position||'',pos=star?.[1]||(position.startsWith('C')?'P':position.startsWith('G')?(height<194?'MJ':'AR'):(height>=205?'AF':'AI'));
 let age=star?.[2]||(Number(row.draftYear)>1980?clamp(2025-Number(row.draftYear)+20,19,39):23+h%7),base=star?.[0]||(row.twoWay?62+h%8:71+h%9);
 p.name=row.name;p.real=true;p.age=age;p.ageEstimated=!star;p.pos=pos;p.height=Math.round(height);p.nation='';p.twoWayReference=row.twoWay;
 p.attrs=Object.fromEntries(KEYS.map((k,j)=>[k,clamp(base+(WEIGHTS[pos][k]?1:-7)+((h>>>j%16)%9)-4,25,99)]));
 if(['P','AF'].includes(pos)){p.attrs.handle-=9;p.attrs.speed-=8;if(!['Nikola Jokic','Karl-Anthony Towns','Victor Wembanyama','Chet Holmgren'].includes(row.name))p.attrs.three-=15;}
 if(row.name==='Stephen Curry'){p.attrs.three=99;p.attrs.free=94;}if(row.name==='Nikola Jokic')p.attrs.pass=97;if(row.name==='Victor Wembanyama')p.attrs.block=98;if(row.name==='Rudy Gobert'){p.attrs.block=91;p.attrs.defReb=92;p.attrs.three=25;}
 p.contract.salary=Math.round(1e6*Math.pow(Math.max(1,(base-60)/8),2));p.contract.years=1+h%3;p.history=[];p.developmentRate=.5+(h%100)/100;p.tendencyMode='auto';return p;
 });}
export function initWorld(s){s.world??={transactions:[],retired:[],drafts:[],records:{},people:{}};s.rosterSource??=ROSTER_SOURCE;
 for(let t of s.teams){t.coachProfile??={name:t.coach,development:55+(hash(t.id)%35),patience:50+(hash(t.id)%40),since:s.season};t.strategy??=['Titre','Reconstruction','Développement','Playoffs'][hash(t.id)%4];}
 for(let p of s.players){p.history??=[];p.developmentRate??=.65+rng(s,'players')*.8;p.tendencyMode??='auto';}
}
const minRoster=t=>t.league==='nba'?15:10;
const payroll=(s,t)=>t.roster.reduce((v,id)=>v+(getPlayer(s,id)?.contract.salary||0),0);
function salary(p,t){let l=leagueDef(t.league);return l.amateur?0:Math.round(l.salary*(1+Math.max(0,overall(p)-l.minOffer)**1.5/7));}
function remember(s,p){s.world.people[p.id]={id:p.id,name:p.name,pos:p.pos,real:!!p.real,age:p.age,history:p.history.slice(-35)};}
export function refreshWorld(s){initWorld(s);s.lastDraft=[];let pool=new Set(s.freeAgents||[]),retired=new Set();
 for(let t of s.teams){let amateur=leagueDef(t.league).amateur;
 for(let id of [...t.roster]){if(id===s.hero)continue;let p=getPlayer(s,id);p.history.push({season:s.season-1,team:t.name,league:t.league,stats:p.season,ovr:overall(p)});p.history=p.history.slice(-3);p.age++;p.contract.years--;
 ageAttributes(p,{ai:true,random:()=>rng(s,'players')});let graduate=amateur&&p.age>(t.league==='highschool'?18:22),retire=!amateur&&(p.age>=42||p.age>=35&&overall(p)<leagueDef(t.league).level-12);
 if(retire){t.roster=t.roster.filter(x=>x!==id);retired.add(id);remember(s,p);s.world.retired.push({id,name:p.name,season:s.season-1,age:p.age});}
 else if(graduate||!amateur&&p.contract.years<=0){t.roster=t.roster.filter(x=>x!==id);pool.add(id);p.lastLeague=t.league;}
 p.season=totals();p.byLeague={};
 }
 // Sporting cycles are based on strength and age, rather than fixed franchise labels.
 let roster=t.roster.map(id=>getPlayer(s,id)),rating=roster.length?roster.reduce((n,p)=>n+overall(p),0)/roster.length:50,age=roster.length?roster.reduce((n,p)=>n+p.age,0)/roster.length:24;
 t.strategy=rating>=leagueDef(t.league).level+3?'Titre':age>29&&rating<leagueDef(t.league).level?'Reconstruction':rating>leagueDef(t.league).level-3?'Playoffs':'Développement';
 if(s.season-t.coachProfile.since>=3&&t.strategy==='Reconstruction'){t.coachProfile={name:'Coach '+s.nextId++,development:55+Math.floor(rng(s,'players')*35),patience:60,since:s.season};t.coach=t.coachProfile.name;}
 }
 // Age existing unsigned players once, without discarding their identities.
 for(let id of s.freeAgents||[]){let p=getPlayer(s,id);if(!p||retired.has(id))continue;p.age++;ageAttributes(p,{ai:true,random:()=>rng(s,'players')});if(p.age>40){pool.delete(id);retired.add(id);remember(s,p);}p.season=totals();p.byLeague={};}
 // A persistent fictional class joins the available graduating players each year.
 let template=s.teams.find(t=>t.league==='nba');for(let i=0;i<60;i++){let p=generatedPlayer(s,`rookie-${s.season}-${i}`,template,19+Math.floor(rng(s,'players')*3));let rating=60+rng(s,'players')*21;for(let k of KEYS)p.attrs[k]=Math.round(clamp(rating+(WEIGHTS[p.pos][k]?5:-5)+(rng(s,'players')-.5)*10,25,89));p.history=[];p.developmentRate=.65+rng(s,'players')*1.1;s.players.push(p);pool.add(p.id);}
 const ratings=new Map(s.players.map(p=>[p.id,overall(p)])),rating=p=>ratings.get(p.id)??overall(p);
 let previous=s.archives.at(-1)?.competitions.find(c=>c.id==='nba')?.records||{};let nba=s.teams.filter(t=>t.league==='nba').sort((a,b)=>(previous[a.id]?.wins||0)-(previous[b.id]?.wins||0)||a.id.localeCompare(b.id));
 let prospects=[...pool].map(id=>getPlayer(s,id)).filter(p=>p.age<=22&&rating(p)>=65).sort((a,b)=>rating(b)-rating(a)||a.id.localeCompare(b.id)).slice(0,60);
 s.world.draftPool=prospects.map(p=>({id:p.id,name:p.name,age:p.age,pos:p.pos,score:rating(p)}));
 for(let i=0;i<prospects.length;i++){let p=prospects[i],t=nba[i%30];if(t.roster.length>=18)continue;let pay=Math.min(salary(p,t),Math.max(1e6,t.budget-payroll(s,t)));p.contract={years:2,salary:pay,option:'Équipe',guarantee:1};t.roster.push(p.id);pool.delete(p.id);s.lastDraft.push({id:p.id,name:p.name,team:t.name,league:'nba',pos:p.pos,ovr:rating(p),age:p.age,pick:i+1});}
 // Clubs recruit for role needs, finances and their current sporting strategy.
 const priority=new Map([...s.teams].sort((a,b)=>a.id.localeCompare(b.id)).map(t=>[t.id,rng(s,'players')]));
 const marketLevel=t=>Math.max(...t.competitions.map(id=>leagueDef(id).level));
 const clubs=[...s.teams].sort((a,b)=>marketLevel(b)-marketLevel(a)||priority.get(a.id)-priority.get(b.id));
 // One signing per club per round: roster/catalogue order grants no permanent first choice.
 for(let level of [...new Set(clubs.map(marketLevel))])for(let round=0;round<20;round++)for(let t of clubs.filter(t=>marketLevel(t)===level)){
 if(t.roster.length>=minRoster(t))continue;
 let def=leagueDef(t.league),need=Object.keys(WEIGHTS).sort((a,b)=>t.roster.filter(id=>getPlayer(s,id).pos===a).length-t.roster.filter(id=>getPlayer(s,id).pos===b).length)[0];
 let candidates=[...pool].map(id=>getPlayer(s,id)).filter(p=>def.amateur?p.age<=(t.league==='highschool'?18:22)&&(!p.lastLeague||leagueDef(p.lastLeague)?.amateur):p.age>=18&&rating(p)>=def.minOffer-5);
 let value=p=>rating(p)+(p.pos===need?10:0)+(t.strategy==='Reconstruction'||t.strategy==='Développement'?(25-p.age)*.8:0)-Math.abs(rating(p)-def.level)*.18;
 candidates.sort((a,b)=>value(b)-value(a)||a.id.localeCompare(b.id));let p=candidates[0];
 if(!p){p=generatedPlayer(s,`academy-${s.season}-${s.nextId++}`,t,def.amateur?(t.league==='highschool'?16:18):20);p.pos=need;p.history=[];s.players.push(p);}else pool.delete(p.id);
 let pay=def.amateur?0:Math.min(salary(p,t),Math.max(def.salary*.45,t.budget-payroll(s,t)));p.contract={years:def.amateur?1:2,salary:pay,option:'Aucune',guarantee:1};t.roster.push(p.id);
 if(p.lastLeague&&p.lastLeague!==t.league)s.world.transactions.unshift({season:s.season,day:s.day,player:p.name,to:t.name,from:p.lastLeague,type:'Signature'});
 }
 for(let t of clubs){
 // A hard simulation budget keeps the simplified economy stable over decades.
 let pay=payroll(s,t);if(pay>t.budget&&t.budget){let nonHero=t.roster.filter(id=>id!==s.hero),heroPay=t.roster.includes(s.hero)?getPlayer(s,s.hero).contract.salary:0,factor=Math.max(0,(t.budget-heroPay)/Math.max(1,pay-heroPay));for(let id of nonHero)getPlayer(s,id).contract.salary=Math.round(getPlayer(s,id).contract.salary*factor);}
 }
 let remaining=[...pool].map(id=>getPlayer(s,id)).sort((a,b)=>rating(b)-rating(a));s.freeAgents=remaining.slice(0,180).map(p=>p.id);for(let p of remaining.slice(180)){remember(s,p);retired.add(p.id);}
 let active=new Set([...s.teams.flatMap(t=>t.roster),...s.freeAgents,s.hero]);s.players=s.players.filter(p=>active.has(p.id)&&!retired.has(p.id));s.world.drafts.push({season:s.season-1,picks:s.lastDraft});s.world.transactions=s.world.transactions.slice(0,300);
}
export function marketDay(s){if(s.day%45!==0||s.day%365>180)return;initWorld(s);let clubs=s.teams.filter(t=>!leagueDef(t.league).amateur&&t.id!==s.team);
 let a=clubs[Math.floor(rng(s,'career')*clubs.length)],others=clubs.filter(t=>t.id!==a.id&&t.league===a.league);if(!others.length)return;let b=others[Math.floor(rng(s,'career')*others.length)];
 let candidate=t=>t.roster.map(id=>getPlayer(s,id)).filter(p=>p.age<35).sort((x,y)=>overall(x)-overall(y))[Math.min(2,t.roster.length-1)];let p=candidate(a),q=candidate(b);if(!p||!q||p.pos===q.pos)return;
 let count=(t,pos)=>t.roster.filter(id=>getPlayer(s,id).pos===pos).length;
 if(count(a,p.pos)<=count(a,q.pos)||count(b,q.pos)<=count(b,p.pos))return;
 if(payroll(s,a)-p.contract.salary+q.contract.salary>a.budget||payroll(s,b)-q.contract.salary+p.contract.salary>b.budget)return;
 a.roster=a.roster.map(id=>id===p.id?q.id:id);b.roster=b.roster.map(id=>id===q.id?p.id:id);
 s.world.transactions.unshift({day:s.day,season:s.season,type:'Échange',player:p.name+' / '+q.name,from:a.name,to:b.name});log(s,'Marché de la ligue',`${a.name} et ${b.name} échangent ${p.name} et ${q.name} pour rééquilibrer leurs postes.`);
}
