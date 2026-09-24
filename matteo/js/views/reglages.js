// Réglages : IA (clé API + modèle), apparence, installation sur le téléphone, sauvegarde des données.
import { store, esc, $, $$, toast, confirmBox, today } from '../core.js';
import { icon } from '../icons.js';
import { MODELS, testKey } from '../ai.js';

let root;

function render(el) {
  root = el;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  el.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Réglages</div><h1>Réglages</h1><p>Connexion de l'IA, apparence, installation et sauvegarde.</p></div></div>
    <div class="grid g2">
      <div class="card stack">
        <h2>🤖 Intelligence artificielle</h2>
        <p class="small muted" style="margin:0">L'assistant, la création de flashcards et les idées de recettes utilisent Claude (Anthropic). Il faut une clé API personnelle :</p>
        <ol class="small" style="margin:0;padding-left:20px;color:var(--text-2)">
          <li>Crée un compte sur <a href="https://console.anthropic.com" target="_blank" rel="noopener">console.anthropic.com</a></li>
          <li>Ajoute quelques euros de crédit (Billing) : 5 € durent longtemps pour un usage perso</li>
          <li>Va dans « API Keys », crée une clé et colle-la ici</li>
        </ol>
        <label class="field">Clé API<input class="input" type="password" data-key placeholder="sk-ant-…" autocomplete="off" value="${esc(store.get('apiKey', ''))}"></label>
        <label class="field">Modèle<select class="input" data-model>${MODELS.map(m => `<option value="${m.id}" ${store.get('model', MODELS[0].id) === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}</select></label>
        <div class="row"><button class="btn btn-primary" data-save-key>${icon('check')} Enregistrer</button><button class="btn" data-test>Tester la connexion</button><span class="small" data-test-res></span></div>
        <p class="tiny muted" style="margin:0">La clé reste uniquement sur cet appareil et n'est envoyée qu'à l'API d'Anthropic. Ne la partage avec personne.</p>
      </div>

      <div class="stack">
        <div class="card stack">
          <h2>🎨 Apparence & profil</h2>
          <label class="field">Prénom<input class="input" data-name value="${esc(store.get('name', 'Matteo'))}"></label>
          <div><div class="small" style="color:var(--text-2);font-weight:500;margin-bottom:6px">Thème</div><div class="seg" data-themes><button data-v="dark">Sombre</button><button data-v="light">Clair</button><button data-v="auto">Auto</button></div></div>
        </div>
        <div class="card stack">
          <h2>📱 Installer sur le téléphone</h2>
          ${standalone ? '<div class="callout g"><span class="ico">✅</span><div>L\'appli est installée. Elle fonctionne même sans réseau (sauf l\'IA et la météo du surf).</div></div>' : isIOS ? `<div class="callout"><span class="ico">🍏</span><div><b>iPhone :</b> ouvre ce site dans <b>Safari</b>, touche le bouton <b>Partager</b> (carré avec une flèche), puis <b>« Sur l'écran d'accueil »</b>.</div></div>` : `<div class="callout"><span class="ico">🤖</span><div><b>Android :</b> dans Chrome, menu <b>⋮</b> → <b>« Installer l'application »</b> (ou « Ajouter à l'écran d'accueil »).</div></div><button class="btn btn-primary" data-install hidden>${icon('download')} Installer maintenant</button>`}
        </div>
      </div>
    </div>

    <div class="card mt stack">
      <h2>💾 Sauvegarde</h2>
      <p class="small muted" style="margin:0">Toutes tes données (planning, journal, flashcards, poids…) sont enregistrées dans ce navigateur. Exporte une sauvegarde de temps en temps, ou pour passer sur un autre appareil.</p>
      <div class="row">
        <button class="btn" data-export>${icon('download')} Exporter mes données</button>
        <label class="btn">${icon('upload')} Importer une sauvegarde<input type="file" accept=".json,application/json" hidden data-import></label>
        <div class="spacer"></div>
        <button class="btn btn-ghost btn-danger" data-wipe>${icon('trash')} Tout effacer</button>
      </div>
      <p class="tiny muted" style="margin:0">La clé API n'est jamais incluse dans l'export.</p>
    </div>
    <p class="tiny muted mt" style="text-align:center">Fait avec ❤️ pour Matteo · Porto 🇵🇹</p>`;

  $('[data-save-key]', el).onclick = () => {
    store.set('apiKey', $('[data-key]', el).value.trim());
    store.set('model', $('[data-model]', el).value);
    toast('Réglages IA enregistrés');
  };
  $('[data-model]', el).onchange = e => store.set('model', e.target.value);
  $('[data-test]', el).onclick = async () => {
    store.set('apiKey', $('[data-key]', el).value.trim());
    const res = $('[data-test-res]', el);
    res.textContent = 'Test…';
    try { await testKey(); res.innerHTML = '<span style="color:var(--green)">✓ Connecté !</span>'; }
    catch (e) { res.innerHTML = `<span style="color:var(--red)">✗ ${esc(e.status === 401 ? 'Clé invalide' : e.message)}</span>`; }
  };
  $('[data-name]', el).onchange = e => { store.set('name', e.target.value.trim() || 'Matteo'); toast('Prénom enregistré'); };
  const syncTheme = () => $$('[data-themes] button', el).forEach(b => b.classList.toggle('on', b.dataset.v === store.get('theme', 'dark')));
  $$('[data-themes] button', el).forEach(b => b.onclick = () => { store.set('theme', b.dataset.v); window.dispatchEvent(new Event('mt:theme')); syncTheme(); });
  syncTheme();

  const inst = $('[data-install]', el);
  if (inst) import('../main.js').then(m => { if (m.canInstall()) { inst.hidden = false; inst.onclick = m.promptInstall; } });

  $('[data-export]', el).onclick = () => {
    const data = {};
    for (const k of store.keys()) if (k !== 'apiKey' && k !== 'surfCache') data[k] = store.get(k);
    const blob = new Blob([JSON.stringify({ app: 'matteo', version: 1, date: today(), data }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `matteo-sauvegarde-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('[data-import]', el).onchange = async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const json = JSON.parse(await f.text());
      if (json.app !== 'matteo' || !json.data) throw new Error();
      if (!(await confirmBox('Remplacer les données actuelles par cette sauvegarde ?'))) return;
      for (const [k, v] of Object.entries(json.data)) if (k !== 'apiKey') store.set(k, v);
      toast('Sauvegarde importée');
      setTimeout(() => location.reload(), 600);
    } catch (err) { toast("Ce fichier n'est pas une sauvegarde valide"); }
  };
  $('[data-wipe]', el).onclick = async () => {
    if (!(await confirmBox('Effacer TOUTES les données de l\'appli (sauf la clé API) ? C\'est définitif.'))) return;
    for (const k of store.keys()) if (k !== 'apiKey') store.remove(k);
    location.reload();
  };
}

export default { render };
