import {AMBITIONS,careerTotals,goalProgress,rivalries,nextStakes} from './legacy.js?v=3.2.0';
import {leagueDef} from './leagues.js?v=3.2.0';

const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Math.round(n).toLocaleString('fr-FR');
const club = (s,id) => s.teams.find(t=>t.id===id)?.name || 'Club';
const goals = s => s.legacy.season.goals.map(g=>{
  const value=goalProgress(s,g), complete=g.completed!==null;
  return `<article class="season-goal ${complete?'achieved':''}"><div><strong>${esc(g.title)}</strong><span>${complete?'✓ Atteint':`${fmt(value)} / ${fmt(g.target)}`}</span></div><progress max="${g.target}" value="${Math.min(g.target,value)}" aria-label="${esc(g.title)}"></progress><small>${{gp:'Matchs avec du temps de jeu',pts:'Points marqués',ast:'Passes décisives',reb:'Rebonds',wins:'Victoires lorsque vous jouez',impact:'Matchs notés 75/100 ou plus',postWins:'Victoires en playoffs ou play-in',titles:'Titres avec votre club · bilan de fin de saison'}[g.metric]}</small></article>`;
}).join('');

export function ambitionPanel(s, full=false) {
  const y=s.legacy.season, achieved=y.goals.filter(g=>g.completed!==null).length;
  if(s.retired&&!full)return '';
  return `<section class="panel ambition-panel ${full?'':'compact-ambition'}"><div class="section-title"><div><p class="eyebrow">VOTRE SAISON · ${achieved}/3 OBJECTIFS</p><h3>${esc(AMBITIONS[y.ambition])}</h3></div>${full?'':'<button class="small secondary" data-action="tab:career">Ma carrière ↗</button>'}</div>${full?`<label>Ambition de la saison<select id="season-ambition" ${y.locked||s.match||s.retired?'disabled':''}>${Object.entries(AMBITIONS).map(([id,name])=>`<option value="${id}" ${id===y.ambition?'selected':''}>${esc(name)}</option>`).join('')}</select></label><p class="muted">${y.locked?'Votre ambition est fixée pour cette saison.':'Une ambition est proposée automatiquement. Vous pouvez la changer avant votre premier match.'} Ces objectifs racontent votre saison, sans pénalité en cas d’échec.</p>`:''}<div class="season-goals">${goals(s)}</div>${y.partial?'<p class="tracking-note">Saison commencée avant la mise à jour : le suivi détaillé est partiel.</p>':''}</section>`;
}

export function stakesPanel(s,g) {
  const stakes=nextStakes(s,g);
  return stakes?`<div class="match-stakes"><b>${esc(stakes.title)}</b><span>${esc(stakes.text)}</span></div>`:'';
}

export function highlightsPanel(s) {
  const lines=[...s.competitions.filter(c=>c.champion===s.team).map(c=>'Champion · '+leagueDef(c.id).name+' · saison '+s.season),...s.legacy.lastHighlights];
  return lines.length?`<div class="match-highlights" role="status">${lines.map(line=>`<p>✦ ${esc(line)}</p>`).join('')}</div>`:'';
}

export function reviewPanel(s,full=false,season=null) {
  const r=season===null?s.legacy.reviews.at(-1):s.legacy.reviews.find(r=>r.season===season);
  if(!r || !full && s.players.find(p=>p.id===s.hero).season.gp>=3)return '';
  const complete=r.goals.filter(g=>g.completed!==null).length;
  return `<section class="panel season-review"><p class="eyebrow">BILAN · SAISON ${r.season}</p><h3>${esc(r.title)}</h3><p>${esc(club(s,r.team))} · ${esc(leagueDef(r.league).name)}</p><div class="review-numbers"><span><b>${r.stats.gp}</b> matchs</span><span><b>${r.stats.gp?(r.stats.pts/r.stats.gp).toFixed(1):'—'}</b> pts / match</span><span><b>${complete}/3</b> objectifs</span></div>${r.titles.length?`<p class="achievement-line">Champion · ${r.titles.map(id=>esc(leagueDef(id).name)).join(' · ')}</p>`:''}${r.mvp?'<p class="achievement-line">MVP de votre championnat</p>':''}${full?`<details><summary>Ce qui a marqué cette saison</summary>${r.goals.map(g=>`<p>${g.completed!==null?'✓':'○'} ${esc(g.title)} · ${fmt(g.value)} / ${fmt(g.target)}</p>`).join('')}${r.moments.map(id=>s.legacy.milestones.find(m=>m.id===id)).filter(Boolean).map(m=>`<p>✦ ${esc(m.title)}</p>`).join('')}${r.partial?'<p>Suivi détaillé commencé en cours de saison.</p>':''}</details>`:''}${full&&season===null&&s.legacy.reviews.length>1?`<details><summary>Les bilans précédents · ${s.legacy.reviews.length-1}</summary>${s.legacy.reviews.slice(0,-1).reverse().map(r=>reviewPanel(s,true,r.season)).join('')}</details>`:''}</section>`;
}

function rivalCard(s,r) {
  const leader=r.leader, active=leader && s.teams.find(t=>t.roster.includes(leader.id));
  return `<article class="rival-card"><div class="section-title"><h4>${esc(r.name)}</h4><span class="rival-score">${r.wins} V · ${r.gp-r.wins} D</span></div><p>${r.gp} confrontations · ${r.close} match(s) à cinq points ou moins${r.post?' · '+r.post+' en phase finale':''}</p><p class="muted">Dernier duel : ${r.last.score.join('–')} · S${r.last.season}. ${r.seriesWins+r.seriesLosses?`Séries remportées / perdues : ${r.seriesWins} / ${r.seriesLosses}.`:''}</p>${leader?`<details><summary>Le visage du dernier duel</summary><p>${esc(leader.name)} · ${leader.pts} points ce soir-là.${active?.id!==r.team?` ${active?'Joue désormais à '+esc(active.name):'A quitté les effectifs actifs'}.`:''}</p></details>`:''}</article>`;
}

function momentRow(m) {
  return `<li><span class="moment-icon">${m.kind==='title'?'★':'✦'}</span><div><strong>${esc(m.title)}</strong><small>${m.recovered?'Retrouvé dans votre historique':`Saison ${m.season} · jour ${m.day-(m.season-1)*365}`}</small></div></li>`;
}

export function legacyPanel(s) {
  const l=s.legacy, totals=careerTotals(s), rivals=rivalries(s), moments=[...l.milestones].reverse();
  return `<section class="panel legacy-panel"><p class="eyebrow">${s.retired?'VOTRE HÉRITAGE':'VOTRE EMPREINTE'}</p><h3>Une carrière qui reste.</h3><div class="legacy-totals">${[['Matchs',totals.gp],['Points',totals.pts],['Passes',totals.ast],['Rebonds',totals.reb]].map(([name,n])=>`<div><b>${fmt(n)}</b><span>${name}</span></div>`).join('')}</div><p class="tracking-note">Tous championnats, saisons régulières et phases finales.</p><div class="section-title"><h3>Accomplissements</h3><span class="pill">${moments.length}</span></div>${moments.length?`<ul class="career-moments">${moments.slice(0,3).map(momentRow).join('')}</ul>${moments.length>3?`<details><summary>Voir les ${moments.length-3} autres accomplissements</summary><ul class="career-moments">${moments.slice(3).map(momentRow).join('')}</ul></details>`:''}`:'<p class="muted">Premier match, performances marquantes, titres : votre histoire se construit sur le terrain.</p>'}<details><summary>Mes records et mes matchs complets</summary><div class="record-grid">${Object.entries(l.records).map(([key,r])=>`<div><b>${r.value}</b><span>${{pts:'points',reb:'rebonds',ast:'passes',stl:'interceptions',blk:'contres'}[key]||esc(key)}</span><small>${r.opponent?`${esc(club(s,r.opponent))} · S${r.season}`:'Record conservé de votre historique'}</small></div>`).join('')}</div><p>${l.doubleDoubles} double(s)-double(s) · ${l.tripleDoubles} triple(s)-double(s).</p><p>Ces deux compteurs et les rivalités sont suivis depuis S${l.since.season}, jour ${l.since.day-(l.since.season-1)*365}.</p></details></section><section class="panel rivalry-panel"><p class="eyebrow">DES ADVERSAIRES, UNE HISTOIRE</p><h3>Vos rivalités</h3><p class="muted">Les duels serrés et les phases finales font naître les rivalités. Le bilan compte les matchs auxquels vous avez participé, même après un transfert.</p>${rivals.length?rivals.slice(0,3).map(r=>rivalCard(s,r)).join(''):'<p>Vos prochains matchs écriront les premières confrontations marquantes.</p>'}${rivals.length>3?`<details><summary>Toutes mes rivalités · ${rivals.length}</summary>${rivals.slice(3).map(r=>rivalCard(s,r)).join('')}</details>`:''}</section>`;
}
