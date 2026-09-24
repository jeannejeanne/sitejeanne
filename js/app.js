// app.js : les outils communs à toutes les rubriques.

// ---------- Sauvegarde dans le navigateur ----------
// Les données sont rangées dans le "localStorage" du navigateur.
// "perso" = propre à Jeanne ou à Laetitia ; "commun" = partagé sur ce navigateur.

const PREFIXE = "jl-";

function profilActuel() {
  return lire("profil", "jeanne", "commun");
}

function cle(nom, portee) {
  return portee === "commun" ? PREFIXE + nom : PREFIXE + profilActuel() + "-" + nom;
}

function lire(nom, parDefaut, portee) {
  try {
    const texte = localStorage.getItem(cle(nom, portee));
    return texte === null ? parDefaut : JSON.parse(texte);
  } catch (e) {
    return parDefaut;
  }
}

function ecrire(nom, valeur, portee) {
  try {
    localStorage.setItem(cle(nom, portee), JSON.stringify(valeur));
  } catch (e) {
    // Navigation privée ou stockage plein : on ne bloque pas le site
  }
}

// ---------- Petits outils ----------

// Protège le texte tapé par l'utilisatrice avant de l'afficher en HTML
function proteger(texte) {
  return String(texte == null ? "" : texte)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function euros(nombre) {
  return nombre.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// Date au format 2026-10-02, à l'heure française (pas celle de Londres)
function dateISO(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const jj = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + mm + "-" + jj;
}

function dateCourte(date) {
  return new Date(date + "T12:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function aujourdhui() {
  return dateISO(new Date());
}

// ---------- Onglets : une rubrique visible à la fois ----------

function afficherRubrique() {
  // Les rubriques ont un attribut data-rubrique (et pas d'id),
  // comme ça le navigateur ne descend pas tout seul au milieu de la page.
  const id = (location.hash || "#accueil").slice(1);
  const rubrique = document.querySelector(`[data-rubrique="${id}"]`);
  if (!rubrique) return;

  document.querySelectorAll(".rubrique").forEach((r) => r.classList.toggle("visible", r === rubrique));
  document.querySelectorAll("#onglets a").forEach((a) => {
    a.classList.toggle("actif", a.getAttribute("href") === "#" + id);
  });
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", afficherRubrique);
afficherRubrique();

// ---------- Choix du profil (Jeanne ou Laetitia) ----------

const choixProfil = document.getElementById("choix-profil");
const NOMS = { jeanne: "Jeanne", laetitia: "Laetitia" };

function appliquerProfil() {
  choixProfil.value = profilActuel();
  document.getElementById("prenom").textContent = NOMS[profilActuel()];
  // Chaque rubrique écoute cet événement pour se remettre à jour
  document.dispatchEvent(new Event("profil-change"));
}

choixProfil.addEventListener("change", () => {
  ecrire("profil", choixProfil.value, "commun");
  appliquerProfil();
});

// Lancé quand toutes les rubriques sont chargées
window.addEventListener("DOMContentLoaded", appliquerProfil);

// ---------- Export / import des données ----------

document.getElementById("bouton-export").addEventListener("click", () => {
  const donnees = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(PREFIXE)) donnees[k] = localStorage.getItem(k);
  }
  const fichier = new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" });
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(fichier);
  lien.download = "jeanne-laetitia-" + aujourdhui() + ".json";
  lien.click();
});

document.getElementById("fichier-import").addEventListener("change", async (evenement) => {
  const fichier = evenement.target.files[0];
  if (!fichier) return;
  try {
    const donnees = JSON.parse(await fichier.text());
    Object.entries(donnees).forEach(([k, v]) => {
      if (k.startsWith(PREFIXE)) localStorage.setItem(k, v);
    });
    alert("Données importées 💗");
    location.reload();
  } catch (e) {
    alert("Oups, ce fichier n'est pas valide.");
  }
});
