# HOOP LEGACY V3.8 — Collectif complet

Statut : périmètre conversationnel validé le 7 octobre 2026 ; spécification proposée à la revue utilisateur. Aucun code produit modifié.

## 1. Intention et réussite

L’utilisateur veut approfondir sa carrière de basketteur, comprendre sa maîtrise du système et dépenser l’argent du personnage pour obtenir des avantages concrets. Le périmètre accepté comprend préparation collective, automatismes avec les partenaires réellement sur le terrain, stages payants, contraintes de calendrier/fatigue, bilan des effets et continuité lors des transferts.

Cette version prolonge V3.7-A. Elle ne remplace pas les lots de staff personnel, logement, installations et prestige encore à développer. Agent/négociation, fondation et académie restent hors périmètre.

Réussite : le joueur peut expliquer ce qu’une préparation a coûté, les séances effectuées, les partenaires avec lesquels il progresse et les modificateurs réellement appliqués en match. Aucun achat réel, victoire garantie ou progression de base dégradée. Mobile, hors ligne, simulation automatique et destination persistante restent obligatoires.

Les valeurs numériques ci-dessous sont des paramètres de conception proposés, pas un équilibrage déjà démontré. Toute modification après mesures sera documentée avant publication.

## 2. Deux notions distinctes

- **Maîtrise du système** : conserver `s.system`, ses sources et son amortissement existants. Matchs, entraînement individuel et vidéo existants continuent de fonctionner. Un transfert conserve actuellement 85 % si le système reste identique, 65 % sinon ; ces règles restent inchangées.
- **Automatismes de duo** : score 0–100, entre deux identifiants de joueurs, contextualisé par club. Il influence uniquement une action où les deux joueurs sont simultanément sur le terrain. Il ne modifie aucun attribut, badge ou note générale.

La maîtrise collective n’est pas une nouvelle barre globale redondante. L’interface montre la maîtrise existante et les duos séparément.

## 3. Progression gratuite des duos

Tous les clubs, y compris les adversaires IA, utilisent les mêmes règles gratuites. Aucun score n’est déduit arbitrairement de l’âge, du prestige ou de l’effectif historique. Nouvelles parties et migrations commencent à zéro pour les duos inconnus.

À chaque possession, relever les cinq joueurs de chaque équipe effectivement présents après la rotation et avant la résolution. Pour chaque paire de ces cinq, accumuler la durée partagée : `durée réglementaire / nombre de possessions réglementaires`. Les possessions de prolongation ajoutent la même durée. Employer une mesure séparée des minutes individuelles si leur approximation actuelle diffère ; afficher « minutes partagées simulées ».

Le score utilisé pendant un match est figé au coup d’envoi. À la clôture du match, attribuer à chaque duo `0,04 × minutes partagées × (1 − scoreInitial/100)`, plafonné à 100. La croissance est créditée une seule fois ; aucun gain en ouvrant une fiche, en changeant le mode de présentation ou en reprenant un match sauvegardé. Les remplaçants qui ne jouent pas ensemble ne progressent pas ensemble.

Les gains gratuits sont identiques pour héros et IA. Les achats concernent uniquement le personnage ; l’IA ne reçoit pas de dépenses personnelles fictives dans cette version. Cette asymétrie de préparation supplémentaire sera mesurée dans les essais d’équilibrage.

## 4. Préparation facultative

Ajouter « Préparation collective » dans Carrière, près du programme existant. Le choix par défaut est **Aucune séance supplémentaire**, conservé entre interruptions et changements de saison.

| Programme | Gain brut par séance | Fatigue supplémentaire |
|---|---|---|
| Vidéo tactique | +0,20 de maîtrise | +0 |
| Travail tactique terrain | +0,35 de maîtrise | +2 |
| Travail avec partenaires | +0,50 d’automatisme pour chacun des deux partenaires sélectionnés au maximum | +2 pour le héros |

Les gains de maîtrise passent par l’amortissement existant et une nouvelle source « préparation collective ». Ceux des duos sont multipliés par `1 − score/100`. Aucun XP d’attribut n’est attribué par ces séances, aucun supplément de coach V3.7 ne les multiplie.

Une séance au maximum par date paire, du lundi fictif au dimanche sans distinction supplémentaire. Elle intervient après l’entraînement individuel et avant les événements de vie/finances. Éligibilité : joueur non retraité, non blessé, activité différente de repos, fatigue au plus 65 après l’entraînement individuel, aucun match du club programmé ce jour dans aucune compétition. Un match reporté/reprogrammé est pris en compte à la date courante.

Le travail avec partenaires exige une sélection explicite de un ou deux coéquipiers valides, non blessés et présents dans l’effectif. Un partenaire absent ne reçoit rien ; l’autre peut travailler. Sans partenaire disponible, aucune séance ni fatigue supplémentaire. Les séances n’affectent pas la fatigue IA hors match dans ce lot : ne pas présenter ce programme comme une simulation intégrale du travail de toute l’équipe.

Les routines restent gratuites et cumulables avec l’entraînement individuel lorsque ces conditions sont respectées. Le temps est représenté par un seul créneau supplémentaire les jours admissibles ; pas de calendrier horaire artificiel. Chaque date traitée reçoit un marqueur, même si la séance est sautée, pour empêcher un second traitement après un changement de réglage.

## 5. Stages payants

Un stage réserve une préparation renforcée pour une période fixe ; il ne paie ni la présence en match ni un résultat. Les stages vidéo/terrain utilisent leur propre programme pendant la période et suspendent temporairement la routine gratuite supplémentaire. L’entraînement individuel reste inchangé.

| Stage | Prix en monnaie du jeu | Période | Gain par séance admissible | Fatigue |
|---|---:|---:|---|---:|
| Atelier vidéo | 600 | 7 jours | +0,40 de maîtrise brute | 0 |
| Stage tactique | 2 000 | 14 jours | +0,70 de maîtrise brute | +2 |
| Stage avec partenaires | 3 500 | 14 jours | +1,00 par duo choisi, avant amortissement | +2 |

Un seul stage actif, aucun renouvellement automatique. Achat le jour D, couverture inclusive D+1 à D+durée. Débit initial unique, fonds disponibles après paiement supérieurs ou égaux à la réserve. Pas de liquidation de placements ni de dette. Les tarifs sont fixes et explicitement fictifs.

Le devis montre prix, dates, programme, partenaires, solde après achat, réserve et nombre maximal de créneaux pairs sans match connus dans la période. Ce nombre est une estimation du calendrier actuel, pas une promesse de séances. Refuser l’achat si aucun créneau n’est connu, si le joueur est blessé, si la maîtrise est à 100 pour un stage de maîtrise ou si tous les duos choisis sont à 100 pour un stage de partenaires.

Le stage partenaires exige de choisir un ou deux coéquipiers disponibles au devis. Les identifiants sont figés à la confirmation ; un remplaçant n’est jamais choisi automatiquement. À la confirmation, recalculer argent, calendrier, effectif, plafonds et disponibilité ; si le contenu du devis change, afficher le nouveau devis et demander une nouvelle confirmation avant tout débit.

Toutes les conditions quotidiennes de la section 4 s’appliquent. Blessure, fatigue, match ou absence d’un partenaire peuvent réduire le nombre de séances. Aucune prolongation, aucun remboursement : ces conditions figurent avant achat. Un transfert du héros ou la retraite clôt immédiatement le stage ; le bilan conserve dépenses et séances, explique la clôture, sans nouvelle notification bloquant la simulation. Le départ d’un partenaire suspend seulement le duo concerné.

À la fin, la routine gratuite choisie reprend. Pendant le stage, son réglage peut être modifié pour la suite, avec mention « après le stage » ; le programme payé reste fixe. Pas d’annulation anticipée volontaire dans ce lot.

## 6. Effets sportifs limités et auditables

Les nouvelles parties commencées sous V3.8 utilisent des règles de match versionnées 3.8. Les deux effets sont calculés depuis le score figé du duo passeur–receveur :

- Si le porteur de balle réel transmet au tireur (`handler != shooter`), réduire la probabilité de perte de balle de `0,005 × score/100`, soit au maximum 0,5 point de pourcentage.
- Sur cette même action servie, augmenter la probabilité de réussite du tir de `0,005 × score/100`, au maximum 0,5 point de pourcentage. Aucun effet sur lancers francs, rebonds, contres, possessions individuelles ou attribution statistique d’une passe.

Les bornes existantes de probabilité restent appliquées après tous les modificateurs. Ne pas utiliser le passeur statistique de secours choisi lorsque le tireur était lui-même porteur : il ne prouve pas une passe réelle. Aucun nouveau tirage aléatoire pour consulter/appliquer le score.

Les duos de l’IA obtiennent exactement les mêmes effets. La maîtrise du héros conserve ses effets existants ; le stage ne crée pas une deuxième application de son gain.

Le bilan du match indique actions éligibles, modificateurs effectivement appliqués et gains de duo à la clôture. Il ne prétend jamais connaître des « paniers supplémentaires causés par le stage » : les résultats restent incertains et aucun contrefactuel n’est simulé pour l’interface.

## 7. Effectifs, transferts et bornes

Les scores sont attachés au club et au duo d’identifiants, pas aux noms. Un départ retire immédiatement le duo des effets actifs. Conserver au maximum 50 anciens duos impliquant le héros, avec club et date de séparation, pour un éventuel retour. Un retour dans le même club avec le même partenaire restaure 75 % du score archivé ; aucun score n’est transféré vers un autre club, même si les deux joueurs y arrivent ensemble. La maîtrise personnelle suit ses règles existantes.

Pour l’IA, supprimer les duos dont un membre a quitté le club ; pas d’archive de tous les anciens joueurs. Les duos actifs sont donc bornés par les paires de chaque effectif. Les archives du héros dépassant 50 entrées sont supprimées par ancienneté, puis identifiant pour départager ; un duo oublié redémarre à zéro. Une restauration consomme l’archive afin d’éviter des restaurations multiples.

Si les deux joueurs quittent puis retrouvent le club sans avoir de duo actif entre-temps, la réduction s’applique une seule fois lors de la restauration. Détection centralisée après mutations d’effectif, y compris échanges IA, draft, signature et départ annuel. La sélection d’un partenaire sorti est retirée avec une explication visible.

## 8. Interface et bilans

Carrière accueille une section Collectif : maîtrise et sources existantes, programme facultatif, deux sélecteurs de partenaires maximum, leurs scores et minutes partagées, prochaine date potentielle et motif du dernier saut de séance. Vie → Mon environnement affiche les trois devis de stage et renvoie vers cette section.

Afficher pour chaque stage : paiement, couverture, créneaux estimés au devis, séances réelles, séances sautées par raison, gains réels de maîtrise/duos, coût par séance ou « — » si zéro. Historique des 24 derniers stages, totaux de carrière conservés malgré la troncature. Séparer gains des matchs, routines gratuites et stages.

Coût et effets sont exprimés sans jargon probabiliste ambigu : « jusqu’à +0,5 point de pourcentage sur les tirs servis de ce duo », pas « +0,5 % de paniers ». Les sélecteurs ont des labels, les mises à jour une zone de statut, les refus une raison lisible. Pas de débordement à 320 px. Pas de progression au simple affichage.

## 9. Architecture et sauvegardes

Créer un module collectif pour état, devis purs, commandes, journées, rapprochement des effectifs et validation. Séparer un adaptateur d’effets de match pur, une vue pure et les bilans. Réutiliser `canChange`, le registre financier et la sauvegarde existants. Aucun accès DOM depuis le moteur.

Le sous-état versionné contient : programme et partenaires, dernier jour traité, duos actifs par club, archives bornées, stage courant avec catalogue/prix/programme figés, compteur de stages, historique et cumuls. Chaque match V3.8 possède un instantané des scores pertinents, compteurs de minutes/actions et marqueur d’application à la clôture, conservés lors du partage worker et de la sérialisation.

Toutes les commandes refusent les mutations pendant simulation occupée, match, décision ou retraite. Devis/consultations ne changent ni jour ni RNG. La simulation conserve son mode et sa cible à chaque fin de stage, séance sautée et décision réelle.

Migration des versions prises en charge vers 3.8 : copie historique avant remplacement, sous-état collectif neuf sans stage, duos à zéro, routine désactivée, argent/coach V3.7/maîtrise/RNG conservés. Ignorer tout champ collectif injecté dans une ancienne version. Un fichier déclaré 3.8 incohérent est rejeté, sans remplacer la carrière courante.

Préserver le moteur de match 3.5 dans un module historique et sa chaîne de compatibilité. Un match commencé avant migration finit sous ses règles d’origine, sans effet ni gain rétroactif de duo. Les nouveaux matchs utilisent 3.8. L’UI précise cette transition si un match ancien est ouvert.

Validation : identifiants existants, club et effectif cohérents, duos uniques ordonnés, scores finis 0–100, dates/cumuls cohérents, marqueurs non futurs, gain compatible avec séances et plafonds, prix conformes au catalogue, aucun stage actif périmé, archives bornées. Les exports complets et archives différées restent utilisables.

## 10. Réception et publication

1. Tests déterministes des programmes et des trois stages : conditions, calendrier multiligue, plafonds, fatigue, blessure, réserve, devis périmé, double confirmation, reprise après export, coût nul par séance non affiché comme Infinity.
2. Test journée répétée après saut de séance et après sérialisation : aucun gain ni fatigue supplémentaire. Traiter dans la même évolution le point mineur V3.7 sur la répétition de `trainingDay`, avec marqueur distinct de séance accordée et sans altérer le premier appel.
3. Tests de rotations réelles, prolongations, joueurs exclus/blessés, absence de partenaire, action individuelle et passeur de secours ; duos IA/héros symétriques et aucun tirage RNG ajouté par les calculs purs.
4. À score zéro et routines/stages désactivés, comparaison V3.7/V3.8 d’un match complet à RNG identique : score, statistiques et RNG identiques, hors télémétrie. Ne pas réclamer identité des carrières entières : les automatismes gratuits évoluent désormais pour tous.
5. Migration de chaque version supportée, ancien cache et match commencé : résultat/RNG identiques au moteur historique, secours intact, import hostile refusé, absence de dépenses automatiques.
6. Comparaison moteur direct/worker et modes rapide, moments clés, détaillé ; arrêts/reprises, échéance, transfert et retraite sans perte de destination.
7. Matrice économique : deux graines, lycée/rookie, sans préparation, chaque routine et chaque stage acheté quand légal ; trois saisons. Mesurer coûts, séances, gains, fatigue, minutes, blessures, succès collectifs et plafonds. Contrôler la réserve au moment exact du débit, avant revenus.
8. Équilibrage sportif : au moins 400 matchs appariés à score de duo 0/50/100 et inversion des équipes, à effectifs identiques ; contrôler bornes et symétrie, publier les écarts observés sans promettre de victoires. Les campagnes de 30 saisons servent aussi au suivi des dynasties ; aucun seuil existant ne sera assoupli pour masquer une régression.
9. Navigateur 320/390/1440, focus clavier, confirmations, bilans, rechargement, hors ligne, erreurs console et sauvegarde longue. Mention explicite si aucun iPhone physique/Safari n’est disponible.
10. Revue indépendante, corrections couvertes, archive source, CI et migrations vertes avant publication ; contrôler ensuite le lien public V3.8. Aucun déploiement à cette étape de spécification.

## 11. Auto-revue

Périmètre cohérent : trois programmes, trois stages, un score de duo et deux effets limités. Tous les tarifs, durées, plafonds, déclencheurs, annulations, transferts et exigences de validation sont définis. La coexistence avec l’entraînement individuel et V3.7 est explicite. La mesure des duos ne prétend pas simuler des relations sociales ni prouver la causalité d’un panier. Étape suivante, après revue de ce document : plan d’implémentation.
