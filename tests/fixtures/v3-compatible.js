// In-memory schema-4 fixture for normal unit runs; upgrade-check also exercises the original V3 runtime.
import {createGame,defaultBuild,competition,startMatch,continueMatch} from '../../dist/engine.js';
export function v3Fixture(){
 const s=createGame(defaultBuild());const g=competition(s).schedule[0];s.day=g.day;s.match=startMatch(s,g);continueMatch(s,null,60);
 const save=structuredClone(s);save.engine='3.0.0';delete save.development.year;delete save.legacy;
 continueMatch(s,null,10000);return {save,finished:JSON.parse(JSON.stringify(s.lastMatch))};
}
