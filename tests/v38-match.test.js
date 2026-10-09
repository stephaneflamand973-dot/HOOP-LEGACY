import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,competition,team,finalizeMatch} from '../dist/engine.js';
import {initCollective,duoFor,pairKey} from '../dist/collective-state.js';
import {snapshotCollective,recordSharedPossession,collectiveEffect,finishCollectiveMatch} from '../dist/collective-match.js';
import {startMatch,stepMatch} from '../dist/match.js';
import {startMatch as oldStart,stepMatch as oldStep} from '../dist/match-v35.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});initCollective(s);return s;};
test('duos match : vraie passe seulement, symétrie et instantané figé',()=>{
 const s=make(),g=competition(s).schedule[0],m=startMatch(s,g),rng=structuredClone(s.rng);
 for(const tid of [m.home,m.away]){const [a,b]=team(s,tid).roster;assert.deepEqual(collectiveEffect(m,tid,a,b),{turnover:0,shot:0});duoFor(s,tid,a,b,{create:true}).score=100;assert.deepEqual(collectiveEffect(m,tid,a,b),{turnover:0,shot:0});}
 m.collective=snapshotCollective(s,m);
 for(const tid of [m.home,m.away]){const [a,b]=team(s,tid).roster;assert.deepEqual(collectiveEffect(m,tid,a,b),{turnover:-.005,shot:.005});assert.deepEqual(collectiveEffect(m,tid,a,a),{turnover:0,shot:0});assert.deepEqual(collectiveEffect(m,tid,a,'absent'),{turnover:0,shot:0});}assert.deepEqual(s.rng,rng);
});
test('duos match : seules les paires du cinq courant accumulent les minutes',()=>{
 const s=make(),g=competition(s).schedule[0],m=startMatch(s,g);m.duration=40;m.regulation=100;
 const lineups=Object.fromEntries([m.home,m.away].map(tid=>[tid,team(s,tid).roster.slice(0,5)]));recordSharedPossession(m,lineups);
 for(const tid of [m.home,m.away]){assert.equal(Object.keys(m.collective.minutes[tid]).length,10);for(const v of Object.values(m.collective.minutes[tid]))assert.equal(v,.4);const [a,b]=team(s,tid).roster.slice(5,7);assert.equal(m.collective.minutes[tid][pairKey(a,b)],undefined);}
 m.ot=1;recordSharedPossession(m,lineups);for(const v of Object.values(m.collective.minutes[m.home]))assert.equal(v,.8);
});
test('duos match : clôture une fois et croissance amortie',()=>{
 const s=make(),g=competition(s).schedule[0],[a,b]=team(s,g.home).roster;duoFor(s,g.home,a,b,{create:true}).score=50;let m=startMatch(s,g);m.collective.minutes[g.home][pairKey(a,b)]=20;finishCollectiveMatch(s,m);assert.equal(duoFor(s,g.home,a,b).score,50);
 m.done=true;finishCollectiveMatch(s,m);assert.equal(duoFor(s,g.home,a,b).score,50.4);assert.equal(duoFor(s,g.home,a,b).sources.match,.4);m=JSON.parse(JSON.stringify(m));const before=structuredClone(s);finishCollectiveMatch(s,m);assert.deepEqual(s,before);
});
test('match : zéro automatisme préserve exactement règles 3.5 et RNG',()=>{
 for(const seed of [2026,973,7]){const s=createGame({...defaultBuild(),path:'rookie',seed}),a=structuredClone(s),g=competition(s).schedule[0],m=startMatch(s,g),legacy=oldStart(a,g);stepMatch(s,m,20000);oldStep(a,legacy,20000);const stripped=structuredClone(m);delete stripped.collective;stripped.rulesVersion='3.5.0';assert.deepEqual(stripped,legacy);assert.deepEqual(s.rng,a.rng);}
});
test('match : reprise historique et découpage moderne conservent résultats et compteurs',()=>{
 const base=make(),g=competition(base).schedule[0];
 const a=structuredClone(base),b=structuredClone(base),old=oldStart(a,g);oldStep(a,old,30);const saved=JSON.parse(JSON.stringify(old));b.rng=structuredClone(a.rng);b.players=structuredClone(a.players);oldStep(a,old,20000);stepMatch(b,saved,20000);assert.deepEqual(saved,old);assert.deepEqual(b.rng,a.rng);assert.equal(saved.collective,undefined);
 const results=[];for(const chunk of [1,40,20000]){let s=structuredClone(base),m=startMatch(s,g);while(!m.done){stepMatch(s,m,chunk);if(m.n===40){s=JSON.parse(JSON.stringify(s));m=JSON.parse(JSON.stringify(m));}}finalizeMatch(s,competition(s).schedule[0],m);results.push({m,rng:s.rng,collective:s.collective});}assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
});
