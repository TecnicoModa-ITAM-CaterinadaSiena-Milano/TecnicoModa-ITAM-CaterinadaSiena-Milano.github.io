/* =========================================================================
   TECNICO SISTEMA MODA — script condiviso
   Vanilla JS, nessuna libreria. Tre compiti: aprire il menu su schermi
   piccoli, aprire e chiudere i sotto-menu, e basta.
   ========================================================================= */

/* ---------------------------------------------------------------------
   1. MENU GENERALE (schermi piccoli)
   --------------------------------------------------------------------- */
function initMenuPrincipale() {
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

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && bottone.getAttribute('aria-expanded') === 'true') {
      imposta(false);
      bottone.focus();
    }
  });
}

/* ---------------------------------------------------------------------
   2. SOTTO-MENU
   Si aprono in tre modi, tutti tenuti allineati:
     - clic o Invio sul bottone (tocca e tastiera)
     - passaggio del mouse sulle voci (solo schermi grandi)
     - si chiudono con Esc, con un clic fuori, o cambiando pagina
   --------------------------------------------------------------------- */
function initSottoMenu() {
  const voci = [...document.querySelectorAll('.nav__voce')];
  if (!voci.length) return;

  const schermoGrande = window.matchMedia('(min-width: 64rem)');

  const stato = (voce) => voce.querySelector('.nav__toggle')?.getAttribute('aria-expanded') === 'true';

  const imposta = (voce, aperto) => {
    const bottone = voce.querySelector('.nav__toggle');
    const pannello = voce.querySelector('.menu');
    if (!bottone || !pannello) return;
    bottone.setAttribute('aria-expanded', String(aperto));
    pannello.classList.toggle('is-aperto', aperto);
  };

  const chiudiTutte = (tranne) => {
    voci.forEach((voce) => { if (voce !== tranne) imposta(voce, false); });
  };

  voci.forEach((voce) => {
    const bottone = voce.querySelector('.nav__toggle');
    if (!bottone) return;

    bottone.addEventListener('click', (evento) => {
      evento.stopPropagation();
      const eraAperto = stato(voce);
      chiudiTutte(voce);
      imposta(voce, !eraAperto);
    });

    // il mouse apre solo quando c'e' spazio per un menu a discesa
    voce.addEventListener('mouseenter', () => { if (schermoGrande.matches) imposta(voce, true); });
    voce.addEventListener('mouseleave', () => { if (schermoGrande.matches) imposta(voce, false); });
  });

  // clic fuori da tutta la barra di navigazione
  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.nav')) chiudiTutte();
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    const aperta = voci.find(stato);
    if (aperta) {
      imposta(aperta, false);
      aperta.querySelector('.nav__toggle').focus();
    }
  });
}

/* ---------------------------------------------------------------------
   AVVIO
   --------------------------------------------------------------------- */
initMenuPrincipale();
initSottoMenu();
