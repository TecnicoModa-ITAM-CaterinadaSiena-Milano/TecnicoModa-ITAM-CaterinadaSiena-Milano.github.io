// Guarda esattamente come inizia e finisce il corpo estratto di una pagina,
// contando i ritorni a capo, per assemblare il file senza righe superflue.
import { PAGINE } from './dati.mjs';

const p = PAGINE.find(x => x.percorso === 'chi-siamo/index.html');
const c = p.corpo;

console.log('lunghezza: ' + c.length);
console.log('prime 40 caratteri come codice: ' + JSON.stringify(c.slice(0, 40)));
console.log('ultimi 40 caratteri come codice : ' + JSON.stringify(c.slice(-40)));
console.log('inizia con a capo: ' + (c[0] === '\n'));
console.log('finisce con a capo: ' + (c[c.length - 1] === '\n'));

// e la home, che non ha il percorso di navigazione
const h = PAGINE.find(x => x.percorso === 'home.html');
console.log('\nhome prime 40 : ' + JSON.stringify(h.corpo.slice(0, 40)));
console.log('home ultimi 40: ' + JSON.stringify(h.corpo.slice(-40)));

// conto quante pagine hanno il corpo che finisce con \n
let conAcapo = 0, senza = [];
for (const x of PAGINE) {
  if (x.corpo.endsWith('\n')) conAcapo++;
  else senza.push(x.percorso);
}
console.log('\ncorpi che finiscono con a capo: ' + conAcapo + ' di ' + PAGINE.length);
if (senza.length) console.log('senza: ' + senza.slice(0, 5).join(', '));
