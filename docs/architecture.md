# Atlas IA — architecture et trajectoire

## Portée livrée (v1)

**Application statique sans dépendances d'exécution** : HTML pré-généré pour les 808 fiches et les 50 catégories, CSS adaptatif et JavaScript progressif pour interactions côté client. Données normalisées en JSON. Un navigateur moderne et un hébergeur statique suffisent.

- Accueil et chiffres calculés sur le catalogue réel.
- Répertoire avec recherche texte, accents tolérés, correction légère de fautes, filtres cumulables par catégorie, nature et présence d'URL ; tri et pagination de 24 éléments.
- Modes cartes, liste, tableau, grille de logos.
- Catégories accessibles par famille, pages individuelles et catégories secondaires préservées.
- Fiches avec liens déclarés, classification, date et source ; champs non vérifiés explicitement visibles.
- Comparateur (4 références), URL partageable et favoris conservés dans `localStorage`.
- Douze parcours de découverte fondés sur les catégories, non sur des capacités produits supposées.
- Visualisation de familles et mini-constellation cliquable, avec alternative textuelle.
- Interface FR/EN, responsive, clair/sombre, navigation clavier et réduction des animations selon préférences.
- Page qualité : données manquantes, URLs partagées, proportions et indicateurs sans notes inventées.
- API JSON publique **lecture seule** : `/data/tools.json`, `/data/categories.json`, `/data/families.json`, `/data/quality-report.json`.
- URL directes `outils/slug/` et `categories/slug/` avec contenu HTML de repli indexable sans JavaScript.

## Source et provenance

`/sources/atlas_outils_ia_2026.csv` est la source principale. Chaque nom, identifiant, nature, classification et URL déclarée en provient. La date de collecte est le 15 novembre 2026. **Aucun prix, public cible, avis, score, licence ou fonction spécifique n'a été inventé pour remplir une fiche.** La source d'orientation indiquée dans le CSV ne constitue pas une preuve de vérification de chaque entrée.

La taxonomie éditoriale secondaire des six familles et les douze parcours de besoin sont des regroupements proposés **pour la navigation uniquement**. Une catégorie secondaire source ne devient pas un fait supplémentaire sur les capacités d'un outil.

Le fichier qualité recense les champs incomplets et URLs communes ; les URLs communes **ne sont pas fusionnées** sans validation humaine. La génération `scripts/build_catalog.py` garde les identifiants stables et peut être rejouée après mise à jour du CSV.

## Architecture des dossiers

```text
atlas-ia-portal/
  index.html                / Accueil pré-généré
  repertoire/               / Point d'entrée répertoire
  categories/               / 50 pages catégories + index
  outils/                   / 808 fiches statiques, routes directes
  besoins/, comparateur/    / Parcours et comparaison
  favoris/, qualite/        / Collections locales et méthode
  assets/app.js             / Navigation, recherche et interactions
  assets/style.css          / Système de design accessible et responsive
  data/*.json               / Base documentaire statique
  sources/*.csv             / Référentiel original, jamais supprimé
  scripts/build_catalog.py / Import, normalisation, génération statique
  scripts/browser_smoke_test.py / Tests UI avec Playwright local
  scripts/create_sitemap.py / Sitemaps à générer après choix de domaine
  docs/database.sql         / Schéma PostgreSQL cible
  vercel.json               / Déploiement statique
```

## Phases futures requérant un backend

La version v1 est un **prototype fonctionnel de consultation**, pas une plateforme SaaS complète. Pour construire la v2 :

1. Déployer une base PostgreSQL, utiliser `docs/database.sql` comme modèle initial et créer des migrations. Implémenter un import idempotent basé sur `Tool.id` avec transaction et audit des modifications.
2. Migrer la recherche vers PostgreSQL full-text pour un premier volume, puis ajouter si nécessaire Meilisearch, Typesense ou une couche sémantique fondée sur les **sources documentées** ; contrôler la dérive des résultats.
3. Ajouter un backend avec session et rôles (RBAC), protection contre CSRF, validation des URL et limites d'API. **Ne pas exposer de console d'administration non authentifiée**.
4. Construire un tableau de bord editorial : importer CSV/JSON/XLSX, fusionner manuellement les doublons, gérer propositions, vérification, publications et historisation.
5. Enrichir les fiches au moyen de sources officielles datées, vérifier régulièrement les URLs et gérer des états `verified`, `stale`, `discontinued`.
6. Ajouter logos officiels avec droit d'usage, vraies captures vérifiées, moteurs de recommandation et recherche conversationnelle sourcée.
7. Ajouter comptes facultatifs, favoris synchronisés avec consentement, collections collaboratives et comparaison exportable en PDF/CSV.
8. Internationaliser entièrement les descriptions **lorsqu'elles seront vérifiées**, produire `hreflang` et gestion RTL pour autres langues.

## Garanties non revendiquées en v1

- Pas de vraie recherche vectorielle ou chatbot IA ; la recherche actuelle est textuelle avec tolérance légère aux fautes.
- Pas de prix ou fonctionnalités vérifiés, donc pas de filtres tarifaires, API, langue ou open source trompeurs.
- Pas de comptes, de formulaire de soumission réseau ni d'interface admin publique. Le signalement de fiche prépare un texte copiable ; **il n'est pas envoyé**.
- Pas de capture certifiée de 808 services ; les favicons externes, si disponibles, sont illustratives et ont un fallback.
- Pas de veille automatique, notifications ni intégration avec des prestataires externes.
- Pas de tests WCAG complets ou audit de sécurité final ; des tests interactifs ciblés ont été effectués.
- Pas de déploiement GitHub/Vercel effectif sans dépôt et projet cible autorisés.

## Sécurité & confidentialité

Aucune donnée personnelle n'est transmise par le code de l'application. `localStorage` garde les choix du navigateur ; le site ne dispose pas de serveur de compte. Le service de favicons Google, lorsqu'un utilisateur l'autorise dans son navigateur, reçoit les domaines demandés ; le rendre facultatif ou le remplacer par des ressources locales approuvées pour une politique de confidentialité stricte. Aucun cookie analytique ajouté par l'application. Les URLs `http` et `https` sont validées à l'import et réévaluées au rendu. Les données sont échappées lors de leur insertion HTML. CSP stricte et suppression des gestionnaires d'évènements inline à prévoir avant un déploiement institutionnel.

## SEO

Les 808 fiches et les 50 pages de catégories sont générées avec `<title>`, `<meta name="description">`, JSON-LD `WebPage` sur fiches, et HTML consultable sans JavaScript. Après choix du domaine, exécuter `scripts/create_sitemap.py` avec la variable `SITE_URL`, ajouter des URL canoniques absolues et, lorsque les pages anglaises seront physiques, des `hreflang` réciproques. Éviter l'indexation de contenu pauvre tant que les fiches ne sont pas enrichies.
