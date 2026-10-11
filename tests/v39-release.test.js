import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
test('CI V3.9 : les neuf sélections d’archives historiques existent',()=>{
 const workflow=fs.readFileSync('.github/workflows/validate-v39.yml','utf8'),commands=[...workflow.matchAll(/git archive ([a-f0-9]+) dist \| tar -x -C (\S+)([^\n]*)/g)];assert.equal(commands.length,9);
 for(const [,commit,,members] of commands){const data=execFileSync('git',['archive',commit,'dist'],{maxBuffer:8e6});const listing=execFileSync('tar',['-tf','-',...members.trim().split(/\s+/).filter(Boolean)],{input:data,encoding:'utf8'});assert.ok(listing.includes('dist/index.html'));}
});
