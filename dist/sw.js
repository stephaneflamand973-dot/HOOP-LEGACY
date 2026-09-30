const CACHE='hoop-legacy-3.1.0';const FILES=['./','./index.html','./app.js?v=3.1.0','./engine.js?v=3.1.0','./match.js?v=3.1.0','./progression.js?v=3.1.0','./life.js?v=3.1.0','./world.js?v=3.1.0','./nba-rosters.js?v=3.1.0','./config.js?v=3.1.0','./pack.js?v=3.1.0','./leagues.js?v=3.1.0','./storage.js?v=3.1.0','./worker.js?v=3.1.0','./style.css?v=3.1.0','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hoop-legacy-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 if(e.request.mode==='navigate'){
  // An installed game must also reopen offline from the versioned public link.
  e.respondWith(fetch(e.request).then(r=>r.ok?r:caches.match('./index.html').then(c=>c||r)).catch(()=>caches.match('./index.html')));
  return;
 }
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});
