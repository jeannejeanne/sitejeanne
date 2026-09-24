// Flashcards : import d'un cours (PDF, photo, texte) → cartes générées par l'IA, révision espacée (Leitner).
import { store, h, esc, uid, modal, toast, confirmBox, today, ymd, addDays, parseYmd, $, $$ } from '../core.js';
import { icon } from '../icons.js';
import { json as aiJson, fileBlock, hasKey } from '../ai.js';
import { ANATOMIE } from '../data/anatomie.js';

const INTERVALS = [0, 1, 2, 4, 8, 16, 32]; // jours d'attente par boîte

function getDecks() {
  let decks = store.get('decks', null);
  if (!decks) {
    decks = [{ id: 'anatomie', name: 'Anatomie — les bases', emoji: '🦴', created: Date.now(), cards: ANATOMIE.map(([q, a]) => ({ id: uid(), q, a, box: 0, due: today() })) }];
    store.set('decks', decks);
  }
  return decks;
}
const saveDecks = d => store.set('decks', d);
const dueCards = deck => deck.cards.filter(c => c.due <= today());
export const dueCount = () => getDecks().reduce((s, d) => s + dueCards(d).length, 0);

let root;

function render(el) {
  root = el;
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Études · kiné</div><h1>Flashcards</h1><p>Importe ton cours (PDF, photo, texte) : l'IA en fait des cartes. Tu révises entre deux séances, l'appli te repropose au bon moment celles que tu maîtrises moins.</p></div>
      <div class="row"><button class="btn" data-manual>${icon('plus')} Paquet vide</button><button class="btn btn-primary" data-import>${icon('upload')} Importer un cours</button></div>
    </div>
    <div data-body></div>`;
  $('[data-import]', el).onclick = importDialog;
  $('[data-manual]', el).onclick = () => {
    const name = prompt('Nom du paquet ?', 'Nouveau paquet');
    if (!name) return;
    const decks = getDecks();
    decks.push({ id: uid(), name, emoji: '📘', created: Date.now(), cards: [] });
    saveDecks(decks);
    draw();
  };
  draw();
}

function draw() {
  if (!root) return;
  const decks = getDecks();
  const totalDue = decks.reduce((s, d) => s + dueCards(d).length, 0);
  $('[data-body]', root).innerHTML = `
    ${totalDue ? `<div class="callout y mb"><span class="ico">⏰</span><div><b>${totalDue} carte${totalDue > 1 ? 's' : ''} à réviser aujourd'hui.</b> 10 minutes suffisent. <button class="btn btn-sm btn-primary" style="margin-left:8px" data-study-all>Réviser tout</button></div></div>` : ''}
    <div class="decks">${decks.map(d => {
      const due = dueCards(d).length;
      const mastered = d.cards.filter(c => c.box >= 4).length;
      const pct = d.cards.length ? Math.round(mastered / d.cards.length * 100) : 0;
      return `<div class="card deck" data-deck="${d.id}">
        <div class="row between"><span style="font-size:30px">${d.emoji || '📘'}</span><div class="row" style="gap:4px"><button class="icon-btn sm" data-manage="${d.id}" aria-label="Gérer">${icon('edit')}</button></div></div>
        <h3>${esc(d.name)}</h3>
        <div class="meta"><span class="badge">${d.cards.length} cartes</span>${due ? `<span class="badge y">${due} à revoir</span>` : '<span class="badge g">à jour</span>'}</div>
        <div class="progress"><div style="width:${pct}%"></div></div>
        <div class="tiny muted">${pct}% maîtrisé</div>
        <div class="row"><button class="btn btn-sm btn-primary" data-study="${d.id}" ${d.cards.length ? '' : 'disabled'}>${icon('play')} Réviser</button><button class="btn btn-sm" data-free="${d.id}" ${d.cards.length ? '' : 'disabled'}>Mode libre</button></div>
      </div>`;
    }).join('')}</div>`;
  $$('[data-study]', root).forEach(b => b.onclick = e => { e.stopPropagation(); study(b.dataset.study, false); });
  $$('[data-free]', root).forEach(b => b.onclick = e => { e.stopPropagation(); study(b.dataset.free, true); });
  $$('[data-manage]', root).forEach(b => b.onclick = e => { e.stopPropagation(); manage(b.dataset.manage); });
  $$('[data-deck]', root).forEach(c => c.onclick = () => manage(c.dataset.deck));
  const all = $('[data-study-all]', root);
  if (all) all.onclick = () => study(null, false);
}

// ---------- Révision ----------
function study(deckId, free) {
  const decks = getDecks();
  const pool = (deckId ? decks.filter(d => d.id === deckId) : decks).flatMap(d => d.cards.map(c => ({ ...c, deck: d.id })));
  let queue = free ? pool : pool.filter(c => c.due <= today());
  if (!queue.length) { toast('Rien à réviser : tout est à jour ! Essaie le mode libre.'); return; }
  queue = queue.sort(() => Math.random() - 0.5);
  let i = 0, known = 0;
  const total = queue.length;
  const el = h(`<div>
    <div class="row between mb"><span class="small muted" data-count></span><span class="small muted">Espace / touche = retourner</span></div>
    <div class="progress mb"><div data-bar style="width:0"></div></div>
    <div class="flip" data-flip><div class="flip-inner">
      <div class="face front"><span class="lbl">Question</span><div class="txt" data-q></div></div>
      <div class="face back"><span class="lbl">Réponse</span><div class="txt" data-a></div></div>
    </div></div>
    <div class="grade" data-grade hidden>
      <button class="btn" data-g="0" style="color:var(--red)">↺ À revoir</button>
      <button class="btn" data-g="1" style="color:var(--orange)">Difficile</button>
      <button class="btn btn-primary" data-g="2">Facile ✓</button>
    </div>
    <div class="grade" data-reveal><button class="btn btn-blue btn-lg">Voir la réponse</button></div>
  </div>`);
  const m = modal({ title: free ? 'Mode libre' : 'Révision', body: el, wide: true, onClose: () => { document.removeEventListener('keydown', key); draw(); } });
  const flip = $('[data-flip]', el);
  const show = () => {
    if (i >= queue.length) {
      el.innerHTML = `<div class="empty"><div class="big">🎉</div><h2>Session terminée</h2><p>${known} / ${total} cartes réussies du premier coup.</p><button class="btn btn-primary mt" data-close>Fermer</button></div>`;
      return;
    }
    const c = queue[i];
    flip.classList.remove('flipped');
    $('[data-grade]', el).hidden = true;
    $('[data-reveal]', el).hidden = false;
    $('[data-q]', el).textContent = c.q;
    $('[data-a]', el).textContent = '';
    $('[data-count]', el).textContent = `Carte ${Math.min(i + 1, total)} / ${total}`;
    $('[data-bar]', el).style.width = `${(i / total) * 100}%`;
  };
  const reveal = () => { flip.classList.add('flipped'); $('[data-a]', el).textContent = queue[i].a; $('[data-grade]', el).hidden = false; $('[data-reveal]', el).hidden = true; };
  const grade = g => {
    const c = queue[i];
    if (!free) {
      const ds = getDecks();
      const card = ds.find(d => d.id === c.deck)?.cards.find(x => x.id === c.id);
      if (card) {
        if (g === 0) { card.box = 0; card.due = today(); }
        else if (g === 1) { card.box = Math.max(1, card.box); card.due = ymd(addDays(new Date(), 1)); }
        else { card.box = Math.min(6, card.box + 1); card.due = ymd(addDays(new Date(), INTERVALS[card.box])); }
        saveDecks(ds);
      }
    }
    if (g === 2 && !c.retry) known++;
    if (g === 0) queue.push({ ...c, retry: true }); // revient en fin de session
    i++;
    show();
  };
  flip.onclick = () => flip.classList.contains('flipped') ? flip.classList.remove('flipped') : reveal();
  $('[data-reveal] button', el).onclick = reveal;
  $$('[data-g]', el).forEach(b => b.onclick = () => grade(+b.dataset.g));
  const key = e => {
    if (!document.body.contains(el) || i >= queue.length) return;
    if (e.code === 'Space') { e.preventDefault(); flip.classList.contains('flipped') ? null : reveal(); }
    if (flip.classList.contains('flipped') && ['1', '2', '3'].includes(e.key)) grade(+e.key - 1);
  };
  document.addEventListener('keydown', key);
  show();
}

// ---------- Gestion d'un paquet ----------
function manage(deckId) {
  const deck = getDecks().find(d => d.id === deckId);
  if (!deck) return;
  const el = h(`<div class="stack">
    <div class="row"><input class="input" data-name value="${esc(deck.name)}" style="flex:1"><input class="input" data-emoji value="${esc(deck.emoji || '📘')}" style="width:64px;text-align:center"></div>
    <details><summary class="btn btn-sm">${icon('plus')} Ajouter une carte</summary>
      <div class="stack mt"><textarea class="input" data-q rows="2" placeholder="Question"></textarea><textarea class="input" data-a rows="2" placeholder="Réponse"></textarea><button class="btn btn-primary btn-sm" data-add>Ajouter</button></div>
    </details>
    <div class="list" data-cards style="max-height:50vh;overflow-y:auto"></div>
    <div class="modal-foot"><button class="btn btn-ghost btn-danger" data-del>${icon('trash')} Supprimer le paquet</button><div class="spacer"></div><button class="btn btn-primary" data-save>Enregistrer</button></div>
  </div>`);
  const m = modal({ title: 'Gérer le paquet', body: el, wide: true, onClose: draw });
  const list = () => {
    const d = getDecks().find(x => x.id === deckId);
    $('[data-cards]', el).innerHTML = d.cards.length ? d.cards.map(c => `<div class="list-item"><div style="flex:1"><b class="small">${esc(c.q)}</b><div class="small muted">${esc(c.a)}</div></div><span class="badge">${c.box >= 4 ? '✓' : 'boîte ' + c.box}</span><button class="icon-btn sm" data-rm="${c.id}" aria-label="Supprimer">${icon('trash')}</button></div>`).join('') : '<div class="empty small">Aucune carte.</div>';
    $$('[data-rm]', el).forEach(b => b.onclick = () => { const ds = getDecks(); const dd = ds.find(x => x.id === deckId); dd.cards = dd.cards.filter(c => c.id !== b.dataset.rm); saveDecks(ds); list(); });
  };
  $('[data-add]', el).onclick = () => {
    const q = $('[data-q]', el).value.trim(), a = $('[data-a]', el).value.trim();
    if (!q || !a) return toast('Remplis la question et la réponse');
    const ds = getDecks(); ds.find(x => x.id === deckId).cards.push({ id: uid(), q, a, box: 0, due: today() }); saveDecks(ds);
    $('[data-q]', el).value = ''; $('[data-a]', el).value = ''; list();
  };
  $('[data-save]', el).onclick = () => { const ds = getDecks(); const d = ds.find(x => x.id === deckId); d.name = $('[data-name]', el).value.trim() || d.name; d.emoji = $('[data-emoji]', el).value.trim() || '📘'; saveDecks(ds); m.close(); };
  $('[data-del]', el).onclick = async () => { if (!(await confirmBox(`Supprimer le paquet « ${deck.name} » ?`))) return; saveDecks(getDecks().filter(x => x.id !== deckId)); m.close(); };
  list();
}

// ---------- Import d'un cours ----------
const SCHEMA = {
  type: 'object',
  properties: {
    deck_name: { type: 'string', description: 'Titre court du paquet' },
    emoji: { type: 'string', description: 'Un seul emoji représentatif' },
    cards: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } }, required: ['question', 'answer'], additionalProperties: false } },
  },
  required: ['deck_name', 'emoji', 'cards'],
  additionalProperties: false,
};

function importDialog() {
  let file = null;
  const el = h(`<div class="stack">
    <label class="drop" data-drop><input type="file" hidden accept=".pdf,image/*,.txt,.md,.csv" data-file>
      <div class="big">📄</div><b data-fname>Dépose ton cours ici ou clique pour choisir</b><div class="small muted">PDF, photo de tes notes, ou fichier texte. Pour un Word/PowerPoint : exporte-le en PDF.</div></label>
    <div class="muted small" style="text-align:center">— ou colle le texte —</div>
    <textarea class="input" data-text rows="5" placeholder="Colle ici un passage de ton cours…"></textarea>
    <div class="grid g2">
      <label class="field">Nombre de cartes<select class="input" data-n><option>10</option><option selected>20</option><option>30</option><option>50</option></select></label>
      <label class="field">Focus (facultatif)<input class="input" data-focus placeholder="Ex. origines/insertions, tests cliniques"></label>
    </div>
    ${hasKey() ? '' : '<div class="callout y"><span class="ico">🔑</span><div>Sans clé IA, l\'appli crée les cartes à partir des lignes « terme : définition » du texte collé. Avec l\'IA (voir <a href="#/reglages">Réglages</a>), elle lit aussi les PDF et les photos et fait de vraies questions.</div></div>'}
    <div class="callout r" data-err hidden></div>
    <div class="modal-foot"><button class="btn" data-close>Annuler</button><button class="btn btn-primary" data-go>${icon('sparkles')} Créer les flashcards</button></div>
  </div>`);
  const m = modal({ title: 'Importer un cours', body: el });
  const drop = $('[data-drop]', el);
  const setFile = f => { file = f; $('[data-fname]', el).textContent = f ? `📎 ${f.name}` : ''; };
  $('[data-file]', el).onchange = e => setFile(e.target.files[0]);
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); };
  $('[data-go]', el).onclick = async () => {
    const text = $('[data-text]', el).value.trim();
    const n = +$('[data-n]', el).value;
    const focus = $('[data-focus]', el).value.trim();
    const err = $('[data-err]', el);
    err.hidden = true;
    if (!file && !text) { err.hidden = false; err.textContent = 'Ajoute un fichier ou colle du texte.'; return; }
    const btn = $('[data-go]', el);
    if (!hasKey()) {
      if (file && !/\.(txt|md|csv)$/i.test(file.name)) { err.hidden = false; err.innerHTML = 'Pour lire un PDF ou une photo, il faut connecter l\'IA dans <a href="#/reglages">Réglages</a>.'; return; }
      const src = text || await file.text();
      const cards = localCards(src).slice(0, n);
      if (!cards.length) { err.hidden = false; err.textContent = "Je n'ai pas trouvé de lignes « terme : définition ». Connecte l'IA pour une vraie génération."; return; }
      addDeck(file ? file.name.replace(/\.\w+$/, '') : 'Mon cours', '📘', cards);
      m.close();
      return;
    }
    btn.disabled = true;
    btn.innerHTML = '<span class="typing"><i></i><i></i><i></i></span> Lecture du cours…';
    try {
      const content = [];
      if (file) content.push(await fileBlock(file));
      if (text) content.push({ type: 'text', text: `Texte du cours :\n\n${text}` });
      content.push({ type: 'text', text: `Crée exactement ${n} flashcards de révision en français à partir de ce cours de kinésithérapie${focus ? `, en insistant sur : ${focus}` : ''}.
Règles : une seule notion par carte ; questions précises (pas de oui/non) ; réponses courtes et exactes (1 à 3 phrases, listes séparées par des virgules) ; couvre les notions les plus importantes et les plus susceptibles de tomber à l'examen ; reste fidèle au cours, n'invente rien. Donne aussi un titre court au paquet et un emoji.` });
      const res = await aiJson({ content, schema: SCHEMA });
      addDeck(res.deck_name, res.emoji, res.cards.map(c => ({ q: c.question, a: c.answer })));
      m.close();
    } catch (e) {
      err.hidden = false;
      err.textContent = e.message;
      btn.disabled = false;
      btn.innerHTML = `${icon('sparkles')} Réessayer`;
    }
  };
}

function localCards(src) {
  return src.split(/\n+/).map(l => l.trim().replace(/^[-•*\d.)\s]+/, '')).map(l => {
    const m = l.match(/^(.{2,80}?)\s*(?::|=|–|—| - )\s*(.{3,})$/);
    return m ? { q: `${m[1].trim()} ?`, a: m[2].trim() } : null;
  }).filter(Boolean);
}

function addDeck(name, emoji, cards) {
  const decks = getDecks();
  decks.unshift({ id: uid(), name, emoji: emoji || '📘', created: Date.now(), cards: cards.map(c => ({ id: uid(), q: c.q, a: c.a, box: 0, due: today() })) });
  saveDecks(decks);
  toast(`${cards.length} flashcards créées 🎉`);
  draw();
}

export default { render, onShow: draw };
