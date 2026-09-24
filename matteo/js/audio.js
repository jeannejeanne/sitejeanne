// Sons synthétisés (aucun fichier audio) + synthèse vocale.
let ctx = null;

// À appeler lors d'un clic : iOS n'autorise le son qu'après une action de l'utilisateur.
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function out(volume = 1) {
  const c = unlockAudio();
  if (!c) return null;
  const g = c.createGain();
  g.gain.value = volume;
  g.connect(c.destination);
  return { c, g };
}

// Cloche de ring : partiels inharmoniques d'une cloche en laiton, décroissance longue.
export function bell(times = 1, gap = 0.28, volume = 0.9) {
  const o = out(volume);
  if (!o) return;
  const { c, g } = o;
  const base = 760;
  const partials = [[1, 1], [2.02, 0.55], [2.76, 0.42], [5.4, 0.22], [8.93, 0.1]];
  for (let n = 0; n < times; n++) {
    const t0 = c.currentTime + 0.02 + n * gap;
    for (const [ratio, amp] of partials) {
      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = base * ratio;
      const decay = 2.6 / Math.sqrt(ratio);
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(0.35 * amp, t0 + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
      osc.connect(env).connect(g);
      osc.start(t0);
      osc.stop(t0 + decay + 0.05);
    }
    // petit « clang » métallique à l'impact
    const noise = c.createBufferSource();
    const buf = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    noise.buffer = buf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3500;
    const ng = c.createGain(); ng.gain.value = 0.25;
    noise.connect(bp).connect(ng).connect(g);
    noise.start(t0);
  }
}

// « Clap » des 10 dernières secondes (claquoir en bois)
export function clapper(times = 2, volume = 0.9) {
  const o = out(volume);
  if (!o) return;
  const { c, g } = o;
  for (let n = 0; n < times; n++) {
    const t0 = c.currentTime + 0.02 + n * 0.14;
    const src = c.createBufferSource();
    const buf = c.createBuffer(1, c.sampleRate * 0.06, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
    src.buffer = buf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.5;
    const ng = c.createGain(); ng.gain.value = 1.2;
    src.connect(bp).connect(ng).connect(g);
    src.start(t0);
  }
}

export function beep(freq = 880, dur = 0.12, volume = 0.35) {
  const o = out(volume);
  if (!o) return;
  const { c, g } = o;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const t0 = c.currentTime + 0.01;
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(1, t0 + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env).connect(g);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// Synthèse vocale
let voices = [];
function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

export function speak(text, { lang = 'fr-FR', rate = 1.05, interrupt = true } = {}) {
  if (!window.speechSynthesis) return;
  if (interrupt) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const exact = voices.filter(v => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
  const pick = exact.find(v => /google|premium|enhanced|natural/i.test(v.name)) || exact[0]
    || voices.find(v => v.lang.slice(0, 2) === lang.slice(0, 2));
  if (pick) u.voice = pick;
  speechSynthesis.speak(u);
}
export const canSpeak = () => 'speechSynthesis' in window;

// Garde l'écran allumé pendant un minuteur
let lock = null;
export async function keepAwake(onOff) {
  try {
    if (onOff && 'wakeLock' in navigator && !lock) {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    } else if (!onOff && lock) { await lock.release(); lock = null; }
  } catch (e) { /* non supporté : pas grave */ }
}
