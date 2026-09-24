// Point d'entrée : menu, navigation entre rubriques, installation (PWA).
import { $, $$, h, store, esc, toast, age, firstName } from './core.js';
import { icon } from './icons.js';

export const VIEWS = [
  { id: 'accueil', label: 'Accueil & IA', short: 'Accueil', icon: 'sparkles' },
  { id: 'calendrier', label: 'Calendrier', short: 'Planning', icon: 'calendar', group: 'Organisation' },
  { id: 'surf', label: 'Vagues à Matosinhos', short: 'Surf', icon: 'wave', group: 'Surf' },
  { id: 'rounds', label: 'Minuteur de rounds', short: 'Rounds', icon: 'timer', group: 'Combat' },
  { id: 'combos', label: 'Combos shadow', short: 'Combos', icon: 'zap', group: 'Combat' },
  { id: 'journal', label: "Journal d'entraînement", short: 'Journal', icon: 'book', group: 'Combat' },
  { id: 'recup', label: 'Récup & mobilité', short: 'Récup', icon: 'heart', group: 'Combat' },
  { id: 'flashcards', label: 'Flashcards anatomie', short: 'Flashcards', icon: 'cards', group: 'Études' },
  { id: 'portugais', label: 'Portugais express', short: 'Portugais', icon: 'globe', group: 'Études' },
  { id: 'recettes', label: 'Recettes saines', short: 'Recettes', icon: 'utensils', group: 'Nutrition & forme' },
  { id: 'poids', label: 'Suivi du poids', short: 'Poids', icon: 'scale', group: 'Nutrition & forme' },
  { id: 'reglages', label: 'Réglages', short: 'Réglages', icon: 'settings', footer: true },
];
const TABS = ['accueil', 'calendrier', 'rounds', 'surf'];

// ---------- Thème ----------
function applyTheme() {
  const t = store.get('theme', 'light');
  const mode = t === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : t;
  document.documentElement.dataset.theme = mode;
  document.querySelector('meta[name="theme-color"]').content = mode === 'light' ? '#f4f7ff' : '#07122a';
}
applyTheme();
matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyTheme);
window.addEventListener('mt:theme', applyTheme);

// ---------- Menu ----------
const nav = $('#nav');
let lastGroup = null;
for (const v of VIEWS.filter(v => !v.footer)) {
  if (v.group && v.group !== lastGroup) { nav.appendChild(h(`<div class="nav-group">${esc(v.group)}</div>`)); lastGroup = v.group; }
  nav.appendChild(h(`<a class="nav-link" href="#/${v.id}" data-view="${v.id}">${icon(v.icon)}<span>${esc(v.label)}</span></a>`));
}
const settingsLink = $('.sidebar-foot .nav-link');
settingsLink.innerHTML = `${icon('settings')}<span>Réglages</span>`;

const tabbar = $('#tabbar');
for (const id of TABS) {
  const v = VIEWS.find(x => x.id === id);
  tabbar.appendChild(h(`<a href="#/${v.id}" data-view="${v.id}">${icon(v.icon)}<span>${esc(v.short)}</span></a>`));
}
const moreBtn = h(`<a href="#" data-more>${icon('menu')}<span>Plus</span></a>`);
tabbar.appendChild(moreBtn);

$('#menu-btn').innerHTML = icon('menu');
$('#topbar-settings').innerHTML = icon('settings');
const sidebar = $('#sidebar'), scrim = $('#scrim');
const openMenu = open => { sidebar.classList.toggle('open', open); scrim.classList.toggle('open', open); };
$('#menu-btn').onclick = () => openMenu(true);
moreBtn.onclick = e => { e.preventDefault(); openMenu(true); };
scrim.onclick = () => openMenu(false);

// ---------- Navigation ----------
const container = $('#views');
const mounted = {};

async function show(id) {
  const v = VIEWS.find(x => x.id === id) || VIEWS[0];
  openMenu(false);
  $$('.nav-link, .tabbar a').forEach(a => a.classList.toggle('active', a.dataset.view === v.id));
  $('#topbar-title').textContent = v.short;
  document.title = v.id === 'accueil' ? 'Matteo · Base' : `${v.short} · Matteo`;
  $$('.view', container).forEach(s => s.classList.remove('active'));
  let entry = mounted[v.id];
  if (!entry) {
    const section = h(`<section class="view" id="view-${v.id}"></section>`);
    container.appendChild(section);
    try {
      const mod = (await import(`./views/${v.id}.js`)).default;
      entry = mounted[v.id] = { section, mod };
      mod.render(section);
    } catch (err) {
      console.error(err);
      section.innerHTML = `<div class="card"><h2>Oups</h2><p class="muted">Cette rubrique n'a pas pu se charger : ${esc(err.message)}</p></div>`;
      entry = { section, mod: {} };
    }
  }
  entry.section.classList.add('active');
  entry.mod.onShow && entry.mod.onShow();
  window.scrollTo({ top: 0 });
}

function route() {
  const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'accueil';
  show(id);
}
window.addEventListener('hashchange', route);
route();

// ---------- Anniversaire (7 mai) ----------
(function birthday() {
  const d = new Date();
  if (d.getMonth() !== 4 || d.getDate() !== 7) return;
  const key = 'bday-' + d.getFullYear();
  if (store.get(key, false)) return;
  store.set(key, true);
  const colors = ['#ffd23f', '#3d7bff', '#ffffff', '#ffb800', '#6ea0ff'];
  for (let i = 0; i < 120; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 2.5 + Math.random() * 3 + 's';
    c.style.animationDelay = Math.random() * 1.5 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 7000);
  }
  toast(`Joyeux anniversaire ${firstName()} ! ${age()} ans 🎉`, 6000);
})();

// ---------- PWA : service worker + bouton d'installation ----------
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
let deferredPrompt = null;
const installBtn = $('#install-btn');
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.onclick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
};
window.addEventListener('appinstalled', () => { installBtn.hidden = true; toast('Appli installée 💪'); });
export const canInstall = () => !!deferredPrompt;
export const promptInstall = () => installBtn.click();
