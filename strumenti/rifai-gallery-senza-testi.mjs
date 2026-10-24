import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { default: sharp } = await import(pathToFileURL('D:/Documenti/Progetto predefinito/node_modules/sharp/lib/index.js').href);
const SITO = path.resolve(import.meta.dirname, '..');
const MAT = 'D:/Materiali sito/design-week/materiali';
const LATO = 1600;
const QUALITA = 82;
const IMMAGINE = /\.(jpe?g|png)$/i;
const SCARTA = /ignora|scarta/i;
const DATI = [
  { pagina:'design-week/2019-buongiorno-bauhaus.html', cartella:'assets/img/bauhaus2019', temi:[
    { titolo:'Set da tavola', prefisso:'set', dir:'2019-buongiorno-bauhaus/Gallery1_Set da tavola' },
    { titolo:'Complementi d’arredo tessili e in stampa 3d', prefisso:'complementi', dir:"2019-buongiorno-bauhaus/Gallery2_Complementi d'arredo tessili e in stampa 3d" },
    { titolo:'Inaugurazione', prefisso:'inaugurazione', dir:'2019-buongiorno-bauhaus/Gallery3_Inaugurazione' },
    { titolo:'Cartoline', prefisso:'cartoline', dir:'2019-buongiorno-bauhaus/Gallery4_cartoline' },
  ]},
  { pagina:'design-week/2026-ol3.html', cartella:'assets/img/ol3', temi:[
    { titolo:'OLTRE la materia', prefisso:'materia', dir:'2026-OL3/OLTRE la materia' },
    { titolo:'OLTRE la forma', prefisso:'forma', dir:'2026-OL3/OLTRE la forma' },
    { titolo:'OLTRE il gioco', prefisso:'gioco', dir:'2026-OL3/OLTRE il gioco' },
    { titolo:"OLTRE l'immagine", prefisso:'immagine', dir:'2026-OL3/OLTRE le immagini_Narrazioni visive' },
    { titolo:"OLTRE l'obiettivo", prefisso:'obiettivo', dir:"2026-OL3/OLTRE l'obiettivo_Trame fotografiche" },
    { titolo:"OLTRE l'opera", prefisso:'opera', dir:"2026-OL3/Oltre l'opera" },
    { titolo:'OLTRE le gabbie', prefisso:'gabbie', dir:'2026-OL3/Oltre le gabbie' },
    { titolo:'OLTRE le apparenze', prefisso:'apparenze', dir:'2026-OL3/OLTRE le apparenze_Making of', sottodir:'JPG', misto:true },
  ]},
];
const naturale = (a,b)=>a.localeCompare(b,'it',{numeric:true});
function files(tema){
 const d=path.join(MAT,tema.dir,tema.sottodir||'');
 return fs.readdirSync(d,{withFileTypes:true}).filter(x=>x.isFile()&&IMMAGINE.test(x.name)&&!SCARTA.test(x.name)).map(x=>x.name).sort(naturale).map(x=>path.join(d,x));
}
async function prepara(src,dst){
 const b=await sharp(src).rotate().resize({width:LATO,height:LATO,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality:QUALITA,mozjpeg:true}).toBuffer();
 fs.writeFileSync(dst,b); const m=await sharp(b).metadata(); return m;
}
function scena(img){
 return `              <div class="carousel__scena" data-scena>\n                <img class="carousel__immagine" src="${img.src}" alt=""\n                     width="${img.w}" height="${img.h}" loading="lazy" decoding="async">\n              </div>`;
}
function figureImages(figure, imgs, misto=false){
 const controls=figure.match(/<div class="carousel__comandi" data-comandi>[\s\S]*?<\/div>\s*<\/figure>$/)?.[0] || '';
 const scene=[...figure.matchAll(/<div class="carousel__scena" data-scena>[\s\S]*?<\/div>\s*(?=<div class="carousel__scena"|<div class="carousel__comandi")/g)].map(x=>x[0].trim());
 if(!misto) return `            <figure class="carousel" data-carosello>\n${imgs.map(scena).join('\n')}\n${controls}`;
 let i=0;
 const out=[];
 for(const s of scene){ if(s.includes('<video ')) out.push(s); else if(i<imgs.length) out.push(scena(imgs[i++])); }
 while(i<imgs.length) out.push(scena(imgs[i++]));
 return `            <figure class="carousel" data-carosello>\n${out.join('\n')}\n${controls}`;
}
for(const page of DATI){
 const p=path.join(SITO,page.pagina); let html=fs.readFileSync(p,'utf8');
 const starts=[...html.matchAll(/            <article class="tema">/g)].map(m=>m.index);
 const ends=starts.map((s,i)=>i+1<starts.length?starts[i+1]:html.length);
 const articles=starts.map((s,i)=>html.slice(s,ends[i]));
 for(const tema of page.temi){
   const idx=articles.findIndex(a=>a.includes(`<h3 class="tema__titolo">${tema.titolo}</h3>`));
   if(idx<0) throw new Error(`tema non trovato: ${tema.titolo}`);
   const elenco=files(tema), outdir=path.join(SITO,page.cartella); fs.mkdirSync(outdir,{recursive:true}); const imgs=[];
   for(let i=0;i<elenco.length;i++){
    const nome=`${tema.prefisso}-${String(i+1).padStart(2,'0')}.jpg`, dst=path.join(outdir,nome), m=await prepara(elenco[i],dst);
    imgs.push({src:`../${page.cartella}/${nome}`,w:m.width,h:m.height});
   }
   const a=articles[idx]; const fm=a.match(/<figure class="carousel" data-carosello>[\s\S]*?<\/figure>/);
   if(!fm) throw new Error(`figure non trovata: ${tema.titolo}`);
   articles[idx]=a.replace(fm[0],figureImages(fm[0],imgs,tema.misto));
   console.log(`${page.pagina} | ${tema.titolo}: ${elenco.length} immagini, alt vuoti${tema.misto?' + video conservati':''}`);
 }
 // sostituisce gli articoli dal basso, cosi' gli indici restano validi
 for(let i=articles.length-1;i>=0;i--) html=html.slice(0,starts[i])+articles[i]+html.slice(ends[i]);
 fs.writeFileSync(p,html,'utf8');
}
