import test from 'node:test';import assert from 'node:assert/strict';import {Worker} from 'node:worker_threads';
import {createGame,defaultBuild,next,sign,decide} from '../dist/engine.js';
import {setMomentMode} from '../dist/career-moments.js';
import {setAdvanceMode,beginAdvance,destinationReached,settleAdvance} from '../dist/simulation.js';
import {hasSportPause,acknowledgeSport} from '../dist/sport-events.js';
import {buyService,quoteService} from '../dist/services.js';
const script=`import {parentPort} from 'node:worker_threads';globalThis.self={postMessage:x=>parentPort.postMessage(x)};await import(${JSON.stringify(new URL('../dist/worker.js',import.meta.url).href)});parentPort.on('message',data=>self.onmessage({data}));parentPort.postMessage({type:'ready'});`;
async function batch(s){const w=new Worker(new URL('data:text/javascript,'+encodeURIComponent(script)));try{return await new Promise((resolve,reject)=>{w.on('error',reject);w.on('message',m=>{if(m.type==='ready')w.postMessage({state:structuredClone(s),steps:40});if(m.type==='done')resolve(m.state);if(m.type==='error')reject(Error(m.message));});});}finally{await w.terminate();}}
function direct(s){for(let i=0;i<40;i++){if(s.pending||s.retired||s.match||hasSportPause(s)||destinationReached(s))break;next(s,{interactive:false,untilDay:s.day+1});}settleAdvance(s);return s;}
test('V4 worker restarts preserve exact sports state, service debits and simulation target',async()=>{
 for(const mode of ['highlights','decisions','summary']){
  let s=createGame({...defaultBuild(),path:'rookie'});s.money=10000;s.life.finance.start.cash=10000;buyService(s,quoteService(s,'recovery'));setMomentMode(s,mode);setAdvanceMode(s,'40');beginAdvance(s);const cursor=structuredClone(s.simulation.cursor);
  for(let n=0;n<3;n++){
   if(hasSportPause(s))acknowledgeSport(s);
   if(s.pending){if(s.pending.type==='contract')sign(s,0);else decide(s,s.pending.choices[0][0]);}
   const expected=direct(structuredClone(s));s=await batch(s);assert.deepEqual(s,expected);assert.deepEqual(s.simulation.cursor,cursor);assert.equal(s.v40.services.totals.paid,900);
  }
 }
});
