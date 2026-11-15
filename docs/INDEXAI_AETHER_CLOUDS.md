# IndexAI — AETHER / Nuages de particules interactifs

## Objectif

Créer pour IndexAI un mouvement atmosphérique original évoquant les nuages de particules et les spirales lumineuses de la page de lancement GPT-6 Astra d’OpenAI, **sans réutiliser leur code, médias, logos ni assets**. L’animation est adaptée aux couleurs d’IndexAI : sable, ivoire et terracotta en clair, cuivre et graphite en sombre.

## Technique

- `assets/nebula.js` : animation Canvas 2D dessinée procéduralement (nuages de gradients, spirale de particules, effet de profondeur et impulsions).
- `assets/app.js` : insertion dans le hero, import différé uniquement pour l’accueil et destruction des listeners lors des changements de page.
- `assets/style.css` : thème minéral et mise en page responsive, intégration discrète au-dessus du fond et derrière les boutons et la constellation cliquable.

## Interactions

- Déplacer la souris : parallaxe légère et variation de vitesse du nuage de particules.
- Cliquer sur un espace libre du hero : impulsion visuelle temporaire (ne perturbe pas les liens).
- Bouton **Pause / Animer** : active ou désactive le mouvement; préférence de session conservée.
- Mode sombre : palette cuivre, or, bleu brumeux et graphite. Mode clair : sable, terracotta, sauge et ivoire.

## Accessibilité et performance

- `prefers-reduced-motion: reduce` arrête la boucle d’animation et ne laisse qu’une image statique.
- Canvas décoratif `aria-hidden` : aucune lecture gênante aux outils d’assistance.
- Canvas derrière les éléments interactifs; liens de la constellation et boutons conservent leur fonctionnement et leur focus clavier.
- Nombre de particules et résolution inférieurs sur mobile; fréquence limitée à 28 FPS (17 FPS sur pointeur tactile).
- Mise en pause lorsque le hero quitte l’écran ou quand l’onglet n’est plus visible.
- CSS de repli si Canvas, Web API ou script ne sont pas disponibles; pas d’import de vidéo, de bibliothèque ou de fichier graphique propriétaire.

## Contrôles recommandés

1. Tester en clair et sombre sur bureau et téléphone.
2. Vérifier les liens du hero et de la constellation.
3. Vérifier la pause, la reprise et le mode « réduction des animations ».
4. Tester un navigateur sans Canvas : contenu principal entièrement utilisable.
5. Vérifier `/data/tools.json` et les routes existantes; aucune modification des 909 fiches.

Cette première intégration sur IndexAI est une composante réutilisable pour d’autres portails, à personnaliser selon leur identité et leur ergonomie avant tout déploiement distinct.
