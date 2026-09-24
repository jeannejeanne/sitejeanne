// motivation.js : citation du jour, "mon pourquoi" et objectifs de la semaine.

const CITATIONS = [
  { texte: "Tombe sept fois, relève-toi huit.", auteur: "Proverbe japonais" },
  { texte: "Petit à petit, l'oiseau fait son nid.", auteur: "Proverbe" },
  { texte: "Tu n'as pas besoin d'être parfaite, juste de continuer.", auteur: "" },
  { texte: "Chaque euro mis de côté est un pas de plus vers Porto ✈️", auteur: "" },
  { texte: "La discipline, c'est choisir entre ce que tu veux maintenant et ce que tu veux le plus.", auteur: "" },
  { texte: "Les petites habitudes de chaque jour font les grandes réussites.", auteur: "" },
  { texte: "Commence là où tu es. Utilise ce que tu as. Fais ce que tu peux.", auteur: "Arthur Ashe" },
  { texte: "Dans un an, tu seras contente d'avoir commencé aujourd'hui.", auteur: "" },
  { texte: "Ce n'est pas parce que les choses sont difficiles que nous n'osons pas, c'est parce que nous n'osons pas qu'elles sont difficiles.", auteur: "Sénèque" },
  { texte: "Fais de ta vie un rêve, et d'un rêve, une réalité.", auteur: "Antoine de Saint-Exupéry" },
  { texte: "Un « non » à une candidature te rapproche du « oui ».", auteur: "" },
  { texte: "Repose-toi si tu es fatiguée, mais n'abandonne pas.", auteur: "" },
];

function formaterCitation(c) {
  return proteger(c.texte) + (c.auteur ? `<small>— ${c.auteur}</small>` : "");
}

// La citation du jour change chaque jour (mais reste la même toute la journée)
function citationDuJour() {
  const numeroDuJour = Math.floor(Date.now() / 86400000);
  return CITATIONS[numeroDuJour % CITATIONS.length];
}

document.getElementById("citation-accueil").innerHTML = formaterCitation(citationDuJour());
document.getElementById("citation-du-jour").innerHTML = formaterCitation(citationDuJour());

document.getElementById("nouvelle-citation").addEventListener("click", () => {
  const c = CITATIONS[Math.floor(Math.random() * CITATIONS.length)];
  document.getElementById("citation-du-jour").innerHTML = formaterCitation(c);
});

// ---------- Mon pourquoi ----------
const monPourquoi = document.getElementById("mon-pourquoi");
monPourquoi.addEventListener("input", () => ecrire("pourquoi", monPourquoi.value));

// ---------- Objectifs de la semaine ----------
function afficherObjectifs() {
  monPourquoi.value = lire("pourquoi", "");
  const objectifs = lire("objectifs", []);
  document.getElementById("liste-objectifs").innerHTML = objectifs.length
    ? objectifs.map((o) => `
      <li>
        <input type="checkbox" data-cocher="${o.id}" ${o.fait ? "checked" : ""}>
        <span class="${o.fait ? "fait" : ""}">${proteger(o.texte)}</span>
        <button class="mini" data-supprimer="${o.id}" title="Supprimer">✕</button>
      </li>`).join("")
    : "<li>Ajoute ton premier objectif 🎯</li>";
}

document.getElementById("form-objectif").addEventListener("submit", (evenement) => {
  evenement.preventDefault();
  const champ = document.getElementById("nouvel-objectif");
  const objectifs = lire("objectifs", []);
  objectifs.push({ id: Date.now(), texte: champ.value, fait: false });
  ecrire("objectifs", objectifs);
  champ.value = "";
  afficherObjectifs();
});

document.getElementById("liste-objectifs").addEventListener("click", (evenement) => {
  const cible = evenement.target;
  let objectifs = lire("objectifs", []);
  if (cible.dataset.cocher) {
    const o = objectifs.find((o) => o.id === Number(cible.dataset.cocher));
    o.fait = cible.checked;
    if (objectifs.every((o) => o.fait)) setTimeout(() => alert("Tous tes objectifs sont faits ! Tu es incroyable 🎉"), 100);
  } else if (cible.dataset.supprimer) {
    objectifs = objectifs.filter((o) => o.id !== Number(cible.dataset.supprimer));
  } else {
    return;
  }
  ecrire("objectifs", objectifs);
  afficherObjectifs();
});

document.addEventListener("profil-change", afficherObjectifs);
