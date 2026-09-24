// Petits graphiques SVG (ligne et barres) avec info-bulle au survol.
import { esc } from './core.js';

const W = 640;

function niceRange(min, max, pad = 0.08) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  return [min - span * pad, max + span * pad];
}

function ticks(min, max, n = 4) {
  const step = (max - min) / n;
  return Array.from({ length: n + 1 }, (_, i) => min + step * i);
}

function attachTip(el, svg, hits, render) {
  const tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.hidden = true;
  el.appendChild(tip);
  const guide = svg.querySelector('.hover-guide');
  const dot = svg.querySelector('.hover-dot');
  const move = evt => {
    const r = svg.getBoundingClientRect();
    const px = ((evt.touches ? evt.touches[0].clientX : evt.clientX) - r.left) / r.width * W;
    let best = null, bd = Infinity;
    for (const h of hits) { const d = Math.abs(h.x - px); if (d < bd) { bd = d; best = h; } }
    if (!best) return;
    tip.hidden = false;
    tip.innerHTML = render(best);
    const scale = r.width / W;
    tip.style.left = `${best.x * scale}px`;
    tip.style.top = `${best.y * scale}px`;
    if (guide) { guide.setAttribute('x1', best.x); guide.setAttribute('x2', best.x); guide.style.opacity = 1; }
    if (dot) { dot.setAttribute('cx', best.x); dot.setAttribute('cy', best.y); dot.style.opacity = 1; }
  };
  const leave = () => { tip.hidden = true; if (guide) guide.style.opacity = 0; if (dot) dot.style.opacity = 0; };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerleave', leave);
  svg.addEventListener('touchstart', move, { passive: true });
}

/**
 * series: [{ name, color, points: [{ x: number, y: number, label }], width, dashed }]
 * La première série est celle dont on montre la valeur au survol.
 */
export function lineChart(el, { series, height = 240, yFormat = v => v, xLabel = p => p.label, hline, area = true, yMin, yMax }) {
  el.classList.add('chart');
  el.innerHTML = '';
  const all = series.flatMap(s => s.points);
  if (!all.length) { el.innerHTML = '<div class="empty small">Pas encore de données.</div>'; return; }
  const H = height, L = 44, R = 12, T = 14, B = 26;
  const xs = all.map(p => p.x), ys = all.map(p => p.y).concat(hline ? [hline.y] : []);
  const x0 = Math.min(...xs), x1 = Math.max(...xs) === x0 ? x0 + 1 : Math.max(...xs);
  let [y0, y1] = niceRange(Math.min(...ys), Math.max(...ys));
  if (yMin != null) y0 = yMin; if (yMax != null) y1 = yMax;
  const sx = x => L + (x - x0) / (x1 - x0) * (W - L - R);
  const sy = y => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
  let g = '';
  for (const t of ticks(y0, y1)) g += `<line class="grid-line" x1="${L}" x2="${W - R}" y1="${sy(t)}" y2="${sy(t)}"/><text class="axis-text" x="${L - 8}" y="${sy(t) + 4}" text-anchor="end">${esc(yFormat(t))}</text>`;
  const main = series[0].points;
  const idx = main.length <= 7 ? main.map((_, i) => i) : [0, Math.floor(main.length / 3), Math.floor(2 * main.length / 3), main.length - 1];
  for (const i of idx) g += `<text class="axis-text" x="${sx(main[i].x)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === main.length - 1 ? 'end' : 'middle'}">${esc(xLabel(main[i]))}</text>`;
  if (hline) g += `<line x1="${L}" x2="${W - R}" y1="${sy(hline.y)}" y2="${sy(hline.y)}" stroke="${hline.color}" stroke-width="1.5" stroke-dasharray="5 5"/><text class="axis-text" x="${W - R}" y="${sy(hline.y) - 6}" text-anchor="end" style="fill:${hline.color}">${esc(hline.label)}</text>`;
  const id = 'g' + Math.random().toString(36).slice(2, 7);
  series.forEach((s, si) => {
    if (!s.points.length) return;
    const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('');
    if (si === 0 && area && s.points.length > 1) {
      g += `<defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".28"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs>`;
      g += `<path d="${d}L${sx(s.points.at(-1).x)},${H - B}L${sx(s.points[0].x)},${H - B}Z" fill="url(#${id})"/>`;
    }
    g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2}" stroke-linejoin="round" stroke-linecap="round" ${s.dashed ? 'stroke-dasharray="4 5"' : ''}/>`;
    if (s.dots) for (const p of s.points) g += `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="3" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`;
  });
  g += `<line class="hover-guide" y1="${T}" y2="${H - B}" stroke="var(--line-strong)" stroke-width="1" style="opacity:0"/><circle class="hover-dot" r="5" fill="${series[0].color}" stroke="var(--surface)" stroke-width="2" style="opacity:0"/>`;
  el.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`);
  const svg = el.querySelector('svg');
  attachTip(el, svg, main.map(p => ({ x: sx(p.x), y: sy(p.y), p })), h => `${esc(xLabel(h.p))}<br><b>${esc(yFormat(h.p.y))}</b>${h.p.note ? `<br>${esc(h.p.note)}` : ''}`);
  if (series.length > 1) el.insertAdjacentHTML('beforeend', `<div class="legend">${series.map(s => `<span style="--c:${s.color}">${esc(s.name)}</span>`).join('')}</div>`);
}

/** data: [{ label, value, color, tip }] */
export function barChart(el, { data, height = 200, yFormat = v => v, color = 'var(--blue)' }) {
  el.classList.add('chart');
  el.innerHTML = '';
  if (!data.length) { el.innerHTML = '<div class="empty small">Pas encore de données.</div>'; return; }
  const H = height, L = 40, R = 8, T = 12, B = 26;
  const max = Math.max(1, ...data.map(d => d.value)) * 1.1;
  const bw = (W - L - R) / data.length;
  const sy = v => T + (1 - v / max) * (H - T - B);
  let g = '';
  for (const t of ticks(0, max, 3)) g += `<line class="grid-line" x1="${L}" x2="${W - R}" y1="${sy(t)}" y2="${sy(t)}"/><text class="axis-text" x="${L - 8}" y="${sy(t) + 4}" text-anchor="end">${esc(yFormat(t))}</text>`;
  const hits = [];
  data.forEach((d, i) => {
    const x = L + i * bw + 2, w = Math.max(2, bw - 4), y = sy(d.value), h = H - B - y;
    const r = Math.min(4, w / 2, h);
    if (h > 0) g += `<path d="M${x},${H - B}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${H - B}Z" fill="${d.color || color}"/>`;
    if (data.length <= 16 || i % Math.ceil(data.length / 8) === 0) g += `<text class="axis-text" x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>`;
    hits.push({ x: x + w / 2, y: Math.min(y, H - B - 2), d });
  });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
  attachTip(el, el.querySelector('svg'), hits, h => h.d.tip || `${esc(h.d.label)}<br><b>${esc(yFormat(h.d.value))}</b>`);
}
