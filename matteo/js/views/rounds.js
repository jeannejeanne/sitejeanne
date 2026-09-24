// Minuteur de rounds : cloche de ring, clap des 10 dernières secondes, repos, combos annoncés en option.
import { store, esc, $, $$, toast, mmss, today, h } from '../core.js';
import { icon } from '../icons.js';
import { bell, clapper, beep, speak, unlockAudio, keepAwake } from '../audio.js';
import { makeCombo, sayCombo, comboText } from './combos.js';

const PRESETS = [
  { name: 'Classique 3/1', rounds: 5, round: 180, rest: 60 },
  { name: 'Muay thaï pro 5×3/2', rounds: 5, round: 180, rest: 120 },
  { name: 'MMA 3×5/1', rounds: 3, round: 300, rest: 60 },
  { name: 'Amateur 3×2/1', rounds: 3, round: 120, rest: 60 },
  { name: 'Sac HIIT 10×1/0:30', rounds: 10, round: 60, rest: 30 },
  { name: 'Shadow échauffement 3×2/0:30', rounds: 3, round: 120, rest: 30 },
];
const DEFAULT = { rounds: 5, round: 180, rest: 60, prep: 10, clap: true, voice: true, combos: false, comboEvery: 5 };
const cfg = () => ({ ...DEFAULT, ...store.get('rounds', {}) });
const setCfg = patch => { store.set('rounds', { ...cfg(), ...patch }); };

let root;
let phases = [], idx = 0, running = false, phaseEnd = 0, remaining = 0, tickT = null;
let flags = {}, nextCombo = 0, sessionStart = 0;

function buildPhases() {
  const c = cfg();
  const list = [];
  if (c.prep > 0) list.push({ type: 'prep', dur: c.prep });
  for (let r = 1; r <= c.rounds; r++) {
    list.push({ type: 'round', dur: c.round, n: r });
    if (r < c.rounds && c.rest > 0) list.push({ type: 'rest', dur: c.rest, n: r });
  }
  return list;
}

const PHASE_UI = {
  prep: { label: 'Prépare-toi', color: 'var(--text-2)', glow: 'rgba(160,190,255,.12)' },
  round: { label: 'Round', color: 'var(--yellow)', glow: 'rgba(255,210,63,.18)' },
  rest: { label: 'Repos', color: 'var(--blue-2)', glow: 'rgba(61,123,255,.22)' },
  done: { label: 'Terminé', color: 'var(--green)', glow: 'rgba(61,220,151,.18)' },
  idle: { label: 'Prêt', color: 'var(--yellow)', glow: 'transparent' },
};

function render(el) {
  root = el;
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Combat</div><h1>Minuteur de rounds</h1><p>Cloche au début et à la fin de chaque round, clap 10 secondes avant la fin. L'écran reste allumé.</p></div>
      <div class="row"><span class="badge y" data-stats></span></div>
    </div>
    <div class="timer-stage">
      <div class="card ring-wrap" data-stage>
        <div class="ring">
          <svg viewBox="0 0 200 200"><circle class="track" cx="100" cy="100" r="90" fill="none" stroke-width="10"/>
          <circle class="bar" data-bar cx="100" cy="100" r="90" fill="none" stroke-width="10" stroke-dasharray="${2 * Math.PI * 90}" stroke-dashoffset="0"/></svg>
          <div class="center">
            <div class="phase" data-phase>Prêt</div>
            <div class="time" data-time>3:00</div>
            <div class="rnd" data-rnd></div>
            <div class="combo-now" data-combo></div>
          </div>
        </div>
        <div class="round-dots" data-dots></div>
        <div class="controls">
          <button class="icon-btn" data-reset aria-label="Remettre à zéro">${icon('reset')}</button>
          <button class="big-play" data-play aria-label="Démarrer">${icon('play')}</button>
          <button class="icon-btn" data-skip aria-label="Passer">${icon('skip')}</button>
          <button class="icon-btn" data-full aria-label="Plein écran">${icon('expand')}</button>
        </div>
      </div>
      <div class="card stack">
        <h2>Réglages</h2>
        <div class="presets">${PRESETS.map((p, i) => `<button class="chip" data-preset="${i}">${esc(p.name)}</button>`).join('')}</div>
        ${dial('rounds', 'Rounds', 1, 20, 1, v => v)}
        ${dial('round', 'Durée du round', 30, 600, 15, mmss)}
        ${dial('rest', 'Repos', 0, 300, 15, mmss)}
        ${dial('prep', 'Préparation', 0, 60, 5, v => v + ' s')}
        <hr class="sep" style="margin:4px 0">
        <label class="check"><input type="checkbox" data-opt="clap"> Clap 10 s avant la fin du round</label>
        <label class="check"><input type="checkbox" data-opt="voice"> Voix (« Round 2 », « Repos »…)</label>
        <label class="check"><input type="checkbox" data-opt="combos"> Combos annoncés pendant les rounds</label>
        <div data-combo-opts class="stack" style="gap:6px">
          <label class="field"><span>Un combo toutes les <b data-ce-v></b></span><input type="range" min="2" max="15" step="1" data-ce></label>
          <span class="tiny muted">Discipline et niveau : ceux choisis dans <a href="#/combos">Combos shadow</a>.</span>
        </div>
        <button class="btn btn-sm btn-ghost" data-test>${icon('volume')} Tester la cloche</button>
      </div>
    </div>`;

  $$('[data-dial]', el).forEach(d => {
    const key = d.dataset.dial, min = +d.dataset.min, max = +d.dataset.max, step = +d.dataset.step;
    d.querySelector('[data-minus]').onclick = () => { setCfg({ [key]: Math.max(min, cfg()[key] - step) }); resetTimer(); };
    d.querySelector('[data-plus]').onclick = () => { setCfg({ [key]: Math.min(max, cfg()[key] + step) }); resetTimer(); };
  });
  $$('[data-preset]', el).forEach(b => b.onclick = () => { const p = PRESETS[+b.dataset.preset]; setCfg({ rounds: p.rounds, round: p.round, rest: p.rest }); resetTimer(); toast(p.name); });
  $$('[data-opt]', el).forEach(c => c.onchange = () => { setCfg({ [c.dataset.opt]: c.checked }); syncSettings(); });
  $('[data-ce]', el).oninput = e => { setCfg({ comboEvery: +e.target.value }); syncSettings(); };
  $('[data-play]', el).onclick = toggle;
  $('[data-reset]', el).onclick = resetTimer;
  $('[data-skip]', el).onclick = () => { if (idx >= 0 && idx < phases.length) nextPhase(true); };
  $('[data-full]', el).onclick = () => {
    const stage = $('[data-stage]', el);
    stage.classList.toggle('timer-full');
    if (stage.classList.contains('timer-full')) document.documentElement.requestFullscreen?.().catch(() => {});
    else if (document.fullscreenElement) document.exitFullscreen?.();
  };
  $('[data-test]', el).onclick = () => { unlockAudio(); bell(1); };
  document.addEventListener('keydown', e => {
    if (!root.classList.contains('active') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
  });
  document.addEventListener('visibilitychange', () => { if (running && document.visibilityState === 'visible') keepAwake(true); });
  resetTimer();
}

function dial(key, label, min, max, step, f) {
  return `<div class="row between" data-dial="${key}" data-min="${min}" data-max="${max}" data-step="${step}">
    <span class="small" style="color:var(--text-2);font-weight:500">${label}</span>
    <div class="round-dial"><button class="icon-btn sm" data-minus aria-label="Moins">−</button><span class="val" data-val></span><button class="icon-btn sm" data-plus aria-label="Plus">+</button></div>
  </div>`;
}

function syncSettings() {
  const c = cfg();
  const fmts = { rounds: v => v, round: mmss, rest: v => v ? mmss(v) : 'aucun', prep: v => v + ' s' };
  $$('[data-dial]', root).forEach(d => d.querySelector('[data-val]').textContent = fmts[d.dataset.dial](c[d.dataset.dial]));
  $$('[data-opt]', root).forEach(ch => ch.checked = !!c[ch.dataset.opt]);
  $('[data-combo-opts]', root).hidden = !c.combos;
  $('[data-ce]', root).value = c.comboEvery;
  $('[data-ce-v]', root).textContent = c.comboEvery + ' s';
  const hist = store.get('roundsLog', []);
  const t = today();
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const nToday = hist.filter(x => x.date === t).reduce((a, x) => a + x.rounds, 0);
  const nWeek = hist.filter(x => x.date >= weekAgo).reduce((a, x) => a + x.rounds, 0);
  $('[data-stats]', root).textContent = `🥊 ${nToday} rounds aujourd'hui · ${nWeek} cette semaine`;
}

function resetTimer() {
  stopTick();
  running = false;
  keepAwake(false);
  phases = buildPhases();
  idx = -1;
  remaining = 0;
  flags = {};
  syncSettings();
  const first = phases.find(p => p.type === 'round');
  paint('idle', first ? first.dur : 0, 1);
  $('[data-play]', root).innerHTML = icon('play');
  $('[data-combo]', root).textContent = '';
}

function toggle() {
  unlockAudio();
  if (running) {
    running = false;
    remaining = Math.max(0, phaseEnd - Date.now());
    stopTick();
    keepAwake(false);
    $('[data-play]', root).innerHTML = icon('play');
    $('[data-phase]', root).textContent = 'Pause';
    return;
  }
  running = true;
  keepAwake(true);
  $('[data-play]', root).innerHTML = icon('pause');
  if (idx === -1 || idx >= phases.length) {
    phases = buildPhases();
    idx = -1;
    sessionStart = Date.now();
    nextPhase();
  } else {
    phaseEnd = Date.now() + remaining;
    startTick();
  }
}

function nextPhase(skipped = false) {
  const prev = phases[idx];
  if (prev && prev.type === 'round' && !skipped) logRound();
  idx++;
  flags = {};
  if (idx >= phases.length) return finish();
  const p = phases[idx];
  const c = cfg();
  phaseEnd = Date.now() + p.dur * 1000;
  if (p.type === 'round') {
    bell(1);
    if (c.voice) setTimeout(() => speak(`Round ${p.n}`), 900);
    nextCombo = Date.now() + 3500;
  } else if (p.type === 'rest') {
    bell(3);
    if (c.voice) setTimeout(() => speak(p.n === c.rounds - 1 ? 'Repos. Dernier round ensuite !' : 'Repos'), 1100);
    $('[data-combo]', root).textContent = '';
  } else if (p.type === 'prep') {
    if (c.voice) speak('Prépare-toi');
  }
  if (running) startTick();
  else { remaining = p.dur * 1000; paint(p.type, p.dur, p.n || (phases[idx + 1]?.n ?? 1), p.dur); }
}

function finish() {
  stopTick();
  running = false;
  keepAwake(false);
  bell(3);
  const c = cfg();
  if (c.voice) setTimeout(() => speak('Terminé ! Bien joué.'), 1200);
  paint('done', 0, c.rounds);
  $('[data-play]', root).innerHTML = icon('play');
  $('[data-combo]', root).innerHTML = `<button class="btn btn-sm btn-primary" data-log>${icon('book')} Noter dans le journal</button>`;
  $('[data-log]', root).onclick = async () => {
    const { addEntry } = await import('./journal.js');
    const mins = Math.round((Date.now() - sessionStart) / 60000);
    addEntry({ type: 'sac', duration: Math.max(1, mins), worked: `${c.rounds} rounds de ${mmss(c.round)} (repos ${mmss(c.rest)})${c.combos ? ' avec combos annoncés' : ''}` });
  };
  idx = phases.length;
  syncSettings();
}

function logRound() {
  const log = store.get('roundsLog', []);
  const t = today();
  const e = log.find(x => x.date === t);
  if (e) e.rounds++; else log.push({ date: t, rounds: 1 });
  store.set('roundsLog', log.slice(-120));
  syncSettings();
}

function startTick() { stopTick(); tickT = setInterval(tick, 100); tick(); }
function stopTick() { clearInterval(tickT); tickT = null; }

function tick() {
  if (!running) return;
  const p = phases[idx];
  if (!p) return;
  const now = Date.now();
  const left = (phaseEnd - now) / 1000;
  const c = cfg();
  const sec = Math.ceil(left);
  if (p.type === 'round') {
    if (c.clap && p.dur > 20 && sec <= 10 && !flags.clap) { flags.clap = true; clapper(2); }
    if (c.combos && now >= nextCombo && left > 4) {
      const cc = store.get('combos', { style: 'muay', lvl: 2, nums: false });
      const combo = makeCombo(cc.style, cc.lvl);
      $('[data-combo]', root).textContent = comboText(combo);
      sayCombo(combo, cc.nums);
      nextCombo = now + c.comboEvery * 1000;
    }
  } else if (sec <= 3 && sec >= 1 && !flags['b' + sec]) {
    flags['b' + sec] = true;
    beep(sec === 1 ? 1100 : 880);
  }
  if (left <= 0) { nextPhase(); return; }
  paint(p.type, left, p.n || (phases[idx + 1]?.n ?? 1), p.dur);
}

function paint(type, left, n, dur) {
  const ui = PHASE_UI[type];
  const c = cfg();
  const stage = $('[data-stage]', root);
  stage.style.setProperty('--phase', ui.color);
  stage.style.setProperty('--phase-glow', ui.glow);
  $('[data-phase]', root).textContent = type === 'round' ? `Round ${n}` : ui.label;
  $('[data-time]', root).textContent = mmss(Math.ceil(left));
  $('[data-rnd]', root).textContent = type === 'done' ? `${c.rounds} rounds bouclés 💪` : type === 'rest' ? `Prochain : round ${n + 1} / ${c.rounds}` : `Round ${n} / ${c.rounds}`;
  const circ = 2 * Math.PI * 90;
  const frac = dur ? left / dur : 1;
  $('[data-bar]', root).style.strokeDashoffset = String(circ * (1 - frac));
  const doneRounds = type === 'done' ? c.rounds : phases.slice(0, Math.max(0, idx)).filter(p => p.type === 'round').length;
  $('[data-dots]', root).innerHTML = Array.from({ length: c.rounds }, (_, i) => `<i class="${i < doneRounds ? 'done' : (type === 'round' && i === n - 1) ? 'cur' : ''}"></i>`).join('');
}

export default { render, onShow: () => root && syncSettings() };
