import fs from 'node:fs';
const root='C:/Users/carmen manuela/Documents/Sito web Opencode';
const p=root+'/altri-progetti/2026-progetto-clima-creativo.html';
let h=fs.readFileSync(p,'utf8');
if((h.match(/class="carousel__immagine"/g)||[]).length===0) h=h.replace(/\s*<section class="sezione">[\s\S]*?<\/section>/,'');
fs.writeFileSync(p,h,'utf8');
const entries=[
 ['2026-progetto-clima-creativo.html','2025-26 Progetto Clima Creativo'],
 ['2026-progetto-rosa-genoni.html','2025-26 Progetto Rosa Genoni'],
 ['2025-progetto-no-walls.html','2025 Progetto No Walls'],
 ['2025-progetto-isec.html','2025 Progetto Isec'],
 ['2024-progetto-qu-bi.html','2024 Progetto Qubi'],
 ['2023-24-progetto-tadini.html','2023 Progetto Tadini'],
 ['2023-progetto-muskin.html','2022-23 Progetto Muskin'],
 ['2021-22-progetto-clutter.html','2021-22 Progetto Clutter'],
 ['2019-progetto-contaminazioni.html','2019 Progetto Contaminazioni'],
 ['2016-progetto-wemake-digital-fashion.html','2016 Progetto WeMake Digital Fashion'],
 ['2015-progetto-monza-ecofest.html','2015 Progetto Monza Ecofest'],
];
const list=entries.map(([href,title],i)=>`          <li class="elenco__voce">\n            <a class="elenco__link" href="${href}">\n              <span class="elenco__numero">${String(i+1).padStart(2,'0')}</span>\n              <span class="elenco__titolo">${title}</span>\n              <span class="elenco__freccia" aria-hidden="true">&rarr;</span>\n            </a>\n          </li>`).join('\n');
const index=root+'/altri-progetti/index.html'; let x=fs.readFileSync(index,'utf8'); x=x.replace(/        <ul class="elenco">[\s\S]*?        <\/ul>/,`        <ul class="elenco">\n${list}\n        </ul>`); fs.writeFileSync(index,x,'utf8');
console.log('indice aggiornato');
