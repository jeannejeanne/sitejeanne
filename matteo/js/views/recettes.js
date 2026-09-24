// Recettes : catalogue filtrable par envie + recherche « ce que j'ai dans le frigo » + idées de l'IA.
import { store, h, esc, modal, toast, md, $, $$ } from '../core.js';
import { icon } from '../icons.js';
import { RECIPES, TAGS, norm } from '../data/recettes.js';
import { chat, hasKey } from '../ai.js';

let root;
const st = { tags: new Set(), q: '', fav: false };
const fridge = () => store.get('fridge', []);
const favs = () => new Set(store.get('favRecipes', []));

// Un ingrédient du frigo correspond si l'un contient l'autre (« poulet » ↔ « blanc de poulet »)
const has = (ing, items) => items.some(f => { const k = norm(f); return ing.key.includes(k) || k.includes(ing.key) || (k.length > 3 && ing.key.startsWith(k.slice(0, -1))); });

function match(r, items) {
  const needed = r.ingredients.filter(i => !i.basic);
  if (!items.length) return { pct: null, missing: [] };
  const ok = needed.filter(i => has(i, items));
  return { pct: Math.round(ok.length / needed.length * 100), missing: needed.filter(i => !has(i, items)).map(i => i.name), count: ok.length };
}

function render(el) {
  root = el;
  const allIngs = [...new Set(RECIPES.flatMap(r => r.ingredients.filter(i => !i.basic).map(i => i.name)))].sort((a, b) => a.localeCompare(b, 'fr'));
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Nutrition</div><h1>Recettes saines</h1><p>${RECIPES.length} recettes pensées pour un étudiant sportif. Filtre selon ton envie, ou dis ce qu'il y a dans ton frigo.</p></div>
      <button class="btn btn-primary" data-ai>${icon('sparkles')} Idée de l'IA avec mon frigo</button>
    </div>
    <div class="card mb">
      <div class="card-head"><h2>🧊 Mon frigo</h2><button class="btn btn-sm btn-ghost" data-clear>Vider</button></div>
      <div class="fridge" data-fridge><input list="ing-list" data-fin placeholder="Ajoute un ingrédient puis Entrée (ex. poulet, oeufs, riz…)"></div>
      <datalist id="ing-list">${allIngs.map(i => `<option value="${esc(i)}">`).join('')}</datalist>
      <div class="chips mt" data-quick></div>
    </div>
    <div class="row mb" style="gap:12px">
      <input class="input" data-search placeholder="Rechercher une recette…" style="max-width:320px">
      <button class="chip" data-favs>♥ Favoris</button>
    </div>
    <div class="chips mb" data-tags>${Object.entries(TAGS).map(([k, v]) => `<button class="chip" data-tag="${k}">${esc(v)}</button>`).join('')}</div>
    <div class="small muted mb" data-count></div>
    <div class="recipes" data-list></div>`;

  const input = $('[data-fin]', el);
  const add = v => {
    v = v.trim().toLowerCase();
    if (!v) return;
    const f = fridge();
    if (!f.includes(v)) { f.push(v); store.set('fridge', f); }
    input.value = '';
    draw();
  };
  input.onkeydown = e => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input.value); }
    if (e.key === 'Backspace' && !input.value) { const f = fridge(); f.pop(); store.set('fridge', f); draw(); }
  };
  input.onchange = () => { if (allIngs.includes(input.value)) add(input.value); };
  $('[data-clear]', el).onclick = () => { store.set('fridge', []); draw(); };
  $('[data-search]', el).oninput = e => { st.q = e.target.value; draw(); };
  $('[data-favs]', el).onclick = () => { st.fav = !st.fav; draw(); };
  $$('[data-tag]', el).forEach(b => b.onclick = () => { st.tags.has(b.dataset.tag) ? st.tags.delete(b.dataset.tag) : st.tags.add(b.dataset.tag); draw(); });
  $('[data-ai]', el).onclick = aiIdea;
  draw();
}

function draw() {
  if (!root) return;
  const items = fridge();
  const box = $('[data-fridge]', root);
  $$('.chip', box).forEach(c => c.remove());
  items.forEach((it, i) => {
    const c = h(`<button class="chip on">${esc(it)} <span class="x">✕</span></button>`);
    c.onclick = () => { const f = fridge(); f.splice(i, 1); store.set('fridge', f); draw(); };
    box.insertBefore(c, $('[data-fin]', box));
  });
  const quick = ['oeufs', 'poulet', 'riz', 'pâtes', 'thon', 'avocat', 'banane', 'skyr', "flocons d'avoine", 'pommes de terre', 'épinards', 'tomate'].filter(q => !items.includes(q));
  $('[data-quick]', root).innerHTML = quick.slice(0, 8).map(q => `<button class="chip" data-q="${esc(q)}">+ ${esc(q)}</button>`).join('');
  $$('[data-q]', root).forEach(b => b.onclick = () => { store.set('fridge', [...fridge(), b.dataset.q]); draw(); });
  $$('[data-tag]', root).forEach(b => b.classList.toggle('on', st.tags.has(b.dataset.tag)));
  $('[data-favs]', root).classList.toggle('on', st.fav);

  const F = favs();
  const q = norm(st.q);
  let list = RECIPES.filter(r => [...st.tags].every(t => r.tags.includes(t)))
    .filter(r => !q || norm(r.name).includes(q) || r.ingredients.some(i => i.key.includes(q)))
    .filter(r => !st.fav || F.has(r.id))
    .map(r => ({ r, m: match(r, items) }));
  if (items.length) list = list.filter(x => x.m.count > 0).sort((a, b) => b.m.pct - a.m.pct || a.m.missing.length - b.m.missing.length);
  $('[data-count]', root).textContent = items.length ? `${list.length} recettes avec ce que tu as — les plus complètes d'abord` : `${list.length} recettes`;
  const out = $('[data-list]', root);
  if (!list.length) { out.innerHTML = `<div class="card empty" style="grid-column:1/-1"><div class="big">🤔</div>Aucune recette ne correspond. Enlève un filtre ou demande une idée à l'IA.</div>`; return; }
  out.innerHTML = list.map(({ r, m }) => `
    <div class="card recipe" data-id="${r.id}">
      <div class="rimg">${r.emoji}<button class="fav" data-fav="${r.id}" aria-label="Favori">${F.has(r.id) ? '♥' : '♡'}</button>${m.pct != null ? `<span class="badge ${m.pct === 100 ? 'g' : m.pct >= 60 ? 'y' : ''} match">${m.pct}% dispo</span>` : ''}</div>
      <div class="rbody">
        <h3>${esc(r.name)}</h3>
        <div class="rmeta"><span>⏱ ${r.time} min</span><span>🔥 ${r.kcal} kcal</span><span>💪 ${r.prot} g</span></div>
        ${m.missing.length ? `<div class="miss">Manque : ${esc(m.missing.slice(0, 4).join(', '))}${m.missing.length > 4 ? '…' : ''}</div>` : ''}
      </div>
    </div>`).join('');
  $$('[data-id]', out).forEach(c => c.onclick = e => { if (!e.target.closest('[data-fav]')) open(c.dataset.id); });
  $$('[data-fav]', out).forEach(b => b.onclick = () => {
    const f = favs(); f.has(b.dataset.fav) ? f.delete(b.dataset.fav) : f.add(b.dataset.fav);
    store.set('favRecipes', [...f]); draw();
  });
}

function open(id) {
  const r = RECIPES.find(x => x.id === id);
  const items = fridge();
  modal({
    title: `${r.emoji} ${r.name}`,
    body: `<div class="chips">${r.tags.map(t => `<span class="badge">${esc(TAGS[t] || t)}</span>`).join('')}</div>
      <div class="macros"><div><b>${r.time}′</b><span>temps</span></div><div><b>${r.kcal}</b><span>kcal</span></div><div><b>${r.prot} g</b><span>protéines</span></div><div><b>1</b><span>portion</span></div></div>
      <h3>Ingrédients</h3>
      <ul class="ing-list">${r.ingredients.map(i => `<li class="${items.length && has(i, items) ? 'have' : ''}">${esc(i.name)}${i.qty ? ` — <span class="muted">${esc(i.qty)}</span>` : ''}${i.basic ? ' <span class="tiny muted">(placard)</span>' : ''}</li>`).join('')}</ul>
      <h3 class="mt">Préparation</h3>
      <ol class="steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <p class="tiny muted">Valeurs nutritionnelles approximatives, par portion.</p>`,
  });
}

function aiIdea() {
  const items = fridge();
  const el = h(`<div class="stack">
    <label class="field">Ce que j'ai (frigo / placard)<textarea class="input" data-have rows="2">${esc(items.join(', '))}</textarea></label>
    <label class="field">Envie du moment<input class="input" data-want placeholder="Ex. un truc chaud et rapide, post-training, envie de sucré…"></label>
    <div class="chips">${['Post-training', 'Rapide (15 min)', 'Prise de masse', 'Sèche', 'Portugais', 'Pas cher'].map(t => `<button class="chip" data-w="${t}">${t}</button>`).join('')}</div>
    <button class="btn btn-primary" data-go>${icon('sparkles')} Trouver une recette</button>
    <div class="md" data-out></div>
  </div>`);
  modal({ title: "Idée recette de l'IA", body: el, wide: true });
  $$('[data-w]', el).forEach(b => b.onclick = () => { const w = $('[data-want]', el); w.value = w.value ? `${w.value}, ${b.dataset.w.toLowerCase()}` : b.dataset.w; });
  $('[data-go]', el).onclick = async () => {
    const out = $('[data-out]', el);
    if (!hasKey()) { out.innerHTML = `<div class="callout y"><span class="ico">🔑</span><div>Connecte l'IA dans <a href="#/reglages">Réglages</a> pour avoir des recettes sur mesure.</div></div>`; return; }
    const btn = $('[data-go]', el);
    btn.disabled = true;
    out.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    try {
      await chat({
        messages: [{ role: 'user', content: `Propose-moi UNE recette saine et savoureuse.\nJ'ai : ${$('[data-have]', el).value || 'pas précisé'}.\nEnvie : ${$('[data-want]', el).value || 'surprends-moi'}.\nUtilise surtout ce que j'ai (tu peux supposer sel, poivre, huile d'olive, épices de base). Format : titre, temps, calories et protéines approximatives par portion, ingrédients avec quantités, étapes courtes numérotées, et un petit conseil de sportif.` }],
        onText: (_, full) => { out.innerHTML = md(full); },
        effort: 'low',
      });
    } catch (e) {
      out.innerHTML = `<div class="callout r">${esc(e.message)}</div>`;
    }
    btn.disabled = false;
  };
}

export default { render, onShow: draw };
