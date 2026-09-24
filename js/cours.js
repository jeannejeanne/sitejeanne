// cours.js : résumé automatique des cours et fiches de révision.
//
// Comment marche le résumé ?
// 1. On compte combien de fois chaque mot important apparaît dans le cours.
// 2. Chaque phrase reçoit une note = la somme des notes de ses mots.
// 3. On garde les phrases les mieux notées, dans l'ordre du cours.

// Les petits mots qui ne veulent rien dire tout seuls, qu'on ignore
const MOTS_VIDES = new Set((
  "le la les un une des du de d l et ou mais donc or ni car à au aux en dans par pour sur sous avec sans " +
  "ce cet cette ces se sa son ses leur leurs mon ma mes ton ta tes notre nos votre vos qui que quoi dont où " +
  "il elle ils elles on nous vous je tu me te lui y est sont été être a ont avoir fait faire peut peuvent " +
  "plus moins très aussi ainsi comme si ne pas cela ça celui celle ceux entre tout tous toute toutes " +
  "c qu n s j m t même autre autres alors bien encore déjà lors dont chaque quand"
).split(" "));

function decouperPhrases(texte) {
  return texte
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?;:])\s+(?=[A-ZÀ-Ý0-9«"-])/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);
}

function mots(texte) {
  return texte.toLowerCase().match(/[a-zà-ÿœæ]+/g) || [];
}

function frequences(texte) {
  const compte = {};
  mots(texte).forEach((m) => {
    if (m.length > 2 && !MOTS_VIDES.has(m)) compte[m] = (compte[m] || 0) + 1;
  });
  return compte;
}

function resumer(texte, proportion) {
  const phrases = decouperPhrases(texte);
  const freq = frequences(texte);
  const notes = phrases.map((phrase, position) => {
    const sesMots = mots(phrase).filter((m) => freq[m]);
    const note = sesMots.reduce((s, m) => s + freq[m], 0) / Math.max(4, mots(phrase).length);
    // Petit bonus pour les phrases du début (souvent l'idée principale)
    return { phrase, position, note: note * (position === 0 ? 1.3 : 1) };
  });

  const combien = Math.max(1, Math.round(phrases.length * proportion));
  const gardees = notes
    .slice()
    .sort((a, b) => b.note - a.note)
    .slice(0, combien)
    .sort((a, b) => a.position - b.position);

  const motsCles = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([m]) => m);

  return { resume: gardees.map((g) => "• " + g.phrase).join("\n"), motsCles };
}

// ---------- Interface ----------

let motsClesActuels = [];
let matiereFiltre = "Toutes";

document.getElementById("bouton-resumer").addEventListener("click", () => {
  const texte = document.getElementById("cours-texte").value;
  if (decouperPhrases(texte).length < 2) {
    alert("Colle un peu plus de texte (au moins quelques phrases) 😊");
    return;
  }
  const proportion = Number(document.getElementById("cours-longueur").value);
  const { resume, motsCles } = resumer(texte, proportion);
  motsClesActuels = motsCles;
  document.getElementById("resume-texte").value = resume;
  document.getElementById("resume-mots").innerHTML = motsCles.map((m) => `<span class="pastille">${m}</span>`).join("");
  document.getElementById("zone-resume").hidden = false;
});

document.getElementById("bouton-enregistrer-fiche").addEventListener("click", () => {
  const fiches = lire("fiches", []);
  fiches.unshift({
    id: Date.now(),
    matiere: document.getElementById("cours-matiere").value.trim() || "Sans matière",
    titre: document.getElementById("cours-titre").value.trim() || "Sans titre",
    resume: document.getElementById("resume-texte").value,
    motsCles: motsClesActuels,
    date: aujourdhui(),
  });
  ecrire("fiches", fiches);
  document.getElementById("cours-texte").value = "";
  document.getElementById("cours-titre").value = "";
  document.getElementById("zone-resume").hidden = true;
  afficherFiches();
});

function afficherFiches() {
  const fiches = lire("fiches", []);
  const matieres = ["Toutes", ...new Set(fiches.map((f) => f.matiere))];
  if (!matieres.includes(matiereFiltre)) matiereFiltre = "Toutes";

  document.getElementById("filtres-cours").innerHTML = fiches.length
    ? matieres.map((m) => `<button class="pastille ${m === matiereFiltre ? "actif" : ""}" data-matiere="${proteger(m)}">${proteger(m)}</button>`).join("")
    : "";

  const visibles = fiches.filter((f) => matiereFiltre === "Toutes" || f.matiere === matiereFiltre);
  document.getElementById("liste-fiches").innerHTML = visibles.length
    ? visibles.map((f) => `
      <div class="carte fiche">
        <div class="entete">
          <h3>${proteger(f.titre)}</h3>
          <button class="mini" data-supprimer="${f.id}" title="Supprimer">✕</button>
        </div>
        <p class="infos">${proteger(f.matiere)} · ${dateCourte(f.date)}</p>
        <div class="pastilles">${f.motsCles.map((m) => `<span class="pastille">${proteger(m)}</span>`).join("")}</div>
        <details><summary>Voir la fiche</summary><p>${proteger(f.resume)}</p></details>
      </div>`).join("")
    : "<p>Aucune fiche pour l'instant.</p>";
}

document.getElementById("filtres-cours").addEventListener("click", (evenement) => {
  if (evenement.target.dataset.matiere === undefined) return;
  matiereFiltre = evenement.target.dataset.matiere;
  afficherFiches();
});

document.getElementById("liste-fiches").addEventListener("click", (evenement) => {
  const id = Number(evenement.target.dataset.supprimer);
  if (!id || !confirm("Supprimer cette fiche ?")) return;
  ecrire("fiches", lire("fiches", []).filter((f) => f.id !== id));
  afficherFiches();
});

document.addEventListener("profil-change", afficherFiches);
