# IndexAI — Répertoire et observatoire des outils d’intelligence artificielle

**Version 2.0 — 15 novembre 2026** · Interface sable, ivoire et terracotta · Français / anglais

IndexAI est un portail de consultation regroupant **909 ressources IA dans 55 catégories**. La v2 remplace l'appellation Atlas IA par **IndexAI**, modernise l'interface en beige et tons naturels, et ajoute des fiches descriptives spécifiques ainsi que des informations pratiques traçables.

## Couverture et limites de la recherche

| Mesure | Volume |
|---|---:|
| Références du catalogue initial intégralement conservées | 909 |
| Catégories d'origine | 50 |
| Présentations éditoriales spécifiques FR/EN | 209 |
| Fiches dotées de tarifs/formules provenant de pages officielles consultées | 32 |
| Fiches dont la présentation reste à documenter | 599 |
| Liens renseignés dans le CSV original, non tous contrôlés | 805 |
| Liens manquants | 3 |
| Groupes d'URL partagées à examiner manuellement | 12 |

**Important :** une synthèse éditoriale n'est pas un contrôle individuel complet. Les 32 fiches de tarification incluent un lien vers la page officielle et une date de consultation (15-11-2026). Les prix peuvent évoluer, dépendre du pays, de la devise, de la facturation annuelle/mensuelle ou d'une promotion. Les URL renseignées par le répertoire d'origine ne constituent pas une preuve de disponibilité actuelle. Les autres données sont laissées non vérifiées plutôt que déduites du nom du produit.

## Lancer localement

Sans dépendances d'exécution :

```bash
cd indexai-portal-v2
python3 -m http.server 8000
```

Ouvrir `http://localhost:8000`. La lecture directe par `file://` ne fonctionne pas, car le site charge les données via des requêtes HTTP locales.

## Fonctions implémentées

- Accueil et navigation responsive ; thèmes **clair beige** et **sombre brun** ; identité et icône **IndexAI**.
- Répertoire complet avec recherche par nom, catégories et **texte des descriptions**, tri, filtres, pagination ; affichages cartes/liste/tableau/icônes.
- 50 pages de catégories et 909 pages de fiches, chacune ayant une URL stable.
- Fiches : présentation spécifique quand disponible, fonctionnalités documentées pour les pages tarifaires examinées, accès/plateformes lorsque indiqués, modèle tarifaire, lien vers la grille officielle et date ; sinon état « à documenter ».
- Comparateur de 4 ressources incluant présentation, fonctionnalités et informations tarifaires connues ; favoris dans le navigateur et URL de comparaison partageable.
- Éléments FR/EN, navigation mobile, exploration thématique, page de transparence et rapport de qualité documentaire.
- Données source téléchargeables en CSV et données enrichies téléchargeables en JSON et CSV.

## Structure et provenance

- `sources/atlas_outils_ia_2026.csv` : catalogue ORIGINAL, conservé comme source brute (le nom de ce fichier historique ne change pas).
- `scripts/create_editorial.py` : 209 synthèses FR/EN, 32 notes tarifaires sourcées et fonctionnalités des pages officielles consultées.
- `data/editorial.json` : fichier éditorial obtenu par le script ci-dessus.
- `scripts/build_catalog.py` : générateur idempotent des fichiers de données, des catégories et fiches HTML.
- `data/tools.json` : catalogue normalisé enrichi pour l'application.
- `scripts/export_enriched.py` : export `data/indexai-catalogue-enrichi.csv`.
- `data/quality-report.json` : inventaire des manques et collisions possibles.
- `assets/app.js`, `assets/style.css` : application et design system ; `assets/favicon.svg` : logotype.
- `docs/architecture.md`, `docs/database.sql`, `docs/quality-notes.md` : architecture cible, schéma de données et méthode de contrôle.

Pour changer les données éditoriales, modifier **`scripts/create_editorial.py`** et regénérer :

```bash
python3 scripts/create_editorial.py
python3 scripts/build_catalog.py
python3 scripts/export_enriched.py
```

Ne pas réécrire le fichier source original automatiquement. Conserver les identifiants stables ; contrôler manuellement les conflits d'URL et les cas où plusieurs produits utilisent le même domaine.

## Vérification

```bash
python3 scripts/sanity_check.py
python3 scripts/browser_smoke_test.py  # nécessite un environnement de test Playwright/Chromium
node --check assets/app.js
```

Les tests sont ciblés : ils ne constituent **ni** une preuve d'accessibilité WCAG 2.2 AA complète, **ni** un audit de sécurité ou une validation fonctionnelle des 909 fournisseurs.

## Publication sur Vercel

Le contenu du dossier peut être placé à la racine d'un **nouveau dépôt GitHub** et connecté à un **nouveau projet Vercel**. Framework : `Other`, pas de commande de build requise, sortie `.`. Les pages HTML et les JSON sont déjà générés. Ne pas utiliser une mise en production comme preuve de vérification des services tiers.

Après avoir relié le domaine réel :

```bash
SITE_URL=https://votre-domaine.example python3 scripts/create_sitemap.py
```

Aucune publication, aucun paramétrage de domaine et aucune modification d'un projet existant n'a été réalisé ici.

## Évolutions nécessaires

La v2 est un portail documentaire **statique**. Elle ne dispose pas encore de console d'administration authentifiée, d'import XLSX directement dans le navigateur, de surveillance des liens programmée, de moteur vectoriel, de contributions utilisateurs envoyées sur un serveur ni de fiches officiellement contrôlées pour la totalité des 909 ressources. Voir `docs/architecture.md` pour le déploiement d'une API et d'une base PostgreSQL, et `docs/quality-notes.md` pour l'ordre de priorité des vérifications.

## Enrichissement documentaire du 15 novembre 2026

- **69** dossiers détaillés ; **69** avec source officielle datée ; **85** liens documentaires.
- Nouvel accès **`/dossiers/`** pour découvrir ces fiches. Les autres entrées du catalogue sont conservées.
- **Sora** est explicitement indiqué comme ancien service arrêté.
- La méthode, les limites de vérification et les références sont disponibles dans [`docs/RECHERCHE_APPROFONDIE_2026-11-15.md`](docs/RECHERCHE_APPROFONDIE_2026-11-15.md).
- L'enrichissement documentaire n'est pas un test pratique ni une preuve de disponibilité ou de conditions tarifaires permanentes.


## Panorama des agents IA — novembre 2026

101 nouvelles fiches réparties dans cinq domaines. Voir [Agents IA](/agents/), [documentation de l'extension](docs/AGENTS_IA_PANORAMA_2026.md) et [données de l'extension](data/agent-inventory-2026.json). Muse de Meta et Dots d'OpenAI disposent de dossiers avec sources officielles. La sélection est évolutive et non exhaustive.
