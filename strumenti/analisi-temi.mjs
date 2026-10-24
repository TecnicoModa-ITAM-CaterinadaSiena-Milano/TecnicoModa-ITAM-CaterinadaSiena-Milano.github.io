// Come sono fatte davvero le pagine 2019 e 2026: per ogni tema, quante
// immagini, quanti video e soprattutto quali testi alternativi sono scritti
// a mano invece di seguire il modello automatico. Serve prima di rifare le
// gallery, per non perdere descrizioni che qualcuno ha scritto.
import fs from 'node:fs';
import path from 'node:path';

const SITO = path.resolve(import.meta.dirname, '..');
const PAGINE = ['design-week/2019-buongiorno-bauhaus.html', 'design-week/2026-ol3.html'];

// il modello automatico del generatore delle gallery
const GENERICO = /^Immagine del progetto «.+» — immagine \d+ di \d+$/;

for (const rel of PAGINE) {
  const t = fs.readFileSync(path.join(SITO, rel), 'utf8');
  const main = t.slice(t.indexOf('<main id="contenuto">'), t.indexOf('</main>'));

  console.log('\n=== ' + rel);

  // tutto quello che sta fuori dai temi: banner, film di apertura, testi
  const temiInizio = main.indexOf('<div class="temi">');
  const fuori = temiInizio >= 0 ? main.slice(0, temiInizio) : main;
  console.log('\n-- fuori dai temi --');
  for (const m of fuori.matchAll(/<(video|figure|section|h2|h3|p|div)[^>]*class="([^"]+)"/g)) {
    console.log('   <' + m[1] + ' class="' + m[2] + '">');
  }
  const filmFuori = [...fuori.matchAll(/<source src="([^"]+)"/g)].map(m => m[1]);
  for (const s of filmFuori) console.log('   film: ' + s);

  if (temiInizio < 0) continue;

  // i temi, uno per uno
  const temi = main.slice(temiInizio);
  const pezzi = temi.split(/(?=<article class="tema">)/).slice(1);
  console.log('\n-- temi --');
  for (const pezzo of pezzi) {
    const titolo = (pezzo.match(/<h3 class="tema__titolo">([^<]+)<\/h3>/) || [])[1] || '(senza titolo)';
    const immagini = [...pezzo.matchAll(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/g)];
    const film = [...pezzo.matchAll(/<source src="([^"]+)"/g)].map(m => m[1]);
    const generici = immagini.filter(m => GENERICO.test(m[2])).length;
    const scritti = immagini.filter(m => !GENERICO.test(m[2]));

    console.log('\n   ' + titolo);
    console.log('      immagini: ' + immagini.length + '   scritte a mano: ' + scritti.length
      + '   video: ' + film.length);
    const prefissi = new Set(immagini.map(m => m[1].split('/').pop().replace(/-\d+\.\w+$/, '')));
    console.log('      prefissi: ' + [...prefissi].join(', '));
    if (film.length) console.log('      film: ' + film.map(f => f.split('/').pop()).join(', '));
    for (const s of scritti) {
      const nome = s[1].split('/').pop();
      const testo = s[2].length > 95 ? s[2].slice(0, 95) + '…' : s[2];
      console.log('        ' + nome.padEnd(16) + ' «' + testo + '»');
    }
  }
}
