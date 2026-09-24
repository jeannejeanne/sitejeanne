// marseille.js : les bons plans à Marseille.
// Vos propres bons plans sont ajoutés en bas et partagés sur ce navigateur.

const BONS_PLANS = [
  { nom: "Calanque de Sormiou", emoji: "🏝️", categorie: "Nature", texte: "Eau turquoise et petite plage. L'accès en voiture est réglementé l'été : on y va à pied ou en bus." },
  { nom: "Vallon des Auffes", emoji: "⛵", categorie: "Balade", texte: "Petit port de pêcheurs caché sous la Corniche. Parfait au coucher du soleil." },
  { nom: "Notre-Dame de la Garde", emoji: "⛪", categorie: "Gratuit", texte: "La « Bonne Mère » : entrée gratuite et la plus belle vue sur toute la ville." },
  { nom: "Îles du Frioul", emoji: "⛴️", categorie: "Nature", texte: "Navette depuis le Vieux-Port, criques et balades pour une journée hors de la ville." },
  { nom: "Le Mucem et le fort Saint-Jean", emoji: "🏛️", categorie: "Culture", texte: "Les jardins et passerelles du fort sont en accès libre, avec vue sur la mer." },
  { nom: "Le Panier", emoji: "🎨", categorie: "Balade", texte: "Le plus vieux quartier : ruelles colorées, street art, petites boutiques et la Vieille Charité." },
  { nom: "Cours Julien", emoji: "🎶", categorie: "Sorties", texte: "Quartier bohème : graffitis, bars, friperies et concerts." },
  { nom: "Marché de Noailles", emoji: "🧺", categorie: "Manger", texte: "Épices, fruits et légumes pas chers, dans une ambiance unique." },
  { nom: "Plage des Catalans", emoji: "🏖️", categorie: "Gratuit", texte: "La plage la plus proche du centre, idéale pour un plouf après les cours." },
  { nom: "Friche la Belle de Mai", emoji: "🏭", categorie: "Culture", texte: "Expos, concerts et un grand toit-terrasse avec vue sur la ville." },
  { nom: "Corniche Kennedy", emoji: "🌅", categorie: "Gratuit", texte: "Longue balade face à la mer, à pied ou à vélo." },
  { nom: "Panisse à l'Estaque", emoji: "🍟", categorie: "Manger", texte: "Panisses et chichis frégis, la spécialité à goûter face au port de l'Estaque." },
];

let categorieMarseille = "Tous";

function tousLesBonsPlans() {
  const nosPlans = lire("bons-plans", [], "commun").map((p) => ({ ...p, emoji: "💗", categorie: "Nos plans", perso: true }));
  return [...BONS_PLANS, ...nosPlans];
}

function afficherMarseille() {
  const plans = tousLesBonsPlans();
  const categories = ["Tous", ...new Set(plans.map((p) => p.categorie))];

  document.getElementById("filtres-marseille").innerHTML = categories
    .map((c) => `<button class="pastille ${c === categorieMarseille ? "actif" : ""}" data-categorie="${c}">${c}</button>`)
    .join("");

  document.getElementById("liste-marseille").innerHTML = plans
    .filter((p) => categorieMarseille === "Tous" || p.categorie === categorieMarseille)
    .map((p) => `
      <div class="carte">
        <div class="entete">
          <div class="emoji">${p.emoji}</div>
          ${p.perso ? `<button class="mini" data-supprimer="${p.id}" title="Supprimer">✕</button>` : ""}
        </div>
        <h3>${proteger(p.nom)}</h3>
        <p class="infos">${p.categorie}</p>
        <p>${proteger(p.texte)}</p>
        <p><a href="https://www.google.com/maps/search/${encodeURIComponent(p.nom + " Marseille")}" target="_blank" rel="noopener">📍 Voir sur la carte</a></p>
      </div>`).join("");
}

document.getElementById("filtres-marseille").addEventListener("click", (evenement) => {
  if (!evenement.target.dataset.categorie) return;
  categorieMarseille = evenement.target.dataset.categorie;
  afficherMarseille();
});

document.getElementById("liste-marseille").addEventListener("click", (evenement) => {
  const id = Number(evenement.target.dataset.supprimer);
  if (!id) return;
  ecrire("bons-plans", lire("bons-plans", [], "commun").filter((p) => p.id !== id), "commun");
  afficherMarseille();
});

document.getElementById("form-bonplan").addEventListener("submit", (evenement) => {
  evenement.preventDefault();
  const plans = lire("bons-plans", [], "commun");
  plans.push({
    id: Date.now(),
    nom: document.getElementById("bonplan-nom").value,
    texte: document.getElementById("bonplan-desc").value,
  });
  ecrire("bons-plans", plans, "commun");
  evenement.target.reset();
  categorieMarseille = "Nos plans";
  afficherMarseille();
});

afficherMarseille();
