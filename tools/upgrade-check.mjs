import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {VERSION} from '../dist/config.js';
const previous=process.env.QA_PREVIOUS_ROOT;
assert.ok(previous,'Définir QA_PREVIOUS_ROOT vers le dossier dist de la version précédente.');
const oldVersion=(await import(pathToFileURL(path.join(previous,'config.js')))).VERSION;
assert.ok(['3.0.0','3.1.0','3.2.0','3.3.0'].includes(oldVersion));
const legacy=await import(pathToFileURL(path.join(previous,'engine.js')));
const old=legacy.createGame(legacy.defaultBuild()),game=legacy.competition(old).schedule[0];
old.day=game.day;old.match=legacy.startMatch(old,game);legacy.continueMatch(old,null,60);
const fixture={save:structuredClone(old)};legacy.continueMatch(old,null,10000);fixture.finished=JSON.parse(JSON.stringify(old.lastMatch));fixture.finishedRng=structuredClone(old.rng);
const current=new URL('../dist/',import.meta.url).pathname,output=new URL('../test-results/',import.meta.url).pathname;
fs.mkdirSync(output,{recursive:true});let served=previous;
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(served,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(path.resolve(served)+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'text/plain');
 fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(4174,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
 const context=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4174/');await page.waitForSelector('[data-action="next-step"]');
 await page.evaluate(async({save,version})=>{await(await import('./storage.js?v='+version)).save(save);},{save:fixture.save,version:oldVersion});
 await page.evaluate(async()=>await navigator.serviceWorker.ready);await page.reload();await page.waitForSelector('[data-action="finish"]');
 // Let the legacy registration complete before serving a new worker/cache manifest.
 await page.waitForLoadState('networkidle');
 await page.evaluate(async()=>{const registration=await navigator.serviceWorker.ready;await registration.update();});
 await page.waitForFunction(v=>navigator.serviceWorker.controller?.state==='activated'&&navigator.serviceWorker.controller.scriptURL.endsWith('sw.js?v='+v),oldVersion);
 assert.ok((await page.evaluate(()=>caches.keys())).includes('hoop-legacy-'+oldVersion));served=current;
 await page.goto('http://127.0.0.1:4174/?v='+VERSION);await page.waitForSelector('[data-action="finish"]');
 const migrated=await page.evaluate(async v=>await(await import('./storage.js?v='+v)).load(),VERSION);
 assert.equal(migrated.engine,VERSION);for(const key of ['rng','match','pending','history'])assert.deepEqual(migrated[key],fixture.save[key]);
 assert.deepEqual(migrated.development.xp,fixture.save.development.xp);
 assert.deepEqual(migrated.players.find(p=>p.id===migrated.hero).attrs,fixture.save.players.find(p=>p.id===fixture.save.hero).attrs);
 assert.equal(migrated.legacy.rivals.length,0);
 const backup=await page.evaluate(version=>new Promise((resolve,reject)=>{
  const r=indexedDB.open('hoop-legacy-v1');r.onerror=()=>reject(r.error);r.onsuccess=()=>{
   const q=r.result.transaction('slots').objectStore('slots').get('backup-before-'+version+'-auto');
   q.onsuccess=()=>{resolve({engine:q.result?.engine,match:q.result?.match});r.result.close();};q.onerror=()=>reject(q.error);
  };
 }),oldVersion);assert.equal(backup.engine,oldVersion);assert.deepEqual(backup.match,fixture.save.match);
 await page.waitForFunction(async v=>{
  const worker=navigator.serviceWorker.controller;
  return worker?.state==='activated'&&worker.scriptURL.endsWith('sw.js?v='+v)&&!!(await(await caches.open('hoop-legacy-'+v)).match('./legacy.js?v='+v));
 },VERSION);
 await page.locator('[data-action="finish"]').click();await page.waitForSelector('text=Dernier match');
 const finished=await page.evaluate(async v=>await(await import('./storage.js?v='+v)).load(),VERSION);
 assert.deepEqual(JSON.parse(JSON.stringify(finished.lastMatch)),fixture.finished);assert.deepEqual(finished.rng,fixture.finishedRng);
 assert.equal(finished.legacy.season.metrics.gp,1);
 await context.setOffline(true);await page.reload();await page.waitForSelector('text=Dernier match');
 await page.locator('[data-action="tab:career"]:visible').first().click();await page.waitForSelector('.legacy-panel');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const resumed=await page.evaluate(async v=>await(await import('./storage.js?v='+v)).load(),VERSION);
 assert.deepEqual(resumed.legacy,finished.legacy);assert.deepEqual(resumed.rng,finished.rng);
 await page.screenshot({path:output+'upgrade-'+oldVersion+'-to-'+VERSION+'-320.png',fullPage:true});assert.deepEqual(errors,[]);
 const result={from:oldVersion,to:VERSION,oldCache:true,backup:backup.engine,matchPreserved:true,offlineVersionedLink:true,legacyIdempotent:true,errors};
 fs.writeFileSync(output+'upgrade-'+oldVersion+'-result.json',JSON.stringify(result,null,2));
 if(oldVersion==='3.1.0')fs.writeFileSync(output+'upgrade-result.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
