import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {VERSION} from '../dist/config.js';
const root=new URL('../dist/',import.meta.url).pathname,output=new URL('../test-results/',import.meta.url).pathname;fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'text/plain');fs.createReadStream(file).pipe(res);});
await new Promise(r=>server.listen(4178,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4178/?v='+VERSION);await page.waitForSelector('[data-action="next-step"]');
 await page.evaluate(async v=>{const {createGame,defaultBuild,hero}=await import('./engine.js?v='+v),{initLife}=await import('./life.js?v='+v),s=createGame({...defaultBuild(),path:'rookie',age:22});s.money=400000;delete s.life.finance;s.life.partner={name:'Camille Joseph',id:'partner-1',since:0,bond:65};s.life.children=[{id:'child-1',name:'Alex Joseph',born:0}];initLife(s);await(await import('./storage.js?v='+v)).save(s);},VERSION);
 await page.reload();await page.waitForSelector('#advance-size');const nav=async id=>page.locator(`[data-action="tab:${id}"]:visible`).first().click();const load=()=>page.evaluate(async v=>(await(await import('./storage.js?v='+v)).load()),VERSION);
 await nav('life');await page.waitForSelector('#policy-routine');await page.locator('#policy-routine').selectOption('family');await page.locator('#policy-media').selectOption('team');await page.locator('#policy-agent').selectOption('local');await page.locator('#finance-reserve').selectOption('25000');await page.locator('#finance-percent').selectOption('20');await page.locator('#finance-automatic').check();
 let s=await load();assert.deepEqual(s.life.policies,{routine:'family',media:'team',agent:'local'});assert.equal(s.life.finance.automatic,true);assert.equal(s.life.finance.reserve,25000);
 await page.locator('[data-action="life:invest"]').click();s=await load();assert.equal(s.money,325000);assert.equal(s.life.investments,75000);
 await page.locator('[data-action="life:property"]').click();s=await load();assert.equal(s.money,75000);assert.equal(s.life.property.value,250000);assert.equal(await page.locator('[data-action="life:property"]').isDisabled(),true);
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Débordement à ${width}px`);await page.screenshot({path:output+`v35-life-${width}.png`,fullPage:true});}
 await page.locator('[data-action="life:sell"]').click();s=await load();assert.equal(s.money,312500);assert.equal(s.life.property,null);assert.equal(await page.locator('[data-action="life:sell"]').count(),0);
 await page.reload();await page.waitForSelector('#advance-size');await nav('life');assert.equal(await page.locator('#finance-automatic').isChecked(),true);assert.equal(await page.locator('#policy-routine').inputValue(),'family');assert.match(await page.locator('main').innerText(),/Camille Joseph/);
 await nav('career');assert.match(await page.locator('main').innerText(),/PROJET DU CLUB/);await page.setViewportSize({width:320,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:output+'v35-club-320.png',fullPage:true});
 // A pending major event survives reload, blocks changes, and is resolved once.
 await page.evaluate(async v=>{const store=await import('./storage.js?v='+v),s=await store.load();s.life.sequence=1;s.life.nextEvent=s.day;s.day++;(await import('./life.js?v='+v)).lifeDay(s);if(s.pending?.kind!=='family')throw Error('Projet familial absent');await store.save(s);},VERSION);
 await page.reload();await page.waitForSelector('[data-action="decision:child"]');await nav('life');assert.equal(await page.locator('#policy-routine').isDisabled(),true);await nav('home');await page.locator('[data-action="decision:child"]').click();s=await load();const expecting=s.life.expecting;assert.ok(expecting>s.day);assert.equal(s.pending,null);await page.reload();await page.waitForSelector('#advance-size');assert.equal((await load()).life.expecting,expecting);
 await page.evaluate(()=>navigator.serviceWorker.ready);await context.setOffline(true);await page.reload();await page.waitForSelector('#advance-size');await nav('life');await page.waitForSelector('#finance-percent');assert.match(await page.locator('main').innerText(),/Camille Joseph/);assert.deepEqual(errors,[]);
 const result={engine:VERSION,errors,widths:[320,390,1440],policiesPersist:true,exactInvestment:75000,propertyPurchaseSale:true,majorDecisionReload:true,clubProject:true,offline:true};fs.writeFileSync(output+'v35-browser-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>server.close(r));}
