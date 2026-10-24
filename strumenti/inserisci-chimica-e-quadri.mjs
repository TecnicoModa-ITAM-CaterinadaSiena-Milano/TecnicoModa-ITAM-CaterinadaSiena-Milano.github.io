import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { default: sharp } = await import(pathToFileURL('D:/Documenti/Progetto predefinito/node_modules/sharp/lib/index.js').href);
const root = 'C:/Users/carmen manuela/Documents/Sito web Opencode';
const page = path.join(root,'chi-siamo/laboratori/chimica-applicata.html');
let html = fs.readFileSync(page,'utf8');
const files=[];
for(let i=1;i<=17;i++){
 const name=`apparenze-${String(i).padStart(2,'0')}.jpg`;
 const m=await sharp(path.join(root,'assets/img/ol3',name)).metadata();
 files.push(`          <div class="carousel__scena" data-scena>\n            <img class="carousel__immagine" src="../../assets/img/ol3/${name}" alt=""\n                 width="${m.width}" height="${m.height}" loading="lazy" decoding="async">\n          </div>`);
}
const figure=`        <figure class="carousel" data-carosello>\n${files.join('\n')}\n          <div class="carousel__comandi" data-comandi>\n            <button class="carousel__freccia" type="button" data-indietro\n                    aria-label="Immagine precedente">&larr;</button>\n            <p class="carousel__conta" data-conta aria-live="polite"></p>\n            <button class="carousel__freccia" type="button" data-avanti\n                    aria-label="Immagine successiva">&rarr;</button>\n          </div>\n        </figure>`;
html=html.replace('        <p class="corto__avviso">Le fotografie del laboratorio di chimica applicata non sono ancora state inserite.</p>',figure);
fs.writeFileSync(page,html,'utf8');
const descr=path.join(root,'chi-siamo/descrizione-dell-indirizzo-e-quadri-orari.html');
let d=fs.readFileSync(descr,'utf8');
d=d.replace(/        <p>Sono disponibili entrambi i quadri orari:<\/p>[\s\S]*?        <p>Il quadro orario del triennio del nuovo ordinamento riporta[\s\S]*?<\/p>/,
`        <p>È disponibile il quadro orario del nuovo ordinamento:</p>\n        <p><a href="../assets/doc/quadro-orario-riforma-tecnici.pdf">Quadro orario riforma tecnici (PDF)</a></p>\n        <p><img src="../assets/img/quadro-orario-riforma-tecnici.jpg" alt="" width="1489" height="2105" loading="lazy" decoding="async"></p>`);
d=d.replace(/        <p class="appunti"><strong>In questa fase<\/strong>Le tabelle dei quadri orari non sono ancora disponibili in questa fase\. Le saranno inserite nella pagina «Descrizione dell’indirizzo e quadri orari»\.<\/p>/,'');
fs.writeFileSync(descr,d,'utf8');
console.log('gallery chimica: 17 immagini');
console.log('quadri orari: PDF + JPG inseriti');
