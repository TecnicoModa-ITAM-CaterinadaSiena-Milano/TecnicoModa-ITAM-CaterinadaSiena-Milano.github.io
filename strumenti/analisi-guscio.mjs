// Domanda: il guscio delle 99 pagine e' lo stesso modello, o ogni pagina ha
// un suo testo a mano? Tolgo dal guscio cio' che varia di definizione
// (profondita, titolo, descrizione, versione dei fogli, percorso, voci marcate
// come correnti) e conto quante forme restano.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const pagine = [];
(function cerca(dir) {
  for (const voce of fs.readdirSync(dir, { withFileTypes: true })) {
    if (voce.name.startsWith('.') || voce.name === 'strumenti' || voce.name === 'assets') continue;
    const pieno = path.join(dir, voce.name);
    if (voce.isDirectory()) cerca(pieno);
    else if (voce.name.endsWith('.html')) pagine.push(pieno);
  }
})(ROOT);
pagine.sort();

// pulisce il guscio da cio' che e' dato per pagina
function normalizza(testo) {
  return testo
    .split('../').join('#')                                        // profondita
    .replace(/<title>[\s\S]*?<\/title>/, '<title></title>')        // titolo
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description">')
    .replace(/\?v=\d+/g, '?v=')                                    // versione
    .replace(/ aria-current="page"/g, '')                          // voce attiva nel menu
    .replace(/\n?<nav class="percorso"[\s\S]*?<\/nav>\n/, '\n#PERCORSO\n') // breadcrumb
    .replace(/<h1>[\s\S]*?<\/h1>/, '<h1></h1>');                   // eventuale h1 nella testata
}

const forme = new Map();
const perPagina = [];

for (const file of pagine) {
  const testo = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');

  // il corpo finisce all'apertura del <main>; se non c'e' (index.html), uso <body>
  let inizioMain = testo.indexOf('<main id="contenuto">');
  if (inizioMain < 0) inizioMain = testo.indexOf('<main');
  if (inizioMain < 0) inizioMain = testo.indexOf('<body');
  if (inizioMain < 0) { console.log('  !! nessun punto di taglio: ' + rel); continue; }

  const guscio = normalizza(testo.slice(0, inizioMain));

  if (!forme.has(guscio)) forme.set(guscio, []);
  forme.get(guscio).push(rel);
  perPagina.push({ rel, guscio });
}

console.log('pagine esaminate: ' + perPagina.length);
console.log('forme di guscio dopo la normalizzazione: ' + forme.size + '\n');

let n = 0;
for (const [g, liste] of forme) {
  n++;
  console.log('--- forma ' + n + ': ' + liste.length + ' pagine');
  if (liste.length <= 5) liste.forEach(l => console.log('      ' + l));
  else console.log('      (esempio) ' + liste[0]);
}

// se le forme sono poche, mostro le differenze fra la prima e le altre
if (forme.size > 1 && forme.size <= 6) {
  const tutte = [...forme.keys()];
  const base = tutte[0];
  for (let i = 1; i < tutte.length; i++) {
    const a = base.split('\n'), b = tutte[i].split('\n');
    console.log('\n== differenze fra forma 1 e forma ' + (i + 1) + ' ==');
    const max = Math.max(a.length, b.length);
    let mostrate = 0;
    for (let r = 0; r < max && mostrate < 25; r++) {
      if (a[r] !== b[r]) {
        console.log('  riga ' + (r + 1));
        console.log('    1: ' + (a[r] === undefined ? '(mancante)' : a[r]));
        console.log('    ' + (i + 1) + ': ' + (b[r] === undefined ? '(mancante)' : b[r]));
        mostrate++;
      }
    }
  }
}
