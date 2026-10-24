// Verifica cosa cambia nella gallery 2025: quali testi alternativi scritti a
// mano vanno riportati e quali immagini pubblicate non hanno piu' una copia
// nei materiali riorganizzati.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { default: sharp } = await import(pathToFileURL('D:/Documenti/Progetto predefinito/node_modules/sharp/lib/index.js').href);

const SITO = path.resolve(import.meta.dirname, '..');
const MAT = 'D:/Materiali sito/design-week/materiali/2025-art-de-coeur';
const GENERICO = /^Immagine del progetto/;
const SCARTA = /ignora|scarta/i;

// le quattro cartelle nella sequenza che ha scelto l'utente
const CARTELLE = ['Gallery1_Accessori', 'Gallery2_tessuti', 'Gallery 3_abiti', 'Gallery 4_allestimento'];

async function impronta(file) {
  const { data } = await sharp(file).rotate().resize(9, 8, { fit: 'fill' }).greyscale().raw()
    .toBuffer({ resolveWithObject: true });
  const bit = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) bit.push(data[r * 9 + c] > data[r * 9 + c + 1] ? 1 : 0);
  return bit;
}
const distanza = (a, b) => a.reduce((n, v, i) => n + (v === b[i] ? 0 : 1), 0);

// --- i materiali nuovi, in sequenza ----------------------------------------
const materiali = [];
for (const c of CARTELLE) {
  const dir = path.join(MAT, c);
  for (const n of fs.readdirSync(dir).filter(n => /\.(jpe?g|png)$/i.test(n) && !SCARTA.test(n))
    .sort((a, b) => a.localeCompare(b, 'it', { numeric: true }))) {
    materiali.push({ cartella: c, nome: n, file: path.join(dir, n) });
  }
}
console.log('materiali nuovi: ' + materiali.length);
for (const m of materiali) console.log('   ' + m.cartella.padEnd(22) + m.nome);

// --- cosa e' pubblicato adesso ---------------------------------------------
const html = fs.readFileSync(path.join(SITO, 'design-week/2025-art-de-coeur.html'), 'utf8');
const pubblicate = [...html.matchAll(/src="\.\.\/assets\/img\/artdecoeur2025\/([^"]+)"\s*\n?\s*alt="([^"]*)"/g)]
  .map(x => ({ file: x[1], alt: x[2] }));
console.log('\npubblicate adesso: ' + pubblicate.length);
const aMano = pubblicate.filter(p => !GENERICO.test(p.alt));
console.log('testi alternativi scritti a mano: ' + aMano.length);
for (const p of aMano) console.log('   ' + p.file + '  →  ' + p.alt);

// --- impronte --------------------------------------------------------------
const impMat = [];
for (const m of materiali) impMat.push({ ...m, bit: await impronta(m.file) });

const impPub = [];
for (const p of pubblicate) {
  const f = path.join(SITO, 'assets/img/artdecoeur2025', p.file);
  impPub.push({ ...p, bit: await impronta(f) });
}

// --- confronto -------------------------------------------------------------
const presi = new Set();
console.log('\nabbinamento pubblicate -> materiali');
for (const p of impPub) {
  const ordinati = impMat.map(m => ({ ...m, d: distanza(p.bit, m.bit) })).sort((a, b) => a.d - b.d);
  const primo = ordinati[0];
  const sicuro = primo.d <= 12;
  if (sicuro) presi.add(primo.file);
  console.log('   ' + p.file.padEnd(18) + (sicuro ? '→ ' + primo.cartella + ' / ' + primo.nome : '→ NESSUNA corrispondenza')
    + '   (distanza ' + primo.d + ')');
}

const perdute = impPub.filter(p => {
  const ordinati = impMat.map(m => distanza(p.bit, m.bit));
  return Math.min(...ordinati) > 12;
});
console.log('\nimmagini pubblicate SENZA copia nei materiali (verranno tolte): ' + perdute.length);
for (const p of perdute) console.log('   ' + p.file + '   «' + p.alt + '»');

const nonUsate = impMat.filter(m => !presi.has(m.file));
console.log('\nmateriali non gia\' pubblicati (entrano per la prima volta): ' + nonUsate.length);
for (const m of nonUsate) console.log('   ' + m.cartella + ' / ' + m.nome);
