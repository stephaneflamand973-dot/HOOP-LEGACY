# HOOP LEGACY V4.0 — validation de livraison

## Contrôles exécutés

- Deux carrières de trente saisons terminées (graines 2026 et 973), avec contrôle des archives, playoffs, effectifs, attributs et scores. Écarts de médiane IA NBA V4/V3.9 : 2026/S10 : 0, 2026/S30 : 0, 973/S10 : 0, 973/S30 : 1 points (seuil 5).

- 221 tests Node réussis, zéro échec : moteur, migration, stockage, worker réel, services, rotation et matchs historiques.
- 80 scénarios de progression et services : deux graines, cinq postes, jeunes/vétérans, spécialistes/polyvalents, avec/sans services.
- Chromium aux largeurs 320, 390 et 1440 : cinq achats, annulation, focus, sauvegarde/rechargement, mode hors ligne, préférence de simulation, formation complète et retraite. Zéro erreur JavaScript ni débordement global.
- Remplacement confirmé d’un emplacement après rechargement et refus d’écriture d’un onglet obsolète dans un vrai navigateur.
- Dix migrations V3.0–V3.9 avec ancien cache actif, copie de secours, match/RNG préservés et réouverture hors ligne.
- Parcours de publication testé localement : création, match, playoffs, statistiques, rôle, service débité une seule fois, négociation et import réel V3.9 avec destination « fin de saison/décision » conservée.
- Performance sur une sauvegarde de 105,23 Mo : médiane de cinq lancements et p95 de 100 changements d’écran. Après préchargement des modules, ratios V4/V3.9 de 0,907 au lancement et 0,915 au rendu ; seuil maximal 1,20.

La provenance des sauvegardes de comparaison V3.9 est consignée dans `tests/v40-baseline-provenance.json` ; leurs points de contrôle sont comparés au rapport V3.9 publié avant acceptation.

Les rapports générés `tests/v40-browser-report.json`, `tests/v40-performance-report.json`, `tests/v40-balance-report.json` et `tests/v40-evidence.json` contiennent les mesures et empreintes. Les carrières longues sont conservées dans `tests/v40-release-long-run-2026.json` et `tests/v40-release-long-run-973.json`.

## Revue et limites

Les quatre défauts importants de la revue indépendante ont été reproduits puis corrigés : rotation sans lissage, remplacement manuel, validation d’historiques importés et renouvellement physique pendant blessure/repos. Détails dans `docs/v4.0-review.md`.

Safari/iPhone physique n’a pas été testé. Ces scénarios déterministes ne garantissent pas l’équilibrage de toutes les parties. La confiance et la maîtrise individuelles de l’IA restent neutres à 50 tant qu’elles ne sont pas modélisées. Le temps de jeu est une projection, pas une garantie. Aucun revenu automatique n’est accordé aux qualifications.

L’archive de sources est construite à partir des fichiers Git suivis, hors archive elle-même, puis comparée octet par octet. Les validations GitHub et le contrôle du site public constituent la dernière étape de publication ; les contrôles locaux seuls ne prouvent pas le déploiement.

Bilan V3.9 conservé dans `docs/validation-v3.9.md`.
