// Elenco preciso dei materiali delle quattro Design week che la pagina non
// mostra ancora: 2017, 2018, 2023 e 2025. Per ogni file: nome, peso e
// dimensioni, cosi' si pianifica il ridimensionamento e si vede subito se un
// file e' un'immagine, un video o altro.
import fs from 'node:fs';
import path from 'node:path';

const MAT = 'D:/Materiali sito/design-week/materiali';
const CARTELLE = [
  '2017-analogue-dialogues',
  '2018-pa-pa-ra-pa',
  '2023-sa-valigia-de-is-desigius',
  '2025-art-de-coeur',
];

const ESTENSIONI = /\.(jpe?g|png|gif|webp|avif)$/i;
const VIDEO = /\.(mp4|webm|mov|m4v)$/i;

function dimensioni(file) {
  try {
    const b = fs.readFileSync(file);
    if (b[0] === 0x89 && b[1] === 0x50) return [b.readUInt32BE(16), b.readUInt32BE(20)];
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xd8 || m === 0xd9) { i += 2; continue; }
        const len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
        }
        i += 2 + len;
      }
    }
    if (b[0] === 0x47 && b[1] === 0x49) return [b.readUInt16LE(6), b.readUInt16LE(8)];
  } catch { }
  return null;
}

function scorri(dir, prefisso) {
  const out = [];
  for (const v of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
    const p = path.join(dir, v.name);
    if (v.isDirectory()) out.push(...scorri(p, prefisso + v.name + '/'));
    else out.push({ nome: prefisso + v.name, pieno: p });
  }
  return out;
}

for (const cartella of CARTELLE) {
  const pieno = path.join(MAT, cartella);
  if (!fs.existsSync(pieno)) { console.log('\n### ' + cartella + '  MANCA'); continue; }
  console.log('\n### ' + cartella);
  for (const f of scorri(pieno, '')) {
    const ignora = /ignora/i.test(f.nome);
    const peso = fs.statSync(f.pieno).size;
    const est = path.extname(f.nome).toLowerCase();
    let nota = '';
    if (ESTENSIONI.test(est)) {
      const d = dimensioni(f.pieno);
      nota = d ? d[0] + '×' + d[1] : 'dimensioni non lette';
    } else if (VIDEO.test(est)) {
      nota = 'video';
    } else {
      nota = 'ALTRO';
    }
    console.log(
      (ignora ? '  [IGNORA] ' : '  ') + f.nome.padEnd(52) +
      (peso / 1024).toFixed(0).padStart(7) + ' KB   ' + nota
    );
  }
}
