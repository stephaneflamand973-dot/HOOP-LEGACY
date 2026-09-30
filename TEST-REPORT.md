# HOOP LEGACY V3.1 — validation

20 tests fonctionnels, deux campagnes de 30 saisons, reprise d’une sauvegarde longue, mise à jour depuis la V3 et contrôles Chromium mobiles.

La validation est rejouée sur GitHub Actions avant la publication. Les sorties des tests, rapports et captures sont conservés dans la campagne CI.

## Campagnes complètes

Empreinte des modules : 796196906f4a7d47386f62cbea3bafe6af2d7c50bdf145125c5e753903f3a149.

| Mesure | Seed 2026 | Seed 973 |
|---|---:|---:|
| Saisons complètes | 30 | 30 |
| Temps du banc, secondes | 280.3 | 284.9 |
| JSON final, millions de caractères | 38.22 | 38.26 |
| Général NBA moyen à la saison 30 | 78.3 | 78 |
| IA NBA à 90 ou plus | 32 | 21 |
| Points NBA moyens par équipe | 118.9 | 117.8 |
| Franchises championnes différentes | 13 | 14 |
| Maximum de titres par franchise | 10 | 8 |
| Général du héros après trois saisons professionnelles | 96 | 97 |
| Général du héros après cinq saisons professionnelles | 99 | 99 |
| Général du héros à 46 ans | 95 | 95 |
| Vitesse à 46 ans | 82 | 82 |
| Trois points à 46 ans | 98 | 98 |

Les rapports annuels détaillés sont dans tests/long-run-2026.json et tests/long-run-973.json ; la référence V3 est conservée dans tests/v3.0/. Les carrières passent par le lycée, l’université et la NBA avec des décisions déterministes. Chaque année contrôle les neuf champions, les scores, les effectifs et les attributs. Le banc refuse plus de quinze titres pour une même franchise.

La première calibration V3.1 avait donné 16 à 17 titres à la franchise du héros. Elle a été corrigée en faisant émerger quelques prospects exceptionnels, puis les campagnes ont été intégralement relancées avec le même seuil.

## Couverture fonctionnelle et navigateur

- Cohérence des calendriers, scores, tirs et minutes ; trois présentations et reprise à mi-match.
- Même chronologie, RNG, blessures et XP à décisions égales, quel que soit le rythme d’avance.
- XP par domaine, efficacité, coût du physique avec l’âge et maximum commun de 99.
- Développement IA selon minutes, staff et maturation ; sélection de draft persistante.
- Migration V1/V2/V3, secours IndexedDB, sauvegarde atomique et archives séparées.
- Le contrôle de migration emploie aussi le moteur V3 original extrait du commit de référence, un ancien cache actif et un match partiellement joué.
- Chromium 390 × 844, 320 × 740 et 1440 × 1000 : création, navigation, match, semaine simulée, sauvegarde et hors ligne depuis le lien versionné.
- Import et reprise des trente saisons, consultation de la saison 1, nouveau bilan à 320 px et rechargement après poursuite.

Résultat navigateur : {"errors":[],"overflows":[],"viewport":"390x844, 320x740, 1440x1000","offline":true,"longSave":{"archives":30,"history":30,"day":10957,"continued":true}}.

Résultat migration : {"from":"3.0.0","to":"3.1.0","oldCache":true,"backup":"3.0.0","matchPreserved":true,"offlineVersionedLink":true,"errors":[]}.

## Limites

Deux seeds et deux parcours NBA ne couvrent pas tous les profils ou ligues. Les résultats prouvent la cohérence des scénarios contrôlés, pas le réalisme ou le plaisir de toutes les carrières. Le héros conserve volontairement une progression généreuse et un déclin léger. Les joueurs IA déjà créés dans une sauvegarde V3 ne sont pas recalibrés rétroactivement.

Les tests mobiles utilisent Chromium ; Safari et l’installation sur un iPhone physique restent à vérifier. Les mesures de vitesse et de taille ne représentent pas les performances d’un iPhone. Les marchés et contrats restent simplifiés.
