# HOOP LEGACY V3.8 — validation locale de la version candidate

État au 9 octobre 2026 : corrections vérifiées localement et CI GitHub réussie, version non publiée. La revue indépendante a été interrompue avant son verdict final. Le contrôle public V3.8 n’est pas effectué. Validation V3.7 archivée dans `docs/validation-v3.7.md`.

## Tests et compatibilité

- 128 tests fonctionnels réussis, dont quatre tests d’import et d’affichage du collectif.
- Dix matchs sans automatismes identiques au moteur V3.7.
- 2 400 matchs appariés : 400 graines, trois niveaux d’automatismes, deux orientations domicile/extérieur.
- Huit migrations V3.0–V3.7 avec ancien cache : secours, match conservé, idempotence et réouverture hors ligne.
- Chromium à 320, 390 et 1 440 pixels : routines, partenaires, devis, annulation, reconfirmation, paiement unique, simulation worker, rechargement et hors ligne. Aucune erreur JavaScript ni débordement relevé.
- Import d’une carrière de 30 saisons, signature de contrat, poursuite et rechargement : bouton masqué par la navigation mobile corrigé, sans clic forcé.

Détails : `docs/v3.8-review.md` et `tests/v38-corrections-report.json`. Pas de validation sur iPhone physique/Safari.

## Campagnes après corrections

Deux graines (2026 et 973), chacune avec une carrière de 30 saisons et quatorze scénarios économiques de trois saisons : **144 saisons au total**. Rapports complets, empreintes vérifiées contre les fichiers moteur corrigés. Les résultats restent identiques aux campagnes précédentes ; aucune formule sportive n’a été modifiée par ces correctifs.

Scénarios économiques : lycée/rookie, absence de préparation, trois routines et trois stages. Aucun argent injecté, réserve contrôlée à l’achat, soldes minimum non négatifs. Dans ces scénarios, les lycéens ne peuvent pas financer les stages ; les routines restent gratuites. Chez les rookies, la maîtrise atteint rapidement 100, réduisant l’intérêt ultérieur des stages vidéo et tactiques. Les stages partenaires coûtent 255 500 sur trois ans, pour environ 248/254 points cumulés sur plusieurs duos ; ce total n’est pas le score d’un duo unique.

À automatismes 100, l’écart moyen de score est de +1,26 point à domicile et +0,905 à l’extérieur dans les matchs appariés. Ces observations ne garantissent pas un équilibrage optimal ni une victoire ; les trajectoires aléatoires divergent après les premières possessions modifiées.

Les carrières longues conservent 30 archives. Portland remporte 14 titres NBA avec la graine 2026, Memphis 13 avec 973 ; le seuil d’alerte supérieur à 15/30 n’est pas franchi. Cela ne signifie pas que les dynasties sont résolues. Le héros termine à 95 à 46 ans. Les sauvegardes restent volumineuses, environ 105 Mo.

## Points ouverts avant livraison

La CI du commit `7fbc0064e0d9c85f20d1601593c2ad65fbdf8055` a réussi ses cinq jobs : tests/navigateurs/huit migrations, deux matrices économiques et deux carrières de 30 saisons. Elle répète donc les 144 saisons sur GitHub. Résultats : `tests/v38-ci-report.json` et [exécution GitHub](https://github.com/stephaneflamand973-dot/HOOP-LEGACY/actions/runs/38001898911).

La revue indépendante complète et la validation du site public restent à obtenir. Un compteur explicatif de tirs servis peut inclure une action terminée par des lancers francs ; ce point mineur différé concerne la télémétrie, pas le résultat simulé. Les corrections ciblées d’import ne constituent pas un audit de sécurité complet.
