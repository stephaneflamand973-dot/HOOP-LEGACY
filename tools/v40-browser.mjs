import crypto from 'node:crypto';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {chromium} from 'playwright-core';import {VERSION} from '../dist/config.js';
const root=path.resolve(process.env.QA_ROOT||'dist'),output='test-results/';fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.css':'text/css','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
await new Promise(r=>server.listen(4184,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});page.setDefaultTimeout(15000);
 await page.goto('http://127.0.0.1:4184/');await page.waitForSelector('[data-action="next-step"]');
 await page.evaluate(async v=>{const e=await import('./engine.js?v='+v),f=await import('./finance.js?v='+v),s=e.createGame({...e.defaultBuild(),path:'rookie'});s.money=500000;s.life.finance.start.cash=500000;f.financeAction(s,'property');await(await import('./storage.js?v='+v)).save(s);},VERSION);
 await page.reload();await page.waitForSelector('#advance-size');
 const load=()=>page.evaluate(async v=>await(await import('./storage.js?v='+v)).load(),VERSION),nav=tab=>page.locator(`[data-action="tab:${tab}"]:visible`).first().click(),click=a=>page.locator(`[data-action="${a}"]`).click();
 await page.locator('#advance-size').selectOption('40');await page.locator('details').filter({has:page.locator('#moment-mode')}).locator('summary').click();await page.locator('#moment-mode').selectOption('decisions');
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});for(const tab of ['home','player','career','league','life','more']){await nav(tab);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,tab+' overflow '+width);await page.screenshot({path:output+`v40-${tab}-${width}.png`,fullPage:true});}}
 await nav('life');const before=(await load()).money;
 await click('service-open:recovery');await click('service-cancel');assert.equal((await load()).money,before);assert.equal(await page.locator('#service-open-recovery').evaluate(e=>e===document.activeElement),true);
 for(const kind of ['physical','recovery','proximity','installation','formation']){
  await click('service-open:'+kind);assert.equal(await page.locator('#service-confirm').evaluate(e=>e===document.activeElement),true);await click('service-confirm');
 }
 const purchased=await load();assert.equal(purchased.money,before-1200-900-7500-20300-3000);assert.ok(purchased.v40.services.active.formation);assert.equal(purchased.simulation.mode,'40');assert.equal(purchased.v40.moments.mode,'decisions');
 await page.reload();await page.waitForSelector('#advance-size');assert.equal((await load()).money,purchased.money);
 await page.evaluate(()=>navigator.serviceWorker.ready);await context.setOffline(true);await page.reload();await page.waitForSelector('#advance-size');await nav('life');await page.waitForSelector('.services');await context.setOffline(false);
 // A confirmed manual replacement survives a reload; stale tabs cannot overwrite autosave.
 await nav('more');page.on('dialog',d=>d.accept());await click('save:1');await page.reload();await page.waitForSelector('#advance-size');await nav('more');await click('save:1');
 const other=await context.newPage();await other.goto('http://127.0.0.1:4184/');await other.waitForSelector('#advance-size');
 await other.evaluate(async v=>{window.stale=await(await import('./storage.js?v='+v)).load();},VERSION);
 await page.evaluate(async v=>{const st=await import('./storage.js?v='+v),s=await st.load();s.v40.moments.mode='summary';await st.save(s);},VERSION);
 const conflict=await other.evaluate(async v=>{try{await(await import('./storage.js?v='+v)).save(window.stale);return false;}catch(e){return e.message.includes('autre onglet');}},VERSION);assert.equal(conflict,true);assert.equal((await load()).v40.moments.mode,'summary');await other.close();
 await page.evaluate(async v=>{const st=await import('./storage.js?v='+v),e=await import('./engine.js?v='+v),p=await import('./progression.js?v='+v),svc=await import('./services.js?v='+v),s=e.createGame({...e.defaultBuild(),path:'rookie'});s.money=10000;svc.buyService(s,svc.quoteService(s,'formation',{domain:'coaching'}));s.auto=false;s.activity='etudes';for(let i=1;i<=30;i++){s.day=i*2;e.hero(s).fatigue=0;p.trainingDay(s,e.hero(s));}if(s.v40.services.qualifications?.[0]?.hours!==60)throw Error('Formation incomplète');await st.save(s);},VERSION);
 await page.reload();await page.waitForSelector('#advance-size');await nav('life');await page.locator('summary').filter({hasText:'Bilan des services'}).click();await page.getByText('Qualification :',{exact:false}).waitFor();
 await page.evaluate(async v=>{const st=await import('./storage.js?v='+v),s=await st.load();(await import('./commands.js?v='+v)).retireCareer(s);await st.save(s);},VERSION);await page.reload();await nav('career');await page.waitForSelector('.role-card');
 assert.deepEqual(errors,[]);
 const fingerprint=crypto.createHash('sha256').update(fs.readdirSync(root).filter(f=>/\.(js|css|html)$/.test(f)).sort().map(f=>fs.readFileSync(path.join(root,f))).join('')).digest('hex');
 const report={version:VERSION,fingerprint,formationCompleted:true,retirementView:true,manualReplacement:true,staleTabRejected:true,widths:[320,390,1440],tabs:6,services:5,cancel:true,focus:true,reload:true,offline:true,persistentSimulation:true,errors,physicalSafari:false};fs.writeFileSync('tests/v40-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
