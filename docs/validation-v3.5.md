# HOOP LEGACY V3.5 — validation

La V3.5 livre le lot LIFE01–02, WORLD01–02 et ECO01 décrit dans `docs/v3.5-spec.md`.

## Tests fonctionnels

62 scénarios dans huit fichiers, dont treize nouveaux scénarios V3.5. La suite locale complète passe. Les anciens contrôles de chronologie, playoffs, XP, maîtrise, statistiques, coach et sauvegardes restent actifs.

- Proches conservés lors de la migration, identité stable et match V3.4 terminé sans changer résultat ni RNG.
- Transfert réel avec discussion majeure, suivi différé, reprise de contexte et clôture unique.
- Une saison de décisions courantes déléguées, consignes persistantes et pause sur projet familial.
- Pourcentage exact au-delà de la réserve, sans plafond caché ; achat et vente non duplicables.
- Revenus réellement reçus après changement de salaire à mi-mois ; liquidités et patrimoine séparés ; échéance automatique idempotente.
- Salaire actif préservé sous déficit budgétaire ; effectifs complets.
- Échange admissible dans le club du héros, identités et contrats conservés, exclusion du héros et motif visible.
- Projet déterministe, priorité jeune modérée et consultation sans mutation.
- Import refusé pour une consigne financière ou personnelle invalide.
- Copie de secours V3.4 créée avant remplacement de la sauvegarde automatique.
- Solde de départ correct après migration d’une ancienne carrière V1/V2 disposant d’argent.
- Histoire déclenchée dès une blessure de quatorze jours et lors d’un transfert sans couple.
- Joueur libéré puis réaffecté conservant son contrat tant qu’il n’est pas expiré.

Les défauts de migration et de contrat découverts pendant la validation ont été reproduits par des tests en échec avant correction. La revue indépendante a validé les correctifs de migration et d’histoires ; le dernier correctif de contrat a été vérifié par son test de régression et la suite complète.

## Deux carrières de trente saisons

Empreinte exacte des modules de simulation : `c64b1e29129a0df491064673cea0d6b618f771da92778302a52c5ecfe8008d5b`.

| Mesure | Graine 2026 | Graine 973 |
|---|---:|---:|
| Saisons complètes | 30 | 30 |
| Franchises championnes différentes | 10 | 11 |
| Maximum de titres NBA par franchise | 14 | 17 |
| Franchise dominante | Toronto | Charlotte |
| Export final, millions de caractères | 104.8 | 104.87 |
| Âge final du héros | 46 | 46 |

Contrôles annuels : champions des neuf compétitions, scores, effectifs, attributs, tableaux et domicile des playoffs, absence de match après une série remportée, passages par club et agrégats. Les deux rapports correspondent au code livré.

**L’alerte de domination reste ouverte pour la graine 973 : 17 titres sur 30.** Le seuil de quinze n’a pas été modifié. Le résultat de Toronto (14) ne démontre pas un équilibrage général. La progression rapide et l’accès à 99 demandés sont conservés. La V3.5 améliore la cohérence des contrats et des projets, sans prétendre résoudre la domination d’un héros complet.

## Navigateur et migrations

Les migrations V3.0, V3.1, V3.2, V3.3 et V3.4 passent avec leur ancien cache actif : secours conservé, match et RNG identiques après reprise, réouverture hors ligne et migration idempotente. `match-v34.js` fige le moteur précédent.

Le parcours V3.5 contrôle consignes, placement exact de 75 000 €, achat/vente, décision familiale conservée après fermeture, projet du club, hors ligne et absence de débordement aux largeurs 320/390/1440. Les captures ont été inspectées.

Les parcours de non-régression V3.3 et V3.4 contrôlent les quinze séries NBA, l’avance interrompue puis reprise, l’arrêt manuel, les sauvegardes nommées, la retraite, les statistiques, distinctions et dossiers.

La carrière V3.5 de trente saisons est chargée dans Chromium : 29 archives différées, consultation hors ligne, filtres conservés et aucun changement du RNG par navigation. Démarrage mesuré à 349.6 ms ; rendu au 95e percentile à 7.5 ms sur l’hôte de test. Ces mesures ne sont pas celles d’un téléphone physique.

## Limites

Trois familles d’histoires contextuelles de deux étapes. Budgets, minimums de signature, montants nets, frais et rendements sont des règles simplifiées de jeu. Le poids demeure descriptif. Les archives anciennes incomplètes ne permettent pas de reconstruire tous les faits. Safari et l’installation iOS sur téléphone physique restent à tester. Les rapports V3.4 et sa comparaison de 480 matchs sont des preuves historiques, distinctes du moteur V3.5.
