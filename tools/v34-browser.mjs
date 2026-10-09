import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {VERSION} from '../dist/config.js';
import {createGame,defaultBuild,hero,requestTrade} from '../dist/engine.js';
const root=new URL('../dist/',import.meta.url).pathname,output=new URL('../test-results/',import.meta.url).pathname;
const checkpoint=process.env.QA_V34_LONG_SAVE||new URL('../.qa-cache/state-2026.json',import.meta.url).pathname;
fs.mkdirSync(output,{recursive:true});
const saved=JSON.parse(fs.readFileSync(checkpoint)),long=saved.state||saved;
assert.equal(long.engine,VERSION);assert.equal(long.history.length,30);
const longText=JSON.stringify(long);
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/qa-state'){res.setHeader('Content-Type','application/json');res.end(longText);return;}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'text/plain');fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(4177,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:4177/?v='+VERSION;await page.goto(url);await page.waitForSelector('[data-action="next-step"]');
 const saveMs=await page.evaluate(async v=>{const state=await(await fetch('/qa-state')).json(),started=performance.now();await(await import('./storage.js?v='+v)).save(state);return performance.now()-started;},VERSION);
 let started=performance.now();await page.reload();await page.waitForSelector('#advance-size');const startupMs=performance.now()-started;
 const load=()=>page.evaluate(async v=>await(await import('./storage.js?v='+v)).load('auto',{lazy:true}),VERSION);
 const summary=()=>page.evaluate(async v=>{const s=await(await import('./storage.js?v='+v)).load('auto',{lazy:true});return {rng:s.rng,day:s.day,archives:s.archives.length,deferred:s.archives.filter(a=>a.deferred).length};},VERSION);
 const before=await summary();assert.equal(before.deferred,29);
 const nav=async id=>{await page.locator(`[data-action="tab:${id}"]:visible`).first().click();};
 await nav('league');await page.locator('[data-action="league:Statistiques"]').click();await page.locator('#stats-season').selectOption('30');
 await page.waitForFunction(()=>document.querySelector('.v34-statistics tbody tr .link'));
 await page.locator('#stats-phase').selectOption('regular');await page.locator('#stats-sort').selectOption('ast');
 const regular=await page.locator('.v34-statistics tbody').innerText();
 await nav('career');await nav('league');assert.equal(await page.locator('#stats-sort').inputValue(),'ast');assert.equal(await page.locator('#stats-season').inputValue(),'30');assert.equal(await page.locator('.v34-statistics tbody').innerText(),regular);
 await page.locator('#stats-query').pressSequentially('Stéphane');assert.equal(await page.locator('#stats-query').inputValue(),'Stéphane');assert.equal(await page.locator('.v34-statistics tbody tr.you').count(),1);
 await page.locator('.v34-statistics [data-action="profile:hero"]').click();await page.waitForSelector('.player-dossier');assert.match(await page.locator('.player-dossier').innerText(),/S30/);await page.locator('[data-action="close-profile"]').click();
 await page.locator('#stats-query').fill('');await page.locator('#stats-phase').selectOption('post');
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:output+`v34-statistics-${width}.png`,fullPage:true});}
 await page.locator('[data-action="league:Distinctions"]').click();await page.locator('#awards-season').selectOption('30');await page.locator('#awards-kind').selectOption('finals');assert.ok(await page.locator('.award-candidates article').count()>0);assert.ok(!/undefined|NaN/.test(await page.locator('.awards-view').innerText()));
 await page.locator('[data-action="league:Dossiers"]').click();await page.locator('#directory-query').fill('LeBron');await page.locator('.directory button').first().click();assert.match(await page.locator('.player-dossier').innerText(),/Retraité|Ancien joueur/);await page.locator('[data-action="close-profile"]').click();
 // Keyboard and repeat navigation on a thirty-season state must remain view-only.
 await page.keyboard.press('Tab');assert.notEqual(await page.evaluate(()=>document.activeElement.tagName),'BODY');
 await page.evaluate(()=>performance.clearMeasures('hoop-render'));
 for(let i=0;i<4;i++)for(const id of ['home','player','career','life','league'])await nav(id);
 const renderTimes=await page.evaluate(()=>performance.getEntriesByName('hoop-render').map(e=>e.duration).sort((a,b)=>a-b));
 const p95=renderTimes[Math.floor(renderTimes.length*.95)];assert.ok(p95<250,`Rendu p95 ${p95} ms`);
 assert.deepEqual((await summary()).rng,before.rng);assert.equal((await summary()).day,before.day);
 // Reload stays lazy even after opening an old archive.
 await page.reload();await page.waitForSelector('#advance-size');assert.equal((await summary()).deferred,29);
 await context.setOffline(true);await page.reload();await page.waitForSelector('#advance-size');await nav('league');await page.locator('[data-action="league:Statistiques"]').click();await page.locator('#stats-season').selectOption('1');await page.waitForFunction(()=>!!document.querySelector('.v34-statistics tbody tr .link'));await context.setOffline(false);
 const normal=createGame({...defaultBuild(),path:'rookie'});normal.mode='quick';normal.life.delegated=true;normal.life.nextEvent=9999;
 await page.evaluate(async({s,v})=>await(await import('./storage.js?v='+v)).save(s),{s:normal,v:VERSION});await page.reload();await page.waitForSelector('#advance-size');
 await nav('career');await page.locator('.coach-panel [data-action="role-request"]').click();await page.locator('[data-action="decision:accept"]').click();await page.reload();await page.waitForSelector('#advance-size');await nav('career');assert.match(await page.locator('.coach-panel').innerText(),/Évaluation en cours/);
 // Offered contracts retain their indexes when sorted by the player's preference.
 const market=createGame({...defaultBuild(),path:'rookie'});hero(market).contract.years=1;requestTrade(market);assert.ok(market.offers.length);
 await page.evaluate(async({s,v})=>await(await import('./storage.js?v='+v)).save(s),{s:market,v:VERSION});await page.reload();await page.waitForSelector('#market-preference');await page.locator('#market-preference').selectOption('salary');
 await page.waitForFunction(()=>document.querySelector('#market-preference')?.value==='salary');assert.match(await page.locator('.comparison-offers').innerText(),/Concurrence/);
 await page.setViewportSize({width:320,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:output+'v34-market-320.png',fullPage:true});
 assert.deepEqual(errors,[]);
 const result={engine:VERSION,saveMs:+saveMs.toFixed(1),saveMB:Buffer.byteLength(longText)/1e6,errors,archives:30,lazyArchives:29,startupMs:+startupMs.toFixed(1),renderP95Ms:+p95.toFixed(1),viewRngUnchanged:true,statisticsFilters:true,retiredDossiers:true,awards:true,coachReload:true,marketComparison:true,offlineArchive:true,widths:[320,390,1440]};
 fs.writeFileSync(output+'v34-browser-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>server.close(r));}
