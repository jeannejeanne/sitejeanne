// Suivi du poids : courbe, moyenne lissée, objectif, besoins caloriques et conseils adaptés.
import { store, h, esc, modal, toast, confirmBox, today, parseYmd, fmt, round1, age, daysBetween, addDays, ymd, $, $$, go } from '../core.js';
import { icon } from '../icons.js';
import { lineChart } from '../chart.js';

const ACTIVITY = [
  { f: 1.4, label: 'Peu actif (1–2 séances / sem.)' },
  { f: 1.55, label: 'Actif (3–4 séances / sem.)' },
  { f: 1.725, label: 'Très actif (5–6 séances / sem.)' },
  { f: 1.9, label: 'Athlète (2 séances / jour)' },
];
// Catégories de poids (MMA pro, règles unifiées)
const CLASSES = [[56.7, 'Mouche'], [61.2, 'Coq'], [65.8, 'Plume'], [70.3, 'Léger'], [77.1, 'Mi-moyen'], [83.9, 'Moyen'], [93, 'Mi-lourd'], [120.2, 'Lourd']];

const profile = () => ({ height: 178, goal: null, goalDate: '', activity: 2, ...store.get('weightProfile', {}) });
const entries = () => store.get('weights', []).sort((a, b) => a.date.localeCompare(b.date));

function analysis() {
  const list = entries();
  const p = profile();
  if (!list.length) return { list, p };
  const last = list.at(-1);
  // Moyenne des 7 derniers jours enregistrés (lisse l'eau, le sel, etc.)
  const avg = (end, days) => { const from = ymd(addDays(parseYmd(end), -days + 1)); const w = list.filter(e => e.date >= from && e.date <= end); return w.length ? w.reduce((s, e) => s + e.kg, 0) / w.length : null; };
  const current = avg(last.date, 7);
  // Tendance : régression linéaire sur 28 jours → kg / semaine
  const from28 = ymd(addDays(parseYmd(last.date), -27));
  const pts = list.filter(e => e.date >= from28);
  let rate = null;
  if (pts.length >= 4 && daysBetween(pts[0].date, last.date) >= 7) {
    const xs = pts.map(e => daysBetween(pts[0].date, e.date)), ys = pts.map(e => e.kg);
    const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
    const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
    rate = slope * 7;
  }
  const w = current;
  const hM = p.height / 100;
  const bmi = w / (hM * hM);
  // Mifflin-St Jeor (homme)
  const bmr = 10 * w + 6.25 * p.height - 5 * age() + 5;
  const tdee = bmr * ACTIVITY[p.activity].f;
  const diff = p.goal ? p.goal - w : 0;
  const mode = !p.goal || Math.abs(diff) < 0.5 ? 'maintien' : diff < 0 ? 'perte' : 'prise';
  let target = tdee, protein, fat;
  let weeklyTarget = 0;
  if (mode === 'perte') {
    weeklyTarget = -Math.min(0.0075 * w, Math.max(0.3, 0.005 * w)); // ~0,5 à 0,75 % du poids / semaine
    if (p.goalDate) { const weeks = Math.max(1, daysBetween(today(), p.goalDate) / 7); weeklyTarget = Math.max(-0.01 * w, Math.min(-0.2, diff / weeks)); }
    target = tdee + weeklyTarget * 7700 / 7;
    protein = 2.2 * w; fat = 0.8 * w;
  } else if (mode === 'prise') {
    weeklyTarget = 0.0035 * w; // prise sèche ~0,25–0,5 % / semaine
    if (p.goalDate) { const weeks = Math.max(1, daysBetween(today(), p.goalDate) / 7); weeklyTarget = Math.min(0.006 * w, Math.max(0.1, diff / weeks)); }
    target = tdee + weeklyTarget * 7700 / 7;
    protein = 1.8 * w; fat = 1 * w;
  } else { protein = 1.8 * w; fat = 0.9 * w; }
  target = Math.max(bmr * 1.1, target);
  const carbs = Math.max(0, (target - protein * 4 - fat * 9) / 4);
  const eta = p.goal && rate && Math.sign(rate) === Math.sign(diff) && Math.abs(rate) > 0.05 ? Math.ceil(Math.abs(diff / rate) * 7) : null;
  const wc = CLASSES.find(([lim]) => (p.goal || w) <= lim);
  return { list, p, last, current, rate, bmi, bmr, tdee, mode, target, protein, fat, carbs, weeklyTarget, diff, eta, wc, water: 35 * w / 1000 };
}

function advice(a) {
  const tips = [];
  const w = a.current;
  if (a.mode === 'perte') {
    tips.push(['🎯', `Vise environ <b>${round1(Math.abs(a.weeklyTarget))} kg par semaine</b> : assez pour avancer, sans perdre de muscle ni de perf à l'entraînement.`]);
    if (a.rate != null && a.rate < -0.01 * w) tips.push(['⚠️', `Tu perds <b>${round1(-a.rate)} kg/sem.</b>, c'est plus de 1 % de ton poids : risque de fonte musculaire et de baisse d'énergie. Remonte un peu les glucides autour des séances.`, 'r']);
    else if (a.rate != null && a.rate > -0.1 && a.list.length > 10) tips.push(['🧊', 'Plateau : la courbe ne bouge plus depuis quelques semaines. Retire ~150 kcal/jour (une portion de féculents ou une collation) ou ajoute 1 séance de cardio léger.', 'y']);
    tips.push(['🥩', `Garde les protéines hautes (<b>${Math.round(a.protein)} g/jour</b>) : c'est ce qui protège tes muscles pendant une sèche.`]);
    tips.push(['🍚', 'Place tes glucides avant et après l\'entraînement : tu gardes la puissance au sac et tu récupères mieux.']);
    tips.push(['🥊', "Pesée pour un combat : ne perds jamais plus de 3–5 % par déshydratation, et seulement encadré. L'essentiel doit venir de l'alimentation, sur plusieurs semaines."]);
  } else if (a.mode === 'prise') {
    tips.push(['🎯', `Vise <b>+${round1(a.weeklyTarget)} kg par semaine</b> maximum : au-delà, c'est surtout du gras.`]);
    if (a.rate != null && a.rate > 0.006 * w) tips.push(['⚠️', `Tu prends <b>${round1(a.rate)} kg/sem.</b> : un peu vite. Retire ~150 kcal/jour.`, 'y']);
    else if (a.rate != null && a.rate < 0.05 && a.list.length > 10) tips.push(['📈', 'La balance ne monte pas : ajoute ~200 kcal/jour (un gainer maison, une poignée d\'oléagineux, une portion de riz en plus).', 'y']);
    tips.push(['🍽️', 'Mange 4 à 5 fois par jour, avec une source de protéines à chaque repas. Les recettes « prise de masse » sont faites pour ça.']);
    tips.push(['🏋️', 'Sans un minimum de muscu lourde (2 séances / sem.), les calories en plus iront surtout en gras.']);
  } else {
    tips.push(['⚖️', 'Objectif maintien : mange à ta dépense, garde tes protéines et surveille la tendance plutôt que le chiffre du jour.']);
  }
  tips.push(['💧', `Bois environ <b>${round1(a.water)} L d'eau par jour</b>, +0,5 à 1 L par heure d'entraînement.`]);
  tips.push(['📏', 'Pèse-toi le matin, à jeun, après être passé aux toilettes. Le poids varie de ±1 kg d\'un jour à l\'autre : regarde la moyenne sur 7 jours.']);
  tips.push(['😴', 'Vise 7 à 9 h de sommeil : le manque de sommeil augmente la faim et ralentit la récupération.']);
  return tips;
}

let root;

function render(el) {
  root = el;
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Forme</div><h1>Suivi du poids</h1><p>Note ton poids, fixe un objectif : l'appli calcule tes besoins et te donne des conseils adaptés.</p></div>
      <div class="row"><button class="btn" data-profile>${icon('target')} Objectif & profil</button><button class="btn btn-primary" data-add>${icon('plus')} Pesée</button></div>
    </div>
    <div data-body></div>`;
  $('[data-add]', el).onclick = addWeight;
  $('[data-profile]', el).onclick = editProfile;
  draw();
}

function draw() {
  if (!root) return;
  const a = analysis();
  const body = $('[data-body]', root);
  if (!a.list.length) {
    body.innerHTML = `<div class="card empty"><div class="big">⚖️</div><h2>Première pesée</h2><p>Commence par noter ton poids du jour et ton objectif.</p><div class="row" style="justify-content:center"><button class="btn btn-primary" data-first>${icon('plus')} Ajouter mon poids</button><button class="btn" data-goal>${icon('target')} Définir l'objectif</button></div></div>`;
    $('[data-first]', body).onclick = addWeight;
    $('[data-goal]', body).onclick = editProfile;
    return;
  }
  const p = a.p;
  const progress = p.goal && p.start ? Math.max(0, Math.min(100, (p.start - a.current) / (p.start - p.goal) * 100)) : null;
  const modeLabel = { perte: 'Perte de poids', prise: 'Prise de masse', maintien: 'Maintien' }[a.mode];
  body.innerHTML = `
    <div class="grid g4">
      <div class="card stat"><div class="label">Poids (moy. 7 j)</div><div class="value">${round1(a.current)} <small>kg</small></div><div class="sub">Dernière pesée : ${a.last.kg} kg · ${fmt(a.last.date, { day: 'numeric', month: 'short' })}</div></div>
      <div class="card stat"><div class="label">Tendance</div><div class="value">${a.rate == null ? '—' : (a.rate > 0 ? '+' : '') + round1(a.rate)} <small>kg/sem.</small></div><div class="sub">${a.rate == null ? 'Il faut 1 semaine de données' : 'sur les 4 dernières semaines'}</div></div>
      <div class="card stat"><div class="label">Objectif</div><div class="value">${p.goal ? p.goal + ' <small>kg</small>' : '—'}</div><div class="sub">${p.goal ? `${a.diff > 0 ? '+' : ''}${round1(a.diff)} kg · ${a.eta ? '≈ ' + fmt(addDays(new Date(), a.eta), { day: 'numeric', month: 'short' }) : modeLabel}` : '<a href="#" data-goal>Définir un objectif</a>'}</div></div>
      <div class="card stat"><div class="label">IMC</div><div class="value">${round1(a.bmi)}</div><div class="sub">${a.wc ? `Catégorie MMA : ${a.wc[1]} (≤ ${a.wc[0]} kg)` : ''}</div></div>
    </div>
    ${progress != null ? `<div class="card mt"><div class="row between small"><span>Départ ${p.start} kg</span><b>${Math.round(progress)} % du chemin</b><span>Objectif ${p.goal} kg</span></div><div class="progress mt"><div style="width:${progress}%"></div></div></div>` : ''}
    <div class="grid g-wl mt">
      <div class="card"><div class="card-head"><h2>Évolution</h2><div class="seg" data-range><button data-r="30">1 mois</button><button data-r="90">3 mois</button><button data-r="365">1 an</button></div></div><div data-chart></div></div>
      <div class="card">
        <div class="card-head"><h2>Tes besoins</h2><span class="badge y">${modeLabel}</span></div>
        <div class="macros" style="margin-top:0"><div><b>${Math.round(a.target / 10) * 10}</b><span>kcal / jour</span></div><div><b>${Math.round(a.protein)} g</b><span>protéines</span></div><div><b>${Math.round(a.carbs)} g</b><span>glucides</span></div><div><b>${Math.round(a.fat)} g</b><span>lipides</span></div></div>
        <p class="tiny muted">Dépense estimée : ${Math.round(a.tdee)} kcal (métabolisme de base ${Math.round(a.bmr)} kcal × activité). Ce sont des repères : ajuste selon la tendance de ta courbe au bout de 2 semaines.</p>
        <button class="btn btn-sm" data-ask>${icon('sparkles')} Demander un plan repas à l'IA</button>
      </div>
    </div>
    <div class="grid g-wl mt">
      <div class="card"><h2>Conseils pour toi</h2><div class="stack">${advice(a).map(([ico, t, c]) => `<div class="callout ${c || ''}"><span class="ico">${ico}</span><div>${t}</div></div>`).join('')}</div></div>
      <div class="card"><h2>Historique</h2><div class="list" data-hist style="max-height:420px;overflow-y:auto"></div></div>
    </div>`;
  let range = store.get('weightRange', 90);
  const drawChart = () => {
    $$('[data-r]', body).forEach(b => b.classList.toggle('on', +b.dataset.r === range));
    const from = ymd(addDays(new Date(), -range));
    const pts = a.list.filter(e => e.date >= from);
    const x = d => parseYmd(d).getTime() / 86400000;
    const smooth = pts.map(e => { const f = ymd(addDays(parseYmd(e.date), -6)); const w = a.list.filter(z => z.date >= f && z.date <= e.date); return { x: x(e.date), y: w.reduce((s, z) => s + z.kg, 0) / w.length, label: fmt(e.date, { day: 'numeric', month: 'short' }) }; });
    lineChart($('[data-chart]', body), {
      series: [
        { name: 'Moyenne 7 jours', color: 'var(--yellow)', width: 2.5, points: smooth },
        { name: 'Pesées', color: 'var(--blue-2)', dashed: true, width: 1.5, dots: true, points: pts.map(e => ({ x: x(e.date), y: e.kg, label: fmt(e.date, { day: 'numeric', month: 'short' }) })) },
      ],
      yFormat: v => round1(v) + ' kg', hline: p.goal ? { y: p.goal, label: `Objectif ${p.goal} kg`, color: 'var(--green)' } : null, height: 260,
    });
  };
  $$('[data-r]', body).forEach(b => b.onclick = () => { range = +b.dataset.r; store.set('weightRange', range); drawChart(); });
  drawChart();
  $('[data-hist]', body).innerHTML = [...a.list].reverse().map((e, i, arr) => {
    const prev = arr[i + 1];
    const d = prev ? round1(e.kg - prev.kg) : null;
    return `<div class="list-item"><div style="flex:1"><b>${e.kg} kg</b><div class="tiny muted">${fmt(e.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div></div>${d != null ? `<span class="badge ${d > 0 ? 'o' : d < 0 ? 'g' : ''}">${d > 0 ? '+' : ''}${d}</span>` : ''}<button class="icon-btn sm" data-rm="${e.date}" aria-label="Supprimer">${icon('trash')}</button></div>`;
  }).join('');
  $$('[data-rm]', body).forEach(b => b.onclick = async () => { if (await confirmBox('Supprimer cette pesée ?')) { store.set('weights', entries().filter(e => e.date !== b.dataset.rm)); draw(); } });
  const g = $('[data-goal]', body); if (g) g.onclick = e => { e.preventDefault(); editProfile(); };
  $('[data-ask]', body).onclick = async () => {
    const { askAI } = await import('./accueil.js');
    askAI(`Fais-moi une journée type de repas pour mon objectif (${modeLabel.toLowerCase()}) : environ ${Math.round(a.target / 10) * 10} kcal, ${Math.round(a.protein)} g de protéines, ${Math.round(a.carbs)} g de glucides, ${Math.round(a.fat)} g de lipides. Je pèse ${round1(a.current)} kg${p.goal ? ` et je vise ${p.goal} kg` : ''}. Je m'entraîne en muay thaï/MMA. Des produits faciles à trouver au Portugal, budget étudiant.`);
  };
}

function addWeight() {
  const last = entries().at(-1);
  const form = h(`<form class="stack">
    <div class="grid g2">
      <label class="field">Poids (kg)<input class="input" type="number" step="0.1" min="30" max="200" name="kg" required value="${last ? last.kg : ''}" inputmode="decimal"></label>
      <label class="field">Date<input class="input" type="date" name="date" value="${today()}" required></label>
    </div>
    <div class="modal-foot"><button type="button" class="btn" data-close>Annuler</button><button class="btn btn-primary">Enregistrer</button></div>
  </form>`);
  const m = modal({ title: 'Nouvelle pesée', body: form });
  form.onsubmit = e => {
    e.preventDefault();
    const kg = round1(+form.kg.value);
    const list = entries().filter(x => x.date !== form.date.value);
    list.push({ date: form.date.value, kg });
    store.set('weights', list);
    const p = profile();
    if (p.goal && !p.start) store.set('weightProfile', { ...p, start: kg });
    m.close();
    toast('Pesée enregistrée');
    draw();
  };
}

function editProfile() {
  const p = profile();
  const form = h(`<form class="stack">
    <div class="grid g2">
      <label class="field">Taille (cm)<input class="input" type="number" name="height" min="140" max="220" value="${p.height}" required></label>
      <label class="field">Poids visé (kg)<input class="input" type="number" step="0.1" name="goal" value="${p.goal ?? ''}" placeholder="Ex. 72"></label>
    </div>
    <label class="field">Pour quand ? (facultatif)<input class="input" type="date" name="goalDate" value="${esc(p.goalDate || '')}"></label>
    <label class="field">Niveau d'activité<select class="input" name="activity">${ACTIVITY.map((a, i) => `<option value="${i}" ${p.activity === i ? 'selected' : ''}>${a.label}</option>`).join('')}</select></label>
    <p class="tiny muted" style="margin:0">Âge (${age()} ans) calculé automatiquement depuis ta date de naissance.</p>
    <div class="modal-foot"><button type="button" class="btn" data-close>Annuler</button><button class="btn btn-primary">Enregistrer</button></div>
  </form>`);
  const m = modal({ title: 'Objectif & profil', body: form });
  form.onsubmit = e => {
    e.preventDefault();
    const goal = form.goal.value ? round1(+form.goal.value) : null;
    const cur = entries().at(-1)?.kg;
    store.set('weightProfile', { ...p, height: +form.height.value, goal, goalDate: form.goalDate.value, activity: +form.activity.value, start: goal !== p.goal ? cur ?? null : p.start });
    m.close();
    draw();
  };
}

export default { render, onShow: draw };
