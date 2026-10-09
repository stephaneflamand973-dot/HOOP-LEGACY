# HOOP LEGACY V3.7-A — validation

95 tests fonctionnels passent. Les deux défauts importants de la revue indépendante ont été reproduits puis corrigés : cohérence des imports et remise à zéro de l’environnement lors des migrations historiques. Détails et deux points mineurs différés : `docs/v3.7-review.md`.

## Navigateur et sauvegardes

Chromium à 320/390/1440 pixels : devis, annulation, achat, renouvellement volontaire, raccourcis programme/réserve, bilan après simulation worker, rechargement, hors ligne et blocage pendant une décision. Aucune erreur JavaScript ni débordement. Moteur direct et worker identiques ; cible de simulation conservée après deux décisions et 80 jours, avec trois paiements de 300.

Les parcours antérieurs V3.3/V3.5/V3.6 et le parcours général passent. Migrations V3.0–V3.6 avec ancien cache : copie de secours, match/RNG conservés, réouverture hors ligne et idempotence. La migration V3.6 a été rejouée après les corrections de revue.

Pas de test sur téléphone physique ni Safari iOS ; la vérification du focus couvre les raccourcis, pas un audit complet d’accessibilité.

## Progression et économie

16 scénarios, deux graines (2026/973), lycée et rookie, sans coach et avec chaque gamme, trois saisons chacun : 48 saisons comparées sans injection d’argent. Montants finis et non négatifs, comptabilité cohérente, attributs plafonnés à 99, historique borné. La réserve est contrôlée à l’achat ; le seuil et l’ordre exact du renouvellement sont testés unitairement.

Les lycéens de ces scénarios restent sans revenus ni coach sur ces trois saisons. Les rookies bénéficient de suppléments réels ; leur intérêt diminue à l’approche de 99. Exemple expert : 72 000 dépensés et 1 071/1 116 XP supplémentaires selon la graine. Ce constat ne prouve pas un équilibrage optimal pour toutes les carrières.

Sans achat : deux saisons complètes par graine comparées à V3.6, états normalisés strictement identiques (hors version et nouveau sous-état).

## Carrières longues

Deux campagnes de 30 saisons régénérées après les corrections de revue, empreintes vérifiées contre les fichiers moteur. Contrôles calendriers, séries, effectifs, statistiques, vieillissement, plafonds, archives et comptes. Toronto remporte 14 titres NBA avec la graine 2026 ; Charlotte 17 avec 973. L’alerte de domination au-delà de 15/30 reste ouverte. Le héros termine à 95 à 46 ans. Les dynasties ne sont pas corrigées ici.

La CI de branche répète tests, économie, comparaison sans achat, navigateurs et sept migrations ; elle vérifie les empreintes des rapports longs avant une simulation indépendante de deux saisons. La publication exige ensuite CI verte, déploiement Pages et contrôle du site public.
