import http from 'node:http';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createGame,defaultBuild,next,decide,sign,hero} from '../dist/engine.js';
import {acknowledgeSport} from '../dist/sport-events.js';
import {VERSION} from '../dist/config.js';
const root=new URL('../dist/',import.meta.url).pathname,output=new URL('../test-results/',import.meta.url).pathname;
fs.mkdirSync(output,{recursive:true});
// A real, fully simulated rookie postseason makes the browser exercise engine-generated rounds.
const playoffs=createGame({...defaultBuild(),path:'rookie'});playoffs.life.delegated=true;playoffs.mode='quick';
let count=0;
while(!playoffs.competitions.find(c=>c.id==='nba').champion&&count++<2000){
 if(playoffs.sportEvents.notice)acknowledgeSport(playoffs);
 else if(playoffs.pending){if(playoffs.pending.type==='contract')sign(playoffs,0);else decide(playoffs,playoffs.pending.choices[0][0]);}
 else next(playoffs,{interactive:false});
}
assert.ok(playoffs.competitions.find(c=>c.id==='nba').champion);
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),file=root+(url.pathname==='/'?'index.html':url.pathname.slice(1));if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',({js:'application/javascript',html:'text/html',css:'text/css',webmanifest:'application/manifest+json',png:'image/png',svg:'image/svg+xml'})[file.split('.').at(-1)]||'text/plain');fs.createReadStream(file).pipe(res)});
await new Promise(r=>server.listen(4175,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
try{
 const context=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:4175/?v='+VERSION;await page.goto(url);
 const seed=async state=>{await page.evaluate(async({state,v})=>await(await import('./storage.js?v='+v)).save(state),{state,v:VERSION});await page.reload();await page.waitForSelector('#advance-size');};
 const load=()=>page.evaluate(async v=>await(await import('./storage.js?v='+v)).load(),VERSION);
 const waitState=async predicate=>{const end=Date.now()+30000;while(Date.now()<end){const state=await load();if(predicate(state))return state;await page.waitForTimeout(50);}throw Error('État sauvegardé attendu non atteint');};
 await seed(playoffs);const before=await load();
 await page.locator('[data-action="playoffs"]').last().click();await page.waitForSelector('.series-card:visible');
 await page.locator('#playoff-conference').selectOption('Ouest');await page.locator('#playoff-round').selectOption('0');assert.equal(await page.locator('.series-card').count(),4);
 await page.locator('.series-card details summary').first().click();assert.ok(await page.locator('.series-games li:visible').count()>0);
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:output+`v33-playoffs-${width}.png`,fullPage:true});}
 await page.locator('#playoff-conference').selectOption('Tous');await page.locator('#playoff-round').selectOption('3');assert.equal(await page.locator('.series-card').count(),1);assert.ok(!/NaN|undefined/.test(await page.locator('main').innerText()));
 assert.deepEqual((await load()).rng,before.rng);assert.deepEqual((await load()).competitions,before.competitions);
 await page.locator('[data-action="tab:player"]:visible').first().click();await page.locator('[data-action="sub:health"]').click();await page.waitForSelector('.mastery-report');assert.match(await page.locator('.mastery-report').innerText(),/Matchs joués/);
 // Persistent preference with a real interruption, then a reload that must not resume by itself.
 const s=createGame({...defaultBuild(),path:'rookie'});s.mode='quick';s.life.delegated=true;s.life.nextEvent=9999;hero(s).injury=3;
 await seed(s);await page.locator('#advance-size').selectOption('2');await page.locator('[data-action="advance"]').last().click();
 await page.waitForSelector('.sport-notice');await page.waitForFunction(()=>!document.querySelector('[data-action="stop"]'));
 const paused=await load();assert.equal(paused.day,3);assert.equal(paused.simulation.cursor.targetDay,7);assert.equal(paused.simulation.mode,'2');
 await page.reload();await page.waitForSelector('.sport-notice');assert.equal(await page.locator('#advance-size').inputValue(),'2');assert.equal((await load()).day,3);
 await page.locator('[data-action="advance"]').last().click();await page.waitForFunction(()=>!document.querySelector('[data-action="stop"]'));
 const resumed=await waitState(s=>s.day===7);assert.equal(resumed.day,7);assert.equal(resumed.simulation.cursor,null);assert.equal(resumed.simulation.mode,'2');
 await page.locator('#advance-size').selectOption('40');await page.locator('[data-action="tab:career"]:visible').first().click();await page.locator('[data-action="tab:home"]:visible').first().click();assert.equal(await page.locator('#advance-size').inputValue(),'40');
 // Manual stop keeps both mode and endpoint.
 await page.locator('[data-action="advance"]').last().click();await page.waitForSelector('[data-action="stop"]');await page.locator('[data-action="stop"]').click();await page.waitForFunction(()=>!document.querySelector('[data-action="stop"]'));
 const stopped=await load();assert.equal(stopped.simulation.mode,'40');assert.equal(stopped.simulation.cursor.targetSeason,2);await page.reload();await page.waitForSelector('#advance-size');assert.equal((await load()).day,stopped.day);assert.equal(await page.locator('#advance-size').inputValue(),'40');
 // Named slots: cancel replacement, then delete without harming the active career.
 let acceptDialog=false;page.on('dialog',dialog=>acceptDialog?dialog.accept():dialog.dismiss());await page.locator('[data-action="tab:more"]:visible').first().click();await page.locator('[data-action="save:1"]').click();await page.waitForFunction(()=>document.querySelector('.save-slot')?.textContent.includes('Stéphane'));assert.match(await page.locator('.save-slot').first().innerText(),/Stéphane/);
 await page.locator('[data-action="save:1"]').click();assert.ok((await page.evaluate(async v=>(await(await import('./storage.js?v='+v)).listSlots()).find(s=>s.key==='slot1'),VERSION)));
 acceptDialog=true;await page.locator('[data-action="delete:1"]').click();await page.waitForFunction(()=>document.querySelector('.save-slot')?.textContent.includes('Vide'));const retired=await load();retired.retired=true;retired.pending=null;await seed(retired);await page.locator('[data-action="tab:player"]:visible').first().click();assert.ok(await page.locator('#auto').isDisabled());await page.locator('[data-action="sub:health"]').click();assert.ok(await page.locator('[data-action="role-request"]').isDisabled());assert.ok(await page.locator('#tendency-mode').isDisabled());
 assert.deepEqual(errors,[]);const result={errors,playoffSeries:15,mobileWidths:[320,390,1440],rngUnchangedByViews:true,weekTargetPreserved:true,manualStopAndReload:true,retiredControlsDisabled:true,mastery:playoffs.system};fs.writeFileSync(output+'v33-browser-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>server.close(r));}
