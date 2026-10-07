# HOOP LEGACY V3.7-A — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer un coach individuel payant, lié aux vraies séances et accompagné d’un bilan financier et sportif vérifiable.

**Architecture:** Un module `environment.js` porte le contrat, ses commandes et ses compteurs ; une vue pure affiche les devis et bilans. Le moteur traite les échéances avant l’entraînement, puis le calcul existant des XP applique le supplément ciblé. Le registre financier existant reste la référence des mouvements d’argent.

**Tech Stack:** JavaScript ES modules, application web/PWA existante, IndexedDB, Web Worker, Node test runner, Playwright. Aucune nouvelle dépendance produit.

**Spec:** `docs/superpowers/specs/2026-10-04-v37-environment-design.md` (validée le 4 octobre 2026).

## Global Constraints

- « plafond commun de 99, progression de base inchangée, matchs automatiques, préférence de simulation persistante, fonctionnement mobile et hors ligne, sauvegardes antérieures préservées. Aucun achat en argent réel. »
- Un seul coach actif ; prix de 300 / 1 200 / 4 000 pour 30 jours et taux de 10 / 15 / 20 % du seul domaine éligible.
- Achat D : couverture D+1 à D+30 ; renouvellement D+31 avant entraînement et revenus du jour ; réserve préservée ; aucune dette ni remboursement.
- Renouvellement désactivé par défaut ; pas de nouvel essai automatique après refus.
- Historique de 24 périodes maximum ; totaux de carrière conservés.
- Aucun changement des règles de match 3.5 ; version applicative cible 3.7.0, sans annoncer les lots B à D comme livrés.
- Ne pas retoucher l’équilibrage IA ni ajouter d’effet direct aux matchs, à la maîtrise ou aux relations.
- Point de départ : branche `work/hoop-legacy-v3.7`, produit V3.6 au commit `ce85a69df13a294be685555122ce4f2b5c09bf9e`.

## Review Focus

1. Devis périmé après modification des fonds ou du programme : recalculer à la confirmation ; ne jamais faire confiance à un prix envoyé par l’interface (tâche 1).
2. Deux confirmations ou deux traitements de la même date : un seul débit et une seule séance, y compris après rechargement (tâches 1 et 2).
3. Renouvellement le jour d’un investissement automatique : utiliser le solde d’ouverture, puis laisser les revenus et placements existants traiter le solde restant (tâche 2).
4. Import hostile : `NaN`, identifiants hérités du prototype, dates ou cumuls incohérents ; rejet avant remplacement de la partie (tâche 3).
5. Programme différent du coach et zéro séance : expliquer zéro bénéfice et afficher « — » au coût par séance, jamais Infinity ou un gain estimé présenté comme réel (tâche 4).

## Cartographie des fichiers et interfaces

- Créer `dist/environment.js` : état, catalogue versionné, devis purs, commandes, échéances, supplément de séance, clôture et validation.
- Créer `dist/v37-view.js` : vue pure ; styles ciblés dans `dist/style.css`.
- Modifier `dist/progression.js`, `dist/engine.js`, `dist/commands.js` : points d’intégration limités. Réutiliser `finance.js:receipt` et `cents` sans réécrire les finances.
- Modifier `dist/app.js` : états locaux du devis, événements et routage vers les réglages existants.
- Modifier `dist/storage.js`, `dist/sw.js`, `dist/config.js`, imports versionnés de `dist/`, `package.json` et son lockfile : compatibilité et publication.
- Créer `tests/v37.test.js`, `tests/v37-view.test.js`, `tools/v37-browser.mjs`, `tools/v37-balance.mjs`, `.github/workflows/validate-v37.yml`.
- Modifier `tools/long-run.mjs` pour inclure le nouveau module dans l’empreinte ; actualiser le smoke test public existant, README, CHANGELOG et TEST-REPORT.

Contrats JavaScript (les types ci-dessous décrivent les objets, sans introduire TypeScript) :

- `initEnvironment(s): void` crée `s.environment={version:1,nextId:1,contract:null,renew:false,processedDay:null,lastTrainingDay:null,history:[],totals:{paid:0,sessions:0,extraXP:0},notice:null}`.
- Catalogue figé version 1, clés propres `local`, `confirmed`, `expert`, prix/taux de la spec. Lire les domaines depuis `GROUPS` dans config, pas depuis progression, pour éviter une dépendance circulaire supplémentaire.
- `coachQuote(s,offerId,domain): Quote` pure ; `Quote={ok,reason,offerId,domain,price,rate,start,end,balanceAfter,reserve}`. Pour une entrée inconnue : `ok:false`, champs non applicables à `null`.
- `hireCoach(s,offerId,domain,{busy=false}={}): boolean` recalcule le devis et refuse sans mutation si interdit ; aucun paramètre prix/taux client.
- `setCoachRenewal(s,enabled,{busy=false}={}): boolean` n’accepte qu’un booléen et un contrat non clos.
- `environmentDay(s): void` règle les échéances une fois par journée ; n’appelle aucune commande utilisateur bloquée par le contexte moteur.
- `coachTraining(s,p,raw): {amounts,extraXP,assisted}` calcule et comptabilise le supplément une seule fois, sur les XP bruts déjà calculés. Ne dépense pas d’XP et n’appelle pas `awardXP`.
- `closeEnvironment(s,reason): void` archive le contrat, coupe le renouvellement et préserve les cumuls ; idempotente.
- `validateEnvironment(s): void` lève une erreur explicite sans réparer silencieusement un état V3.7 invalide.
- `environmentView(s,{busy=false,quote=null}={}): string` ne mute rien et échappe les valeurs affichées.

Contrat sauvegardé : `{id,catalogVersion,offerId,domain,price,rate,bought,start,end,lastSessionDay:null,sessions:0,extraXP:0}`. Une archive ajoute `{closed,reason}`. Totaux `paid` incrémentés au paiement, `sessions/extraXP` à la séance ; ne pas les additionner une seconde fois à la clôture. L’identifiant unique figure dans le libellé du reçu financier. Aucun import ne déclenche de paiement.

### Task 1: Contrat et paiement atomique

**Files:** créer `dist/environment.js` et `tests/v37.test.js`.

**Interfaces:** produit `initEnvironment`, `coachQuote`, `hireCoach`, `setCoachRenewal` ; consomme `canChange(s,{busy})`, `receipt(s,label,cash)` et `cents(n)` existants. Les imports cycliques déjà présents ne doivent être consultés qu’à l’appel, jamais pendant l’évaluation du module.

- [ ] Écrire les tests avec `make=()=>createGame({...defaultBuild(),path:'rookie'})`, puis appeler `initEnvironment` explicitement jusqu’à l’intégration tâche 3. Exemple exact du cas nominal :

```js
const s=make(); initEnvironment(s); s.money=6000; s.life.finance.reserve=5000;
const rng=structuredClone(s.rng), cash=s.life.finance.totals.cash;
assert.equal(coachQuote(s,'local','Tir').price,300);
assert.equal(hireCoach(s,'local','Tir'),true);
assert.equal(s.money,5700);
assert.equal(s.life.finance.totals.cash,cash-300);
assert.equal(s.environment.contract.start,1);
assert.equal(s.environment.contract.end,30);
assert.equal(s.environment.renew,false);
assert.equal(hireCoach(s,'local','Tir'),false);
assert.equal(s.money,5700); assert.deepEqual(s.rng,rng);
```

- [ ] Ajouter les assertions `ok===false` et état identique avant/après pour fonds 5 299,99, spécialité entièrement à 99, offre `__proto__`, domaine inconnu, match, décision, retraite et `{busy:true}`. Un devis obtenu avec 6 000 puis confirmé avec 5 200 doit échouer sans débit. Un solde de 5 300 doit être accepté et finir à 5 000.
- [ ] Exécuter `node --test tests/v37.test.js` : échec attendu sur l’import ou les fonctions absentes ; conserver la preuve de l’échec.
- [ ] Implémenter les quatre interfaces, les trois offres figées, les raisons de refus et un débit unique avec reçu de période. `initEnvironment` ne crée pas de reçu ni ne consomme de RNG.
- [ ] Exécuter `node --test tests/v37.test.js` puis `npm test` : zéro échec.
- [ ] Commit ciblé : `feat: add prepaid personal coach contracts`.

### Task 2: Échéances et effets réels sur les séances

**Files:** modifier `dist/environment.js`, `dist/progression.js`, `dist/engine.js`, `dist/commands.js`, `tests/v37.test.js`.

**Interfaces:** produit `environmentDay`, `coachTraining`, `closeEnvironment` ; consomme contrats tâche 1 et `trainingDay`, `awardXP` existants.

- [ ] Écrire les tests d’échéance : achat D=0, pas de renouvellement à 30, puis à 31 nouveau contrat `[31,60]`, solde diminué une seule fois de 300. Deux appels à `environmentDay` à 31 conservent exactement l’état du premier. Tester fonds insuffisants, plafond 99, résiliation, blessure sans prolongation, transfert portable et retraites manuelle/automatique.
- [ ] Écrire le test d’ordre financier : à 31 avec solde 5 299 et réserve 5 000, le renouvellement échoue même si `financeDay` crédite ensuite un salaire suffisant ; le jour suivant ne tente pas de prélèvement. Avec 6 000 et placement automatique dû, vérifier débit de 300 avant la formule de placement existante.
- [ ] Écrire une matrice six domaines × trois intensités × activités individuel/vidéo/études/famille : cloner une même partie sans coach et avec coach, désactiver la dépense automatique, utiliser le même jour pair. Pour chaque domaine : `extraXP===Math.round(raw*(1+rate))-Math.round(raw)` ; différence zéro sur les cinq autres domaines ; fatigue et maîtrise égales entre les clones. Blessure, repos, fatigue >65, jour impair ou mauvais domaine donnent zéro supplément. `raw` attendu est calculé dans le test depuis les coefficients explicites de V3.6, pas via la fonction testée.
- [ ] Ajouter le test de répétition de `trainingDay` sur la même date, y compris après sérialisation : XP, fatigue, maîtrise et compteurs restent identiques au premier traitement. Le garde couvre la séance entière, pas uniquement son bonus ; poser le marqueur avant les effets, après constat d’une vraie séance admissible. `lastTrainingDay` ne change pas pour un jour sans séance.
- [ ] Exécuter `node --test tests/v37.test.js` : nouveaux tests rouges pour des raisons correspondant aux comportements manquants.
- [ ] Implémenter les trois interfaces. Dans `advanceDay`, appeler `environmentDay` après changement de date et avant `trainingDay`. Appliquer `coachTraining` après les modificateurs d’activité et avant l’unique `awardXP`. Archiver au maximum 24 périodes sans réduire les cumuls. À la retraite, fermer directement ; aucune notification ne crée `pending` ni ne change `simulation`.
- [ ] Exécuter tests ciblés et `npm test` ; vérifier égalité de RNG avant/après commandes. Commit : `feat: apply coach benefits to eligible training only`.

### Task 3: Sauvegardes, validation et neutralité sans achat

**Files:** modifier `dist/environment.js`, `dist/engine.js`, `dist/storage.js`, `dist/config.js`, imports versionnés dans `dist/`, `dist/sw.js`, `package.json`, `package-lock.json`, `tests/v37.test.js`.

**Interfaces:** produit `validateEnvironment` et initialisation systématique dans création/migration ; consomme `migrateLegacy`, `validate`, `parseSave` et sauvegarde de migration existants.

- [ ] Écrire des tests de migration 3.0 à 3.6 vers 3.7 : environnement vide, aucun débit, même RNG/attributs/match commencé ; seconde migration strictement identique. Continuer le même match dans les deux copies et comparer résultat et RNG.
- [ ] Écrire des tests d’import refusé : `NaN`, montants négatifs, gamme héritée du prototype, prix/taux discordants avec catalogue version 1, identifiants répétés, dates non entières ou durée différente de 30, compteur de séances impossible, historique >24, cumuls inférieurs aux données détaillées. Assert `throws`; vérifier la partie courante inchangée après échec de `parseSave`.
- [ ] Capturer une référence sans achat depuis le commit V3.6, dans un répertoire QA isolé, avant d’actualiser les imports. Sur deux graines 2026/973 et deux saisons avec mêmes décisions déterministes, comparer les données sportives, XP, argent et RNG ; exclure uniquement les métadonnées de version, le nouveau sous-état et le texte du journal de migration.
- [ ] Exécuter les nouveaux tests pour observer leur échec, puis implémenter validation et initialisation. Migrer seulement les versions reconnues, préserver la sauvegarde avant migration et ne pas accepter silencieusement un environnement manquant dans un export déclaré 3.7.
- [ ] Passer l’application et les URL de modules à `3.7.0`, mais conserver la version des règles des matchs. Ajouter `environment.js` au cache hors ligne. Mettre à jour les assertions d’ancienne version seulement lorsqu’elles testent la version courante, pas les fixtures historiques.
- [ ] Exécuter `npm test` et le contrôle différentiel V3.6/V3.7 : zéro différence fonctionnelle sans achat. Commit : `feat: migrate saves safely to V3.7`.

### Task 4: « Mon environnement » et devis mobile

**Files:** créer `dist/v37-view.js`, `tests/v37-view.test.js` ; modifier `dist/app.js`, `dist/style.css`, `dist/sw.js`.

**Interfaces:** produit `environmentView` ; consomme les devis et commandes tâches 1/2. Actions UI : `coach-quote`, `coach-confirm`, `coach-dismiss`, `coach-renew`, `coach-program`, `coach-finance`.

- [ ] Écrire les tests purs de vue : état inchangé, contenu échappé, trois tarifs, dates, réserve, absence de remboursement, renouvellement désactivé ; spécialité différente explique zéro bénéfice. Avec zéro séance : coût par séance « — », aucune chaîne Infinity/NaN. Chaque contrôle de mutation désactivé pour busy/match/pending/retraite.
- [ ] Exécuter `node --test tests/v37-view.test.js` et observer l’échec d’import.
- [ ] Implémenter la vue et son insertion dans Vie. Le devis reste local à l’interface, ne crée aucune décision moteur et n’avance pas le temps. Une confirmation recalcule les conditions ; en cas de refus, conserver un message explicite. Après succès, sauvegarder via le chemin existant et vider le devis.
- [ ] Relier « Régler mon programme » et « Régler ma réserve » aux contrôles existants sans changement automatique du domaine ou de la réserve. Appeler les commandes avec le vrai drapeau `busy`; préserver le verrou d’action existant contre les doubles clics.
- [ ] Afficher période courante, historique et totaux distinctement, ainsi que l’arrêt du renouvellement et sa raison. Ajouter labels accessibles, zone de statut et mise en page sans débordement à 320 px ; ajouter la vue au cache.
- [ ] Exécuter tests ciblés puis `npm test`. Commit : `feat: add mobile environment quotes and benefit reports`.

### Task 5: Parcours navigateur, worker et carrières comparées

**Files:** créer `tools/v37-browser.mjs`, `tools/v37-balance.mjs` ; modifier `package.json`, `tools/long-run.mjs` ; écrire les rapports `tests/v37-browser-report.json` et `tests/v37-balance.json` pendant les exécutions.

**Interfaces:** consomme API des tâches 1 à 4 ; scripts `test:v37-browser` et `test:v37-balance` produisent un code retour non nul à toute assertion échouée et indiquent version/empreinte/graines.

- [ ] Écrire d’abord les assertions du parcours Playwright : achat après devis, annulation de devis sans débit, reload avec contrat identique, bilan après vraie simulation worker, offline après service worker prêt, renouvellement unique et blocages. Tester largeurs 320/390/1440, absence de débordement, navigation clavier et aucune erreur console.
- [ ] Ajouter l’assertion de destination persistante : sélectionner simulation jusqu’à fin de saison, traverser une échéance, rencontrer une décision réelle, la résoudre et vérifier préférence/cible conservées. Comparer aussi moteur direct et worker depuis le même snapshot financé ; états identiques après les mêmes pas.
- [ ] Exécuter le script sur la version pré-interface ou une fixture sans nouvelle vue et constater l’échec du sélecteur attendu ; exécuter ensuite sur l’application complète et obtenir zéro échec. Ne pas faire passer un test en supprimant son assertion.
- [ ] Implémenter `tools/v37-balance.mjs` : graines 2026/973, parcours lycée et rookie, scénario sans service et chaque gamme, trois saisons par scénario. Même domaine Tir, renouvellement activé uniquement après achat légal quand abordable ; aucune injection d’argent. Utiliser les mêmes règles de décisions déléguées. Rapporter dépenses, séances, suppléments, trajectoire des attributs, solde minimum et plafonds ; les écarts de RNG en aval d’attributs différents ne sont pas considérés comme un bug de neutralité.
- [ ] Ajouter assertions : sans achat zéro supplément/dépense de coach ; jamais de débit sous réserve à l’instant de paiement ; aucune valeur non finie, aucun attribut >99, intégrité financière et historique borné. Les écarts de durée de progression sont mesurés, pas arbitrairement déclarés équilibrés.
- [ ] Exécuter `npm test`, `npm run test:v37-browser`, `npm run test:v37-balance` ; relancer les navigateurs V3.3/V3.5/V3.6 et migrations cache 3.0–3.6. Variables Chromium existantes si nécessaires : `CHROMIUM_EXECUTABLE_PATH=/workspace/hoop-research/chromium-runtime/chromium`, `LD_LIBRARY_PATH=/workspace/hoop-research/chromium-runtime`.
- [ ] Ajouter `environment` à l’empreinte du long-run et régénérer les deux rapports 30 saisons par `node tools/long-run.mjs 2026 973`. Les anciens rapports ne prouvent pas la nouvelle version. Commit : `test: verify V3.7 economy persistence and career impact`.

### Task 6: Revue, documentation et publication vérifiée

**Files:** créer `.github/workflows/validate-v37.yml` ; modifier README, CHANGELOG, TEST-REPORT, le smoke test public et `dist/hoop-legacy-source.zip`.

**Interfaces:** consomme les scripts/rapports tâche 5 ; CI de branche puis workflow Pages existant. Pas de changement d’hébergeur ni de nouvelle dépendance payante.

- [ ] Créer CI de branche V3.7 à partir de V3.6 : tests, nouveau navigateur, comparaison économique, migrations incluant commit V3.6, contrôle des empreintes et smoke moteur indépendant. Ne pas réutiliser un résultat portant l’ancienne empreinte.
- [ ] Obtenir une revue indépendante selon le mode d’exécution choisi ; pour chaque défaut confirmé, test rouge puis correction et relance de la vérification concernée. Aucune nouvelle fonctionnalité hors spec pendant cette revue.
- [ ] Documenter exactement V3.7-A, tarifs, limites des bonus, règles de résiliation et différences avec les lots futurs. Reporter les mesures réellement obtenues et toute limite de validation (notamment absence éventuelle de test sur iPhone physique).
- [ ] Régénérer l’archive source en excluant node_modules, caches QA et l’archive elle-même. Vérifier `git diff --check`, tests et état final ; commit ciblé, puis sauvegarde de branche via le connecteur GitHub configuré si nécessaire. Aucun push forcé ni extraction de credentials.
- [ ] Attendre CI verte avant mise à jour de main ; vérifier que main n’a pas divergé depuis la base connue. En cas de divergence, s’arrêter pour résoudre proprement, sans écraser un travail externe.
- [ ] Publier par le workflow existant puis vérifier le lien public `dist/?v=3.7.0` : version chargée, section visible, sauvegarde/rechargement et aucune erreur. Un échec de déploiement doit être annoncé comme tel, sans présenter la version comme disponible.

## Auto-revue et remise

Couverture : objectifs et limites → contraintes globales ; parcours et prix → tâches 1/4 ; sport et comptabilité → tâches 1/2 ; sauvegardes → tâche 3 ; critères de réception → tâche 5 ; livraison → tâche 6. Les cinq points Review Focus ont chacun leurs assertions dans les tâches indiquées. Aucun lot B–D ajouté à ce plan.

Mode recommandé : **exécution directe dans cette session**, tâches successives avec tests et commits, puis revue indépendante de l’ensemble. Les interfaces sont fortement liées ; six transferts d’implémentation n’apportent pas ici un gain évident. Alternative : implémentation par sous-agents avec revue de chaque tâche, plus coûteuse en contexte.

Statut : plan approuvé, exécution directe sur la branche courante choisie par l’utilisateur. Tâches 1 à 5 terminées, revue indépendante et corrections terminées. Tâche 6 : documentation et archive préparées ; CI, déploiement et contrôle public restent les conditions de livraison.
