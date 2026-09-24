// Générateur de combos annoncés à voix haute pour le shadow boxing / le sac.
import { store, esc, $, $$, toast, h, mmss } from '../core.js';
import { icon } from '../icons.js';
import { speak, unlockAudio, keepAwake, bell, canSpeak } from '../audio.js';

// Coups disponibles. lvl = niveau minimum (1 débutant → 4 pro). side : L = avant, R = arrière
const S = {
  jab: { n: 'Jab', num: '1', side: 'L', kind: 'p', lvl: 1 },
  cross: { n: 'Cross', num: '2', side: 'R', kind: 'p', lvl: 1 },
  hook: { n: 'Crochet', num: '3', side: 'L', kind: 'p', lvl: 1 },
  rhook: { n: 'Crochet arrière', num: '4', side: 'R', kind: 'p', lvl: 2 },
  upper: { n: 'Uppercut', num: '5', side: 'L', kind: 'p', lvl: 2 },
  rupper: { n: 'Uppercut arrière', num: '6', side: 'R', kind: 'p', lvl: 2 },
  bjab: { n: 'Jab au corps', num: '1 corps', side: 'L', kind: 'p', lvl: 2 },
  bhook: { n: 'Crochet au corps', num: '3 corps', side: 'L', kind: 'p', lvl: 2 },
  overhand: { n: 'Overhand', num: 'overhand', side: 'R', kind: 'p', lvl: 3 },
  superman: { n: 'Superman punch', num: 'superman', side: 'R', kind: 'p', lvl: 4, mt: true },
  teep: { n: 'Teep', side: 'L', kind: 'k', lvl: 1, mt: true },
  rteep: { n: 'Teep arrière', side: 'R', kind: 'k', lvl: 2, mt: true },
  low: { n: 'Low kick', side: 'R', kind: 'k', lvl: 1, mt: true },
  llow: { n: 'Low kick avant', side: 'L', kind: 'k', lvl: 3, mt: true },
  calf: { n: 'Calf kick', side: 'R', kind: 'k', lvl: 2, mt: true },
  middle: { n: 'Middle kick', side: 'R', kind: 'k', lvl: 1, mt: true },
  switch: { n: 'Switch kick', side: 'L', kind: 'k', lvl: 3, mt: true },
  high: { n: 'High kick', side: 'R', kind: 'k', lvl: 3, mt: true },
  knee: { n: 'Genou', side: 'R', kind: 'n', lvl: 2, mt: true },
  sknee: { n: 'Genou sauté', side: 'R', kind: 'n', lvl: 4, mt: true },
  elbow: { n: 'Coude', side: 'R', kind: 'e', lvl: 3, mt: true },
  lelbow: { n: 'Coude avant', side: 'L', kind: 'e', lvl: 3, mt: true },
  uelbow: { n: 'Coude remontant', side: 'R', kind: 'e', lvl: 4, mt: true },
  slip: { n: 'Esquive', kind: 'd', lvl: 1 },
  roll: { n: 'Rotation', kind: 'd', lvl: 2 },
  check: { n: 'Check', kind: 'd', lvl: 2, mt: true },
  block: { n: 'Blocage', kind: 'd', lvl: 1 },
  pivot: { n: 'Pivot', kind: 'd', lvl: 3 },
  back: { n: 'Pas arrière', kind: 'd', lvl: 1 },
  level: { n: 'Changement de niveau', kind: 'g', lvl: 2, mma: true },
  double: { n: 'Double leg', kind: 'g', lvl: 2, mma: true },
  single: { n: 'Single leg', kind: 'g', lvl: 3, mma: true },
  sprawl: { n: 'Sprawl', kind: 'd', lvl: 2, mma: true },
  feint: { n: 'Feinte', kind: 'd', lvl: 3 },
};

// Enchaînements classiques (piochés une fois sur deux)
const CLASSICS = {
  boxe: [['jab', 'cross'], ['jab', 'jab', 'cross'], ['jab', 'cross', 'hook'], ['jab', 'cross', 'hook', 'cross'], ['cross', 'hook', 'cross'], ['jab', 'rupper', 'hook', 'cross'], ['bjab', 'cross', 'hook'], ['jab', 'cross', 'slip', 'cross', 'hook', 'cross'], ['hook', 'bhook', 'hook'], ['jab', 'cross', 'roll', 'hook', 'cross'], ['upper', 'hook', 'cross'], ['jab', 'overhand', 'hook']],
  muay: [['jab', 'cross', 'low'], ['teep', 'jab', 'cross', 'middle'], ['jab', 'cross', 'hook', 'low'], ['jab', 'middle'], ['cross', 'hook', 'low'], ['jab', 'cross', 'knee'], ['teep', 'cross', 'switch'], ['check', 'cross', 'hook', 'low'], ['jab', 'cross', 'elbow'], ['hook', 'elbow', 'knee'], ['jab', 'llow', 'cross', 'middle'], ['teep', 'teep', 'cross', 'high'], ['jab', 'cross', 'switch', 'cross'], ['feint', 'high'], ['calf', 'cross', 'hook', 'low']],
  mma: [['jab', 'cross', 'level', 'double'], ['jab', 'cross', 'low'], ['jab', 'double'], ['sprawl', 'cross', 'hook'], ['cross', 'hook', 'single'], ['jab', 'cross', 'hook', 'sprawl'], ['calf', 'jab', 'cross'], ['overhand', 'double'], ['feint', 'level', 'cross', 'hook'], ['jab', 'cross', 'knee', 'sprawl'], ['teep', 'cross', 'level', 'double']],
};

export const LEVELS = [
  { id: 1, name: 'Débutant', len: [2, 3], every: 5, desc: 'Poings de base, teep et low kick. 2–3 coups.' },
  { id: 2, name: 'Intermédiaire', len: [3, 4], every: 4, desc: 'Crochets, uppercuts, middle, genou, défenses. 3–4 coups.' },
  { id: 3, name: 'Avancé', len: [3, 5], every: 3, desc: 'Coudes, switch, high kick, feintes. 3–5 coups.' },
  { id: 4, name: 'Pro', len: [4, 6], every: 2.4, desc: 'Tout le répertoire, rythme élevé. 4–6 coups.' },
];
export const STYLES = { boxe: 'Boxe anglaise', muay: 'Muay thaï', mma: 'MMA' };

const rand = a => a[Math.floor(Math.random() * a.length)];
const BOXE_DEF = ['slip', 'roll', 'block', 'pivot', 'back', 'feint'];
const allowed = (style, lvl) => Object.keys(S).filter(k => {
  const s = S[k];
  if (s.lvl > lvl || (s.mma && style !== 'mma')) return false;
  if (style === 'boxe') return s.kind === 'p' ? !s.mt : BOXE_DEF.includes(k);
  return true;
});

/** Génère un combo : liste d'identifiants de coups */
export function makeCombo(style = 'muay', lvl = 2) {
  const L = LEVELS[lvl - 1];
  const pool = allowed(style, lvl);
  const classics = CLASSICS[style].filter(c => c.every(k => pool.includes(k)) && c.length <= L.len[1] + 1);
  if (classics.length && Math.random() < 0.45) return rand(classics);
  const len = L.len[0] + Math.floor(Math.random() * (L.len[1] - L.len[0] + 1));
  const punches = pool.filter(k => S[k].kind === 'p');
  const finishers = pool.filter(k => ['k', 'n', 'e', 'g'].includes(S[k].kind));
  const defenses = pool.filter(k => S[k].kind === 'd');
  const ONCE = ['superman', 'overhand', 'feint', 'level', 'sknee', 'uelbow'];
  // Évite de répéter le même coup (sauf le jab) et les coups spéciaux plus d'une fois
  const ok = (k, out) => (k === 'jab' || k !== out.at(-1)) && !(ONCE.includes(k) && out.includes(k));
  const pick = (list, out) => { const l = list.filter(k => ok(k, out)); return rand(l.length ? l : list); };
  const out = [pick(Math.random() < 0.6 ? ['jab', 'cross'].filter(k => pool.includes(k)) : punches, [])];
  while (out.length < len) {
    const last = S[out.at(-1)];
    const isLast = out.length === len - 1;
    if (isLast && finishers.length && Math.random() < (style === 'boxe' ? 0 : 0.7)) {
      // finir par une frappe du côté opposé au dernier coup
      const opp = finishers.filter(k => !last.side || S[k].side !== last.side || S[k].kind === 'g');
      out.push(pick(opp.length ? opp : finishers, out));
    } else if (defenses.length && lvl >= 2 && Math.random() < 0.15 && last.kind !== 'd') {
      out.push(pick(defenses, out));
    } else {
      const alt = punches.filter(k => S[k].side && S[k].side !== last.side);
      out.push(pick(alt.length && Math.random() < 0.85 ? alt : punches, out));
    }
  }
  if (S[out.at(-1)].kind === 'd' && out.length > 1) out[out.length - 1] = rand(punches);
  return out;
}
export const comboText = c => c.map(k => S[k].n).join(', ');
export const comboNums = c => c.every(k => S[k].num) ? c.map(k => S[k].num).join(' – ') : '';
export function sayCombo(c, useNums = false, rate = 1.15) {
  const nums = comboNums(c);
  speak(useNums && nums ? nums.replace(/ – /g, ', ') : comboText(c), { rate });
}

// ---------- Rubrique ----------
let root, timer = null, endAt = 0, running = false, count = 0, nextAt = 0, raf = 0;
const cfg = () => store.get('combos', { style: 'muay', lvl: 2, every: 4, nums: false, minutes: 3, voice: true });
const setCfg = patch => store.set('combos', { ...cfg(), ...patch });

function render(el) {
  root = el;
  const c = cfg();
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Combat</div><h1>Combos shadow</h1><p>L'appli annonce des enchaînements à voix haute : tu enchaînes au sac ou dans le vide. Choisis ta discipline et ton niveau.</p></div>
    </div>
    <div class="card combo-stage" data-stage>
      <div class="muted small" data-status>Prêt ? Monte le son 🔊</div>
      <div class="current" data-current>Jab, cross, low kick</div>
      <div class="nums" data-nums></div>
      <div class="row" style="justify-content:center">
        <button class="btn btn-primary btn-lg" data-start>${icon('play')} Lancer</button>
        <button class="btn btn-lg" data-one>${icon('refresh')} Un combo</button>
      </div>
      <div class="combo-bar" data-bar style="width:0"></div>
    </div>
    <div class="grid g2 mt">
      <div class="card stack">
        <h2>Réglages</h2>
        <div><div class="small muted mb" style="margin-bottom:8px">Discipline</div><div class="seg" data-style>${Object.entries(STYLES).map(([k, v]) => `<button data-v="${k}">${v}</button>`).join('')}</div></div>
        <div><div class="small muted" style="margin-bottom:8px">Niveau</div><div class="seg" data-lvl>${LEVELS.map(l => `<button data-v="${l.id}">${l.name}</button>`).join('')}</div><p class="small muted" data-lvl-desc style="margin:8px 0 0"></p></div>
        <label class="field"><span>Un combo toutes les <b data-every-v></b></span><input type="range" min="1.5" max="10" step="0.5" data-every></label>
        <label class="field"><span>Durée de la session : <b data-min-v></b></span><input type="range" min="1" max="15" step="1" data-min></label>
        <label class="check"><input type="checkbox" data-nums-opt> Annoncer en numéros (1 = jab, 2 = cross, 3 = crochet…) quand c'est possible</label>
        ${canSpeak() ? '' : '<div class="callout y"><span class="ico">🔇</span>La synthèse vocale n\'est pas disponible sur ce navigateur : les combos s\'affichent seulement à l\'écran.</div>'}
        <p class="small muted" style="margin:0">Astuce : dans le <a href="#/rounds">minuteur de rounds</a>, active « Combos pendant les rounds » pour les avoir entre les cloches.</p>
      </div>
      <div class="card">
        <h2>Le système de numéros</h2>
        <div class="strike-list">${[['1', 'Jab'], ['2', 'Cross (direct arrière)'], ['3', 'Crochet avant'], ['4', 'Crochet arrière'], ['5', 'Uppercut avant'], ['6', 'Uppercut arrière']].map(([n, t]) => `<div class="strike"><b>${n}</b>${t}</div>`).join('')}</div>
        <hr class="sep">
        <h3>Combos du jour à travailler</h3>
        <div class="list" data-daily></div>
      </div>
    </div>`;

  const sync = () => {
    const c = cfg();
    $$('[data-style] button', el).forEach(b => b.classList.toggle('on', b.dataset.v === c.style));
    $$('[data-lvl] button', el).forEach(b => b.classList.toggle('on', +b.dataset.v === c.lvl));
    $('[data-lvl-desc]', el).textContent = LEVELS[c.lvl - 1].desc;
    $('[data-every]', el).value = c.every; $('[data-every-v]', el).textContent = c.every + ' s';
    $('[data-min]', el).value = c.minutes; $('[data-min-v]', el).textContent = c.minutes + ' min';
    $('[data-nums-opt]', el).checked = c.nums;
    daily();
  };
  $$('[data-style] button', el).forEach(b => b.onclick = () => { setCfg({ style: b.dataset.v }); sync(); });
  $$('[data-lvl] button', el).forEach(b => b.onclick = () => { const l = +b.dataset.v; setCfg({ lvl: l, every: LEVELS[l - 1].every }); sync(); });
  $('[data-every]', el).oninput = e => { setCfg({ every: +e.target.value }); sync(); };
  $('[data-min]', el).oninput = e => { setCfg({ minutes: +e.target.value }); sync(); };
  $('[data-nums-opt]', el).onchange = e => setCfg({ nums: e.target.checked });
  $('[data-one]', el).onclick = () => { unlockAudio(); announce(); };
  $('[data-start]', el).onclick = () => running ? stop() : start();
  sync();
}

// Combos du jour : les mêmes toute la journée (graine = date)
function daily() {
  const c = cfg();
  const d = new Date();
  let seed = d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate() + c.lvl * 7 + c.style.length;
  const orig = Math.random;
  Math.random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const list = [];
  for (let tries = 0; list.length < 3 && tries < 40; tries++) {
    const x = makeCombo(c.style, c.lvl);
    if (!list.some(y => y.join() === x.join())) list.push(x);
  }
  Math.random = orig;
  $('[data-daily]', root).innerHTML = list.map((x, i) => `<div class="list-item"><span class="badge y">${i + 1}</span><span>${esc(comboText(x))}</span><button class="icon-btn sm" style="margin-left:auto" data-say="${i}" aria-label="Écouter">${icon('volume')}</button></div>`).join('');
  $$('[data-say]', root).forEach(b => b.onclick = () => { unlockAudio(); show(list[+b.dataset.say]); sayCombo(list[+b.dataset.say], cfg().nums); });
}

function show(combo) {
  const cur = $('[data-current]', root);
  cur.innerHTML = combo.map((k, i) => `<span style="animation-delay:${i * 0.08}s">${esc(S[k].n)}</span>`).join('<span class="sepa">·</span>');
  $('[data-nums]', root).textContent = cfg().nums ? comboNums(combo) : '';
}
function announce() {
  const c = cfg();
  const combo = makeCombo(c.style, c.lvl);
  show(combo);
  sayCombo(combo, c.nums);
  count++;
}

function start() {
  unlockAudio();
  const c = cfg();
  running = true; count = 0;
  keepAwake(true);
  bell(1);
  endAt = Date.now() + c.minutes * 60000;
  nextAt = Date.now() + 1800;
  $('[data-start]', root).innerHTML = `${icon('pause')} Stop`;
  const tick = () => {
    if (!running) return;
    const now = Date.now();
    const left = (endAt - now) / 1000;
    $('[data-status]', root).textContent = `${mmss(left)} restantes · ${count} combos`;
    if (now >= nextAt) { announce(); nextAt = now + cfg().every * 1000; }
    const span = cfg().every * 1000;
    $('[data-bar]', root).style.width = `${Math.max(0, Math.min(100, 100 * (1 - (nextAt - now) / span)))}%`;
    if (left <= 0) { bell(3); speak('Terminé, bravo !'); stop(true); return; }
  };
  timer = setInterval(tick, 200);
  tick();
}
function stop(done = false) {
  running = false;
  clearInterval(timer);
  keepAwake(false);
  if (!done) window.speechSynthesis?.cancel();
  $('[data-start]', root).innerHTML = `${icon('play')} Lancer`;
  $('[data-status]', root).textContent = done ? `Session terminée : ${count} combos 💪` : 'En pause';
  $('[data-bar]', root).style.width = '0';
  if (done && count) toast(`${count} combos enchaînés !`);
}

export default { render };
