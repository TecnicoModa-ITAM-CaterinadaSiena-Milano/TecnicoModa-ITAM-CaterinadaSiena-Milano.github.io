// Diff riga per riga fra i gusci di due pagine a stessa profondita':
// serve a vedere cosa varia davvero, invece di indovinarlo.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

function guscio(rel) {
  const testo = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  let i = testo.indexOf('<main id="contenuto">');
  if (i < 0) i = testo.indexOf('<main');
  if (i < 0) i = testo.indexOf('<body');
  return testo.slice(0, i);
}

const [a, b] = process.argv.slice(2);
if (!a || !b) { console.error('uso: node analisi-diff.mjs paginaA paginaB'); process.exit(1); }

const la = guscio(a).split('\n');
const lb = guscio(b).split('\n');

console.log('A: ' + a + '   (' + la.length + ' righe)');
console.log('B: ' + b + '   (' + lb.length + ' righe)');
console.log('');

// allineamento semplice: confronto per posizione e mostro le righe diverse
const max = Math.max(la.length, lb.length);
let uguali = 0, diverse = 0;
const prime = [];
for (let i = 0; i < max; i++) {
  if (la[i] === lb[i]) { uguali++; continue; }
  diverse++;
  if (prime.length < 40) prime.push({ r: i + 1, a: la[i], b: lb[i] });
}
console.log('righe identiche: ' + uguali + '   righe diverse: ' + diverse + '\n');
for (const p of prime) {
  console.log('riga ' + p.r);
  console.log('  A: ' + (p.a === undefined ? '(riga assente)' : p.a));
  console.log('  B: ' + (p.b === undefined ? '(riga assente)' : p.b));
}
