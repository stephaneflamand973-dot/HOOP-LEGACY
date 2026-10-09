import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import * as old from '../.qa-previous37/dist/engine.js';import * as oldMatch from '../.qa-previous37/dist/match.js';
import * as current from '../dist/engine.js';import * as currentMatch from '../dist/match.js';import {VERSION} from '../dist/config.js';
const reports=[];for(const seed of [2026,973,38,1,999])for(const path of ['young','rookie']){
 const a=old.createGame({...old.defaultBuild(),seed,path}),b=current.createGame({...current.defaultBuild(),seed,path}),g=old.competition(a).schedule[0];const am=oldMatch.startMatch(a,g),bm=currentMatch.startMatch(b,g);oldMatch.stepMatch(a,am,20000);currentMatch.stepMatch(b,bm,20000);delete bm.collective;bm.rulesVersion=am.rulesVersion;
 assert.deepEqual(bm,am);assert.deepEqual(b.rng,a.rng);reports.push({seed,path,identical:true});
}
const fingerprint=crypto.createHash('sha256').update(['match','collective-match','collective-state','config'].map(n=>fs.readFileSync('dist/'+n+'.js','utf8')).join('')).digest('hex');
fs.writeFileSync('tests/v38-neutrality.json',JSON.stringify({engine:VERSION,fingerprint,reference:'6cea8a311ddd68d26cc9a94a13675355f59dc159',reports},null,2));console.log('10 zero-chemistry matches identical to V3.7');
