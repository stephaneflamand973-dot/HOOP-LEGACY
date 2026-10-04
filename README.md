# HOOP LEGACY — V3.6.0

Simulation de carrière de basket en français, conçue pour le téléphone. Application statique, hors ligne après le premier chargement, sans compte ni achat intégré.

[Jouer sur GitHub Pages](https://stephaneflamand973-dot.github.io/HOOP-LEGACY/dist/?v=3.6.0)

## Changements de la V3.6

- **Échanges sportifs dans Carrière** : attentes contextualisées du coach, priorité d'agent persistante et travail collectif avec un coéquipier identifié.
- **Engagement suivi** : deux matchs et trois journées vidéo en 21 jours ; bilan le lendemain pour inclure le dernier match. Cohésion +3 si réussi, sans pénalité sinon. Le programme reste votre choix.
- **Mémoire des réponses** : délais par interlocuteur, historique de 40 échanges et journal ; clôture après transfert, départ, changement de coach ou retraite selon l'engagement concerné.
- **Diagnostic sur 1 440 matchs** : règles de match 3.5 et progression rapide vers 99 conservées. Les dynasties restent possibles ; aucune défaite forcée. Voir `docs/v3.6-diagnostic.md`.
- **Sauvegardes** : secours avant migration 3.5, ancien match conservé exactement, dialogues disponibles hors ligne.

## Changements de la V3.5

- **Des proches persistants** : partenaire, enfants, agent, mentor et proche ont un nom et une identité. Les noms, liens et dates déjà présents sont conservés à la migration.
- **Des histoires qui ont une suite** : changement de club, blessure d’au moins quatorze jours ou titre ouvrent un échange puis un suivi après trois semaines. Le journal garde les choix ; une histoire terminée ne recommence pas.
- **Consignes durables** : routine, médias, partenariats locaux et finances. Un récapitulatif explique chaque décision déléguée. Rencontre, famille, nouvelle ville, engagement national et contrats sportifs restent des décisions personnelles.
- **Clubs autonomes** : projet fondé sur la force de l’effectif, l’âge et les besoins au poste. Recrutement adapté, échanges possibles dans le club du héros, staff expliqué et priorité modérée aux jeunes en développement/reconstruction.
- **Contrats respectés** : les budgets n’entraînent plus de réduction rétroactive des salaires. Les offres futures sont contraintes ; une exception minimale permet de compléter les effectifs. Ce budget cible est une règle de simulation, sans reproduction de la convention collective NBA.
- **Finances exactes** : revenus et dépenses réellement appliqués chaque jour, mouvements de placements et immobilier séparés. Règle de 0 à 50 % du disponible au-delà d’une réserve, tous les 30 ou 90 jours ; montant annoncé avant action, sans plafond caché.
- **Résidence et sponsors** : vente avec 5 % de frais, déménagement vers le club actuel pour 5 000 € sans recréer la valeur du bien. Partenariats liés à la notoriété, aux titres, au championnat et à l’exposition choisie ; obligations mensuelles modestes et visibles.
- **Sauvegardes** : secours avant migration V3.0–V3.4, ancien match terminé avec ses règles, solde de départ repris dans le suivi financier des sauvegardes V1/V2.

Ces histoires sont des chaînes courtes de deux étapes. Les relations restent une simulation simple ; les grands choix de vie et de carrière ne sont jamais délégués automatiquement. Les préférences de simulation, les playoffs et la maîtrise du système de V3.3 restent disponibles.

## Changements de la V3.4

- **Statistiques explorables** : saison régulière, play-in, playoffs ou total ; année, compétition, club, recherche, tri et ligne du héros épinglée. Les pourcentages affichent le nombre de tirs tentés et réussis.
- **Dossiers persistants** : saisons, clubs, records datés, blessures importantes, titres et distinctions, y compris pour les joueurs retirés du monde actif. Les anciennes données partielles restent identifiées.
- **Distinctions justifiées** : MVP, rookie, défenseur, cinq de la saison et MVP des finales. La saison régulière exige 60 % du calendrier et un temps de jeu suffisant ; les finales ont leur propre périmètre. Candidats, éligibilité et formule sont consultables.
- **Suivi du coach** : évaluation de 21 jours, au moins trois matchs et une note moyenne attendue de 65. Bilan fondé sur la disponibilité, le niveau et la concurrence ; report limité en cas de blessure, clôture après transfert ou retraite.
- **Offres comparables** : priorité personnelle, salaire, rôle, fourchette de minutes, concurrents directs, niveau collectif et continuité du système. Les clubs conservent leur décision sur le rôle réel.
- **Chapitres de carrière** : retour, défense d’un titre, revanche contre un adversaire rencontré, fidélité, finale, longévité et caps personnels. Deux ou trois enjeux actifs, fondés sur les faits, sans nouvelle jauge de puissance.
- **Profil physique** : agilité sur les appuis, détente sur les actions aériennes, envergure sur contestation et rebonds ; effets modestes et ciblés. Le poids reste descriptif. Les défenses peuvent concentrer leur aide sur une menace majeure, avec davantage d’espace pour ses coéquipiers.
- **Mobile et archives** : chargement des anciennes saisons à la demande, historique immuable retiré des messages du worker, filtres et focus préservés, décision résumée lors de la consultation des autres écrans.

Les matchs commencés sous V3.3 se terminent avec leurs règles d’origine ; les moteurs antérieurs restent aussi disponibles pour la migration. Un suivi incomplet ne produit pas de nouvelles distinctions rétroactives. L’accès à 99 et la progression rapide sont conservés. La domination d’un héros complet reste une limite mesurée : cette version enrichit la carrière sans prétendre avoir entièrement réglé son équilibre au sommet.

## Changements de la V3.3

- Préférence de simulation conservée par carrière. La destination d’une semaine ou d’une fin de saison survit aux décisions, pauses, rechargements et imports. Reprise explicite ; aucune simulation automatique à la réouverture.
- Centre des playoffs dans Monde et accès direct depuis Aujourd’hui : tours conservés, filtres de saison/conférence/tour, scores des séries, matchs datés, domicile/extérieur et enjeux. Consultation possible après élimination, sans qualification ou pendant une blessure.
- Têtes de série et identifiants persistants ; alternance NBA 2-2-1-1-1 ; formats de domicile configurés par ligue. Arrêts brefs sur qualification, changement de tour, élimination et titre, regroupés sans faux choix.
- Maîtrise du système gagnée avec les minutes jouées, les séances et la vidéo. Gains expliqués dans Profil & santé, effet sportif modeste, conservation annuelle et rétention de 85 % ou 65 % lors d’un transfert selon le système.
- Les 22 badges et 16 techniques ont un effet contextuel testé. Réceptions, passes, lancers, écrans, rebonds, appuis et jeu collectif sont reliés au moteur. Avoir 99 en lay-up ne supprime plus les dunks.
- Titres attribués au sacre avec photographie de l’effectif et de l’éligibilité. Passages par club, compétition et phase conservés ; le titre reste acquis après un transfert et n’est pas accordé en rejoignant le champion après coup.
- Sauvegardes identifiées par joueur, club, saison et date ; remplacement confirmé, suppression avec conservation des archives encore utilisées. Retraite consultative, commandes bloquées au niveau du moteur et de l’interface.
- Migrations V3.0/V3.1/V3.2 avec copie de secours. Les matchs en cours terminent avec leur moteur d’origine ; scores passés, RNG et XP conservés. Les éléments historiques non documentés ne sont pas inventés.
- Résumé du match avec score collectif ; tendance récente présentée comme descriptive ; jauges inactives retirées. Résidence revalorisée même sans placements, montants mensuels réels et plafond de placement affiché.

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

- IndexedDB `hoop-legacy-v1`, version de base 3, état de carrière schéma 4.
- Autosave et trois emplacements. Export JSON complet pour conserver une copie ou changer d’appareil.
- Dernier autosave conservé en `rollback`. Copie avant chaque migration, y compris V3.0/V3.1/V3.2.
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

La validation V3.5 se trouve dans `TEST-REPORT.md`. `QA_LONG_SAVE` permet de tester un export de trente saisons ; `QA_PREVIOUS_ROOT=/chemin/vers/v3/dist npm run test:upgrade` contrôle la transition réelle depuis V3.0, V3.1, V3.2, V3.3 ou V3.4 avec son ancien cache actif. Le suivi annuel commence au chargement de la V3.1 pour une carrière existante.

`npm run test:v33-browser` contrôle les playoffs réels, les pauses/reprises, les préférences, les emplacements et la retraite sur mobile. Le poids reste descriptif ; l’envergure intervient depuis V3.4. Les formats de terrain des playoffs sont des paramètres de simulation ; les matchs NCAA et le Final Four sont traités comme neutres.

`npm run test:v34-browser` vérifie les nouveaux écrans avec `.qa-cache/state-2026.json`, généré par `node tools/long-run.mjs 2026`. `npm run test:balance` compare 480 matchs appariés entre les règles V3.3 et V3.4. Les mesures Chromium ne remplacent pas un essai Safari sur téléphone physique.

Le rapport `tests/long-run-2026-control.json` est le témoin historique de V3.3, décrit dans `docs/validation-v3.3.md` ; il ne sert pas de preuve pour le moteur V3.5.

`npm run test:v35-browser` vérifie les consignes, les montants de placement, la vente, les décisions familiales, la réouverture et le hors ligne aux largeurs 320/390/1440. Le banc `test:balance` reste une comparaison historique des règles V3.3 et V3.4, distincte des campagnes V3.5.
