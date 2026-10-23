// Generatore del sito.
//
// Legge strumenti/dati.mjs (pagine estratte dai file pubblicati) e riscrive
// tutte le pagine: testata, menu, percorso di navigazione e pie di pagina
// vengono da un unico modello, il corpo di ciascuna pagina e' conservato
// com'e'.
//
// Percorsi relativi, regola unica:
//   - verso la pagina stessa  -> "./" se la pagina e' un index.html,
//                                 altrimenti solo il nome del file
//   - verso un file di un'altra cartella -> si sale alla radice con "../"
//                                           ripetuti per la profondita' e si
//                                           riscende lungo il percorso intero
// La regola e' stata verificata su tutti i collegamenti del sito pubblicato.
//
// Uso:
//   node strumenti/genera-sito.mjs            riscrive il sito
//   node strumenti/genera-sito.mjs --verifica scrive in una cartella a parte
//                                             e confronta con il sito attuale
import fs from 'node:fs';
import path from 'node:path';
import { SEZIONI, PIE, PAGINE } from './dati.mjs';

const SITO = path.resolve(import.meta.dirname, '..');
const USCITA = process.argv.includes('--verifica')
  ? path.join(SITO, 'strumenti', 'prova-generata')
  : SITO;

// --- versioni dei file di stile e dello script -----------------------------
function mtime(rel) {
  const p = path.join(SITO, rel);
  return fs.existsSync(p) ? Math.round(fs.statSync(p).mtimeMs) : 0;
}
const V_CSS = mtime('assets/css/style.css');
const V_ASP = mtime('assets/css/aspetto-nero.css');
const V_JS = mtime('assets/js/main.js');

// --- percorsi relativi -----------------------------------------------------
const cartella = p => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');

function relativo(da, verso) {
  // verso se stessa: serve il nome del file. «./» punterebbe alla cartella e
  // su chi-siamo/laboratori/ non esiste alcun index.html, quindi il
  // collegamento finirebbe su un errore 404.
  if (da === verso) return verso.slice(verso.lastIndexOf('/') + 1);
  const d = cartella(da);
  // stesso cartella: basta il nome del file
  if (d === cartella(verso)) return verso.slice(verso.lastIndexOf('/') + 1);
  const su = d === '' ? 0 : d.split('/').length;
  return '../'.repeat(su) + verso;
}

// l'id del pannello: dal percorso, o dal nome della sezione, tutto minuscolo
// e con i caratteri non alfanumerici ridotti a trattino
const idPannello = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const R = p => '../'.repeat(cartella(p) === '' ? 0 : cartella(p).split('/').length);
// i valori estratti sono in caratteri semplici: qui si rimettono le
// entita' HTML, separate fra testo (titolo) e attributo (descrizioni)
const testo = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attributo = s => testo(s).replace(/"/g, '&quot;');

// --- il menu di navigazione ------------------------------------------------
// `attivo` e' il percorso della pagina corrente, se compare nel menu.
// La voce corrente esce marcata con aria-current.
function menu(pagina, attivo) {
  const righe = [];
  for (const sezione of SEZIONI) {
    const pannelloId = 'pannello-' + idPannello(sezione.voce || sezione.testo);
    const eSezioneCorrente = sezione.tipo === 'sezione' && sezione.voce === attivo;

    const classeLi = 'nav__voce' + (sezione.rilevante ? ' nav__voce--rilevante' : '');
    righe.push('        <li class="' + classeLi + '">');

    if (sezione.tipo === 'sezione') {
      righe.push('          <a class="nav__voce-sezione" href="' + relativo(pagina, sezione.voce) + '"'
        + (eSezioneCorrente ? ' aria-current="true"' : '') + '>' + sezione.testo + '</a>');
    } else {
      righe.push('          <span class="nav__voce-sezione nav__voce-sezione--gruppo">' + sezione.testo + '</span>');
    }

    righe.push('          <button class="nav__apri" type="button" aria-expanded="false" aria-controls="' + pannelloId + '">');
    righe.push('            <span class="visually-hidden">Apri il menu di «' + sezione.testo + '»</span>');
    righe.push('          </button>');

    const gruppo = sezione.tipo === 'gruppo';
    righe.push('          <div class="pannello' + (gruppo ? ' pannello--gruppo' : '') + '" id="' + pannelloId + '">');
    righe.push(gruppo ? '<ul class="gruppo">' : '<ul class="pannello__lista">');

    for (const voce of sezione.voci) {
      const marcata = voce.href === attivo;
      const href = relativo(pagina, voce.href);

      if (gruppo) {
        righe.push('            <li><a class="gruppo__voce" href="' + href + '">');
        righe.push('              <span class="gruppo__titolo">' + testo(voce.testo) + '</span>');
        righe.push('              <span class="gruppo__freccia" aria-hidden="true">&rarr;</span>');
        righe.push('            </a></li>');
        continue;
      }

      if (voce.figlie) {
        righe.push('            <li class="pannello__gruppo">');
        righe.push('              <a class="pannello__voce" href="' + href + '"'
          + (marcata ? ' aria-current="page"' : '') + '>' + testo(voce.testo) + '</a>');
        righe.push('              <ul class="pannello__figlie">');
        for (const figlia of voce.figlie) {
          righe.push('                <li><a class="pannello__voce pannello__voce-figlia" href="'
            + relativo(pagina, figlia.href) + '"'
            + (figlia.href === attivo ? ' aria-current="page"' : '') + '>' + figlia.testo + '</a></li>');
        }
        righe.push('              </ul>');
        righe.push('            </li>');
      } else {
        righe.push('            <li><a class="pannello__voce" href="' + href + '"'
          + (marcata ? ' aria-current="page"' : '') + '>' + testo(voce.testo) + '</a></li>');
      }
    }

    righe.push('          </ul>');
    righe.push('          </div>');
    righe.push('        </li>');
  }
  return righe.join('\n');
}

// --- il pie di pagina ------------------------------------------------------
function piedipagina(pagina) {
  const righe = [];
  righe.push('  <footer class="piedipagina">');
  righe.push('    <div class="container piedipagina__interno">');
  righe.push('      <div>');
  righe.push('        <p class="piedipagina__titolo">Tecnico Sistema Moda (ITAM)</p>');
  righe.push('        <p>Caterina da Siena · Milano</p>');
  righe.push('      </div>');
  righe.push('');
  righe.push('      <nav aria-label="Sezioni del sito">');
  righe.push('        <p class="piedipagina__titolo">Sezioni</p>');
  righe.push('        <ul class="piedipagina__lista">');
  for (const voce of PIE) {
    righe.push('          <li><a href="' + relativo(pagina, voce.href) + '">' + testo(voce.testo) + '</a></li>');
  }
  righe.push('        </ul>');
  righe.push('      </nav>');
  righe.push('');
  righe.push('      <p>Struttura del sito in preparazione. Le pagine sono predisposte per i materiali reali.</p>');
  righe.push('    </div>');
  righe.push('  </footer>');
  return righe.join('\n');
}

// --- il percorso di navigazione --------------------------------------------
function percorsoNavigazione(pagina, briciole) {
  if (!briciole.length) return '';
  const righe = [];
  righe.push('  <nav class="percorso" aria-label="Percorso di navigazione">');
  righe.push('    <div class="container">');
  righe.push('      <ol class="percorso__lista">');
  for (const voce of briciole) {
    if (voce.href) righe.push('        <li><a href="' + relativo(pagina, voce.href) + '">' + testo(voce.testo) + '</a></li>');
    else righe.push('        <li><span class="percorso__corrente" aria-current="page">' + testo(voce.testo) + '</span></li>');
  }
  righe.push('      </ol>');
  righe.push('    </div>');
  righe.push('  </nav>');
  return righe.join('\n');
}

// --- la pagina intera ------------------------------------------------------
function paginaHTML(p) {
  const r = R(p.percorso);
  const attivo = p.attivo ? p.attivo.href : null;

  const parteAlta = [
    '<!doctype html>',
    '<html lang="it">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    '',
    '  <title>' + testo(p.titolo) + '</title>',
    '  <meta name="description" content="' + attributo(p.descrizione) + '">',
    '  <meta name="theme-color" content="#500019">',
    '',
    '  <meta property="og:type" content="website">',
    '  <meta property="og:site_name" content="Tecnico Sistema Moda (ITAM) — Caterina da Siena · Milano">',
    '  <meta property="og:title" content="' + attributo(p.ogTitolo) + '">',
    '  <meta property="og:description" content="' + attributo(p.ogDescrizione) + '">',
    '  <meta property="og:image" content="' + r + 'assets/img/anteprima.svg">',
    '  <meta name="twitter:card" content="summary_large_image">',
    '',
    '  <link rel="preconnect" href="https://fonts.googleapis.com">',
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700&family=Syne:wght@600;700;800&display=swap">',
    '',
    '  <link rel="icon" href="' + r + 'favicon.svg" type="image/svg+xml">',
    '  <link rel="stylesheet" href="' + r + 'assets/css/style.css?v=' + V_CSS + '">',
    '  <link rel="stylesheet" href="' + r + 'assets/css/aspetto-nero.css?v=' + V_ASP + '">  <script src="'
      + r + 'assets/js/main.js?v=' + V_JS + '" defer></script>',
    '</head>',
    '<body data-gate="' + r + 'index.html">',
    '  <a class="salta" href="#contenuto">Salta al contenuto</a>',
    '  <header class="intestazione">',
    '    <div class="container intestazione__interno">',
    '      <a class="titolo-sito" href="' + relativo(p.percorso, 'home.html') + '">',
    '        <img class="titolo-sito__logo" src="' + r + 'identita/logo-caterina-bianco.png" alt="" width="544" height="260" aria-hidden="true">',
    '        <span>',
    '          <span class="titolo-sito__riga1">Tecnico Sistema Moda (ITAM)</span>',
    '          <span class="titolo-sito__riga2">Caterina da Siena · Milano</span>',
    '        </span>',
    '      </a>',
    '    </div>',
    '',
    '    <div class="barra">',
    '      <div class="container">',
    '        <div class="comandi-barra">',
    '          <button class="menu-btn" type="button" aria-expanded="false" aria-controls="navigazione">',
    '            <span class="menu-btn__righe" aria-hidden="true"><span></span><span></span><span></span></span>',
    '            Menu',
    '          </button>',
    '          <a class="accesso-rapido" href="' + relativo(p.percorso, 'orientamento-e-iscrizioni/index.html') + '">Orientamento e iscrizioni</a>',
    '        </div>',
    '',
    '        <nav class="nav" id="navigazione" aria-label="Navigazione principale">',
    '          <ul class="nav__lista">',
    menu(p.percorso, attivo),
    '          </ul>',
    '        </nav>',
    '      </div>',
    '    </div>',
    '  </header>',
  ];

  // fra l'intestazione e il corpo c'e' sempre una riga vuota. Se la pagina ha
  // il percorso di navigazione, il blocco esce con una riga vuota prima e una
  // dopo; se non lo ha (la home) resta solo la riga dell'intestazione.
  const righe = [...parteAlta, ''];
  const bloccoPercorso = percorsoNavigazione(p.percorso, p.briciole);
  if (bloccoPercorso) righe.push(bloccoPercorso, '');

  // il corpo conserva i due ritorni a capo del file pubblicato prima e dopo:
  // qui si rimette solo il tag di chiusura
  righe.push(
    '  <main id="contenuto">' + p.corpo + '</main>',
    piedipagina(p.percorso),
    '</body>',
    '</html>',
    '',
  );
  return righe.join('\n');
}

// --- scrittura e confronto -------------------------------------------------
let scritte = 0, uguali = 0, cambiate = [];
const differenze = [];

for (const p of PAGINE) {
  const testo = paginaHTML(p);
  const destinazione = path.join(USCITA, p.percorso);
  const pubblicato = path.join(SITO, p.percorso);
  const era = fs.existsSync(pubblicato) ? fs.readFileSync(pubblicato, 'utf8') : null;

  fs.mkdirSync(path.dirname(destinazione), { recursive: true });
  fs.writeFileSync(destinazione, testo, 'utf8');
  scritte++;

  if (USCITA === SITO) continue;

  if (era === testo) { uguali++; continue; }
  cambiate.push(p.percorso);
  if (era !== null) {
    const a = era.split('\n'), b = testo.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        differenze.push({ pagina: p.percorso, riga: i + 1, pubblicato: a[i] ?? '(mancante)', generato: b[i] ?? '(mancante)' });
      }
    }
  }
}

console.log('pagine scritte: ' + scritte);
if (USCITA === SITO) {
  console.log('sito riscritto nella posizione originale.');
} else {
  console.log('identiche al pubblicato: ' + uguali);
  console.log('diverse: ' + cambiate.length + (cambiate.length ? '   ' + cambiate.join(', ') : ''));
  console.log('\nrighe diverse: ' + differenze.length);
  for (const d of differenze.slice(0, 40)) {
    console.log('  ' + d.pagina + '  riga ' + d.riga);
    console.log('     pubblicato: ' + (d.pubblicato ?? ''));
    console.log('     generato  : ' + (d.generato ?? ''));
  }
  if (differenze.length > 40) console.log('  ... altri ' + (differenze.length - 40) + ' differimenti');
}
