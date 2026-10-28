import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,defaultBuild,migrateLegacy,validate} from '../dist/engine.js';
test('new careers initialize the V4 extension',()=>{
 const s=createGame(defaultBuild());assert.equal(s.v40?.version,1);assert.equal(s.v40.sinceDay,s.day);validate(s);
});
test('V3.9 migration copies input, preserving simulation, match, money and random streams',()=>{
 const old=createGame(defaultBuild());delete old.v40;old.engine='3.9.0';
 old.simulation={mode:'40',cursor:{mode:'40',fromDay:old.day,fromSeason:old.season,targetSeason:old.season+1}};
 const before=structuredClone(old),s=migrateLegacy(old);
 assert.notEqual(s,old);assert.deepEqual(old,before);assert.equal(s.v40.version,1);
 const {v40,...rest}=s;assert.deepEqual(rest,{...before,engine:s.engine});
 assert.deepEqual(migrateLegacy(s),s);
});
test('invalid present V4 data must not be reset on import',()=>{
 const s=createGame(defaultBuild());s.v40={version:999};
 assert.throws(()=>migrateLegacy(s),/V4/);assert.equal(s.v40.version,999);
});
