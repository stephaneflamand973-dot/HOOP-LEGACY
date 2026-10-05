# HOOP LEGACY — V3.7 « Mon environnement »

Date : 4 octobre 2026. Statut : cadrage validé par « Go V3.7 » ; non implémenté.

## 1. Objectif et périmètre

Donner une utilité sportive concrète à l’argent du personnage : acheter de meilleures conditions de progression, sans acheter directement des attributs ni rendre une carrière modeste moins viable.

La roadmap a retenu un premier lot vertical : coach individuel, programme ciblé, coût récurrent et bilan d’efficacité. Cette spécification porte sur ce lot, appelé V3.7-A. Elle ne présente pas toute la roadmap V3.7 comme livrée.

Contraintes conservées : plafond commun de 99, progression de base inchangée, matchs automatiques, préférence de simulation persistante, fonctionnement mobile et hors ligne, sauvegardes antérieures préservées. Aucun achat en argent réel.

## 2. Approche retenue

Trois approches possibles :

- Bonus permanent acheté une fois : simple, mais transforme l’argent en amélioration automatique sans activité réelle.
- **Service prépayé pour 30 jours de jeu : recommandé.** Il ne bénéficie qu’aux séances effectivement effectuées, affiche son coût complet et ne crée aucune dette.
- Staff complet, bâtiments et stages immédiatement : couverture plus large, mais nombreux effets interdépendants à équilibrer avant de pouvoir vérifier la première boucle.

Le premier lot utilise donc un seul coach actif. Les installations, autres spécialistes et stages constituent des sous-projets suivants, chacun avec son propre cadrage.

## 3. Parcours joueur

Dans Vie, une section « Mon environnement » présente :

1. Le programme d’entraînement actuel, les fonds disponibles et la réserve financière.
2. Trois offres de coach, le domaine couvert, le prix pour 30 jours et l’effet maximal.
3. Un récapitulatif avant confirmation : première et dernière journées couvertes, montant débité immédiatement, renouvellement désactivé par défaut, absence de remboursement.
4. Le service actif : spécialité, échéance, statut du renouvellement et raison éventuelle de non-utilisation.
5. Un bilan : séances accompagnées, XP supplémentaires réellement accordés, coût payé et coût par séance accompagnée.

Le joueur choisit parmi les six domaines existants : Finition, Tir, Création, Défense, Rebond et Physique. Le contrat ne change pas silencieusement son programme. Un raccourci permet d’ouvrir le réglage d’entraînement existant.

Le prix et les coefficients ci-dessous sont des valeurs de conception proposées, pas des résultats d’équilibrage déjà obtenus :

| Offre | Prix pour 30 jours de jeu | Majoration du domaine ciblé |
| --- | ---: | ---: |
| Coach de proximité | 300 unités monétaires | 10 % |
| Coach confirmé | 1 200 unités monétaires | 15 % |
| Coach expert | 4 000 unités monétaires | 20 % |

Le rendement marginal décroît : payer beaucoup plus ne multiplie pas la puissance. Les prix utilisent la monnaie déjà affichée dans le jeu.

## 4. Règles sportives

Le bonus s’applique seulement si le contrat couvre la journée, si une vraie séance est accordée par le moteur et si le domaine du programme correspond à la spécialité du coach.

Les conditions existantes restent prioritaires : blessure, repos, fatigue excessive et jours sans séance ne donnent aucun bonus. Les réductions liées à l’activité, à la charge et au parcours scolaire restent appliquées. Le service ne crée aucune séance supplémentaire et n’augmente pas l’intensité ou la fatigue par lui-même.

Pour le domaine éligible, après le calcul existant de la séance :

`XP de référence = arrondi(XP bruts existants)`

`XP accordés = arrondi(XP bruts existants × (1 + taux du coach))`

`XP supplémentaires observés = XP accordés − XP de référence`

Les autres domaines ne changent pas. Les XP restent attribués à la source « entraînement » ; le sous-système conserve séparément la part supplémentaire, sans double comptage. L’achat ne change ni les XP de match, ni les règles de match, ni la maîtrise du système, ni les relations.

Les attributs restent plafonnés à 99. Si toutes les compétences du domaine sont à 99, aucun nouveau contrat ni renouvellement n’est possible pour ce domaine. Pour une période déjà payée, le bonus cesse dès ce plafond atteint ; la date de fin ne change pas et le montant n’est pas remboursé. Cette condition figure dans le devis.

Le bilan distingue XP supplémentaires et attributs effectivement gagnés : il ne prétend pas qu’un attribut acheté ensuite provient exclusivement du coach.

## 5. Paiement et cycle de vie

- Achat au jour D : débit unique immédiat ; couverture de D+1 à D+30 inclus. Aucun effet rétroactif sur une séance déjà jouée.
- Achat accepté seulement si le solde après paiement reste supérieur ou égal à la réserve financière configurée. Le devis explique un refus et renvoie vers les réglages financiers ; aucune liquidation automatique des investissements.
- Prix et taux sont figés dans la période souscrite. Aucun empilement de contrats.
- Renouvellement facultatif, désactivé par défaut. Activable ou désactivable pendant la période hors blocages de commande.
- À D+31, le renouvellement est évalué avant l’entraînement, sur le solde déjà disponible. Les revenus du jour, calculés plus tard par le moteur existant, ne sont pas anticipés. Une nouvelle période couvre D+31 à D+60 inclus.
- Si les fonds sont insuffisants après maintien de la réserve, si le joueur est retraité ou si le domaine est entièrement à 99 : pas de débit, pas de bonus, renouvellement désactivé, message d’explication. Aucun nouvel essai silencieux les jours suivants.
- Résilier signifie désactiver le prochain renouvellement. La période payée reste disponible jusqu’à son échéance, sans remboursement. Changer de spécialité ou de gamme nécessite la fin de la période puis un nouvel achat.
- Blessure, repos ou changement d’activité ne suspendent pas l’échéance. Le service représente du temps réservé auprès du coach ; les conditions sont affichées avant achat.
- Un transfert ne rompt pas le service : ce premier lot représente un accompagnement individuel portable. Il ne simule pas de locaux privés ni de déplacements.
- La retraite termine les effets et désactive tout renouvellement, sans remboursement du reliquat.
- Les échéances et bilans sont des notifications non bloquantes : ils ne réinitialisent pas la destination de simulation et ne créent pas de décision obligatoire.

Chaque débit passe par le registre financier existant, avec identifiant de période. Les paiements sont comptabilisés une seule fois, y compris après sauvegarde, reprise ou répétition du traitement de la même date.

## 6. Architecture et invariants

Un module dédié gère le catalogue, les devis, les commandes, les échéances, les effets et les bilans. Une vue dédiée rend « Mon environnement » sans modifier l’état. Aucun nouveau gros ensemble de règles dans le rendu principal.

Points d’intégration identifiés dans la V3.6 :

- `progression.js` : calcul du bonus à partir de la vraie séance, avant attribution des XP et dépense automatique.
- `engine.js` : traitement d’échéance avant `trainingDay`, initialisation, migration et validation.
- `finance.js` : débit et reçu cohérents avec les totaux existants ; ne pas appeler un reçu comme s’il débitait lui-même le solde.
- `commands.js` : respecter les blocages de modification et la retraite.
- `app.js` et nouvelle vue : commandes explicites, devis, bilan, raccourci programme.
- `storage.js`, worker et service worker : migration et disponibilité hors ligne du nouveau module.

État sauvegardé minimal : version du sous-système, compteur monotone de périodes, contrat courant avec prix/taux figés, préférence de renouvellement, date d’échéance déjà traitée, date de dernière séance comptabilisée, bilan courant et historique des 24 dernières périodes. Les totaux de carrière restent cumulatifs lorsque l’historique détaillé est tronqué.

Les commandes de mutation sont refusées pendant un match, une décision bloquante, une simulation active ou après retraite. Les mêmes protections s’appliquent dans le moteur et dans l’interface. Une répétition de confirmation ne peut pas débiter deux contrats.

Ni les devis, ni les vues, ni les commandes de staff ne consomment d’aléatoire. Une partie migrée sans achat conserve les résultats du moteur antérieur à entrées égales.

## 7. Sauvegardes et compatibilité

Une ancienne sauvegarde reçoit un environnement vide : aucun coach, aucun prélèvement, aucun renouvellement activé. Les anciennes sauvegardes prises en charge par la V3.6 restent importables.

Une sauvegarde préalable à la migration est conservée. Un match déjà commencé garde ses règles et son état ; ne pas modifier le tirage aléatoire, les résultats passés ni les attributs existants.

La validation refuse notamment les domaines inconnus, valeurs non finies, montants négatifs, coefficients hors catalogue versionné, dates incohérentes et compteurs contradictoires. Un import invalide ne remplace pas la partie courante.

## 8. Équilibrage et limites assumées

La carrière sans achat doit rester strictement identique : aucun ralentissement ajouté pour rendre le coach nécessaire. Le service n’accorde jamais plus de 20 % aux XP bruts du seul domaine éligible ; l’arrondi entier est explicitement testé et affiché dans le bilan réel.

Les joueurs IA conservent leur progression annuelle existante dans ce premier lot. Il ne faut donc pas annoncer une économie de staff symétrique déjà implémentée. Des carrières comparées avec et sans coach doivent mesurer l’écart et signaler tout emballement ; l’alignement complet des investissements IA relève d’un lot ultérieur, pas d’un bonus caché improvisé ici.

Après 99, ce service ne fournit pas artificiellement une nouvelle barre. Les dépenses de récupération, de confort, de projets collectifs et d’héritage restent dans la suite de la roadmap.

## 9. Critères de validation avant livraison

1. Sans achat, mêmes XP, attributs, finances et tirages aléatoires que la référence sur un scénario identique.
2. Confirmation et renouvellement débitent exactement une fois ; registre et solde concordent.
3. Dates limites testées : achat D, activation D+1, dernier jour D+30, renouvellement D+31.
4. Réserve, fonds insuffisants, retraite, plafond 99, annulation et changement de club couverts par tests.
5. Blessure, repos, fatigue, jours sans séance et spécialité incompatible donnent zéro XP supplémentaire.
6. Pour chaque domaine et intensité, le bilan correspond exactement à la différence entre la séance avec et sans coach, sans double attribution.
7. Rejouer le traitement d’une même date ne répète ni paiement, ni bonus, ni compteur de séance.
8. Sauvegarde/rechargement, import/export et exécution dans le worker produisent les mêmes états.
9. Anciennes versions migrées sans prélèvement et sans altération d’un match en cours.
10. Parcours mobile à 320 et 390 px, écran large, navigation clavier, confirmation, messages de refus et fonctionnement hors ligne vérifiés.
11. Simulation jusqu’à une destination conservée après échéance et après une vraie interruption indépendante du staff.
12. Carrières comparées sur mêmes graines, avec et sans service : progression, dépenses, soldes et plafonds mesurés ; résultats consignés, sans inventer une validation d’équilibrage avant les essais.

## 10. Suite de V3.7, hors premier lot

- V3.7-B : préparateur physique, kiné, nutritionniste, coach mental et analyste vidéo, avec effets propres et règles de cumul explicites.
- V3.7-C : logement, installations et matériel ; accessibilité réelle selon le lieu et complémentarité avec les services du club.
- V3.7-D : stages, achats de prestige, entretien et revente des biens concernés, bilan économique global.
- Agent et négociation : V3.9. Stages collectifs et automatismes : V3.8. Académie et fondation : V4.2.

Le plan d’implémentation sera rédigé après validation de ce document. Aucun code de production ni déploiement V3.7 n’est inclus dans cette étape de cadrage.
