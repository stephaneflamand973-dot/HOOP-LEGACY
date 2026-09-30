import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const fingerprint=crypto.createHash('sha256').update(['engine','match','world','life','progression','config','leagues'].map(n=>fs.readFileSync('dist/'+n+'.js','utf8')).join('')).digest('hex');
const reports=[2026,973].map(seed=>JSON.parse(fs.readFileSync('tests/long-run-'+seed+'.json')));
for(const r of reports){assert.equal(r.fingerprint,fingerprint);assert.equal(r.checkpoints.length,30);}
const browser=JSON.parse(fs.readFileSync('test-results/mobile-result.json')),upgrade=JSON.parse(fs.readFileSync('test-results/upgrade-result.json'));
assert.equal(browser.longSave.archives,30);assert.equal(browser.longSave.continued,true);assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.overflows,[]);assert.equal(upgrade.matchPreserved,true);
const latest=reports.map(r=>r.checkpoints.at(-1));
const row=(label,values)=>'| '+label+' | '+values.join(' | ')+' |';
const lines=[
'# HOOP LEGACY V3.1 — validation',
'',
'20 tests fonctionnels, deux campagnes de 30 saisons, reprise d’une sauvegarde longue, mise à jour depuis la V3 et contrôles Chromium mobiles.',
'',
'La validation est rejouée sur GitHub Actions avant la publication. Les sorties des tests, rapports et captures sont conservés dans la campagne CI.',
'',
'## Campagnes complètes',
'',
'Empreinte des modules : '+fingerprint+'.',
'',
'| Mesure | Seed 2026 | Seed 973 |','|---|---:|---:|',
row('Saisons complètes',reports.map(r=>r.checkpoints.length)),
row('Temps du banc, secondes',reports.map(r=>r.seconds)),
row('JSON final, millions de caractères',reports.map(r=>r.saveMB)),
row('Général NBA moyen à la saison 30',latest.map(r=>r.nbaMean)),
row('IA NBA à 90 ou plus',latest.map(r=>r.nbaAi90)),
row('Points NBA moyens par équipe',latest.map(r=>r.score)),
row('Franchises championnes différentes',reports.map(r=>Object.keys(r.champions).length)),
row('Maximum de titres par franchise',reports.map(r=>Math.max(...Object.values(r.champions)))),
row('Général du héros après trois saisons professionnelles',reports.map(r=>r.checkpoints[5].hero)),
row('Général du héros après cinq saisons professionnelles',reports.map(r=>r.checkpoints[7].hero)),
row('Général du héros à 46 ans',latest.map(r=>r.hero)),
row('Vitesse à 46 ans',latest.map(r=>Math.round(r.speed))),
row('Trois points à 46 ans',latest.map(r=>r.three)),
'',
'Les rapports annuels détaillés sont dans tests/long-run-2026.json et tests/long-run-973.json ; la référence V3 est conservée dans tests/v3.0/. Les carrières passent par le lycée, l’université et la NBA avec des décisions déterministes. Chaque année contrôle les neuf champions, les scores, les effectifs et les attributs. Le banc refuse plus de quinze titres pour une même franchise.',
'',
'La première calibration V3.1 avait donné 16 à 17 titres à la franchise du héros. Elle a été corrigée en faisant émerger quelques prospects exceptionnels, puis les campagnes ont été intégralement relancées avec le même seuil.',
'',
'## Couverture fonctionnelle et navigateur',
'',
'- Cohérence des calendriers, scores, tirs et minutes ; trois présentations et reprise à mi-match.',
'- Même chronologie, RNG, blessures et XP à décisions égales, quel que soit le rythme d’avance.',
'- XP par domaine, efficacité, coût du physique avec l’âge et maximum commun de 99.',
'- Développement IA selon minutes, staff et maturation ; sélection de draft persistante.',
'- Migration V1/V2/V3, secours IndexedDB, sauvegarde atomique et archives séparées.',
'- Le contrôle de migration emploie aussi le moteur V3 original extrait du commit de référence, un ancien cache actif et un match partiellement joué.',
'- Chromium 390 × 844, 320 × 740 et 1440 × 1000 : création, navigation, match, semaine simulée, sauvegarde et hors ligne depuis le lien versionné.',
'- Import et reprise des trente saisons, consultation de la saison 1, nouveau bilan à 320 px et rechargement après poursuite.',
'',
'Résultat navigateur : '+JSON.stringify(browser)+'.',
'',
'Résultat migration : '+JSON.stringify(upgrade)+'.',
'',
'## Limites',
'',
'Deux seeds et deux parcours NBA ne couvrent pas tous les profils ou ligues. Les résultats prouvent la cohérence des scénarios contrôlés, pas le réalisme ou le plaisir de toutes les carrières. Le héros conserve volontairement une progression généreuse et un déclin léger. Les joueurs IA déjà créés dans une sauvegarde V3 ne sont pas recalibrés rétroactivement.',
'',
'Les tests mobiles utilisent Chromium ; Safari et l’installation sur un iPhone physique restent à vérifier. Les mesures de vitesse et de taille ne représentent pas les performances d’un iPhone. Les marchés et contrats restent simplifiés.',
''
];fs.writeFileSync('TEST-REPORT.md',lines.join('\n'));
console.log('QA_SUMMARY '+JSON.stringify({fingerprint,tests:20,worlds:reports.map(r=>({seed:r.seed,seasons:r.checkpoints.length,last:r.checkpoints.at(-1),champions:r.champions})),browser,upgrade}));
