// Costruisce un foglio di contatto etichettato per confrontare immagini a schermo.
// Uso: node foglio-contatto.mjs <file-di-uscita> <immagine> [<immagine> ...]
import sharp from 'file:///D:/Documenti/Progetto%20predefinito/node_modules/sharp/lib/index.js'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const [uscita, ...percorsi] = process.argv.slice(2)
if (!uscita || percorsi.length === 0) {
  console.error('manca il file di uscita o le immagini')
  process.exit(1)
}

const CELLA = 300
const COLONNE = 4
const ETICHETTA = 22

const celle = []
for (const percorso of percorsi) {
  const nome = path.basename(percorso)
  const buf = await sharp(percorso)
    .rotate()
    .resize({ width: CELLA, height: CELLA, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer()
  const meta = await sharp(buf).metadata()
  celle.push({ nome, buf, w: meta.width, h: meta.height })
}

const righe = Math.ceil(celle.length / COLONNE)
const W = COLONNE * CELLA
const H = righe * (CELLA + ETICHETTA)

const livelli = []
celle.forEach((c, i) => {
  const x = (i % COLONNE) * CELLA + Math.floor((CELLA - c.w) / 2)
  const y = Math.floor(i / COLONNE) * (CELLA + ETICHETTA) + Math.floor((CELLA - c.h) / 2)
  livelli.push({ input: c.buf, left: x, top: y })

  const svg = `<svg width="${CELLA}" height="${ETICHETTA}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <text x="4" y="15" font-family="sans-serif" font-size="12" fill="#000000">${c.nome
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')}</text>
  </svg>`
  livelli.push({
    input: Buffer.from(svg),
    left: (i % COLONNE) * CELLA,
    top: Math.floor(i / COLONNE) * (CELLA + ETICHETTA) + CELLA,
  })
})

await sharp({
  create: { width: W, height: H, channels: 3, background: '#f0f0f0' },
})
  .composite(livelli)
  .png()
  .toFile(uscita)

await writeFile(uscita + '.txt', celle.map((c) => c.nome).join('\n'))
console.log(`${celle.length} immagini -> ${uscita}  (${W}x${H})`)
