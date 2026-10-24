// Costruisce le gallery delle Design week a partire dai materiali.
//
// Per ciascuna voce del prospetto qui sotto: prende le immagini di una
// cartella dei materiali, le porta a 1600px sul lato lungo, le salva in
// assets/img/<cartella>/<prefisso>-NN.jpg e scrive il blocco HTML della
// gallery nella pagina. Le cartelle che contengono «ignora» o «scarta» nel
// nome non vengono mai toccate.
//
// Prima di sostituire una gallery confronta il numero di immagini con quello
// gia' pubblicato: se i materiali ne contengono di meno la gallery pubblicata
// resta com'e' e la differenza viene segnalata. Non si toglie mai una
// immagine gia' online.
//
// Le pagine vengono riscritte qui; poi si rilancia estrai-dati.mjs e
// genera-sito.mjs, che rigenera tutto il sito.
// importato qui per non appesantire il ramo che tratta solo immagini
import { spawnSync } from 'node:child_process';

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// NODE_PATH non vale per gli import ESM, quindi sharp si prende dal percorso
// assoluto del suo pacchetto
const SHARP = 'D:/Documenti/Progetto predefinito/node_modules/sharp/lib/index.js';
const { default: sharp } = await import(pathToFileURL(SHARP).href);

const SITO = path.resolve(import.meta.dirname, '..');
const MAT = 'D:/Materiali sito/design-week/materiali';
const LATO = 1600;
const QUALITA = 82;

// ogni voce dice dove leggere e dove scrivere
const PROSPETTO = [
  {
    pagina: 'design-week/2017-analogue-dialogues.html',
    cartella: 'assets/img/analogue2017',
    temi: [
      { titolo: 'Le immagini del progetto', prefisso: 'analogue', sorgente: '2017-analogue-dialogues' },
    ],
  },
  {
    pagina: 'design-week/2018-pa-pa-ra-pa.html',
    cartella: 'assets/img/paaparapa2018',
    temi: [
      { titolo: 'La locandina del progetto', prefisso: 'locandina', sorgente: '2018-pa-pa-ra-pa', file: ['locandina fuorisalone.jpg'] },
      { titolo: 'Oggettistica', prefisso: 'oggettistica', sorgente: '2018-pa-pa-ra-pa', sottocartella: 'Gallery1_Oggettistica' },
      { titolo: 'Carte da parati e cartoline', prefisso: 'carte', sorgente: '2018-pa-pa-ra-pa', sottocartella: 'Gallery2_Carte da parati e cartoline' },
    ],
  },
  {
    pagina: 'design-week/2023-sa-valligia-de-isigius.html',
    cartella: 'assets/img/valigia2023',
    aggiungi: true,
    temi: [
      { titolo: 'Arazzi', prefisso: 'arazzi', sorgente: '2023-sa-valigia-de-is-desigius', sottocartella: 'Gallery1_Arazzi' },
      { titolo: 'Oggetti tessili', prefisso: 'tessili', sorgente: '2023-sa-valigia-de-is-desigius', sottocartella: 'Gallery2_Oggetti tessili' },
      { titolo: 'Oggetti tagliati a laser', prefisso: 'laser', sorgente: '2023-sa-valigia-de-is-desigius', sottocartella: 'Gallery3_Oggetti Tagliati a laser' },
      { titolo: 'Ceramiche', prefisso: 'ceramiche', sorgente: '2023-sa-valigia-de-is-desigius', sottocartella: 'Gallery4_Ceramiche' },
    ],
  },
  {
    pagina: 'design-week/2025-art-de-coeur.html',
    cartella: 'assets/img/artdecoeur2025',
    cartellaVideo: 'assets/video/artdecoeur2025',
    // l'utente ha diviso le immagini in quattro gallery: i temi gia' pubblicati
    // vengono sostituiti tutti, non aggiunti
    sostituisciTemi: true,
    temi: [
      // ArtDeCoeur.gif e' la copertina, gia' pubblicata come banner: la si
      // lascia fuori dalle gallery
      { titolo: 'Accessori', prefisso: 'accessori', sorgente: '2025-art-de-coeur', sottocartella: 'Gallery1_Accessori' },
      { titolo: 'Tessuti', prefisso: 'tessuti', sorgente: '2025-art-de-coeur', sottocartella: 'Gallery2_tessuti' },
      { titolo: 'Abiti', prefisso: 'abiti', sorgente: '2025-art-de-coeur', sottocartella: 'Gallery 3_abiti' },
      { titolo: 'Allestimento', prefisso: 'allestimento', sorgente: '2025-art-de-coeur', sottocartella: 'Gallery 4_allestimento' },
      { titolo: 'Video', prefisso: 'film', sorgente: '2025-art-de-coeur', sottocartella: 'Gallery_video', film: true,
        // la cartolina di titolo per la promozione, il corsetto ricamato per
        // l'esposizione; il making of resta a un quarto della durata
        istantePoster: [0.455, 0.25, 0.182] },
    ],
  },
];

const IMMAGINE = /\.(jpe?g|png|gif|webp|avif)$/i;
const FILM = /\.(mp4|mov|m4v|webm)$/i;
const SCARTA = /ignora|scarta/i;

// ffmpeg serve solo per i film: misura il fotogramma ed estrae il poster
const FFMPEG = 'C:/Users/carmen manuela/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe';
const FFPROBE = FFMPEG.replace(/ffmpeg\.exe$/, 'ffprobe.exe');

// --- utilità ---------------------------------------------------------------

// ordinamento naturale: pagina_2 prima di pagina_10
const naturale = (a, b) => a.localeCompare(b, 'it', { numeric: true });

function sorgenti(tema) {
  const base = path.join(MAT, tema.sorgente);
  if (!fs.existsSync(base)) throw new Error('manca la cartella dei materiali: ' + base);

  // le immagini e i film si cercano con estensioni diverse
  const cerca = tema.film ? FILM : IMMAGINE;

  if (tema.file) {
    return tema.file
      .map(f => path.join(base, f))
      .filter(f => fs.existsSync(f) && cerca.test(f) && !SCARTA.test(f));
  }

  const dir = tema.sottocartella ? path.join(base, tema.sottocartella) : base;
  if (!fs.existsSync(dir)) throw new Error('manca la cartella: ' + dir);

  // se la cartella di primo livello ha sottocartelle ignora si scarta tutto
  // quello che passa da una cartella da ignorare
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(v => v.isFile())
    .map(v => v.name)
    .filter(n => cerca.test(n) && !SCARTA.test(n) && !(tema.escludi && tema.escludi.test(n)))
    .sort(naturale)
    .map(n => path.join(dir, n));
}

// quante immagini con quel prefisso sono gia' pubblicate nella pagina
function pubblicate(html, prefisso) {
  const r = new RegExp("assets/img/[^/\"']*/" + prefisso + "-\\d+\\.jpg", "g");
  return (html.match(r) || []).length;
}

// --- trattamento delle immagini -------------------------------------------

async function prepara(ingresso, uscita) {
  const buffer = await sharp(ingresso)
    .rotate()
    .resize({ width: LATO, height: LATO, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: QUALITA, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(uscita, buffer);
  const dopo = await sharp(buffer).metadata();
  return dopo;
}

// --- trattamento dei film --------------------------------------------------

function comando(ff, argomenti, binario) {
  const r = spawnSync(ff, argomenti, {
    encoding: binario ? undefined : 'utf8',
    maxBuffer: 1 << 28,
  });
  if (r.status !== 0) throw new Error('ffmpeg ha fallito: ' + String(r.stderr || '').slice(-400));
  return binario ? r.stdout : r.stdout.toString('utf8');
}

// porta un film in assets/video e ne ricava il poster: dimensioni e durata
// servono per gli attributi width/height, l'istante dice da quale fotogramma
// ricavare il poster (0.25 = un quarto della durata)
async function preparaFilm(ingresso, uscitaVideo, uscitaPoster, istante) {
  const sorgente = fs.statSync(ingresso);

  // gia' preparato e piu' recente della sorgente? allora si riusa com'e'
  const vecchio = fs.existsSync(uscitaVideo) && fs.statSync(uscitaVideo).mtimeMs > sorgente.mtimeMs;
  if (!vecchio) {
    // si scopre codec e bitrate: l'HEVC a 10 bit non e' riprodotto da Chrome e
    // Firefox, e un h264 gia' compresso male non serve ricodificarlo mentre uno
    // a 10 Mbit va comunque riportato giu'
    const flusso = comando(FFPROBE, [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,bit_rate', '-of', 'csv=p=0', ingresso,
    ]).trim().split(',');
    const codec = flusso[0];
    const bitRate = Number(flusso[1]) || 0;

    const pesato = codec === 'hevc' || bitRate > 2_500_000;
    const argomenti = ['-y', '-hide_banner', '-loglevel', 'error',
      '-i', ingresso, '-map', '0:v:0', '-map', '0:a:0?',
      '-movflags', '+faststart'];
    if (pesato) {
      argomenti.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k');
    } else {
      argomenti.push('-c', 'copy');
    }
    comando(FFMPEG, [...argomenti, uscitaVideo]);
  }

  const durata = parseFloat(comando(FFPROBE, [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', uscitaVideo,
  ]).trim());

  const meta = comando(FFPROBE, [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', uscitaVideo,
  ]).trim().split('x').map(Number);

  // un fotogramma scelto a mano: di default un quarto della durata, che di
  // solito evita l'eventuale dissolvenza iniziale
  const proporzione = istante === undefined ? 0.25 : istante;
  const atto = Math.min(Math.max(proporzione, 0), 0.99);
  const secondo = (durata * atto).toFixed(2);
  const estratto = comando(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error',
    '-ss', secondo, '-i', uscitaVideo, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], true);

  // si porta il poster dentro la memoria: rileggendolo dal disco capita di
  // trovarlo ancora bloccato da ffmpeg
  const poster = await sharp(estratto)
    .flatten({ background: '#ffffff' })
    .resize({ width: LATO, height: LATO, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITA, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(uscitaPoster, poster);
  const dopo = await sharp(poster).metadata();
  return { l: dopo.width, h: dopo.height, durata };
}

// --- il blocco HTML di una gallery ----------------------------------------

function bloccoTema(titolo, immagini) {
  const n = immagini.length;
  const righe = [];
  righe.push('          <article class="tema">');
  righe.push('            <h3 class="tema__titolo">' + titolo + '</h3>');
  righe.push('');
  righe.push('            <figure class="carousel" data-carosello>');
  for (const img of immagini) {
    righe.push('              <div class="carousel__scena" data-scena>');
    righe.push('                <img class="carousel__immagine" src="' + img.src + '" alt="Immagine del progetto «'
      + titolo + '» — immagine ' + img.n + ' di ' + n + '"');
    righe.push('                     width="' + img.l + '" height="' + img.h + '" loading="lazy" decoding="async">');
    righe.push('              </div>');
  }
  righe.push('              <div class="carousel__comandi" data-comandi>');
  righe.push('                <button class="carousel__freccia" type="button" data-indietro');
  righe.push('                        aria-label="Immagine precedente">&larr;</button>');
  righe.push('                <p class="carousel__conta" data-conta aria-live="polite"></p>');
  righe.push('                <button class="carousel__freccia" type="button" data-avanti');
  righe.push('                        aria-label="Immagine successiva">&rarr;</button>');
  righe.push('              </div>');
  righe.push('            </figure>');
  righe.push('          </article>');
  return righe.join('\n');
}

// il blocco HTML di una gallery di film: stesso carosello, ma con <video>
function bloccoFilm(titolo, film) {
  const n = film.length;
  const righe = [];
  righe.push('          <article class="tema">');
  righe.push('            <h3 class="tema__titolo">' + titolo + '</h3>');
  righe.push('');
  righe.push('            <figure class="carousel" data-carosello>');
  for (const f of film) {
    righe.push('              <div class="carousel__scena" data-scena>');
    righe.push('                <video class="carousel__film" controls preload="none" playsinline');
    righe.push('                       width="' + f.l + '" height="' + f.h + '"');
    righe.push('                       poster="' + f.poster + '"');
    righe.push('                       aria-label="Film del progetto «' + titolo + '» — film ' + f.n + ' di ' + n + '">');
    righe.push('                  <source src="' + f.src + '" type="video/mp4">');
    righe.push('                </video>');
    righe.push('              </div>');
  }
  righe.push('              <div class="carousel__comandi" data-comandi>');
  righe.push('                <button class="carousel__freccia" type="button" data-indietro');
  righe.push('                        aria-label="Immagine precedente">&larr;</button>');
  righe.push('                <p class="carousel__conta" data-conta aria-live="polite"></p>');
  righe.push('                <button class="carousel__freccia" type="button" data-avanti');
  righe.push('                        aria-label="Immagine successiva">&rarr;</button>');
  righe.push('              </div>');
  righe.push('            </figure>');
  righe.push('          </article>');
  return righe.join('\n');
}

// --- il corpo della pagina -------------------------------------------------

// sostituisce il blocco «Materiali in preparazione» con la sezione delle gallery
const SEZIONE_SCHEDA = /^ {6}<section class="sezione">\n\n {6}<div class="scheda">\n {8}<p class="scheda__etichetta">Materiali in preparazione<\/p>[\s\S]*?\n {6}<\/div>\n\n {6}<\/section>$/m;

// inserisce altri temi subito prima della chiusura di <div class="temi">
const CHIUSURA_TEMI = /(\n {8}<\/div>)(\n\n {6}<\/section>)/;

// sostituisce l'intero <div class="temi">: serve quando l'utente ha
// riorganizzato le immagini e i temi pubblicati non valgono piu'
const TUTTI_I_TEMI = / {8}<div class="temi">[^]*?\n {8}<\/div>/;

// --- ciclo principale ------------------------------------------------------

const avvisi = [];

for (const voce of PROSPETTO) {
  const pagina = path.join(SITO, voce.pagina);
  let html = fs.readFileSync(pagina, 'utf8');
  const cartellaUscita = path.join(SITO, voce.cartella);
  const cartellaVideo = path.join(SITO, voce.cartellaVideo || voce.cartella);
  fs.mkdirSync(cartellaUscita, { recursive: true });

  const blocchi = [];

  for (const tema of voce.temi) {
    const elenco = sorgenti(tema);
    if (!elenco.length) {
      avvisi.push(voce.pagina + '  «' + tema.titolo + '»: nessun file nella cartella dei materiali');
      continue;
    }

    // le gallery vengono rifatte tutte quando la pagina andrebbe sostituita
    // per intero; altrimenti non si tocca mai una gallery gia' pubblicata
    if (!voce.sostituisciTemi) {
      const giaPubblicate = pubblicate(html, tema.prefisso);
      if (giaPubblicate >= elenco.length) {
        avvisi.push(voce.pagina + '  «' + tema.titolo + '»: pubblicate ' + giaPubblicate
          + ', materiali ' + elenco.length + ' — gallery pubblicata invariata');
        continue;
      }
      if (giaPubblicate > 0) {
        avvisi.push(voce.pagina + '  «' + tema.titolo + '»: pubblicate ' + giaPubblicate
          + ', materiali ' + elenco.length + ' — la gallery viene rifatta con più immagini');
      }
    }

    if (tema.film) {
      fs.mkdirSync(cartellaVideo, { recursive: true });
      const film = [];
      let indice = 0;
      for (const sorgente of elenco) {
        indice++;
        const base = tema.prefisso + '-' + String(indice).padStart(2, '0');
        const meta = await preparaFilm(
          sorgente,
          path.join(cartellaVideo, base + '.mp4'),
          path.join(cartellaUscita, base + '.jpg'),
          tema.istantePoster && tema.istantePoster[indice - 1],
        );
        film.push({
          src: '../' + (voce.cartellaVideo || voce.cartella) + '/' + base + '.mp4',
          poster: '../' + voce.cartella + '/' + base + '.jpg',
          l: meta.l,
          h: meta.h,
          n: indice,
        });
      }
      avvisi.push(voce.pagina + '  «' + tema.titolo + '»: ' + film.length + ' film scritti in '
        + (voce.cartellaVideo || voce.cartella));
      blocchi.push(bloccoFilm(tema.titolo, film));
      continue;
    }

    const immagini = [];
    let indice = 0;
    for (const sorgente of elenco) {
      indice++;
      const nome = tema.prefisso + '-' + String(indice).padStart(2, '0') + '.jpg';
      const destinazione = path.join(cartellaUscita, nome);
      const meta = await prepara(sorgente, destinazione);
      immagini.push({
        src: '../' + voce.cartella + '/' + nome,
        l: meta.width,
        h: meta.height,
        n: indice,
      });
    }
    avvisi.push(voce.pagina + '  «' + tema.titolo + '»: ' + immagini.length + ' immagini scritte in ' + voce.cartella);
    blocchi.push(bloccoTema(tema.titolo, immagini));
  }

  if (!blocchi.length) continue;

  if (voce.sostituisciTemi) {
    if (!TUTTI_I_TEMI.test(html)) {
      avvisi.push(voce.pagina + '  NON SI TROVA <div class="temi">');
      continue;
    }
    html = html.replace(TUTTI_I_TEMI, '        <div class="temi">\n' + blocchi.join('\n') + '\n        </div>');
  } else if (voce.aggiungi) {
    // la pagina ha gia' dei temi: se ne aggiungono altri prima della chiusura
    if (!CHIUSURA_TEMI.test(html)) {
      avvisi.push(voce.pagina + '  NON SI TROVA la chiusura di <div class="temi">');
      continue;
    }
    html = html.replace(CHIUSURA_TEMI, '\n' + blocchi.join('\n') + '$1$2');
  } else {
    // la pagina ha il blocco «Materiali in preparazione»: lo si sostituisce
    if (!SEZIONE_SCHEDA.test(html)) {
      avvisi.push(voce.pagina + '  NON SI TROVA il blocco «Materiali in preparazione»');
      continue;
    }
    const sezione = '      <section class="sezione">\n'
      + '        <h2>Le gallerie del progetto</h2>\n\n'
      + '        <div class="temi">\n'
      + blocchi.join('\n') + '\n'
      + '        </div>\n\n'
      + '      </section>';
    html = html.replace(SEZIONE_SCHEDA, sezione);
  }

  fs.writeFileSync(pagina, html, 'utf8');
  avvisi.push(voce.pagina + '  pagina riscritta');
}

console.log(avvisi.join('\n'));
