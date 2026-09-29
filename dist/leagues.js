// Reference pack: opening rosters of CLUBS in 2025–26. Players are generated.
// Counts are real regular-season counts. Fixture dates/opponent order are generated.
export const REFERENCE={season:'2025–2026',date:'2026-09-28',baseYear:2025,players:'Joueurs générés — aucun effectif réel revendiqué'};
const names=x=>x.split('|');
const nba=names('Boston Celtics|Brooklyn Nets|New York Knicks|Philadelphia 76ers|Toronto Raptors|Chicago Bulls|Cleveland Cavaliers|Detroit Pistons|Indiana Pacers|Milwaukee Bucks|Atlanta Hawks|Charlotte Hornets|Miami Heat|Orlando Magic|Washington Wizards|Denver Nuggets|Minnesota Timberwolves|Oklahoma City Thunder|Portland Trail Blazers|Utah Jazz|Golden State Warriors|LA Clippers|Los Angeles Lakers|Phoenix Suns|Sacramento Kings|Dallas Mavericks|Houston Rockets|Memphis Grizzlies|New Orleans Pelicans|San Antonio Spurs');
const elite=names('AS Monaco|Paris Basketball|ASVEL|JL Bourg|Cholet Basket|Le Mans Sarthe Basket|Saint-Quentin Basket-Ball|SIG Strasbourg|SLUC Nancy|JDA Dijon|Limoges CSP|Nanterre 92|Élan Chalon|Gravelines-Dunkerque|ESSM Le Portel|Boulazac Basket Dordogne');
const acb=names('Real Madrid|FC Barcelona|Baskonia|Valencia Basket|Unicaja Málaga|La Laguna Tenerife|Joventut Badalona|Gran Canaria|UCAM Murcia|BAXI Manresa|Casademont Zaragoza|Bilbao Basket|Río Breogán|MoraBanc Andorra|Bàsquet Girona|Hiopos Lleida|Covirán Granada|San Pablo Burgos');
const bbl=names('Bayern Munich|ALBA Berlin|ratiopharm Ulm|Telekom Baskets Bonn|MHP Riesen Ludwigsburg|Niners Chemnitz|Würzburg Baskets|Rasta Vechta|EWE Baskets Oldenburg|Basketball Löwen Braunschweig|MLP Academics Heidelberg|Hamburg Towers|Rostock Seawolves|Bamberg Baskets|Frankfurt Skyliners|Science City Jena|Gladiators Trier|Mitteldeutscher BC');
const lba=names('Olimpia Milano|Virtus Bologna|Germani Brescia|Reyer Venezia|Aquila Trento|Derthona Tortona|Reggiana|Pallacanestro Trieste|Treviso Basket|Pallacanestro Varese|Dinamo Sassari|Napoli Basket|Vanoli Cremona|Pallacanestro Cantù|APU Udine|Trapani Shark');
const nbl=names('Adelaide 36ers|Brisbane Bullets|Cairns Taipans|Illawarra Hawks|Melbourne United|New Zealand Breakers|Perth Wildcats|South East Melbourne Phoenix|Sydney Kings|Tasmania JackJumpers');
const euro=names('Anadolu Efes|AS Monaco|Baskonia|Crvena zvezda|Dubai Basketball|Olimpia Milano|FC Barcelona|Bayern Munich|Fenerbahçe|Hapoel Tel Aviv|ASVEL|Maccabi Tel Aviv|Olympiacos|Panathinaikos|Paris Basketball|Partizan|Real Madrid|Valencia Basket|Virtus Bologna|Žalgiris Kaunas');
const college=names('Duke Blue Devils|North Carolina Tar Heels|Kentucky Wildcats|Kansas Jayhawks|UCLA Bruins|UConn Huskies|Gonzaga Bulldogs|Arizona Wildcats|Baylor Bears|Houston Cougars|Purdue Boilermakers|Michigan State Spartans|Michigan Wolverines|Florida Gators|Auburn Tigers|Alabama Crimson Tide|Arkansas Razorbacks|Tennessee Volunteers|Texas Longhorns|Texas Tech Red Raiders|Texas A&M Aggies|Villanova Wildcats|Louisville Cardinals|Indiana Hoosiers|Ohio State Buckeyes|Wisconsin Badgers|Maryland Terrapins|Illinois Fighting Illini|Oregon Ducks|USC Trojans|Miami Hurricanes|Syracuse Orange');
const highschool=names('Atlantic Prep|Sunrise Academy|Northside High|Pacific Prep|Central High|Oak Valley High|East Bay Academy|Riverside High|West Coast Prep|Mountain Ridge High|Lakeside Academy|South Point High');
export const LEAGUES=[
 {id:'nba',name:'NBA',country:'États-Unis / Canada',teams:nba,games:82,minutes:48,level:79,budget:180e6,minOffer:70,playoff:16,playIn:10,series:[7,7,7,7],salary:1e6,source:'https://www.nba.com/news/2025-26-nba-regular-season-schedule'},
 {id:'elite',name:'Betclic ÉLITE',country:'France',teams:elite,games:30,minutes:40,level:64,budget:12e6,minOffer:53,playoff:8,playIn:10,series:[3,5,5],salary:80000,source:'https://cdn.lnb.fr/uploads/content-library/792adea228a453ec16b3afc5fb084fdfa0e843531e1538d21494984175b8850f.pdf'},
 {id:'acb',name:'Liga ACB',country:'Espagne',teams:acb,games:34,minutes:40,level:70,budget:25e6,minOffer:61,playoff:8,series:[3,5,5],salary:140000,source:'https://acb.com/es/liga/noticias/las-fechas-de-la-temporada-2025-26-143098'},
 {id:'bbl',name:'Basketball Bundesliga',country:'Allemagne',teams:bbl,games:34,minutes:40,level:63,budget:12e6,minOffer:54,playoff:8,playIn:10,series:[5,5,5],salary:80000,source:'https://www.easycredit-bbl.de/de/n/news/2025/juni/lizenzierung-easycredit-bbl-mit-18-clubs-in-die-jubilaeums-saison-2025-26'},
 {id:'lba',name:'Lega Basket Serie A',country:'Italie',teams:lba,games:30,minutes:40,level:66,budget:16e6,minOffer:57,playoff:8,series:[5,5,5],salary:100000,source:'https://www.legabasket.it/protagonisti/squadre'},
 {id:'nbl',name:'NBL',country:'Australie / Nouvelle-Zélande',teams:nbl,games:33,minutes:40,level:64,budget:8e6,minOffer:55,playoff:4,playIn:6,series:[3,5],salary:90000,source:'https://www.nbl.com.au/news/nbl26-report-card-breaking-new-ground'},
 {id:'euroleague',name:'EuroLeague',country:'Europe',teams:euro,games:38,minutes:40,level:76,budget:32e6,minOffer:71,playoff:8,playIn:10,series:[5,1,1],salary:300000,continental:true,source:'https://mediacentre.euroleague.net/en/app/2/communication/communication/preview/23369'},
 {id:'ncaa',name:'Université · NCAA',country:'États-Unis',teams:college,games:31,minutes:40,level:59,budget:0,minOffer:0,playoff:32,series:[1,1,1,1,1],salary:0,amateur:true,source:'https://www.ncaa.org/media-center-mens-and-womens-basketball-oversight-committees-propose-32-game-maximum-contest-limits/',note:'Sélection de 32 programmes, calendrier simulé de 31 matchs selon le plafond de référence 2025–26. Les calendriers NCAA réels varient. Tournoi réduit à ces programmes.'},
 {id:'highschool',name:'Lycée · Prep Circuit',country:'États-Unis',teams:highschool,games:24,minutes:32,level:46,budget:0,minOffer:0,playoff:8,series:[1,1,1],salary:0,amateur:true,note:'Lycées fictifs ; circuit de 24 matchs. Aucun nombre universel de rencontres ne s’applique à tous les lycées américains.'}
];
export const leagueDef=id=>LEAGUES.find(l=>l.id===id);
export const clubId=name=>'club-'+name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
export function clubCatalog(){let clubs=new Map();for(let l of LEAGUES)for(let [i,name] of l.teams.entries()){let id=clubId(name);if(!clubs.has(id))clubs.set(id,{id,name,league:l.id,competitions:[],conference:l.id==='nba'?(i<15?'Est':'Ouest'):null,division:l.id==='nba'?Math.floor(i/5):null});clubs.get(id).competitions.push(l.id)}return [...clubs.values()]}
function circle(ids){let a=[...ids];if(a.length%2)a.push(null);let rounds=[];for(let r=0;r<a.length-1;r++){let pairs=[];for(let j=0;j<a.length/2;j++)if(a[j]&&a.at(-1-j))pairs.push(r%2?[a.at(-1-j),a[j]]:[a[j],a.at(-1-j)]);rounds.push(pairs);a.splice(1,0,a.pop())}return rounds}
export function makeCalendar(def,season,teams){let ids=def.teams.map(clubId),pairs=[];
 if(def.id==='nba'){
  // Standard 82: 30 opposite-conference, 16 division, 36 other conference.
  for(let i=0;i<30;i++)for(let j=i+1;j<30;j++){
   let sameConf=Math.floor(i/15)===Math.floor(j/15),sameDiv=Math.floor(i/5)===Math.floor(j/5);let repeats=!sameConf?2:sameDiv?4:3;
   if(sameConf&&!sameDiv&&((j%5-i%5+5+(season-1))%5)<3)repeats++;
   let orientation=(Math.floor(j/5)-Math.floor(i/5)+3)%3===1;
   for(let k=0;k<repeats;k++){let home=k%2===0?i:j;if(k===2)home=orientation?i:j;if(k===3)home=orientation?j:i;pairs.push([ids[home],ids[home===i?j:i]])}
  }
  // Greedy edge scheduling: exact games, no double-booked team within a day.
  let localSeed=1979+season;for(let i=pairs.length-1;i>0;i--){localSeed=(Math.imul(localSeed,1664525)+1013904223)>>>0;let j=localSeed%(i+1);[pairs[i],pairs[j]]=[pairs[j],pairs[i]]}let slots=[];for(let [home,away] of pairs){let r=0;while(slots[r]?.used.has(home)||slots[r]?.used.has(away))r++;slots[r]??={used:new Set(),pairs:[]};slots[r].used.add(home);slots[r].used.add(away);slots[r].pairs.push([home,away])}pairs=slots.flatMap((slot,r)=>slot.pairs.map(p=>({p,r,total:slots.length})));
 }else{let rounds=circle(ids);for(let r=0;r<def.games;r++){let loop=Math.floor(r/rounds.length);for(let pair of rounds[r%rounds.length])pairs.push({p:loop%2?[pair[1],pair[0]]:pair,r,total:def.games})}}
 return pairs.map(({p,r,total},i)=>({id:`s${season}-${def.id}-${i}`,league:def.id,round:r,home:p[0],away:p[1],day:(season-1)*365+14+Math.floor(r*200/Math.max(1,total-1)),result:null,stage:'regular'}));
}
