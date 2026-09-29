import {next} from './engine.js';
let stop=false;
self.onmessage=async e=>{
 if(e.data.type==='stop'){stop=true;return}
 let {state,steps,targetSeason,targetDay}=e.data;stop=false;const startDay=state.day;
 try{for(let i=0;i<steps;i++){
  if(stop||state.pending||state.retired||state.match||(targetSeason&&state.season>=targetSeason)||(targetDay!==null&&targetDay!==undefined&&state.day>=targetDay))break;
  next(state,{interactive:false,untilDay:targetDay??null});
  let value=targetDay?(state.day-startDay)/Math.max(1,targetDay-startDay):targetSeason?(state.day-startDay)/Math.max(1,(targetSeason-1)*365-startDay):(i+1)/steps;
  // A checkpoint after every coherent player event or deadline, never half a match.
  self.postMessage({type:'progress',value:Math.min(1,value),state});await new Promise(r=>setTimeout(r,0));
 }self.postMessage({type:'done',state})}catch(e){self.postMessage({type:'error',message:e.message})}
};
