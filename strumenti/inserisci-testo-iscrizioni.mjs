import fs from 'node:fs';
const p='C:/Users/carmen manuela/Documents/Sito web Opencode/orientamento-e-iscrizioni/iscrizioni.html';
let h=fs.readFileSync(p,'utf8');
const sezione=`      <section class="sezione">
        <h2>Sistema Moda</h2>
        <p><strong>Codice Meccanografico:</strong> MITF07901R</p>
        <p>L'istituto Tecnico Sistema Moda dell’IIS Caterina da Siena di Milano è un percorso quinquennale del settore tecnologico-ambientale, con articolazione Progettazione e processi produttivi per il tessile/moda.</p>
        <p><a class="btn" href="https://www.istruzione.it/iscrizionionline/" target="_blank" rel="noopener">ISCRIVITI</a></p>
        <p>I genitori e gli esercenti la responsabilità genitoriale per effettuare l’iscrizione on line:</p>
        <ul>
          <li>individuano la scuola d’interesse tramite il servizio “Scuola in Chiaro” presente sulla <a href="https://unica.istruzione.gov.it" target="_blank" rel="noopener">Piattaforma Unica</a>. Per consentire una scelta consapevole della scuola, i genitori e gli esercenti la responsabilità genitoriale possono consultare, all’interno del servizio “Scuola in chiaro”, il Rapporto di Autovalutazione (RAV), il Piano triennale dell’offerta formativa (PTOF) e la Rendicontazione sociale;</li>
          <li>accedono all’<a href="https://unica.istruzione.gov.it/it/orientamento/iscrizioni" target="_blank" rel="noopener">area riservata della Piattaforma Unica</a> utilizzando le credenziali SPID (Sistema Pubblico di Identità Digitale), CIE (Carta di identità elettronica), CNS (Carta Nazionale dei Servizi) o eIDAS (electronic IDentification Authentication and Signature);</li>
          <li>compilano la domanda in tutte le sue parti, mediante il modulo on line, a partire dalle ore 8:00 del 13 gennaio 2026;</li>
          <li>inviano la domanda d’iscrizione alla scuola di destinazione entro le ore 20:00 del 14 febbraio 2026;</li>
          <li>dopo la conferma dell’accettazione della domanda di iscrizione procedono, prima dell’avvio dell’anno scolastico 2026/2027, all’inoltro della documentazione richiesta da parte della scuola, anche per il tramite della sezione di gestione documentale “ComUnica” presente all’interno della Piattaforma Unica, se utilizzata dalla scuola;</li>
          <li>tra il 25 maggio e il 30 giugno 2026 coloro che hanno scelto di non avvalersi dell’insegnamento della religione cattolica manifestano le preferenze rispetto alle diverse tipologie di attività secondo le modalità previste al successivo paragrafo 10.</li>
        </ul>
        <p>Il sistema di iscrizioni on line della Piattaforma Unica avvisa in tempo reale, a mezzo posta elettronica e tramite l’app IO, delle variazioni di stato della domanda. I genitori e gli esercenti la responsabilità genitoriale possono seguire l’iter della domanda inoltrata nell’area dedicata alle iscrizioni sulla Piattaforma Unica.</p>
        <p>L’accoglimento della domanda viene comunicato attraverso la pagina dedicata presente all’interno della Piattaforma Unica, l’app IO e tramite posta elettronica.</p>
      </section>`;
const re=/      <section class="sezione">[\s\S]*?      <\/section>/;
if(!re.test(h)) throw new Error('sezione non trovata');
h=h.replace(re,sezione);
fs.writeFileSync(p,h,'utf8');
console.log('pagina iscrizioni aggiornata');
