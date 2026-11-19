import fs from 'node:fs';
import path from 'node:path';
const root='C:/Users/carmen manuela/Documents/Sito web Opencode';
const dirs=['clima-creativo','rosa-genoni','qubi','tadini','muskin','clutter','wemake-digital-fashion'];
const html=fs.readdirSync(path.join(root,'altri-progetti')).filter(x=>x.endsWith('.html')).map(x=>fs.readFileSync(path.join(root,'altri-progetti',x),'utf8')).join('\n');
let removed=0;
for(const d of dirs){const dir=path.join(root,'assets/img/altri-progetti',d); if(!fs.existsSync(dir))continue; for(const f of fs.readdirSync(dir)){if(!html.includes(f)){fs.unlinkSync(path.join(dir,f));removed++;console.log('rimosso orfano',d,f)}}}
console.log('totale rimossi',removed);
