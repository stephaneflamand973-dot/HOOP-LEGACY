import {VERSION} from './config.js?v=3.4.0';
import {validate,migrateLegacy} from './engine.js?v=3.4.0';
const open=()=>new Promise((resolve,reject)=>{let r=indexedDB.open('hoop-legacy-v1',3);r.onupgradeneeded=()=>{for(let name of ['slots','archives','slotMeta'])if(!r.result.objectStoreNames.contains(name))r.result.createObjectStore(name)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Fermez les autres onglets du jeu pour terminer la mise à jour.'))});
let writes=Promise.resolve();const archiveKeys=new WeakMap();
function archiveKey(a){if(a.deferred&&a.archiveRef)return a.archiveRef;let key=archiveKeys.get(a);if(key)return key;let str=JSON.stringify(a),h=2166136261;for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);key='season-'+a.season+'-'+(h>>>0)+'-'+str.length;archiveKeys.set(a,key);return key;}
export function save(state,slot='auto'){
 if(!state)return Promise.resolve();if(state.schema===4)validate(['3.0.0','3.1.0','3.2.0','3.3.0'].includes(state.engine)?migrateLegacy(state):state);const refs=(state.archives||[]).map(archiveKey),snapshot=structuredClone({...state,archives:[]}),archives=[...(state.archives||[])];snapshot.archiveRefs=refs;snapshot.archiveIndex=archives.map((a,i)=>({season:a.season,team:a.team,league:a.league,archiveRef:refs[i],deferred:true}));
 writes=writes.catch(()=>{}).then(()=>write(snapshot,archives,slot));return writes;
}
async function write(state,archives,slot){let db=await open();return new Promise((res,rej)=>{let tx=db.transaction(['slots','archives','slotMeta'],'readwrite'),slots=tx.objectStore('slots'),store=tx.objectStore('archives');
 for(let i=0;i<archives.length;i++){if(archives[i].deferred)continue;let key=state.archiveRefs[i],req=store.get(key);req.onsuccess=()=>{if(!req.result)store.put(archives[i],key);};}
 if(slot==='auto'){let previous=slots.get(slot);previous.onsuccess=()=>{if(previous.result)slots.put(previous.result,'rollback');};}
 slots.put(state,slot);tx.objectStore('slotMeta').put({savedAt:Date.now()},slot);tx.oncomplete=()=>{db.close();res()};tx.onerror=()=>{db.close();rej(tx.error)};tx.onabort=()=>{db.close();rej(tx.error||Error('Écriture interrompue'))};});}
export async function load(slot='auto',{lazy=false}={}){
 await writes.catch(()=>{});let db=await open();let data=await new Promise((res,rej)=>{let r=db.transaction('slots').objectStore('slots').get(slot);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
 if(data?.archiveRefs?.length){let refs=data.archiveRefs;data.archives=await new Promise((res,rej)=>{let tx=db.transaction('archives'),out=new Array(refs.length);refs.forEach((key,i)=>{if(lazy&&data.engine===VERSION&&data.archiveIndex?.[i]&&i<refs.length-1){out[i]=data.archiveIndex[i];return;}let r=tx.objectStore('archives').get(key);r.onsuccess=()=>{if(!r.result){rej(Error('Archive manquante : chargez le secours ou votre export JSON.'));return;}out[i]=r.result;};r.onerror=()=>rej(r.error);});tx.oncomplete=()=>res(out);tx.onerror=()=>rej(tx.error);});delete data.archiveRefs;delete data.archiveIndex;}
 db.close();if(!data)return null;if(needsMigration(data)){let migrated=migrate(data);await save(data,(data.schema===4?'backup-before-'+data.engine+'-':'backup-before-migration-')+slot);data=migrated;await save(data,slot);}return validate(data);
}
const needsMigration=s=>[1,2,3].includes(s?.schema)||s?.schema===4&&['3.0.0','3.1.0','3.2.0','3.3.0'].includes(s.engine);
export function migrate(data){return validate(migrateLegacy(data))}
export function parseSave(text){if(text.length>150000000)throw Error('Fichier trop volumineux');let s=JSON.parse(text);if(s?.archives?.some(a=>a.deferred)||s?.archiveRefs?.length&&!s.archives?.length)throw Error('Export incomplet : les archives ne sont pas incluses');return needsMigration(s)?migrate(s):validate(s)}

export async function listSlots(){
 await writes.catch(()=>{});const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['slots','slotMeta']),slots=tx.objectStore('slots'),metas=tx.objectStore('slotMeta');
  const values=slots.getAll(),keys=slots.getAllKeys(),metadata=metas.getAll(),metaKeys=metas.getAllKeys();
  tx.oncomplete=()=>{const m=new Map(metaKeys.result.map((k,i)=>[k,metadata.result[i]]));db.close();resolve(keys.result.map((key,i)=>{const s=values.result[i],p=s.players?.find(p=>p.id===s.hero),club=s.teams?.find(t=>t.id===s.team);return {key,name:p?.name||'Carrière',club:club?.name||'Club inconnu',season:s.season,retired:!!s.retired,engine:s.engine,savedAt:m.get(key)?.savedAt||null};}));};
  tx.onerror=()=>{db.close();reject(tx.error);};
 });
}
export function deleteSlot(slot){
 if(['auto','rollback'].includes(slot))return Promise.reject(Error('La sauvegarde automatique et son secours sont protégés.'));
 writes=writes.catch(()=>{}).then(async()=>{const db=await open();return new Promise((resolve,reject)=>{
  const tx=db.transaction(['slots','archives','slotMeta'],'readwrite'),slots=tx.objectStore('slots'),archives=tx.objectStore('archives');
  slots.delete(slot);tx.objectStore('slotMeta').delete(slot);
  const remaining=slots.getAll();remaining.onsuccess=()=>{
   const referenced=new Set(remaining.result.flatMap(s=>s.archiveRefs||[]));
   const cursor=archives.openCursor();cursor.onsuccess=()=>{const c=cursor.result;if(!c)return;if(!referenced.has(c.key))c.delete();c.continue();};
  };
  tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error||Error('Suppression interrompue'));};
 });});return writes;
}

export async function hydrateArchive(state,season){
 const i=state.archives.findIndex(a=>a.season===Number(season)),a=state.archives[i];if(!a?.deferred)return a;
 const db=await open();try{const value=await new Promise((resolve,reject)=>{const r=db.transaction('archives').objectStore('archives').get(a.archiveRef);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(!value)throw Error('Archive indisponible : chargez votre export ou le secours.');state.archives[i]=value;return value;}finally{db.close();}
}
export async function completeExport(state){for(const a of [...state.archives])if(a.deferred)await hydrateArchive(state,a.season);return state;}
