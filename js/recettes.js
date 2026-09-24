// recettes.js : des recettes saines, avec recherche et filtres.
// Pour ajouter une recette, copie un bloc { ... } et modifie-le !

const RECETTES = [
  {
    nom: "Overnight oats aux fruits rouges", emoji: "🥣", categorie: "Petit-déj", temps: "5 min + 1 nuit",
    ingredients: ["50 g de flocons d'avoine", "120 ml de lait (ou lait végétal)", "1 yaourt nature", "1 c. à soupe de graines de chia", "1 poignée de fruits rouges", "1 c. à café de miel"],
    etapes: ["Mélange l'avoine, le lait, le yaourt et le chia dans un pot.", "Ferme et laisse au frigo toute la nuit.", "Le matin, ajoute les fruits rouges et le miel."],
  },
  {
    nom: "Pancakes banane-avoine", emoji: "🥞", categorie: "Petit-déj", temps: "15 min",
    ingredients: ["1 banane bien mûre", "2 œufs", "40 g de flocons d'avoine", "1 pincée de cannelle"],
    etapes: ["Mixe tous les ingrédients.", "Fais cuire de petites louches dans une poêle légèrement huilée, 2 min par face.", "Sers avec des fruits frais ou un peu de yaourt."],
  },
  {
    nom: "Buddha bowl pois chiches & patate douce", emoji: "🥗", categorie: "Déjeuner", temps: "30 min",
    ingredients: ["1 patate douce", "1 boîte de pois chiches", "1 poignée d'épinards", "½ avocat", "1 c. à soupe de tahini", "½ citron", "Cumin, paprika"],
    etapes: ["Coupe la patate douce en cubes, mélange avec les pois chiches égouttés, un filet d'huile, le cumin et le paprika.", "Enfourne 25 min à 200 °C.", "Dispose sur les épinards avec l'avocat.", "Sauce : tahini + jus de citron + un peu d'eau."],
  },
  {
    nom: "Salade de quinoa à la feta", emoji: "🥙", categorie: "Déjeuner", temps: "20 min",
    ingredients: ["80 g de quinoa", "½ concombre", "10 tomates cerises", "50 g de feta", "Menthe fraîche", "Huile d'olive, citron"],
    etapes: ["Cuis le quinoa 12 min dans l'eau bouillante, puis rince-le à l'eau froide.", "Coupe le concombre et les tomates.", "Mélange tout avec la feta émiettée, la menthe, l'huile et le citron."],
  },
  {
    nom: "Saumon au four & légumes rôtis", emoji: "🐟", categorie: "Dîner", temps: "25 min",
    ingredients: ["1 pavé de saumon", "1 courgette", "1 poivron", "½ oignon rouge", "Herbes de Provence", "Huile d'olive, citron"],
    etapes: ["Coupe les légumes, arrose d'huile et d'herbes.", "Enfourne 10 min à 200 °C.", "Ajoute le saumon avec une rondelle de citron et prolonge de 12 min."],
  },
  {
    nom: "Curry de lentilles corail", emoji: "🍛", categorie: "Dîner", temps: "25 min",
    ingredients: ["150 g de lentilles corail", "1 boîte de lait de coco léger", "1 boîte de tomates concassées", "1 oignon, 1 gousse d'ail", "1 c. à soupe de curry", "Épinards (facultatif)"],
    etapes: ["Fais revenir l'oignon et l'ail avec le curry.", "Ajoute les lentilles rincées, les tomates, le lait de coco et 200 ml d'eau.", "Laisse mijoter 15 à 20 min. Ajoute les épinards à la fin."],
  },
  {
    nom: "Poêlée de poulet, brocoli & riz complet", emoji: "🍗", categorie: "Dîner", temps: "25 min",
    ingredients: ["1 blanc de poulet", "1 petit brocoli", "60 g de riz complet", "1 c. à soupe de sauce soja", "1 c. à café de gingembre râpé", "Graines de sésame"],
    etapes: ["Cuis le riz selon le paquet.", "Fais dorer le poulet coupé en dés.", "Ajoute les fleurettes de brocoli, le soja, le gingembre et un fond d'eau. Couvre 6 min.", "Sers sur le riz avec le sésame."],
  },
  {
    nom: "Energy balls dattes-cacao", emoji: "🍫", categorie: "Snack", temps: "10 min",
    ingredients: ["100 g de dattes dénoyautées", "50 g d'amandes", "1 c. à soupe de cacao non sucré", "1 c. à soupe de flocons d'avoine", "Noix de coco râpée"],
    etapes: ["Mixe les dattes, les amandes, le cacao et l'avoine.", "Forme des petites boules.", "Roule-les dans la noix de coco et garde-les au frigo."],
  },
  {
    nom: "Houmous & bâtonnets de légumes", emoji: "🥕", categorie: "Snack", temps: "10 min",
    ingredients: ["1 boîte de pois chiches", "1 c. à soupe de tahini", "½ citron", "½ gousse d'ail", "Carottes, concombre, radis"],
    etapes: ["Mixe les pois chiches égouttés avec le tahini, le citron, l'ail et un peu d'eau.", "Assaisonne, ajoute un filet d'huile d'olive.", "Coupe les légumes en bâtonnets pour tremper."],
  },
  {
    nom: "Smoothie vert", emoji: "🥤", categorie: "Snack", temps: "5 min",
    ingredients: ["1 poignée d'épinards", "1 banane", "½ pomme", "200 ml de lait d'amande", "1 c. à café de beurre de cacahuète"],
    etapes: ["Mets tout dans le blender.", "Mixe jusqu'à ce que ce soit lisse. C'est prêt !"],
  },
];

let categorieRecette = "Toutes";

function afficherFiltresRecettes() {
  const categories = ["Toutes", ...new Set(RECETTES.map((r) => r.categorie))];
  document.getElementById("filtres-recettes").innerHTML = categories
    .map((c) => `<button class="pastille ${c === categorieRecette ? "actif" : ""}" data-categorie="${c}">${c}</button>`)
    .join("");
}

function afficherRecettes() {
  const recherche = document.getElementById("recherche-recette").value.toLowerCase().trim();
  const visibles = RECETTES.filter((r) => {
    const bonneCategorie = categorieRecette === "Toutes" || r.categorie === categorieRecette;
    const texte = (r.nom + " " + r.ingredients.join(" ")).toLowerCase();
    return bonneCategorie && texte.includes(recherche);
  });

  document.getElementById("liste-recettes").innerHTML = visibles.length
    ? visibles.map((r) => `
      <div class="carte">
        <div class="emoji">${r.emoji}</div>
        <h3>${r.nom}</h3>
        <p class="infos">${r.categorie} · ⏱ ${r.temps}</p>
        <details>
          <summary>Ingrédients</summary>
          <ul>${r.ingredients.map((i) => `<li>${i}</li>`).join("")}</ul>
        </details>
        <details>
          <summary>Préparation</summary>
          <ol>${r.etapes.map((e) => `<li>${e}</li>`).join("")}</ol>
        </details>
      </div>`).join("")
    : "<p>Aucune recette trouvée 😢</p>";
}

document.getElementById("filtres-recettes").addEventListener("click", (evenement) => {
  const categorie = evenement.target.dataset.categorie;
  if (!categorie) return;
  categorieRecette = categorie;
  afficherFiltresRecettes();
  afficherRecettes();
});

document.getElementById("recherche-recette").addEventListener("input", afficherRecettes);
afficherFiltresRecettes();
afficherRecettes();
