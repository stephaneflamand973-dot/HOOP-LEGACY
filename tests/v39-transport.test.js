import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero,requestTrade,sign,validate} from '../dist/engine.js';
import {parseSave} from '../dist/storage.js';
import {setMandate} from '../dist/representation.js';
import {negotiationQuote,submitCounter} from '../dist/negotiation.js';
import {splitWorkerState,joinWorkerState} from '../dist/worker-state.js';
import {setAdvanceMode,beginAdvance} from '../dist/simulation.js';
import {financeDay} from '../dist/finance.js';
test('V3.9 : export et transport préservent tentative, commission et destination',()=>{
 const s=createGame({...defaultBuild(),path:'rookie'});hero(s).contract.years=1;setMandate(s,'national');setAdvanceMode(s,'40');beginAdvance(s);requestTrade(s);const o=s.offers[0];submitCounter(s,negotiationQuote(s,o.id,{raise:15,years:o.years}));
 const loaded=parseSave(JSON.stringify(s));assert.equal(loaded.representation.session.offers[0].attempts,1);assert.deepEqual(loaded.simulation,s.simulation);
 const {prefix,state}=splitWorkerState(loaded),worker=joinWorkerState(JSON.parse(JSON.stringify(state)),JSON.parse(JSON.stringify(prefix)));assert.deepEqual(JSON.parse(JSON.stringify(worker)),JSON.parse(JSON.stringify(s)));
 for(const x of [s,worker]){assert.equal(sign(x,0,{sessionId:x.representation.session.id,offerId:o.id,source:'current',revision:1}),true);x.day++;financeDay(x);validate(x);}
 assert.equal(s.simulation.mode,'40');assert.equal(s.simulation.cursor.targetSeason,2);assert.deepEqual(JSON.parse(JSON.stringify(worker)),JSON.parse(JSON.stringify(s)));
});
