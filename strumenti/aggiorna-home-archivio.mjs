import fs from 'node:fs';
const p='C:/Users/carmen manuela/Documents/Sito web Opencode/home.html';
let s=fs.readFileSync(p,'utf8');
const a='Archivio di progetti svolti e prospettive future';
const b='Archivio di progetti svolti...<br>...e prospettive future';
if(!s.includes(a)) throw new Error('testo home non trovato');
fs.writeFileSync(p,s.replace(a,b),'utf8');
console.log('home aggiornata');
