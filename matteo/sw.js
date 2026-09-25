// Service worker : l'appli fonctionne hors ligne (sauf l'IA et les prévisions de surf).
// Change VERSION à chaque mise à jour pour forcer le rafraîchissement.
const VERSION = 'matteo-v3';
const SHELL = [
  './',
  "./css/style.css",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/icon.svg",
  "./index.html",
  "./js/ai.js",
  "./js/audio.js",
  "./js/chart.js",
  "./js/core.js",
  "./js/data/anatomie.js",
  "./js/data/coeur.js",
  "./js/data/recettes.js",
  "./js/icons.js",
  "./js/main.js",
  "./js/views/accueil.js",
  "./js/views/calendrier.js",
  "./js/views/combos.js",
  "./js/views/flashcards.js",
  "./js/views/guerrier.js",
  "./js/views/journal.js",
  "./js/views/poids.js",
  "./js/views/portugais.js",
  "./js/views/recettes.js",
  "./js/views/recup.js",
  "./js/views/reglages.js",
  "./js/views/rounds.js",
  "./js/views/surf.js",
  "./manifest.webmanifest",
  "./vendor/anthropic-sdk.js",
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // API (IA, météo) : toujours en direct
  if (url.hostname.endsWith('anthropic.com') || url.hostname.endsWith('open-meteo.com')) return;
  // Polices Google : cache d'abord
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(caches.open(VERSION + '-fonts').then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // Fichiers de l'appli : réponse immédiate depuis le cache, mise à jour en arrière-plan
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit || c.match('./index.html'));
    return hit || net;
  }));
});
