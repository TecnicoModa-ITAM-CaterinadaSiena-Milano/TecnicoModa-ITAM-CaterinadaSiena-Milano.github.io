import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { default: sharp } = await import(pathToFileURL('D:/Documenti/Progetto predefinito/node_modules/sharp/lib/index.js').href);
const ROOT='C:/Users/carmen manuela/Documents/Sito web Opencode';
const SRC='D:/Materiali sito/altri-progetti/materiali';
const IMG=/\.(jpe?g|png)$/i; const SKIP=/ignora|scart|altri formati/i;
const projects=[
 {page:'altri-progetti/2015-progetto-monza-ecofest.html',asset:'monza-2015',themes:[
  {title:'Prodotti',prefix:'prodotti',dir:'2015-monza-ecofest/Gallery 1_Prodotti',extra:['2015-monza-ecofest/Collana CDScont.jpg']},
  {title:'Catalogo',prefix:'catalogo',dir:'2015-monza-ecofest/Gallery2_Catalogo'},
  {title:'Eventi e rassegna stampa',prefix:'eventi',dir:'2015-monza-ecofest/Gallery3_Eventi e rassegna stampa'},
 ]},
 {page:'altri-progetti/2019-progetto-contaminazioni.html',asset:'contaminazioni',themes:[
  {title:'Il progetto',prefix:'contaminazione',dir:'2019_Contaminazioni'},
 ]},
];
const natural=(a,b)=>a.localeCompare(b,'it',{numeric:true});
function list(dir,extra=[]){const out=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true}).sort((a,b)=>natural(a.name,b.name))){const p=path.join(d,e.name);if(e.isDirectory()&&!SKIP.test(e.name))walk(p);else if(e.isFile()&&IMG.test(e.name)&&!SKIP.test(e.name))out.push(p);}}walk(dir);for(const e of extra){const p=path.join(SRC,e);if(fs.existsSync(p)&&IMG.test(p)&&!SKIP.test(p))out.push(p);}return out.sort(natural);}
async function prep(src,dst){const b=await sharp(src).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality:82,mozjpeg:true}).toBuffer();fs.writeFileSync(dst,b);return sharp(b).metadata();}
function figure(title,asset,prefix,imgs){const body=imgs.map((x,i)=>`              <div class="carousel__scena" data-scena>\n                <img class="carousel__immagine" src="../assets/img/altri-progetti/${asset}/${x.name}" alt="Immagine del progetto «${title}» — immagine ${i+1} di ${imgs.length}"\n                     width="${x.width}" height="${x.height}" loading="lazy" decoding="async">\n              </div>`).join('\n');return `            <figure class="carousel" data-carosello>\n${body}\n              <div class="carousel__comandi" data-comandi>\n                <button class="carousel__freccia" type="button" data-indietro\n                        aria-label="Immagine precedente">&larr;</button>\n                <p class="carousel__conta" data-conta aria-live="polite"></p>\n                <button class="carousel__freccia" type="button" data-avanti\n                        aria-label="Immagine successiva">&rarr;</button>\n              </div>\n            </figure>`;}
for(const p of projects){let html=fs.readFileSync(path.join(ROOT,p.page),'utf8');for(const t of p.themes){const files=list(path.join(SRC,t.dir),t.extra||[]);const out=path.join(ROOT,'assets/img/altri-progetti',p.asset);fs.mkdirSync(out,{recursive:true});const imgs=[];for(let i=0;i<files.length;i++){const name=`${t.prefix}-${String(i+1).padStart(2,'0')}.jpg`;const m=await prep(files[i],path.join(out,name));imgs.push({name,width:m.width,height:m.height});}const re=new RegExp(`<h3 class="tema__titolo">${t.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}<\\/h3>[\\s\\S]*?<figure class="carousel" data-carosello>[\\s\\S]*?<\\/figure>`);if(!re.test(html))throw new Error(`tema non trovato: ${t.title}`);html=html.replace(re,`<h3 class="tema__titolo">${t.title}</h3>\n\n${figure(t.title,p.asset,t.prefix,imgs)}`);console.log(`${t.title}: ${files.length} immagini`);}fs.writeFileSync(path.join(ROOT,p.page),html,'utf8');}
