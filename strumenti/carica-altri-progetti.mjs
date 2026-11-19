import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { default: sharp } = await import(pathToFileURL('D:/Documenti/Progetto predefinito/node_modules/sharp/lib/index.js').href);
const ROOT='C:/Users/carmen manuela/Documents/Sito web Opencode';
const SRC='D:/Materiali sito/altri-progetti/materiali';
const IMAGE=/\.(jpe?g|png)$/i;
const SCARTA=/scartate|scarta|ignora|altri formati/i;
const PROGRESSIVO=/^\d+_/;
const projects=[
 {folder:'2025-26_Clima Creativo', page:'altri-progetti/2026-progetto-clima-creativo.html', title:'2025-26 Progetto Clima Creativo', asset:'clima-creativo', prefix:'clima'},
 {folder:'2025-26_Rosa Genoni', page:'altri-progetti/2026-progetto-rosa-genoni.html', title:'2025-26 Progetto Rosa Genoni', asset:'rosa-genoni', prefix:'rosa'},
 {folder:'2023-24_Qubi', page:'altri-progetti/2024-progetto-qu-bi.html', title:'2024 Progetto Qubi', asset:'qubi', prefix:'qubi'},
 {folder:'2023_Tadini', page:'altri-progetti/2023-24-progetto-tadini.html', title:'2023 Progetto Tadini', asset:'tadini', prefix:'tadini'},
 {folder:'2022-23_Muskin', page:'altri-progetti/2023-progetto-muskin.html', title:'2022-23 Progetto Muskin', asset:'muskin', prefix:'muskin'},
 {folder:'2021-22_Clutter', page:'altri-progetti/2021-22-progetto-clutter.html', title:'2021-22 Progetto Clutter', asset:'clutter', prefix:'clutter'},
 {folder:'2016_WeMake_Digitalfashion', page:'altri-progetti/2016-progetto-wemake-digital-fashion.html', title:'2016 Progetto WeMake Digital Fashion', asset:'wemake-digital-fashion', prefix:'wemake'},
];
const natural=(a,b)=>a.localeCompare(b,'it',{numeric:true});
function list(p){
 const out=[];
 function walk(dir){
  for(const x of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>natural(a.name,b.name))){
   const full=path.join(dir,x.name);
   if(x.isDirectory() && !SCARTA.test(x.name)) walk(full);
   else if(x.isFile() && IMAGE.test(x.name) && PROGRESSIVO.test(x.name) && !SCARTA.test(x.name)) out.push(full);
  }
 }
 walk(path.join(SRC,p.folder));
 return out;
}
async function makeImage(src,dst){const b=await sharp(src).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality:82,mozjpeg:true}).toBuffer();fs.writeFileSync(dst,b);return sharp(b).metadata();}
function figure(p,images){const scenes=images.map((x,i)=>`          <div class="carousel__scena" data-scena>\n            <img class="carousel__immagine" src="../assets/img/altri-progetti/${p.asset}/${x.name}" alt="Immagine del progetto «${p.title}» — immagine ${i+1} di ${images.length}"\n                 width="${x.width}" height="${x.height}" loading="lazy" decoding="async">\n          </div>`).join('\n');return `        <figure class="carousel" data-carosello>\n${scenes}\n          <div class="carousel__comandi" data-comandi>\n            <button class="carousel__freccia" type="button" data-indietro\n                    aria-label="Immagine precedente">&larr;</button>\n            <p class="carousel__conta" data-conta aria-live="polite"></p>\n            <button class="carousel__freccia" type="button" data-avanti\n                    aria-label="Immagine successiva">&rarr;</button>\n          </div>\n        </figure>`;}
for(const p of projects){
 const files=list(p); const out=path.join(ROOT,'assets/img/altri-progetti',p.asset); fs.mkdirSync(out,{recursive:true}); const imgs=[];
 for(let i=0;i<files.length;i++){const name=`${p.prefix}-${String(i+1).padStart(2,'0')}.jpg`;const m=await makeImage(files[i],path.join(out,name));imgs.push({name,width:m.width,height:m.height});}
 let page=path.join(ROOT,p.page);
 if(!fs.existsSync(page)){const template=fs.readFileSync(path.join(ROOT,'altri-progetti/2023-progetto-muskin.html'),'utf8');fs.writeFileSync(page,template.replaceAll('2023 Progetto Muskin',p.title),'utf8');}
 let html=fs.readFileSync(page,'utf8');html=html.replace(/<title>[^<]*<\/title>/,`<title>${p.title} | Tecnico Sistema Moda (ITAM)</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${p.title}. Tecnico Sistema Moda (ITAM), Caterina da Siena · Milano.">`).replace(/<h1>[^<]*<\/h1>/,`<h1>${p.title}</h1>`).replace(/<span class="percorso__corrente"[^>]*>[^<]*<\/span>/,`<span class="percorso__corrente" aria-current="page">${p.title}</span>`);
 const fig=figure(p,imgs); if(/<figure class="carousel" data-carosello>/.test(html)) html=html.replace(/<figure class="carousel" data-carosello>[\s\S]*?<\/figure>/,fig); else html=html.replace(/      <section class="sezione">\s*\n\s*<div class="scheda">[\s\S]*?<\/section>/,`      <section class="sezione">\n        <h2>Il progetto</h2>\n${fig}\n      </section>`);
 fs.writeFileSync(page,html,'utf8');console.log(`${p.title}: ${files.length} immagini`);
}
