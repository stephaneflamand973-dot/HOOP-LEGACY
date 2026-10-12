import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,requestTrade,sign} from '../dist/engine.js';
import {setMandate,commissionForDay} from '../dist/representation.js';
import {financeDay,cents} from '../dist/finance.js';
import {retireCareer} from '../dist/commands.js';
import {validateRepresentation} from '../dist/representation-state.js';
const make=(mandate='international')=>{const s=createGame({...defaultBuild(),path:'rookie'});hero(s).contract.years=1;setMandate(s,mandate);requestTrade(s);assert.equal(sign(s,0),true);hero(s).contract.salary=365000/.76;return s;};
test('commissions : prélèvement exact sur net reçu, répétition quotidienne sans double débit',()=>{
 const s=make();assert.equal(commissionForDay(s,1000),30);assert.equal(commissionForDay(s,.10),0);s.day=1;financeDay(s);
 assert.equal(s.money,962);assert.equal(s.representation.contract.commission,30);assert.equal(s.representation.totals.commission,30);assert.equal(s.representation.history.at(-1).commission,30);
 assert.equal(s.life.ledger.find(x=>x.label==='Commission d’agent').amount,-30);assert.equal(cents(s.life.finance.start.cash+s.life.finance.totals.cash),s.money);
 const before=JSON.stringify(s);financeDay(s);assert.equal(JSON.stringify(s),before);validateRepresentation(s);
});
test('commissions : changement de mandat futur ne change pas les frais signés',()=>{
 const s=make();setMandate(s,'self');s.day=1;financeDay(s);assert.equal(s.representation.contract.commission,30);
 s.day=21;hero(s).contract.years=1;assert.equal(requestTrade(s),true);assert.equal(sign(s,0),true);assert.equal(s.representation.contract.rate,0);assert.equal(s.representation.contract.commission,0);assert.equal(s.representation.totals.commission,30);
 s.day=22;financeDay(s);assert.equal(s.representation.totals.commission,30);validateRepresentation(s);
});
test('commissions : sponsors seuls, contrat gratuit et parcours amateur exclus',()=>{
 for(const kind of ['sponsors','amateur','self','initial']){
  const s=kind==='initial'?createGame({...defaultBuild(),path:'rookie'}):make(kind==='self'?'self':'international');
  if(kind==='sponsors'){hero(s).contract.salary=0;s.life.sponsors=[{annual:365000,ends:40}];}
  if(kind==='amateur')s.career.stage='college';s.day=1;financeDay(s);
  assert.equal(s.representation?.totals.commission||0,0);assert.equal(s.life.ledger.some(x=>x.label==='Commission d’agent'),false);assert.ok(s.money>=0);
 }
});
test('commissions : placements après frais et dépenses, sans toucher la réserve',()=>{
 const s=make();Object.assign(s.life.finance,{automatic:true,percent:20,reserve:0,frequency:30});s.day=30;financeDay(s);
 assert.equal(s.money,769.6);assert.equal(s.life.investments,192.4);assert.equal(cents(s.life.finance.start.cash+s.life.finance.totals.cash),s.money);
 const poor=make();hero(poor).contract.salary=365/.76;poor.life.lifestyle='premium';poor.life.children=[{name:'Enfant'}];poor.life.finance.reserve=100000;poor.day=1;financeDay(poor);
 assert.equal(poor.money,.70);assert.equal(poor.representation.totals.commission,.03);assert.equal(poor.life.investments,0);
});
test('commissions : expiration ne double pas la journée, retraite clôt sans frais',()=>{
 const s=make();s.day=1;financeDay(s);hero(s).contract.years=0;s.pending={type:'contract'};const before=s.money;financeDay(s);assert.equal(s.money,before);
 s.pending=null;s.day=2;financeDay(s);assert.equal(s.representation.totals.commission,60);assert.equal(retireCareer(s),true);assert.equal(s.representation.session,null);assert.equal(s.representation.contract,null);assert.equal(s.representation.mandate,'self');assert.equal(commissionForDay(s,1000),0);assert.equal(s.representation.totals.commission,60);
});
