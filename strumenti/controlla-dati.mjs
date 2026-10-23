// Piccolo controllo sui dati estratti: titoli fuori formato e coincidenze
// fra titolo, descrizione e i metadati og:.
import { PAGINE } from './dati.mjs';

console.log('== titoli senza " | " ==');
for (const p of PAGINE) {
  if (!p.titolo.includes(' | ')) console.log('  ' + p.percorso + '  ->  ' + p.titolo);
}

console.log('\n== coincidenze ==');
console.log('  titolo == og:title          : ' + PAGINE.filter(p => p.titolo === p.ogTitolo).length + ' di ' + PAGINE.length);
console.log('  descrizione == og:descr     : ' + PAGINE.filter(p => p.descrizione === p.ogDescrizione).length + ' di ' + PAGINE.length);

const diversi = PAGINE.filter(p => p.titolo !== p.ogTitolo);
if (diversi.length) {
  console.log('\n== titoli diversi da og:title ==');
  for (const p of diversi.slice(0, 8)) {
    console.log('  ' + p.percorso);
    console.log('     <title> : ' + p.titolo);
    console.log('     og:title: ' + p.ogTitolo);
  }
}

// quante voci di menu sono marcate e con quale valore
console.log('\n== voci di menu marcate ==');
const perValore = new Map();
for (const p of PAGINE) {
  if (!p.attivo) continue;
  perValore.set(p.attivo.valore, (perValore.get(p.attivo.valore) || 0) + 1);
}
console.log('  ' + [...perValore].map(([v, n]) => 'aria-current="' + v + '" × ' + n).join('   '));

console.log('\n== quali pagine ==');
for (const p of PAGINE.filter(p => p.attivo)) {
  console.log('  ' + p.percorso.padEnd(52) + (p.attivo.valore === 'true' ? 'true ' : 'page') + '  ' + p.attivo.href);
}

// il percorso di navigazione: quante voci per pagina
console.log('\n== profondità del percorso di navigazione ==');
const perLunghezza = new Map();
for (const p of PAGINE) perLunghezza.set(p.briciole.length, (perLunghezza.get(p.briciole.length) || 0) + 1);
console.log('  ' + [...perLunghezza].sort((a, b) => a[0] - b[0]).map(([n, q]) => q + ' pagine con ' + n + ' voci').join('   '));
