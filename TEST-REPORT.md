# Vérification HOOP LEGACY 3.0.0

Exécution : 30 septembre 2026. Version du moteur 3.0.0 ; sauvegarde schéma 4.

## Tests fonctionnels

`npm test` : **15 tests réussis, 0 échec**. Sortie conservée dans `test-results.txt`.

- Neuf compétitions : volume de rencontres par équipe, 82 matchs NBA dont 41 à domicile, clubs communs aux compétitions sans double réservation et identités uniques.
- Points, tirs et minutes issus des possessions, dans les formats 32, 40 et 48 minutes. Un résultat ne peut être comptabilisé deux fois.
- Présentations rapide, moments clés et détaillée donnant le même résultat. Sauvegarde à mi-match et reprise reproductibles ; anciennes commandes de possession ignorées.
- Avance quotidienne, hebdomadaire et grand saut : mêmes résultats, blessures, XP et état aléatoire à date égale.
- XP par domaine, efficacité individuelle et limite commune de 99 ; migration de véritables fixtures V1 et V2, conservation du joueur et des résultats, rejet des formats invalides.
- Draft sélectionnée/non sélectionnée, offres internationales et identité préservée ; argent et actions personnelles sans duplication.
- Vieillissement différencié ; arrêt sur une blessure ou une décision importante.
- Marché IA après expiration simultanée des contrats : suppression du privilège permanent du premier club du catalogue.
- Ressources PWA présentes ; worker interrompu sur un état cohérent ; stockage des archives et secours IndexedDB ; parcours complet dans le harnais DOM.

## Navigateur et sauvegardes longues

Contrôle avec Chromium Linux, fenêtres **390 × 844, 320 × 740 et 1440 × 1000** :

- Création, navigation dans les cinq destinations et le menu, match automatique, avance de sept jours, sauvegarde et rechargement.
- Aucun débordement horizontal détecté sur les écrans parcourus ; captures mobiles et bureau inspectées.
- Rechargement hors ligne après installation du service worker réussi. Aucune erreur JavaScript détectée.
- Correction d'une interaction rapide où le rendu après sauvegarde pouvait remplacer le choix d'avance temporelle. Les commandes attendent maintenant la fin de l'action en cours.
- Import d'une carrière de **30 saisons**, sauvegarde IndexedDB, rechargement, consultation de la saison 1, signature d'un contrat, reprise jusqu'au jour 10 957 puis nouveau rechargement : **30 archives et 30 bilans conservés**.
- Transition d'un cache V2 actif vers les ressources versionnées V3 : migration schéma 3 → 4, attributs conservés, copie de secours de l'ancienne sauvegarde retrouvée.

Commande reproductible : `npm run test:browser`, avec `CHROMIUM_EXECUTABLE_PATH` si nécessaire. `QA_LONG_SAVE` peut désigner un export JSON de carrière pour exercer également le scénario de trente saisons. Les captures et le résumé sont écrits dans `test-results/` (non versionné).

Ces contrôles ne remplacent pas un essai sur Safari/iPhone physique. L'installation sur l'écran d'accueil et les performances thermiques/mémoire d'un iPhone restent à tester.

## Deux mondes de trente saisons

Le banc `tools/long-run.mjs` déroule le lycée, l'université, la draft puis la carrière professionnelle. Il accepte les décisions de manière déterministe et continue jusqu'à trente bilans annuels. Les rapports détaillés sont versionnés dans `tests/long-run-2026.json` et `tests/long-run-973.json`.

Empreinte des modules de simulation : `3e4236bfb0debf11778174f05e7eda4c587cf14c8eed979930bf90642cb75f33`.

| Mesure | Seed 2026 | Seed 973 |
|---|---:|---:|
| Saisons complètes | 30 | 30 |
| Temps du banc dans cet environnement | 234 s | 233 s |
| Taille JSON finale, millions de caractères | 38,42 | 38,44 |
| Général moyen NBA, saison 1 → 30 | 74,3 → 82,9 | 74,3 → 82,6 |
| Points NBA moyens par équipe/match, saison 1 → 30 | 110,6 → 121,5 | 110,1 → 121,0 |
| Franchises championnes différentes | 14 | 12 |
| Plus grand nombre de titres d'une franchise | 13 | 12 |
| Général du héros, saisons 1 / 5 / 10 / 30 | 61 / 94 / 99 / 98 | 61 / 95 / 99 / 98 |

Chaque saison contrôle : champion et scores renseignés dans les neuf compétitions, effectifs de 10 à 20 joueurs, attributs valides et score NBA moyen compris entre 80 et 150. Les jalons 1, 5, 10, 20 et 30 sont enregistrés ; les checkpoints intermédiaires permettent une reprise du banc.

Un premier passage avait révélé une concentration artificielle des recrues chez Boston, servi en premier à chaque marché. Le recrutement procède désormais par tours d'une signature par club, avec ordre annuel déterministe variable. Les deux rapports ci-dessus proviennent de la version corrigée.

## Interprétation et limites d'équilibrage

Les tests vérifient la cohérence et la reprise des données, pas une certification de réalisme ou de plaisir. Deux seeds ne représentent pas toutes les carrières, blessures et créations possibles. Les temps mesurés ne prédisent pas la vitesse sur iPhone.

La progression actuelle reste généreuse : le héros atteint 99, puis l'XP compense encore presque entièrement son déclin à 46 ans dans ces deux parcours. La moyenne NBA augmente aussi avec les nouvelles générations. La concentration de 12 à 13 titres chez une franchise doit être réévaluée avec davantage de profils, notamment sans héros à 99. **L'équilibrage de la longévité et des générations reste à affiner.**

Les règles de contrats, marchés, coaching, vie personnelle et tactique sont simplifiées ; le périmètre exact des données réelles et des systèmes est indiqué dans `README.md`.
