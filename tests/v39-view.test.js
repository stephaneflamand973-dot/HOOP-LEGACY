import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,requestTrade} from '../dist/engine.js';
import {setMandate} from '../dist/representation.js';
import {negotiationQuote,submitCounter} from '../dist/negotiation.js';
import {representationView,contractNegotiationView,negotiationOffersView} from '../dist/representation-view.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});hero(s).contract.years=1;return s;};
test('vues agent : mandat facultatif, taux et frais actuels distincts',()=>{
 const s=make(),before=JSON.stringify(s),html=representationView(s);
 for(const word of ['Autogestion','Conseiller local','Agence nationale','Agence internationale','1 %','2 %','3 %','contrat actuel','mandat futur'])assert.ok(html.includes(word),word);
 assert.equal(JSON.stringify(s),before);assert.doesNotMatch(html,/undefined|NaN/);
 s.pending={type:'contract'};assert.match(representationView(s),/id="agent-mandate" disabled/);
});
test('vues contrats : brut, net, commission, durée, projection et tentatives',()=>{
 const s=make();setMandate(s,'national');requestTrade(s);const id=s.offers[0].id,html=contractNegotiationView(s,id,{});
 for(const word of ['Brut annuel','Net avant commission','Commission','Net après commission','Total théorique','2 tentative','projection','initiale'])assert.ok(html.includes(word),word);
 assert.match(negotiationOffersView(s,{}),/market-preference/);assert.doesNotMatch(html,/undefined|NaN/);
 const q=negotiationQuote(s,id,{raise:15,years:s.offers[0].years});const quoteHTML=contractNegotiationView(s,id,{offerId:id,quote:q});assert.match(quoteHTML,/counter-submit/);assert.match(quoteHTML,/Confirmer/);submitCounter(s,q);assert.match(contractNegotiationView(s,id,{}),/1 tentative/);
});
test('vues contrats : ancienne offre conservée et clairement exempte',()=>{
 const s=make();requestTrade(s);s.representation.session=null;const html=contractNegotiationView(s,s.offers[0].id,{});assert.match(html,/sans commission/);assert.match(html,/non négociable/);assert.doesNotMatch(html,/data-action="counter-open:/);
});
test('vues agent : balisage inerte échappé et valeurs non finies non affichées',()=>{
 const s=make();s.representation.history=[{day:1,kind:'signed',team:s.team,outcome:'<b>historique</b>',salary:Infinity,years:2,commission:NaN}];let html=representationView(s);assert.doesNotMatch(html,/<b>historique<\/b>|NaN|Infinity/);assert.match(html,/&lt;b&gt;historique/);
 requestTrade(s);s.teams.find(t=>t.id===s.offers[0].team).name='<b>Club</b>';html=contractNegotiationView(s,s.offers[0].id,{});assert.doesNotMatch(html,/<b>Club<\/b>/);assert.match(html,/&lt;b&gt;Club/);
});
