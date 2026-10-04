/* =========================================================================
   TECNICO SISTEMA MODA (ITAM) — script condiviso
   Vanilla JS, nessuna libreria.

   Tre compiti:
   1. aprire e chiudere la barra di navigazione sugli schermi piccoli
   2. aprire e chiudere i pannelli delle sezioni, con mouse e tastiera
   3. mostrare un video dell'intervista nel lettore, senza riproduzione
      automatica e senza caricare nulla prima dell'apertura
   ========================================================================= */

/* ---------------------------------------------------------------------
   1. BARRA DI NAVIGAZIONE (schermi piccoli)
   --------------------------------------------------------------------- */
function initBarra() {
  const bottone = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav');
  if (!bottone || !nav) return;

  const imposta = (aperto) => {
    bottone.setAttribute('aria-expanded', String(aperto));
    nav.classList.toggle('is-aperto', aperto);
  };

  bottone.addEventListener('click', () => {
    imposta(bottone.getAttribute('aria-expanded') !== 'true');
  });
}

/* ---------------------------------------------------------------------
   2. PANNELLI DELLE SEZIONI
   Il collegamento porta alla pagina; il comando accanto apre il pannello.
   Sono due controlli distinti, quindi non si confondono.
   --------------------------------------------------------------------- */
function initPannelli() {
  const voci = [...document.querySelectorAll('.nav__voce')];
  if (!voci.length) return;

  const schermoGrande = window.matchMedia('(min-width: 64.0625rem)');

  const aperto = (voce) =>
    voce.querySelector('.nav__apri')?.getAttribute('aria-expanded') === 'true';

  const imposta = (voce, stato) => {
    const bottone = voce.querySelector('.nav__apri');
    const pannello = voce.querySelector('.pannello');
    if (!bottone || !pannello) return;
    bottone.setAttribute('aria-expanded', String(stato));
    pannello.classList.toggle('is-aperto', stato);
  };

  const chiudiTutte = (tranne) => {
    voci.forEach((voce) => { if (voce !== tranne) imposta(voce, false); });
  };

  voci.forEach((voce) => {
    const bottone = voce.querySelector('.nav__apri');
    if (!bottone) return;

    bottone.addEventListener('click', (evento) => {
      evento.stopPropagation();
      const eraAperto = aperto(voce);
      chiudiTutte(voce);
      imposta(voce, !eraAperto);
    });

    /* Con il puntatore sul desktop il pannello resta aperto finche' non
       si esce dalla voce: evita di dover inseguire il menu. */
    if (schermoGrande.matches) {
      voce.addEventListener('mouseenter', () => imposta(voce, true));
      voce.addEventListener('mouseleave', () => imposta(voce, false));
    }
  });

  /* clic fuori dalla barra: chiude tutto */
  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.barra')) chiudiTutte();
  });

  /* Esc: chiude e restituisce il focus al comando che l'aveva aperto */
  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    const voce = voci.find(aperto);
    if (voce) {
      imposta(voce, false);
      voce.querySelector('.nav__apri').focus();
    }
  });

  /* Frecce: scorrono le nove voci senza usare il mouse */
  const selettori = '.nav__voce-sezione, .nav__apri';
  document.addEventListener('keydown', (evento) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(evento.key)) return;
    if (!evento.target.matches(selettori)) return;
    if (!schermoGrande.matches) return;

    const vociOrdine = [...document.querySelectorAll(selettori)];
    const i = vociOrdine.indexOf(evento.target);
    const prossimo = evento.key === 'ArrowRight' ? i + 1 : i - 1;
    if (prossimo < 0 || prossimo >= vociOrdine.length) return;

    evento.preventDefault();
    vociOrdine[prossimo].focus();
  });
}

/* ---------------------------------------------------------------------
   3. LETTORE DELLE VIDEO INTERVISTE
   Accetta sia un file video del sito, sia un collegamento esterno.
   Il lettore viene costruito solo quando si apre, quindi la pagina non
   carica nulla in anticipo. Nessuna riproduzione automatica.
   --------------------------------------------------------------------- */
function initGalleria() {
  const lettore = document.querySelector('.lettore');
  if (!lettore) return;

  const contenuto = lettore.querySelector('.lettore__contenuto');
  const titolo = lettore.querySelector('.lettore__titolo');
  const chiudi = lettore.querySelector('.lettore__chiudi');
  const schede = [...document.querySelectorAll('.scheda-video')];
  if (!schede.length) return;

  let focusPrecedente = null;

  const chiudiLettore = () => {
    lettore.hidden = true;
    /* svuotare il contenuto ferma davvero la riproduzione */
    contenuto.replaceChildren();
    focusPrecedente?.focus();
  };

  schede.forEach((scheda) => {
    const avvia = scheda.querySelector('[data-avvia-video]');
    if (!avvia) return;

    avvia.addEventListener('click', () => {
      focusPrecedente = avvia;
      const nome = scheda.dataset.nome || '';
      titolo.textContent = scheda.dataset.titolo || nome;

      let elemento;
      const incorporato = scheda.dataset.videoIncorporato;

      if (incorporato) {
        /* collegamento esterno: si inserisce in un riquadro isolato */
        elemento = document.createElement('iframe');
        elemento.src = incorporato;
        elemento.title = scheda.dataset.titolo || nome;
        elemento.allow = 'accelerometer; encrypted-media; picture-in-picture';
        elemento.allowFullscreen = true;
        elemento.loading = 'lazy';
      } else if (scheda.dataset.video) {
        /* file del sito */
        elemento = document.createElement('video');
        elemento.src = scheda.dataset.video;
        elemento.controls = true;
        elemento.preload = 'none';           /* non scarica nulla finche' non si preme play */
        elemento.poster = scheda.dataset.copertina || '';
        if (scheda.dataset.vtt) {
          const traccia = document.createElement('track');
          traccia.kind = 'subtitles';
          traccia.label = 'Sottotitoli';
          traccia.src = scheda.dataset.vtt;
          traccia.srclang = 'it';
          traccia.default = true;
          elemento.append(traccia);
        }
      }

      if (!elemento) return;
      contenuto.replaceChildren(elemento);
      lettore.hidden = false;
      chiudi.focus();
    });
  });

  chiudi?.addEventListener('click', chiudiLettore);
  lettore.addEventListener('click', (evento) => {
    if (evento.target === lettore) chiudiLettore();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !lettore.hidden) chiudiLettore();
  });
}


/* ---------------------------------------------------------------------
   AVVIO
   --------------------------------------------------------------------- */
initBarra();
initPannelli();
initGalleria();