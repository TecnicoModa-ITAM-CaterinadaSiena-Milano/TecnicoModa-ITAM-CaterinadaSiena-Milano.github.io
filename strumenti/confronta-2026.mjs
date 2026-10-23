// Confronto 2026 fra immagini pubblicate e cartelle dei materiali, per tema.
//
// Alcuni temi della 2026 hanno meno immagini nei materiali che nel sito.
// Confronto le proporzioni per capire se le immagini mancanti stanno nelle
// cartelle da ignorare o se sono proprio sparite. Serve a decidere se un tema
// si puo' rifare senza togliere immagini gia' pubblicate.
import fs from 'node:fs';
import path from 'node:path';

const MAT = 'D:/Materiali sito/design-week/materiali/2026-OL3';
const SITO = 'C:/Users/carmen manuela/Documents/Sito web Opencode/assets/img/ol3';
const ESTENSIONI = /\.(jpe?g|png|gif|webp)$/i;

const size = new Map();
function dimensioni(file) {
  if (size.has(file)) return size.get(file);
  let d = null;
  try {
    const b = fs.readFileSync(file);
    if (b[0] === 0x89 && b[1] === 0x50) d = [b.readUInt32BE(16), b.readUInt32BE(20)];
    else if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xd8 || m === 0xd9) { i += 2; continue; }
        const len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          d = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
          break;
        }
        i += 2 + len;
      }
    } else if (b[0] === 0x47 && b[1] === 0x49) d = [b.readUInt16LE(6), b.readUInt16LE(8)];
  } catch { }
  size.set(file, d);
  return d;
}

function rapporto(file) {
  const d = dimensioni(file);
  if (!d || !d[1]) return '?';
  return (Math.round((d[0] / d[1]) * 100) / 100).toFixed(2);
}

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

// mappa: tema pubblicato -> cartella dei materiali
const TEMA = [
  { nome: 'OLTRE la materia',   prefisso: 'materia',   cartella: 'OLTRE la materia' },
  { nome: 'OLTRE la forma',     prefisso: 'forma',     cartella: 'OLTRE la forma' },
  { nome: 'OLTRE il gioco',     prefisso: 'gioco',     cartella: 'OLTRE il gioco' },
  { nome: "OLTRE l'immagine",   prefisso: 'immagine',  cartella: 'OLTRE le immagini_Narrazioni visive' },
  { nome: "OLTRE l'obiettivo",  prefisso: 'obiettivo', cartella: "OLTRE l'obiettivo_Trame fotografiche" },
  { nome: "OLTRE l'opera",      prefisso: 'opera',     cartella: "Oltre l'opera" },
  { nome: 'OLTRE le gabbie',    prefisso: 'gabbie',    cartella: 'Oltre le gabbie' },
  { nome: 'Oltre il racconto',  prefisso: 'racconto',  cartella: 'OLTRE il racconto' },
  { nome: 'OLTRE le apparenze', prefisso: 'lab',       cartella: 'OLTRE le apparenze_Making of' },
];

// cartella da ignorare del 2026
const ignoraDir = fs.readdirSync(MAT, { withFileTypes: true }).find(v => /ignora/i.test(v.name));
const immaginiIgnora = ignoraDir ? elenco(path.join(MAT, ignoraDir.name)) : [];

console.log('cartella da ignorare: ' + (ignoraDir ? ignoraDir.name : '(nessuna)') + '  —  ' + immaginiIgnora.length + ' immagini');
const rapportiIgnora = new Map();
for (const f of immaginiIgnora) {
  const r = rapporto(f);
  rapportiIgnora.set(r, (rapportiIgnora.get(r) || 0) + 1);
}
console.log('  proporzioni: ' + [...rapportiIgnora].sort().map(([r, n]) => r + '×' + n).join('  '));

console.log('\n== per tema ==');
for (const t of TEMA) {
  const sito = elenco(SITO).filter(f => path.basename(f).startsWith(t.prefisso + '-'));
  const matCartella = elenco(path.join(MAT, t.cartella));

  console.log('\n' + t.nome + '   (cartella «' + t.cartella + '»)');
  console.log('   pubblicate ' + String(sito.length).padStart(3) + '     materiali ' + String(matCartella.length).padStart(3));

  const rapportiSito = new Map();
  for (const f of sito) {
    const r = rapporto(f);
    rapportiSito.set(r, (rapportiSito.get(r) || 0) + 1);
  }
  const rapportiMat = new Map();
  for (const f of matCartella) {
    const r = rapporto(f);
    rapportiMat.set(r, (rapportiMat.get(r) || 0) + 1);
  }
  console.log('   pubblicate: ' + [...rapportiSito].sort().map(([r, n]) => r + '×' + n).join('  '));
  console.log('   materiali : ' + ([...rapportiMat].sort().map(([r, n]) => r + '×' + n).join('  ') || '(vuota)'));

  if (matCartella.length < sito.length) {
    // quali proporzioni mancano
    const mancanti = new Map();
    for (const [r, n] of rapportiSito) {
      const disponibili = rapportiMat.get(r) || 0;
      if (n > disponibili) mancanti.set(r, n - disponibili);
    }
    console.log('   >>> mancano ' + (sito.length - matCartella.length) + ' immagini:');
    for (const [r, n] of [...mancanti].sort()) {
      const nellIgnora = rapportiIgnora.get(r) || 0;
      console.log('        proporzione ' + r + ' × ' + n + '   (nella cartella da ignorare: ' + nellIgnora + ')');
    }
  } else if (matCartella.length > sito.length) {
    console.log('   >>> i materiali hanno ' + (matCartella.length - sito.length) + ' immagini in piu\'');
  } else {
    console.log('   >>> conteggio uguale' + (sito.length && [...rapportiSito].sort().map(x => x[0]).join() === [...rapportiMat].sort().map(x => x[0]).join() ? ' e proporzioni identiche' : ' ma proporzioni diverse'));
  }
}
