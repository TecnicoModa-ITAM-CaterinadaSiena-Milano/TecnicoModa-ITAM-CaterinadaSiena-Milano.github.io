// Confronto fra materiali e sito per il 2019.
//
// Le immagini del sito sono ridotte a 1600 px di lato lungo, quindi non le
// posso confrontare con gli originali per numero di pixel: le confronto per
// proporzione. Serve a capire se le immagini pubblicate che non stanno nelle
// cartelle "da pubblicare" stanno invece nelle cartelle "da ignorare".
import fs from 'node:fs';
import path from 'node:path';

const MAT = 'D:/Materiali sito/design-week/materiali';
const SITO = 'C:/Users/carmen manuela/Documents/Sito web Opencode/assets/img';
const ESTENSIONI = /\.(jpe?g|png|gif)$/i;

const size = new Map();
function dimensioni(file) {
  if (size.has(file)) return size.get(file);
  let d = null;
  try {
    const b = fs.readFileSync(file);
    if (b[0] === 0x89 && b[1] === 0x50) {              // png
      d = [b.readUInt32BE(16), b.readUInt32BE(20)];
    } else if (b[0] === 0xff && b[1] === 0xd8) {         // jpeg
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
    } else if (b[0] === 0x47 && b[1] === 0x49) {         // gif
      d = [b.readUInt16LE(6), b.readUInt16LE(8)];
    }
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
  (function scorri(d) {
    for (const v of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, v.name);
      if (v.isDirectory()) scorri(p);
      else if (ESTENSIONI.test(v.name)) out.push(p);
    }
  })(dir);
  return out;
}

// --- 2019: i materiali, per cartella --------------------------------------
const base = path.join(MAT, '2019-buongiorno-bauhaus');
console.log('== 2019 MATERIALI, per cartella (proporzione) ==');
for (const sottocartella of fs.readdirSync(base, { withFileTypes: true })) {
  if (!sottocartella.isDirectory()) continue;
  const cartella = path.join(base, sottocartella.name);
  const file = elenco(cartella);
  if (!file.length) continue;
  const rapporti = file.map(f => rapporto(f));
  const conteggio = new Map();
  rapporti.forEach(r => conteggio.set(r, (conteggio.get(r) || 0) + 1));
  const riepilogo = [...conteggio].sort().map(([r, n]) => r + (n > 1 ? '×' + n : '')).join('  ');
  console.log('  ' + sottocartella.name);
  console.log('      ' + file.length + ' immagini: ' + riepilogo);
}

// --- 2019: il sito ---------------------------------------------------------
console.log('\n== 2019 SITO, bauhaus2019 (prefisso e proporzione) ==');
const sito = elenco(path.join(SITO, 'bauhaus2019'));
const perPrefisso = new Map();
for (const f of sito) {
  const nome = path.basename(f);
  const prefisso = (nome.match(/^[a-z]+/) || [nome])[0];
  if (!perPrefisso.has(prefisso)) perPrefisso.set(prefisso, []);
  perPrefisso.get(prefisso).push({ nome, r: rapporto(f) });
}
for (const [prefisso, lista] of [...perPrefisso].sort()) {
  const conteggio = new Map();
  lista.forEach(x => conteggio.set(x.r, (conteggio.get(x.r) || 0) + 1));
  const riepilogo = [...conteggio].sort().map(([r, n]) => r + (n > 1 ? '×' + n : '')).join('  ');
  console.log('  ' + prefisso.padEnd(14) + ' ' + lista.length + ' immagini: ' + riepilogo);
}

// --- confronto: le "set" del sito, quali esistono nei materiali -----------
console.log('\n== le "set" del sito confrontate con Gallery1 + Ignorare ==');
const nellaGallery = new Map();
for (const f of elenco(path.join(base, 'Gallery1_Set da tavola'))) {
  const r = rapporto(f);
  nellaGallery.set(r, (nellaGallery.get(r) || []).concat(path.basename(f)));
}
const nellIgnora = new Map();
const cartellaIgnora = fs.readdirSync(base, { withFileTypes: true }).find(v => /ignora/i.test(v.name));
if (cartellaIgnora) {
  for (const f of elenco(path.join(base, cartellaIgnora.name))) {
    const r = rapporto(f);
    nellIgnora.set(r, (nellIgnora.get(r) || []).concat(path.basename(f)));
  }
}
const set = sito.filter(f => /^set-/i.test(path.basename(f))).sort();
for (const f of set) {
  const r = rapporto(f);
  const g = nellaGallery.get(r) || [];
  const i = nellIgnora.get(r) || [];
  const stato = g.length ? 'in Gallery1: ' + g.join(', ')
    : i.length ? 'solo in IGNORA: ' + i.join(', ')
    : 'DA NESSUNA PARTE';
  console.log('  ' + path.basename(f).padEnd(12) + r.padEnd(7) + stato);
}
