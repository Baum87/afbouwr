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
      ? `<a href="/" class="nav-back">← Alle calculators</a>`
      : `<ul class="nav-links">
           <li><a href="#tools">Calculatoren</a></li>
           <li><a href="#roadmap">Roadmap</a></li>
           <li><a href="#bug">Bug melden</a></li>
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
