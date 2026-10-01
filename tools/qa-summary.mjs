import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const fingerprint=crypto.createHash('sha256').update(['engine','match','world','life','progression','config','leagues','legacy'].map(n=>fs.readFileSync('dist/'+n+'.js','utf8')).join('')).digest('hex');
const reports=[2026,973].map(seed=>JSON.parse(fs.readFileSync('tests/long-run-'+seed+'.json')));
for(const r of reports){assert.equal(r.fingerprint,fingerprint);assert.equal(r.checkpoints.length,30);}
const browser=JSON.parse(fs.readFileSync('test-results/mobile-result.json'));
const upgrades=['3.0.0','3.1.0'].map(v=>JSON.parse(fs.readFileSync('test-results/upgrade-'+v+'-result.json')));
assert.equal(browser.longSave.archives,30);assert.equal(browser.longSave.continued,true);assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.overflows,[]);
for(const upgrade of upgrades){assert.equal(upgrade.matchPreserved,true);assert.equal(upgrade.legacyIdempotent,true);assert.deepEqual(upgrade.errors,[]);}
const testOutput=fs.readFileSync('test-results.txt','utf8'),tests=Number(testOutput.match(/(?:#|ℹ)\s*tests\s+(\d+)/)?.[1]);
assert.ok(tests>=28);assert.match(testOutput,/(?:#|ℹ)\s*fail\s+0\b/);
const latest=reports.map(r=>r.checkpoints.at(-1));
const row=(label,values)=>'| '+label+' | '+values.join(' | ')+' |';
const lines=[
'# HOOP LEGACY V3.2 — validation','',
`${tests} tests fonctionnels, deux campagnes de 30 saisons, reprise d’une sauvegarde longue et mise à jour depuis les moteurs V3.0 et V3.1 originaux.`,
'', '## Campagnes complètes','',
'Empreinte des modules : '+fingerprint+'.','',
'| Mesure | Seed 2026 | Seed 973 |','|---|---:|---:|',
row('Saisons complètes',reports.map(r=>r.checkpoints.length)),
row('JSON final, millions de caractères',reports.map(r=>r.saveMB)),
row('Accomplissements uniques',latest.map(r=>r.accomplishments)),
row('Rivalités suivies',latest.map(r=>r.rivalries)),
row('Général NBA moyen à la saison 30',latest.map(r=>r.nbaMean)),
row('Points NBA moyens par équipe',latest.map(r=>r.score)),
row('Franchises championnes différentes',reports.map(r=>Object.keys(r.champions).length)),
row('Maximum de titres par franchise',reports.map(r=>Math.max(...Object.values(r.champions)))),
row('Général du héros après trois saisons professionnelles',reports.map(r=>r.checkpoints[5].hero)),
row('Général du héros après cinq saisons professionnelles',reports.map(r=>r.checkpoints[7].hero)),
row('Général du héros à 46 ans',latest.map(r=>r.hero)),
'',
'Chaque année contrôle les neuf champions, scores, effectifs, attributs et archives. Le total des confrontations suivies doit correspondre exactement au nombre de matchs du héros ; chaque saison doit posséder un seul bilan et chaque accomplissement un seul identifiant. Le banc refuse plus de quinze titres pour une même franchise.',
'', '## Nouveautés vérifiées','',
'- Ambition proposée automatiquement, choix libre avant le premier match, puis objectifs fixés pour la saison. Aucun bonus d’attribut, tirage aléatoire ou dialogue bloquant ajouté.',
'- Matchs joués, victoires, performances, playoffs et titres décomptés une seule fois. Une absence ne crédite aucun duel ni exploit personnel.',
'- Rivalités issues des confrontations serrées et des phases finales, bilan des séries, identité conservée après transfert.',
'- Enjeux de playoffs : match éliminatoire, balle de qualification, balle de titre et match décisif.',
'- Bilans annuels conservés, totaux sans double décompte, accomplissements persistants, records datés lorsque les données existent.',
'- Rendus des panneaux sans mutation de la sauvegarde ni de l’aléatoire.',
'', '## Sauvegardes et mobile','',
'- Reprise à mi-match depuis V3.0 et V3.1 avec le moteur original, ancien cache actif et copie de secours versionnée. Résultat final strictement identique au moteur précédent.',
'- Anciennes statistiques récupérées sans inventer les dates, rivalités ou doubles-doubles absents des archives.',
'- Création, ambition, cinq onglets, match, semaine simulée, sauvegarde et réouverture hors ligne.',
'- Chromium 390 × 844, 320 × 740 et 1440 × 1000 ; aucun débordement horizontal détecté dans les écrans contrôlés.',
'- Import de trente saisons, bilans précédents, calendrier de la saison 1, reprise puis rechargement sans perte d’archives.',
'', 'Résultat navigateur : '+JSON.stringify(browser)+'.','',
...upgrades.flatMap(r=>['Migration : '+JSON.stringify(r)+'.','']),
'## Limites','',
'Deux seeds et deux parcours NBA ne couvrent pas tous les profils ou ligues. Les vérifications confirment la cohérence des scénarios contrôlés ; le plaisir et le réalisme de toutes les carrières restent à évaluer en jouant. Les objectifs sont des repères facultatifs et les rivalités conservent une mémoire sportive, sans modifier artificiellement les scores.',
'',
'Les essais mobiles utilisent Chromium. Safari et l’installation sur un iPhone physique restent à vérifier. Les archives antérieures à la V3.2 n’ont pas les feuilles de match nécessaires pour reconstituer chaque ancienne rivalité ou double-double.',
''
];fs.writeFileSync('TEST-REPORT.md',lines.join('\n'));
console.log('QA_SUMMARY '+JSON.stringify({fingerprint,tests,worlds:reports.map(r=>({seed:r.seed,seasons:r.checkpoints.length,last:r.checkpoints.at(-1)})),browser,upgrades}));
