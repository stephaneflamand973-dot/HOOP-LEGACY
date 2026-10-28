import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,defaultBuild,hero} from '../dist/engine.js';
import {roleView,progressionView,momentsView,momentPreferences} from '../dist/v40-view.js';
import {servicesView} from '../dist/services-view.js';
test('V4 views escape records, expose services and never mutate a career',()=>{
 const s=createGame(defaultBuild());s.v40.moments.history=[{id:'x',title:'<script>alert(1)</script>',text:'<img onerror=x>',day:s.day,season:s.season}];const before=structuredClone(s);
 const html=[roleView(s),progressionView(s),momentsView(s),momentPreferences(s),servicesView(s)].join('');
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('service-open-recovery'));assert.ok(html.includes('moment-mode'));assert.deepEqual(s,before);
});
test('V4 views support injury, retirement and three recent moments',()=>{
 const s=createGame(defaultBuild());hero(s).injury=14;s.retired=true;
 s.v40.moments.history=Array.from({length:5},(_,i)=>({id:''+i,title:'Moment '+i,text:'Texte',day:s.day,season:s.season}));
 assert.ok(roleView(s).includes('14 jours'));assert.equal((momentsView(s,3).match(/class="moment"/g)||[]).length,3);assert.ok(servicesView(s).includes('disabled'));
});
