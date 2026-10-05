import {hero,team,rng,clamp} from './engine.js?v=3.7.0';
import {canChange} from './commands.js?v=3.7.0';
export const cents=n=>Math.round(n*100)/100;
export function initFinance(s){const l=s.life;l.finance??={percent:20,reserve:5000,frequency:30,automatic:false,lastDay:s.day};l.finance.start??={cash:s.money,investments:l.investments,property:l.property?.value||0};l.finance.totals??={cash:0,investments:0,property:0};}
export function receipt(s,label,cash=0,investments=0,property=0){initFinance(s);const f=s.life.finance;cash=cents(cash);investments=cents(investments);property=cents(property);f.totals.cash=cents(f.totals.cash+cash);f.totals.investments=cents(f.totals.investments+investments);f.totals.property=cents(f.totals.property+property);s.life.ledger.unshift({day:s.day,label,amount:cash,cash,investments,property});s.life.ledger=s.life.ledger.slice(0,180);}
export function investmentQuote(s){const f=s.life.finance;return cents(Math.max(0,s.money-f.reserve)*f.percent/100);}
export function financeDay(s){initFinance(s);const l=s.life,f=l.finance,p=hero(s);if(f.processedDay===s.day)return;f.processedDay=s.day;
 const net=cents(s.career.stage==='pro'?p.contract.salary/365*.76:0),sponsor=cents(l.sponsors.reduce((n,c)=>n+(c.ends>s.day?c.annual/365:0),0));
 const expense=cents(Math.min((l.lifestyle==='premium'?180:l.lifestyle==='comfortable'?45:8)+l.children.length*8,Math.max(0,(net+sponsor)*.28+s.money*.00005),s.money+net+sponsor));
 s.money=cents(s.money+net+sponsor-expense);receipt(s,'Salaire net et sponsors',net+sponsor);receipt(s,'Vie quotidienne',-expense);l.sponsors=l.sponsors.filter(c=>c.ends>s.day);
 if(s.day%365===0){if(l.investments>0){const change=cents(l.investments*(.025+(rng(s,'life')-.5)*.1));l.investments=cents(l.investments+change);receipt(s,'Variation des placements · sans mouvement de liquidités',0,change);}if(l.property){const change=cents(l.property.value*.015);l.property.value=cents(l.property.value+change);receipt(s,'Évolution de la résidence · sans mouvement de liquidités',0,0,change);}}
 if(f.automatic&&s.day-f.lastDay>=f.frequency){f.lastDay=s.day;const amount=investmentQuote(s);if(amount>=.01){s.money=cents(s.money-amount);l.investments=cents(l.investments+amount);receipt(s,`Placement automatique · ${f.percent} % au-delà de ${f.reserve} €`, -amount,amount);l.delegationLog.unshift({day:s.day,domain:'finances',title:'Placement automatique',choice:`${amount.toLocaleString('fr-FR')} € placés`,reason:`${f.percent} % du disponible au-delà de la réserve de ${f.reserve} €`});l.delegationLog=l.delegationLog.slice(0,100);}}
}
export function financeAction(s,action){if(!canChange(s))return false;initFinance(s);const l=s.life;
 if(action==='invest'){const amount=investmentQuote(s);if(amount<.01)return false;s.money=cents(s.money-amount);l.investments=cents(l.investments+amount);receipt(s,'Placement volontaire',-amount,amount);}
 else if(action==='withdraw'){const amount=cents(Math.min(100000,l.investments));if(amount<=0)return false;l.investments=cents(l.investments-amount);s.money=cents(s.money+amount);receipt(s,'Retrait de placements',amount,-amount);}
 else if(action==='property'){if(l.property||s.money<250000)return false;s.money=cents(s.money-250000);l.property={city:team(s).name,team:s.team,value:250000,bought:s.day};receipt(s,'Achat de résidence',-250000,0,250000);l.morale=clamp(l.morale+5);}
 else if(action==='sell'){if(!l.property)return false;const value=l.property.value,amount=cents(value*.95);s.money=cents(s.money+amount);l.property=null;receipt(s,'Vente de résidence · frais de 5 %',amount,0,-value);}
 else if(action==='move'){if(!l.property||l.property.city===team(s).name||s.money<5000)return false;s.money=cents(s.money-5000);l.property.city=team(s).name;l.property.team=s.team;receipt(s,'Déménagement · frais fixes de simulation',-5000);l.history.push({day:s.day,title:'Déménagement',text:`Résidence transférée à ${team(s).name}. Valeur conservée, frais de 5 000 €.`});}
 else return false;return true;
}
export function setFinance(s,key,value){if(!canChange(s))return false;initFinance(s);const f=s.life.finance;if(key==='automatic')f[key]=!!value;else if(key==='percent'&&[0,10,20,30,50].includes(+value))f[key]=+value;else if(key==='reserve'&&[0,5000,25000,100000].includes(+value))f[key]=+value;else if(key==='frequency'&&[30,90].includes(+value))f[key]=+value;else return false;return true;}
