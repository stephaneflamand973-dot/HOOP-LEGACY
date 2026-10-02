import http from 'node:http';
import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=await import('playwright-core');
const root=new URL('../dist/',import.meta.url).pathname;
const output=new URL('../test-results/',import.meta.url).pathname;fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{let pathname=new URL(req.url,'http://localhost').pathname;let path=root.replace(/\/$/,'')+(pathname==='/'?'/index.html':pathname);if(!path.startsWith(root)||!fs.existsSync(path)){res.writeHead(404);res.end();return;}let ext=path.split('.').at(-1);res.setHeader('Content-Type',({js:'application/javascript',html:'text/html',css:'text/css',webmanifest:'application/manifest+json',png:'image/png',svg:'image/svg+xml'})[ext]||'text/plain');fs.createReadStream(path).pipe(res)});await new Promise(r=>server.listen(4173,'127.0.0.1',r));
process.on('uncaughtException',e=>{console.error(e);process.exit(1)});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});let page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message)});
await page.goto('http://127.0.0.1:4173/?v=3.3.0');await page.waitForSelector('[data-action="next-step"]');await page.screenshot({path:output+'mobile-create.png',fullPage:true});
for(let i=0;i<6;i++)await page.locator('[data-action="next-step"]').click();await page.locator('[data-action="create"]').click();await page.waitForSelector('#advance-size');
await page.screenshot({path:output+'mobile-home.png',fullPage:true});
await page.locator('[data-action="tab:career"]:visible').first().click();await page.locator('#season-ambition').selectOption('lead');
assert.equal(await page.evaluate(async()=>(await(await import('./storage.js?v=3.3.0')).load()).legacy.season.ambition),'lead');
await page.locator('[data-action="tab:home"]:visible').first().click();
let overflows=[];for(let tab of ['player','career','life','league','more','home']){await page.locator(`[data-action="tab:${tab}"]`).last().click();await page.waitForTimeout(70);let overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);if(overflow)overflows.push(tab);assert.ok(!(await page.locator('main').innerText()).includes('undefined'));if(tab==='life')await page.screenshot({path:output+'mobile-life.png',fullPage:true});}
await page.locator('[data-action="advance"]').last().click();await page.waitForSelector('[data-action="watch"]');await page.locator('[data-action="watch"]').click();await page.screenshot({path:output+'mobile-match.png',fullPage:true});await page.locator('[data-action="finish"]').click();await page.waitForSelector('text=Dernier match');
let s=await page.evaluate(async()=>await(await import('./storage.js?v=3.3.0')).load());assert.equal(s.schema,4);assert.ok(s.lastMatch.done);assert.equal(s.match,null);assert.equal(s.legacy.season.locked,true);assert.equal(s.legacy.season.metrics.gp,s.players.find(p=>p.id===s.hero).season.gp);
if(s.pending)await page.locator('[data-action^="decision:"]').first().click();await page.locator('#advance-size:enabled').selectOption('2');await page.locator('[data-action="advance"]').last().click();await page.waitForFunction(()=>document.querySelector('[data-action="advance"]')&&!document.querySelector('[data-action="advance"]').disabled,null,{timeout:30000});let after=await page.evaluate(async()=>await(await import('./storage.js?v=3.3.0')).load());assert.ok(after.day>s.day);assert.ok(after.day<=s.day+7);assert.equal(after.match,null,'Une avance de semaine simule les matchs sans ouvrir un suivi interactif');
await page.reload();try{await page.waitForSelector('#advance-size',{timeout:12000});}catch(e){console.error('RELOAD',await page.locator('body').innerText());throw e;}assert.equal(await page.evaluate(async()=>(await(await import('./storage.js?v=3.3.0')).load()).day),after.day);
await page.evaluate(async()=>await navigator.serviceWorker.ready);await context.setOffline(true);await page.reload();await page.waitForSelector('#advance-size');await context.setOffline(false);
await page.setViewportSize({width:320,height:740});
for(const tab of ['home','career']){await page.locator(`[data-action="tab:${tab}"]:visible`).first().click();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))overflows.push(tab+'-320');await page.screenshot({path:output+'mobile-'+tab+'-320.png',fullPage:true});}
await page.locator('[data-action="tab:life"]:visible').first().click();if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))overflows.push('life-320');await page.screenshot({path:output+'mobile-320.png',fullPage:true});
await page.setViewportSize({width:1440,height:1000});await page.locator('[data-action="tab:home"]:visible').first().click();await page.screenshot({path:output+'desktop-home.png',fullPage:true});
let longSave=null;
if(process.env.QA_LONG_SAVE){
 await page.locator('[data-action="tab:more"]').click();await page.locator('#import').setInputFiles(process.env.QA_LONG_SAVE);await page.waitForSelector('text=Partie importée.',{timeout:60000});
 const snapshot=()=>page.evaluate(async()=>{let s=await(await import('./storage.js?v=3.3.0')).load();return {season:s.season,day:s.day,history:s.history.length,archives:s.archives.map(a=>[a.season,a.competitions.reduce((n,c)=>n+c.games.length,0)]),pending:s.pending?.type}});
 const imported=await snapshot();assert.equal(imported.archives.length,30);assert.equal(imported.history,30);
 await page.reload();await page.waitForSelector('main');assert.deepEqual(await snapshot(),imported);
 await page.setViewportSize({width:320,height:740});await page.locator('[data-action="tab:player"]:visible').first().click();await page.waitForSelector('.development-report');
 const development=await page.locator('.development-report').innerText();assert.ok(!/undefined|NaN/.test(development));assert.match(development,/Bilan de la saison 30/);
 await page.locator('.development-report summary').click();if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))overflows.push('development-320');
 await page.screenshot({path:output+'mobile-development-320.png',fullPage:true});
 await page.locator('[data-action="tab:career"]:visible').first().click();await page.waitForSelector('.legacy-panel');
 assert.match(await page.locator('.season-review').first().innerText(),/SAISON 30/);assert.ok(!/undefined|NaN/.test(await page.locator('main').innerText()));
 await page.locator('summary').filter({hasText:'Les bilans précédents'}).click();assert.ok(await page.locator('.season-review').count()>=30);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))overflows.push('legacy-320');
 await page.locator('summary').filter({hasText:'Les bilans précédents'}).click();
 await page.screenshot({path:output+'mobile-legacy-30-seasons-320.png',fullPage:true});
 await page.locator('[data-action="tab:league"]:visible').first().click();await page.locator('[data-action="league:Calendrier"]').click();await page.locator('#calendar-season').selectOption('1');assert.ok((await page.locator('main').innerText()).length>1000);
 await page.locator('[data-action="tab:home"]:visible').first().click();
 for(let attempt=0;attempt<6;attempt++){
  const state=await snapshot();if(state.day>imported.day)break;
  if(state.pending==='contract')await page.locator('[data-action^="sign:"]').first().click();else if(state.pending)await page.locator('[data-action^="decision:"]').first().click();
  await page.locator('#advance-size:enabled').selectOption('2');await page.locator('[data-action="advance"]').last().click();await page.waitForFunction(()=>document.querySelector('[data-action="advance"]')&&!document.querySelector('[data-action="stop"]'),null,{timeout:60000});
 }
 const advanced=await snapshot();assert.ok(advanced.day>imported.day);assert.deepEqual(advanced.archives,imported.archives);
 await page.reload();await page.waitForSelector('main');assert.deepEqual(await snapshot(),advanced);longSave={archives:advanced.archives.length,history:advanced.history,day:advanced.day,continued:true};
}
console.log(JSON.stringify({errors,overflows,firstDay:s.day,afterWeek:after.day,offline:true,longSave}));assert.deepEqual(errors,[]);assert.deepEqual(overflows,[]);fs.writeFileSync(output+'mobile-result.json',JSON.stringify({errors,overflows,viewport:'390x844, 320x740, 1440x1000',offline:true,longSave}));await browser.close();server.close();
