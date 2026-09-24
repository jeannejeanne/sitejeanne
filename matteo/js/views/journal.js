// Journal d'entraînement : séances, ressentis, progrès + charge d'entraînement (durée × RPE).
import { store, h, esc, uid, modal, toast, confirmBox, ymd, parseYmd, today, addDays, startOfWeek, fmt, $, $$, emit, round1 } from '../core.js';
import { icon } from '../icons.js';
import { barChart } from '../chart.js';

export const TYPES = {
  muay: { label: 'Muay thaï', em: '🥊' },
  mma: { label: 'MMA', em: '🤼' },
  boxe: { label: 'Boxe', em: '🥊' },
  sac: { label: 'Sac / shadow', em: '💥' },
  sparring: { label: 'Sparring', em: '⚔️' },
  muscu: { label: 'Muscu / prépa', em: '🏋️' },
  cardio: { label: 'Course / cardio', em: '🏃' },
  surf: { label: 'Surf', em: '🏄' },
  mobilite: { label: 'Mobilité / récup', em: '🧘' },
};
const MOODS = ['😫', '😕', '😐', '🙂', '🔥'];

export const getEntries = () => store.get('journal', []);
const save = l => { store.set('journal', l); emit('journal'); };

// Charge = minutes × RPE (méthode de Foster)
const load = e => (+e.duration || 0) * (+e.rpe || 5);

export function stats() {
  const list = getEntries();
  const t = today();
  const since = n => ymd(addDays(parseYmd(t), -n + 1));
  const inRange = (a) => list.filter(e => e.date >= a && e.date <= t);
  const acute = inRange(since(7)).reduce((s, e) => s + load(e), 0);
  const chronic = inRange(since(28)).reduce((s, e) => s + load(e), 0) / 4;
  // série : jours consécutifs avec au moins une séance (un jour de repos toléré)
  const days = new Set(list.map(e => e.date));
  let streak = 0, d = parseYmd(t), rest = 0;
  if (!days.has(t)) d = addDays(d, -1);
  while (true) {
    if (days.has(ymd(d))) { streak++; rest = 0; }
    else if (++rest > 1) break;
    d = addDays(d, -1);
    if (streak > 365) break;
  }
  const ws = ymd(startOfWeek(new Date()));
  const week = list.filter(e => e.date >= ws);
  return {
    total: list.length, streak,
    weekCount: week.length, weekMin: week.reduce((s, e) => s + (+e.duration || 0), 0),
    acute, chronic, acwr: chronic > 0 ? acute / chronic : null,
    last: [...list].sort((a, b) => b.date.localeCompare(a.date))[0],
  };
}

let root, filter = 'all';

function render(el) {
  root = el;
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Combat</div><h1>Journal d'entraînement</h1><p>Ce que tu as travaillé, tes sensations, tes progrès. Et un œil sur ta charge pour éviter la blessure.</p></div>
      <button class="btn btn-primary" data-new>${icon('plus')} Nouvelle séance</button>
    </div>
    <div class="grid g4" data-stats></div>
    <div class="grid g2 mt">
      <div class="card"><div class="card-head"><h2>Charge par semaine</h2><span class="tiny muted">minutes × intensité (RPE)</span></div><div data-chart></div></div>
      <div class="card" data-acwr></div>
    </div>
    <div class="card mt">
      <div class="card-head"><h2>Séances</h2><div class="chips" data-filter></div></div>
      <div class="stack" data-list></div>
    </div>`;
  $('[data-new]', el).onclick = () => addEntry();
  draw();
}

function draw() {
  if (!root) return;
  const s = stats();
  $('[data-stats]', root).innerHTML = `
    <div class="card stat"><div class="label">Cette semaine</div><div class="value">${s.weekCount} <small>séances</small></div><div class="sub">${Math.floor(s.weekMin / 60)}h${String(s.weekMin % 60).padStart(2, '0')} d'entraînement</div></div>
    <div class="card stat"><div class="label">Série</div><div class="value">${s.streak} <small>jours</small></div><div class="sub">1 jour de repos toléré</div></div>
    <div class="card stat"><div class="label">Charge 7 j</div><div class="value">${Math.round(s.acute)}</div><div class="sub">UA (unités arbitraires)</div></div>
    <div class="card stat"><div class="label">Total</div><div class="value">${s.total} <small>séances</small></div><div class="sub">${s.last ? 'Dernière : ' + fmt(s.last.date, { day: 'numeric', month: 'short' }) : 'Aucune pour l\'instant'}</div></div>`;

  // Graphique des 8 dernières semaines
  const list = getEntries();
  const ws = startOfWeek(new Date());
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const a = addDays(ws, -7 * (7 - i)), b = addDays(a, 6);
    const v = list.filter(e => e.date >= ymd(a) && e.date <= ymd(b)).reduce((x, e) => x + load(e), 0);
    return { label: fmt(a, { day: 'numeric', month: 'short' }), value: v, color: i === 7 ? 'var(--yellow)' : 'var(--blue)', tip: `Semaine du ${fmt(a, { day: 'numeric', month: 'short' })}<br><b>${Math.round(v)} UA</b>` };
  });
  barChart($('[data-chart]', root), { data: weeks, yFormat: v => Math.round(v) });

  // Ratio aigu / chronique
  const acwr = $('[data-acwr]', root);
  if (s.acwr == null) {
    acwr.innerHTML = `<h2>Ratio de charge</h2><p class="muted">Note tes séances pendant 2–3 semaines (avec la durée et l'intensité) et tu verras ici si tu en fais trop, trop vite.</p>`;
  } else {
    const r = s.acwr;
    const pos = Math.min(100, r / 2 * 100);
    const [cls, txt] = r < 0.8 ? ['b', 'Charge en baisse : tu peux remettre un peu d\'intensité si tu te sens frais.'] : r <= 1.3 ? ['g', 'Zone idéale : tu progresses sans t\'exposer. Continue comme ça.'] : r <= 1.5 ? ['o', 'Ça monte vite. Garde un œil sur la fatigue et soigne le sommeil.'] : ['r', 'Pic de charge : risque de blessure plus élevé. Allège 2–3 jours (technique, mobilité).'];
    acwr.innerHTML = `<div class="card-head"><h2>Ratio de charge</h2><span class="badge ${cls === 'g' ? 'g' : cls === 'o' ? 'o' : cls === 'r' ? 'r' : ''}">${round1(r)}</span></div>
      <div class="acwr"><span class="tiny muted">0</span><div class="meter"><i style="left:${pos}%"></i></div><span class="tiny muted">2</span></div>
      <p class="small" style="margin:14px 0 6px">${txt}</p>
      <p class="tiny muted" style="margin:0">Charge des 7 derniers jours ÷ moyenne hebdo des 28 derniers jours (ACWR). Zone cible : 0,8 – 1,3.</p>`;
  }

  // Filtres
  const used = [...new Set(list.map(e => e.type))];
  $('[data-filter]', root).innerHTML = [['all', 'Tout'], ...used.map(t => [t, TYPES[t]?.label || t])].map(([k, v]) => `<button class="chip ${filter === k ? 'on' : ''}" data-f="${k}">${esc(v)}</button>`).join('');
  $$('[data-f]', root).forEach(b => b.onclick = () => { filter = b.dataset.f; draw(); });

  const shown = list.filter(e => filter === 'all' || e.type === filter).sort((a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0));
  const box = $('[data-list]', root);
  if (!shown.length) {
    box.innerHTML = `<div class="empty"><div class="big">📓</div>Aucune séance notée. Après ton prochain entraînement, prends 1 minute pour écrire ce que tu as bossé.</div>`;
    return;
  }
  box.innerHTML = shown.map(e => {
    const t = TYPES[e.type] || { label: e.type, em: '🏅' };
    const d = parseYmd(e.date);
    return `<div class="card entry" style="box-shadow:none">
      <div class="date"><b>${d.getDate()}</b><span>${fmt(d, { month: 'short' })}</span></div>
      <div>
        <h3>${t.em} ${esc(t.label)} ${e.duration ? `<span class="badge">${e.duration} min</span>` : ''} ${e.rpe ? `<span class="badge y">RPE ${e.rpe}</span>` : ''} ${e.mood != null ? `<span>${MOODS[e.mood]}</span>` : ''}</h3>
        ${e.worked ? `<p><b>Travaillé :</b> ${esc(e.worked)}</p>` : ''}
        ${e.feelings ? `<p><b>Ressenti :</b> ${esc(e.feelings)}</p>` : ''}
        ${e.progress ? `<p><b>Progrès / à retravailler :</b> ${esc(e.progress)}</p>` : ''}
      </div>
      <div class="row actions"><button class="icon-btn sm" data-edit="${e.id}" aria-label="Modifier">${icon('edit')}</button><button class="icon-btn sm" data-del="${e.id}" aria-label="Supprimer">${icon('trash')}</button></div>
    </div>`;
  }).join('');
  $$('[data-edit]', box).forEach(b => b.onclick = () => addEntry(getEntries().find(x => x.id === b.dataset.edit)));
  $$('[data-del]', box).forEach(b => b.onclick = async () => {
    if (!(await confirmBox('Supprimer cette séance ?'))) return;
    save(getEntries().filter(x => x.id !== b.dataset.del));
    draw();
  });
}

/** Ouvre le formulaire (nouvelle séance, ou édition si prefill.id existe) */
export function addEntry(prefill = {}) {
  const e = { date: today(), type: 'muay', duration: 60, rpe: 6, mood: 3, ...prefill };
  const isNew = !e.id;
  const form = h(`<form class="stack">
    <div class="grid g2">
      <label class="field">Type<select class="input" name="type">${Object.entries(TYPES).map(([k, t]) => `<option value="${k}" ${e.type === k ? 'selected' : ''}>${t.em} ${t.label}</option>`).join('')}</select></label>
      <label class="field">Date<input class="input" type="date" name="date" value="${esc(e.date)}" required></label>
    </div>
    <label class="field">Durée (minutes)<input class="input" type="number" name="duration" min="1" max="600" value="${esc(e.duration)}"></label>
    <div class="field">Intensité ressentie (RPE : 1 = très facile, 10 = à fond)<div class="rpe-pick" data-rpe>${Array.from({ length: 10 }, (_, i) => `<button type="button" data-v="${i + 1}">${i + 1}</button>`).join('')}</div></div>
    <div class="field">Forme du jour<div class="mood-pick" data-mood>${MOODS.map((m, i) => `<button type="button" data-v="${i}">${m}</button>`).join('')}</div></div>
    <label class="field">Ce que tu as travaillé<textarea class="input" name="worked" rows="2" placeholder="Ex. clinch, genoux, défense sur low kick, 5 rounds de sparring léger">${esc(e.worked || '')}</textarea></label>
    <label class="field">Ressentis<textarea class="input" name="feelings" rows="2" placeholder="Ex. bon cardio, épaule droite un peu raide">${esc(e.feelings || '')}</textarea></label>
    <label class="field">Progrès / à retravailler<textarea class="input" name="progress" rows="2" placeholder="Ex. je garde mieux la garde après le middle ; retravailler le check">${esc(e.progress || '')}</textarea></label>
    <div class="modal-foot"><button type="button" class="btn" data-close>Annuler</button><button class="btn btn-primary">${isNew ? 'Enregistrer' : 'Mettre à jour'}</button></div>
  </form>`);
  let rpe = e.rpe, mood = e.mood;
  const sync = () => {
    $$('[data-rpe] button', form).forEach(b => b.classList.toggle('on', +b.dataset.v === rpe));
    $$('[data-mood] button', form).forEach(b => b.classList.toggle('on', +b.dataset.v === mood));
  };
  $$('[data-rpe] button', form).forEach(b => b.onclick = () => { rpe = +b.dataset.v; sync(); });
  $$('[data-mood] button', form).forEach(b => b.onclick = () => { mood = +b.dataset.v; sync(); });
  sync();
  const m = modal({ title: isNew ? 'Nouvelle séance' : 'Modifier la séance', body: form });
  form.onsubmit = ev => {
    ev.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const item = { ...e, ...data, duration: +data.duration || 0, rpe, mood, id: e.id || uid(), created: e.created || Date.now() };
    const list = getEntries();
    if (isNew) list.push(item); else list.splice(list.findIndex(x => x.id === item.id), 1, item);
    save(list);
    m.close();
    toast(isNew ? 'Séance enregistrée 💪' : 'Séance modifiée');
    draw();
  };
}

export default { render, onShow: draw };
