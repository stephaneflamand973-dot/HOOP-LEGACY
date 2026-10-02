import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {VERSION} from '../dist/config.js';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='https://stephaneflamand973-dot.github.io/HOOP-LEGACY/dist/?v='+VERSION;
 const response=await page.goto(url,{waitUntil:'networkidle',timeout:45000});assert.equal(response.status(),200);
 await page.waitForSelector('[data-action="next-step"]');for(let i=0;i<6;i++)await page.locator('[data-action="next-step"]').click();
 await page.locator('[data-action="create"]').click();await page.waitForSelector('#advance-size');
 await page.locator('[data-action="advance"]').click();await page.waitForSelector('[data-action="finish"]');
 await page.locator('[data-action="finish"]').click();await page.waitForSelector('text=Dernier match');
 const state=await page.evaluate(async version=>{
  const s=await(await import('./storage.js?v='+version)).load();return {schema:s.schema,engine:s.engine,day:s.day,done:s.lastMatch?.done,round:s.round,realPlayers:s.players.filter(p=>p.real).length,goals:s.legacy?.season.goals.length,played:s.legacy?.season.metrics.gp};
 },VERSION);
 assert.equal(state.engine,VERSION);assert.equal(state.schema,4);assert.equal(state.done,true);assert.ok(state.realPlayers>500);assert.equal(state.goals,3);assert.equal(state.played,1);assert.deepEqual(errors,[]);
 await page.locator('#advance-size').selectOption('40');const preference=await page.evaluate(async v=>(await(await import('./storage.js?v='+v)).load()).simulation.mode,VERSION);assert.equal(preference,'40');await page.reload();await page.waitForSelector('#advance-size');assert.equal(await page.locator('#advance-size').inputValue(),'40');
 await page.locator('[data-action="tab:league"]:visible').first().click();await page.locator('[data-action="league:Playoffs"]').click();await page.waitForSelector('#playoff-season');
 await page.locator('[data-action="tab:player"]:visible').first().click();await page.waitForSelector('.development-report');
 await page.locator('[data-action="tab:career"]:visible').first().click();await page.waitForSelector('.legacy-panel');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const output=new URL('../test-results/',import.meta.url).pathname;fs.mkdirSync(output,{recursive:true});
 await page.screenshot({path:output+'public-mobile.png',fullPage:true});
 const result={url:page.url(),state,errors,mobileViewport:true,persistentSimulation:true,playoffCenter:true};fs.writeFileSync(output+'public-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
