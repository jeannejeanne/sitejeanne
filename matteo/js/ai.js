// Connexion à Claude (API Anthropic) directement depuis le navigateur.
// La clé API reste sur l'appareil de Matteo (localStorage), elle n'est envoyée qu'à api.anthropic.com.
import { store, today, fmtDay, age } from './core.js';

export const MODELS = [
  { id: 'claude-opus-5', label: 'Claude Opus 5 — le plus intelligent (recommandé)' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 — rapide et moins cher' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 — ultra rapide, le moins cher' },
];

export class NoKeyError extends Error { constructor() { super("Aucune clé API : ajoute-la dans Réglages."); } }

let sdk = null;
async function client() {
  const apiKey = store.get('apiKey', '').trim();
  if (!apiKey) throw new NoKeyError();
  if (!sdk) sdk = (await import('../vendor/anthropic-sdk.js')).default;
  return new sdk({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
}

export const hasKey = () => !!store.get('apiKey', '').trim();
export const currentModel = () => store.get('model', MODELS[0].id);

// Paramètres communs selon le modèle choisi
function buildParams(extra) {
  const model = currentModel();
  const p = { model, max_tokens: 64000, ...extra };
  if (model !== 'claude-haiku-4-5') {
    p.output_config = { effort: 'medium', ...(extra.output_config || {}) };
  }
  if (model === 'claude-haiku-4-5' && p.output_config) {
    delete p.output_config.effort; // Haiku n'accepte pas ce réglage
    if (!Object.keys(p.output_config).length) delete p.output_config;
  }
  // Opus 5 : si un filtre de sécurité refuse à tort, l'API relance sur un autre modèle
  const beta = model === 'claude-opus-5';
  if (beta) { p.betas = ['server-side-fallback-2026-07-01']; p.fallbacks = 'default'; }
  return { p, beta };
}

function explain(err) {
  if (err instanceof NoKeyError) return err.message;
  const status = err?.status;
  if (status === 401) return 'Clé API invalide. Vérifie-la dans Réglages.';
  if (status === 403) return "Accès refusé par l'API (clé ou organisation).";
  if (status === 429) return "Trop de demandes d'un coup, réessaie dans quelques secondes.";
  if (status === 400 && /credit|balance/i.test(err.message)) return "Plus de crédit sur le compte Anthropic : recharge sur console.anthropic.com.";
  if (status >= 500) return "Les serveurs de Claude sont surchargés, réessaie dans un instant.";
  if (err?.name === 'AbortError' || /abort/i.test(err?.message || '')) return 'Réponse interrompue.';
  if (!navigator.onLine) return 'Pas de connexion internet.';
  return err?.message || 'Erreur inconnue.';
}

// Contexte perso injecté dans chaque conversation
export function systemPrompt(extraContext = '') {
  const name = store.get('name', 'Matteo');
  return [
    {
      type: 'text',
      text: `Tu es le coach et assistant perso de ${name}, intégré à son appli "Matteo".
À propos de lui : né le 7 mai 2004, étudiant en kinésithérapie (fisioterapia) à Porto, au Portugal. Il pratique la boxe thaïlandaise (muay thaï) et le MMA, et il surfe à Matosinhos. Il est français et vit au Portugal. Sa copine s'appelle Jeanne : c'est elle qui lui a offert cette appli, et elle le surnomme « Chérichou ».
Ta façon de répondre :
- Toujours en français, tutoiement, ton direct, chaleureux et motivant, comme un pote qui s'y connaît. Pas de blabla.
- Réponses claires et structurées (listes, titres courts en markdown quand c'est utile). Va à l'essentiel, développe si la question le demande.
- Pour l'anatomie, la physiologie, la rééducation : sois précis et rigoureux comme pour un étudiant en kiné (origines, insertions, innervations, actions, tests cliniques) et signale quand un point mérite d'être vérifié dans son cours.
- Pour l'entraînement (muay thaï, MMA, boxe, prépa physique, surf) : conseils concrets, techniques, progressifs, avec la sécurité en tête (pas de coupe de poids dangereuse, gestion des blessures, récupération).
- Nutrition : équilibrée et réaliste pour un étudiant sportif, avec des produits qu'on trouve au Portugal.
- Pour la vie à Porto : tu peux donner des tips pratiques et du vocabulaire portugais (portugais du Portugal).
- Si une question touche à une blessure sérieuse ou à la santé, conseille de voir un médecin sans dramatiser.`,
    },
    {
      type: 'text',
      text: `Contexte du jour : nous sommes le ${fmtDay(today())} (${today()}). ${name} a ${age()} ans.${extraContext ? '\n' + extraContext : ''}`,
    },
  ];
}

/**
 * Conversation en streaming.
 * onText(delta, fullText) est appelé au fil de la réponse.
 */
export async function chat({ messages, system, onText, signal, effort }) {
  try {
    const c = await client();
    const { p, beta } = buildParams({ system: system || systemPrompt(), messages, ...(effort ? { output_config: { effort } } : {}) });
    const api = beta ? c.beta.messages : c.messages;
    const stream = api.stream(p, { signal });
    stream.on('text', (delta, snapshot) => onText && onText(delta, snapshot));
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') throw Object.assign(new Error("Claude a préféré ne pas répondre à cette demande. Reformule-la autrement."), { status: 0 });
    return msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
  } catch (err) {
    throw new Error(explain(err));
  }
}

/**
 * Demande une réponse JSON conforme à un schéma (structured outputs).
 */
export async function json({ content, schema, system, signal }) {
  try {
    const c = await client();
    const { p, beta } = buildParams({
      system: system || systemPrompt(),
      messages: [{ role: 'user', content }],
      output_config: { format: { type: 'json_schema', schema } },
    });
    const api = beta ? c.beta.messages : c.messages;
    const msg = await api.stream(p, { signal }).finalMessage();
    if (msg.stop_reason === 'refusal') throw Object.assign(new Error('Demande refusée par Claude.'), { status: 0 });
    if (msg.stop_reason === 'max_tokens') throw Object.assign(new Error('Document trop long : réduis le nombre de cartes ou découpe le cours.'), { status: 0 });
    const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
    return JSON.parse(text);
  } catch (err) {
    throw new Error(explain(err));
  }
}

// Petit test de la clé
export async function testKey() {
  const c = await client();
  const res = await c.messages.create({ model: 'claude-haiku-4-5', max_tokens: 16, messages: [{ role: 'user', content: 'Réponds juste "OK".' }] });
  return res.content[0]?.text || 'OK';
}

// Transforme un fichier en bloc de contenu pour Claude
export async function fileBlock(file) {
  const { fileToBase64 } = await import('./core.js');
  const type = file.type || '';
  if (type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: await fileToBase64(file) }, title: file.name };
  }
  if (/^image\/(png|jpe?g|gif|webp)$/.test(type)) {
    return { type: 'image', source: { type: 'base64', media_type: type === 'image/jpg' ? 'image/jpeg' : type, data: await fileToBase64(file) } };
  }
  if (/^text\/|json|csv|markdown/.test(type) || /\.(txt|md|csv|json|html?)$/i.test(file.name)) {
    const text = await file.text();
    return { type: 'document', source: { type: 'text', media_type: 'text/plain', data: text }, title: file.name };
  }
  throw new Error('Format non pris en charge : utilise un PDF, une image (photo du cours) ou un fichier texte. Pour un Word/PowerPoint, exporte-le en PDF.');
}
