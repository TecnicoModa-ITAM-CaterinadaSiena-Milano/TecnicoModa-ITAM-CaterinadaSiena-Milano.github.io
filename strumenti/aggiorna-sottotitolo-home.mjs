import fs from 'node:fs';
const p='C:/Users/carmen manuela/Documents/Sito web Opencode/home.html';
let s=fs.readFileSync(p,'utf8');
const old='2016-2026 Dieci cicli conclusi.<br>Dieci anni di progetti. Un nuovo inizio.';
const nuovo='Archivio di progetti svolti e prospettive future';
if(!s.includes(old)) throw new Error('testo non trovato');
fs.writeFileSync(p,s.replace(old,nuovo),'utf8');
console.log('testo sostituito');
