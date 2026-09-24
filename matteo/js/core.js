// Outils communs : stockage, dates, DOM, modales, toasts.
import { icon } from './icons.js';

const PREFIX = 'mt.';

export const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); }
    catch (e) { toast('Stockage plein : exporte une sauvegarde dans Réglages.'); }
    emit('store:' + key, value);
  },
  remove(key) { try { localStorage.removeItem(PREFIX + key); } catch (e) {} },
  keys() {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length)); } } catch (e) {}
    return out;
  },
};

// Mini bus d'événements entre rubriques
const listeners = {};
export function on(evt, fn) { (listeners[evt] ||= []).push(fn); }
export function emit(evt, data) { (listeners[evt] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); }

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const round1 = v => Math.round(v * 10) / 10;

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// ---------- Dates (toujours en heure locale) ----------
export const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => ymd(new Date());
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const startOfWeek = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); };
export const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
export const fmt = (d, opts) => new Intl.DateTimeFormat('fr-FR', opts).format(typeof d === 'string' ? parseYmd(d) : d);
export const fmtDay = d => fmt(d, { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtShort = d => fmt(d, { day: 'numeric', month: 'short' });
export const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };

export const BIRTHDAY = new Date(2004, 4, 7);
export function age(at = new Date()) {
  let a = at.getFullYear() - BIRTHDAY.getFullYear();
  if (at.getMonth() < 4 || (at.getMonth() === 4 && at.getDate() < 7)) a--;
  return a;
}
export const firstName = () => store.get('name', 'Matteo');

// ---------- Toast ----------
export function toast(msg, ms = 2600) {
  const box = document.getElementById('toasts');
  if (!box) return;
  const el = h(`<div class="toast">${esc(msg)}</div>`);
  box.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

// ---------- Modale ----------
export function modal({ title, body, wide = false, onClose }) {
  const back = h(`<div class="modal-back" role="dialog" aria-modal="true">
    <div class="modal ${wide ? 'wide' : ''}">
      <div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn sm" data-close aria-label="Fermer">${icon('x')}</button></div>
      <div class="modal-body"></div>
    </div></div>`);
  const content = back.querySelector('.modal-body');
  if (typeof body === 'string') content.innerHTML = body; else if (body) content.appendChild(body);
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  back.addEventListener('click', e => { if (e.target === back || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(back);
  const first = content.querySelector('input, textarea, select');
  if (first && window.matchMedia('(min-width: 861px)').matches) setTimeout(() => first.focus(), 50);
  return { el: back, body: content, close };
}

export function confirmBox(text) {
  return new Promise(res => {
    const m = modal({ title: 'Confirmer', body: `<p>${esc(text)}</p><div class="modal-foot"><button class="btn" data-no>Annuler</button><button class="btn btn-primary" data-yes>Oui</button></div>`, onClose: () => res(false) });
    m.body.querySelector('[data-no]').onclick = () => m.close();
    m.body.querySelector('[data-yes]').onclick = () => { res(true); m.close(); };
  });
}

// Lit un fichier en base64 (sans l'en-tête data:)
export function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ---------- Markdown minimal (réponses IA) ----------
export function md(src) {
  const lines = String(src || '').replace(/\r/g, '').split('\n');
  let html = '', list = null, para = [], inCode = false, code = [], table = [];
  const inline = s => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const flushPara = () => { if (para.length) { html += `<p>${para.map(inline).join('<br>')}</p>`; para = []; } };
  const flushList = () => { if (list) { html += `<${list.type}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.type}>`; list = null; } };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.filter(r => !/^\s*\|?\s*:?-{2,}/.test(r)).map(r => r.replace(/^\s*\||\|\s*$/g, '').split('|').map(c => c.trim()));
    html += '<table>' + rows.map((r, i) => '<tr>' + r.map(c => i === 0 ? `<th>${inline(c)}</th>` : `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</table>';
    table = [];
  };
  const flushAll = () => { flushPara(); flushList(); flushTable(); };
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode) { html += `<pre><code>${esc(code.join('\n'))}</code></pre>`; code = []; inCode = false; }
      else { flushAll(); inCode = true; }
      continue;
    }
    if (inCode) { code.push(line); continue; }
    let m;
    if (/^\s*\|.*\|\s*$/.test(line)) { flushPara(); flushList(); table.push(line); continue; } else flushTable();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if ((m = line.match(/^(#{1,4})\s+(.*)/))) { flushAll(); html += `<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`; continue; }
    if ((m = line.match(/^\s*[-*•]\s+(.*)/))) { flushPara(); if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { flushPara(); if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(/^>\s?(.*)/))) { flushAll(); html += `<blockquote>${inline(m[1])}</blockquote>`; continue; }
    if (/^-{3,}$/.test(line.trim())) { flushAll(); html += '<hr class="sep">'; continue; }
    flushList();
    para.push(line);
  }
  if (inCode) html += `<pre><code>${esc(code.join('\n'))}</code></pre>`;
  flushAll();
  return html;
}

// Navigation vers une autre rubrique
export function go(view) { location.hash = '#/' + view; }
