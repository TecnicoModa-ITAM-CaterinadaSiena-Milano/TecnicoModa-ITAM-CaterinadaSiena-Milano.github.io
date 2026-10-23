// Inventario delle Design week: cosa e' pubblicato e cosa c'è nei materiali.
//
// Da un lato leggo le sei pagine pubblicate e ne estraggo i temi con il
// numero di immagini e i prefissi usati nei nomi dei file. Dall'altro
// scorro le cartelle dei materiali. Cosi' si vede subito dove i materiali
// sono nuovi, dove mancano e dove il sito ha piu' delle cartelle.
import fs from 'node:fs';
import path from 'node:path';

const SITO = 'C:/Users/carmen manuela/Documents/Sito web Opencode';
const MAT = 'D:/Materiali sito/design-week/materiali';
const IMG = path.join(SITO, 'assets/img');
const ESTENSIONI = /\.(jpe?g|png|gif|webp)$/i;

const PAGINE = [
  { anno: '2017', pagina: 'design-week/2017-analogue-dialogues.html' },
  { anno: '2018', pagina: 'design-week/2018-pa-pa-ra-pa.html' },
  { anno: '2019', pagina: 'design-week/2019-buongiorno-bauhaus.html' },
  { anno: '2023', pagina: 'design-week/2023-sa-valigia-de-is-desigius.html' },
  { anno: '2025', pagina: 'design-week/2025-2025.html' },
  { anno: '2026', pagina: 'design-week/2026-ol3.html' },
];

function elenco(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  (function scorri(d) {
    for (const v of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, v.name);
      if (v.isDirectory()) scorri(p);
      else if (ESTENSIONI.test(v.name)) out.push(p);
    }
  })(dir);
  return out.sort();
}

// --- cosa e' pubblicato ---------------------------------------------------
console.log('== PAGINE PUBBLICATE ==');
for (const { anno, pagina } of PAGINE) {
  const pieno = path.join(SITO, pagina);
  if (!fs.existsSync(pieno)) { console.log('\n' + anno + '  MANCA LA PAGINA ' + pagina); continue; }
  const t = fs.readFileSync(pieno, 'utf8');

  const titolo = (t.match(/<h2 class="tema__titolo">([\s\S]*?)<\/h2>/) || [])[1];
  const temi = [...t.matchAll(/<h2 class="tema__titolo">([\s\S]*?)<\/h2>/g)].map(m => m[1].trim());
  const figure = [...t.matchAll(/<img[^>]*src="([^"]*)"[^>]*>/g)].map(m => m[1]);
  const fileimg = figure.filter(s => !/^(https?:|data:)/.test(s));

  // il conteggio per prefisso del nome del file
  const perPrefisso = new Map();
  for (const s of fileimg) {
    const nome = path.basename(s);
    const prefisso = (nome.match(/^[a-z0-9]+/) || [nome])[0];
    perPrefisso.set(prefisso, (perPrefisso.get(prefisso) || 0) + 1);
  }
  const riepilogo = [...perPrefisso].map(([p, n]) => p + '×' + n).join('  ');

  console.log('\n' + anno + '  ' + pagina);
  console.log('   temi: ' + (temi.length ? temi.join(' | ') : '(nessuno)'));
  console.log('   immagini: ' + fileimg.length + (riepilogo ? '   [' + riepilogo + ']' : ''));
  if (fileimg.length) {
    console.log('   cartelle usate: ' + [...new Set(fileimg.map(s => s.split('/').slice(-2, -1)[0]))].join(', '));
    console.log('   esempi: ' + fileimg.slice(0, 3).map(s => s.split('/').pop()).join(', '));
  }
  // eventuali video
  const video = [...t.matchAll(/<(?:video|source)[^>]*src="([^"]*)"/g)].map(m => m[1]);
  if (video.length) console.log('   video: ' + video.length + '  [' + video.slice(0, 3).map(s => s.split('/').pop()).join(', ') + ']');
}

// --- cosa c'e' nei materiali ----------------------------------------------
console.log('\n\n== CARTELLE MATERIALI ==');
if (!fs.existsSync(MAT)) {
  console.log('  manca: ' + MAT);
} else {
  for (const voce of fs.readdirSync(MAT, { withFileTypes: true })) {
    if (!voce.isDirectory()) continue;
    const cartella = path.join(MAT, voce.name);
    console.log('\n' + voce.name);

    // sottocartelle dirette + file sciolti
    const sottocartelle = fs.readdirSync(cartella, { withFileTypes: true }).filter(v => v.isDirectory());
    const fileLiberi = fs.readdirSync(cartella, { withFileTypes: true }).filter(v => v.isFile());
    if (fileLiberi.length) {
      console.log('   (file di livello superiore) ' + fileLiberi.length + ': ' +
        fileLiberi.slice(0, 6).map(f => f.name).join(', ') + (fileLiberi.length > 6 ? ' ...' : ''));
    }
    for (const s of sottocartelle) {
      const sotto = path.join(cartella, s.name);
      const file = elenco(sotto);
      const estensioni = new Map();
      for (const f of file) {
        const e = path.extname(f).toLowerCase();
        estensioni.set(e, (estensioni.get(e) || 0) + 1);
      }
      const est = [...estensioni].map(([e, n]) => e + '×' + n).join(' ');
      // quante immagini hanno lo stesso nome di un video o viceversa
      console.log('   ' + s.name.padEnd(46) + String(file.length).padStart(3) + '  ' + est);
    }
  }
}

// --- cartelle delle immagini pubblicate -----------------------------------
console.log('\n\n== CARTELLE assets/img ==');
for (const voce of fs.readdirSync(IMG, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!voce.isDirectory()) continue;
  const cartella = path.join(IMG, voce.name);
  const file = elenco(cartella);
  const est = new Map();
  for (const f of file) {
    const e = path.extname(f).toLowerCase();
    est.set(e, (est.get(e) || 0) + 1);
  }
  console.log('  ' + voce.name.padEnd(24) + String(file.length).padStart(4) + '   ' +
    [...est].map(([e, n]) => e + '×' + n).join(' '));
}
