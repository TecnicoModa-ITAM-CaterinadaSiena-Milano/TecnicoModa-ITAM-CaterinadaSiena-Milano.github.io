// Confronto definitivo fra pagine pubblicate e materiali, per ogni Design week.
//
// Per prima cosa trova le pagine vere di design-week (i nomi cambiano). Poi
// per ciascuna elenca i temi pubblicati con il numero di immagini e i
// prefissi dei file, e li mette accanto alle cartelle dei materiali.
//
// Serve a decidere, anno per anno e tema per tema, se la gallery si puo'
// rifare con i materiali senza togliere immagini gia' pubblicate.
import fs from 'node:fs';
import path from 'node:path';

const SITO = 'C:/Users/carmen manuela/Documents/Sito web Opencode';
const MAT = 'D:/Materiali sito/design-week/materiali';
const ESTENSIONI_IMG = /\.(jpe?g|png|gif|webp)$/i;
const ESTENSIONI_VIDEO = /\.(mp4|webm|mov)$/i;

function elenco(dir, estensioni) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  (function scorri(d) {
    for (const v of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, v.name);
      if (v.isDirectory()) scorri(p);
      else if (estensioni.test(v.name)) out.push(p);
    }
  })(dir);
  return out.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// --- le pagine vere -------------------------------------------------------
const dirDW = path.join(SITO, 'design-week');
const pagine = fs.readdirSync(dirDW).filter(f => f.endsWith('.html')).sort();
console.log('== PAGINE design-week ==');
pagine.forEach(p => {
  const t = fs.readFileSync(path.join(dirDW, p), 'utf8');
  const n = [...t.matchAll(/<img[^>]*src="([^"]*)"[^>]*>/g)]
    .map(m => m[1]).filter(s => !/^(https?:|data:)/.test(s) && !/identita\//.test(s)).length;
  const v = [...t.matchAll(/<(?:video|source)[^>]*src="([^"]*)"/g)].length;
  console.log('  ' + p.padEnd(50) + 'img ' + String(n).padStart(3) + '   video ' + String(v).padStart(3));
});

// --- materiali, per anno --------------------------------------------------
console.log('\n== MATERIALI, cartelle e conteggi ==');
const anniMat = fs.readdirSync(MAT, { withFileTypes: true }).filter(v => v.isDirectory()).map(v => v.name).sort();
for (const anno of anniMat) {
  const cartella = path.join(MAT, anno);
  console.log('\n' + anno);
  const voci = fs.readdirSync(cartella, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const v of voci) {
    const pieno = path.join(cartella, v.name);
    if (v.isFile()) {
      const est = path.extname(v.name).toLowerCase();
      const tipo = ESTENSIONI_IMG.test(est) ? 'img' : ESTENSIONI_VIDEO.test(est) ? 'video' : 'altro';
      console.log('    [file] '.padEnd(46) + v.name.padEnd(42) + ' ' + tipo);
    } else {
      const img = elenco(pieno, ESTENSIONI_IMG).length;
      const vid = elenco(pieno, ESTENSIONI_VIDEO).length;
      const ignora = /ignora|scarta/i.test(v.name);
      console.log('  ' + (ignora ? '[IGNORA] ' : '  ') + v.name.padEnd(42) +
        String(img).padStart(3) + ' img' + (vid ? '  ' + vid + ' video' : ''));
    }
  }
}

// --- cosa serve alle pagine pubblicate ------------------------------------
console.log('\n\n== PAGINE PUBBLICATE: prefissi dei file usati ==');
for (const p of pagine) {
  const t = fs.readFileSync(path.join(dirDW, p), 'utf8');
  const src = [...t.matchAll(/<img[^>]*src="([^"]*)"[^>]*>/g)].map(m => m[1])
    .filter(s => !/^(https?:|data:)/.test(s) && !/identita\//.test(s) && !/copertine\//.test(s));
  const vid = [...t.matchAll(/<(?:video|source)[^>]*src="([^"]*)"/g)].map(m => m[1]);
  if (!src.length && !vid.length) { console.log('\n' + p + ': vuota'); continue; }
  console.log('\n' + p);
  const perCartella = new Map();
  for (const s of src) {
    const cartella = s.split('/').slice(-2, -1)[0];
    const nome = path.basename(s);
    const prefisso = (nome.match(/^[a-z]+/) || [nome])[0];
    if (!perCartella.has(cartella)) perCartella.set(cartella, new Map());
    const m = perCartella.get(cartella);
    m.set(prefisso, (m.get(prefisso) || 0) + 1);
  }
  for (const [cartella, m] of perCartella) {
    console.log('   ' + cartella.padEnd(12) + [...m].map(([k, n]) => k + '×' + n).join('  '));
  }
  if (vid.length) {
    const perCartellaV = new Map();
    for (const s of vid) {
      const cartella = s.split('/').slice(-2, -1)[0] || '(radice)';
      perCartellaV.set(cartella, (perCartellaV.get(cartella) || 0) + 1);
    }
    console.log('   video: ' + [...perCartellaV].map(([k, n]) => k + '×' + n).join('  '));
  }
}
