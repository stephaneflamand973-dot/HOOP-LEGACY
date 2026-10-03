import {ADVANCE_MODES,destinationLabel} from './simulation.js?v=3.5.0';
import {archivedRounds,seriesStakes} from './postseason.js?v=3.5.0';
import {seasonStints} from './career-ledger.js?v=3.5.0';
import {leagueDef,REFERENCE} from './leagues.js?v=3.5.0';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const club=(s,id)=>s.teams.find(t=>t.id===id)?.name||'Club';
const date=day=>new Date(Date.UTC(REFERENCE.baseYear,8,1+day)).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
const button=(label,action,disabled=false)=>`<button class="secondary" data-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
export function advanceOptions(s) { return ADVANCE_MODES.map(([id,label])=>`<option value="${id}" ${s.simulation.mode===id?'selected':''}>${label}</option>`).join(''); }
export function advanceHint(s) { return destinationLabel(s)?`<p class="muted advance-hint">${esc(destinationLabel(s))}</p>`:''; }
export function sportNotice(s) {
  const n=s.sportEvents?.notice;
  if (!n||s.retired) return '';
  return `<section class="panel sport-notice" aria-label="Étape sportive"><p class="eyebrow">ÉTAPE SPORTIVE · SIMULATION EN PAUSE</p>${n.items.map(e=>`<h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>`).join('')}<div class="button-row">${button('Reprendre →','advance',!!s.pending)}${button('Voir les playoffs','playoffs')}</div>${advanceHint(s)}${s.pending?'<p class="muted">Réglez d’abord la décision ci-dessus.</p>':''}</section>`;
}
export function playoffLink(s) {
  const active=s.competitions.filter(c=>c.post&&c.records[s.team]);
  return active.length?`<section class="panel playoff-entry"><div><p class="eyebrow">LA COURSE AU TITRE</p><h3>${active.some(c=>c.phase==='Terminée')?'Le parcours reste consultable':'Suivez chaque tour'}</h3><p class="muted">Séries, résultats et prochain enjeu · ${active.map(c=>esc(leagueDef(c.id).name)).join(' / ')}</p></div>${button('Ouvrir le centre des playoffs →','playoffs')}</section>`:'';
}
export function playoffsView(s,lid,{season=null,conference='Tous',round='all'}={}) {
  const year=Number(season)||s.season,archive=s.archives.find(a=>a.season===year);
  const c=year===s.season?s.competitions.find(c=>c.id===lid):archive?.competitions?.find(c=>c.id===lid);
  if (!c) return '<p>Cette compétition n’est pas disponible dans cette archive.</p>';
  const games=c.schedule||c.games,rounds=archivedRounds(year,c),post=c.post;
  const selection=`<div class="playoff-filters"><label>Saison<select id="playoff-season"><option value="" ${year===s.season?'selected':''}>Saison actuelle · ${s.season}</option>${s.archives.map(a=>`<option value="${a.season}" ${year===a.season?'selected':''}>Saison ${a.season}</option>`).join('')}</select></label>${lid==='nba'?`<label>Conférence<select id="playoff-conference">${['Tous','Est','Ouest','Interconférences'].map(v=>`<option ${v===conference?'selected':''}>${v}</option>`).join('')}</select></label>`:''}<label>Tour<select id="playoff-round"><option value="all">Tous les tours</option>${rounds.map(r=>`<option value="${r.index}" ${String(r.index)===round?'selected':''}>${esc(r.name)}</option>`).join('')}</select></label></div>`;
  const header=`<div class="section-title"><h2>Playoffs · ${esc(leagueDef(lid).name)}</h2><span class="pill">S${year}</span></div>${selection}`;
  if (!post&&!rounds.length) return header+'<p>La saison régulière est en cours. Le tableau apparaîtra à la clôture du classement.</p>';
  const allSeries=rounds.flatMap(r=>r.series),mine=[...allSeries].reverse().find(p=>p.a===s.team||p.b===s.team);
  const homeStatus=c.champion?`Champion : ${club(s,c.champion)}`:mine?`${mine.name} · ${seriesStakes(mine,s.team)}`:'Le tournoi continue · toutes les équipes restent consultables.';
  const result=g=>g?.result?.score||g?.score;
  const gameRow=(g,number)=>`<li><span>${number?'M'+number+' · ':''}${date(g.day)}${g.neutral?' · terrain neutre':''}</span><span>${esc(club(s,g.home))} – ${esc(club(s,g.away))}</span><strong>${result(g)?result(g).join(' – '):'À venir'}</strong></li>`;
  const playin=games.filter(g=>g.stage==='playin'&&(conference==='Tous'||[g.home,g.away].some(id=>s.teams.find(t=>t.id===id)?.conference===conference)));
  return header+`<p class="playoff-status">${esc(homeStatus)}</p>${playin.length&&round==='all'?`<details class="playoff-round" ${post?.stage==='playin'?'open':''}><summary>Play-in · accès aux playoffs</summary><p class="muted">Le vainqueur du duel des mieux classés se qualifie. Son perdant affronte le vainqueur de l’autre duel pour la dernière place.</p><ul class="series-games">${playin.map(g=>gameRow(g)).join('')}</ul></details>`:''}${rounds.filter(r=>round==='all'||String(r.index)===round).map(r=>`<details class="playoff-round" ${round!=='all'||r.index===rounds.at(-1)?.index?'open':''}><summary>${esc(r.name)} · ${r.series.filter(p=>p.winner).length}/${r.series.length} séries terminées</summary><div class="series-grid">${r.series.filter(p=>conference==='Tous'||p.conference===conference||!p.conference&&[p.a,p.b].some(id=>s.teams.find(t=>t.id===id)?.conference===conference)).map(p=>{
    const fixtures=p.games.map(id=>games.find(g=>g.id===id)).filter(Boolean),next=fixtures.find(g=>!result(g)),mine=p.a===s.team||p.b===s.team;
    return `<article class="series-card ${mine?'your-series':''}" data-series-id="${esc(p.id)}"><p class="eyebrow">${esc(p.conference==='Tous'?'':p.conference||'Série reconstituée')} · ${p.best===1?'MATCH UNIQUE':'MEILLEUR DES '+p.best}</p>${[p.a,p.b].map((id,i)=>`<div class="series-team ${p.winner===id?'series-winner':''}"><span><small>${p.seeds?.[i]?'#'+p.seeds[i]:'—'}</small> ${esc(club(s,id))}${id===s.team?' · VOUS':''}</span><strong>${p.wins[i]}</strong></div>`).join('')}<p class="series-stakes">${esc(p.winner?'Qualifié : '+club(s,p.winner):seriesStakes(p,s.team))}</p>${next?`<p>Prochain match : <b>M${next.gameNumber||fixtures.indexOf(next)+1}</b> · ${date(next.day)}${p.neutral?' · terrain neutre':mine?' · '+(next.home===s.team?'à domicile':'à l’extérieur'):''}</p>`:!p.winner?'<p>Date du prochain match à confirmer.</p>':''}<details><summary>${fixtures.filter(g=>result(g)).length} résultat(s) · détail des matchs</summary><ul class="series-games">${fixtures.map((g,i)=>gameRow(g,g.gameNumber||i+1)).join('')}</ul>${!p.winner?'<p class="muted">Les rencontres suivantes sont programmées au fil de la série.</p>':''}</details>${p.recovered?'<p class="muted">Ancienne série reconstituée à partir des résultats conservés. Un tiret indique une tête de série non documentée.</p>':''}</article>`;
  }).join('')||'<p>Aucune série pour ce filtre.</p>'}</div></details>`).join('')}`;
}
export function masteryPanel(s) {
  const m=s.mastery;
  const labels={match:'Matchs joués',training:'Entraînement',video:'Vidéo',transfer:'Changement de club'};
  return `<section class="panel mastery-report"><p class="eyebrow">COMPRENDRE VOTRE PROGRESSION</p><h3>Maîtrise du système · ${s.system.toFixed(1)} / 100</h3><p>Les minutes réellement jouées, les séances et la vidéo font progresser votre connaissance du collectif. Elle facilite légèrement les tirs et la circulation du ballon et améliore le placement défensif.</p><div class="development-changes">${Object.entries(m.sources).map(([key,value])=>`<span>${labels[key]} <b>+${value.toFixed(1)}</b></span>`).join('')}</div><p class="muted">Gains suivis depuis le jour ${m.since}. La maîtrise se conserve d’une saison à l’autre. Un transfert conserve 85 % pour un système similaire, 65 % sinon.</p>${m.compensation?`<p class="muted">Mise à jour V3.3 : l’ancienne valeur, qui ne pouvait que diminuer, a été rétablie de ${m.compensation.from.toFixed(1)} à ${m.compensation.to}. Aucun XP ajouté.</p>`:''}<details><summary>Dernières évolutions</summary>${m.recent.slice(-8).reverse().map(e=>`<p>J${e.day} · ${labels[e.source]} : ${e.delta>=0?'+':''}${e.delta.toFixed(2)}</p>`).join('')||'<p>Les premiers gains apparaîtront après une séance ou un match joué.</p>'}</details></section>`;
}
export function stintPanel(s) {
  const stints=seasonStints(s);
  return `<details class="panel"><summary>Mes clubs cette saison · ${stints.length} passage(s)</summary>${s.careerLedger.opening?.season===s.season?'<p class="muted">Le total antérieur à la V3.3 est conservé. Sa répartition par club n’est pas documentée.</p>':''}${stints.map(t=>`<h3>${esc(club(s,t.team))}</h3><p>J${t.from} → ${t.to??'aujourd’hui'} · ${t.stats.gp} matchs joués</p>${Object.entries(t.competitions).map(([id,phases])=>`<p>${esc(leagueDef(id).name)} : ${Object.entries(phases).map(([phase,stats])=>`${{regular:'saison régulière',post:'playoffs',playin:'play-in'}[phase]} · ${stats.gp} MJ / ${stats.pts} PTS`).join(' ; ')}</p>`).join('')}`).join('')}</details>`;
}
