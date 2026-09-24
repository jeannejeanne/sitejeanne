// Récup & mobilité : check-in de forme du jour + routines guidées (minuteur + voix).
import { store, esc, $, $$, today, mmss, toast } from '../core.js';
import { icon } from '../icons.js';
import { beep, bell, speak, unlockAudio, keepAwake } from '../audio.js';

// [nom, secondes, consigne]
const ROUTINES = [
  { id: 'hanches', em: '🦵', name: 'Hanches de fighter', desc: 'Pour des kicks plus hauts et des hanches libres.', ex: [
    ['Rotations de hanches debout', 40, 'Grands cercles lents, 20 s dans chaque sens.'],
    ['Fente basse, côté gauche', 45, 'Genou arrière au sol, bassin rétroversé, pousse la hanche vers l\'avant.'],
    ['Fente basse, côté droit', 45, 'Même chose de l\'autre côté. Respire lentement.'],
    ['90/90 hanches', 60, 'Assis, les deux genoux à 90°. Bascule d\'un côté à l\'autre sans les mains.'],
    ['Pigeon, côté gauche', 60, 'Jambe avant pliée devant toi, penche le buste en avant.'],
    ['Pigeon, côté droit', 60, 'Change de côté, relâche les épaules.'],
    ['Grenouille (frog stretch)', 60, 'À quatre pattes, genoux écartés, recule doucement le bassin.'],
    ['Squat profond tenu', 45, 'Talons au sol, coudes qui poussent les genoux vers l\'extérieur.'],
  ] },
  { id: 'epaules', em: '💪', name: 'Épaules & haut du dos', desc: 'Après une séance de boxe ou de musculation.', ex: [
    ['Cercles de bras', 30, 'Petits puis grands cercles, avant puis arrière.'],
    ['Étirement pectoral au mur, gauche', 40, 'Bras à 90° contre le mur, tourne le buste à l\'opposé.'],
    ['Étirement pectoral au mur, droit', 40, 'Même chose de l\'autre côté.'],
    ['Thread the needle, gauche', 40, 'À quatre pattes, glisse le bras sous le corps, épaule au sol.'],
    ['Thread the needle, droit', 40, 'Change de côté.'],
    ['Posture de l\'enfant, bras tendus', 45, 'Fesses vers les talons, allonge les bras loin devant.'],
    ['Étirement de la nuque', 40, 'Oreille vers l\'épaule, 20 s de chaque côté, sans forcer.'],
  ] },
  { id: 'surf', em: '🏄', name: 'Après la session de surf', desc: 'Dos, épaules et hanches après la rame.', ex: [
    ['Cobra', 30, 'Allongé sur le ventre, pousse sur les mains, bassin au sol.'],
    ['Posture de l\'enfant', 45, 'Relâche tout le dos.'],
    ['Chat-vache', 40, 'Enroule puis creuse le dos lentement.'],
    ['Rotation thoracique allongé, gauche', 40, 'Sur le côté, genoux pliés, ouvre le bras vers l\'arrière.'],
    ['Rotation thoracique allongé, droit', 40, 'Change de côté.'],
    ['Étirement des fléchisseurs de hanche', 60, 'Fente basse, 30 s par côté.'],
    ['Étirement des ischios', 45, 'Jambe tendue sur un support, dos droit, penche-toi vers l\'avant.'],
  ] },
  { id: 'reveil', em: '🌅', name: 'Réveil en 5 minutes', desc: 'Pour démarrer la journée ou avant les cours.', ex: [
    ['Respiration profonde', 30, 'Inspire 4 s par le nez, expire 6 s par la bouche.'],
    ['Chat-vache', 40, 'Mobilise toute la colonne.'],
    ['World\'s greatest stretch, gauche', 45, 'Fente, main au sol, coude vers le pied puis bras vers le ciel.'],
    ['World\'s greatest stretch, droit', 45, 'Change de côté.'],
    ['Squat au poids du corps', 40, 'Lent et contrôlé, amplitude complète.'],
    ['Rotations de chevilles et poignets', 30, 'Dans les deux sens.'],
  ] },
  { id: 'calme', em: '🧘', name: 'Retour au calme après sparring', desc: 'Faire redescendre le cardio et le mental.', ex: [
    ['Marche lente et respiration', 60, 'Expire plus longtemps que tu n\'inspires.'],
    ['Étirement des mollets, gauche', 30, 'Contre un mur, talon au sol.'],
    ['Étirement des mollets, droit', 30, 'Change de côté.'],
    ['Étirement des quadriceps', 40, 'Talon vers la fesse, 20 s par côté.'],
    ['Papillon assis', 40, 'Plantes de pieds collées, genoux vers le sol.'],
    ['Allongé, respiration 4-7-8', 60, 'Inspire 4 s, bloque 7 s, expire 8 s.'],
  ] },
];

let root, run = null;

function render(el) {
  root = el;
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Combat · récupération</div><h1>Récup & mobilité</h1><p>Un check-in de 10 secondes pour savoir comment t'entraîner aujourd'hui, et des routines guidées à la voix.</p></div>
    </div>
    <div class="grid g-wl">
      <div class="card" data-check></div>
      <div class="card stack">
        <h2>Le conseil du kiné</h2>
        <div class="callout"><span class="ico">🧊</span><div>Coup ou entorse : protège, surélève, comprime les premiers jours, puis remets de la charge progressivement (PEACE & LOVE). Pas besoin de glace à outrance.</div></div>
        <div class="callout"><span class="ico">🦶</span><div>Tibias douloureux après le sac : baisse le volume de kicks quelques jours plutôt que d'arrêter complètement, et augmente progressivement.</div></div>
        <div class="callout y"><span class="ico">⚠️</span><div>Douleur qui réveille la nuit, gonflement important, perte de force ou choc à la tête avec symptômes : consulte, pas de sparring.</div></div>
      </div>
    </div>
    <h2 class="mt mb" style="margin-top:28px">Routines guidées</h2>
    <div class="decks">${ROUTINES.map(r => `<div class="card routine"><span class="em">${r.em}</span><h3 style="margin:0">${esc(r.name)}</h3><p class="small muted" style="margin:0">${esc(r.desc)}</p><div class="row"><span class="badge">${Math.round(r.ex.reduce((s, e) => s + e[1], 0) / 60)} min</span><span class="badge y">${r.ex.length} exercices</span></div><button class="btn btn-primary btn-sm" data-run="${r.id}">${icon('play')} Démarrer</button></div>`).join('')}</div>
    <div class="card player mt" data-player hidden></div>`;
  $$('[data-run]', el).forEach(b => b.onclick = () => start(b.dataset.run));
  drawCheck();
}

// ---------- Check-in ----------
const Q = [
  ['sleep', '😴 Sommeil', ['< 5 h', '5–6 h', '6–7 h', '7–8 h', '8 h +']],
  ['sore', '🦵 Courbatures', ['Très fortes', 'Fortes', 'Moyennes', 'Légères', 'Aucune']],
  ['energy', '⚡ Énergie', ['À plat', 'Bof', 'Normale', 'Bonne', 'Au top']],
  ['stress', '🧠 Stress (cours, exams…)', ['Énorme', 'Élevé', 'Moyen', 'Faible', 'Zen']],
];
function drawCheck() {
  const box = $('[data-check]', root);
  const all = store.get('readiness', {});
  const cur = all[today()] || {};
  const done = Q.every(([k]) => cur[k] != null);
  const score = done ? Math.round(Q.reduce((s, [k]) => s + cur[k], 0) / (Q.length * 4) * 100) : null;
  const [col, title, txt] = score == null ? [] : score >= 70 ? ['var(--green)', 'Feu vert 🟢', 'Tu es frais : bonne journée pour une séance intense, du sparring ou un gros travail technique.'] : score >= 45 ? ['var(--yellow)', 'Feu orange 🟠', 'Entraîne-toi, mais à intensité modérée : technique, pads, cardio léger. Pas de sparring dur.'] : ['var(--red)', 'Feu rouge 🔴', 'Ton corps demande du repos : mobilité, marche, sommeil. Une séance légère maximum.'];
  box.innerHTML = `<div class="card-head"><h2>Check-in du jour</h2>${score != null ? `<span class="readiness" style="color:${col};font-size:28px">${score}%</span>` : ''}</div>
    <div class="stack">${Q.map(([k, label, opts]) => `<div><div class="small" style="margin-bottom:6px;font-weight:600">${label}</div><div class="seg">${opts.map((o, i) => `<button data-k="${k}" data-v="${i}" class="${cur[k] === i ? 'on y' : ''}">${o}</button>`).join('')}</div></div>`).join('')}</div>
    ${score != null ? `<div class="callout mt" style="border-color:${col}"><span class="ico"></span><div><b>${title}</b><br>${txt}</div></div>` : '<p class="small muted mt" style="margin-bottom:0">Réponds aux 4 questions pour avoir ta recommandation du jour.</p>'}`;
  $$('[data-k]', box).forEach(b => b.onclick = () => {
    const a = store.get('readiness', {});
    a[today()] = { ...(a[today()] || {}), [b.dataset.k]: +b.dataset.v };
    const keys = Object.keys(a).sort().slice(-60);
    store.set('readiness', Object.fromEntries(keys.map(k => [k, a[k]])));
    drawCheck();
  });
}

// ---------- Lecteur de routine ----------
function start(id) {
  unlockAudio();
  stop();
  const r = ROUTINES.find(x => x.id === id);
  const p = $('[data-player]', root);
  p.hidden = false;
  p.scrollIntoView({ behavior: 'smooth', block: 'center' });
  run = { r, i: -1, end: 0, t: null, paused: false, left: 0 };
  keepAwake(true);
  next();
  run.t = setInterval(tick, 200);
}
function next() {
  run.i++;
  if (run.i >= run.r.ex.length) { bell(2); speak('Routine terminée. Bien joué !'); finish(); return; }
  const [name, sec, cue] = run.r.ex[run.i];
  run.end = Date.now() + sec * 1000;
  run.beeped = {};
  beep(990, 0.15);
  speak(`${name}. ${cue}`);
  draw();
}
function tick() {
  if (!run || run.paused) return;
  const left = Math.ceil((run.end - Date.now()) / 1000);
  if (left <= 3 && left >= 1 && !run.beeped[left]) { run.beeped[left] = true; beep(700, 0.08, 0.25); }
  if (left <= 0) return next();
  const t = $('[data-t]', root); if (t) t.textContent = mmss(left);
}
function draw() {
  const p = $('[data-player]', root);
  const [name, sec, cue] = run.r.ex[run.i];
  const nx = run.r.ex[run.i + 1];
  p.innerHTML = `<div class="small muted">${esc(run.r.name)} · ${run.i + 1} / ${run.r.ex.length}</div>
    <div class="ex-name">${esc(name)}</div>
    <div class="ex-time" data-t>${mmss(sec)}</div>
    <p class="cue">${esc(cue)}</p>
    <div class="progress" style="max-width:420px;margin:0 auto 16px"><div style="width:${(run.i / run.r.ex.length) * 100}%"></div></div>
    <div class="small muted">${nx ? 'Ensuite : ' + esc(nx[0]) : 'Dernier exercice'}</div>
    <div class="controls mt"><button class="icon-btn" data-stop aria-label="Arrêter">${icon('x')}</button><button class="big-play" data-pause aria-label="Pause">${icon(run.paused ? 'play' : 'pause')}</button><button class="icon-btn" data-next aria-label="Suivant">${icon('skip')}</button></div>`;
  $('[data-stop]', p).onclick = () => { stop(); p.hidden = true; };
  $('[data-next]', p).onclick = () => next();
  $('[data-pause]', p).onclick = () => {
    if (run.paused) { run.end = Date.now() + run.left; run.paused = false; }
    else { run.left = run.end - Date.now(); run.paused = true; window.speechSynthesis?.cancel(); }
    $('[data-pause]', p).innerHTML = icon(run.paused ? 'play' : 'pause');
  };
}
function finish() {
  const name = run.r.name;
  stop();
  $('[data-player]', root).innerHTML = `<div class="big" style="font-size:48px">🧘</div><h2>${esc(name)} : terminé</h2><p class="muted">Ton corps te remercie.</p>`;
  toast('Routine terminée ✓');
}
function stop() {
  if (run) clearInterval(run.t);
  run = null;
  keepAwake(false);
  window.speechSynthesis?.cancel();
}

export default { render };
