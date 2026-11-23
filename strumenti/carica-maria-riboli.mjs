import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { default: sharp } = await import(pathToFileURL('D:/Documenti/Progetto predefinito/node_modules/sharp/lib/index.js').href);
const root='C:/Users/carmen manuela/Documents/Sito web Opencode';
const src='D:/Materiali sito/concorsi-premi/materiali/2019_Concorso Maria Riboli/Selezione Maria Rivoli';
const out=path.join(root,'assets/img/concorsi/maria-riboli');fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync(src).filter(x=>/\.jpe?g$/i.test(x)).sort((a,b)=>a.localeCompare(b,'it',{numeric:true}));
const imgs=[];
for(let i=0;i<files.length;i++){const name=`maria-${String(i+1).padStart(2,'0')}.jpg`;const b=await sharp(path.join(src,files[i])).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality:82,mozjpeg:true}).toBuffer();fs.writeFileSync(path.join(out,name),b);const m=await sharp(b).metadata();imgs.push({name,width:m.width,height:m.height});}
const fig=`        <figure class="carousel" data-carosello>\n${imgs.map((x,i)=>`          <div class="carousel__scena" data-scena>\n            <img class="carousel__immagine" src="../assets/img/concorsi/maria-riboli/${x.name}" alt="Immagine del progetto «Maria Riboli» — immagine ${i+1} di ${imgs.length}"\n                 width="${x.width}" height="${x.height}" loading="lazy" decoding="async">\n          </div>`).join('\n')}\n          <div class="carousel__comandi" data-comandi>\n            <button class="carousel__freccia" type="button" data-indietro\n                    aria-label="Immagine precedente">&larr;</button>\n            <p class="carousel__conta" data-conta aria-live="polite"></p>\n            <button class="carousel__freccia" type="button" data-avanti\n                    aria-label="Immagine successiva">&rarr;</button>\n          </div>\n        </figure>`;
const page=path.join(root,'concorsi-premi/2019-maria-riboli.html');let h=fs.readFileSync(page,'utf8');const re=/      <section class="sezione">[\s\S]*?      <\/section>/;if(!re.test(h))throw new Error('sezione non trovata');h=h.replace(re,`      <section class="sezione">\n        <h2>Il progetto</h2>\n${fig}\n      </section>`);fs.writeFileSync(page,h,'utf8');console.log(`inserite ${imgs.length} immagini`);
