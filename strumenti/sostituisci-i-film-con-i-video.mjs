import fs from 'node:fs';
import path from 'node:path';
const root='C:/Users/carmen manuela/Documents/Sito web Opencode';
let count=0;
function walk(dir){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);
  if(e.isDirectory()&&!e.name.startsWith('.')) walk(p);
  else if(e.isFile()&&e.name.endsWith('.html')){
   const s=fs.readFileSync(p,'utf8'); const n=(s.match(/I film/g)||[]).length;
   if(n){fs.writeFileSync(p,s.replaceAll('I film','I video'),'utf8'); count+=n; console.log(p.replace(root+'/',''),n);}
  }
 }
}
walk(root); console.log('sostituzioni:',count);
