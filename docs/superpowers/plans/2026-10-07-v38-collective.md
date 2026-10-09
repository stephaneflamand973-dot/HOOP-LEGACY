# HOOP LEGACY V3.8 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer préparation collective, stages et automatismes de duo mesurables, sans casser les carrières et matchs existants.

**Architecture:** Un état collectif indépendant porte les duos et les programmes. Des commandes financières réutilisent les gardes existants ; un adaptateur de match accumule les minutes et applique deux modificateurs purs depuis un instantané. Les anciennes règles restent dans un module historique. La vue ne modifie jamais le moteur.

**Tech Stack:** JavaScript ES modules, IndexedDB, Web Worker, Node test runner, Playwright ; aucune dépendance produit supplémentaire.

**Spec:** `docs/superpowers/specs/2026-10-07-v38-collective-design.md`, document validé par l’utilisateur le 7 octobre 2026.

## Global Constraints

- « Aucun achat réel, victoire garantie ou progression de base dégradée. Mobile, hors ligne, simulation automatique et destination persistante restent obligatoires. »
- « Un seul stage actif, aucun renouvellement automatique. »
- « Débit initial unique, fonds disponibles après paiement supérieurs ou égaux à la réserve. Pas de liquidation de placements ni de dette. »
- « Les scores sont attachés au club et au duo d’identifiants, pas aux noms. »
- « Les bornes existantes de probabilité restent appliquées après tous les modificateurs. »
- « Un match commencé avant migration finit sous ses règles d’origine, sans effet ni gain rétroactif de duo. »
- « La simulation conserve son mode et sa cible à chaque fin de stage, séance sautée et décision réelle. »
- Tarifs et effets de la spec : 600/7 jours/+0,40 ; 2 000/14 jours/+0,70 ; 3 500/14 jours/+1,00 par duo. Fatigue 0/2/2. Routines gratuites : 0,20/0,35/0,50 ; fatigue 0/2/2. Croissance match : 0,04 par minute partagée, amortie par `1-score/100`. Effets match : ±0,005 au maximum.
- Les lots de staff personnel, immobilier, négociation et fondation sont hors périmètre. Aucun déploiement avant CI et contrôles de migration verts.

## Review Focus

1. Un devis confirmé après changement de calendrier, d’effectif ou de solde doit être présenté à nouveau, sans débit implicite ; test tâche 2.
2. Une rencontre simultanée dans une deuxième compétition interdit la séance du jour, même si le calendrier affiché est celui de la ligue principale ; test tâche 3.
3. Un duo sorti puis revenu ne restaure pas plusieurs fois son archive, et un même duo dans un autre club ne récupère rien ; test tâche 1.
4. Les possessions sans vraie passe et les joueurs jamais présents ensemble ne bénéficient pas d’un passeur statistique fictif ; tests tâche 4.
5. Une migration V3.7 doit conserver le coach payé et son renouvellement, contrairement aux migrations antérieures à V3.7 ; tests tâche 5.

## Fichiers et contrats communs

Créer `dist/collective-state.js` (initialisation, duos, effectifs, validation), `dist/collective.js` (catalogue, devis, commandes et journées), `dist/collective-match.js` (instantané, minutes, effets, clôture), `dist/v38-view.js` (HTML pur), `dist/match-v35.js` (copie fidèle du moteur publié 3.5). Modifier les points d’intégration de `engine.js`, `commands.js`, `system.js`, `progression.js`, `match.js`, `storage.js`, `app.js`, `sw.js`, `config.js` et CSS ; pas de restructuration générale du moteur.

Nouveau `s.collective` : `{version:1, routine:'none', partners:[], processedDay:null, team:s.team, duos:{}, archived:[], stage:null, nextId:1, history:[], totals:{paid:0,sessions:0,mastery:0,duo:0}, recent:[], notice:null}`. `duos[teamId][pairKey]` contient `{ids:[a,b], score:0, minutes:0, sources:{match:0,routine:0,stage:0}}`. `pairKey(a,b)` est `JSON.stringify([a,b].sort())`, sans collision de séparateur. Les clés externes sont validées et lues par propriétés propres.

Un stage : `{id,catalogVersion:1,offerId,team,partners,bought,start,end,price,estimatedSlots,sessions,skips:{},mastery,duo}`. Archives de stages : mêmes champs plus `closed,reason`. `recent` : 24 dernières journées traitées avec motif, gains et fatigue. `history` : 24 stages ; `archived` : 50 anciens duos du héros. Les gains sont des nombres finis, jamais arrondis avant le stockage ; l’UI seule arrondit l’affichage.

Ordre d’exécution : état → stages → journées → matchs → migrations → interface → campagnes → revue/publication. Chaque tâche comprend tests rouges, implémentation minimale, tests verts et commit.

### Task 1: État des duos et mutations d’effectif

**Files:** créer `dist/collective-state.js`, `tests/v38-state.test.js`.

**Interfaces:** produire `initCollective(s):void`, `pairKey(a,b):string`, `duoFor(s,teamId,a,b,{create=false}={}):Duo|null`, `reconcileCollective(s):void`, `validateCollective(s):void`. Consommer équipes/effectifs/joueurs existants ; aucune importation circulaire du moteur, lire directement l’état.

- [ ] Écrire les tests d’initialisation pure du RNG/argent, duo nul à zéro, identifiants inversés identiques, équipes séparées, collision et prototype refusés. Assertions : `assert.equal(pairKey('a','b'),pairKey('b','a')); assert.equal(s.collective.routine,'none'); assert.deepEqual(s.rng,before.rng)`.
- [ ] Ajouter départ/retour : score 80 archivé puis restauré 60 dans le même club ; second rapprochement reste 60 ; archive consommée ; autre club zéro. Vérifier deux départs distincts appliquent chacun une réduction, archives >50 évincées dans l’ordre date puis clé, pas d’archives IA.
- [ ] Exécuter `node --test tests/v38-state.test.js`, constater import manquant, puis implémenter. Rapprochement : retirer les duos invalides, archiver seulement ceux du héros, retirer les sélections sorties. L’initialisation ne remplit pas toutes les paires : création à première utilisation réelle.
- [ ] Ajouter tests de validation : NaN/Infinity, score négatif/>100, doublons, partenaire fantôme, source négative, minutes impossibles, dates futures, tailles dépassées et state courant absent. Les sources représentent les gains accumulés, pas une égalité avec le score après restauration.
- [ ] Relancer tests ciblés puis `npm test` ; commit `feat: add club-scoped collective chemistry state`.

### Task 2: Devis et stages à paiement unique

**Files:** créer `dist/collective.js`, `tests/v38-stages.test.js` ; compléter validation dans `collective-state.js`.

**Interfaces:** consommer tâche 1, `canChange`, `receipt`, `cents`. Produire `STAGES`, `stageQuote(s,offerId,partners=[]):Quote`, `bookStage(s,quote,{busy=false}={}):{ok,reason,quote}`, `closeStage(s,reason):void`, `setCollectiveRoutine(s,routine,partners=[],{busy=false}={}):boolean`.

`Quote` contient `{ok,reason,offerId,partners,team,price,start,end,balanceAfter,reserve,slots,mastery,scores}`. `slots` est la liste triée des dates paires admissibles selon tous les calendriers connus, sans supposer l’évolution de la fatigue. La confirmation compare tous ces champs, dont jour via start/end ; aucune empreinte fournie par le client n’est autoritaire.

- [ ] Écrire `stage quotes are pure and confirm once` : assert prix 600/2000/3500, périodes D+1…D+7/D+14, zéro RNG/jour modifié, débit exact et reçu unique. Deux confirmations ne débitent qu’une fois.
- [ ] Écrire réserve : solde égal à prix+réserve accepté ; un centime de moins refusé ; investissements intacts. Devis devenu périmé après revenu, match ajouté dans une autre ligue, départ/blessure de partenaire ou score modifié : `assert.equal(result.ok,false); assert.equal(s.money,before.money)` et nouveau devis renvoyé.
- [ ] Tester refus : blessure du héros, aucune date, maîtrise 100, duos tous 100, identifiants dupliqués, héros sélectionné comme partenaire, plus de deux partenaires, match/pending/busy/retraite. Le réglage de routine respecte les mêmes gardes ; routine partenaires exige un ou deux coéquipiers.
- [ ] Exécuter tests ciblés pour constater les échecs, puis implémenter catalogue figé et comparaison explicite des champs. Débit puis reçu dans une seule commande synchrone, sans avance ni sauvegarde interne. Stage sans renouvellement ; clôture bornée avec cumuls inchangés.
- [ ] Compléter les imports hostiles : mauvais prix/catalogue/durée, stage d’un autre club, historique superposé, cumuls inférieurs aux détails, stage périmé, séances incompatibles avec créneaux et dates. Relancer `npm test` ; commit `feat: add reconfirmed collective camp purchases`.

### Task 3: Journées de préparation et maîtrise

**Files:** modifier `collective.js`, `system.js`, `progression.js`, `engine.js`, `commands.js`, `environment.js` ; créer `tests/v38-training.test.js`.

**Interfaces:** produire `collectiveDay(s):void` et `masteryCollective(s,raw):number` ; consommer routines/stages et état. `masteryCollective` utilise le même gain amorti que les sources existantes et incrémente `s.mastery.sources.collective` initialisé à zéro. Ajouter au sous-état environnement `trainingProcessedDay:null`, distinct de `lastTrainingDay`.

- [ ] Écrire matrice programmes gratuits/stages. À maîtrise 0 : gains 0,20/0,35 et 0,40/0,70. Pour score duo 50 : 0,25 gratuit ou 0,50 stage. Fatigue supplémentaire 0/2/2, une seule fois pour deux partenaires ; XP individuels et coach V3.7 inchangés par la préparation.
- [ ] Écrire tests jours pairs, lendemain d’achat, dernier jour inclus, lendemain exclu ; blessure/repos/fatigue >65/rencontre dans toute compétition : aucun gain. À fatigue 65, séance admise. Partenaire blessé ignoré ; autre partenaire progresse ; zéro partenaire = zéro fatigue. Stage actif remplace seulement la routine collective ; routine mémorisée reprend après échéance.
- [ ] Écrire répétition après sérialisation : premier appel fatigué ou sans partenaire puis modification des conditions n’autorise pas une deuxième séance à la même date. Pour `trainingDay`, fatigue 70→63 au premier appel puis reste 63 au second, aucun XP ; `lastTrainingDay` reste nul si aucune séance.
- [ ] Exécuter les tests rouges, puis implémenter marqueurs de traitement posés avant effets ou motifs de saut, y compris jours impairs. L’échéance et les changements d’effectif sont traités avant le garde journalier. Dans `advanceDay` : récupération existante → coach V3.7 → entraînement individuel → préparation collective → suite existante. Aucun revenu anticipé.
- [ ] Intégrer rapprochement après transactions/signatures/draft/départs annuels et avant calcul de match/journée. Clore le stage si club du héros changé, ou à retraite manuelle/automatique ; motifs visibles, aucun pending ajouté. La sélection routine sortie est retirée ; partenaires du stage restent figés pour le bilan.
- [ ] Comparer premier appel `trainingDay` V3.7/V3.8 sans préparation : XP/fatigue/maîtrise identiques. Relancer `npm test` ; commit `feat: apply collective preparation once per eligible day`.

### Task 4: Minutes partagées et effets de match versionnés

**Files:** créer `dist/collective-match.js`, `dist/match-v35.js`, `tests/v38-match.test.js` ; modifier `dist/match.js`, `dist/engine.js`.

**Interfaces:** produire `snapshotCollective(s,m):MatchCollective`, `recordSharedPossession(m,lineups):void`, `collectiveEffect(m,teamId,handlerId,shooterId):{turnover,shot}`, `finishCollectiveMatch(s,m):void`. `MatchCollective` : `{version:1,scores:{},minutes:{},effects:{},applied:false}`. L’instantané couvre uniquement les deux effectifs du match ; les compteurs ne sont pas envoyés vers un stockage global avant clôture.

- [ ] Copier fidèlement le moteur publié `match.js` dans `match-v35.js`, gardant sa délégation vers `match-v34.js`. Écrire le test comparant un match 3.5 repris après sérialisation au moteur publié : box, score et RNG identiques. Un match antérieur ne crée pas de télémétrie V3.8.
- [ ] Écrire les tests de l’adaptateur avant implémentation : `collectiveEffect` à score 0 = `{turnover:0,shot:0}`, à 100 vraie passe = `{turnover:-.005,shot:.005}` ; même porteur/tireur = zéro. Duos des deux équipes symétriques, score négatif/fantôme rejeté à l’import, aucune mutation RNG.
- [ ] Tester les lineups : cinq joueurs accumulent dix paires par équipe, remplaçants absents zéro ; durée par possession `m.duration/m.regulation`, prolongation même pas. Clôture score initial 50 et 20 minutes donne `50+.04*20*.5`, gain appliqué une fois après reload.
- [ ] Implémenter instantané au démarrage et compteur juste après la rotation existante, avant résolution. Versionner les nouveaux matchs `3.8.0`. Déléguer les autres au module historique. Appliquer effets uniquement si handler réel différent du tireur, avant bornage des probabilités existantes ; aucun RNG supplémentaire.
- [ ] Appeler clôture depuis `finalizeMatch` après ses gardes `g.result` et `m.done`, avant écriture du résultat. Conserver un résumé compact dans le résultat des matchs du héros, pas tous les compteurs complets ; `m.collective.applied` protège le réappel direct.
- [ ] Tester match complet V3.7/V3.8 à scores zéro : mêmes événements sportifs/score/box/RNG hors télémétrie ; découpage 1/40/20000 possessions et reprise milieu de match identiques. Tester blessures/exclusions, plafonds après cumul avec badges et maîtrise. `npm test` ; commit `feat: add shared-court chemistry with preserved legacy matches`.

### Task 5: Migration, import et transport worker

**Files:** modifier `dist/engine.js`, `dist/storage.js`, `dist/worker-state.js` si nécessaire, `dist/config.js`, imports de `dist/`, `dist/sw.js`, `package.json`, `package-lock.json` ; créer `tests/v38-migration.test.js`.

**Interfaces:** consommer validateurs tâche 1/2/4 et init collective ; version application `3.8.0`, schéma global 4 conservé. Export V3.8 exige un collectif valide ; anciens matchs acceptent leurs versions historiques.

- [ ] Écrire migrations V3.0–V3.7 : sous-état collectif neuf, aucun achat, argent/RNG/maîtrise conservés. Import V3.7 avec coach payé et renew=true conserve exactement cet environnement, avec seul nouveau marqueur de traitement initialisé ; seules les versions antérieures à 3.7 réinitialisent l’environnement V3.7.
- [ ] Écrire tests match commencé et copie IndexedDB : secours garde l’ancienne version, match finit avec résultat historique identique, nouvelle migration idempotente. Champs collectifs injectés dans un ancien fichier ignorés ; collectif absent/invalide dans un fichier 3.8 refusé sans remplacer la partie.
- [ ] Écrire `splitWorkerState`/`joinWorkerState` : tous duos, stage, archives, marqueurs et instantané match conservés exactement. Écrire continuation après export avec stage actif, héritage paresseux et simulation cible persistante.
- [ ] Exécuter les tests rouges, puis initialiser le collectif à création et migration. Adapter la validation du nouveau marqueur d’entraînement (jour entier non futur, y compris impair) et des sources de maîtrise. Les imports historiques de matchs ne doivent pas changer leurs calculs.
- [ ] Passer les URLs de modules/cache et métadonnées à 3.8.0. Ajouter les modules au cache. Actualiser les assertions de version courante uniquement, jamais les fixtures historiques. `npm test` ; commit `feat: migrate V3.8 saves without losing paid coaches`.

### Task 6: Interface collective et bilan compréhensible

**Files:** créer `dist/v38-view.js`, `tests/v38-view.test.js` ; modifier `dist/app.js`, `dist/style.css`, `dist/sw.js`.

**Interfaces:** produire `collectiveView(s,{busy=false}={}):string`, `stagesView(s,{busy=false,quote=null}={}):string`, `collectiveMatchSummary(result):string`. Consommer devis et commandes, jamais modifier s au rendu.

- [ ] Écrire tests purs : maîtrise existante et duos séparés, trois programmes gratuits, trois stages, coût « — » sans séance, pas de NaN/Infinity, échappement noms/raisons, textes dates/réserve/non-remboursement, jusqu’à 0,5 point de pourcentage et pas de paniers prétendument causés.
- [ ] Écrire tests états vide/actif/clos/transféré/blessé/plafond et commandes bloquées busy/pending/match/retraite ; deux partenaires distincts maximum et motif sans créneau. Snapshot de s avant/après vue strictement égal.
- [ ] Exécuter tests rouges, puis intégrer Collectif dans Carrière, stages dans Vie. Actions `collective-routine`, `stage-quote`, `stage-confirm`, `stage-dismiss`, `collective-open`. Devis UI effacé sur création/import/chargement/changement de sélection ; confirmation périmée reste affichée sans débit. Verrou d’action pendant sauvegarde.
- [ ] Afficher gains par source, minutes partagées simulées, bilans 24 entrées, coût et séances sautées. Mention routine « après le stage », historique ancien match et zéro promesse de résultat. Ajouter labels, zone de statut et focus après rendu déverrouillé.
- [ ] Vérifier tests ciblés et `npm test` ; commit `feat: expose collective preparation and camp outcomes`.

### Task 7: Campagnes, navigateur et diagnostics

**Files:** créer `tools/v38-browser.mjs`, `tools/v38-balance.mjs`, `tools/v38-match-balance.mjs`, `tools/v38-neutrality.mjs` et rapports `tests/v38-*.json` ; modifier `tools/long-run.mjs`, `tools/upgrade-check.mjs`, `package.json`.

**Interfaces:** scripts `test:v38-browser`, `test:v38-balance`, `test:v38-match-balance`, `test:v38-neutrality` ; tous échouent par assertion non nulle et inscrivent version/empreinte/graines dans leurs rapports.

- [ ] Écrire navigateur 320/390/1440 : routine/partenaires, devis annulé sans débit, confirmation devenue périmée, achat, vraie séance via worker, bilans, focus clavier, aucun débordement/erreur, reload/offline, changement de carrière sans ancien devis. Constater l’échec sur fixture pré-V3.8, puis réussite sur produit.
- [ ] Ajouter vraie décision indépendante pendant simulation jusqu’à fin de saison, résolution et cible conservée ; comparer direct/worker depuis snapshot avec stage. Tester transfert avec stage et retraite. Cocher explicitement les conditions prouvées dans rapport.
- [ ] Implémenter comparaison économique sans injection d’argent : graines 2026/973 × lycée/rookie × aucun programme, trois routines et trois stages = 28 scénarios, trois saisons chacun. Choisir deux partenaires éligibles par identifiant trié ; renouveler manuellement un stage quand légal et sans stage actif. Décisions déléguées identiques. Contrôler réserve immédiatement dans la commande d’achat, avant tout next/revenu. Rapporter coûts/gains/sauts/fatigue/minutes/blessures/titres et aucune valeur non finie, plafonds, comptabilité, bornes d’état.
- [ ] Implémenter 400 graines de matchs appariés × scores 0/50/100 × équipes inversées = 2 400 matchs ; reprendre le même état et RNG par comparaison. Mesurer points, pertes, réussite, victoires et intervalle descriptif des écarts, pas de seuil de victoire arbitraire. Affirmer symétrie par tests d’effets ; expliquer les écarts de trajectoire RNG après événements divergents.
- [ ] Ajouter différentiel V3.7/V3.8 score zéro et préparation désactivée sur matchs, pas sur saisons avec croissance gratuite. Ancienne référence : commit `6cea8a311ddd68d26cc9a94a13675355f59dc159`. Exécuter navigateurs précédents et migrations cache V3.0–V3.7, adapter le test V3.7 de neutralité devenu historique pour ne pas imposer une identité de carrière non prévue en V3.8.
- [ ] Ajouter tous les nouveaux fichiers moteur à l’empreinte long-run ; exécuter deux campagnes de 30 saisons après gel du moteur. Mesurer taille/temps de sauvegarde et rendu sur une carrière de 30 saisons ; garder les alertes de dynastie existantes. Documenter absence éventuelle de Safari physique. `npm test` et scripts verts ; commit `test: validate V3.8 economy chemistry and save continuity`.

### Task 8: Revue finale et publication

**Files:** créer `.github/workflows/validate-v38.yml`, `docs/v3.8-review.md`, `docs/validation-v3.7.md` ; modifier README, CHANGELOG, TEST-REPORT, `tools/public-check.mjs`, archive `dist/hoop-legacy-source.zip`.

**Interfaces:** CI sur branche V3.8 ; publication via Pages existant sur main. Aucun changement d’hébergement.

- [ ] Configurer CI Node 22, tests, empreintes des rapports de 30 saisons, comparaison économique et matchs, navigateur, huit migrations et simulation indépendante courte. Ajuster durée totale ou séparer les jobs par scripts indépendants si nécessaire, sans supprimer les contrôles. Les rapports d’exécution doivent correspondre au commit testé.
- [ ] Obtenir la revue indépendante prévue par le mode d’exécution ; traiter Important/Critical avec reproduction rouge, correction puis suite complète. Consigner les mineurs différés. Toute correction moteur invalide les empreintes : régénérer les rapports concernés.
- [ ] Documenter valeurs finales réellement mesurées et limites. Vérifier chaque section de la spec, ne pas annoncer le staff personnel livré. Archiver le rapport V3.7. Reconstruire ZIP sans dépendances, caches ni lui-même et vérifier son contenu contre le code.
- [ ] `git diff --check`, `npm test`, état de travail propre et commit de livraison. Sauvegarder branche distante ; comparer arbre local/distant si publication via connecteur. Aucun push forcé ; vérifier main depuis la base connue avant fusion/mise à jour.
- [ ] Attendre CI verte puis déployer par workflow existant. Smoke public : engine 3.8, écran collectif et stages visibles, création/match/sauvegarde/rechargement, préférence de simulation conservée, aucune erreur. Rapporter explicitement tout blocage de déploiement ; ne pas annoncer un lien prêt sur la seule preuve locale.

## Auto-revue et remise

Couverture : spec 1–3 → tâches 1/4 ; 4 → tâche 3 ; 5 → tâche 2 ; 6 → tâche 4 ; 7 → tâches 1/3 ; 8 → tâche 6 ; 9 → tâches 1/5 ; 10 → tâches 7/8. Les cinq Review Focus possèdent leurs tests dédiés. Les interfaces nommées sont définies ci-dessus ; aucun nouveau système hors spec.

Exécution recommandée : **directe dans cette session**, comme V3.7, puis une revue indépendante de la branche. Les huit tâches dépendent étroitement de l’état, du cycle journalier et de la clôture de match ; des transferts d’implémentation par tâche augmenteraient ici le coût de coordination. Une erreur sur sauvegarde/moteur reste couverte par les tests différentiels et la revue finale.

Statut : plan écrit et auto-revu ; attente de revue utilisateur avant implémentation. Le choix antérieur d’exécution directe est conservé sauf demande contraire. L’isolation de branche/worktree sera vérifiée au début de l’exécution, en tenant compte du choix utilisateur de travailler sur la branche courante.
