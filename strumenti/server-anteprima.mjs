// Server statico minimo per guardare il sito in locale prima di pubblicarlo.
// Nessuna dipendenza: node strumenti/server-anteprima.mjs [porta]
//
// Serve i file dalla cartella del sito. La porta di default e' 4173.
// La cartella degli strumenti non viene servita, per non esporre i dati
// estratti e le copie provvisorie.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const SITO = path.resolve(import.meta.dirname, '..');
const PORTA = Number(process.argv[2] || 4173);

const TIPI = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
};

// il percorso richiesto non deve uscire dal sito
function dentro(percorsi) {
  const pieno = path.resolve(SITO, '.' + percorsi);
  return pieno.startsWith(SITO + path.sep) || pieno === SITO ? pieno : null;
}

const server = http.createServer((req, res) => {
  let percorsi;
  try {
    percorsi = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('richiesta non valida');
    return;
  }

  // la radice e' la pagina di accesso
  if (percorsi === '/') percorsi = '/index.html';

  const pieno = dentro(percorsi);
  if (!pieno) {
    res.writeHead(403).end('percorso fuori dal sito');
    return;
  }

  fs.stat(pieno, (errore, stat) => {
    // una cartella senza file viene servita con il suo index.html
    if (!errore && stat.isDirectory()) {
      const index = path.join(pieno, 'index.html');
      if (fs.existsSync(index)) return servi(res, index);
      res.writeHead(404).end('cartella senza index.html');
      return;
    }
    if (errore || !stat.isFile()) {
      // la pagina 404 del sito gestisce i collegamenti rotti
      const pagina404 = path.join(SITO, '404.html');
      if (fs.existsSync(pagina404)) return servi(res, pagina404, 404);
      res.writeHead(404).end('file non trovato');
      return;
    }
    servi(res, pieno);
  });
});

function servi(res, pieno, codice) {
  const est = path.extname(pieno).toLowerCase();
  const tipo = TIPI[est] || 'application/octet-stream';
  res.writeHead(codice || 200, {
    'Content-Type': tipo,
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(pieno).pipe(res);
}

server.listen(PORTA, () => {
  console.log('sito in locale su http://localhost:' + PORTA + '/');
  console.log('cartella: ' + SITO);
});
