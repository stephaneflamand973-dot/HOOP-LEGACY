// V3.9 interface revision 1: deadlines and precise cancellation focus.
const CACHE='hoop-legacy-4.0.0';const FILES=['./career-moments.js?v=4.0.0','./v40-view.js?v=4.0.0','./services-view.js?v=4.0.0','./services.js?v=4.0.0','./role.js?v=4.0.0','./v40-rules.js?v=4.0.0','./match-v38.js?v=4.0.0','./v40-state.js?v=4.0.0','./representation-view.js?v=4.0.0','./representation-catalog.js?v=4.0.0','./representation-state.js?v=4.0.0','./representation.js?v=4.0.0','./negotiation-rules.js?v=4.0.0','./negotiation.js?v=4.0.0','./v38-view.js?v=4.0.0','./collective-state.js?v=4.0.0','./collective-catalog.js?v=4.0.0','./collective.js?v=4.0.0','./collective-match.js?v=4.0.0','./match-v35.js?v=4.0.0','./v37-view.js?v=4.0.0','./environment.js?v=4.0.0','./v36-view.js?v=4.0.0','./finance.js?v=4.0.0','./life-context.js?v=4.0.0','./club-project.js?v=4.0.0','./v35-view.js?v=4.0.0','./match-v34.js?v=4.0.0','./worker-state.js?v=4.0.0','./statistics.js?v=4.0.0','./career-plan.js?v=4.0.0','./chapters.js?v=4.0.0','./physical.js?v=4.0.0','./v34-view.js?v=4.0.0','./match-v33.js?v=4.0.0','./commands.js?v=4.0.0','./simulation.js?v=4.0.0','./sport-events.js?v=4.0.0','./system.js?v=4.0.0','./postseason.js?v=4.0.0','./career-ledger.js?v=4.0.0','./match-v32.js?v=4.0.0','./match-effects.js?v=4.0.0','./v33-view.js?v=4.0.0','./','./index.html','./app.js?v=4.0.0','./engine.js?v=4.0.0','./legacy.js?v=4.0.0','./legacy-view.js?v=4.0.0','./match.js?v=4.0.0','./progression.js?v=4.0.0','./life.js?v=4.0.0','./world.js?v=4.0.0','./nba-rosters.js?v=4.0.0','./config.js?v=4.0.0','./pack.js?v=4.0.0','./leagues.js?v=4.0.0','./storage.js?v=4.0.0','./worker.js?v=4.0.0','./style.css?v=4.0.0','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hoop-legacy-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 if(e.request.mode==='navigate'){
  // An installed game must also reopen offline from the versioned public link.
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>r.ok?r:caches.match('./index.html').then(c=>c||r)).catch(()=>caches.match('./index.html')));
  return;
 }
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});
