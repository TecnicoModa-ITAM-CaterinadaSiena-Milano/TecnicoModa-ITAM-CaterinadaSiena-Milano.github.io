// Analisi delle pagine gia' pubblicate: serve a ricostruire il generatore.
// Misura quanto e' regolare il guscio di ogni pagina (testata, menu, percorso,
// pie di pagina) e quanto invece e' unico il corpo del <main>.
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

console.log('pagine html: ' + pagine.length + '\n');

const firma = new Map();       // impronta del guscio -> quante pagine
const dettagli = [];

for (const file of pagine) {
  const testo = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const prof = rel.split('/').length - 1;

  const inizioMain = testo.indexOf('<main id="contenuto">');
  const fineMain = testo.indexOf('</main>');
  if (inizioMain < 0 || fineMain < 0) {
    dettagli.push({ rel, prof, nota: 'SENZA MAIN' });
    continue;
  }

  const testata = testo.slice(0, inizioMain);
  const corpo = testo.slice(inizioMain, fineMain + '</main>'.length);
  const coda = testo.slice(fineMain + '</main>'.length);

  // il guscio varia per profondita' e per titolo: normalizzo entrambi
  const guscio = testata
    .split('../').join('#')                    // prefissi relativi
    .replace(/<title>[\s\S]*?<\/title>/, '<title></title>')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description">')
    .replace(/\?v=\d+/g, '?v=');

  if (!firma.has(guscio)) firma.set(guscio, []);
  firma.get(guscio).push(rel);

  dettagli.push({
    rel, prof,
    titolo: (testo.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '',
    vociPercorso: (testo.match(/<li>/g) || []).length,
    attivo: (testo.match(/aria-current/g) || []).length,
    byteCorpo: Buffer.byteLength(corpo),
    byteTestata: Buffer.byteLength(testata),
    byteCoda: Buffer.byteLength(coda),
    sezioniMain: (corpo.match(/<section class="sezione"/g) || []).length,
    immagini: (corpo.match(/<img /g) || []).length,
    gallerie: (corpo.match(/data-carosello/g) || []).length,
  });
}

console.log('== gusci distinti (dopo aver normalizzato profondita, titolo e versione) ==');
console.log('  forme diverse di guscio: ' + firma.size);
let n = 0;
for (const [g, liste] of firma) {
  n++;
  console.log('  forma ' + n + ': ' + liste.length + ' pagine' + (liste.length <= 3 ? '  ->  ' + liste.join(', ') : ''));
  if (liste.length <= 3) console.log('        prime righe: ' + g.slice(0, 200).replace(/\n/g, '\\n'));
}

console.log('\n== pagine senza main ==');
dettagli.filter(d => d.nota).forEach(d => console.log('  ' + d.rel));

console.log('\n== distribuzione per profondita ==');
const perProf = new Map();
dettagli.forEach(d => perProf.set(d.prof, (perProf.get(d.prof) || 0) + 1));
[...perProf].sort((a, b) => a[0] - b[0]).forEach(([p, c]) => console.log('  profondita ' + p + ': ' + c + ' pagine'));

console.log('\n== le 6 pagine design week ==');
dettagli.filter(d => d.rel.startsWith('design-week/')).forEach(d =>
  console.log('  ' + d.rel.padEnd(34) + ' prof=' + d.prof + ' corpo=' + String(d.byteCorpo).padStart(7) + ' B  sezioni=' + d.sezioniMain + ' img=' + d.immagini + ' gallerie=' + d.gallerie));
