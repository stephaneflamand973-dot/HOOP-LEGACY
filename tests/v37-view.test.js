import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,defaultBuild} from '../dist/engine.js';
import {hireCoach,coachQuote} from '../dist/environment.js';
import {environmentView} from '../dist/v37-view.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});s.money=10000;return s;};
test('environnement UI : devis lisible, pur et échappé',()=>{
 const s=make(),q=coachQuote(s,'local','Tir'),old=structuredClone(s);let html=environmentView(s,{quote:q});assert.deepEqual(s,old);assert.match(html,/Mon environnement/);assert.match(html,/300/);assert.match(html,/1\s?200/);assert.match(html,/4\s?000/);assert.match(html,/J1.*J30/);assert.match(html,/sans remboursement/i);assert.match(html,/désactivé par défaut/);assert.match(html,/coach-confirm/);
 q.reason='<script>x</script>';q.ok=false;html=environmentView(s,{quote:q});assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
});
test('environnement UI : zéro séance, programme incompatible, bilan séparé',()=>{
 const s=make();s.trainingPlan.domain='Rebond';hireCoach(s,'local','Tir');const old=structuredClone(s),html=environmentView(s);assert.match(html,/programme.*Rebond/i);assert.match(html,/spécialité.*Tir/i);assert.match(html,/aucun bonus/i);assert.match(html,/Coût par séance.*—/);assert.doesNotMatch(html,/Infinity|NaN/);assert.match(html,/XP supplémentaires/);assert.deepEqual(s,old);
});
test('environnement UI : mutations bloquées et consultation conservée',()=>{
 for(const flag of ['match','pending','retired','busy']){const s=make();hireCoach(s,'local','Tir');if(flag!=='busy')s[flag]=true;const html=environmentView(s,{busy:flag==='busy'});for(const [button] of html.matchAll(/<button[^>]*data-action="coach-(?:quote|confirm|renew)[^>]*>/g))assert.match(button,/disabled/);assert.match(html,/Mon environnement/);}
});
