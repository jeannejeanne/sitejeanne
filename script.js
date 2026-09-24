// Ce fichier (JavaScript) rend le site INTERACTIF.

// 1. Le bouton "Clique-moi !" affiche un message au hasard
const messages = [
  "Bravo, tu as cliqué ! 🎉",
  "Encore ? 😄",
  "Tu deviens une vraie codeuse ! 💪",
  "Le JavaScript, c'est magique ✨",
];

document.getElementById("bouton-coucou").addEventListener("click", () => {
  const auHasard = Math.floor(Math.random() * messages.length);
  document.getElementById("message").textContent = messages[auHasard];
});

// 2. Le bouton 🌙 / ☀️ change entre mode clair et mode sombre
const boutonTheme = document.getElementById("bouton-theme");

boutonTheme.addEventListener("click", () => {
  document.body.classList.toggle("sombre");
  const estSombre = document.body.classList.contains("sombre");
  boutonTheme.textContent = estSombre ? "☀️" : "🌙";
});

// 3. Le formulaire de contact affiche un petit merci
document.getElementById("formulaire").addEventListener("submit", (evenement) => {
  evenement.preventDefault(); // empêche la page de se recharger
  const nom = document.getElementById("nom").value;
  document.getElementById("merci").textContent = `Merci ${nom}, ton message a bien été reçu ! 💌`;
  evenement.target.reset();
});

// 4. L'année dans le pied de page se met à jour toute seule
document.getElementById("annee").textContent = new Date().getFullYear();
