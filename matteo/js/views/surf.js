// Surf à Matosinhos : prévisions houle + vent (Open-Meteo, gratuit et sans clé), note sur 10 et meilleur créneau.
import { store, esc, $, $$, today, fmt, round1, toast } from '../core.js';
import { icon } from '../icons.js';
import { lineChart } from '../chart.js';

const SPOT = { name: 'Matosinhos', lat: 41.17, lon: -8.72, beachLat: 41.176, beachLon: -8.69 };
const MARINE = `https://marine-api.open-meteo.com/v1/marine?latitude=${SPOT.lat}&longitude=${SPOT.lon}&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,sea_level_height_msl,sea_surface_temperature&timezone=Europe%2FLisbon&forecast_days=7`;
const WEATHER = `https://api.open-meteo.com/v1/forecast?latitude=${SPOT.beachLat}&longitude=${SPOT.beachLon}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m&daily=sunrise,sunset&wind_speed_unit=kmh&timezone=Europe%2FLisbon&forecast_days=7`;

export const LINKS = [
  { em: '🌊', name: 'Surf-Forecast · Matosinhos', desc: 'Prévisions détaillées du spot', url: 'https://www.surf-forecast.com/breaks/Matosinhos/forecasts/latest/six_day' },
  { em: '📹', name: 'MEO Beachcam', desc: 'Webcams en direct des plages', url: 'https://beachcam.meo.pt/livecams/' },
  { em: '💨', name: 'Windy · houle & vent', desc: 'Carte animée au large de Porto', url: 'https://www.windy.com/?waves,41.176,-8.700,11' },
];

const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
const dirName = deg => DIRS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
const angDiff = (a, b) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };

// ---------- Note d'une heure (0 à 10) ----------
// Matosinhos : beach break orienté plein ouest, abrité du nord par la digue de Leixões.
// Vent offshore = vent d'est. Idéal : 0,8–1,8 m, période ≥ 10 s, vent faible ou offshore.
export function scoreHour({ wave, period, swellDir, wind, windDir }) {
  if (wave == null || period == null) return null;
  let sh;
  if (wave < 0.3) sh = 0; else if (wave < 0.5) sh = 3; else if (wave < 0.8) sh = 6.5;
  else if (wave <= 1.8) sh = 10; else if (wave <= 2.5) sh = 7; else if (wave <= 3.5) sh = 4; else sh = 1;
  let sp;
  if (period < 6) sp = 2; else if (period < 8) sp = 5; else if (period < 10) sp = 7.5; else if (period < 13) sp = 9.5; else sp = 10;
  const rel = angDiff(windDir ?? 90, 90); // 0 = offshore pur
  let sw;
  if (wind < 8) sw = 10;
  else if (rel < 50) sw = wind < 30 ? 10 : 7;            // offshore
  else if (rel < 110) sw = wind < 12 ? 7.5 : wind < 20 ? 5 : 2.5; // side-shore
  else sw = wind < 12 ? 5.5 : wind < 20 ? 3 : 1;              // onshore
  let s = 0.45 * sh + 0.2 * sp + 0.35 * sw;
  if (swellDir != null) {
    if (swellDir >= 240 && swellDir <= 320) s *= 1; // O à NO : parfait
    else if (swellDir > 320 || swellDir < 20) s *= 0.85; // nord : cassé par la digue
    else s *= 0.9;
  }
  if (wave < 0.3) s = Math.min(s, 2);
  return round1(Math.max(0, Math.min(10, s)));
}

export function verdict(score) {
  if (score == null) return { label: '—', color: 'var(--muted)', emoji: '❔', tip: '' };
  if (score >= 7.5) return { label: 'Excellent', color: 'var(--green)', emoji: '🔥', tip: 'Fonce, ça rentre bien !' };
  if (score >= 6) return { label: 'Bon', color: '#9be15d', emoji: '🤙', tip: 'De bonnes sessions en perspective.' };
  if (score >= 4.5) return { label: 'Surfable', color: 'var(--yellow)', emoji: '👌', tip: 'Correct, parfait pour bosser la technique.' };
  if (score >= 3) return { label: 'Moyen', color: 'var(--orange)', emoji: '😐', tip: 'Petit ou désordonné, à voir sur la webcam.' };
  return { label: 'Pas terrible', color: 'var(--red)', emoji: '🥱', tip: 'Plutôt jour de sac ou de muscu.' };
}

function boardTip(h) {
  if (!h) return '';
  if (h.wave < 0.6) return 'Longboard ou mousse : ça reste petit.';
  if (h.wave < 1.2) return h.period >= 10 ? 'Fish ou shortboard volumineux.' : 'Mid-length / fish pour garder de la vitesse.';
  if (h.wave < 2.2) return 'Shortboard : les conditions le permettent.';
  return 'Gros : reste près de la digue ou observe depuis la plage.';
}

// ---------- Données ----------
async function fetchData(force = false) {
  const cache = store.get('surfCache', null);
  if (!force && cache && Date.now() - cache.t < 30 * 60 * 1000 && cache.marine?.hourly) return cache;
  try {
    const [m, w] = await Promise.all([fetch(MARINE).then(r => r.ok ? r.json() : Promise.reject(r.status)), fetch(WEATHER).then(r => r.ok ? r.json() : Promise.reject(r.status))]);
    const data = { t: Date.now(), marine: m, weather: w };
    store.set('surfCache', data);
    return data;
  } catch (e) {
    if (cache) { cache.stale = true; return cache; }
    throw new Error("Impossible de récupérer les prévisions (pas de réseau ?)");
  }
}

function buildHours(data) {
  const m = data.marine.hourly, w = data.weather.hourly;
  const windByTime = {};
  w.time.forEach((t, i) => windByTime[t] = { wind: w.wind_speed_10m[i], windDir: w.wind_direction_10m[i], gust: w.wind_gusts_10m[i], air: w.temperature_2m[i] });
  const hours = m.time.map((t, i) => {
    const ww = windByTime[t] || {};
    const hr = {
      time: t, date: t.slice(0, 10), hour: +t.slice(11, 13),
      wave: m.wave_height[i], period: m.swell_wave_period?.[i] ?? m.wave_period[i], waveDir: m.wave_direction[i],
      swell: m.swell_wave_height?.[i], swellDir: m.swell_wave_direction?.[i] ?? m.wave_direction[i],
      tide: m.sea_level_height_msl?.[i], water: m.sea_surface_temperature?.[i],
      wind: ww.wind ?? 0, windDir: ww.windDir ?? 90, gust: ww.gust, air: ww.air,
    };
    hr.score = scoreHour(hr);
    return hr;
  });
  const sun = {};
  (data.weather.daily?.time || []).forEach((d, i) => sun[d] = { rise: +data.weather.daily.sunrise[i].slice(11, 13), set: +data.weather.daily.sunset[i].slice(11, 13) });
  return { hours, sun };
}

function daySummary(hours, sun, date) {
  const s = sun[date] || { rise: 7, set: 20 };
  const day = hours.filter(h => h.date === date && h.hour >= s.rise && h.hour <= s.set && h.score != null);
  if (!day.length) return null;
  // meilleur créneau de 3 h
  let best = { avg: -1, i: 0 };
  for (let i = 0; i + 2 < day.length; i++) {
    const avg = (day[i].score + day[i + 1].score + day[i + 2].score) / 3;
    if (avg > best.avg) best = { avg, i };
  }
  if (best.avg < 0) best = { avg: day[0].score, i: 0 };
  const w = day.slice(best.i, best.i + 3);
  return {
    date, score: round1(best.avg), from: w[0].hour, to: w.at(-1).hour + 1,
    peak: w[1] || w[0], maxWave: Math.max(...day.map(h => h.wave)), day,
  };
}

// Pour l'accueil
export async function getSurfToday() {
  const data = await fetchData();
  const { hours, sun } = buildHours(data);
  const s = daySummary(hours, sun, today()) || daySummary(hours, sun, hours.find(h => h.date > today())?.date);
  return s ? { ...s, v: verdict(s.score) } : null;
}

// ---------- Affichage ----------
let root, model = null, selected = null;

function render(el) {
  root = el;
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Surf · Porto</div><h1>Vagues à Matosinhos</h1><p>Chaque jour : une note sur 10 calculée avec la houle, la période et le vent, et le meilleur créneau pour aller à l'eau.</p></div>
      <button class="btn" data-refresh>${icon('refresh')} Actualiser</button>
    </div>
    <div data-content><div class="card empty"><div class="big">🌊</div>Chargement des prévisions…</div></div>
    <div class="card mt">
      <div class="card-head"><h2>Vérifier en direct</h2><span class="muted small">Toujours jeter un œil à la webcam avant de partir</span></div>
      <div class="links">${LINKS.map(l => `<a class="link-card" href="${l.url}" target="_blank" rel="noopener"><span class="em">${l.em}</span><span><b>${esc(l.name)}</b><small>${esc(l.desc)}</small></span></a>`).join('')}</div>
    </div>`;
  $('[data-refresh]', el).onclick = () => load(true);
  load();
}

async function load(force = false) {
  const box = $('[data-content]', root);
  try {
    const data = await fetchData(force);
    const { hours, sun } = buildHours(data);
    const dates = [...new Set(hours.map(h => h.date))].filter(d => d >= today()).slice(0, 7);
    model = { data, hours, sun, dates, days: dates.map(d => daySummary(hours, sun, d)) };
    if (!selected || !dates.includes(selected)) selected = dates[0];
    draw();
    if (force) toast('Prévisions à jour');
  } catch (e) {
    box.innerHTML = `<div class="card empty"><div class="big">📡</div>${esc(e.message)}<br><button class="btn mt" data-retry>Réessayer</button></div>`;
    $('[data-retry]', box).onclick = () => load(true);
  }
}

function draw() {
  const box = $('[data-content]', root);
  const { hours, days, dates, data } = model;
  const sum = days[dates.indexOf(selected)];
  const isToday = selected === today();
  const nowH = new Date().getHours();
  const cur = isToday ? hours.find(h => h.date === selected && h.hour === nowH) : sum?.peak;
  const v = verdict(sum?.score);
  const circ = 2 * Math.PI * 100;
  const dayHours = hours.filter(h => h.date === selected);
  const tides = [];
  dayHours.forEach((h, i, a) => {
    if (i === 0 || i === a.length - 1 || h.tide == null) return;
    if (h.tide > a[i - 1].tide && h.tide >= a[i + 1].tide) tides.push({ hour: h.hour, high: true });
    else if (h.tide < a[i - 1].tide && h.tide <= a[i + 1].tide) tides.push({ hour: h.hour, high: false });
  });
  const windRel = cur ? angDiff(cur.windDir, 90) : 0;
  const windKind = !cur ? '' : cur.wind < 8 ? 'Glassy / très faible' : windRel < 50 ? 'Offshore 👍' : windRel < 110 ? 'Side-shore' : 'Onshore 👎';

  box.innerHTML = `
    ${data.stale ? '<div class="callout y mb"><span class="ico">📡</span>Hors ligne : ce sont les dernières prévisions enregistrées.</div>' : ''}
    <div class="card surf-hero">
      <div class="gauge">
        <svg viewBox="0 0 240 240"><circle cx="120" cy="120" r="100" fill="none" stroke="var(--bg-2)" stroke-width="16"/>
        <circle cx="120" cy="120" r="100" fill="none" stroke="${v.color}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - (sum?.score || 0) / 10)}" style="transition:stroke-dashoffset .8s"/></svg>
        <div class="center"><div><div class="score">${sum ? sum.score : '–'}<small>/10</small></div><div class="muted small">${isToday ? "aujourd'hui" : fmt(selected, { weekday: 'long' })}</div></div></div>
      </div>
      <div>
        <div class="verdict" style="color:${v.color}">${v.emoji} ${v.label}</div>
        <p class="muted" style="margin:4px 0 0">${esc(v.tip)} ${sum ? `Meilleur créneau : <b style="color:var(--text)">${sum.from}h – ${sum.to}h</b>.` : ''}</p>
        <div class="metrics">
          <div class="metric"><div class="k">Vagues</div><div class="v">${cur ? round1(cur.wave) : '–'} m</div><div class="s">max ${sum ? round1(sum.maxWave) : '–'} m dans la journée</div></div>
          <div class="metric"><div class="k">Période</div><div class="v">${cur ? Math.round(cur.period) : '–'} s</div><div class="s">${cur ? (cur.period >= 10 ? 'Houle longue, puissante' : cur.period >= 8 ? 'Houle moyenne' : 'Mer du vent, clapot') : ''}</div></div>
          <div class="metric"><div class="k">Houle de</div><div class="v"><span class="arrow" style="transform:rotate(${cur ? cur.swellDir + 180 : 0}deg)">↑</span>${cur ? dirName(cur.swellDir) : '–'}</div><div class="s">${cur ? Math.round(cur.swellDir) + '°' : ''}</div></div>
          <div class="metric"><div class="k">Vent</div><div class="v"><span class="arrow" style="transform:rotate(${cur ? cur.windDir + 180 : 0}deg)">↑</span>${cur ? Math.round(cur.wind) : '–'} km/h</div><div class="s">${windKind}${cur?.gust ? ` · rafales ${Math.round(cur.gust)}` : ''}</div></div>
          <div class="metric"><div class="k">Eau</div><div class="v">${cur?.water != null ? Math.round(cur.water) + ' °C' : '–'}</div><div class="s">${cur?.water != null ? (cur.water < 15 ? 'Combi 4/3 + chaussons' : cur.water < 18 ? 'Combi 4/3' : 'Combi 3/2') : ''}</div></div>
          <div class="metric"><div class="k">Marée</div><div class="v" style="font-size:16px">${tides.length ? tides.map(t => `${t.high ? 'Haute' : 'Basse'} ${t.hour}h`).join('<br>') : '–'}</div><div class="s">approximatif</div></div>
        </div>
        <p class="small mt" style="margin-bottom:0">🏄 ${esc(boardTip(cur))}</p>
      </div>
    </div>

    <div class="card mt">
      <div class="card-head"><h2>Les 7 prochains jours</h2><span class="muted small">Touche un jour pour le détail</span></div>
      <div class="days">${days.map((d, i) => { const vv = verdict(d?.score); return `<div class="day ${dates[i] === selected ? 'on' : ''}" data-day="${dates[i]}">
        <div class="dn">${dates[i] === today() ? 'Auj.' : fmt(dates[i], { weekday: 'short' })} ${fmt(dates[i], { day: 'numeric' })}</div>
        <div class="ds" style="color:${vv.color}">${d ? d.score : '–'}</div>
        <div class="dh">${d ? round1(d.maxWave) + ' m' : ''}</div>
        <div class="bar" style="background:${vv.color}"></div></div>`; }).join('')}</div>
    </div>

    <div class="grid g2 mt">
      <div class="card"><div class="card-head"><h2>Note heure par heure</h2></div><div data-chart-score></div></div>
      <div class="card"><div class="card-head"><h2>Hauteur des vagues</h2></div><div data-chart-wave></div></div>
    </div>
    <p class="tiny muted mt">Données : Open-Meteo (modèles de houle et de vent). La note est une estimation maison pour Matosinhos : elle ne remplace pas un coup d'œil à la webcam. Mis à jour ${fmt(new Date(data.t), { hour: '2-digit', minute: '2-digit' })}.</p>`;

  $$('[data-day]', box).forEach(n => n.onclick = () => { selected = n.dataset.day; draw(); });
  const pts = dayHours.filter(h => h.hour >= 6 && h.hour <= 22 && h.score != null);
  lineChart($('[data-chart-score]', box), {
    series: [{ name: 'Note', color: 'var(--yellow)', points: pts.map(h => ({ x: h.hour, y: h.score, label: `${h.hour}h`, note: `${round1(h.wave)} m · ${Math.round(h.period)} s · vent ${Math.round(h.wind)} km/h` })) }],
    yMin: 0, yMax: 10, yFormat: v => Math.round(v), height: 200,
  });
  lineChart($('[data-chart-wave]', box), {
    series: [{ name: 'Vagues', color: 'var(--blue-2)', points: pts.map(h => ({ x: h.hour, y: h.wave, label: `${h.hour}h` })) }],
    yMin: 0, yFormat: v => round1(v) + ' m', height: 200,
  });
}

export default { render, onShow() { if (model && Date.now() - model.data.t > 30 * 60 * 1000) load(); } };
