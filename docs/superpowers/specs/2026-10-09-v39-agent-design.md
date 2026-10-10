# V3.9 — Agent et négociation de carrière

Statut : proposition détaillée à valider. Aucun code V3.9 implémenté.
Base : V3.8 publiée, commit c657ca01438fa000cebd9dd474ce445fa70ed614.

## 1. Intention et périmètre

Permettre au joueur de négocier son prochain contrat, de comprendre les arbitrages entre revenus et projet sportif, et de rémunérer un agent avec l’argent gagné dans la simulation. Le joueur doit pouvoir prendre une bonne décision sans payer d’agent. Une agence coûteuse ne garantit ni meilleur revenu final, ni minutes, ni victoire.

Le périmètre agent, contre-offres, comparaison et historique a été présenté puis confirmé par « V3.9 ». Les valeurs ci-dessous sont des propositions de conception, pas un équilibrage déjà validé.

Approche retenue : négociation déterministe encadrée sur les offres existantes. Un simple bonus automatique serait peu interactif ; une refonte complète du marché et des échanges dépasse ce lot.

Hors périmètre : négociation des sponsors, clauses de transfert, rachat de contrat, contrats progressifs, garanties partielles, modification du salary cap, immobilier et staff médical. Les règles sont celles du jeu, pas une reproduction des conventions professionnelles réelles.

## 2. Représentation

Le personnage d’agent déjà présent dans les dialogues est conservé. Un nouveau mandat commercial distinct évite de transformer rétroactivement ce contact en service payant.

| Mandat | Commission sur salaire net simulé | Marge salariale additionnelle | Service |
|---|---:|---:|---|
| Autogestion | 0 % | 0 point | Comparaison complète, contre-offres accessibles |
| Conseiller local | 1 % | 1 point | Petite marge de négociation supplémentaire |
| Agence nationale | 2 % | 3 points | Marge intermédiaire |
| Agence internationale | 3 % | 5 points | Marge supérieure, coût plus élevé |

Le mandat ne crée aucune offre et ne contourne jamais le budget du club. Les profils sont volontairement comparables ; aucun faux privilège d’accès à une ligue. Un exemple chiffré présente le gain salarial nécessaire pour compenser la commission.

Choix gratuit du mandat pour les négociations futures, hors match, décision en attente, simulation active et retraite. Aucun acompte, abonnement ou prélèvement lors du choix. Mandat par défaut : autogestion, y compris après migration. Le mandat est figé à la création d’une session d’offres et reste indiqué sur chaque offre.

Les offres universitaires, de draft et les anciennes offres migrées sont non négociables et sans commission. L’interface explique cette exception. Aucun changement rétroactif de contrat.

## 3. Priorités et comparaison

Réutiliser `careerPlan.preference` : équilibre, minutes, titre, salaire ; ajouter stabilité. Ne pas créer un deuxième réglage concurrent. Les discussions existantes et le comparateur pilotent la même préférence.

- Salaire : trier par revenu net annuel après commission, pas par montant brut.
- Stabilité : durée décroissante puis revenu net total théorique décroissant.
- Minutes : projection de minutes, sans modifier le rôle ou la rotation.
- Titre : force du club calculée par le comparateur existant, pas une promesse de titre.
- Équilibre : conserver le classement sportif existant.

Les égalités sont départagées par l’ordre initial des offres. Afficher brut annuel, net simulé avant commission, taux et montant estimé de commission, net après commission, durée, total théorique, projet, concurrence et minutes projetées. Mentionner que les montants annuels sont des estimations, hors sponsors, dépenses et placements ; le moteur paie quotidiennement avec arrondi au centime.

## 4. Session et contre-offres

Chaque nouvelle session professionnelle négociable capture un identifiant, la date, le mandat, les offres initiales et les contraintes du club. L’offre initiale est immuable ; une proposition courante séparée contient les termes signables. Deux contre-offres maximum par offre, conservées après rechargement. Aucun bouton ne régénère les contraintes ou le nombre de tentatives.

Le joueur choisit une demande salariale : salaire initial, +5 %, +10 % ou +15 %, et une durée parmi durée initiale moins un an, initiale, plus un an, limitée à 1–4 ans. Les demandes sont toujours calculées depuis l’offre initiale, jamais cumulées depuis une contre-offre. Une demande strictement identique à la proposition courante est refusée sans consommer de tentative.

La consultation du devis ne consomme ni argent, ni aléatoire, ni tentative. La soumission explicite consomme une tentative, sans avancer le jour. Un double clic portant la même révision est idempotent. Un devis périmé doit être reconfirmé avant soumission.

### Réponse du club

Réutiliser la concurrence au poste employée par `offerFor`. À la création de l’offre :

- `écart = niveau du héros − niveau du meilleur concurrent au poste`, avec le niveau de ligue comme repli sans concurrent.
- Marge sportive : `clamp(2 + écart / 2, 0, 10)` points de pourcentage.
- Marge totale : marge sportive + marge du mandat, plafonnée à 15 %.
- Capacité salariale : `max(salaire initial, budget du club − masse salariale hors héros)`. Cette règle n’aggrave pas les éventuels dépassements déjà permis par le moteur V3.8.
- Plafond offert : minimum entre capacité salariale et salaire initial augmenté de la marge totale, arrondi à l’euro inférieur.
- Une année supplémentaire est acceptable si le héros a au plus 30 ans et si l’écart au poste est au moins zéro. Une année en moins est acceptable dans les limites 1–4. Sinon conserver la durée initiale.

Si les deux demandes sont acceptables, le club accepte. Sinon il propose le salaire demandé plafonné et la durée acceptable : c’est un compromis si ces termes diffèrent de la proposition courante, un refus s’ils sont identiques. La réponse explique séparément marge sportive, mandat, budget et durée. Pas de tirage aléatoire caché ni de bonus après refus.

Chaque réponse devient la proposition courante. L’offre initiale reste également signable, clairement distinguée. Un refus ne retire jamais la dernière offre : la version ne doit pas enfermer le joueur sans contrat à l’intersaison.

La décision contractuelle suspend déjà l’avancement du temps. Les échéances existantes sont affichées sans introduire un nouveau mécanisme d’expiration automatique dans cette version. Les demandes de transfert gardent leurs restrictions et délai existants. Ouvrir une nouvelle session clôt l’ancienne ; cela ne réinitialise pas le délai de marché.

## 5. Signature et commission

La signature reste atomique : vérifier session, identifiant d’offre, révision, termes proposés et état du joueur avant tout transfert. Les termes ne proviennent jamais directement des champs du navigateur. Aucun prélèvement à la signature.

Le contrat signé conserve son taux de commission et son mandat d’origine. Changer d’agent ensuite ne supprime pas les frais du contrat courant et n’ajoute pas une deuxième commission. Le nouveau mandat ne concerne que le prochain contrat signé. Prévenir explicitement le joueur avant confirmation.

La commission journalière vaut `arrondiCentime(salaireNetDuJour × taux)` ; le net du jour garde le calcul V3.8 `arrondiCentime(salaireAnnuel / 365 × 0,76)`. Commission nulle hors carrière professionnelle, après retraite ou sans contrat rémunéré. Les sponsors et placements sont exclus.

Ordre quotidien : crédit du salaire et des sponsors, commission, dépenses de vie recalculées sur le disponible après commission, puis placements. La commission est prélevée uniquement sur le revenu reçu, jamais sur la réserve ou une dette. Paiement et écritures comptables sont protégés par la même garde quotidienne ; rejouer le jour ne double rien.

Écriture séparée « Commission d’agent » dans le journal financier. Cumuls par contrat et de carrière au centime. Les totaux comptables existants restent exacts. Remplacer un contrat clôt son suivi ; la retraite ferme le mandat et le suivi sans coût. La diminution annuelle des années restantes ne remet pas les compteurs à zéro.

Le contrat rookie initial, les signatures de draft et les contrats migrés sont exempts, y compris lorsqu’une option existante est exercée. Les nouveaux contrats négociés gardent les options actuelles « Aucune » et la garantie existante ; aucune clause décorative présentée comme nouvelle fonctionnalité.

## 6. État et architecture

Nouveau sous-état `representation` versionné : mandat futur, session active, suivi du contrat courant, historique borné à 40 négociations et cumuls de carrière. Sessions et contrats utilisent des identifiants stables ; les références historiques à un club ne dépendent pas de son effectif actuel.

- `representation-catalog.js` : profils, taux et limites immuables.
- `representation-state.js` : état initial, migration, validation et historique borné.
- `negotiation.js` : contraintes, devis purs, soumission et sélection de termes, sans tirage RNG.
- `representation-view.js` : comparateur, mandat, réponses et bilan, données externes échappées.
- Intégrations ciblées : création/signature d’offres dans `engine.js`, flux dans `finance.js`, priorités dans `career-plan.js`, commandes/retraite, affichage et worker.

Les modules de calcul purs reçoivent leurs données plutôt que d’importer l’intégralité du moteur ; éviter un nouveau cycle moteur–finances–négociation. Les commandes moteur sont l’autorité pour toutes les limites et autorisations.

## 7. Interface mobile

Dans Carrière : « Mon agent » affiche mandat futur, commission du contrat en cours et historique. Dans la décision de contrat : cartes comparables, détail du club, offre initiale/proposition courante, bouton contre-offre et confirmation de signature détaillant les frais.

Deux tentatives restantes visibles, réponse du club immédiatement lisible, aucun défilement forcé vers un bouton masqué par la navigation. Annuler un formulaire ne modifie rien. Après retour du worker, rechargement, import ou changement de carrière, supprimer tout devis UI périmé. Focus rendu au déclencheur à la fermeture.

La cible de simulation reste inchangée pendant le choix d’agent et la négociation ; reprendre la simulation ne signe pas automatiquement un contrat. Toute automatisation déjà existante doit conserver son comportement sans acheter de mandat ni négocier spontanément.

## 8. Sauvegardes et compatibilité

Migrations V3.0–V3.8 avec secours préalable. Conserver argent, préférences, historique, coachs, collectif, contrats et matchs en cours. Initialiser autogestion, zéro commission et zéro cumul ; ne pas reconstruire de faux revenus passés. Offres déjà présentes : conservées, exemptes, non négociables jusqu’à une nouvelle session.

Validation stricte : mandats autorisés, nombres finis, taux du catalogue, bornes de durée et tentatives, références et révisions cohérentes, dates non futures, historique limité, compteurs non négatifs et termes signables compatibles avec les contraintes enregistrées. Refuser les objets nuls ou incomplets ; une sauvegarde native V3.9 corrompue n’est pas silencieusement réparée comme une migration.

Sans mandat payant ni contre-offre, conserver les sorties V3.8 à entrées égales, hors version et nouveau sous-état neutre. Les consultations/choix de mandat ne consomment aucun flux RNG. Ne pas modifier les formules de match pour cette version ; les anciens matchs gardent leurs règles.

## 9. Validation exigée

Tests unitaires : plafonds salariaux et budget, durée/âge aux limites, tentatives, compromis/refus, double clic, signature initiale ou négociée, mandat figé, changement d’agent, contrat remplacé, retraite, exemptions amateur/draft, frais au centime et répétition du jour.

Tests de comptabilité : salaire zéro, petits montants, sponsors seuls, faible trésorerie, dépenses plafonnées et placement après commission. Aucun débit rétroactif ni prélèvement sur la réserve. Vérifier l’écart réel de revenus, pas uniquement le devis annuel.

Tests de transport et migration : moteur direct/worker identiques, sauvegarde/rechargement au milieu des deux tentatives, neuf versions V3.0–V3.8, match et RNG conservés, ancien cache et mode hors ligne. Sauvegardes mal formées rejetées avant affichage.

Navigateurs à 320/390/1440 pixels : choix de mandat, contre-offre annulée, devis périmé, refus, compromis, signature, commissions après avancement, préférence de simulation persistante, focus, zéro erreur et débordement. Un parcours public après déploiement vérifie ces vues sans achat réel.

Économie : deux graines × quatre mandats × trois stratégies (offre initiale, priorité salaire, priorité stabilité), sur trois saisons professionnelles = 72 saisons comparées, sans injection d’argent. Rapport : salaires, commissions, revenu après frais, tentatives, refus, durée, minutes et changements de club. Comparer à une référence identique ; ne pas attribuer aux agents les effets de trajectoires sportives différentes. Ajouter la voie amateur puis draft pour vérifier les exemptions, et deux carrières de 30 saisons pour les archives et la comptabilité.

Avant livraison : tests et CI verts, rapports portant l’empreinte du code réellement testé, archive source vérifiée et test du site public. La revue V3.8 interrompue reste une réserve historique, pas une approbation. Ne pas réessayer cette action refusée par une autre voie ; tout blocage de validation V3.9 doit être déclaré, sans promettre une revue obtenue.

## 10. Critère de réussite et étape suivante

Le joueur peut distinguer l’offre du club, sa demande, la réponse et le contrat signé ; il comprend exactement combien l’agent lui coûte. L’agent reste facultatif et les minutes ne sont pas garanties. Aucun gain artificiel de notes, aucune multiplication des augmentations par clic, aucun changement silencieux de sauvegarde.

Après validation de ce document : écrire le plan d’implémentation, choisir son mode d’exécution, puis développer. Ce document n’annonce aucune fonctionnalité V3.9 livrée.
