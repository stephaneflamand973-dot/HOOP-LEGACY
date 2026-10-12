# HOOP LEGACY V3.9 — validation de livraison

Code validé pour livraison. Bilan V3.8 archivé dans `docs/validation-v3.8.md`.

## Preuves

- **166 tests réussis**, zéro échec, y compris refus d’une ancienne session de signature sans mutation et extraction des neuf archives de migration.
- **72 saisons économiques** : deux graines × quatre mandats × trois stratégies × trois saisons. Marché exploré une fois par saison après huit matchs, sans argent ajouté ; trois signatures minimum par scénario. Solde jamais négatif, frais quotidiens recomptés au centime, zéro frais en autogestion.
- **Deux carrières de 30 saisons**, archives et suivi cohérents. Sauvegardes finales : 105,23 et 105,26 Mo ; général du héros 95 à 46 ans ; maximum 14 et 13 titres par franchise. Ces mesures ne garantissent pas un équilibrage optimal.
- **Huit saisons de neutralité** : deux saisons lycée et rookie, graines 2026/973 ; égalité avec la V3.8 publiée après normalisation de la version et du seul sous-état representation.
- **Neuf migrations V3.0–V3.8**, ancien cache actif, copie de secours, match/RNG conservés et réouverture hors ligne.
- Chromium **320/390/1440 px** : annulation, compromis/refus, deux tentatives, double clic, signature, taux fixé, import d’une autre carrière et hors ligne. Aucun débordement ni erreur JavaScript.
- Worker identique au calcul direct ; destination conservée sur 80 jours malgré quatre interruptions. Sauvegarde de 30 saisons importée, poursuivie et rechargée, sans clic forcé.

[CI indépendante : cinq jobs réussis](https://github.com/stephaneflamand973-dot/HOOP-LEGACY/actions/runs/38162171989), commit `896a01d1e438df10858db49bd3acc05654b031dd`. Artifacts récupérés, sommes SHA-256 contrôlées ; `node tools/v39-evidence.mjs` vérifie les empreintes des rapports contre le code livré.

## Lecture économique

Dans les scénarios négociés, les frais cumulés sur trois saisons sont environ 62–68 k€ (local), 124–139 k€ (national) et 186–212 k€ (international). Ils dépendent des salaires effectivement obtenus et reçus. Les trajectoires, clubs et durées divergent ; comparer le patrimoine final ne mesure pas seulement l’effet comptable de l’agent. Les parcours lycée → université → draft restent exempts, contrôlés dans chaque job économique.

## Revue et limites

Revue V3.9 indépendante : aucun critique ; deux importants corrigés et testés RED→GREEN. Mineurs différés : échéance d’offre non affichée ; focus rendu à la carte plutôt qu’au bouton exact après annulation. Voir `docs/v3.9-review.md`.

Pas de test sur iPhone physique/Safari. La réserve historique de revue V3.8 reste distincte. Le workflow GitHub Pages effectue un contrôle public après chaque déploiement : création, match, sauvegarde/rechargement, anciennes vues, mandat, négociation, signature et destination persistante.
