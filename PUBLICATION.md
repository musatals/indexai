# IndexAI v2 — Publication GitHub et Vercel

## État actuel (15 novembre 2026)

- Projet Vercel **indexai** créé dans l'espace `noureddinelm-4264` : https://vercel.com/noureddinelm-4264/indexai
- **Aucun déploiement de l'application n'a encore été effectué.**
- Le code complet est versionné localement sur `main`, tag `v2.0.0`.
- Le dépôt distant GitHub **Bouguen/IndexAI** reste à créer : le connecteur GitHub de cette session ne permet pas de créer de nouveaux dépôts.

## Étape GitHub

1. Ouvrir https://github.com/new et choisir **Bouguen** comme propriétaire.
2. Nommer le dépôt **IndexAI**, sans README initial ni .gitignore initial.
3. Décompresser l'archive `indexai-github-ready.zip`.
4. Ouvrir PowerShell dans le dossier `indexai-portal-v2`, puis exécuter :

```powershell
git remote add origin https://github.com/Bouguen/IndexAI.git
git push -u origin main
git push origin v2.0.0
```

Si la commande `git remote add` signale que `origin` existe, utiliser : `git remote set-url origin https://github.com/Bouguen/IndexAI.git`.

## Étape Vercel

Projet existant : https://vercel.com/noureddinelm-4264/indexai/settings/git

1. Cliquer sur **Connect Git Repository** et sélectionner `Bouguen/IndexAI`.
2. Framework : **Other**, Root Directory : `./`.
3. Aucune commande d'installation ni de build ; Output Directory : `.`.
4. Lancer la première production et vérifier `/`, `/repertoire/`, `/categories/`, `/outils/claude/`.
5. Tester recherche, filtres, fiches, favoris, modes clair/sombre et affichage mobile.
6. Connecter éventuellement votre domaine personnalisé.

## Précautions

- Ne pas modifier le projet distinct `indexia`.
- 599 fiches restent volontairement marquées « à documenter ».
- Les informations tarifaires doivent être revérifiées régulièrement.
- Le projet est statique et ne nécessite pas de secrets de production à ce stade.
