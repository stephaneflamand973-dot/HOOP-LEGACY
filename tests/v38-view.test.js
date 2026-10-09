import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,team} from '../dist/engine.js';
import {duoFor} from '../dist/collective-state.js';
import {stageQuote,bookStage,closeStage} from '../dist/collective.js';
import {collectiveView,stagesView,collectiveMatchSummary} from '../dist/v38-view.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});s.money=10000;s.system=50;for(const c of s.competitions)c.schedule=[];return s;};
test('vue collectif : maîtrise distincte, sources des duos, programmes gratuits et rendu pur',()=>{
 const s=make(),id=team(s).roster.find(id=>id!==s.hero);s.players.find(p=>p.id===id).name='<img onerror="boom">';const d=duoFor(s,s.team,s.hero,id,{create:true});d.score=50;d.minutes=12;d.sources.match=40;d.sources.routine=10;
 const before=structuredClone(s),html=collectiveView(s);assert.deepEqual(s,before);
 for(const label of ['Maîtrise du système','Automatismes de duo','Vidéo tactique','Travail tactique terrain','Travail avec partenaires','minutes partagées simulées','0,5 point de pourcentage','Matchs','Routine','Stages'])assert.ok(html.includes(label),label);
 assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/J2/);
 assert.equal((html.match(/id="collective-partner-/g)||[]).length,2);
});
test('vue stages : devis, zéro séance et période clôturée restent explicites et purs',()=>{
 const s=make(),q=stageQuote(s,'video'),before=structuredClone(s),html=stagesView(s,{quote:q});assert.deepEqual(s,before);
 for(const label of ['Atelier vidéo','Stage tactique','Stage avec partenaires','600','2 000','3 500','J1','J7','réserve','Sans remboursement','estimation','stage-confirm'])assert.ok(html.includes(label),label);
 bookStage(s,q);let active=stagesView(s);assert.match(active,/Coût par séance : <b>—/);assert.match(collectiveView(s),/après le stage/);
 s.day=1;closeStage(s,'Transfert <script>');active=stagesView(s);assert.ok(active.includes('Transfert &lt;script&gt;'));assert.match(active,/600/);assert.doesNotMatch(active,/NaN|Infinity|undefined/);
});
test('vues : actions indisponibles bloquées et motifs d’achat visibles',()=>{
 for(const mode of ['busy','pending','match','retired']){const s=make();if(mode!=='busy')s[mode]=true;const options={busy:mode==='busy'};for(const html of [collectiveView(s,options),stagesView(s,options)])for(const button of html.matchAll(/<button[^>]+data-action="(?:collective-routine|stage-quote)[^"]*"[^>]*>/g))assert.match(button[0],/disabled/);}
 const s=make();hero(s).injury=1;assert.match(stagesView(s),/blessure/);hero(s).injury=0;s.system=100;assert.match(stagesView(s),/plafond/);s.system=50;
 for(let day=2;day<=14;day+=2)s.competitions[0].schedule.push({day,home:s.team,away:'other'});assert.match(stagesView(s),/Aucun créneau/);
});
test('bilan match : deltas moyens de probabilité sans attribution de paniers',()=>{
 assert.match(collectiveMatchSummary({}),/anciennes règles/);
 const html=collectiveMatchSummary({collective:{version:1,duos:[{ids:['a','b'],minutes:10,gain:.4}],effects:{a:{passes:20,turnoverActions:20,shotActions:10,turnoverSum:-.1,shotSum:.025}}}});
 assert.match(html,/-0,5/);assert.match(html,/0,25/);assert.match(html,/20/);assert.match(html,/10/);assert.match(html,/aucun panier/i);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
});
