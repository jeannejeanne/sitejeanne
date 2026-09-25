// Accueil : bonjour du jour, widgets (planning, surf, entraînement, révisions) et assistant IA.
import { store, h, esc, md, $, $$, today, fmtDay, addDays, ymd, firstName, age, toast, go, round1 } from '../core.js';
import { icon } from '../icons.js';
import { chat, hasKey, systemPrompt, fileBlock } from '../ai.js';
import { LOVE, JOKES, SIGNATURE, NICKNAME } from '../data/coeur.js';

let root, log, busy = false, controller = null, attachment = null, pending = null;
// Conversation : en mémoire avec les pièces jointes, sauvegardée sans elles
let convo = store.get('chat', []).map(m => ({ role: m.role, content: m.text, att: m.att }));

const SUGGESTIONS = [
  '💪 Programme de prépa physique pour le muay thaï, 3 séances / semaine',
  '🦴 Explique-moi la coiffe des rotateurs comme pour un examen',
  '🥊 Comment améliorer mon low kick ?',
  '🍽️ Que manger avant un entraînement du soir ?',
  '🇵🇹 Les phrases utiles en portugais pour mon stage',
  '🧠 Fais-moi un quiz de 5 questions sur le genou',
];

function greeting() {
  const hr = new Date().getHours();
  if (hr < 5) return 'Boa noite';
  if (hr < 13) return 'Bom dia';
  if (hr < 20) return 'Boa tarde';
  return 'Boa noite';
}

function render(el) {
  root = el;
  const d = new Date();
  const isBday = d.getMonth() === 4 && d.getDate() === 7;
  el.innerHTML = `
    ${isBday ? `<div class="card bday"><h2>🎂 Joyeux anniversaire mon ${esc(NICKNAME)} !</h2><p style="margin:6px 0 0">${age()} ans aujourd'hui. Pas de sparring violent, profite ! 🎉</p></div>` : ''}
    <div class="hero">
      <div><div class="eyebrow">${esc(fmtDay(today()))}</div><h1>${greeting()}, ${esc(NICKNAME)} <span class="wave">👋</span></h1><p>Qu'est-ce qu'on fait aujourd'hui ?</p></div>
    </div>
    <div class="widgets" data-widgets></div>
    <div class="grid g2 mb">
      <div class="card love" data-love></div>
      <div class="card joke" data-joke></div>
    </div>
    <div class="card chat">
      <div class="chat-head"><div class="orb"></div><div style="flex:1"><h2>Ton coach IA</h2><div class="tiny muted">Kiné, fight, nutrition, surf, vie à Porto : demande-lui tout.</div></div><button class="btn btn-sm btn-ghost" data-reset>${icon('refresh')}<span class="lbl">Nouvelle discussion</span></button></div>
      <div class="chat-log" data-log></div>
      <div class="attach-pill" data-att hidden></div>
      <form class="composer" data-form>
        <label class="icon-btn" title="Joindre un PDF ou une photo" style="flex:none;width:46px;height:46px">${icon('paperclip')}<input type="file" hidden accept=".pdf,image/*,.txt,.md" data-file></label>
        <textarea rows="1" placeholder="Pose ta question…" data-input></textarea>
        <button class="send" data-send aria-label="Envoyer">${icon('send')}</button>
      </form>
    </div>`;
  log = $('[data-log]', el);
  const input = $('[data-input]', el);
  const autosize = () => { input.style.height = 'auto'; input.style.height = Math.min(180, input.scrollHeight) + 'px'; };
  input.oninput = autosize;
  input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(pointer: fine)').matches) { e.preventDefault(); $('[data-form]', el).requestSubmit(); } };
  $('[data-form]', el).onsubmit = e => {
    e.preventDefault();
    if (busy) { controller?.abort(); return; }
    const text = input.value.trim();
    if (!text && !attachment) return;
    input.value = ''; autosize();
    send(text || 'Peux-tu m\'aider avec ce fichier ?');
  };
  $('[data-file]', el).onchange = async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) return toast('Fichier trop lourd (25 Mo max)');
    try { attachment = { name: f.name, block: await fileBlock(f) }; showAtt(); } catch (err) { toast(err.message); }
  };
  $('[data-reset]', el).onclick = () => { controller?.abort(); convo = []; persist(); drawLog(); };
  drawLog();
  drawFun();
  if (pending) { const p = pending; pending = null; send(p); }
}

function showAtt() {
  const box = $('[data-att]', root);
  box.hidden = !attachment;
  if (!attachment) return;
  box.innerHTML = `📎 ${esc(attachment.name)} <button class="icon-btn sm" aria-label="Retirer">${icon('x')}</button>`;
  box.querySelector('button').onclick = () => { attachment = null; showAtt(); };
}

function persist() {
  store.set('chat', convo.slice(-40).map(m => ({ role: m.role, text: typeof m.content === 'string' ? m.content : m.content.filter(b => b.type === 'text').map(b => b.text).join('\n'), att: m.att })));
}

function drawLog() {
  if (!log) return;
  if (!convo.length) {
    log.innerHTML = `<div class="chat-empty">
      <h3>Salut ${esc(firstName())} ✌️</h3>
      <p class="muted">Je connais ton planning, tes objectifs et ton sport. Pose-moi une question ou choisis une idée :</p>
      ${hasKey() ? '' : `<div class="callout y" style="text-align:left;margin-top:12px"><span class="ico">🔑</span><div>Pour discuter avec l'IA, ajoute ta clé API Anthropic dans <a href="#/reglages">Réglages</a> (2 minutes, une seule fois).</div></div>`}
      <div class="chips">${SUGGESTIONS.map(s => `<button class="chip" data-sug>${esc(s)}</button>`).join('')}</div>
    </div>`;
    $$('[data-sug]', log).forEach(b => b.onclick = () => send(b.textContent.replace(/^\S+\s/, '')));
    return;
  }
  log.innerHTML = '';
  convo.forEach(m => log.appendChild(bubble(m.role, typeof m.content === 'string' ? m.content : m.content.filter(b => b.type === 'text').map(b => b.text).join('\n'), m.att)));
  log.scrollTop = log.scrollHeight;
}

function bubble(role, text, att) {
  const el = h(`<div class="msg ${role === 'user' ? 'user' : 'bot md'}"></div>`);
  if (role === 'user') { el.textContent = text; if (att) el.prepend(h(`<div class="att">📎 ${esc(att)}</div>`)); }
  else el.innerHTML = md(text);
  return el;
}

// Contexte perso : planning, révisions, poids, entraînement
async function context() {
  const parts = [];
  try {
    const { occurrences, CATS } = await import('./calendrier.js');
    const evs = occurrences(today(), ymd(addDays(new Date(), 7)));
    if (evs.length) parts.push('Son planning des 7 prochains jours :\n' + evs.slice(0, 25).map(e => `- ${e.date}${e.start ? ' ' + e.start : ''} : ${e.title} (${CATS[e.cat]?.label || e.cat})`).join('\n'));
  } catch (e) {}
  try {
    const { stats } = await import('./journal.js');
    const s = stats();
    if (s.total) parts.push(`Entraînement : ${s.weekCount} séance(s) cette semaine, charge 7 j = ${Math.round(s.acute)} UA${s.acwr ? `, ratio aigu/chronique ${round1(s.acwr)}` : ''}.${s.last ? ` Dernière séance : ${s.last.date} (${s.last.type})${s.last.feelings ? ', ressenti : ' + s.last.feelings : ''}.` : ''}`);
  } catch (e) {}
  const w = store.get('weights', []);
  const p = store.get('weightProfile', {});
  if (w.length) parts.push(`Poids : ${w.sort((a, b) => a.date.localeCompare(b.date)).at(-1).kg} kg${p.goal ? `, objectif ${p.goal} kg` : ''}${p.height ? `, taille ${p.height} cm` : ''}.`);
  return parts.join('\n');
}

async function send(text) {
  if (busy) return;
  if (!hasKey()) {
    convo.push({ role: 'user', content: text });
    drawLog();
    const b = bubble('assistant', "Je ne suis pas encore connecté 🔌 Va dans **Réglages** et colle ta clé API Anthropic : ensuite je pourrai te répondre sur tout (kiné, entraînement, nutrition…).");
    b.classList.add('err');
    log.appendChild(b);
    convo.pop();
    return;
  }
  const att = attachment;
  attachment = null; showAtt();
  const content = att ? [att.block, { type: 'text', text }] : text;
  convo.push({ role: 'user', content, att: att?.name });
  drawLog();
  const out = bubble('assistant', '');
  out.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
  log.appendChild(out);
  log.scrollTop = log.scrollHeight;
  busy = true;
  controller = new AbortController();
  const sendBtn = $('[data-send]', root);
  sendBtn.innerHTML = icon('x');
  let stick = true;
  const onScroll = () => { stick = log.scrollHeight - log.scrollTop - log.clientHeight < 60; };
  log.addEventListener('scroll', onScroll);
  try {
    const extra = await context();
    const reply = await chat({
      system: systemPrompt(extra),
      messages: history(),
      signal: controller.signal,
      onText: (_, full) => { out.innerHTML = md(full); if (stick) log.scrollTop = log.scrollHeight; },
    });
    convo.push({ role: 'assistant', content: reply });
    // Les pièces jointes sont lourdes : on ne les garde que pour la question suivante
    convo.forEach((m, i) => { if (i < convo.length - 3 && Array.isArray(m.content)) m.content = m.content.filter(b => b.type === 'text').map(b => b.text).join('\n'); });
    persist();
  } catch (e) {
    out.classList.add('err');
    out.innerHTML = `⚠️ ${esc(e.message)}`;
    convo.pop();
    if (att) { attachment = att; showAtt(); }
  } finally {
    busy = false;
    log.removeEventListener('scroll', onScroll);
    sendBtn.innerHTML = icon('send');
  }
}

// Les 30 derniers messages, en commençant toujours par un message de Matteo
function history() {
  const h = convo.slice(-30);
  while (h.length && h[0].role !== 'user') h.shift();
  return h.map(m => ({ role: m.role, content: m.content }));
}

// Utilisable depuis les autres rubriques
export function askAI(text) {
  if (root) { go('accueil'); setTimeout(() => send(text), 50); }
  else { pending = text; go('accueil'); }
}

// ---------- Petit mot & blague du jour ----------
const dayIndex = (n, salt = 0) => { const d = new Date(); return (Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000) + salt) % n; };
let loveI = null, jokeI = null;

function drawFun() {
  if (loveI == null) loveI = dayIndex(LOVE.length);
  if (jokeI == null) jokeI = dayIndex(JOKES.length, 17);
  const love = $('[data-love]', root);
  love.innerHTML = `<div class="card-head"><h2><span class="beat">❤️</span> Pour mon ${esc(NICKNAME)}</h2><button class="icon-btn sm" data-more-love aria-label="Un autre mot">${icon('refresh')}</button></div>
    <p class="love-txt">${esc(LOVE[loveI])}</p><div class="love-sign">— ${esc(SIGNATURE)}</div>`;
  $('[data-more-love]', love).onclick = () => { loveI = (loveI + 1) % LOVE.length; drawFun(); hearts(love); };
  love.onclick = e => { if (!e.target.closest('button')) hearts(love); };
  const [q, a] = JOKES[jokeI];
  const joke = $('[data-joke]', root);
  joke.innerHTML = `<div class="card-head"><h2>😂 Blague du jour</h2><button class="icon-btn sm" data-more-joke aria-label="Une autre blague">${icon('refresh')}</button></div>
    <p class="joke-q">${esc(q)}</p>
    <button class="btn btn-sm btn-primary" data-punch>Voir la chute 🥁</button>
    <p class="joke-a" data-a hidden>${esc(a)}</p>`;
  $('[data-punch]', joke).onclick = e => { e.target.hidden = true; $('[data-a]', joke).hidden = false; };
  $('[data-more-joke]', joke).onclick = () => { jokeI = (jokeI + 1) % JOKES.length; drawFun(); };
}

// Petits cœurs qui s'envolent
function hearts(card) {
  for (let i = 0; i < 8; i++) {
    const hEl = document.createElement('span');
    hEl.className = 'fly-heart';
    hEl.textContent = ['❤️', '💛', '💙'][i % 3];
    hEl.style.left = 10 + Math.random() * 80 + '%';
    hEl.style.animationDelay = Math.random() * 0.4 + 's';
    card.appendChild(hEl);
    setTimeout(() => hEl.remove(), 1800);
  }
}

// ---------- Widgets ----------
async function widgets() {
  const box = $('[data-widgets]', root);
  const w = (href, ic, title, main, sub, extra = '') => `<a class="card widget" href="#/${href}"><div class="w-top">${icon(ic)}${title}</div><div class="w-main" ${extra}>${main}</div><div class="w-sub">${sub}</div></a>`;
  // Planning
  let plan = w('calendrier', 'calendar', "Aujourd'hui", 'Journée libre', 'Ajoute tes cours et tes séances');
  try {
    const { eventsOn, occurrences } = await import('./calendrier.js');
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const evs = eventsOn(today());
    const next = evs.find(e => !e.end || e.end > hm) || null;
    if (next) plan = w('calendrier', 'calendar', "Aujourd'hui", esc(next.title), `${next.start ? next.start + ' · ' : ''}${evs.length} événement${evs.length > 1 ? 's' : ''} aujourd'hui`);
    else if (evs.length) plan = w('calendrier', 'calendar', "Aujourd'hui", 'Journée bouclée ✓', `${evs.length} événement${evs.length > 1 ? 's' : ''} aujourd'hui`);
    else {
      const up = occurrences(ymd(addDays(now, 1)), ymd(addDays(now, 7)))[0];
      if (up) plan = w('calendrier', 'calendar', 'Prochain', esc(up.title), `${fmtDay(up.date)}${up.start ? ' · ' + up.start : ''}`);
    }
  } catch (e) {}
  // Entraînement
  let train = w('journal', 'flame', 'Entraînement', '0 séance', 'cette semaine — note ta prochaine !');
  try {
    const { stats } = await import('./journal.js');
    const s = stats();
    if (s.total) train = w('journal', 'flame', 'Entraînement', `${s.weekCount} séance${s.weekCount > 1 ? 's' : ''}`, `cette semaine · série de ${s.streak} j`);
  } catch (e) {}
  // Révisions
  let rev = w('flashcards', 'cards', 'Révisions', 'À jour ✓', 'Aucune carte à revoir');
  try {
    const { dueCount } = await import('./flashcards.js');
    const n = dueCount();
    if (n) rev = w('flashcards', 'cards', 'Révisions', `${n} carte${n > 1 ? 's' : ''}`, 'à revoir aujourd\'hui');
  } catch (e) {}
  const surf = w('surf', 'wave', 'Surf Matosinhos', '<span class="typing"><i></i><i></i><i></i></span>', 'Chargement…');
  box.innerHTML = plan + surf + train + rev;
  try {
    const { getSurfToday } = await import('./surf.js');
    const s = await getSurfToday();
    if (s) {
      const card = box.children[1];
      card.querySelector('.w-main').innerHTML = `<span style="color:${s.v.color}">${s.score}/10</span> · ${s.v.label}`;
      card.querySelector('.w-sub').textContent = `${round1(s.peak.wave)} m · ${Math.round(s.peak.period)} s · top ${s.from}h–${s.to}h${s.date !== today() ? ' (demain)' : ''}`;
    }
  } catch (e) {
    const card = box.children[1];
    card.querySelector('.w-main').textContent = 'Hors ligne';
    card.querySelector('.w-sub').textContent = 'Touche pour réessayer';
  }
}

export default {
  render,
  onShow() { if (root) { widgets(); if (!convo.length) drawLog(); } },
};
