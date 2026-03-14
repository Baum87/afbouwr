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
      merk: 'Armstrong',
      typen: [
        { waarde: 'Armstrong Dune',      label: 'Dune' },
        { waarde: 'Armstrong Cortega',   label: 'Cortega' },
        { waarde: 'Armstrong Bioguard',  label: 'Bioguard' },
      ],
    },
    {
      merk: 'Rockfon',
      typen: [
        { waarde: 'Rockfon Sonar',       label: 'Sonar' },
        { waarde: 'Rockfon Color-all',   label: 'Color-all' },
        { waarde: 'Rockfon Tropic',      label: 'Tropic' },
      ],
    },
    {
      merk: 'Knauf',
      typen: [
        { waarde: 'Knauf Cleaneo',       label: 'Cleaneo' },
        { waarde: 'Knauf Soundwave',     label: 'Soundwave' },
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
