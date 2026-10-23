import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,competition,team,hero,validate} from '../dist/engine.js';import {startMatch,stepMatch} from '../dist/match.js';
const fixture=()=>{const s=createGame({...defaultBuild(),path:'rookie'}),g=competition(s).schedule.find(g=>g.home===s.team||g.away===s.team);return {s,g};};
test('V4 match snapshots team rotations, respects injuries and records legal minutes',()=>{
 const {s,g}=fixture();hero(s).injury=5;const m=startMatch(s,g);assert.equal(m.rulesVersion,'4.0.0');
 for(const id of [g.home,g.away]){const rows=m.rotation[id];assert.ok(Math.abs(rows.reduce((n,r)=>n+r.targetMinutes,0)-240)<1e-8);assert.ok(rows.every(r=>r.targetMinutes<=48));}
 stepMatch(s,m,1);for(const ids of Object.values(m.lineups))assert.equal(new Set(ids).size,5);stepMatch(s,m,10000);assert.equal(m.box[s.hero].min,0);
 for(const id of [g.home,g.away]){const minutes=team(s,id).roster.reduce((n,p)=>n+m.box[p].min,0);assert.ok(Math.abs(minutes-5*(48+5*m.ot))<1e-6);}
});
test('V4 imports reject invalid rotation snapshots before resuming a match',()=>{
 const {s,g}=fixture();s.match=startMatch(s,g);assert.doesNotThrow(()=>validate(s));
 for(const mutate of [m=>m.rotation[g.home][0].targetMinutes=NaN,m=>m.rotation[g.home][0].playerId='missing',m=>m.rotation[g.home].push(m.rotation[g.home][0]),m=>delete m.rotation]){const bad=structuredClone(s);mutate(bad.match);assert.throws(()=>validate(bad),/Rotation/);}
});
test('V4 immediately replaces fouled-out players and permits emergency reduced rosters',()=>{
 const {s,g}=fixture(),m=startMatch(s,g);stepMatch(s,m,1);const old=m.lineups[g.home][0];m.box[old].pf=6;stepMatch(s,m,1);assert.ok(!m.lineups[g.home].includes(old));
 const other=fixture();for(const id of team(other.s,other.g.home).roster.slice(4))other.s.players.find(p=>p.id===id).injury=2;const short=startMatch(other.s,other.g);stepMatch(other.s,short,2);assert.equal(short.lineups[other.g.home].length,4);assert.equal(new Set(short.lineups[other.g.home]).size,4);
});
test('V4 overtime and continental fixtures conserve each game’s own minutes',()=>{
 const s=createGame({...defaultBuild(),path:'rookie',seed:73}),g=competition(s).schedule.find(g=>g.home===s.team||g.away===s.team),m=startMatch(s,g);stepMatch(s,m,10000);assert.equal(m.ot,1);
 assert.ok(Math.abs(team(s,g.home).roster.reduce((n,id)=>n+m.box[id].min,0)-265)<1e-6);
 const euro=s.competitions.find(c=>c.id==='euroleague'),em=startMatch(s,euro.schedule[0]);assert.equal(em.duration,40);stepMatch(s,em,10000);assert.ok(Math.abs(team(s,em.home).roster.reduce((n,id)=>n+em.box[id].min,0)-5*(40+5*em.ot))<1e-6);
});
