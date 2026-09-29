# HOOP LEGACY 2.0

Jeu de carrière de basket en français. Clubs professionnels réels, joueurs générés, calcul et sauvegardes sur l’appareil. Univers de référence fixe : ouverture de saison 2025–2026. Aucune clé API ni compte de jeu ; l’accès au site privé reste distinct.

## Jouer et développer

`npm start` sert `dist/` sur http://localhost:4173 ; `npm test` lance les tests Node.js. Aucune installation de dépendance requise. HTTPS ou localhost nécessaire au service worker.

## Carrière

Départs au lycée (16–17 ans), à l’université (18–21 ans) ou directement en NBA. Le lycéen joue des saisons complètes, progresse et reçoit des offres universitaires à 18 ans. Les études et le niveau influencent les propositions. Après une saison universitaire et à partir de 19 ans, le joueur peut tenter la draft ou poursuivre ses études, dans la limite de quatre saisons.

Le rang de draft dépend du niveau, du potentiel, des performances, de l’exposition et de la promotion concurrente. Une seule franchise NBA propose un contrat au joueur sélectionné. Un non-drafté reçoit des possibilités à l’étranger selon son niveau ; une arrivée ultérieure en NBA reste possible. Ordre de sélection simplifié selon les résultats NBA précédents, sans loterie ni échanges de choix.

Les demandes de transfert et fins de contrat ouvrent un marché international. Le joueur conserve son identité et ses attributs, rejoint le calendrier du club d’arrivée et les matchs déjà joués restent archivés. Effectif unique pour les clubs présents en championnat national et en EuroLeague. Les joueurs contrôlés par le jeu sont renouvelés à l’intersaison ; pas de marché complet de transferts entre clubs IA.

## Compétitions

| Compétition | Clubs | Matchs réguliers par équipe |
| --- | ---: | ---: |
| NBA | 30 | 82 |
| Betclic ÉLITE | 16 | 30 |
| Liga ACB | 18 | 34 |
| Basketball Bundesliga | 18 | 34 |
| Lega Basket Serie A | 16 | 30 |
| NBL | 10 | 33 |
| EuroLeague | 20 | 38 |
| Université NCAA, sélection représentative | 32 | 31 |
| Lycée, circuit fictif | 12 | 24 |

Calendriers générés avec les volumes de la saison de référence ; dates et ordre des adversaires simulés. NBA : 41 réceptions, conférences, play-in et séries en sept matchs. Formats de phases finales propres aux autres compétitions ; EuroLeague en séries puis Final Four. Les rencontres durent 48 minutes en NBA, 40 à l’université et dans les autres compétitions professionnelles, 32 au lycée. Prolongations de cinq minutes.

La NCAA est une sélection de 32 programmes avec tournoi réduit ; les calendriers réels varient et 31 correspond au plafond de référence 2025–26. Le lycée est un circuit fictif : pas de nombre universel de matchs aux États-Unis. Italie : format de début de saison, sans reproduction des exclusions disciplinaires ultérieures. EuroLeague : les clubs hors des cinq championnats nationaux intégrés ne disposent pas de leur championnat domestique.

Sources officielles et notices par compétition : `dist/leagues.js`. Formats et clubs fixes, sans actualisation automatique, sans effectifs réels ni fixtures officielles. Pas de coupes nationales, de relégation, de salary cap NBA réglementaire, de luxury tax ou de transactions à plusieurs équipes. Salaires et budgets sont des paramètres de jeu.

## Progression et simulation

22 attributs et allocation automatique activée par défaut, désactivable pour dépenser manuellement. 75 XP par point ; entraînement individuel à 90 XP, coûts d’amélioration réduits, gains de pratique liés aux matchs et plafonds conservés. 22 badges, 16 techniques, blessures, rotations et fatigue. Progression plus rapide chez les jeunes, ralentie au niveau élevé.

Match rapide, moments clés ou possessions détaillées utilisent le même moteur déterministe. Avance par rencontre, semaine, dix étapes ou fin de saison. Les longues simulations utilisent un worker avec points de reprise et arrêt entre deux étapes cohérentes. Un match contient 200 possessions de durée fixe, sans moteur 3D ni timing de manette.

## Sauvegardes

IndexedDB `hoop-legacy-v1`, magasin `slots`, schéma 3. Autosave, trois emplacements et import/export JSON. Écritures sérialisées, validation avant remplacement, sauvegarde exacte du match en cours dans la V2.

Les sauvegardes V1 sont migrées : joueur, attributs, points, argent et historique conservés. Une copie intégrale est gardée avant migration. L’ancienne saison et son éventuel match inachevé sont archivés, puis une nouvelle saison commence dans le monde réel avec choix de contrat. Ce match ancien n’est pas repris dans le nouveau calendrier. Les sauvegardes restent locales : exporter pour changer d’appareil.

## Fichiers

- `dist/engine.js` : moteur, calendrier, carrière, marché, validation et migration.
- `dist/leagues.js` : clubs, formats, provenance et calendrier.
- `dist/config.js` : attributs, progression, badges et paramètres.
- `dist/app.js`, `dist/style.css` : interface adaptative.
- `dist/storage.js`, `dist/worker.js` : stockage et simulation longue.
- `dist/sw.js`, manifeste et icônes : ressources PWA.
- `tests/` : tests du moteur, parcours, migration, worker et contrat d’interface.

Voir `TEST-REPORT.md`. Les tests de DOM/IndexedDB sont simulés ; aucune validation visuelle, mobile, installation ou fonctionnement hors ligne en navigateur réel n’a été effectuée dans cet environnement.

## Tester sur iPhone avec GitHub Pages

Dans Settings → Pages, sélectionner Deploy from a branch, branche main, dossier / (root), puis Save. Une fois le déploiement terminé, ouvrir https://stephaneflamand973-dot.github.io/HOOP-LEGACY/ dans Safari. Partager → Sur l’écran d’accueil pour installer le jeu. La page racine ouvre automatiquement dist/.

Les sauvegardes du précédent site restent sur son domaine. Exporter le JSON depuis ce site puis l’importer dans la version GitHub Pages pour poursuivre la même carrière.
