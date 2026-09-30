import test from 'node:test';
import assert from 'node:assert/strict';
// Minimal DOM/IndexedDB contract harness. This is NOT browser or layout testing.
const records=new Map();let html='',elements=new Map(),actions=[];
function element(attrs=''){return {value:(attrs.match(/value="([^"]*)"/)||[])[1]||'',disabled:false,checked:attrs.includes('checked'),dataset:{},textContent:'',addEventListener(){},click(){}}}
const root={get innerHTML(){return html},set innerHTML(v){html=v;elements=new Map([['app',root],['toast',toastEl]]);actions=[];for(let m of v.matchAll(/<[^>]+id="([^"]+)"[^>]*>/g))elements.set(m[1],element(m[0]));for(let m of v.matchAll(/<select[^>]+id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){let opts=[...m[2].matchAll(/<option([^>]*)>([^<]*)<\/option>/g)],o=opts.find(o=>o[1].includes('selected'))||opts[0];elements.get(m[1]).value=o?(o[1].match(/value="([^"]*)"/)||[])[1]||o[2]:''}for(let m of v.matchAll(/<button[^>]+data-action="([^"]+)"[^>]*>/g)){let el=element(m[0]);el.dataset.action=m[1];el.disabled=/\sdisabled/.test(m[0]);actions.push(el)}}};
const toastEl=element();elements.set('app',root);elements.set('toast',toastEl);
globalThis.document={getElementById:id=>elements.get(id)||null,querySelectorAll:q=>q==='[data-action]'?actions:[],querySelector:()=>element(),createElement:()=>element()};
globalThis.window={addEventListener(){}};Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});globalThis.confirm=()=>true;
globalThis.indexedDB=(await import('fake-indexeddb')).indexedDB;
const {load}=await import('../dist/storage.js');
async function click(name){let button=actions.find(a=>a.dataset.action===name);assert.ok(button,`Bouton ${name} présent`);assert.equal(button.disabled,false,`Bouton ${name} activé`);await button.onclick()}
test('parcours interface : création, cinq sections, entraînement, match, sauvegarde et reprise',async()=>{
 await import('../dist/app.js?ui-test');assert.match(html,/Chaque légende/);
 for(let i=0;i<6;i++)await click('next-step');await click('create');assert.match(html,/Le prochain chapitre/);assert.ok(await load());
 for(let t of ['player','career','life','league','more','home']){await click('tab:'+t);assert.ok(html.length>1000)}
 await click('tab:player');for(let t of ['badges','tech','health','attrs']){await click('sub:'+t);assert.ok(!html.includes('undefined'))}
 await click('tab:career');elements.get('activity').value='video';await elements.get('activity').onchange({target:elements.get('activity')});assert.equal((await load()).activity,'video');
 await click('tab:home');await click('advance');assert.match(html,/MATCH AUTOMATIQUE/);await click('watch');assert.equal((await load()).match.n,40);await click('finish');assert.equal((await load()).round,1);assert.equal((await load()).match,null);
 await click('tab:league');for(let t of ['Calendrier','Équipes','Statistiques','Draft & marché','Classement']){await click('league:'+t);assert.ok(!html.includes('undefined'))}
 let saved=structuredClone(await load());await import('../dist/app.js?ui-restored');assert.match(html,/Le prochain chapitre/);assert.deepEqual(await load(),saved);assert.match(html,/Dernier match/);
});
