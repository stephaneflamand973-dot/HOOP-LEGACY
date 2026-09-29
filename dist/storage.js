import {validate,migrateLegacy} from './engine.js';
const open=()=>new Promise((resolve,reject)=>{let r=indexedDB.open('hoop-legacy-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('slots');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
let writes=Promise.resolve();
export function save(state,slot='auto'){let snapshot=structuredClone(state);writes=writes.catch(()=>{}).then(()=>write(snapshot,slot));return writes}
async function write(state,slot){let db=await open();return new Promise((res,rej)=>{let tx=db.transaction('slots','readwrite');tx.objectStore('slots').put(structuredClone(state),slot);tx.oncomplete=()=>{db.close();res()};tx.onerror=()=>{db.close();rej(tx.error)}})}
export async function load(slot='auto'){let db=await open();let data=await new Promise((res,rej)=>{let r=db.transaction('slots').objectStore('slots').get(slot);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});db.close();if(!data)return null;if([1,2].includes(data.schema)){await save(data,'backup-before-migration-'+slot);data=migrate(data);await save(data,slot)}return validate(data)}
export function migrate(data){return validate(migrateLegacy(data))}
export function parseSave(text){if(text.length>100000000)throw Error('Fichier trop volumineux');let s=JSON.parse(text);return [1,2].includes(s?.schema)?migrate(s):validate(s)}
