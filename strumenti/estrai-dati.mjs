// Estrae dai file pubblicati i dati di ciascuna pagina e li scrive in
// strumenti/dati.mjs, che e' la sorgente del generatore.
//
// Per ogni pagina prendo: titolo, descrizione, i metadati og:, il percorso di
// navigazione (briciole), la voce di menu marcata come corrente e il testo
// dentro <main>. Quest'ultimo viene conservato parola per parola: e' il
// contenuto reale gia' pubblicato, non viene riscritto.
//
// I collegamenti del menu e del pie di pagina sono scritti una sola volta nel
// generatore, percorsi dalla radice del sito. Qui mi limito a registrare
// quale di quelle voci e' marcata come corrente su questa pagina.
import fs from 'node:fs';
import path from 'node:path';

const SITO = path.resolve(import.meta.dirname, '..');
const USCITA = path.join(SITO, 'strumenti', 'dati.mjs');

// le pagine di accesso e 404 hanno un guscio a parte: restano fuori
const ESCLUSE = new Set(['index.html', '404.html']);

function pagineHTML(dir) {
  const out = [];
  for (const voce of fs.readdirSync(dir, { withFileTypes: true })) {
    if (voce.name.startsWith('.') || voce.name === 'strumenti' || voce.name === 'assets') continue;
    const pieno = path.join(dir, voce.name);
    if (voce.isDirectory()) out.push(...pagineHTML(pieno));
    else if (voce.name.endsWith('.html')) out.push(pieno);
  }
  return out.sort();
}

// converte un collegamento relativo in percorso dalla radice del sito:
// da "chi-siamo/index.html" il collegamento "../home.html" diventa "home.html",
// e "descrizione-dell-indirizzo-e-quadri-orari.html" diventa
// "chi-siamo/descrizione-dell-indirizzo-e-quadri-orari.html".
// Il generatore fa poi il percorso inverso.
// negli attributi e dentro <title> gli ampersand sono gia' scritti come
// &amp;: se li prendo cosi' e poi li ricodifico all'uscita finisco con
// &amp;amp;. Qui li riporto al carattere semplice.
function decodifica(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function cartella(p) { return p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : ''; }
function allaRadice(pagina, href) {
  if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) return href;
  // si parte dalla cartella della pagina, poi si applica il collegamento
  const parti = cartella(pagina) ? cartella(pagina).split('/') : [];
  for (const pezzo of href.split('/')) {
    if (pezzo === '.' || pezzo === '') continue;
    if (pezzo === '..') parti.pop();
    else parti.push(pezzo);
  }
  return parti.join('/');
}

const estratto = [];
const avvisi = [];

for (const file of pagineHTML(SITO)) {
  const percorso = path.relative(SITO, file).replace(/\\/g, '/');
  if (ESCLUSE.has(percorso)) continue;

  const t = fs.readFileSync(file, 'utf8');

  const titolo = decodifica((t.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? '');
  const descrizione = decodifica((t.match(/<meta name="description" content="([^"]*)">/) || [])[1] ?? '');
  const og = {};
  for (const m of t.matchAll(/<meta property="og:(title|description|image)" content="([^"]*)">/g)) {
    og[m[1]] = decodifica(m[2]);
  }
  const corpo = (t.match(/<main id="contenuto">([\s\S]*?)<\/main>/) || [])[1];

  if (titolo === undefined) avvisi.push(percorso + ': manca <title>');
  if (descrizione === undefined) avvisi.push(percorso + ': manca la descrizione');
  if (corpo === undefined) { avvisi.push(percorso + ': manca <main>'); continue; }

  // percorso di navigazione: i collegamenti sono relativi alla pagina, li
  // riporto alla radice del sito perche' il generatore li riscriva poi
  const briciole = [];
  const bloccoPercorso = t.match(/<nav class="percorso"[\s\S]*?<ol class="percorso__lista">([\s\S]*?)<\/ol>/);
  if (bloccoPercorso) {
    for (const m of bloccoPercorso[1].matchAll(/<li>([\s\S]*?)<\/li>/g)) {
      const voce = m[1];
      const a = voce.match(/<a href="([^"]*)">([\s\S]*?)<\/a>/);
      const span = voce.match(/<span[^>]*>([\s\S]*?)<\/span>/);
      if (a) briciole.push({ testo: decodifica(a[2].trim()), href: allaRadice(percorso, a[1]) });
      else if (span) briciole.push({ testo: decodifica(span[1].trim()) });
    }
  }

  // la voce di menu marcata come corrente (solo dentro il menu principale).
  // Il sito pubblicato scrive "./" per la voce corrente: quel collegamento
  // pero' punta alla cartella, non alla pagina, e su chi-siamo/laboratori/
  // finisce su un 404. Registro quindi la pagina stessa come voce corrente:
  // il generatore ne scriverà il percorso giusto.
  let attivo = null;
  const bloccoNav = t.match(/<nav class="nav"[\s\S]*?<\/nav>/);
  if (bloccoNav) {
    const marcature = [...bloccoNav[0].matchAll(/<a[^>]*href="([^"]*)"[^>]*aria-current="([^"]*)"[^>]*>/g)];
    if (marcature.length === 1) {
      const risolto = allaRadice(percorso, marcature[0][1]);
      attivo = { href: risolto === cartella(percorso) || risolto === percorso ? percorso : risolto, valore: marcature[0][2] };
    } else if (marcature.length > 1) avvisi.push(percorso + ': ' + marcature.length + ' voci marcate nel menu');
  }

  estratto.push({
    percorso,
    titolo: titolo ?? '',
    descrizione: descrizione ?? '',
    ogTitolo: og.title ?? '',
    ogDescrizione: og.description ?? '',
    ogImmagine: og.image ?? '',
    briciole,
    attivo,
    corpo,
  });
}

// --- il menu e il pie di pagina, scritti una volta sola, dalla radice -------
// I percorsi sono quelli veri del sito; il generatore li rende relativi.
const SEZIONI = [
  {
    testo: 'Chi siamo',
    voce: 'chi-siamo/index.html',
    tipo: 'sezione',
    voci: [
      { testo: "Descrizione dell'indirizzo e quadri orari", href: 'chi-siamo/descrizione-dell-indirizzo-e-quadri-orari.html' },
      { testo: 'Filosofia e approccio di una scuola di design', href: 'chi-siamo/filosofia-e-approccio-di-una-scuola-di-design.html' },
      { testo: 'Le voci di studenti ed ex-studenti', href: 'chi-siamo/le-voci-di-studenti-ed-ex-studenti.html' },
      {
        testo: 'I nostri laboratori', href: 'chi-siamo/i-nostri-laboratori.html',
        figlie: [
          { testo: 'Tecnologia dei materiali e dei processi produttivi e organizzativi della moda', href: 'chi-siamo/laboratori/tecnologia-dei-materiali.html' },
          { testo: 'Ideazione, progettazione e industrializzazione dei prodotti moda', href: 'chi-siamo/laboratori/ideazione-progettazione-industrializzazione.html' },
          { testo: 'Chimica applicata e nobilitazione dei materiali per i prodotti moda', href: 'chi-siamo/laboratori/chimica-applicata.html' },
        ],
      },
      { testo: 'Dove siamo', href: 'chi-siamo/dove-siamo.html' },
    ],
  },
  {
    testo: 'Progetti',
    tipo: 'gruppo',
    voci: [
      { testo: 'Partecipazioni alla Design week', href: 'design-week/index.html' },
      { testo: 'Concorsi e premi', href: 'concorsi-premi/index.html' },
      { testo: 'Altri progetti', href: 'altri-progetti/index.html' },
    ],
  },
  {
    testo: 'Formazione Scuola Lavoro',
    voce: 'formazione-scuola-lavoro/index.html',
    tipo: 'gruppo',
    voci: [
      { testo: 'Stage in azienda', href: 'formazione-scuola-lavoro/stage-in-azienda/index.html' },
      { testo: 'Uscite didattiche FSL', href: 'formazione-scuola-lavoro/uscite-didattiche/index.html' },
      { testo: 'Viaggi FSL', href: 'formazione-scuola-lavoro/viaggi-fsl/index.html' },
      { testo: 'Collaborazioni con aziende, enti e associazioni', href: 'formazione-scuola-lavoro/collaborazioni/enti-associazioni/index.html' },
      { testo: 'Collaborazioni internazionali', href: 'formazione-scuola-lavoro/collaborazioni/internazionali/index.html' },
    ],
  },
  {
    testo: 'Orientamento e iscrizioni',
    voce: 'orientamento-e-iscrizioni/index.html',
    tipo: 'sezione',
    rilevante: true,
    voci: [
      {
        testo: 'Le notti del tecnico moda', href: 'orientamento-e-iscrizioni/le-notti-del-tecnico-moda/index.html',
        figlie: [
          { testo: 'Prenotazioni Anno corrente', href: 'orientamento-e-iscrizioni/le-notti-del-tecnico-moda/prenotazioni-anno-corrente.html' },
          { testo: 'Le edizioni precedenti', href: 'orientamento-e-iscrizioni/le-notti-del-tecnico-moda/le-edizioni-precedenti.html' },
        ],
      },
      { testo: 'Prenota i microinserimenti', href: 'orientamento-e-iscrizioni/prenota-i-microinserimenti.html' },
      { testo: 'Iscrizioni', href: 'orientamento-e-iscrizioni/iscrizioni.html' },
    ],
  },
];

const PIE = [
  { testo: 'Chi siamo', href: 'chi-siamo/index.html' },
  { testo: 'Partecipazioni alla Design week', href: 'design-week/index.html' },
  { testo: 'Concorsi e premi', href: 'concorsi-premi/index.html' },
  { testo: 'Altri progetti', href: 'altri-progetti/index.html' },
  { testo: 'Stage in azienda', href: 'formazione-scuola-lavoro/stage-in-azienda/index.html' },
  { testo: 'Collaborazioni con aziende, enti e associazioni', href: 'formazione-scuola-lavoro/collaborazioni/enti-associazioni/index.html' },
  { testo: 'Collaborazioni internazionali', href: 'formazione-scuola-lavoro/collaborazioni/internazionali/index.html' },
  { testo: 'Viaggi FSL', href: 'formazione-scuola-lavoro/viaggi-fsl/index.html' },
  { testo: 'Uscite didattiche FSL', href: 'formazione-scuola-lavoro/uscite-didattiche/index.html' },
  { testo: 'Orientamento e iscrizioni', href: 'orientamento-e-iscrizioni/index.html' },
];

const testata = '// Dati del sito, estratti dai file pubblicati.\n'
  + '// Generato da strumenti/estrai-dati.mjs: non aggiustare a mano le voci\n'
  + '// delle pagine, salvo i corpi che sono il contenuto reale.\n\n'
  + 'export const SEZIONI = ' + JSON.stringify(SEZIONI, null, 2) + ';\n\n'
  + 'export const PIE = ' + JSON.stringify(PIE, null, 2) + ';\n\n'
  + 'export const PAGINE = ' + JSON.stringify(estratto, null, 2) + ';\n';

fs.writeFileSync(USCITA, testata, 'utf8');

// --- riepilogo -------------------------------------------------------------
console.log('pagine estratte: ' + estratto.length);
const conAttivo = estratto.filter(p => p.attivo).length;
const conPercorso = estratto.filter(p => p.briciole.length).length;
console.log('  con voce di menu marcata: ' + conAttivo);
console.log('  con percorso di navigazione: ' + conPercorso);
console.log('  senza percorso (la home): ' + estratto.filter(p => !p.briciole.length).map(p => p.percorso).join(', '));

const ogImm = new Map();
estratto.forEach(p => ogImm.set(p.ogImmagine, (ogImm.get(p.ogImmagine) || 0) + 1));
console.log('  valori di og:image: ' + [...ogImm].map(([v, n]) => v + ' ×' + n).join('   '));

// quante pagine hanno un titolo nel formato "Pagina | Sito"
const conPipe = estratto.filter(p => p.titolo.includes(' | ')).length;
console.log('  titoli con " | ": ' + conPipe + ' di ' + estratto.length);

if (avvisi.length) {
  console.log('\n== avvisi ==');
  avvisi.forEach(a => console.log('  ' + a));
} else {
  console.log('\nnessun avviso');
}
