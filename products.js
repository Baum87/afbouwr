/**
 * Afbouwr — Productcatalogus loader
 *
 * Producten worden geladen vanuit /data/products.json.
 * Dat bestand is de enige plek die je hoeft aan te passen om producten
 * toe te voegen, te wijzigen of te verwijderen — geen code-kennis vereist.
 *
 * Gebruik in de calculators:
 *   window.PRODUCTEN_READY.then(() => { ... PRODUCTEN.plafondplaten ... });
 *
 * Bij een netwerk- of parsefout valt de loader terug op de ingebouwde data.
 */

'use strict';

// ── Ingebouwde fallback (identiek aan data/products.json) ──────────────────
const _FALLBACK = {
  plafondplaten: [
    {
      merk: 'Knauf',
      typen: [
        { waarde: 'Knauf Sahara',   label: 'Sahara' },
        { waarde: 'Knauf Feria',    label: 'Feria' },
        { waarde: 'Knauf Perla OP', label: 'Perla OP 0.95' },
        { waarde: 'Knauf Tatra',    label: 'Tatra' },
      ],
    },
    {
      merk: 'Rockfon',
      typen: [
        { waarde: 'Rockfon Krios',     label: 'Krios' },
        { waarde: 'Rockfon Lithos',    label: 'Lithos' },
        { waarde: 'Rockfon Pallas',    label: 'Pallas' },
        { waarde: 'Rockfon Black',     label: 'Black' },
        { waarde: 'Rockfon Color-all', label: 'Color-all' },
      ],
    },
    {
      merk: 'OWA',
      typen: [
        { waarde: 'OWA Harmony',    label: 'Harmony' },
        { waarde: 'OWA Sandila',    label: 'Sandila' },
        { waarde: 'OWA Sternbild',  label: 'Sternbild' },
        { waarde: 'OWA Sinfonia',   label: 'Sinfonia' },
        { waarde: 'OWA Brillianto', label: 'Brillianto' },
        { waarde: 'OWA Cosmos',     label: 'Cosmos' },
      ],
    },
    {
      merk: 'Gipsvinyl',
      typen: [
        { waarde: 'Gipsvinyl wit',   label: 'Gipsvinyl wit' },
        { waarde: 'Gipsvinyl zwart', label: 'Gipsvinyl zwart' },
      ],
    },
  ],
  gipstypen: [
    { waarde: 'standaard_ak',  label: 'Standaard AK',    vasteMaten: null },
    { waarde: 'standaard_4ak', label: 'Standaard 4-AK',  vasteMaten: { breedte: 1200, lengte: 2400 } },
    { waarde: 'hydro',         label: 'Hydro (groen)',    vasteMaten: null },
    { waarde: 'ladura',        label: 'Ladura Standaard', vasteMaten: null },
    { waarde: 'novlam',        label: 'Novlam (roze)',    vasteMaten: null },
    { waarde: 'osb',           label: 'OSB',              vasteMaten: { breedte: 1250, lengte: 2500 } },
  ],
};

// ── Globally toegankelijk productobject ────────────────────────────────────
window.PRODUCTEN = {};

// ── Promise die resolved zodra producten geladen zijn ─────────────────────
let _resolve;
window.PRODUCTEN_READY = new Promise(r => { _resolve = r; });

// ── Laad data/products.json, val terug op ingebouwde data ─────────────────
(function laadProducten() {
  // Bepaal het pad relatief aan de root (werkt op zowel GitHub Pages als localhost)
  const pad = '/data/products.json';

  fetch(pad)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      Object.assign(window.PRODUCTEN, data);
      _resolve(window.PRODUCTEN);
    })
    .catch(err => {
      console.warn('[Afbouwr] products.json niet geladen, gebruik fallback.', err.message);
      Object.assign(window.PRODUCTEN, _FALLBACK);
      _resolve(window.PRODUCTEN);
    });
})();
