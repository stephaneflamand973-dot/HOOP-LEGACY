import {hero,log,clamp,rng,team} from './engine.js?v=3.2.0';
export function initLife(s){s.life??={fame:5,morale:70,partner:null,children:[],family:70,delegated:false,agent:'Équilibré',lifestyle:'simple',investments:0,property:null,sponsors:[],nextEvent:s.day+35,ledger:[],history:[]};s.relationships??={coach:55,team:55,agent:50,mentor:50,family:60};}
function receipt(s,label,amount){if(!amount)return;s.life.ledger.unshift({day:s.day,label,amount:Math.round(amount)});s.life.ledger=s.life.ledger.slice(0,60);}
export function lifeDay(s){initLife(s);let p=hero(s),l=s.life;
 let gross=s.career.stage==='pro'?p.contract.salary/365:0,net=gross*.76;
 let sponsor=l.sponsors.reduce((n,c)=>n+(c.ends>s.day?c.annual/365:0),0);
 let expense=Math.min((l.lifestyle==='premium'?180:l.lifestyle==='comfortable'?45:8)+l.children.length*8,Math.max(0,(net+sponsor)*.28+s.money*.00005));
 s.money=Math.max(0,s.money+net+sponsor-expense);s.money=Math.round(s.money*100)/100;
 l.sponsors=l.sponsors.filter(c=>c.ends>s.day);
 if(s.day%30===0){receipt(s,'Salaire net estimé et sponsors, mois',30*(net+sponsor));receipt(s,'Vie quotidienne, mois',-30*expense);l.family=clamp(l.family+(s.activity==='famille'?3:-.3));if(l.partner)l.partner.bond=clamp(l.partner.bond+(s.activity==='famille'?2:-.2));l.morale=clamp(l.morale*.9+(s.activity==='famille'?85:70)*.1);s.relationships.family=l.family;}
 if(s.day%365===0&&l.investments>0){let change=l.investments*(.025+(rng(s,'life')-.5)*.1);l.investments=Math.max(0,Math.round(l.investments+change));receipt(s,'Variation annuelle des placements',change);if(l.property)l.property.value=Math.round(l.property.value*1.015);}
 if(l.expecting&&s.day>=l.expecting&&!s.pending){l.children.push({id:'child-'+(l.children.length+1),born:s.day});delete l.expecting;l.morale=clamp(l.morale+8);l.history.push({day:s.day,title:'Naissance',text:'La famille accueille un enfant.'});s.pending={type:'life',kind:'birth',major:true,title:'La famille s’agrandit',text:'Votre enfant est né. Un nouveau chapitre commence, avec du temps à partager entre vos proches et votre carrière.',choices:[['family','Consacrer du temps à ma famille','Vos liens se renforcent.'],['rest','Organiser cette nouvelle vie','Retrouver votre équilibre.']]};log(s,'Naissance','La famille accueille un enfant.');}
 if(s.day>=l.nextEvent&&!s.pending){let event=lifeEvent(s);l.nextEvent=s.day+42;if(event){s.pending=event;if(l.delegated&&!event.major)resolveLife(s,event.default||'rest');}}
}
function lifeEvent(s){let l=s.life,p=hero(s);l.sequence=(l.sequence||0)+1;let n=l.sequence%5;
 if(n===1&&!l.partner&&p.age>=18)return {type:'life',kind:'relationship',title:'Une rencontre qui compte',text:'Une personne de votre entourage souhaite vous revoir. Votre calendrier laisse une place à une relation.',choices:[['date','Prendre du temps ensemble','Une relation peut commencer.'],['rest','Rester concentré sur le basket','Votre temps reste disponible.']],default:'date'};
 if(n===2&&l.partner&&p.age>=21&&l.children.length<3&&!l.expecting)return {type:'life',kind:'family',major:true,title:'Un projet de famille',text:'Votre couple envisage un enfant. Ce choix durable influencera votre temps, vos dépenses et votre attachement à une ville.',choices:[['child','Fonder ou agrandir la famille','Un nouveau chapitre, avec un peu moins de temps libre.'],['rest','En reparler plus tard','Aucune pénalité de carrière.']]};
 if(n===3&&s.career.stage==='pro'&&l.fame>=18&&!l.sponsors.length)return {type:'life',kind:'sponsor',title:'Votre premier partenariat',text:'Deux marques proposent des engagements différents. Les montants sont des valeurs de simulation.',choices:[['local','Marque locale · liberté','Moins d’argent, peu de rendez-vous.'],['national','Marque nationale · exposition','Plus d’argent et quelques obligations.'],['rest','Refuser pour le moment','Conserver tout votre temps.']],default:'local'};
 if(n===4&&l.fame>=25)return {type:'life',kind:'media',title:s.grade>=70?'Les médias suivent votre série':'Les médias questionnent votre rôle',text:`Votre dernière performance et votre place dans la rotation attirent des questions à ${team(s).name}.`,choices:[['team','Mettre le collectif en avant','Renforce les relations avec l’équipe.'],['ambition','Affirmer vos ambitions','Développe votre notoriété.'],['rest','Laisser l’agent répondre','Préserve votre tranquillité.']],default:'team'};
 return {type:'life',kind:'balance',title:'Une semaine pour vous',text:'Votre entourage propose un moment ensemble. Comment utiliser ce temps disponible ?',choices:[['family','Retrouver vos proches','Relations et moral en hausse.'],['work','Travailler avec votre mentor','Une séance supplémentaire, un peu de fatigue.'],['rest','Souffler','Récupération et sérénité.']],default:'family'};
}
export function resolveLife(s,choice){let e=s.pending;if(e?.type!=='life'||!e.choices.some(c=>c[0]===choice))return false;let l=s.life,p=hero(s),text=e.choices.find(c=>c[0]===choice)[1];
 if(choice==='date'){l.partner={name:'Votre partenaire',bond:65,since:s.day};l.morale=clamp(l.morale+5);}
 if(choice==='child'){l.expecting=s.day+270;l.morale=clamp(l.morale+5);l.history.push({day:s.day,title:'Projet de famille',text:'Un enfant est attendu dans neuf mois.'});}
 if(choice==='local'||choice==='national'){let annual=Math.round((choice==='local'?4000:16000)*(1+l.fame/12));l.sponsors.push({name:choice==='local'?'Équipementier local':'Équipementier national',annual,ends:s.day+730,obligation:choice==='national'?2:1});l.fame=clamp(l.fame+(choice==='national'?4:1));}
 if(choice==='team')s.relationships.team=clamp(s.relationships.team+4);
 if(choice==='ambition')l.fame=clamp(l.fame+4);
 if(choice==='family'){l.family=clamp(l.family+6);if(l.partner)l.partner.bond=clamp(l.partner.bond+5);l.morale=clamp(l.morale+4);}
 if(choice==='work'){s.relationships.mentor=clamp(s.relationships.mentor+4);p.fatigue=clamp(p.fatigue+3);s.life.bonusTraining=true;}
 if(choice==='rest'){p.fatigue=clamp(p.fatigue-6);l.morale=clamp(l.morale+2);}
 log(s,e.title,text);s.pending=null;return true;
}
export function lifeAction(s,action){initLife(s);if(s.pending||s.match||s.retired)return false;let l=s.life;
 if(action==='invest'){let amount=Math.min(100000,Math.floor(s.money*.2));if(amount<500)return false;s.money-=amount;l.investments+=amount;receipt(s,'Placement à long terme',-amount);}
 else if(action==='withdraw'){if(!l.investments)return false;let amount=Math.min(100000,l.investments);l.investments-=amount;s.money+=amount;receipt(s,'Retrait de placements',amount);}
 else if(action==='property'){if(l.property||s.money<250000)return false;s.money-=250000;l.property={city:team(s).name,value:250000,bought:s.day};receipt(s,'Achat de résidence',-250000);l.morale=clamp(l.morale+5);log(s,'Premier logement','Une résidence marque votre nouvelle stabilité.');}
 else return false;return true;
}
export const netWorth=s=>Math.round(s.money+(s.life?.investments||0)+(s.life?.property?.value||0));
