import {next} from './engine.js?v=3.8.0';
import {destinationReached,settleAdvance} from './simulation.js?v=3.8.0';
import {hasSportPause} from './sport-events.js?v=3.8.0';
let stop=false;
self.onmessage=async e=>{
 if(e.data.type==='stop'){stop=true;return}
 let {state,steps=1000,targetSeason,targetDay}=e.data;stop=false;const startDay=state.day;let checkpoint=structuredClone(state);
 try{for(let i=0;i<steps;i++){
  if(stop||state.pending||state.retired||state.match||hasSportPause(state)||(state.simulation?.cursor?destinationReached(state):(targetSeason&&state.season>=targetSeason)||(targetDay!==null&&targetDay!==undefined&&state.day>=targetDay)))break;
  // At most one day per batch keeps stop responsive and checkpoints coherent.
  let boundary=Math.min(state.day+1,targetDay??Infinity);next(state,{interactive:false,untilDay:boundary});
  let value=targetDay?(state.day-startDay)/Math.max(1,targetDay-startDay):targetSeason?(state.day-startDay)/Math.max(1,(targetSeason-1)*365-startDay):(i+1)/steps;
  if(i%7===0||state.pending||state.season>=targetSeason){checkpoint=structuredClone(state);self.postMessage({type:'progress',value:Math.min(1,value),state:checkpoint});}
  await new Promise(r=>setTimeout(r,0));
 }settleAdvance(state);self.postMessage({type:'done',state})}catch(e){self.postMessage({type:'error',message:e.message,state:checkpoint})}
};
