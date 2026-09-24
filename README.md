# Jeanne & Laetitia 💗

Notre site à nous deux, en HTML, CSS et JavaScript (sans installation).

## Les rubriques

| Rubrique | Ce qu'elle fait |
|---|---|
| ✈️ Porto | Liste les prochains week-ends Marseille → Porto, avec des liens vers Google Flights, Skyscanner et Kayak aux bonnes dates. On note les prix trouvés et le week-end le moins cher est mis en avant. |
| 🥗 Recettes | Des recettes saines, avec une recherche par ingrédient et des filtres. |
| 🐷 Épargne | Un objectif, un engagement par mois, un compteur et un rappel tant que le mois n'est pas rempli. |
| ✨ Motivation | La citation du jour, « mon pourquoi » et les objectifs de la semaine. |
| ☀️ Marseille | Des bons plans par catégorie, et on peut ajouter les nôtres. |
| 💼 Alternance | Des recherches toutes prêtes (ingénieur d'affaires / commercial santé) sur Indeed, Welcome to the Jungle, HelloWork, LinkedIn…, plus le suivi des candidatures. |
| 📚 Cours | On colle un cours, le site en garde les phrases clés et les mots-clés, puis on l'enregistre en fiche. |

En haut à droite, « Je suis » permet de passer de Jeanne à Laetitia : chacune a sa propre épargne, ses objectifs, ses candidatures et ses fiches.

## Les fichiers

- `index.html` : le contenu de toutes les rubriques
- `style.css` : l'apparence (les couleurs roses sont en haut du fichier)
- `js/app.js` : les outils communs (onglets, sauvegarde, profils)
- `js/<rubrique>.js` : un fichier par rubrique

## Bon à savoir

- Les données sont enregistrées **dans le navigateur**. Pour les partager ou changer d'appareil : Accueil → Exporter, puis Importer de l'autre côté.
- Les prix des vols ne sont pas chargés automatiquement : il faudrait une API de compagnie aérienne (souvent payante).
- Pour ajouter une recette ou un bon plan « officiel », il suffit de copier un bloc `{ ... }` dans `js/recettes.js` ou `js/marseille.js`.

## Voir le site

Double-clique sur `index.html`.
