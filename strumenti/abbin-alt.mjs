// Abbina le immagini pubblicate a quelle dei materiali, per capire se i testi
// alternativi scritti a mano possono essere riportati sull'immagine giusta.
//
// Le immagini pubblicate sono copie ridotte dei materiali, quindi un confronto
// fra impronte visive (dHash, 64 bit) basta a riconoscerle. Se la distanza di
// Hamming e' piccola l'abbinamento e' sicuro; se e' grande l'immagine
// pubblicata non viene da quella cartella e il suo testo non si puo' portare
// dietro senza rischiare di descrivere una foto sbagliata.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { default: sharp } = await import(pathToFileURL('D:/Documenti/Progetto predefinito/node_modules/sharp/lib/index.js').href);

const SITO = path.resolve(import.meta.dirname, '..');
const MAT = 'D:/Materiali sito/design-week/materiali';

const IMMAGINE = /\.(jpe?g|png|gif|webp|avif)$/i;
const SCARTA = /ignora|scarta/i;
const GENERICO = /^Immagine del progetto/;

// dHash: 9x8 pixel in scala di grigi, 64 bit confrontando i pixel affiancati
async function impronta(file) {
  const { data } = await sharp(file)
    .rotate()
    .resize(9, 8, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bit = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) bit.push(data[r * 9 + c] > data[r * 9 + c + 1] ? 1 : 0);
  }
  return bit;
}

const distanza = (a, b) => a.reduce((n, v, i) => n + (v === b[i] ? 0 : 1), 0);

function immaginiCartella(dir) {
  const out = [];
  (function scorri(d) {
    for (const v of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, v.name);
      if (v.isDirectory()) { if (!SCARTA.test(v.name)) scorri(p); }
      else if (IMMAGINE.test(v.name) && !SCARTA.test(v.name)) out.push(p);
    }
  })(dir);
  return out.sort((a, b) => a.localeCompare(b, 'it', { numeric: true }));
}

// per tema: la cartella dei materiali corrispondente
const PROSPETTO = [
  {
    pagina: 'design-week/2026-ol3.html',
    imgPubblicate: 'assets/img/ol3',
    cartella: '2026-OL3',
    temi: {
      'OLTRE la materia': 'OLTRE la materia',
      'OLTRE la forma': 'OLTRE la forma',
      "OLTRE il gioco": 'OLTRE il gioco',
      "OLTRE l'immagine": 'OLTRE le immagini_Narrazioni visive',
      "OLTRE l'obiettivo": 'OLTRE l\'obiettivo_Trame fotografiche',
      "OLTRE l'opera": 'Oltre l\'opera',
      'OLTRE le gabbie': 'Oltre le gabbie',
    },
  },
  {
    pagina: 'design-week/2019-buongiorno-bauhaus.html',
    imgPubblicate: 'assets/img/bauhaus2019',
    cartella: '2019-buongiorno-bauhaus',
    temi: {
      'Set da tavola': 'Gallery1_Set da tavola',
      'Complementi d’arredo tessili e in stampa 3d': "Gallery2_Complementi d'arredo tessili e in stampa 3d",
      'Inaugurazione': 'Gallery3_Inaugurazione',
      'Cartoline': 'Gallery4_cartoline',
    },
  },
];

for (const voce of PROSPETTO) {
  const html = fs.readFileSync(path.join(SITO, voce.pagina), 'utf8');
  console.log('\n########## ' + voce.pagina);

  // i temi della pagina, con immagini e testi alternativi
  const temiPagina = [];
  for (const m of html.matchAll(/<h3 class="tema__titolo">([^<]+)<\/h3>([\s\S]*?)(?=<h3 class="tema__titolo">|<\/div>\s*$)/g)) {
    const titolo = m[1];
    const immagini = [...m[2].matchAll(/src="([^"]+\.(?:jpe?g|png))"\s+alt="([^"]*)"/g)]
      .map(x => ({ file: x[1].split('/').pop(), alt: x[2] }));
    if (immagini.length) temiPagina.push({ titolo, immagini });
  }

  for (const { titolo, immagini } of temiPagina) {
    const sottocartella = voce.temi[titolo];
    if (!sottocartella) { console.log('\n  «' + titolo + '»: nessuna cartella associata, non toccata'); continue; }

    const dir = path.join(MAT, voce.cartella, sottocartella);
    if (!fs.existsSync(dir)) { console.log('\n  «' + titolo + '»: MANCA la cartella ' + sottocartella); continue; }
    const fileMateriali = immaginiCartella(dir);

    const scritte = immagini.filter(i => !GENERICO.test(i.alt));
    console.log('\n  «' + titolo + '»   pubblicate ' + immagini.length + '   materiali ' + fileMateriali.length
      + '   testi a mano: ' + scritte.length);
    if (!scritte.length) continue;

    // impronte dei materiali, calcolate una volta sola
    const impronteMateriali = [];
    for (const f of fileMateriali) impronteMateriali.push({ file: path.basename(f), bit: await impronta(f) });

    for (const s of scritte) {
      const pieno = path.join(SITO, voce.imgPubblicate, s.file);
      if (!fs.existsSync(pieno)) { console.log('      ' + s.file + '  MANCA nel sito'); continue; }
      const bit = await impronta(pieno);
      const ordinati = impronteMateriali.map(m => ({ ...m, d: distanza(bit, m.bit) })).sort((a, b) => a.d - b.d);
      const primo = ordinati[0];
      const secondo = ordinati[1];
      const sicuro = primo.d <= 12 && primo.d < secondo.d - 3;
      console.log('      ' + s.file.padEnd(15) + (sicuro ? 'ABBINATA a ' : 'INCERTA  ') + primo.file.padEnd(34)
        + 'distanza ' + String(primo.d).padStart(3) + '   (seconda: ' + secondo.d + ')');
    }
  }
}
