# HOOP LEGACY — V3.2.0

Simulation de carrière de basket en français, conçue pour le téléphone. Application statique, hors ligne après le premier chargement, sans compte ni achat intégré.

[Jouer sur GitHub Pages](https://stephaneflamand973-dot.github.io/HOOP-LEGACY/dist/?v=3.2.0)

## Changements de la V3.2

- Ambition de saison proposée automatiquement : gagner sa place, porter son équipe ou jouer le titre. Choix facultatif avant le premier match, suivi de trois objectifs sans pénalité ni validation répétitive.
- Rivalités issues des vrais duels serrés et des phases finales : bilan des victoires, séries et dernier adversaire marquant. Les identités et confrontations restent après les transferts.
- Enjeux du prochain match : revanche, élimination, balle de qualification ou balle de titre.
- Totaux de carrière, accomplissements durables, records contextualisés, doubles-doubles et triples-doubles. Bilans annuels consultables et conservés.
- Accueil plus direct : résultat du dernier match et faits marquants remontés ; journal repliable ; entraînement et contrats regroupés dans Carrière.
- Migration V3.0/V3.1 avec copie de secours, sans interrompre le match en cours. Les totaux anciens sont repris ; les rivalités et performances détaillées commencent au jour de la mise à jour lorsque les archives ne permettent pas de les reconstruire.

## Changements de la V3.1

- Coût des derniers niveaux et entretien du physique rééquilibrés avec l’âge ; technique plus durable, sans perte de l’XP acquise ni plafond individuel.
- Bilan d’évolution dans Joueur → Attributs : gains par domaine, XP des matchs et de l’entraînement, détail du vieillissement et comparaison annuelle.
- Progression IA liée aux minutes, au staff, à la maîtrise et à la maturation. Générations moins uniformes avec quelques prospects exceptionnels.
- Sélections de draft persistantes, y compris pour les anciennes carrières V3.
- Migration V3.0 → V3.1 avec copie de secours et conservation du match en cours. Les nouvelles courbes ne réécrivent pas rétroactivement les joueurs existants.
- Réouverture hors ligne également depuis le lien contenant le numéro de version.

## Fondations de la V3

- Matchs entièrement automatiques : possessions, tirs, passes, rebonds, pertes de balle et score collectif utilisent un seul moteur. Rapide, moments clés et suivi détaillé changent uniquement la présentation. Les anciennes commandes de possession et le Takeover sont retirés.
- Six réserves d’XP : finition, tir, création, défense, rebond et physique. La production et l’efficacité individuelles, le temps joué et le niveau de la ligue déterminent les gains. Une pondération hebdomadaire commune limite l’avantage des calendriers plus chargés, notamment championnat + EuroLeague.
- Plus de plafond propre au build : toutes les compétences peuvent atteindre 99. Les coûts augmentent à haut niveau. L’entraînement assisté se déroule selon le calendrier ; allocation manuelle de l’XP possible.
- Cinq destinations : **Aujourd’hui, Joueur, Carrière, Vie, Monde**. Les sauvegardes et réglages se trouvent dans le menu ☰.
- Parcours lycée → recrutement universitaire → choix de draft. Une carrière non draftée continue via des offres internationales. Départs à l’université ou directement en NBA également disponibles.
- NBA : identités des effectifs d’ouverture du 21 octobre 2025, puis générations fictives. Les joueurs conservent leur identité, leurs saisons et leurs mouvements. Recrutement IA selon poste, âge, stratégie et budget simplifié.
- Vie : relations, couple, projet d’enfant et naissance différée, médias, sponsors, train de vie, résidence, placements. Choix courants délégables ; décisions majeures conservées.
- Blessures courtes ou longues, retour progressif et récupération des pertes physiques temporaires. Vieillissement physique distinct de la technique et de la lecture du jeu.
- Intersaison avec programme de travail ou de repos. Journal complet interrogeable, saisons archivées, records personnels et résumé de retraite.
- Chronologie quotidienne reproductible : l’ordre de simulation ne dépend pas de la taille du saut demandé. Arrêts sur les décisions importantes.

## Références et périmètre des données

| Compétition | Clubs / programmes | Matchs réguliers par équipe |
|---|---:|---:|
| NBA | 30 | 82 |
| EuroLeague | 20 | 38 |
| Betclic ÉLITE | 16 | 30 |
| Liga ACB | 18 | 34 |
| Bundesliga | 18 | 34 |
| Serie A | 16 | 30 |
| NBL | 10 | 33 |
| NCAA, sélection de programmes | 32 | 31 |
| Circuit lycée fictif | 12 | 24 |

Les formats sont figés sur la référence 2025–2026. Les dates et l’ordre des adversaires sont générés ; ce ne sont pas les calendriers officiels. Les clubs nationaux également engagés en EuroLeague partagent un effectif et ne jouent pas deux matchs le même jour. La NCAA représente un échantillon, avec un tournoi réduit ; les calendriers universitaires et lycéens réels varient.

Sources des formats dans `dist/leagues.js`. Source NBA : [annonce officielle des effectifs](https://www.nba.com/news/nba-rosters-set-for-2025-26-regular-season), document d’ouverture reproduit dans le PDF indiqué par `ROSTER_SOURCE`, et [index officiel des joueurs](https://www.nba.com/players) pour les postes et tailles disponibles.

Les **noms et clubs NBA** sont issus de la référence. Les **notes, contrats et certains âges** sont des estimations de jeu. Les âges estimés sont marqués ≈. Les positions précises MJ/AR/AI/AF/P sont adaptées au moteur. Les blessures historiques de l’ouverture ne sont pas reproduites. Les autres ligues utilisent des joueurs fictifs. Le tag two-way du document source n’implémente pas une G League ni les règles réelles des contrats two-way.

## Sauvegardes et mise à jour

- IndexedDB `hoop-legacy-v1`, version de base 2, état de carrière schéma 4.
- Autosave et trois emplacements. Export JSON complet pour conserver une copie ou changer d’appareil.
- Dernier autosave conservé en `rollback`. Copie avant chaque migration, y compris V3.0/V3.1.
- Les archives annuelles sont stockées séparément, de manière atomique avec les références de l’emplacement ; l’export rassemble la carrière complète.
- Migration V2 : joueur, attributs, argent, ligues, résultats et histoire conservés ; anciens crédits de progression convertis en XP de domaine. Les caps disparaissent. Un match ancien inachevé est archivé et rejoué par le nouveau moteur.
- Migration V1 : ancienne saison conservée dans une archive, passage aux ligues réelles au début d’une nouvelle saison.
- **Commencer une nouvelle carrière pour jouer avec les effectifs NBA réels.** Les joueurs des anciennes sauvegardes ne sont pas remplacés, afin de préserver leur histoire.
- Les ressources V3 portent un numéro de version dans leur URL pour éviter le mélange avec un ancien cache PWA.

Sur iPhone, ouvrir dans Safari, puis Partager → Sur l’écran d’accueil. Le stockage reste propre au navigateur et à l’appareil ; exportez la carrière avant de les changer.

## Exécution et vérification

```sh
npm ci
npm start
npm test
npm run test:long
```

`npm start` expose `dist/` sur le port 4173. Aucun build ni serveur d’application n’est requis en production.

Le banc long déroule 30 saisons sur les seeds 2026 et 973, contrôle chaque saison et enregistre les jalons 1, 5, 10, 20, 30. Les rapports sont dans `tests/long-run-*.json`.

Pour le contrôle navigateur : installer Chromium avec `npx playwright-core install chromium`, puis `npm run test:browser`. Un binaire existant peut être fourni avec `CHROMIUM_EXECUTABLE_PATH`. Les captures de vérification sont écrites dans `test-results/`.

## Limites assumées

Les marchés, budgets et règles de contrats sont des modèles simplifiés, pas une reproduction de la convention collective NBA. Pas de salary cap détaillé, de transactions de picks, de relégations, de coupes nationales ni de G League autonome dans cette version. Les systèmes tactiques, coachs, relations et sponsors restent moins détaillés qu’un jeu de management spécialisé. Les techniques sont encore des modificateurs contextuels. Le résumé de retraite reste consultatif.

La progression facilite volontairement l’accès à un joueur très fort. Les tests de simulation contrôlent la cohérence ; ils ne prouvent pas à eux seuls le plaisir sur plusieurs dizaines d’heures. Safari iOS sur appareil physique reste à tester.

La validation V3.2 se trouve dans `TEST-REPORT.md`. `QA_LONG_SAVE` permet de tester un export de trente saisons ; `QA_PREVIOUS_ROOT=/chemin/vers/v3/dist npm run test:upgrade` contrôle la transition réelle depuis V3.0 ou V3.1 avec son ancien cache actif. Le suivi annuel commence au chargement de la V3.1 pour une carrière existante.
