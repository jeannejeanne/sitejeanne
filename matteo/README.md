# Matteo · Base 🥊🌊

L'appli perso de Matteo (kiné à Porto, muay thaï, MMA, surf). Un site en HTML/CSS/JavaScript, sans installation, **installable sur le téléphone comme une vraie appli** (PWA) et utilisable hors ligne.

## Les rubriques

| Rubrique | Ce qu'elle fait |
|---|---|
| ✨ Accueil & IA | Le résumé du jour (prochain cours, note du surf, séances, cartes à réviser) et un coach IA à qui poser toutes les questions. Il connaît son planning, son poids et ses entraînements. On peut lui joindre un PDF ou une photo. |
| 🗓️ Calendrier | Vue semaine, mois et agenda. Cours, stages, examens, muay thaï, MMA, muscu, surf… avec répétition chaque semaine. Import et export `.ics` (Google Agenda, emploi du temps de la fac). |
| 🌊 Vagues à Matosinhos | Prévisions de houle, période, vent, marée et température de l'eau (Open-Meteo, gratuit). Une note sur 10 pour chaque jour, le meilleur créneau, le conseil de planche, et des liens vers Surf-Forecast, la webcam MEO et Windy. |
| ⏱️ Minuteur de rounds | 3 min de combat / 1 min de repos par défaut, cloche de ring au début et à la fin, clap 10 s avant la fin, préréglages (muay thaï pro, MMA, HIIT…), voix, plein écran, écran toujours allumé. Peut annoncer des combos pendant les rounds. |
| ⚡ Combos shadow | Enchaînements annoncés à voix haute, en boxe anglaise, muay thaï ou MMA, sur 4 niveaux (débutant → pro), au choix en noms ou en numéros (1-2-3…). |
| 📓 Journal d'entraînement | Séances, durée, intensité (RPE), forme, ce qui a été travaillé, ressentis et progrès. Charge par semaine et ratio aigu/chronique (risque de blessure). |
| 🧘 Récup & mobilité | Check-in du jour (sommeil, courbatures, énergie, stress → feu vert/orange/rouge) et 5 routines d'étirements guidées à la voix. |
| 🦴 Flashcards | On importe un cours (PDF, photo, texte) et l'IA en fait des flashcards. Révision espacée (les cartes difficiles reviennent plus souvent). Un paquet d'anatomie de base est inclus. |
| 🇵🇹 Portugais express | Phrases utiles pour la fac, le stage de kiné, la salle, le surf et la vie à Porto, avec la prononciation. |
| 🥗 Recettes saines | Plus de 60 recettes (protéinées, rapides, prise de masse, sèche, végé, portugaises…), la recherche « ce que j'ai dans le frigo », des favoris, et des idées inventées par l'IA. |
| ⚖️ Suivi du poids | Courbe avec moyenne sur 7 jours, objectif, tendance, calories et macros conseillées, et des conseils adaptés (perte, prise de masse, pesée de combat…). |

Petit bonus : le 7 mai, l'appli lui souhaite son anniversaire 🎉

## Mettre l'appli en ligne

Une PWA doit être servie en **https**. Le plus simple avec ce dépôt : **GitHub Pages**.

1. Sur GitHub : *Settings → Pages → Build and deployment → Deploy from a branch*, choisir la branche principale et le dossier `/ (root)`.
2. L'appli sera à l'adresse `https://<compte>.github.io/sitejeanne/matteo/`.
3. Sur le téléphone de Matteo, ouvrir cette adresse puis :
   - **iPhone** (Safari) : bouton Partager → « Sur l'écran d'accueil » ;
   - **Android** (Chrome) : menu ⋮ → « Installer l'application ».

Pour tester sur l'ordinateur : `python3 -m http.server` dans ce dossier, puis http://localhost:8000/matteo/.

## Connecter l'IA

L'assistant, les flashcards générées et les idées de recettes utilisent Claude (Anthropic).

1. Créer un compte sur https://console.anthropic.com et ajouter un peu de crédit (quelques euros suffisent pour un usage perso).
2. Créer une clé API.
3. Dans l'appli : **Réglages → Clé API**, coller la clé, puis « Tester la connexion ».

La clé est gardée uniquement sur le téléphone et n'est envoyée qu'à l'API d'Anthropic. Le modèle par défaut est Claude Opus 5 ; Sonnet 5 et Haiku 4.5 sont proposés dans les réglages pour une appli plus rapide et moins chère.

## Les fichiers

- `index.html` : la structure (menu, zone des rubriques)
- `css/style.css` : l'apparence ; les couleurs jaune et bleu sont en haut du fichier
- `js/main.js` : menu, navigation, installation
- `js/views/<rubrique>.js` : une rubrique par fichier
- `js/data/` : les recettes et les flashcards d'anatomie de départ (faciles à compléter)
- `js/ai.js` : la connexion à Claude ; `vendor/anthropic-sdk.js` : le SDK officiel d'Anthropic (v0.128.0), empaqueté pour le navigateur
- `sw.js` + `manifest.webmanifest` + `icons/` : ce qui rend l'appli installable et utilisable hors ligne

## Bon à savoir

- Les données sont enregistrées **dans le navigateur du téléphone**. Réglages → Exporter pour faire une sauvegarde ou changer d'appareil.
- Après une modification des fichiers, changer `VERSION` en haut de `sw.js` pour que le téléphone récupère la nouvelle version.
- La note de surf est une estimation maison pour Matosinhos (beach break orienté ouest, vent offshore = vent d'est) : un coup d'œil à la webcam avant de partir reste le meilleur conseil.
