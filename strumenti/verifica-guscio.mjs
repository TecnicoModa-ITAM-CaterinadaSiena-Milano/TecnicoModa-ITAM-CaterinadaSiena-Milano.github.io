// Il guscio delle 99 pagine e' lo stesso modello?
//
// Tolgo dal guscio (testata + menu + percorso + pie di pagina) tutto cio' che
// puo' variare per definizione: titolo, descrizione, collegamenti, voci marcate
// come correnti, percorso di navigazione, identificativi dei pannelli e
// versione dei fogli di stile. Se dopo questa pulizia resta una forma sola,
// il guscio si puo' ricostruire da un unico modello.
//
// index.html (pagina di accesso) e 404.html sono fuori: sono due pagine a se.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SPECIALI = new Set(['index.html', '404.html']);

const pagine = [];
(function cerca(dir) {
  for (const voce of fs.readdirSync(dir, { withFileTypes: true })) {
    if (voce.name.startsWith('.') || voce.name === 'strumenti') continue;
    const pieno = path.join(dir, voce.name);
    if (voce.isDirectory()) cerca(pieno);
    else if (voce.name.endsWith('.html')) pagine.push(pieno);
  }
})(ROOT);
pagine.sort();

function maschera(testo) {
  return testo
    .replace(/<title>[\s\S]*?<\/title>/, '<title>#</title>')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="#">')
    .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="#">')
    .replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="#">')
    .replace(/<meta property="og:image" content="[^"]*">/, '<meta property="og:image" content="#">')
    .replace(/(?:href|src|data-gate)="[^"]*"/g, '$1="#"')
    .replace(/aria-current="(true|page)"/g, 'aria-current')
    .replace(/\n[ \t]*<nav class="percorso"[\s\S]*?<\/nav>/, '\n#BRICIOLE#')
    .replace(/(id|aria-controls)="pannello-[^"]*"/g, '$1="pannello"')
    .replace(/\?v=\d+/g, '?v');
}

const forme = new Map();
const speciali = [];
let senzaMain = [];

for (const file of pagine) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (SPECIALI.has(rel)) { speciali.push(rel); continue; }

  const testo = fs.readFileSync(file, 'utf8');
  const i = testo.indexOf('<main id="contenuto">');
  if (i < 0) { senzaMain.push(rel); continue; }

  const guscio = maschera(testo.slice(0, i));
  if (!forme.has(guscio)) forme.set(guscio, []);
  forme.get(guscio).push(rel);
}

console.log('pagine esaminate: ' + (pagine.length - speciali.length - senzaMain.length));
console.log('forme di guscio dopo la pulizia: ' + forme.size);
console.log('pagine speciali messe da parte: ' + speciali.join(', '));
if (senzaMain.length) console.log('pagine senza <main id="contenuto">: ' + senzaMain.join(', '));

const tutte = [...forme.keys()];
let n = 0;
for (const g of tutte) {
  n++;
  const liste = forme.get(g);
  console.log('\n--- forma ' + n + ': ' + liste.length + ' pagine');
  if (liste.length <= 6) liste.forEach(l => console.log('      ' + l));
  else console.log('      (esempio) ' + liste[0] + ' ... ' + liste[liste.length - 1]);
}

// se sono piu' di una, mostro le righe che differiscono dalla prima
if (tutte.length > 1) {
  const base = tutte[0].split('\n');
  for (let f = 1; f < tutte.length; f++) {
    const altra = tutte[f].split('\n');
    console.log('\n== differenze fra forma 1 e forma ' + (f + 1) + ' ==');
    const max = Math.max(base.length, altra.length);
    let mostrate = 0;
    for (let r = 0; r < max && mostrate < 30; r++) {
      if (base[r] !== altra[r]) {
        console.log('  riga ' + (r + 1));
        console.log('    1: ' + (base[r] === undefined ? '(mancante)' : base[r]));
        console.log('   ' + (f + 1) + ': ' + (altra[r] === undefined ? '(mancante)' : altra[r]));
        mostrate++;
      }
    }
    if (mostrate >= 30) console.log('  ... (altri differimenti)');
  }
}

// quante righe ha il guscio, utile per il modello
if (tutte.length) {
  const g = tutte[0];
  console.log('\nguscio: ' + g.split('\n').length + ' righe, ' + Buffer.byteLength(g) + ' byte');
}
