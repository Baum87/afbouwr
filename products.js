/**
 * Afbouwr — Productcatalogus
 *
 * Voeg hier merken en typen toe. De calculators lezen deze config
 * automatisch in — geen HTML aanpassen nodig.
 *
 * Structuur:
 *   plafondplaten  → gebruikt door Systeemplafond calculator
 *   gipstypen      → gebruikt door Metalstud Wand calculator
 *
 * Veld 'vasteMaten' → overschrijft de gebruikersinput voor breedte/lengte
 * als een gipstype een afwijkende standaardmaat heeft (bijv. OSB, 4-AK).
 */

'use strict';

const PRODUCTEN = {

  // ── Systeemplafond — plafondplaten ────────────────────────────────────────
  //
  // waarde : wordt opgeslagen in het project (zichtbaar in exportoverzicht)
  // label  : weergave in de dropdown
  //
  plafondplaten: [
    {
      merk: 'Knauf',
      typen: [
        { waarde: 'Knauf Sahara',    label: 'Sahara' },
        { waarde: 'Knauf Feria',     label: 'Feria' },
        { waarde: 'Knauf Perla OP',  label: 'Perla OP 0.95' },
        { waarde: 'Knauf Tatra',     label: 'Tatra' },
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

  // ── Metalstud Wand — gipstypen ────────────────────────────────────────────
  //
  // waarde     : interne sleutel (wordt opgeslagen in project)
  // label      : weergave in de dropdown
  // vasteMaten : { breedte: mm, lengte: mm } — vult breedte/lengte automatisch
  //              in als dit type een afwijkende standaardmaat heeft.
  //              null = geen vaste maat (gebruikersinput geldt).
  //
  gipstypen: [
    { waarde: 'standaard_ak',   label: 'Standaard AK',          vasteMaten: null },
    { waarde: 'standaard_4ak',  label: 'Standaard 4-AK',        vasteMaten: { breedte: 1200, lengte: 2400 } },
    { waarde: 'hydro',          label: 'Hydro (groen)',          vasteMaten: null },
    { waarde: 'ladura',         label: 'Ladura Standaard',       vasteMaten: null },
    { waarde: 'novlam',         label: 'Novlam (roze)',          vasteMaten: null },
    { waarde: 'osb',            label: 'OSB',                   vasteMaten: { breedte: 1250, lengte: 2500 } },
  ],

};
