# HOOP LEGACY V3.9 — candidate en validation

Version non publiée. Bilan historique V3.8 : `docs/validation-v3.8.md`.

- 166 tests fonctionnels réussis, zéro échec.
- Parcours agents/négociations Chromium à 320, 390 et 1440 pixels, sans erreur JavaScript ni débordement.
- Annulation sans effet, deux tentatives, compromis/refus, double clic idempotent, confirmation de signature, commission figée, import d’une autre carrière, rechargement et hors ligne.
- Worker identique au calcul direct ; destination conservée sur 80 jours malgré quatre interruptions.
- Neuf migrations V3.0–V3.8 avec cache actif, sauvegarde de secours, match et RNG conservés, réouverture hors ligne.
- Import, consultation et poursuite d’une sauvegarde de 30 saisons dans Chromium ; bouton de signature accessible sans clic forcé.

Les campagnes longues et économiques restent en cours. Les rapports partiels ne constituent pas une validation complète. La revue indépendante V3.9 a conduit à deux corrections vérifiées ; la CI de livraison et les campagnes doivent encore être terminées avant publication.
