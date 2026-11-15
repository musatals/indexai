# Rapport initial de qualité (15 novembre 2026)

| Contrôle | Résultat |
|---|---:|
| Entrées | 808 |
| Identifiants distincts | 808 |
| Noms distincts | 808 |
| Catégories principales | 50 |
| URL renseignées | 805 |
| URL manquantes | 3 |
| Adresses partagées (groupes) | 12 |
| Entrées avec au moins une catégorie secondaire | 44 |
| Descriptions individuelles vérifiées | 0 |
| Tarifs individuels vérifiés | 0 |

Le CSV source inclut explicitement un statut « Lien non contrôlé individuellement ». Des URLs communes ne suffisent pas à conclure à des doublons. Les trois URL absentes sont : `tl` (AI-0185), `Amper Music` (AI-0212), `Satellier` (AI-0764). Aucun de ces outils n'est supprimé.

Le rapport complet structuré est disponible dans `data/quality-report.json`.

## Niveaux de confiance recommandés

- **Non vérifié** : importé sans contrôle individuel (ensemble de la v1).
- **En cours de révision** : un contrôleur a commencé l'examen, sources requises.
- **Vérifié** : nom, propriétaire et fonctionnalités observées dans des sources officielles avec date.
- **À actualiser** : données vérifiées mais potentiellement périmées.
- **Abandonné** : cessation de service confirmée avec sources et date ; garder une fiche historique si pertinent.
