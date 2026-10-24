// Inventario completo delle cartelle dei materiali del 2019 e del 2026, per
// vedere quante immagini e quanti video ci sono davvero in ognuna, e quali
// file sono dentro cartelle da ignorare (che non vanno pubblicati mai).
import fs from 'node:fs';
import path from 'node:path';

const MAT = 'D:/Materiali sito/design-week/materiali';
const CARTELLE = ['2019-buongiorno-bauhaus', '2026-OL3'];

const IMMAGINE = /\.(jpe?g|png|gif|webp|avif)$/i;
const VIDEO = /\.(mp4|webm|mov|m4v|avi|mkv)$/i;
const SCARTA = /ignora|scarta/i;

function scorri(dir, prefisso) {
  const out = [];
  let voci;
  try { voci = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const v of voci.sort((a, b) => a.name.localeCompare(b.name, 'it', { numeric: true }))) {
    const p = path.join(dir, v.name);
    if (v.isDirectory()) out.push(...scorri(p, prefisso + v.name + '/'));
    else out.push({ nome: prefisso + v.name, pieno: p });
  }
  return out;
}

for (const cartella of CARTELLE) {
  const base = path.join(MAT, cartella);
  console.log('\n########## ' + cartella);
  if (!fs.existsSync(base)) { console.log('   MANCA'); continue; }

  for (const sotto of fs.readdirSync(base, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'it'))) {
    const dir = path.join(base, sotto.name);
    if (!sotto.isDirectory()) {
      const est = path.extname(sotto.name).toLowerCase();
      const tipo = IMMAGINE.test(est) ? 'immagine' : VIDEO.test(est) ? 'VIDEO' : 'altro';
      console.log('\n  [file di primo livello]  ' + sotto.name + '   ' + tipo);
      continue;
    }
    const ignora = SCARTA.test(sotto.name);
    const file = scorri(dir, '');
    const immagini = file.filter(f => IMMAGINE.test(f.nome));
    const video = file.filter(f => VIDEO.test(f.nome));
    const altro = file.filter(f => !IMMAGINE.test(f.nome) && !VIDEO.test(f.nome));

    console.log('\n  ' + (ignora ? '[DA IGNORARE] ' : '') + sotto.name);
    console.log('      immagini: ' + immagini.length + '   video: ' + video.length + '   altro: ' + altro.length);
    if (immagini.length) {
      console.log('      prime immagini: ' + immagini.slice(0, 4).map(f => f.nome).join(', ')
        + (immagini.length > 4 ? ' …' : ''));
    }
    for (const v of video) console.log('      video: ' + v.nome + '   ' + Math.round(fs.statSync(v.pieno).size / 1048576) + ' MB');
    for (const a of altro) console.log('      altro: ' + a.nome);
  }
}
