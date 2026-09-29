# Vérification HOOP LEGACY 2.0

Exécution : 29 septembre 2026. Commande : `npm test`. Résultats détaillés dans `test-results.txt`.

11 tests automatisés réussis :

- Calendriers des neuf compétitions : volumes par équipe, 41 matchs à domicile NBA, aucune double réservation de club le même jour et unicité des effectifs.
- Cohérence des scores, tirs et minutes pour rencontres de 32, 40 et 48 minutes ; application unique du résultat.
- Reprise déterministe d’un match V2 exporté en cours de jeu.
- Coûts de progression, plafonds, import/export et rejet des formats invalides.
- Migration d’une vraie sauvegarde V1 contenant un match commencé : attributs, points et match archivé conservés.
- Transfert inter-ligues sans modification des résultats acquis, avec effectifs valides.
- Draft contrôlée pour les deux branches : sélection par une seule franchise ou offres étrangères après non-sélection.
- Trois saisons mondiales complètes : deux au lycée et une à l’université ; recrutement, choix de rester ou de tenter la draft, puis signature NBA. 207 étapes ; général 53 → 76 ; joueur sélectionné au rang 19 avec cette graine. Chaque compétition termine ses phases finales et ses résultats sont archivés.
- Présence des ressources PWA, manifeste, icônes et cache versionné.
- Arrêt du worker après une étape cohérente.
- Parcours interface via DOM minimal et IndexedDB simulé : création, navigation, entraînement, rencontre, sauvegarde et reprise.

Les valeurs du parcours sont un scénario déterministe, pas une garantie de résultat pour toutes les créations. Les tests ne valident pas le rendu visuel, les gestes tactiles, Safari/Chrome, l’installation PWA ou le mode hors ligne réel. Ces essais sur appareil restent à faire. Les données et simplifications sont détaillées dans README.md.
