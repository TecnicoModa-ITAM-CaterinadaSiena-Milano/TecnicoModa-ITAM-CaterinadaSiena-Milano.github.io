// Verifica della formula dei percorsi relativi.
//
// Regola ipotizzata dalle pagine pubblicate:
//   - verso se stessa            -> "./"
//   - verso un file della stessa cartella -> solo il nome del file
//   - in ogni altro caso         -> si sale alla radice e si riscende
//                                    lungo il percorso completo dell'obiettivo
//
// Per ogni href lo confronto con la stringa pubblicata. Le differenze che
// restano vengono mostrate con la riga in cui compaiono.
//
// 404.html usa percorsi dalla radice volutamente: non viene esaminata.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const esistenti = new Set();
const cartelle = new Set();
(function cerca(dir) {
  for (const voce of fs.readdirSync(dir, { withFileTypes: true })) {
    if (voce.name.startsWith('.')) continue;
    const pieno = path.join(dir, voce.name);
    if (voce.isDirectory()) { cartelle.add(path.relative(ROOT, pieno).replace(/\\/g, '/')); cerca(pieno); }
    else esistenti.add(path.relative(ROOT, pieno).replace(/\\/g, '/'));
  }
})(ROOT);

const cartellaDi = f => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');

// La regola sopra.
function relativa(pagina, obiettivo) {
  // verso se stessa: il nome del file, non './' (che punterebbe alla cartella)
  if (obiettivo === pagina) return obiettivo.slice(obiettivo.lastIndexOf('/') + 1);
  if (cartellaDi(obiettivo) === cartellaDi(pagina)) return obiettivo.slice(obiettivo.lastIndexOf('/') + 1);
  const su = cartellaDi(pagina) === '' ? 0 : cartellaDi(pagina).split('/').length;
  return '../'.repeat(su) + obiettivo;
}

function risolvi(pagina, href) {
  const pulito = href.split('#')[0].split('?')[0];
  if (pulito === '') return null;
  const da = cartellaDi(pagina);
  return path.posix.normalize((da ? da + '/' : '') + pulito);
}

const pagine = [...esistenti].filter(p => p.endsWith('.html') && p !== '404.html').sort();

let totali = 0, identici = 0, soloVersione = 0, rotti = 0;
const differenze = [];

for (const pagina of pagine) {
  const testo = fs.readFileSync(path.join(ROOT, pagina), 'utf8');
  const righe = testo.split('\n');
  for (const riga of righe) {
    const re = /(?:href|src)=\"([^\"]*)\"/g;
    let m;
    while ((m = re.exec(riga))) {
      const href = m[1];
      if (/^(https?:|mailto:|tel:|data:|#|\/)/.test(href)) continue;
      totali++;

      const risolto = risolvi(pagina, href);
      if (risolto === null) { differenze.push({ pagina, href, nota: 'vuoto', riga: riga.trim() }); continue; }

      let obiettivo = risolto;
      if (obiettivo.endsWith('/')) obiettivo += 'index.html';
      if (!esistenti.has(obiettivo)) {
        if (cartelle.has(risolto)) obiettivo = risolto + '/index.html';
        else { rotti++; differenze.push({ pagina, href, nota: 'INESISTENTE', obiettivo: risolto, riga: riga.trim() }); continue; }
      }

      const pubblicato = href.split('?')[0];
      const ricalcolata = relativa(pagina, obiettivo);

      if (ricalcolata === href) { identici++; continue; }
      if (ricalcolata === pubblicato) { soloVersione++; continue; }

      differenze.push({ pagina, href, ricalcolata, obiettivo, riga: riga.trim() });
    }
  }
}

console.log('collegamenti relativi controllati: ' + totali);
console.log('  identici                            : ' + identici);
console.log('  identici a parte la versione ?v=    : ' + soloVersione);
console.log('  DIVERSI dalla formula               : ' + (totali - identici - soloVersione - rotti));
console.log('  verso un file inesistente           : ' + rotti);
console.log('');

const veri = differenze.filter(d => d.nota !== 'vuoto');
const perTipo = new Map();
for (const d of veri) {
  const k = d.nota === 'INESISTENTE' ? 'INESISTENTE'
    : d.nota === 'vuoto' ? 'vuoto'
    : (d.ricalcolata && d.ricalcolata.replace(/^\.\//, '') === d.href.replace(/^\.\//, '') ? 'solo il prefisso ./' : 'REGOLA SBAGLIATA');
  perTipo.set(k, (perTipo.get(k) || 0) + 1);
}
console.log('== tipi di differenza ==');
for (const [k, n] of [...perTipo].sort((a, b) => b[1] - a[1])) console.log('  ' + String(n).padStart(5) + '  ' + k);

const sbagliate = veri.filter(d => d.nota !== 'vuoto' && d.nota !== 'INESISTENTE'
  && !(d.ricalcolata && d.ricalcolata.replace(/^\.\//, '') === d.href.replace(/^\.\//, '')));

console.log('\n== prime ' + Math.min(20, sbagliate.length) + ' differenze con la regola ==');
sbagliate.slice(0, 20).forEach(d => {
  console.log('  ' + d.pagina);
  console.log('     pubblicato: ' + d.href);
  console.log('     la mia   : ' + d.ricalcolata);
  console.log('     verso    : ' + d.obiettivo);
  console.log('     riga     : ' + d.riga.slice(0, 150));
});

const ines = veri.filter(d => d.nota === 'INESISTENTE');
if (ines.length) {
  console.log('\n== verso file inesistente ==');
  ines.slice(0, 15).forEach(d => console.log('  ' + d.pagina + '  ->  ' + d.href));
}
