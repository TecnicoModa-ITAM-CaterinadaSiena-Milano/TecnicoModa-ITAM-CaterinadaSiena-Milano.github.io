// Controlla se le immagini pubblicate che non hanno piu' una copia nei materiali
// provengono dalla cartella Ignora: in quel caso la esclusione e' voluta.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { default: sharp } = await import(pathToFileURL('D:/Documenti/Progetto predefinito/node_modules/sharp/lib/index.js').href);

const SITO = path.resolve(import.meta.dirname, '..');
const PUB = path.join(SITO, 'assets/img/artdecoeur2025');
const IGNORA = 'D:/Materiali sito/design-week/materiali/2025-art-de-coeur/Ignora - altri formati';

async function impronta(file) {
  const { data } = await sharp(file).rotate().resize(9, 8, { fit: 'fill' }).greyscale().raw()
    .toBuffer({ resolveWithObject: true });
  const bit = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) bit.push(data[r * 9 + c] > data[r * 9 + c + 1] ? 1 : 0);
  return bit;
}
const distanza = (a, b) => a.reduce((n, v, i) => n + (v === b[i] ? 0 : 1), 0);

const fileIgnora = fs.readdirSync(IGNORA)
  .filter(n => /\.(jpe?g|png)$/i.test(n))
  .map(n => ({ nome: n, file: path.join(IGNORA, n) }));

const impIgnora = [];
for (const f of fileIgnora) {
  try { impIgnora.push({ ...f, bit: await impronta(f.file) }); }
  catch (e) { console.log('  (salto ' + f.nome + ': ' + e.message + ')'); }
}

for (const n of [18, 19]) {
  const bit = await impronta(path.join(PUB, 'artdecoeur-' + n + '.jpg'));
  const ordinati = impIgnora.map(m => ({ ...m, d: distanza(bit, m.bit) })).sort((a, b) => a.d - b.d);
  const p = ordinati[0];
  console.log('artdecoeur-' + n + '.jpg  ->  ' + p.nome.padEnd(18)
    + 'distanza ' + String(p.d).padStart(3) + '   (seconda: ' + ordinati[1].d + ')'
    + (p.d <= 12 ? '   ABBINATA nella cartella Ignora' : '   nessuna corrispondenza'));
}
