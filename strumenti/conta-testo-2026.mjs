// Confronta il testo di testo.txt con quanto e' pubblicato nella pagina 2026.
import { readFile } from 'node:fs/promises'

const testo = await readFile(
  'D:/Materiali sito/design-week/materiali/2026-OL3/testo OL3.txt',
  'utf8',
)
const html = await readFile(
  'C:/Users/carmen manuela/Documents/Sito web Opencode/design-week/2026-ol3.html',
  'utf8',
)

// Isola il blocco descrittivo: dalla prima <p> alla chiusura della sezione.
const m = html.match(/<section class="sezione">\s*(<p>Cosa[^]*?)\s*<\/section>/)
if (!m) {
  console.error('blocco descrittivo non trovato')
  process.exit(1)
}
const pubblicato = m[1]

const normalizza = (s) =>
  s
    .replace(/<a[^>]*>/g, '')
    .replace(/<\/a>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#+\s*/gm, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

const a = normalizza(testo)
const b = normalizza(pubblicato)

console.log('testo.txt      :', a.length, 'caratteri')
console.log('pagina pubblica:', b.length, 'caratteri')
console.log('identici       :', a === b)
if (a !== b) {
  console.log('\n--- testo.txt ---\n' + a)
  console.log('\n--- pubblicato ---\n' + b)
}
