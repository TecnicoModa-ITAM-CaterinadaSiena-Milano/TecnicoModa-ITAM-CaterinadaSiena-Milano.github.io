import sharp from 'file:///D:/Documenti/Progetto%20predefinito/node_modules/sharp/lib/index.js'

const cartella = 'C:/Users/carmen manuela/AppData/Local/Temp/opencode'
const destinazione = 'C:/Users/carmen manuela/Documents/Sito web Opencode/assets/img/artdecoeur2025'

for (let n = 1; n <= 3; n++) {
  const sorgente = `${cartella}/poster-${n}.png`
  const meta = await sharp(sorgente).metadata()
  const out = await sharp(sorgente)
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true })
  await sharp(out.data).toFile(`${destinazione}/artdecoeur-film-${n}.jpg`)
  console.log(
    `film-${n}: ${meta.width}x${meta.height} -> ${out.info.width}x${out.info.height}  ` +
      `${(out.info.size / 1024).toFixed(0)} KB`,
  )
}
