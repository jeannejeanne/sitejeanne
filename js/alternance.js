// alternance.js : recherches d'offres toutes prêtes + suivi des candidatures.

const POSTES = [
  "ingénieur d'affaires santé",
  "ingénieur commercial dispositifs médicaux",
  "business developer medtech",
  "chargé d'affaires santé",
  "commercial pharmaceutique",
  "key account manager santé",
];

const STATUTS = ["À envoyer", "Envoyée", "Relancée", "Entretien", "Acceptée 🎉", "Refusée"];

function liensAlternance(poste, ville) {
  const quoi = encodeURIComponent(poste + " alternance");
  const ou = ville === "France" ? "" : encodeURIComponent(ville);
  return [
    { nom: "Indeed", url: `https://fr.indeed.com/emplois?q=${quoi}&l=${ou}` },
    { nom: "Welcome to the Jungle", url: `https://www.welcometothejungle.com/fr/jobs?query=${quoi}${ou ? "&aroundQuery=" + ou : ""}` },
    { nom: "HelloWork", url: `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${quoi}&l=${ou}` },
    { nom: "LinkedIn", url: `https://www.linkedin.com/jobs/search/?keywords=${quoi}&location=${ou || "France"}` },
    { nom: "La bonne alternance", url: "https://labonnealternance.apprentissage.beta.gouv.fr/" },
    { nom: "France Travail", url: `https://candidat.francetravail.fr/offres/recherche?motsCles=${quoi}&typeContrat=E2` },
  ];
}

function afficherLiensAlternance() {
  const poste = document.getElementById("alt-poste").value;
  const ville = document.getElementById("alt-ville").value;
  document.getElementById("liens-alternance").innerHTML = liensAlternance(poste, ville)
    .map((l) => `<a class="pastille" href="${l.url}" target="_blank" rel="noopener">${l.nom} ↗</a>`)
    .join("");
}

function afficherCandidatures() {
  const candidatures = lire("candidatures", []);
  document.getElementById("liste-candidatures").innerHTML = candidatures.length
    ? candidatures.map((c) => `
      <tr>
        <td>${/^https?:\/\//.test(c.lien) ? `<a href="${proteger(c.lien)}" target="_blank" rel="noopener">${proteger(c.entreprise)}</a>` : proteger(c.entreprise)}</td>
        <td>${proteger(c.poste)}</td>
        <td>${dateCourte(c.date)}</td>
        <td><select data-statut="${c.id}">
          ${STATUTS.map((s) => `<option ${s === c.statut ? "selected" : ""}>${s}</option>`).join("")}
        </select></td>
        <td><button class="mini" data-supprimer="${c.id}" title="Supprimer">✕</button></td>
      </tr>`).join("")
    : `<tr><td colspan="5">Pas encore de candidature. Allez, on en envoie une aujourd'hui ! 💪</td></tr>`;
}

document.getElementById("alt-poste").innerHTML = POSTES.map((p) => `<option>${p}</option>`).join("");
document.getElementById("alt-poste").addEventListener("change", afficherLiensAlternance);
document.getElementById("alt-ville").addEventListener("change", afficherLiensAlternance);

document.getElementById("form-candidature").addEventListener("submit", (evenement) => {
  evenement.preventDefault();
  const candidatures = lire("candidatures", []);
  candidatures.unshift({
    id: Date.now(),
    entreprise: document.getElementById("cand-entreprise").value,
    poste: document.getElementById("cand-poste").value,
    lien: document.getElementById("cand-lien").value,
    date: aujourdhui(),
    statut: "Envoyée",
  });
  ecrire("candidatures", candidatures);
  evenement.target.reset();
  afficherCandidatures();
});

const tableauCandidatures = document.getElementById("liste-candidatures");

tableauCandidatures.addEventListener("change", (evenement) => {
  const id = Number(evenement.target.dataset.statut);
  if (!id) return;
  const candidatures = lire("candidatures", []);
  candidatures.find((c) => c.id === id).statut = evenement.target.value;
  ecrire("candidatures", candidatures);
});

tableauCandidatures.addEventListener("click", (evenement) => {
  const id = Number(evenement.target.dataset.supprimer);
  if (!id || !confirm("Supprimer cette candidature ?")) return;
  ecrire("candidatures", lire("candidatures", []).filter((c) => c.id !== id));
  afficherCandidatures();
});

afficherLiensAlternance();
document.addEventListener("profil-change", afficherCandidatures);
