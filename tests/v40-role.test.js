import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,team,validate} from '../dist/engine.js';
import * as role from '../dist/role.js';
import {refreshWorld} from '../dist/world.js';
const make=()=>{const s=createGame({...defaultBuild(),path:'rookie'});s.trust=50;s.system=50;for(const p of s.players)for(const k in p.attrs)p.attrs[k]=70;return s;};
test('role projections are pure and use the same neutral inputs for both teams',()=>{
 const s=make(),p=hero(s),ai=team(s).roster.map(id=>s.players.find(x=>x.id===id)).find(x=>x.id!==s.hero&&x.pos===p.pos);assert.ok(ai);
 const before=structuredClone(s);assert.equal(role.projectRole(s,s.hero,s.team).minutes,19);assert.equal(role.projectRole(s,ai.id,s.team).minutes,19);assert.deepEqual(s,before);
 p.injury=10;assert.equal(role.projectRole(s,s.hero,s.team).minutes,0);
});
test('role form requires three appearances and retains five; duplicate matches have no effect',()=>{
 const s=make(),p=hero(s);const box={id:p.id,min:20,pts:22.32,ast:0,reb:0,stl:0,blk:0,tov:0,fga:0,fgm:0};
 for(let i=0;i<7;i++){const g={id:'role-'+i,home:s.team,away:s.teams.find(t=>t.id!==s.team).id};role.recordRoleMatch(s,g,{done:true,box:{[p.id]:box}});if(i===1)assert.equal(role.projectRole(s,p.id,s.team).contributions.form,0);}
 assert.equal(s.v40.roles[p.id].recent.length,5);assert.ok(Math.abs(role.projectRole(s,p.id,s.team).contributions.form-2.4)<1e-8);
 const before=structuredClone(s);role.recordRoleMatch(s,{id:'role-6',home:s.team},{done:true,box:{[p.id]:box}});assert.deepEqual(s,before);
 role.recordRoleMatch(s,{id:'absent',home:s.team},{done:true,box:{[p.id]:{...box,min:0}}});assert.deepEqual(s.v40.roles[p.id].recent,before.v40.roles[p.id].recent);assert.equal(s.careerPlan.evaluation,null);
});
test('role updates move ordinary minutes by at most two and explain the decision',()=>{
 const s=make();s.minutes=6;role.applyRole(s,'match');assert.equal(s.minutes,8);assert.match(s.roleReason,/concurrence/i);
 role.applyRole(s,'transfer');assert.equal(s.minutes,19);assert.equal(s.careerPlan.evaluation,null);
});
test('rotation targets conserve team minutes and never include an injured player',()=>{
 const s=make(),t=team(s);s.players.find(p=>p.id===t.roster[0]).injury=4;const rows=role.rotationPlan(s,t.id,48);
 assert.ok(Math.abs(rows.reduce((sum,r)=>sum+r.targetMinutes,0)-240)<1e-8);assert.equal(new Set(rows.map(r=>r.playerId)).size,rows.length);assert.ok(rows.every(r=>r.targetMinutes<=48&&r.playerId!==t.roster[0]));
});
test('role import rejects malformed recent performances before projection',()=>{
 const s=make();s.v40.roles[s.hero]={recent:[{id:'x',grade:-20,day:0}],seenSeason:1,seen:['x']};assert.throws(()=>validate(s),/rôle|V4/i);
});
test('retired AI players do not leave orphaned role histories',()=>{
 const s=make(),p=s.players.find(p=>p.id!==s.hero);p.age=50;s.v40.roles[p.id]={recent:[],seenSeason:1,seen:[]};refreshWorld(s);
 assert.equal(s.players.some(x=>x.id===p.id),false);assert.equal(s.v40.roles[p.id],undefined);
});
