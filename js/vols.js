// vols.js : les week-ends Marseille (MRS) → Porto (OPO).
// Pour chaque week-end : des liens vers les comparateurs aux bonnes dates,
// et des cases pour noter le prix trouvé. Le moins cher est mis en avant.

const TYPES_WEEKEND = {
  // jour de départ (0 = dimanche … 6 = samedi) et nombre de nuits
  "ven-dim": { depart: 5, nuits: 2 },
  "sam-dim": { depart: 6, nuits: 1 },
  "ven-lun": { depart: 5, nuits: 3 },
  "jeu-dim": { depart: 4, nuits: 3 },
};

function prochainsWeekends(type, nombre) {
  const { depart, nuits } = TYPES_WEEKEND[type];
  const jour = new Date();
  jour.setHours(12, 0, 0, 0);
  jour.setDate(jour.getDate() + 1); // à partir de demain
  while (jour.getDay() !== depart) jour.setDate(jour.getDate() + 1);

  const liste = [];
  for (let i = 0; i < nombre; i++) {
    const aller = new Date(jour);
    const retour = new Date(jour);
    retour.setDate(retour.getDate() + nuits);
    liste.push({ aller: dateISO(aller), retour: dateISO(retour) });
    jour.setDate(jour.getDate() + 7);
  }
  return liste;
}

function liensComparateurs(aller, retour) {
  const court = (d) => d.slice(2).replaceAll("-", ""); // 2026-10-02 → 261002
  return [
    { nom: "Google Flights", url: `https://www.google.com/travel/flights?hl=fr&q=vols%20MRS%20OPO%20${aller}%20retour%20${retour}` },
    { nom: "Skyscanner", url: `https://www.skyscanner.fr/transport/vols/mrs/opo/${court(aller)}/${court(retour)}/` },
    { nom: "Kayak", url: `https://www.kayak.fr/flights/MRS-OPO/${aller}/${retour}` },
  ];
}

function afficherVols() {
  const type = document.getElementById("type-weekend").value;
  const nombre = Number(document.getElementById("nb-weekends").value);
  const prix = lire("vols-prix", {}, "commun");
  const weekends = prochainsWeekends(type, nombre);

  // On cherche le week-end noté le moins cher
  let meilleur = null;
  weekends.forEach((w) => {
    const note = prix[w.aller + "_" + w.retour];
    if (note && note.prix > 0 && (!meilleur || note.prix < meilleur.prix)) {
      meilleur = { ...w, ...note };
    }
  });

  const tbody = document.getElementById("liste-weekends");
  tbody.innerHTML = weekends.map((w) => {
    const id = w.aller + "_" + w.retour;
    const note = prix[id] || {};
    const liens = liensComparateurs(w.aller, w.retour)
      .map((l) => `<a class="pastille" href="${l.url}" target="_blank" rel="noopener">${l.nom}</a>`)
      .join("");
    const estMeilleur = meilleur && meilleur.aller === w.aller;
    return `
      <tr class="${estMeilleur ? "moins-cher" : ""}">
        <td>${dateCourte(w.aller)}</td>
        <td>${dateCourte(w.retour)}</td>
        <td>${liens}</td>
        <td><input type="number" min="0" step="1" data-id="${id}" data-champ="prix" value="${note.prix || ""}" placeholder="€"></td>
        <td><input type="text" data-id="${id}" data-champ="infos" value="${proteger(note.infos || "")}" placeholder="ex : 7h05 / 19h40 Ryanair"></td>
      </tr>`;
  }).join("");

  const encart = document.getElementById("meilleur-weekend");
  if (meilleur) {
    encart.innerHTML = `
      <h3>👑 Le week-end le moins cher noté</h3>
      <p><strong>${dateCourte(meilleur.aller)} → ${dateCourte(meilleur.retour)}</strong> : ${euros(meilleur.prix)} aller-retour
      ${meilleur.infos ? "(" + proteger(meilleur.infos) + ")" : ""}</p>`;
  } else {
    encart.innerHTML = `<h3>👑 Le week-end le moins cher</h3>
      <p>Note quelques prix dans le tableau et il apparaîtra ici.</p>`;
  }
}

// Quand on tape un prix ou des horaires, on les enregistre
document.getElementById("liste-weekends").addEventListener("change", (evenement) => {
  const champ = evenement.target;
  if (!champ.dataset.id) return;
  const prix = lire("vols-prix", {}, "commun");
  const note = prix[champ.dataset.id] || {};
  note[champ.dataset.champ] = champ.dataset.champ === "prix" ? Number(champ.value) : champ.value;
  prix[champ.dataset.id] = note;
  ecrire("vols-prix", prix, "commun");
  afficherVols();
});

document.getElementById("type-weekend").addEventListener("change", afficherVols);
document.getElementById("nb-weekends").addEventListener("change", afficherVols);
afficherVols();
