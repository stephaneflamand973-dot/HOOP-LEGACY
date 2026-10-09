import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,competition} from '../dist/engine.js';
import {parseSave} from '../dist/storage.js';
import {collectiveDay} from '../dist/collective.js';
import {reconcileCollective} from '../dist/collective-state.js';
import {startMatch,stepMatch} from '../dist/match.js';
import {finishCollectiveMatch} from '../dist/collective-match.js';
import {collectiveView,collectiveMatchSummary} from '../dist/v38-view.js';
const make=()=>createGame({...defaultBuild(),path:'rookie'});
const completed=()=>{const s=make(),m=startMatch(s,competition(s).schedule[0]);stepMatch(s,m,20000);finishCollectiveMatch(s,m);s.lastMatch=m;return s;};
test('import : historique quotidien mal formé refusé avant affichage',()=>{
 const s=make();s.day=2;collectiveDay(s);assert.doesNotThrow(()=>parseSave(JSON.stringify(s)));
 for(const change of [r=>r.day='<b>date</b>',r=>r.day=3,r=>r.mode='unknown',r=>r.stageId='text',r=>r.fatigue=-1,r=>r.mastery=100,r=>r.partners=['missing'],r=>r.reason=null]){const bad=structuredClone(s);change(bad.collective.recent[0]);assert.throws(()=>parseSave(JSON.stringify(bad)),/Collectif/);}
 const bad=structuredClone(s);bad.collective.recent=[null];assert.throws(()=>parseSave(JSON.stringify(bad)),/Collectif/);
});
test('import : compteurs du dernier match contrôlés comme ceux du match actif',()=>{
 const s=completed();assert.doesNotThrow(()=>parseSave(JSON.stringify(s)));
 for(const change of [m=>m.collective.effects[m.home].passes='<b>count</b>',m=>m.collective.effects[m.home].shotActions=-1,m=>m.collective.effects[m.home].turnoverSum=-999,m=>m.collective.minutes[m.home]={'invalid':1},m=>m.collective.effects=null]){const bad=structuredClone(s);change(bad.lastMatch);assert.throws(()=>parseSave(JSON.stringify(bad)),/Collectif/);}
});
test('dernier match : snapshot reste valide après le départ d’un ancien coéquipier',()=>{
 const s=completed(),t=s.teams.find(t=>t.id===s.lastMatch.home),id=t.roster.find(id=>id!==s.hero);t.roster=t.roster.filter(p=>p!==id);reconcileCollective(s);assert.doesNotThrow(()=>parseSave(JSON.stringify(s)));
});
test('vues collectives : les valeurs externes restent du texte même hors import',()=>{
 const s=make();s.collective.recent=[{day:'<b>date</b>',mode:'none',stageId:null,reason:'Repos',fatigue:0,mastery:0,duo:0,partners:[]}];assert.doesNotMatch(collectiveView(s),/<b>date<\/b>/);
 const html=collectiveMatchSummary({collective:{effects:{home:{passes:'<b>count</b>',turnoverActions:'<b>count</b>',shotActions:'<b>count</b>',turnoverSum:0,shotSum:0}},duos:[]}});assert.doesNotMatch(html,/<b>count<\/b>/);
});
