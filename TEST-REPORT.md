# HOOP LEGACY V3.3 — validation

39 tests fonctionnels réussis. Deux carrières de trente saisons, un monde témoin de trente saisons, trois migrations avec ancien cache actif et parcours mobile vérifiés avant publication.

## Continuité et intégrité

- Le mode d’avance et sa destination sont séparés. Une semaine commencée au jour 20 vise toujours le jour 27 après une interruption au jour 23 ; la suivante vise le jour 34. La fin de saison s’arrête au bilan sans jouer le premier match suivant.
- Le choix survit à la navigation, à une décision, à l’arrêt manuel, à l’import et au rechargement. La réouverture ne lance pas la simulation.
- Les messages du worker sont appliqués et sauvegardés en ordre. Les commandes restent bloquées jusqu’à la fin de la sauvegarde finale. L’arrêt demandé pendant la préparation est également conservé.
- V3.0, V3.1 et V3.2 : match commencé avec le moteur original, sauvegarde et ancien cache PWA actifs, migration, résultat strictement identique, copie de secours, puis réouverture hors ligne. `match-v32.js` est gelé ; seules ses URL d’import sont adaptées.
- Aucune réécriture des résultats passés, de l’XP existante ou du RNG pendant la migration. La correction unique de maîtrise rétablit au minimum 45 une ancienne valeur uniquement décroissante ; elle est expliquée et n’accorde aucun XP.
- Les dates, têtes de série et répartitions anciennes absentes des données restent inconnues. Les séries sont reconstituées uniquement à partir des rencontres conservées.

## Moteur et carrière

- Les 22 badges et 16 techniques ont des tests de seuil, de contexte, de plafond, d’utilisation et d’effet sur des possessions réelles. L’absence du joueur annule leur effet. Plusieurs techniques d’un même contexte ne se cumulent pas.
- Dunks, lay-ups et tirs proches restent tous accessibles avec 99 en lay-up et dunk. Les lancers, passes, rebonds, écrans et défenses utilisent leurs effets respectifs.
- Minutes jouées, entraînement et vidéo font progresser la maîtrise. Vingt matchs de 26 minutes donnent environ dix points au départ. Un scénario de saison passe de 50 à plus de 80. Les séances d’un même jour ne dupliquent pas le gain de maîtrise.
- La maîtrise influence modestement réussite, circulation et défense. Elle se conserve annuellement ; transfert à système similaire : 85 % conservés, système différent : 65 %.
- Chaque tour possède des séries et identifiants durables. Les campagnes contrôlent les victoires, l’absence de match après une série remportée et l’alternance NBA 2-2-1-1-1. Les quatre tours NBA comportent 8, 4, 2 et 1 séries.
- Qualification, changement de tour, élimination et titre provoquent une pause informative dédoublonnée. Les décisions véritables gardent leur traitement séparé.
- Attribution d’un titre au sacre avec effectif et éligibilité figés ; conservation après départ et refus d’attribution rétroactive après arrivée chez le champion. Objectifs et palmarès se mettent à jour immédiatement.
- Les statistiques par passage, compétition et phase correspondent aux agrégats annuels. La retraite bloque les commandes sportives et financières dans le moteur et l’interface.
- Emplacements identifiés, remplacement annulable et suppression vérifiés ; les archives partagées restent présentes tant qu’un emplacement les référence.
- Résidence revalorisée indépendamment des placements. Journal financier mensuel calculé sur les montants journaliers réellement encaissés.

## Campagnes longues

Empreinte des modules de simulation : `8297a11270d3e659053d4cff4c2911e4464cf42134d30ba3063dd51690911914`.

| Mesure | Carrière 2026 | Carrière 973 | Témoin 2026 |
|---|---:|---:|---:|
| Saisons complètes | 30 | 30 | 30 |
| Export final, millions de caractères | 40.73 | 40.79 | 40.48 |
| Franchises championnes différentes | 11 | 9 | 22 |
| Maximum de titres par franchise | 17 | 15 | 3 |
| Général NBA moyen, saison 30 | 78.8 | 78.6 | 78.2 |
| Points NBA moyens par équipe, saison 30 | 122.6 | 123.2 | 120.9 |
| Général du héros à 46 ans | 95 | 95 | 46 |

Chaque saison vérifie les neuf champions, les rencontres, les feuilles de statistiques, les effectifs, les attributs, les séries archivées, les passages par club, les accomplissements uniques et les totaux de confrontations.

**Résultat d’équilibrage à conserver dans le suivi :** San Antonio remporte 17 titres et Washington 15 lorsque le héros devient complet à 99. Le seuil d’alerte initial de quinze titres est donc dépassé par la première carrière. Il ne faut pas présenter cette alerte comme résolue. Le contrôle supplémentaire rend artificiellement le héros indisponible pendant toute la campagne pour isoler le monde IA : 22 franchises différentes gagnent et aucune ne dépasse trois titres. Cela ne montre pas de concentration générale du recrutement dans ce scénario ; cela ne prouve pas non plus l’équilibre de tous les autres profils. Le banc distingue désormais l’alerte de domination avec le héros du contrôle de domination sans son influence. L’avertissement reste enregistré dans `long-run-2026.json`.

La progression rapide et l’absence de plafond individuel demandées sont conservées. La difficulté et les enjeux une fois arrivé à 99 restent un chantier de la V3.4 ; cette V3.3 ne prétend pas avoir réglé l’équilibrage de fin de carrière.

## Navigateur et sauvegarde longue

- Chromium à 320, 390 et 1440 pixels : création, cinq onglets, matchs, reprise, affichage de la maîtrise et centre des playoffs. Aucun débordement horizontal ni erreur JavaScript dans les parcours contrôlés.
- Tournoi NBA réellement simulé : 15 séries visibles, filtres, résultats par match, finale et parcours éliminé consultables ; RNG et compétitions inchangés par la navigation.
- Interruption réelle au jour 3 d’une semaine visant le jour 7, rechargement sans avancement, reprise au jour 7. Arrêt manuel d’une fin de saison conservant son objectif.
- Emplacement nommé, remplacement refusé, suppression, commandes de retraite désactivées.
- Export de trente saisons importé, archives relues, calendrier de la saison 1 et bilans annuels consultés ; continuation au jour 10957 puis rechargement sans perte des trente archives.
- PWA hors ligne, y compris depuis le lien versionné ; tous les nouveaux modules sont préchargés.

## Périmètre restant

Les formats de référence restent figés en 2025–2026, avec calendriers simulés et ligues scolaires simplifiées. Poids et envergure restent descriptifs. Le suivi historique incomplet est signalé, sans inventer des données. Les essais mobiles sont réalisés avec Chromium ; Safari iOS et l’installation sur appareil physique restent à vérifier.

Le bilan V3.2 reste disponible dans `docs/validation-v3.2.md`.
