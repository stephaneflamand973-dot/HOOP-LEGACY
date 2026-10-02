# HOOP LEGACY V3.4 — validation

La V3.4 applique le lot P1 du cahier des charges : statistiques et dossiers, distinctions par phase, suivi du coach, marché comparatif, chapitres de carrière, effets physiques et navigation mobile.

## Vérifications fonctionnelles

49 scénarios sont définis dans les sept fichiers de tests, dont dix nouveaux scénarios V3.4. Les scénarios existants de chronologie, blessures, XP, badges, playoffs, transferts, retraite et sauvegardes restent actifs.

Les nouveaux scénarios contrôlent :

- Agrégats par phase et club, transfert, unicité de finalisation, concordance des totaux.
- Refus d’une candidature limitée à six matchs, défense dominante, première saison établie, distinction régulière figée avant les playoffs, MVP des finales dans l’équipe championne.
- Migration V3.3 sans changement de résultats, RNG, XP ou trophées ; conservation séparée des totaux dont la phase ou le club est inconnu.
- Évaluation du coach, attente concrète, report unique en cas de blessure, bilan, transfert et retraite.
- Classement des offres sans changer les contrats ni consommer d’aléatoire.
- Effets physiques bornés et limités aux actions annoncées ; couverture défensive indépendante de l’identité du héros.
- Enjeux fondés sur un titre ou une série réelle, dix bilans de chapitres sans doublon.
- Archives différées, export intégral, références partagées et suppression sans perte.
- Retrait de l’historique des messages du worker, puis réassemblage sans doublon.
- Dossiers, tableaux et candidats consultés sans mutation de simulation.

## Carrières de trente saisons

Empreinte des modules de simulation : `794e72cf99b0c3c5c40c7be4922a51b58c1124fb379487e70ce537bd5b7ffd4b`.

| Mesure | Graine 2026 | Graine 973 |
|---|---:|---:|
| Saisons complètes | 30 | 30 |
| Franchises championnes différentes | 12 | 13 |
| Maximum de titres NBA par franchise | 16 | 16 |
| Franchise dominante | Denver | Washington |
| Export final, millions de caractères | 103,67 | 103,65 |
| Âge final du héros | 46 | 46 |

Les contrôles annuels vérifient les neuf champions, les scores, les effectifs, les attributs, les quatre tours NBA, les terrains, l’absence de match après une série remportée, les passages par club et les agrégats. Le détail demeure dans `tests/long-run-2026.json` et `tests/long-run-973.json`.

**L’alerte de domination au sommet reste ouverte.** Seize titres sur trente dépassent le seuil de suivi de quinze. Aucun seuil n’a été relevé pour masquer ce résultat. L’aide défensive vise la menace principale avec la même règle pour les deux équipes, mais elle libère aussi les coéquipiers. Elle ne suffit pas à garantir une diversité de champions lorsque le héros devient complet à 99. La progression rapide et l’absence de plafond de build demandées sont conservées.

Une comparaison supplémentaire porte sur 480 matchs : cinq postes, niveaux uniformes 65/80/99, seize graines identiques, deux versions du moteur. Les notes, minutes prévues et effectifs sont identiques. Tirs, passes, rebonds, pertes, fautes, points et victoires sont conservés dans `tests/v34-balance.json`. Les probabilités changent réellement, mais une distribution de matchs synthétiques ne démontre pas l’équilibre de toutes les carrières.

## Migrations et navigateur

V3.0, V3.1, V3.2 et V3.3 : ancien cache actif, sauvegarde à mi-match, copie de secours, résultat et RNG strictement identiques après fin du match, puis réouverture hors ligne. Les règles V3.3 sont conservées dans `match-v33.js` ; les versions antérieures passent par `match-v32.js`.

Le parcours V3.3 de non-régression couvre toujours le tournoi NBA complet, les filtres, la semaine interrompue puis reprise jusqu’à sa destination initiale, l’arrêt manuel, les emplacements nommés et les commandes de retraite.

Le parcours V3.4 utilise réellement l’export de trente saisons :

- 29 archives différées au chargement ; saison consultée chargée à la demande.
- Statistiques par phase, filtre et tri conservés après navigation, recherche saisie au clavier et ligne du héros.
- Dossier de trente saisons et dossier d’un joueur sorti du monde actif.
- Candidats et résultat du MVP des finales, absence de valeurs `NaN` ou `undefined`.
- Archives accessibles hors ligne, évaluation du coach conservée après rechargement, offres comparatives.
- Aucun débordement global aux largeurs 320, 390 et 1440 pixels ; aucune erreur JavaScript dans le parcours contrôlé.

Mesure finale dans Chromium, avec largeur mobile : environ 497 ms pour retrouver l’écran principal, et 9,8 ms au 95e percentile pour le rendu des écrans d’une carrière de trente saisons. Ces mesures décrivent le navigateur de test sur son hôte, pas un appareil iOS réel. Le rapport JSON et les captures sont conservés dans l’artefact de validation.

## Limites explicites

Le poids reste descriptif. La formule défensive utilise les actions enregistrées et ne prétend pas mesurer toutes les contributions défensives réelles. Les règles d’éligibilité et le cinq de saison sont des règles de simulation annoncées. Les données anciennes non ventilées ne permettent pas de reconstituer tous les dossiers et trophées passés. Les formats et effectifs initiaux restent ceux du pack de référence 2025–2026. Safari iOS et l’installation sur téléphone physique restent à vérifier.

Les bilans V3.2 et V3.3 sont conservés dans `docs/`.
