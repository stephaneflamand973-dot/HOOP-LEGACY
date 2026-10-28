import fs from 'node:fs';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,validate} from '../dist/engine.js';
import {trainingDay,costFor,ageAttributes} from '../dist/progression.js';
import {buyService,quoteService,serviceDay} from '../dist/services.js';
import {financeAction} from '../dist/finance.js';
const rows=[];
for(const seed of [2026,973])for(const pos of ['MJ','AR','AI','AF','P'])for(const age of [21,36])for(const specialist of [false,true])for(const services of [false,true]){
 const s=createGame({...defaultBuild(),path:'rookie',pos,seed}),p=hero(s);p.age=age;s.auto=false;s.money=500000;s.life.finance.start.cash=500000;s.trainingPlan.domain='Tir';s.activity='individuel';s.offseasonStarted=true;
 for(const k in p.attrs)p.attrs[k]=specialist&&['three','mid','free'].includes(k)?90:70;
 if(services){financeAction(s,'property');for(const [kind,domain] of [['recovery'],['proximity'],['installation','Tir']])assert.ok(buyService(s,quoteService(s,kind,{domain})).ok);}
 for(let day=1;day<=60;day++){s.day=day;p.fatigue=20;serviceDay(s);trainingDay(s,p);}
 assert.ok(Object.values(p.attrs).every(n=>n>=25&&n<=99));assert.equal(Math.round((s.money-s.life.finance.start.cash)*100),Math.round(s.life.finance.totals.cash*100));validate(s);
 const cost70=costFor({...p,attrs:{...p.attrs,three:70}},'three'),cost95=costFor({...p,attrs:{...p.attrs,three:95}},'three');assert.ok(cost95>cost70);
 rows.push({seed,pos,age,specialist,services,xp:s.development.xp.Tir,money:s.money,paid:s.v40.services.totals.paid||0,recovery:s.v40.services.totals.recovery||0});
}
for(let i=0;i<rows.length;i+=2)assert.ok(rows[i+1].xp>=rows[i].xp);
fs.writeFileSync('tests/v40-balance-report.json',JSON.stringify({scenarios:rows.length,rows},null,2));console.log(JSON.stringify({scenarios:rows.length,valid:true}));
