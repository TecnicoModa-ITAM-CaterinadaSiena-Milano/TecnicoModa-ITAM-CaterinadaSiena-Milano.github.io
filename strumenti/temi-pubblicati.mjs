// Per ogni pagina di Design week pubblicata: i titoli dei temi con il numero
// di immagini e i prefissi dei file, e i video. Serve a mettere i temi in
// corrispondenza con le cartelle dei materiali.
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'C:/Users/carmen manuela/Documents/Sito web Opencode/design-week';
const pagine = fs.readdirSync(DIR).filter(f => f.endsWith('.html') && f !== 'index.html').sort();

for (const pagina of pagine) {
  const t = fs.readFileSync(path.join(DIR, pagina), 'utf8');
  console.log('\n=== ' + pagina + ' ===');

  const titoloH1 = (t.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1];
  console.log('h1: ' + (titoloH1 || '(nessuno)'));

  // ogni <article class="tema"> e' un tema
  const articoli = [...t.matchAll(/<article class="tema">([\s\S]*?)<\/article>/g)];
  if (!articoli.length) {
    console.log('  nessun tema (pagina senza gallery)');
    continue;
  }
  for (const a of articoli) {
    const blocco = a[1];
    const titolo = (blocco.match(/<h3 class="tema__titolo">([\s\S]*?)<\/h3>/) || [])[1];
    const descrizione = (blocco.match(/<p class="tema__descrizione">([\s\S]*?)<\/p>/) || [])[1];
    const img = [...blocco.matchAll(/<img[^>]*src="([^"]*)"[^>]*>/g)].map(m => m[1]);
    const vid = [...blocco.matchAll(/<(?:video|source)[^>]*src="([^"]*)"/g)].map(m => m[1]);
    const prefissi = new Map();
    for (const s of img) {
      const nome = path.basename(s);
      const p = (nome.match(/^[a-z]+/) || [nome])[0];
      prefissi.set(p, (prefissi.get(p) || 0) + 1);
    }
    console.log('  tema: ' + (titolo || '(senza titolo)'));
    if (descrizione) console.log('       descrizione: ' + descrizione.trim().slice(0, 90));
    console.log('       img ' + img.length + (img.length ? '   prefissi: ' + [...prefissi].map(([k, n]) => k + '×' + n).join(' ') : '')
      + (vid.length ? '   video ' + vid.length : ''));
  }

  // video fuori dai temi
  const temiTesto = articoli.map(a => a[1]).join(' ');
  const tuttiVideo = [...t.matchAll(/<(?:video|source)[^>]*src="([^"]*)"/g)].map(m => m[1]);
  const videoTemi = [...temiTesto.matchAll(/<(?:video|source)[^>]*src="([^"]*)"/g)].map(m => m[1]);
  const fuori = tuttiVideo.length - videoTemi.length;
  if (fuori > 0) console.log('  video fuori dai temi: ' + fuori);
}
