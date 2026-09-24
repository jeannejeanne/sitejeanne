// epargne.js : objectif d'épargne, compteur et rappel mensuel.
// Chaque profil (Jeanne / Laetitia) a sa propre tirelire.

function objectifEpargne() {
  return lire("epargne-objectif", { nom: "", montant: 0, mensuel: 0 });
}

function afficherEpargne() {
  const objectif = objectifEpargne();
  const versements = lire("epargne-versements", []);
  const total = versements.reduce((somme, v) => somme + v.montant, 0);

  document.getElementById("objectif-nom").value = objectif.nom;
  document.getElementById("objectif-montant").value = objectif.montant || "";
  document.getElementById("objectif-mensuel").value = objectif.mensuel || "";

  document.getElementById("total-epargne").textContent = euros(total);
  document.getElementById("accueil-epargne").textContent = euros(total);

  // Barre de progression vers l'objectif
  const pourcentage = objectif.montant > 0 ? Math.min(100, (total / objectif.montant) * 100) : 0;
  document.getElementById("barre-epargne").style.width = pourcentage + "%";
  document.getElementById("texte-progression").textContent = objectif.montant > 0
    ? `${Math.round(pourcentage)} % de ${euros(objectif.montant)}${objectif.nom ? " pour « " + objectif.nom + " »" : ""}` +
      (total >= objectif.montant ? " 🎉 Objectif atteint !" : ` · encore ${euros(objectif.montant - total)}`)
    : "Fixe-toi un objectif à gauche 💪";

  // Combien ce mois-ci ?
  const moisEnCours = aujourdhui().slice(0, 7);
  const ceMois = versements.filter((v) => v.date.startsWith(moisEnCours)).reduce((s, v) => s + v.montant, 0);
  document.getElementById("texte-mois").textContent = `Ce mois-ci : ${euros(ceMois)}` +
    (objectif.mensuel > 0 ? ` sur ${euros(objectif.mensuel)} promis` : "");

  // Le rappel qui "oblige" à mettre de côté
  const alerte = document.getElementById("alerte-epargne");
  if (objectif.mensuel > 0) {
    const reste = objectif.mensuel - ceMois;
    const jour = new Date().getDate();
    alerte.hidden = false;
    alerte.classList.toggle("bravo", reste <= 0);
    alerte.textContent = reste <= 0
      ? "✅ Engagement du mois tenu, bravo ! Tu es une machine 💗"
      : `⏰ Il te reste ${euros(reste)} à mettre de côté ce mois-ci.` +
        (jour >= 20 ? " La fin du mois approche, on s'y met aujourd'hui !" : " Fais-le maintenant, pas plus tard 😉");
  } else {
    alerte.hidden = true;
  }

  // Historique, du plus récent au plus ancien
  document.getElementById("historique-epargne").innerHTML = versements.length
    ? versements.slice().reverse().map((v) => `
      <li>
        <span><span class="date">${dateCourte(v.date)}</span> ${proteger(v.note)}</span>
        <span><span class="montant">+ ${euros(v.montant)}</span>
        <button class="mini" data-supprimer="${v.id}" title="Supprimer">✕</button></span>
      </li>`).join("")
    : "<li>Aucun versement pour l'instant. Le premier est le plus important !</li>";
}

// Enregistre l'objectif dès qu'on le modifie
["objectif-nom", "objectif-montant", "objectif-mensuel"].forEach((id) => {
  document.getElementById(id).addEventListener("change", () => {
    ecrire("epargne-objectif", {
      nom: document.getElementById("objectif-nom").value,
      montant: Number(document.getElementById("objectif-montant").value) || 0,
      mensuel: Number(document.getElementById("objectif-mensuel").value) || 0,
    });
    afficherEpargne();
  });
});

document.getElementById("form-versement").addEventListener("submit", (evenement) => {
  evenement.preventDefault();
  const versements = lire("epargne-versements", []);
  versements.push({
    id: Date.now(),
    date: aujourdhui(),
    montant: Number(document.getElementById("versement-montant").value),
    note: document.getElementById("versement-note").value,
  });
  ecrire("epargne-versements", versements);
  evenement.target.reset();
  afficherEpargne();
});

document.getElementById("historique-epargne").addEventListener("click", (evenement) => {
  const id = Number(evenement.target.dataset.supprimer);
  if (!id || !confirm("Supprimer ce versement ?")) return;
  ecrire("epargne-versements", lire("epargne-versements", []).filter((v) => v.id !== id));
  afficherEpargne();
});

document.addEventListener("profil-change", afficherEpargne);
