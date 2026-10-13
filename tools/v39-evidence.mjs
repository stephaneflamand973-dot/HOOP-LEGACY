import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
function fingerprint(script){const text=fs.readFileSync('tools/'+script+'.mjs','utf8'),match=text.match(/createHash\('sha256'\)\.update\((\[[^\]]+\])\.map/);assert.ok(match,script);const names=JSON.parse(match[1].replaceAll("'",'"'));return crypto.createHash('sha256').update(names.map(n=>fs.readFileSync('dist/'+n+'.js','utf8')).join('')).digest('hex');}
const read=name=>JSON.parse(fs.readFileSync('tests/'+name+'.json','utf8'));
for(const seed of [2026,973]){const r=read('long-run-'+seed);assert.equal(r.fingerprint,fingerprint('long-run'));assert.equal(r.checkpoints.length,30);}
const rows=[];for(const seed of [2026,973]){const r=read('v39-balance-'+seed);assert.equal(r.engine,'3.9.0');assert.equal(r.fingerprint,fingerprint('v39-balance'));assert.equal(r.rows.length,12);for(const row of r.rows){assert.equal(row.seed,seed);assert.equal(row.trajectory.length,3);assert.ok(row.minCash>=0);assert.ok(row.contracts.length>=3);if(row.strategy!=='initial')assert.ok(row.attempts>0);if(row.mandate==='self')assert.equal(row.commission,0);else assert.ok(row.commission>0);rows.push(row);}}
assert.equal(new Set(rows.map(r=>[r.seed,r.mandate,r.strategy].join('/'))).size,24);
const n=read('v39-neutrality');assert.equal(n.fingerprint,fingerprint('v39-neutrality'));assert.equal(n.reports.length,4);assert.ok(n.reports.every(r=>r.seasons===2&&r.identical));
const b=read('v39-browser-report');assert.equal(b.fingerprint,fingerprint('v39-browser'));assert.deepEqual(b.errors,[]);assert.deepEqual(b.widths,[320,390,1440]);assert.ok(b.simulation.identical&&b.compromiseAndRefusal&&b.importClearsQuote);
const m=read('v39-migrations-report');assert.equal(m.rows.length,9);for(const r of m.rows){assert.equal(r.to,'3.9.0');assert.ok(r.oldCache&&r.matchPreserved&&r.offlineVersionedLink);assert.deepEqual(r.errors,[]);}
console.log(JSON.stringify({engine:'3.9.0',economicSeasons:rows.length*3,longSeasons:60,neutralitySeasons:8,migrations:9,fingerprintsVerified:true}));

const polish=read('v39-polish-cache-report');assert.equal(polish.fingerprint,fingerprint('v39-polish-cache'));assert.ok(polish.oldCache&&polish.httpCache&&polish.saveIdentical&&polish.offline&&polish.focusReturnsToTrigger);assert.deepEqual(polish.errors,[]);assert.ok(b.focusReturnsToTrigger);
