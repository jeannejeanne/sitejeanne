// Portugais express (portugais du Portugal) : phrases utiles, avec prononciation par la voix du téléphone.
import { store, esc, $, $$ } from '../core.js';
import { icon } from '../icons.js';
import { speak } from '../audio.js';

const CATS = {
  base: { name: '👋 Essentiels', list: [
    ['Bonjour / bon après-midi / bonsoir', 'Bom dia / Boa tarde / Boa noite'],
    ['Merci (dit par un homme)', 'Obrigado'],
    ['Excusez-moi', 'Com licença / Desculpe'],
    ['Je ne comprends pas, vous pouvez répéter ?', 'Não percebo, pode repetir?'],
    ['Vous pouvez parler plus lentement ?', 'Pode falar mais devagar?'],
    ['Comment ça se dit en portugais ?', 'Como se diz em português?'],
    ['Pas de souci / c\'est bon', 'Não há problema / Está bem'],
    ['À plus tard / à demain', 'Até logo / Até amanhã'],
  ] },
  fac: { name: '🩺 Fac & stage de kiné', list: [
    ['Kinésithérapie', 'Fisioterapia'],
    ['Où avez-vous mal ?', 'Onde lhe dói?'],
    ['Depuis combien de temps avez-vous cette douleur ?', 'Há quanto tempo tem esta dor?'],
    ['Sur une échelle de 0 à 10, combien ?', 'Numa escala de zero a dez, quanto?'],
    ['Allongez-vous sur le dos / sur le ventre', 'Deite-se de barriga para cima / para baixo'],
    ['Pliez le genou', 'Dobre o joelho'],
    ['Tendez la jambe', 'Estique a perna'],
    ['Levez le bras', 'Levante o braço'],
    ['Respirez profondément', 'Respire fundo'],
    ['Détendez-vous', 'Relaxe'],
    ['Ça fait mal quand je fais ça ?', 'Dói quando faço isto?'],
    ['On va faire quelques exercices', 'Vamos fazer alguns exercícios'],
    ['Quand est l\'examen ?', 'Quando é o exame?'],
  ] },
  corps: { name: '🦴 Le corps', list: [
    ['La tête / le cou', 'A cabeça / o pescoço'],
    ['L\'épaule / le coude / le poignet', 'O ombro / o cotovelo / o pulso'],
    ['La main / les doigts', 'A mão / os dedos'],
    ['Le dos / la colonne vertébrale', 'As costas / a coluna vertebral'],
    ['La hanche / la cuisse', 'A anca / a coxa'],
    ['Le genou / la jambe', 'O joelho / a perna'],
    ['La cheville / le pied', 'O tornozelo / o pé'],
    ['Le muscle / l\'os / le tendon', 'O músculo / o osso / o tendão'],
    ['L\'articulation / le ligament', 'A articulação / o ligamento'],
    ['Une entorse / une fracture', 'Uma entorse / uma fratura'],
  ] },
  sport: { name: '🥊 Salle de sport & fight', list: [
    ['Salle de sport', 'Ginásio'],
    ['Je fais de la boxe thaï et du MMA', 'Faço muay thai e MMA'],
    ['À quelle heure est le cours ?', 'A que horas é a aula?'],
    ['Combien coûte l\'abonnement mensuel ?', 'Quanto custa a mensalidade?'],
    ['On fait du sparring ?', 'Vamos fazer sparring?'],
    ['Doucement / plus fort', 'Devagar / com mais força'],
    ['Je suis crevé', 'Estou exausto / Estou morto'],
    ['Bien joué !', 'Boa! / Muito bem!'],
  ] },
  surf: { name: '🏄 Surf & plage', list: [
    ['Les vagues sont bonnes aujourd\'hui ?', 'As ondas estão boas hoje?'],
    ['La mer est agitée / calme', 'O mar está agitado / calmo'],
    ['La marée monte / descend', 'A maré está a subir / a descer'],
    ['Je voudrais louer une planche', 'Queria alugar uma prancha'],
    ['Une combinaison', 'Um fato de surf'],
    ['Le courant est fort', 'A corrente está forte'],
  ] },
  vie: { name: '☕ Vie quotidienne à Porto', list: [
    ['Un café (expresso), s\'il vous plaît', 'Um café, por favor'],
    ['Un « galão » (café au lait en verre)', 'Um galão, por favor'],
    ['L\'addition, s\'il vous plaît', 'A conta, por favor'],
    ['Ça coûte combien ?', 'Quanto custa?'],
    ['Je peux payer par carte ?', 'Posso pagar com cartão?'],
    ['Où est la station de métro ?', 'Onde é a estação de metro?'],
    ['Un aller simple pour Matosinhos', 'Um bilhete para Matosinhos'],
    ['Je voudrais un sandwich au porc (bifana)', 'Queria uma bifana'],
    ['C\'est délicieux !', 'Está delicioso!'],
    ['Fixe ! (cool, très portugais)', 'Fixe!'],
  ] },
};

let root, cat = 'base';

function render(el) {
  root = el;
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Études · vie à Porto</div><h1>Portugais express</h1><p>Les phrases qui servent vraiment : en cours, en stage, à la salle, à la plage. Touche 🔊 pour entendre la prononciation portugaise.</p></div>
    </div>
    <div class="card mb" data-daily></div>
    <div class="chips mb" data-cats>${Object.entries(CATS).map(([k, c]) => `<button class="chip" data-cat="${k}">${c.name}</button>`).join('')}</div>
    <div class="grid g2" data-list></div>`;
  $$('[data-cat]', el).forEach(b => b.onclick = () => { cat = b.dataset.cat; draw(); });
  const all = Object.values(CATS).flatMap(c => c.list);
  const d = new Date();
  const [fr, pt] = all[(d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % all.length];
  $('[data-daily]', el).innerHTML = `<div class="row between"><div><div class="eyebrow">Phrase du jour</div><div style="font-family:var(--font-display);font-size:24px;font-weight:700">${esc(pt)}</div><div class="muted">${esc(fr)}</div></div><button class="icon-btn" data-say-daily aria-label="Écouter">${icon('volume')}</button></div>`;
  $('[data-say-daily]', el).onclick = () => speak(pt, { lang: 'pt-PT', rate: 0.9 });
  draw();
}

function draw() {
  $$('[data-cat]', root).forEach(b => b.classList.toggle('on', b.dataset.cat === cat));
  const list = CATS[cat].list;
  $('[data-list]', root).innerHTML = list.map(([fr, pt], i) => `<div class="phrase"><div><div class="pt">${esc(pt)}</div><div class="fr">${esc(fr)}</div></div><button class="icon-btn sm say" data-i="${i}" aria-label="Écouter">${icon('volume')}</button></div>`).join('');
  $$('[data-i]', root).forEach(b => b.onclick = () => speak(list[+b.dataset.i][1], { lang: 'pt-PT', rate: 0.9 }));
}

export default { render };
