// Mode guerrier : musiques de motivation générées en direct (aucun fichier, fonctionne hors ligne)
// + cris de motivation à la voix + liens vers ses playlists.
import { store, esc, $, $$, toast, mmss } from '../core.js';
import { icon } from '../icons.js';
import { unlockAudio, speak, keepAwake } from '../audio.js';

// ---------- Instruments (Web Audio) ----------
let c, bus, noise;
function setup() {
  c = unlockAudio();
  if (!c || bus) return;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4;
  bus = c.createGain();
  bus.connect(comp).connect(c.destination);
  noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
const env = (t, peak, decay, attack = 0.003) => {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(bus);
  return g;
};
const osc = (type, f, t, dur, dest) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; };
const noiseSrc = (t, dur, dest) => { const s = c.createBufferSource(); s.buffer = noise; s.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur); return s; };
const filt = (type, f, q = 1, dest) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; };
let dist;
const distortion = () => {
  if (dist) return dist;
  dist = c.createWaveShaper();
  const k = 30, n = 1024, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; curve[i] = (3 + k) * x * 20 * Math.PI / 180 / (Math.PI + k * Math.abs(x)); }
  dist.curve = curve;
  const g = c.createGain(); g.gain.value = 0.5; dist.connect(g).connect(bus);
  return dist;
};

const I = {
  kick(t, v = 1, hard = false) {
    const g = env(t, v, 0.35);
    const o = osc('sine', 160, t, 0.4, hard ? (() => { const x = c.createGain(); x.gain.value = 1; x.connect(distortion()); x.connect(g); return x; })() : g);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
  },
  taiko(t, f = 70, v = 1) {
    const g = env(t, v, 0.9);
    const o = osc('sine', f * 1.7, t, 1, g);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.07);
    noiseSrc(t, 0.08, filt('lowpass', 700, 1, env(t, v * 0.5, 0.08)));
  },
  clap(t, v = 0.6) {
    const bp = filt('bandpass', 1400, 1.2, env(t, v, 0.18));
    for (let i = 0; i < 3; i++) noiseSrc(t + i * 0.011, 0.02, bp);
    noiseSrc(t + 0.033, 0.15, bp);
  },
  hat(t, v = 0.2, open = false) { noiseSrc(t, open ? 0.25 : 0.05, filt('highpass', 7500, 1, env(t, v, open ? 0.22 : 0.04))); },
  ching(t, v = 0.3, damped = false) {
    const g = env(t, v, damped ? 0.07 : 0.45, 0.001);
    [2350, 3620, 5210].forEach(f => osc('sine', f, t, damped ? 0.1 : 0.5, g));
    if (damped) noiseSrc(t, 0.05, filt('highpass', 5000, 1, env(t, v * 0.6, 0.05)));
  },
  bass(t, f, dur, v = 0.5) {
    const g = env(t, v, dur, 0.01);
    const lp = filt('lowpass', 380, 4, g);
    osc('sawtooth', f, t, dur, lp);
    osc('sine', f / 2, t, dur, g);
  },
  stab(t, freqs, dur = 0.18, v = 0.16) {
    const lp = filt('lowpass', 2600, 2, env(t, v, dur, 0.005));
    freqs.forEach(f => { osc('sawtooth', f * 0.996, t, dur, lp); osc('sawtooth', f * 1.004, t, dur, lp); });
  },
  pi(t, f, dur, v = 0.13) {
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.03);
    g.gain.setValueAtTime(v, t + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(bus);
    const bp = filt('bandpass', 1300, 0.9, g);
    const o = osc('sawtooth', f, t, dur, bp);
    const lfo = c.createOscillator(), depth = c.createGain();
    lfo.frequency.value = 5.8; depth.gain.value = f * 0.012;
    lfo.connect(depth).connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.05);
  },
};

// ---------- Morceaux ----------
const N = n => 440 * Math.pow(2, (n - 69) / 12); // numéro MIDI → Hz
const on = (pat, s) => pat[s % pat.length] === 'x';
let piState = { i: 4, left: 0 };
const SCALE = [62, 65, 67, 69, 72, 74, 77, 79, 81].map(N); // ré mineur pentatonique

const STYLES = {
  tambours: {
    name: 'Tambours de guerre', em: '🥁', bpm: 96, desc: 'Taikos, basse grave, ambiance entrée dans la cage.',
    step(s, t, bar, dur) {
      const st = s % 16;
      if (on('x..x..x.x..x..x.', st)) I.taiko(t, st === 0 ? 55 : 68, st === 0 ? 1 : 0.75);
      if (on('....x.......x.x.', st)) I.taiko(t, 118, 0.45);
      if (on('....x.......x...', st)) I.clap(t, 0.45);
      if (on('..x...x...x...x.', st)) I.hat(t, 0.08);
      if (st === 0) {
        I.bass(t, [N(38), N(38), N(34), N(36)][bar % 4], dur * 16, 0.35);
        if (bar % 4 === 0) I.kick(t, 1, true);
      }
      if (bar % 8 === 7 && st >= 8) I.taiko(t, 90 + st * 3, 0.5); // roulement avant la reprise
    },
  },
  hardstyle: {
    name: 'Énergie hardstyle', em: '⚡', bpm: 150, desc: 'Kick lourd, basse qui cogne : idéal pour le sac.',
    step(s, t, bar, dur) {
      const st = s % 16;
      const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
      const ch = chords[bar % 4].map(N);
      if (st % 4 === 0) I.kick(t, 1, true);
      if (st % 4 === 2) I.bass(t, ch[0] / 2, dur * 1.6, 0.4);
      if (st % 2 === 1) I.hat(t, 0.07);
      if (st % 4 === 2) I.hat(t, 0.1, true);
      if (on('....x.......x...', st)) I.clap(t, 0.5);
      if (on('x..x..x...x.....', st)) I.stab(t, ch.map(f => f * 2), 0.16);
      if (bar % 8 === 7 && st >= 12) I.clap(t, 0.3);
    },
  },
  sarama: {
    name: 'Sarama muay thaï', em: '🇹🇭', bpm: 138, desc: "Pi java, ching et tambours : la musique des combats au Lumpinee.",
    step(s, t, bar, dur) {
      const st = s % 16;
      if (st % 4 === 0) I.ching(t, 0.22, st % 8 === 4);
      if (st % 8 === 4) I.ching(t, 0.22, true);
      if (on('x..x.x..x..x.x..', st)) I.taiko(t, st % 8 < 4 ? 150 : 115, 0.55);
      if (on('x.......x.......', st)) I.taiko(t, 70, 0.6);
      // mélodie du pi : marche aléatoire dans la gamme, notes de 1 à 4 croches
      if (st % 2 === 0) {
        if (piState.left <= 0) {
          const move = [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
          piState.i = Math.max(0, Math.min(SCALE.length - 1, piState.i + move));
          const len = [1, 1, 2, 2, 3, 4][Math.floor(Math.random() * 6)];
          piState.left = len;
          if (Math.random() < 0.15 && len >= 2) { // trille
            const a = SCALE[piState.i], b = SCALE[Math.min(SCALE.length - 1, piState.i + 1)];
            for (let k = 0; k < len * 2; k++) I.pi(t + k * dur, k % 2 ? b : a, dur * 1.05);
          } else I.pi(t, SCALE[piState.i], len * 2 * dur * 0.98);
        }
        piState.left--;
      }
    },
  },
};

const SHOUTS = [
  'Lève ta garde !', 'Encore un round, champion !', "Respire, et remets-en une couche !", 'Tu es un guerrier, Matteo !',
  'Le travail paie, toujours !', "Personne ne s'entraîne comme toi !", 'Frappe avec les hanches !', 'Jab, cross, et on avance !',
  'La douleur est temporaire, la fierté est pour toujours !', 'Pas de pitié pour le sac !', 'Plus vite, plus fort !',
  "C'est maintenant que ça se joue !", 'Reste lucide, reste dangereux !', 'Allez, force ! Força, Matteo !',
];

// ---------- Lecteur ----------
let playing = false, style = null, timer = null, nextTime = 0, stepN = 0, started = 0, shoutAt = 0, tickUI = null, root;
const cfg = () => ({ style: 'tambours', vol: 0.8, voice: true, playlist: '', ...store.get('guerrier', {}) });
const setCfg = p => store.set('guerrier', { ...cfg(), ...p });

function schedule() {
  const st = STYLES[style];
  const dur = 60 / st.bpm / 4;
  while (nextTime < c.currentTime + 0.12) {
    st.step(stepN, nextTime, Math.floor(stepN / 16), dur);
    nextTime += dur;
    stepN++;
  }
  if (cfg().voice && Date.now() > shoutAt) {
    speak(SHOUTS[Math.floor(Math.random() * SHOUTS.length)], { rate: 1.05 });
    shoutAt = Date.now() + 16000 + Math.random() * 12000;
  }
}

function start(s = cfg().style) {
  setup();
  if (!c) return toast("Le son n'est pas disponible sur ce navigateur");
  stop(true);
  style = s;
  bus.gain.cancelScheduledValues(c.currentTime);
  bus.gain.setValueAtTime(cfg().vol, c.currentTime);
  playing = true;
  stepN = 0; piState = { i: 4, left: 0 };
  nextTime = c.currentTime + 0.08;
  started = Date.now();
  shoutAt = Date.now() + (cfg().voice ? 9000 : 1e12);
  if (cfg().voice) speak('Mode guerrier activé !', { rate: 1 });
  timer = setInterval(schedule, 25);
  keepAwake(true);
  draw();
}
function stop(silent = false) {
  if (!playing) return;
  playing = false;
  clearInterval(timer);
  if (bus) { const g = bus.gain; g.cancelScheduledValues(c.currentTime); g.setValueAtTime(g.value, c.currentTime); g.linearRampToValueAtTime(0.0001, c.currentTime + 0.3); setTimeout(() => { if (!playing) g.value = cfg().vol; }, 400); }
  window.speechSynthesis?.cancel();
  keepAwake(false);
  if (!silent) draw();
}
export const isWarrior = () => playing;

function render(el) {
  root = el;
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Combat</div><h1>Mode guerrier</h1><p>Un bouton, et la musique te met dans le combat. Tu peux ensuite passer au minuteur de rounds : la musique continue.</p></div>
    </div>
    <div class="card warrior" data-stage>
      <button class="war-btn" data-go><span class="war-ico">⚔️</span><span class="war-lbl">Mode guerrier</span><span class="war-sub" data-sub>Appuie pour lancer</span></button>
      <div class="chips" data-styles style="justify-content:center">${Object.entries(STYLES).map(([k, s]) => `<button class="chip" data-style="${k}">${s.em} ${esc(s.name)}</button>`).join('')}</div>
      <p class="small muted" data-desc style="text-align:center;margin:0"></p>
    </div>
    <div class="grid g2 mt">
      <div class="card stack">
        <h2>Réglages</h2>
        <label class="field"><span>Volume</span><input type="range" min="0.1" max="1" step="0.05" data-vol></label>
        <label class="check"><input type="checkbox" data-voice> Cris de motivation à la voix</label>
        <a class="btn btn-sm" href="#/rounds">${icon('timer')} Aller au minuteur de rounds</a>
        <p class="tiny muted" style="margin:0">Les musiques sont créées en direct par l'appli : elles marchent même sans réseau.</p>
      </div>
      <div class="card stack">
        <h2>Tes playlists</h2>
        <div class="links" style="grid-template-columns:1fr">
          <a class="link-card" target="_blank" rel="noopener" href="https://open.spotify.com/search/fight%20motivation%20workout/playlists"><span class="em">🎧</span><span><b>Spotify · Fight motivation</b><small>Playlists d'entraînement combat</small></span></a>
          <a class="link-card" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=musique+motivation+combat+entrainement+boxe"><span class="em">▶️</span><span><b>YouTube · Motivation combat</b><small>Mix pour le sac et le shadow</small></span></a>
          <a class="link-card" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=sarama+muay+thai+music"><span class="em">🇹🇭</span><span><b>YouTube · Vraie sarama</b><small>La musique traditionnelle des combats</small></span></a>
          <a class="link-card" data-mine hidden target="_blank" rel="noopener"><span class="em">💛</span><span><b>Ma playlist</b><small data-mine-url></small></span></a>
        </div>
        <div class="row"><input class="input" data-pl placeholder="Colle le lien de ta playlist (Spotify, YouTube…)" style="flex:1"><button class="btn btn-sm" data-save-pl>Enregistrer</button></div>
      </div>
    </div>`;
  $('[data-go]', el).onclick = () => playing ? stop() : start();
  $$('[data-style]', el).forEach(b => b.onclick = () => { setCfg({ style: b.dataset.style }); if (playing) start(b.dataset.style); else draw(); });
  $('[data-vol]', el).oninput = e => { setCfg({ vol: +e.target.value }); if (bus) bus.gain.value = +e.target.value; };
  $('[data-voice]', el).onchange = e => { setCfg({ voice: e.target.checked }); shoutAt = e.target.checked ? Date.now() + 4000 : 1e15; };
  $('[data-save-pl]', el).onclick = () => {
    const v = $('[data-pl]', el).value.trim();
    if (v && !/^https?:\/\//.test(v)) return toast('Colle un lien qui commence par https://');
    setCfg({ playlist: v }); draw(); toast(v ? 'Playlist enregistrée' : 'Playlist retirée');
  };
  draw();
}

function draw() {
  if (!root) return;
  const k = cfg();
  const cur = playing ? style : k.style;
  const st = STYLES[cur];
  const stage = $('[data-stage]', root);
  stage.classList.toggle('on', playing);
  stage.style.setProperty('--beat', `${60 / st.bpm}s`);
  $$('[data-style]', root).forEach(b => b.classList.toggle('on', b.dataset.style === cur));
  $('[data-desc]', root).textContent = `${st.desc} · ${st.bpm} BPM`;
  $('[data-vol]', root).value = k.vol;
  $('[data-voice]', root).checked = k.voice;
  $('[data-pl]', root).value = k.playlist;
  const mine = $('[data-mine]', root);
  mine.hidden = !k.playlist;
  if (k.playlist) { mine.href = k.playlist; $('[data-mine-url]', root).textContent = k.playlist.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40); }
  clearInterval(tickUI);
  const sub = $('[data-sub]', root);
  if (playing) {
    const upd = () => { sub.textContent = `${st.em} ${st.name} · ${mmss((Date.now() - started) / 1000)} · touche pour arrêter`; };
    upd(); tickUI = setInterval(upd, 1000);
  } else sub.textContent = 'Appuie pour lancer';
}

export default { render, onShow: draw };
