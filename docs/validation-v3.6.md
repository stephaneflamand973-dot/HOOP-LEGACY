# HOOP LEGACY V3.6 — validation

76 scénarios fonctionnels, dont 14 nouveaux, passent sur la copie restaurée. Les 14 couvrent délais partagés, priorité agent, commandes interdites, absence de RNG/jour caché, prime unique, blessure, transfert, départ, coach, retraite, migration, import invalide, historique borné, échappement, moteur réel et échéance.

La revue indépendante avait identifié la clôture trop précoce au dernier jour, la retraite automatique laissant des engagements ouverts et le départ annuel du référent traité tardivement. Les trois corrections sont restaurées et couvertes par les tests dédiés.

Le bilan collectif intervient le lendemain de l'échéance pour compter tous les matchs du dernier jour. Les règles de match 3.5, physique, maîtrise et progression sont conservées : seuls leurs liens de cache changent.

## Navigateur
Le parcours V3.6 repasse à 320/390/1440 : échanges, priorité, suivi en worker, délais, sauvegarde/rechargement, hors ligne et boutons bloqués pendant une décision. Aucune erreur JavaScript. Chromium mobile simulé, pas téléphone physique ni Safari iOS.

## Diagnostic
1 440 matchs reproductibles dans `tests/v36-balance.json`. Le même joueur uniformément 99 domine aussi sous contrôle IA ; les rotations et contextes diffèrent. Voir `docs/v3.6-diagnostic.md`. Aucune preuve d'une résolution des dynasties, aucun résultat forcé.

## Campagnes et migrations
Deux campagnes de 30 saisons terminées sur l'empreinte `1bdd924fe7f033fe9310dc033cd1179ea8bdf9e47cbbac7a819480fc744eb3fe` : graine 2026, Toronto 14 titres (10 franchises championnes) ; graine 973, Charlotte 17 titres (11 franchises championnes). L'alerte 17/30 reste ouverte ; seuil inchangé à plus de 15/30. Les trajectoires sportives sans nouvelles discussions restent identiques à V3.5. Les interactions sont exercées par les tests dédiés et le navigateur.

Contrôles : calendriers, séries, champions, effectifs, statistiques, vieillissement, plafonds, titres, archives et comptes de carrière. Le héros atteint 99 puis termine à 95 à 46 ans. Exports complets : environ 104,8–104,9 millions de caractères.

Les six migrations V3.0–V3.5 repassent avec ancien cache actif, copie de secours, match/RNG exacts, réouverture hors ligne et idempotence. Les parcours antérieurs (playoffs, arrêt/reprise, finances, famille, projets) passent sans erreur. La CI vérifie les empreintes des deux rapports complets, puis répète une simulation indépendante de deux saisons et les parcours navigateur ; le test navigateur sur 30 saisons est exécuté localement.

Carrière de 30 saisons ouverte dans Chromium : 29 archives différées, dossiers/statistiques/distinctions, filtres, coach, marché et consultation hors ligne validés ; RNG inchangé par navigation. Démarrage 373.8ms, rendu au 95e percentile 13.3ms sur cet hôte. Ce ne sont pas des mesures sur téléphone physique.
