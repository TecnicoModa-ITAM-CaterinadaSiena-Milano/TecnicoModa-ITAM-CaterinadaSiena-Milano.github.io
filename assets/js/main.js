/* =========================================================================
   TECNICO SISTEMA MODA (ITAM) — script condiviso
   Vanilla JS, nessuna libreria.

   Tre compiti:
   1. aprire e chiudere la barra di navigazione sugli schermi piccoli
   2. aprire e chiudere i pannelli delle sezioni, con mouse e tastiera
   3. mostrare un video dell'intervista nel lettore, senza riproduzione
      automatica e senza caricare nulla prima dell'apertura
   4. gestire le copertine video che girano da sole
   5. far scorrere le gallerie con le frecce
   ========================================================================= */

/* ---------------------------------------------------------------------
   0. ACCESSO
   La pagina iniziale chiede la password. Se si arriva su una pagina
   interna senza averla inserita, si torna li'. Non e' una protezione
   vera (i file sono pubblici), serve per l'anteprima.
   --------------------------------------------------------------------- */
function initAccesso() {
  /* l'indirizzo della pagina iniziale arriva dalla pagina stessa: da una
     sottocartella non puo' essere sempre './index.html' */
  const gate = document.body.dataset.gate;
  if (!gate) return;
  if (sessionStorage.getItem('tsm-accesso-approvato') === '1') return;
  location.replace(gate);
}

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
   4. COPERTINE VIDEO
   Il ciclo sotto il titolo si muove da solo. Viene fermato se chi legge
   ha chiesto nel sistema di ridurre le animazioni, e quando non si vede:
   un film che gira mentre nessuno lo guarda consuma batteria per niente.
   --------------------------------------------------------------------- */
function initCicli() {
  const cicli = document.querySelectorAll('video[data-ciclo]');
  if (!cicli.length) return;

  const riduzione = window.matchMedia('(prefers-reduced-motion: reduce)');
  const applica = (film) => {
    if (riduzione.matches) {
      film.removeAttribute('autoplay');
      film.pause();
    } else if (!film.paused) {
      film.play().catch(() => {});
    }
  };

  cicli.forEach((film) => {
    if (!riduzione.matches) film.play().catch(() => {});
    riduzione.addEventListener?.('change', () => applica(film));

    if (!('IntersectionObserver' in window)) return;
    const osserva = new IntersectionObserver(
      (voci) => {
        voci.forEach((voce) => {
          if (voce.isIntersecting) {
            if (!riduzione.matches) film.play().catch(() => {});
          } else {
            film.pause();
          }
        });
      },
      { threshold: 0.15 }
    );
    osserva.observe(film);
  });
}


/* ---------------------------------------------------------------------
   5. GALLERIE CON FRECCE
   Ogni scena e' un'immagine o un film. Con una sola scena i comandi
   vengono tolti: due frecce che non cambiano niente sono solo rumore.
   Funziona con le frecce, con le frecce della tastiera e con il dito sul
   telefono. Le scene nascoste sono davvero nascoste: non si raggiungono
   con la tastiera e i film fermano.
   --------------------------------------------------------------------- */
function initCaroselli() {
  for (const car of document.querySelectorAll('[data-carosello]')) {
    const scene = [...car.querySelectorAll('[data-scena]')];
    const comandi = car.querySelector('[data-comandi]');

    if (scene.length < 2) {
      comandi?.remove();
      continue;
    }

    const indietro = car.querySelector('[data-indietro]');
    const avanti = car.querySelector('[data-avanti]');
    const conta = car.querySelector('[data-conta]');
    let attuale = 0;

    const mostra = (i) => {
      attuale = (i + scene.length) % scene.length;
      scene.forEach((s, n) => {
        s.hidden = n !== attuale;
        const film = s.querySelector('video');
        if (film && n !== attuale) film.pause();
      });
      if (conta) conta.textContent = `${attuale + 1} di ${scene.length}`;
    };

    indietro.addEventListener('click', () => mostra(attuale - 1));
    avanti.addEventListener('click', () => mostra(attuale + 1));

    /* Sul lettore le frecce spostano il film: li lascia stare. */
    car.addEventListener('keydown', (evento) => {
      if (evento.target.closest('video')) return;
      if (evento.key === 'ArrowLeft') { mostra(attuale - 1); evento.preventDefault(); }
      if (evento.key === 'ArrowRight') { mostra(attuale + 1); evento.preventDefault(); }
    });

    let inizio = null;
    car.addEventListener('touchstart', (e) => { inizio = e.changedTouches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', (e) => {
      if (inizio === null) return;
      const spostamento = e.changedTouches[0].clientX - inizio;
      if (Math.abs(spostamento) > 40) mostra(attuale + (spostamento < 0 ? 1 : -1));
      inizio = null;
    }, { passive: true });

    mostra(0);
  }
}


/* ---------------------------------------------------------------------
   AVVIO
   --------------------------------------------------------------------- */
initAccesso();
initBarra();
initPannelli();
initGalleria();
initCicli();
initCaroselli();