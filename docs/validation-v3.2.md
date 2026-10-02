# HOOP LEGACY V3.2 — validation

28 tests fonctionnels, deux campagnes de 30 saisons, reprise d’une sauvegarde longue et mise à jour depuis les moteurs V3.0 et V3.1 originaux.

## Campagnes complètes

Empreinte des modules : 68af0efa47dca693104b21d0583cb9aea5968f6027fa2d0c136cc7be8b9d5ac0.

| Mesure | Seed 2026 | Seed 973 |
|---|---:|---:|
| Saisons complètes | 30 | 30 |
| JSON final, millions de caractères | 38.27 | 38.31 |
| Accomplissements uniques | 33 | 33 |
| Rivalités suivies | 38 | 37 |
| Général NBA moyen à la saison 30 | 78.3 | 78 |
| Points NBA moyens par équipe | 118.9 | 117.8 |
| Franchises championnes différentes | 13 | 14 |
| Maximum de titres par franchise | 10 | 8 |
| Général du héros après trois saisons professionnelles | 96 | 97 |
| Général du héros après cinq saisons professionnelles | 99 | 99 |
| Général du héros à 46 ans | 95 | 95 |

Chaque année contrôle les neuf champions, scores, effectifs, attributs et archives. Le total des confrontations suivies doit correspondre exactement au nombre de matchs du héros ; chaque saison doit posséder un seul bilan et chaque accomplissement un seul identifiant. Le banc refuse plus de quinze titres pour une même franchise.

## Nouveautés vérifiées

- Ambition proposée automatiquement, choix libre avant le premier match, puis objectifs fixés pour la saison. Aucun bonus d’attribut, tirage aléatoire ou dialogue bloquant ajouté.
- Matchs joués, victoires, performances, playoffs et titres décomptés une seule fois. Une absence ne crédite aucun duel ni exploit personnel.
- Rivalités issues des confrontations serrées et des phases finales, bilan des séries, identité conservée après transfert.
- Enjeux de playoffs : match éliminatoire, balle de qualification, balle de titre et match décisif.
- Bilans annuels conservés, totaux sans double décompte, accomplissements persistants, records datés lorsque les données existent.
- Rendus des panneaux sans mutation de la sauvegarde ni de l’aléatoire.

## Sauvegardes et mobile

- Reprise à mi-match depuis V3.0 et V3.1 avec le moteur original, ancien cache actif et copie de secours versionnée. Résultat final strictement identique au moteur précédent.
- Anciennes statistiques récupérées sans inventer les dates, rivalités ou doubles-doubles absents des archives.
- Création, ambition, cinq onglets, match, semaine simulée, sauvegarde et réouverture hors ligne.
- Chromium 390 × 844, 320 × 740 et 1440 × 1000 ; aucun débordement horizontal détecté dans les écrans contrôlés.
- Import de trente saisons, bilans précédents, calendrier de la saison 1, reprise puis rechargement sans perte d’archives.

Résultat navigateur : {"errors":[],"overflows":[],"viewport":"390x844, 320x740, 1440x1000","offline":true,"longSave":{"archives":30,"history":30,"day":10957,"continued":true}}.

Migration : {"from":"3.0.0","to":"3.2.0","oldCache":true,"backup":"3.0.0","matchPreserved":true,"offlineVersionedLink":true,"legacyIdempotent":true,"errors":[]}.

Migration : {"from":"3.1.0","to":"3.2.0","oldCache":true,"backup":"3.1.0","matchPreserved":true,"offlineVersionedLink":true,"legacyIdempotent":true,"errors":[]}.

## Limites

Deux seeds et deux parcours NBA ne couvrent pas tous les profils ou ligues. Les vérifications confirment la cohérence des scénarios contrôlés ; le plaisir et le réalisme de toutes les carrières restent à évaluer en jouant. Les objectifs sont des repères facultatifs et les rivalités conservent une mémoire sportive, sans modifier artificiellement les scores.

Les essais mobiles utilisent Chromium. Safari et l’installation sur un iPhone physique restent à vérifier. Les archives antérieures à la V3.2 n’ont pas les feuilles de match nécessaires pour reconstituer chaque ancienne rivalité ou double-double.
