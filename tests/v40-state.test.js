import test from 'node:test';
import assert from 'node:assert/strict';
import {initV40,validateV40} from '../dist/v40-state.js';
test('V4 initialization preserves existing career and simulation destination',()=>{
 const s={day:45,season:1,simulation:{mode:'40',cursor:{targetSeason:2}},match:{rulesVersion:'3.8.0',possession:61},rng:{career:973}};
 const before=structuredClone(s);initV40(s);
 assert.deepEqual({...s,v40:undefined},{...before,v40:undefined});
 assert.equal(s.v40.moments.mode,'highlights');assert.equal(s.v40.sinceDay,45);validateV40(s);
 const snapshot=structuredClone(s);initV40(s);assert.deepEqual(s,snapshot);
});
test('V4 states do not share mutable collections',()=>{
 const a={day:0,season:1},b={day:0,season:1};initV40(a);initV40(b);
 a.v40.moments.seen.push('one');assert.deepEqual(b.v40.moments.seen,[]);
});
test('V4 validator rejects malformed extension without changing input',()=>{
 const base={day:45,season:1};initV40(base);
 for(const mutate of [
  s=>s.v40.version=2,s=>s.v40.sinceDay=46,s=>s.v40.sinceSeason=2,
  s=>s.v40.roles=[],s=>s.v40.services.nextId=0,s=>s.v40.services.active=[],
  s=>s.v40.services.processedDay=46,s=>s.v40.services.totals.cost=Infinity,
  s=>s.v40.moments.mode='unknown',s=>s.v40.moments.seen=['a','a'],
  s=>s.v40.moments.history=Array(81).fill({}),s=>s.v40.training.history=Array(25).fill({}),
  s=>s.v40.training.lastDay=46,
 ]){
  const s=structuredClone(base);mutate(s);const before=structuredClone(s);
  assert.throws(()=>validateV40(s),/V4/);assert.deepEqual(s,before);
 }
});
