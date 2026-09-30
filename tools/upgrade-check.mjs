import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const previous=process.env.QA_PREVIOUS_ROOT;
assert.ok(previous,'Définir QA_PREVIOUS_ROOT vers le dossier dist de la V3.0.0.');
assert.match(fs.readFileSync(path.join(previous,'config.js'),'utf8'),/VERSION='3\.0\.0'/);
const legacy=await import(pathToFileURL(path.join(previous,'engine.js')));
const old=legacy.createGame(legacy.defaultBuild()),game=legacy.competition(old).schedule[0];
old.day=game.day;old.match=legacy.startMatch(old,game);legacy.continueMatch(old,null,60);
const fixture={save:structuredClone(old)};legacy.continueMatch(old,null,10000);fixture.finished=JSON.parse(JSON.stringify(old.lastMatch));
const current=new URL('../dist/',import.meta.url).pathname,output=new URL('../test-results/',import.meta.url).pathname;
fs.mkdirSync(output,{recursive:true});let served=previous;
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(served,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(path.resolve(served)+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'text/plain');
 res.setHeader('Cache-Control','no-store');fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(4174,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
 const context=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4174/');await page.waitForSelector('[data-action="next-step"]');
 await page.evaluate(async save=>{await(await import('./storage.js?v=3.0.0')).save(save);},fixture.save);
 await page.evaluate(async()=>await navigator.serviceWorker.ready);await page.reload();await page.waitForSelector('[data-action="finish"]');
 assert.ok((await page.evaluate(()=>caches.keys())).includes('hoop-legacy-3.0.0'));served=current;
 await page.goto('http://127.0.0.1:4174/?v=3.1.0');await page.waitForSelector('[data-action="finish"]');
 const migrated=await page.evaluate(async()=>await(await import('./storage.js?v=3.1.0')).load());
 assert.equal(migrated.engine,'3.1.0');for(const key of ['rng','match','pending','history'])assert.deepEqual(migrated[key],fixture.save[key]);
 assert.deepEqual(migrated.development.xp,fixture.save.development.xp);
 assert.deepEqual(migrated.players.find(p=>p.id===migrated.hero).attrs,fixture.save.players.find(p=>p.id===fixture.save.hero).attrs);
 const backup=await page.evaluate(()=>new Promise((resolve,reject)=>{
  const r=indexedDB.open('hoop-legacy-v1',2);r.onerror=()=>reject(r.error);r.onsuccess=()=>{
   const q=r.result.transaction('slots').objectStore('slots').get('backup-before-3.0.0-auto');
   q.onsuccess=()=>{resolve(q.result?.engine);r.result.close();};q.onerror=()=>reject(q.error);
  };
 }));assert.equal(backup,'3.0.0');
 await page.waitForFunction(async()=>(await caches.keys()).includes('hoop-legacy-3.1.0'));
 await page.locator('[data-action="finish"]').click();await page.waitForSelector('text=Dernier match');
 const finished=await page.evaluate(async()=>(await(await import('./storage.js?v=3.1.0')).load()).lastMatch);
 assert.deepEqual(JSON.parse(JSON.stringify(finished)),fixture.finished);
 await context.setOffline(true);await page.reload();await page.waitForSelector('text=Dernier match');
 await page.locator('[data-action="tab:player"]:visible').first().click();await page.waitForSelector('.development-report');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:output+'upgrade-v3-to-v31-320.png',fullPage:true});assert.deepEqual(errors,[]);
 const result={from:'3.0.0',to:'3.1.0',oldCache:true,backup,matchPreserved:true,offlineVersionedLink:true,errors};
 fs.writeFileSync(output+'upgrade-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
