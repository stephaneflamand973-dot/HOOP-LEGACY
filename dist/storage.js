import {VERSION} from './config.js?v=3.2.0';
import {validate,migrateLegacy} from './engine.js?v=3.2.0';
const open=()=>new Promise((resolve,reject)=>{let r=indexedDB.open('hoop-legacy-v1',2);r.onupgradeneeded=()=>{for(let name of ['slots','archives'])if(!r.result.objectStoreNames.contains(name))r.result.createObjectStore(name)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Fermez les autres onglets du jeu pour terminer la mise à jour.'))});
let writes=Promise.resolve();const archiveKeys=new WeakMap();
function archiveKey(a){let key=archiveKeys.get(a);if(key)return key;let str=JSON.stringify(a),h=2166136261;for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);key='season-'+a.season+'-'+(h>>>0)+'-'+str.length;archiveKeys.set(a,key);return key;}
export function save(state,slot='auto'){
 if(!state)return Promise.resolve();if(state.schema===4)validate(['3.0.0','3.1.0'].includes(state.engine)?migrateLegacy(state):state);const refs=(state.archives||[]).map(archiveKey),snapshot=structuredClone({...state,archives:[]}),archives=[...(state.archives||[])];snapshot.archiveRefs=refs;
 writes=writes.catch(()=>{}).then(()=>write(snapshot,archives,slot));return writes;
}
async function write(state,archives,slot){let db=await open();return new Promise((res,rej)=>{let tx=db.transaction(['slots','archives'],'readwrite'),slots=tx.objectStore('slots'),store=tx.objectStore('archives');
 for(let i=0;i<archives.length;i++){let key=state.archiveRefs[i],req=store.get(key);req.onsuccess=()=>{if(!req.result)store.put(archives[i],key);};}
 if(slot==='auto'){let previous=slots.get(slot);previous.onsuccess=()=>{if(previous.result)slots.put(previous.result,'rollback');};}
 slots.put(state,slot);tx.oncomplete=()=>{db.close();res()};tx.onerror=()=>{db.close();rej(tx.error)};tx.onabort=()=>{db.close();rej(tx.error||Error('Écriture interrompue'))};});}
export async function load(slot='auto'){
 await writes.catch(()=>{});let db=await open();let data=await new Promise((res,rej)=>{let r=db.transaction('slots').objectStore('slots').get(slot);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
 if(data?.archiveRefs?.length){let refs=data.archiveRefs;data.archives=await new Promise((res,rej)=>{let tx=db.transaction('archives'),out=new Array(refs.length);refs.forEach((key,i)=>{let r=tx.objectStore('archives').get(key);r.onsuccess=()=>{if(!r.result){rej(Error('Archive manquante : chargez le secours ou votre export JSON.'));return;}out[i]=r.result;};r.onerror=()=>rej(r.error);});tx.oncomplete=()=>res(out);tx.onerror=()=>rej(tx.error);});delete data.archiveRefs;}
 db.close();if(!data)return null;if(needsMigration(data)){let migrated=migrate(data);await save(data,(data.schema===4?'backup-before-'+data.engine+'-':'backup-before-migration-')+slot);data=migrated;await save(data,slot);}return validate(data);
}
const needsMigration=s=>[1,2,3].includes(s?.schema)||s?.schema===4&&['3.0.0','3.1.0'].includes(s.engine);
export function migrate(data){return validate(migrateLegacy(data))}
export function parseSave(text){if(text.length>150000000)throw Error('Fichier trop volumineux');let s=JSON.parse(text);if(s?.archiveRefs?.length&&!s.archives?.length)throw Error('Export incomplet : les archives ne sont pas incluses');return needsMigration(s)?migrate(s):validate(s)}
