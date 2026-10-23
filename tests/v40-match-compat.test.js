import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import zlib from 'node:zlib';
import {stepMatch} from '../dist/match.js';
// Oracle captured from published c25078c, before the V4 match implementation.
test('V4 resumes historical matches with exact box scores and RNG',()=>{
 const cases=JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL('./fixtures/v40-historical-matches.json.gz',import.meta.url))));
 for(const {partial:{s,m},expected} of cases){stepMatch(s,m,10000);assert.deepEqual(JSON.parse(JSON.stringify(m)),expected.m);assert.deepEqual(s.rng,expected.rng);}
});
