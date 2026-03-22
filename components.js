/**
 * Afbouwr — Gedeelde Web Components
 * Gebruik:
 *   <site-nav></site-nav>                          → hub (met nav-links)
 *   <site-nav back="true"></site-nav>              → calculator (met terugknop)
 *   <site-nav back="true" label="Systeemplafond"> → calculator met naam in terugknop
 *   <site-footer></site-footer>                    → identiek op alle pagina's
 */

// ── Google Analytics ───────────────────────────────────────────────────────

(function() {
  const GA_ID = 'G-XWKLQMHNSH';

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);
})();

// ── <site-nav> ─────────────────────────────────────────────────────────────

class SiteNav extends HTMLElement {
  connectedCallback() {
    const isBack  = this.getAttribute('back') === 'true';

    const right = isBack
      ? `<div class="nav-back-row">
           <a href="/" class="nav-back">← Alle calculators</a>
           <a href="/account/" class="nav-account-link" id="nav-account-btn">Account</a>
         </div>`
      : `<ul class="nav-links">
           <li><a href="#tools">Calculatoren</a></li>
           <li><a href="#roadmap">Roadmap</a></li>
           <li><a href="#bug">Bug melden</a></li>
           <li><a href="/account/" class="nav-account-link" id="nav-account-btn">Account</a></li>
         </ul>`;

    this.innerHTML = `
      <nav class="nav">
        <a href="/" class="nav-logo">
          <span class="nav-logo-dot"></span>
          Afbouwr
        </a>
        ${right}
      </nav>
    `;
  }
}

// ── <site-footer> ──────────────────────────────────────────────────────────

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="hub-footer">
        <div class="hub-wrapper">
          <div class="hub-footer-inner">
            <div>
              <a href="/" class="hub-footer-logo">
                <span class="nav-logo-dot"></span>
                Afbouwr
              </a>
              <div class="hub-footer-copy">Gratis materiaalcalculatoren voor de afbouwsector</div>
            </div>
            <div class="hub-footer-copy">
              <a href="mailto:info@afbouwr.nl" class="footer-mail">info@afbouwr.nl</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }
}

// ── Registreer components ──────────────────────────────────────────────────

customElements.define('site-nav',    SiteNav);
customElements.define('site-footer', SiteFooter);

// ── PDF / Afdrukken utility ────────────────────────────────────────────────
//
// Gebruik:
//   initAfdrukKnoppen()  — roep aan na DOMContentLoaded of PRODUCTEN_READY
//
// De "Afdrukken" knop triggert window.print().
// De "PDF" knop stelt de paginatitel tijdelijk in op de projectnaam zodat
// de browser de PDF een herkenbare bestandsnaam geeft, en opent dan print.
//

function initAfdrukKnoppen() {
  const btnAfdrukken = document.getElementById('btn-afdrukken');
  const btnPdf       = document.getElementById('btn-pdf');

  if (btnAfdrukken) {
    btnAfdrukken.addEventListener('click', () => window.print());
  }

  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      const projectNaamEl = document.getElementById('project-naam');
      const projectNaam   = projectNaamEl ? projectNaamEl.value.trim() : '';
      const datum         = new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const paginaTitel   = document.querySelector('h1')?.textContent?.trim() || 'Afbouwr';

      // Tijdelijk de paginatitel aanpassen voor de PDF-bestandsnaam
      const origTitel = document.title;
      document.title  = projectNaam
        ? `${paginaTitel} — ${projectNaam} (${datum})`
        : `${paginaTitel} — Materiaaloverzicht (${datum})`;

      window.print();

      // Herstel na print
      setTimeout(() => { document.title = origTitel; }, 1000);
    });
  }
}

// Automatisch initialiseren zodra producten geladen zijn (calculators)
// én direct beschikbaar als util voor andere pagina's
window.initAfdrukKnoppen = initAfdrukKnoppen;
