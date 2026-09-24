// Calendrier : cours, sport, examens… vue semaine, mois et agenda. Import/export .ics.
import { store, h, esc, uid, modal, toast, confirmBox, ymd, parseYmd, today, addDays, startOfWeek, fmt, fmtDay, pad, $, $$ } from '../core.js';
import { icon } from '../icons.js';

export const CATS = {
  cours: { label: 'Cours / fac', color: '#3d7bff' },
  stage: { label: 'Stage clinique', color: '#23c1d6' },
  exam: { label: 'Examen', color: '#ff5c6c' },
  muay: { label: 'Muay thaï', color: '#ffd23f' },
  mma: { label: 'MMA', color: '#ff9f43' },
  muscu: { label: 'Muscu / prépa', color: '#b387ff' },
  surf: { label: 'Surf', color: '#3ddc97' },
  perso: { label: 'Perso', color: '#9aa7c7' },
};
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const H0 = 7, H1 = 23, ROW = 48;

export const getEvents = () => store.get('events', []);
const saveEvents = list => store.set('events', list);

// Toutes les occurrences entre deux dates (incluses), avec la répétition hebdomadaire
export function occurrences(from, to) {
  const out = [];
  const a = parseYmd(from), b = parseYmd(to);
  for (const ev of getEvents()) {
    const skip = new Set(ev.exceptions || []);
    if (ev.repeat === 'weekly') {
      const start = parseYmd(ev.date);
      const until = ev.until ? parseYmd(ev.until) : null;
      let d = new Date(start);
      if (d < a) { const weeks = Math.floor((a - d) / (7 * 86400000)); d = addDays(d, weeks * 7); }
      for (; d <= b; d = addDays(d, 7)) {
        if (d < a || d < start) continue;
        if (until && d > until) break;
        const ds = ymd(d);
        if (!skip.has(ds)) out.push({ ...ev, date: ds, base: ev.date });
      }
    } else if (ev.date >= from && ev.date <= to) out.push(ev);
  }
  return out.sort((x, y) => (x.date + (x.start || '')).localeCompare(y.date + (y.start || '')));
}
export const eventsOn = date => occurrences(date, date);

const minutes = t => { if (!t) return null; const [hh, mm] = t.split(':').map(Number); return hh * 60 + mm; };

let state = { mode: window.matchMedia('(max-width: 860px)').matches ? 'agenda' : 'week', cursor: new Date() };
let root;

function render(el) {
  root = el;
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Organisation</div><h1>Calendrier</h1><p>Cours, entraînements, surf, examens : tout au même endroit.</p></div>
      <div class="row">
        <label class="btn btn-sm btn-ghost" title="Importer un emploi du temps .ics">${icon('upload')} Importer .ics<input type="file" accept=".ics,text/calendar" hidden data-ics></label>
        <button class="btn btn-sm btn-ghost" data-export>${icon('download')} Exporter</button>
        <button class="btn btn-primary" data-new>${icon('plus')} Événement</button>
      </div>
    </div>
    <div class="card">
      <div class="cal-toolbar">
        <button class="icon-btn sm" data-prev aria-label="Précédent">${icon('left')}</button>
        <button class="icon-btn sm" data-next aria-label="Suivant">${icon('right')}</button>
        <button class="btn btn-sm" data-today>Aujourd'hui</button>
        <div class="period" data-period></div>
        <div class="spacer"></div>
        <div class="seg" data-modes>
          <button data-mode="week">Semaine</button><button data-mode="month">Mois</button><button data-mode="agenda">Agenda</button>
        </div>
      </div>
      <div data-body></div>
      <div class="chips mt" data-legend>${Object.values(CATS).map(c => `<span class="chip" style="cursor:default"><i class="cat-dot" style="--c:${c.color}"></i>${c.label}</span>`).join('')}</div>
    </div>`;
  $('[data-new]', el).onclick = () => editEvent({ date: ymd(state.cursor) });
  $('[data-prev]', el).onclick = () => shift(-1);
  $('[data-next]', el).onclick = () => shift(1);
  $('[data-today]', el).onclick = () => { state.cursor = new Date(); draw(); };
  $$('[data-mode]', el).forEach(b => b.onclick = () => { state.mode = b.dataset.mode; draw(); });
  $('[data-export]', el).onclick = exportIcs;
  $('[data-ics]', el).onchange = e => { const f = e.target.files[0]; if (f) importIcs(f); e.target.value = ''; };
  draw();
}

function shift(dir) {
  const c = new Date(state.cursor);
  if (state.mode === 'month') c.setMonth(c.getMonth() + dir, 1);
  else if (state.mode === 'week') c.setDate(c.getDate() + 7 * dir);
  else c.setDate(c.getDate() + 14 * dir);
  state.cursor = c;
  draw();
}

function draw() {
  if (!root) return;
  $$('[data-mode]', root).forEach(b => b.classList.toggle('on', b.dataset.mode === state.mode));
  const body = $('[data-body]', root);
  const period = $('[data-period]', root);
  if (state.mode === 'week') drawWeek(body, period);
  else if (state.mode === 'month') drawMonth(body, period);
  else drawAgenda(body, period);
}

function drawWeek(body, period) {
  const ws = startOfWeek(state.cursor);
  const we = addDays(ws, 6);
  period.textContent = `${fmt(ws, { day: 'numeric', month: 'short' })} – ${fmt(we, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const occ = occurrences(ymd(ws), ymd(we));
  const t = today();
  let head = '<div class="wh"></div>';
  let cols = `<div class="hours">${Array.from({ length: H1 - H0 }, (_, i) => `<div>${H0 + i}h</div>`).join('')}</div>`;
  for (let i = 0; i < 7; i++) {
    const d = addDays(ws, i), ds = ymd(d);
    head += `<div class="wh ${ds === t ? 'today' : ''}">${DAYS[i]}<b>${d.getDate()}</b></div>`;
    const evs = occ.filter(e => e.date === ds);
    let inner = '';
    const allDay = evs.filter(e => !e.start);
    allDay.forEach((e, k) => inner += evBlock(e, 2 + k * 26, 22));
    for (const e of evs.filter(e => e.start)) {
      const s = minutes(e.start), en = minutes(e.end) ?? s + 60;
      const top = Math.max(0, (s - H0 * 60) / 60 * ROW);
      const height = Math.max(22, (en - s) / 60 * ROW - 2);
      inner += evBlock(e, top, height);
    }
    if (ds === t) {
      const n = new Date(), m = n.getHours() * 60 + n.getMinutes();
      if (m >= H0 * 60 && m <= H1 * 60) inner += `<div class="now-line" style="top:${(m - H0 * 60) / 60 * ROW}px"></div>`;
    }
    cols += `<div class="col ${ds === t ? 'today' : ''}" data-date="${ds}" style="height:${(H1 - H0) * ROW}px">${inner}</div>`;
  }
  body.innerHTML = `<div class="week-wrap"><div class="week">${head}${cols}</div></div>`;
  bindEvents(body);
  $$('.col', body).forEach(col => col.onclick = e => {
    if (e.target.closest('.ev')) return;
    const r = col.getBoundingClientRect();
    const hour = Math.min(H1 - 1, H0 + Math.floor((e.clientY - r.top) / ROW));
    editEvent({ date: col.dataset.date, start: `${pad(hour)}:00`, end: `${pad(hour + 1)}:00` });
  });
  const wrap = $('.week-wrap', body);
  wrap.scrollTop = 0;
}

function evBlock(e, top, height) {
  const c = CATS[e.cat] || CATS.perso;
  return `<div class="ev" data-id="${e.id}" data-date="${e.date}" style="--c:${c.color};top:${top}px;height:${height}px"><b>${esc(e.title)}</b>${e.start ? `${e.start}${e.end ? '–' + e.end : ''}` : 'Journée'}${e.location ? ' · ' + esc(e.location) : ''}</div>`;
}

function drawMonth(body, period) {
  const c = state.cursor;
  const first = new Date(c.getFullYear(), c.getMonth(), 1);
  period.textContent = fmt(first, { month: 'long', year: 'numeric' });
  const gs = startOfWeek(first);
  const occ = occurrences(ymd(gs), ymd(addDays(gs, 41)));
  const t = today();
  let html = DAYS.map(d => `<div class="mh">${d}</div>`).join('');
  for (let i = 0; i < 42; i++) {
    const d = addDays(gs, i), ds = ymd(d);
    if (i === 35 && d.getMonth() !== c.getMonth()) break;
    const evs = occ.filter(e => e.date === ds);
    html += `<div class="md-cell ${d.getMonth() !== c.getMonth() ? 'out' : ''} ${ds === t ? 'today' : ''}" data-date="${ds}">
      <div class="d">${d.getDate()}</div>
      ${evs.slice(0, 3).map(e => `<span class="pill" style="--c:${(CATS[e.cat] || CATS.perso).color}">${e.start ? e.start + ' ' : ''}${esc(e.title)}</span>`).join('')}
      ${evs.length > 3 ? `<span class="tiny muted">+${evs.length - 3}</span>` : ''}
    </div>`;
  }
  body.innerHTML = `<div class="month">${html}</div>`;
  $$('.md-cell', body).forEach(cell => cell.onclick = () => {
    state.cursor = parseYmd(cell.dataset.date);
    state.mode = window.matchMedia('(max-width: 860px)').matches ? 'agenda' : 'week';
    draw();
  });
}

function drawAgenda(body, period) {
  const from = ymd(state.cursor);
  const to = ymd(addDays(state.cursor, 13));
  period.textContent = `${fmt(state.cursor, { day: 'numeric', month: 'short' })} → ${fmt(addDays(state.cursor, 13), { day: 'numeric', month: 'short' })}`;
  const occ = occurrences(from, to);
  if (!occ.length) {
    body.innerHTML = `<div class="empty"><div class="big">🗓️</div>Rien de prévu sur ces deux semaines.<br><button class="btn btn-primary mt" data-add>${icon('plus')} Ajouter un événement</button></div>`;
    $('[data-add]', body).onclick = () => editEvent({ date: from });
    return;
  }
  const byDay = {};
  occ.forEach(e => (byDay[e.date] ||= []).push(e));
  body.innerHTML = Object.entries(byDay).map(([d, evs]) => `
    <div class="agenda-day"><h3>${d === today() ? "Aujourd'hui · " : ''}${fmtDay(d)}</h3>
      ${evs.map(e => { const c = CATS[e.cat] || CATS.perso; return `<div class="agenda-ev ev-open" data-id="${e.id}" data-date="${e.date}" style="--c:${c.color}">
        <div class="t">${e.start ? e.start + (e.end ? '–' + e.end : '') : 'Journée'}</div>
        <div><b>${esc(e.title)}</b><div class="small muted">${c.label}${e.location ? ' · ' + esc(e.location) : ''}${e.repeat === 'weekly' ? ' · chaque semaine' : ''}</div></div>
      </div>`; }).join('')}
    </div>`).join('');
  bindEvents(body);
}

function bindEvents(body) {
  $$('[data-id]', body).forEach(n => n.onclick = e => {
    e.stopPropagation();
    const ev = getEvents().find(x => x.id === n.dataset.id);
    if (ev) editEvent(ev, n.dataset.date);
  });
}

function editEvent(ev, occDate) {
  const isNew = !ev.id;
  const form = h(`<form class="stack">
    <label class="field">Titre<input class="input" name="title" required placeholder="Ex. Anatomie du membre inférieur" value="${esc(ev.title || '')}"></label>
    <div class="grid g2">
      <label class="field">Catégorie<select class="input" name="cat">${Object.entries(CATS).map(([k, c]) => `<option value="${k}" ${ev.cat === k ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
      <label class="field">Date<input class="input" type="date" name="date" required value="${esc(ev.date || today())}"></label>
    </div>
    <div class="grid g2">
      <label class="field">Début<input class="input" type="time" name="start" value="${esc(ev.start || '')}"></label>
      <label class="field">Fin<input class="input" type="time" name="end" value="${esc(ev.end || '')}"></label>
    </div>
    <label class="field">Lieu<input class="input" name="location" placeholder="Ex. ESS Porto, salle 2.14" value="${esc(ev.location || '')}"></label>
    <div class="grid g2">
      <label class="field">Répétition<select class="input" name="repeat"><option value="none">Une seule fois</option><option value="weekly" ${ev.repeat === 'weekly' ? 'selected' : ''}>Chaque semaine</option></select></label>
      <label class="field">Jusqu'au (facultatif)<input class="input" type="date" name="until" value="${esc(ev.until || '')}"></label>
    </div>
    <label class="field">Notes<textarea class="input" name="notes" rows="2">${esc(ev.notes || '')}</textarea></label>
    <div class="modal-foot">
      ${isNew ? '' : `<button type="button" class="btn btn-ghost btn-danger" data-del>${icon('trash')} Supprimer</button><div class="spacer"></div>`}
      <button type="button" class="btn" data-close>Annuler</button>
      <button class="btn btn-primary">${isNew ? 'Ajouter' : 'Enregistrer'}</button>
    </div>
  </form>`);
  const m = modal({ title: isNew ? 'Nouvel événement' : "Modifier l'événement", body: form });
  if (!ev.cat) form.cat.value = 'cours';
  form.onsubmit = e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.end && data.start && data.end <= data.start) { toast("L'heure de fin doit être après le début."); return; }
    const list = getEvents();
    const item = { ...ev, ...data, id: ev.id || uid() };
    if (item.repeat !== 'weekly') delete item.until;
    if (isNew) list.push(item); else list.splice(list.findIndex(x => x.id === ev.id), 1, item);
    saveEvents(list);
    m.close();
    state.cursor = parseYmd(item.date);
    draw();
    toast(isNew ? 'Événement ajouté' : 'Modifié');
  };
  const del = $('[data-del]', form);
  if (del) del.onclick = async () => {
    let list = getEvents();
    if (ev.repeat === 'weekly' && occDate) {
      const choice = await chooseDelete();
      if (!choice) return;
      if (choice === 'one') {
        const item = list.find(x => x.id === ev.id);
        item.exceptions = [...(item.exceptions || []), occDate];
      } else list = list.filter(x => x.id !== ev.id);
    } else {
      if (!(await confirmBox(`Supprimer « ${ev.title} » ?`))) return;
      list = list.filter(x => x.id !== ev.id);
    }
    saveEvents(list);
    m.close();
    draw();
  };
}

function chooseDelete() {
  return new Promise(res => {
    const m = modal({ title: 'Événement répété', body: `<p>Supprimer seulement cette date, ou toute la série ?</p><div class="modal-foot"><button class="btn" data-one>Cette date</button><button class="btn btn-danger" data-all>Toute la série</button></div>`, onClose: () => res(null) });
    m.body.querySelector('[data-one]').onclick = () => { res('one'); m.close(); };
    m.body.querySelector('[data-all]').onclick = () => { res('all'); m.close(); };
  });
}

// ---------- iCalendar ----------
const icsDate = (d, t) => d.replace(/-/g, '') + (t ? 'T' + t.replace(':', '') + '00' : '');
function exportIcs() {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Matteo//Base//FR', 'CALSCALE:GREGORIAN'];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const txt = s => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  for (const e of getEvents()) {
    lines.push('BEGIN:VEVENT', `UID:${e.id}@matteo`, `DTSTAMP:${stamp}`, `SUMMARY:${txt(e.title)}`);
    if (e.start) {
      lines.push(`DTSTART;TZID=Europe/Lisbon:${icsDate(e.date, e.start)}`);
      lines.push(`DTEND;TZID=Europe/Lisbon:${icsDate(e.date, e.end || e.start)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(e.date)}`);
      lines.push(`DTEND;VALUE=DATE:${icsDate(ymd(addDays(parseYmd(e.date), 1)))}`);
    }
    if (e.location) lines.push(`LOCATION:${txt(e.location)}`);
    if (e.notes) lines.push(`DESCRIPTION:${txt(e.notes)}`);
    lines.push(`CATEGORIES:${CATS[e.cat]?.label || 'Perso'}`);
    if (e.repeat === 'weekly') lines.push(`RRULE:FREQ=WEEKLY${e.until ? ';UNTIL=' + icsDate(e.until) + 'T235959Z' : ''}`);
    for (const x of e.exceptions || []) lines.push(`EXDATE;TZID=Europe/Lisbon:${icsDate(x, e.start || '00:00')}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'calendrier-matteo.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importIcs(file) {
  const raw = (await file.text()).replace(/\r?\n[ \t]/g, '');
  const blocks = raw.split('BEGIN:VEVENT').slice(1);
  const list = getEvents();
  const ids = new Set(list.map(e => e.id));
  let n = 0;
  const guessCat = s => /exam|teste|avalia/i.test(s) ? 'exam' : /est[aá]gio|stage|cl[ií]nic/i.test(s) ? 'stage' : /muay|thai/i.test(s) ? 'muay' : /mma|jiu|grappl|lutte/i.test(s) ? 'mma' : /surf/i.test(s) ? 'surf' : /gym|muscu|gin[aá]sio/i.test(s) ? 'muscu' : 'cours';
  for (const b of blocks) {
    const get = k => { const m = b.match(new RegExp('^' + k + '(;[^:\\n]*)?:(.*)$', 'm')); return m ? { params: m[1] || '', value: m[2].trim() } : null; };
    const s = get('DTSTART'); if (!s) continue;
    const e = get('DTEND');
    const toLocal = v => {
      const m = v.value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?(\d{2})?(Z)?/);
      if (!m) return null;
      if (!m[4]) return { date: `${m[1]}-${m[2]}-${m[3]}`, time: '' };
      let d = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]);
      if (m[7]) d = new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]));
      return { date: ymd(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
    };
    const st = toLocal(s); if (!st) continue;
    const en = e ? toLocal(e) : null;
    const title = (get('SUMMARY')?.value || 'Sans titre').replace(/\\([,;\\])/g, '$1').replace(/\\n/g, ' ');
    const uidv = 'ics-' + (get('UID')?.value || uid()).replace(/[^\w-]/g, '').slice(0, 40);
    if (ids.has(uidv)) continue;
    const rr = get('RRULE')?.value || '';
    const ev = { id: uidv, title, cat: guessCat(title), date: st.date, start: st.time, end: en?.time || '', location: (get('LOCATION')?.value || '').replace(/\\([,;\\])/g, '$1'), notes: '', repeat: /FREQ=WEEKLY/.test(rr) ? 'weekly' : 'none' };
    const until = rr.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);
    if (until) ev.until = `${until[1]}-${until[2]}-${until[3]}`;
    list.push(ev); ids.add(uidv); n++;
  }
  saveEvents(list);
  draw();
  toast(n ? `${n} événement(s) importé(s)` : 'Aucun nouvel événement trouvé');
}

export default { render, onShow: draw };
