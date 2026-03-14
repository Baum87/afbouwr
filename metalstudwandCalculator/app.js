/* ============================================
   METALSTUD WAND REKENMACHINE — app.js
   Vanilla JS | localStorage | Debounce 500ms
   ============================================ */

'use strict';

// ─── CONFIG ────────────────────────────────────────────────────────────────
const DEBOUNCE_DELAY = 500;
const STORAGE_KEY = 'metalstud_wand_wanden';
const STORAGE_KEY_PROJECT = 'metalstud_wand_project';
const STORAGE_KEY_EXTRA   = 'metalstud_wand_extra';
const ISOLATIE_LENGTE = 1350;     // mm — vast
const ISOLATIE_BREEDTE = 600;    // mm — vast
const HOH_AFSTAND_DEFAULT = 0.6; // m  — standaard hart-op-hart afstand

// Schroefpatronen — vaste configuratie gedeeld door alle wandtypes
const SCHROEF_1LAAG = [
  { laag: 1, lengte: 25, afstand_lengte: 250, afstand_breedte: 590 },
];
const SCHROEF_2LAAGS = [
  { laag: 1, lengte: 25, afstand_lengte: 750, afstand_breedte: 590 },
  { laag: 2, lengte: 35, afstand_lengte: 250, afstand_breedte: 590 },
];

/** Wand-type configuratie — eenvoudig uit te breiden
 *
 *  Naamgeving sleutel: gebruik underscores ipv punten/spaties
 *  isolatie: false = geen, 'A' = 1 laag, 'AA' = 2 lagen
 *  max_isolatie_dikte: maximale isolatiedikte in mm (beperking door profielbreedte)
 *  schroeven: [ { laag, lengte, afstand_lengte } ]
 */
const WAND_TYPES = {

  // ── Bestaande types ───────────────────────────────────────────────────────
  MS75_1_50_1: {
    label: 'MS75 1.50.1', dikte: 75,
    gips_links: 1, profiel_breedte: 50, gips_rechts: 1,
    isolatie: false, isolatie_lagen: 0, max_isolatie_dikte: null,
    schroeven: SCHROEF_1LAAG,
  },
  MS100_2_50_2: {
    label: 'MS100 2.50.2', dikte: 100,
    gips_links: 2, profiel_breedte: 50, gips_rechts: 2,
    isolatie: 'A', isolatie_lagen: 0, max_isolatie_dikte: null,
    schroeven: SCHROEF_2LAAGS,
  },
  MS100_2_50_2A: {
    label: 'MS100 2.50.2A', dikte: 100,
    gips_links: 2, profiel_breedte: 50, gips_rechts: 2,
    isolatie: 'A', isolatie_lagen: 1, max_isolatie_dikte: 50,
    schroeven: SCHROEF_2LAAGS,
  },
  MS100_1_75_1: {
    label: 'MS100 1.75.1', dikte: 100,
    gips_links: 1, profiel_breedte: 75, gips_rechts: 1,
    isolatie: false, isolatie_lagen: 0, max_isolatie_dikte: null,
    schroeven: SCHROEF_1LAAG,
  },  
  MS100_1_75_1A: {
    label: 'MS100 1.75.1A', dikte: 100,
    gips_links: 1, profiel_breedte: 75, gips_rechts: 1,
    isolatie: 'A', isolatie_lagen: 1, max_isolatie_dikte: 75,
    schroeven: SCHROEF_1LAAG,
  },
  MS125_2_75_2: {
    label: 'MS125 2.75.2', dikte: 125,
    gips_links: 2, profiel_breedte: 75, gips_rechts: 2,
    isolatie: false, isolatie_lagen: 0, max_isolatie_dikte: null,
    schroeven: SCHROEF_2LAAGS,
  },
  MS125_2_75_2A: {
    label: 'MS125 2.75.2A', dikte: 125,
    gips_links: 2, profiel_breedte: 75, gips_rechts: 2,
    isolatie: 'A', isolatie_lagen: 1, max_isolatie_dikte: 75,
    schroeven: SCHROEF_2LAAGS,
  },
  MS125_1_100_1A: {
    label: 'MS125 1.100.1A', dikte: 125,
    gips_links: 1, profiel_breedte: 100, gips_rechts: 1,
    isolatie: 'A', isolatie_lagen: 1, max_isolatie_dikte: 100,
    schroeven: SCHROEF_1LAAG,
  },

  // ── Dubbele profielen ──────────────────────────────────────────────────────────

  MS205_2_75_75_2A: {
    label: 'MS205 2.75-75.2A', dikte: 205,
    gips_links: 2, profiel_breedte: 75, gips_rechts: 2,
    isolatie: 'A', isolatie_lagen: 1, max_isolatie_dikte: 75, dubbel_profiel: true,
    schroeven: SCHROEF_2LAAGS,
  },
  MS205_2_75_75_2AA: {
    label: 'MS205 2.75-75.2AA', dikte: 205,
    gips_links: 2, profiel_breedte: 75, gips_rechts: 2,
    isolatie: 'AA', isolatie_lagen: 2, max_isolatie_dikte: 75, dubbel_profiel: true,
    schroeven: SCHROEF_2LAAGS,
  },
  MS250_2_100_100_2A: {
    label: 'MS250 2.100-100.2A', dikte: 250,
    gips_links: 2, profiel_breedte: 100, gips_rechts: 2,
    isolatie: 'A', isolatie_lagen: 1, max_isolatie_dikte: 75, dubbel_profiel: true,
    schroeven: SCHROEF_2LAAGS,
  },
  MS250_2_100_100_2AA: {
    label: 'MS250 2.100-100.2AA', dikte: 250,
    gips_links: 2, profiel_breedte: 100, gips_rechts: 2,
    isolatie: 'AA', isolatie_lagen: 2, max_isolatie_dikte: 75, dubbel_profiel: true,
    schroeven: SCHROEF_2LAAGS,
  },

  // ── MSV (voorzetwand) types ───────────────────────────────────────────────
  
  MSV88_1_75: {
    label: 'MSV88 1.75', dikte: 88,
    gips_links: 1, profiel_breedte: 75, gips_rechts: 0,
    isolatie: false, isolatie_lagen: 0, max_isolatie_dikte: null,
    schroeven: SCHROEF_1LAAG,
  },
  MSV100_2_75: {
    label: 'MSV100 2.75', dikte: 100,
    gips_links: 2, profiel_breedte: 75, gips_rechts: 0,
    isolatie: false, isolatie_lagen: 0, max_isolatie_dikte: null,
    schroeven: SCHROEF_2LAAGS,
  },
  MSV100_2_75A: {
    label: 'MSV100 2.75A', dikte: 100,
    gips_links: 2, profiel_breedte: 75, gips_rechts: 0,
    isolatie: 'A', isolatie_lagen: 1, max_isolatie_dikte: 75,
    schroeven: SCHROEF_2LAAGS,
  },
  MSV75_2_50: {
    label: 'MSV75 2.50', dikte: 75,
    gips_links: 2, profiel_breedte: 50, gips_rechts: 0,
    isolatie: false, isolatie_lagen: 0, max_isolatie_dikte: null,
    schroeven: SCHROEF_2LAAGS,
  },
  MSV75_2_50A: {
    label: 'MSV75 2.50A', dikte: 75,
    gips_links: 2, profiel_breedte: 50, gips_rechts: 0,
    isolatie: 'A', isolatie_lagen: 1, max_isolatie_dikte: 50,
    schroeven: SCHROEF_2LAAGS,
  },
};

const GIPS_LABELS = {
  standaard_ak:   'Standaard AK',
  standaard_4ak:  'Standaard 4-AK (2400×1200)',
  hydro:          'Hydro (groen)',
  ladura:         'Ladura Standaard',
  novlam:         'Novlam (roze)',
  osb:            'OSB',
};

// Vaste afmetingen per gipstype (overschrijft gebruikersinput indien aanwezig)
const GIPS_VASTE_MATEN = {
  standaard_4ak: { breedte: 1200, lengte: 2400 },
  osb:           { breedte: 1250, lengte: 2500 }, // standaard OSB plaat
};

// ─── STATE ─────────────────────────────────────────────────────────────────
let state = {
  wanden: [],            // opgeslagen wanden
  extra_materialen: [],  // handmatig toegevoegde materialen
  berekening: null,      // laatste live berekening
};

// ─── DOM ────────────────────────────────────────────────────────────────────
const DOM = {
  omschrijving:    () => document.getElementById('wand-omschrijving'),
  wandType:        () => document.getElementById('wand-type'),
  wandLengte:      () => document.getElementById('wand-lengte'),
  wandHoogte:      () => document.getElementById('wand-hoogte'),
  wandOppervlakte: () => document.getElementById('wand-oppervlakte'),
  profielBreedteDisplay: () => document.getElementById('profiel-breedte-display'),
  gipsLagenDisplay:      () => document.getElementById('gips-lagen-display'),
  isolatieDisplay:       () => document.getElementById('isolatie-display'),
  extraOpties:     () => document.getElementById('extra-opties'),
  gipsTypeLinks1:  () => document.getElementById('gips-type-links-1'),
  gipsTypeLinks2:  () => document.getElementById('gips-type-links-2'),
  gipsTypeRechts1: () => document.getElementById('gips-type-rechts-1'),
  gipsTypeRechts2: () => document.getElementById('gips-type-rechts-2'),
  hohAfstand:      () => document.getElementById('hoh-afstand'),
  isolatieDikte:   () => document.getElementById('isolatie-dikte'),
  gipsBreedte:     () => document.getElementById('gips-breedte'),
  gipsLengte:      () => document.getElementById('gips-lengte'),
  profielULengte:  () => document.getElementById('profiel-u-lengte'),
  profielCLengte:  () => document.getElementById('profiel-c-lengte'),
  vuType:          () => document.getElementById('vu-type'),
  vuAantal:        () => document.getElementById('vu-aantal'),
  vuLengte:        () => document.getElementById('vu-lengte'),
  extraOmschrijving: () => document.getElementById('extra-omschrijving'),
  extraAantal:       () => document.getElementById('extra-aantal'),
  extraEenheid:      () => document.getElementById('extra-eenheid'),
  btnHandmatigAdd:   () => document.getElementById('btn-handmatig-add'),
  btnAllesReset:     () => document.getElementById('btn-alles-reset'),
  projectNaam:     () => document.getElementById('project-naam'),
  btnAdd:          () => document.getElementById('btn-add'),
  calcStatus:      () => document.getElementById('calc-status'),
  countWanden:     () => document.getElementById('count-wanden'),
  tbodyAlgemeen:   () => document.getElementById('tbody-algemeen'),
  tbodyU:          () => document.getElementById('tbody-u'),
  tfootU:          () => document.getElementById('tfoot-u'),
  tbodyC:          () => document.getElementById('tbody-c'),
  tfootC:          () => document.getElementById('tfoot-c'),
  tbodyGips:       () => document.getElementById('tbody-gips'),
  tfootGips:       () => document.getElementById('tfoot-gips'),
  tbodyIsolatie:   () => document.getElementById('tbody-isolatie'),
  tfootIsolatie:   () => document.getElementById('tfoot-isolatie'),
  tbodySchroeven:  () => document.getElementById('tbody-schroeven'),
  tfootSchroeven:  () => document.getElementById('tfoot-schroeven'),
};

// ─── DEBOUNCE ───────────────────────────────────────────────────────────────
let debounceTimer;
function debounce(fn) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fn, DEBOUNCE_DELAY);
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
/** @param {number} n @returns {number} */
function ceilN(n) { return Math.ceil(n); }
/** @param {number} n @returns {number} Afgerond op 2 decimalen */
function round2(n) { return Math.round(n * 100) / 100; }
/** @param {number} n @returns {number|string} */
function fmtNum(n) { return Number.isInteger(n) ? n : round2(n); }

/**
 * Toont een statusmelding in de invoerkaart.
 * @param {string} msg   - Weergegeven tekst
 * @param {'ready'|'calculating'|'error'|''} [type] - CSS modifier
 */
function setStatus(msg, type = '') {
  const el = DOM.calcStatus();
  el.textContent = msg;
  el.className = 'calc-status ' + type;
}

// ─── INLINE VELDVALIDATIE ─────────────────────────────────────────────────────
/**
 * Markeert een inputveld als ongeldig en toont een foutmelding eronder.
 * @param {HTMLInputElement|HTMLSelectElement} el
 * @param {string} msg
 */
function toonFout(el, msg) {
  el.classList.add('invalid');
  const foutId = (el.id || 'veld') + '-fout';
  let fout = el.parentElement.querySelector('.field-error-msg');
  if (!fout) {
    fout = document.createElement('span');
    fout.className = 'field-error-msg';
    fout.setAttribute('role', 'alert');
    fout.id = foutId;
    el.after(fout);
  }
  fout.textContent = msg;
  el.setAttribute('aria-describedby', foutId);
  el.setAttribute('aria-invalid', 'true');
}

/** @param {HTMLInputElement|HTMLSelectElement} el */
function verbergFout(el) {
  el.classList.remove('invalid');
  el.removeAttribute('aria-describedby');
  el.removeAttribute('aria-invalid');
  const fout = el.parentElement.querySelector('.field-error-msg');
  if (fout) fout.remove();
}

/**
 * Toont of verbergt een inline foutmelding afhankelijk van de conditie.
 * @param {HTMLInputElement|HTMLSelectElement} el
 * @param {boolean} conditie - `true` = geldig (geen fout)
 * @param {string} msg
 */
function valideerVeld(el, conditie, msg) {
  if (!conditie) toonFout(el, msg);
  else verbergFout(el);
}

/**
 * Leest alle invoervelden uit en geeft een genormaliseerd inputobject terug.
 * @returns {{
 *   omschrijving: string,
 *   wand_type: string,
 *   wand_lengte: number,
 *   wand_hoogte: number,
 *   gips_type_links_1: string,
 *   gips_type_links_2: string|null,
 *   gips_type_rechts_1: string,
 *   gips_type_rechts_2: string|null,
 *   hoh_afstand: number,
 *   isolatie_dikte: number,
 *   gips_breedte: number,
 *   gips_lengte: number,
 *   profiel_u_lengte: number,
 *   profiel_c_lengte: number
 * }}
 */
function getInputs() {
  return {
    omschrijving: DOM.omschrijving().value.trim() || 'Wand',
    wand_type:    DOM.wandType().value,
    wand_lengte:  parseFloat(DOM.wandLengte().value),
    wand_hoogte:  parseFloat(DOM.wandHoogte().value),
    gips_type_links_1:  DOM.gipsTypeLinks1().value,
    gips_type_links_2:  DOM.gipsTypeLinks2() ? DOM.gipsTypeLinks2().value : null,
    gips_type_rechts_1: DOM.gipsTypeRechts1().value,
    gips_type_rechts_2: DOM.gipsTypeRechts2() ? DOM.gipsTypeRechts2().value : null,
    hoh_afstand:  parseFloat(DOM.hohAfstand().value) || HOH_AFSTAND_DEFAULT,
    isolatie_dikte: parseInt(DOM.isolatieDikte().value),
    gips_breedte:   parseInt(DOM.gipsBreedte().value),
    gips_lengte:    parseInt(DOM.gipsLengte().value),
    profiel_u_lengte: parseInt(DOM.profielULengte().value),
    profiel_c_lengte: parseInt(DOM.profielCLengte().value),
  };
}

/**
 * Controleert of de invoer voldoende is om een berekening te starten.
 * @param {ReturnType<typeof getInputs>} inp
 * @returns {boolean}
 */
function geldigeInputs(inp) {
  return inp.wand_type &&
         inp.wand_lengte > 0 && !isNaN(inp.wand_lengte) &&
         inp.wand_hoogte > 0 && !isNaN(inp.wand_hoogte);
}

// ─── BEREKEN (lokaal — geen backend nodig voor deze formules) ───────────────
/**
 * Berekent alle materialenhoeveelheden voor één wand.
 * @param {ReturnType<typeof getInputs>} inp
 * @returns {{
 *   cfg: object,
 *   wand_opp: number,
 *   profiel_factor: number,
 *   profiel_u_aantal: number,
 *   profiel_c_aantal: number,
 *   gips_opp: number,
 *   platen_per_laag: number,
 *   gips_lagen: Array<{zijde: string, laag_nr: number, gips_type: string, breedte: number, lengte: number, opp: number, aantal: number}>,
 *   gips_aantal: number,
 *   iso_opp: number,
 *   iso_aantal: number,
 *   heeft_isolatie: boolean,
 *   isolatie_lagen: number,
 *   schroeven_per_laag: Array<{laag: number, lengte: number, afstand_lengte: number, afstand_breedte: number, totaal: number}>
 * }|null} Null als wand_type onbekend is
 */
function berekenLokaal(inp) {
  const cfg = WAND_TYPES[inp.wand_type];
  if (!cfg) return null;

  const wand_opp = round2(inp.wand_lengte * inp.wand_hoogte);

  // U-profielen: onder + boven regel → lengte wand / profiel lengte, ×2
  // Bij dubbel profiel (bv. MS205): factor ×2 voor elke regel
  const profiel_factor = cfg.dubbel_profiel ? 2 : 1;
  const u_lengte_m = inp.profiel_u_lengte / 1000;
  const profiel_u_aantal = ceilN((inp.wand_lengte / u_lengte_m) * 2 * profiel_factor);

  // C-profielen: per HoH over wandlengte, dubbel bij dubbel profiel
  const profiel_c_aantal = ceilN(inp.wand_lengte / inp.hoh_afstand) * profiel_factor;

  // Gipskarton: per laag per zijde, elk met eigen gipstype
  // Sommige giptypes hebben vaste maten (bv. standaard_4ak = 2400×1200)
  function resolveGipsMaten(gips_type) {
    const vast = GIPS_VASTE_MATEN[gips_type];
    return vast ? vast : { breedte: inp.gips_breedte, lengte: inp.gips_lengte };
  }
  // Gebruik maten van 1e laag links als referentie voor platen_per_laag
  const ref_maten = resolveGipsMaten(inp.gips_type_links_1);
  const gips_opp = (ref_maten.breedte / 1000) * (ref_maten.lengte / 1000);
  const platen_per_laag = ceilN(wand_opp / gips_opp);

  // Bouw gips_lagen array: { zijde, laag_nr, gips_type, breedte, lengte, opp, aantal }
  //
  // Correcte berekening:
  //   1. Verzamel ALLE lagen van alle zijden
  //   2. Groepeer op gipstype+maat (over beide zijden samen)
  //   3. Totale te bedekken opp = wand_opp × totaal aantal lagen van dit type (links + rechts)
  //   4. Dan pas afronden: ceil(totaal_opp / plaat_opp)
  //   5. Verdeel het afgeronde totaal eerlijk terug over de individuele lagen

  // Stap 1: verzamel alle lagen (zijde + laag_nr + gipstype)
  const alle_lagen = [];
  for (let i = 1; i <= cfg.gips_links; i++) {
    const gt = i === 1 ? inp.gips_type_links_1 : (inp.gips_type_links_2 || inp.gips_type_links_1);
    alle_lagen.push({ zijde: 'links', laag_nr: i, gt });
  }
  for (let i = 1; i <= cfg.gips_rechts; i++) {
    const gt = i === 1 ? inp.gips_type_rechts_1 : (inp.gips_type_rechts_2 || inp.gips_type_rechts_1);
    alle_lagen.push({ zijde: 'rechts', laag_nr: i, gt });
  }

  // Stap 2: groepeer op gipstype+maat over beide zijden samen
  const gipsGroepen = {};
  for (const laag of alle_lagen) {
    const m = resolveGipsMaten(laag.gt);
    const key = `${laag.gt}|${m.breedte}|${m.lengte}`;
    if (!gipsGroepen[key]) {
      gipsGroepen[key] = { gt: laag.gt, m, lagen: [] };
    }
    gipsGroepen[key].lagen.push(laag);
  }

  // Stap 3+4: bereken totaal aantal platen per groep (1x afronden over alle lagen samen)
  // Stap 5: verdeel eerlijk terug over individuele lagen
  const gips_lagen = [];
  for (const key of Object.keys(gipsGroepen)) {
    const { gt, m, lagen } = gipsGroepen[key];
    const plaat_opp = round2((m.breedte / 1000) * (m.lengte / 1000));
    const totaal_te_bedekken = wand_opp * lagen.length;   // bijv. 10m² × 4 lagen = 40m²
    const totaal_aantal = ceilN(totaal_te_bedekken / plaat_opp); // 1x afronden
    // Verdeel eerlijk over lagen: basis + eventueel 1 extra voor de eerste lagen
    const per_laag_basis = Math.floor(totaal_aantal / lagen.length);
    let rest = totaal_aantal - per_laag_basis * lagen.length;
    for (const laag of lagen) {
      const aantal = per_laag_basis + (rest > 0 ? 1 : 0);
      if (rest > 0) rest--;
      gips_lagen.push({
        zijde: laag.zijde, laag_nr: laag.laag_nr,
        gips_type: gt, breedte: m.breedte, lengte: m.lengte,
        opp: plaat_opp, aantal,
      });
    }
  }

  // Hersorteer op zijde + laag_nr voor consistente weergave in tabel
  gips_lagen.sort((a, b) => {
    if (a.zijde !== b.zijde) return a.zijde === 'links' ? -1 : 1;
    return a.laag_nr - b.laag_nr;
  });
  const gips_aantal = gips_lagen.reduce((s, l) => s + l.aantal, 0);

  // Isolatie
  const iso_opp = (ISOLATIE_LENGTE / 1000) * (ISOLATIE_BREEDTE / 1000); // m²
  const iso_aantal = cfg.isolatie ? ceilN((wand_opp / iso_opp) * cfg.isolatie_lagen) : 0;

  // Schroeven: per laag, per daadwerkelijke gipszijde
  // Aantal rijen breedte = CEIL(gips_breedte / afstand_breedte)  (std. 590mm)
  // Aantal rijen lengte  = CEIL(gips_lengte  / afstand_lengte)   (250mm of 750mm afhankelijk van laag)
  // Totaal per plaat     = rijen_b × rijen_l
  // Totaal per laag      = totaal_per_plaat × aantal_platen_in_die_laag
  // (aantal_platen_in_die_laag wordt bepaald o.b.v. gips_lagen → werkt automatisch voor links/rechts en 1- of 2-laags systemen)
  
  const schroeven_per_laag = (cfg.schroeven || []).map(s => {

    // aantal schroeflijnen over de lengte van de plaat
    const rijen_lengte = ceilN(inp.gips_lengte / s.afstand_lengte);

    // breedteverdeling op basis van daadwerkelijke hoh-afstand
    const hoh_mm = inp.hoh_afstand * 1000;
    const rijen_breedte = ceilN(inp.gips_breedte / hoh_mm);

    // totaal schroeven per plaat
    const schroeven_per_plaat = rijen_lengte * rijen_breedte;

    // bepaal hoeveel platen bij deze laag horen
    const platen_in_deze_laag = gips_lagen
      .filter(l => l.laag_nr === s.laag)
      .reduce((sum, l) => sum + l.aantal, 0);

    const totaal = schroeven_per_plaat * platen_in_deze_laag;

    return {
      laag: s.laag,
      lengte: s.lengte,
      afstand_lengte: s.afstand_lengte,
      afstand_breedte: s.afstand_breedte,
      totaal,
    };
  });

  return {
    cfg,
    wand_opp,
    profiel_factor,
    profiel_u_aantal,
    profiel_c_aantal,
    gips_opp: round2(gips_opp),
    platen_per_laag,
    gips_lagen,
    gips_aantal,
    iso_opp: round2(iso_opp),
    iso_aantal,
    heeft_isolatie: !!cfg.isolatie,
    isolatie_lagen: cfg.isolatie_lagen,
    schroeven_per_laag,
  };
}

// ─── TYPE KIEZEN → derived info bijwerken ──────────────────────────────────
function onTypeChange() {
  const type = DOM.wandType().value;
  const cfg = WAND_TYPES[type];

  if (cfg) {
    DOM.profielBreedteDisplay().textContent = cfg.profiel_breedte + ' mm';
    DOM.gipsLagenDisplay().textContent =
      `${cfg.gips_links}× links / ${cfg.gips_rechts}× rechts`;
    DOM.isolatieDisplay().textContent = cfg.isolatie
      ? `Ja (${cfg.isolatie_lagen}× laag)`
      : 'Nee';

    // Toon/verberg 2e laag dropdowns afhankelijk van gips_links/rechts
    const heeftL2 = cfg.gips_links >= 2;
    const heeftR2 = cfg.gips_rechts >= 2;
    document.getElementById('groep-links-2').style.display  = heeftL2 ? '' : 'none';
    document.getElementById('groep-rechts-2').style.display = heeftR2 ? '' : 'none';

    // Toon/verberg rechterzijde dropdowns voor voorzetwanden (gips_rechts === 0)
    document.getElementById('groep-rechts-1').style.display = cfg.gips_rechts > 0 ? '' : 'none';
    document.getElementById('groep-rechts-2').style.display = heeftR2 ? '' : 'none';

    // Beperk isolatiedikte opties op basis van profielbreedte
    filterIsolatieDikte(cfg);

    // Toon/verberg isolatie groep
    document.getElementById('isolatie-groep').style.display = cfg.isolatie ? '' : 'none';

    // filter C-profielen op basis van hoogte (toon alleen ≥ hoogte)
    DOM.extraOpties().classList.remove('hidden');
    filterCProfielen();
  } else {
    DOM.profielBreedteDisplay().textContent = '—';
    DOM.gipsLagenDisplay().textContent = '—';
    DOM.isolatieDisplay().textContent = '—';
    DOM.extraOpties().classList.add('hidden');
  }
  triggerBerekening();
}

/**
 * Schakelt isolatiedikte-opties uit die de profielbreedte overschrijden.
 * @param {{ max_isolatie_dikte: number|null }} cfg
 */
function filterIsolatieDikte(cfg) {
  const sel = DOM.isolatieDikte();
  const max = cfg.max_isolatie_dikte;
  let eersteGeldig = null;
  Array.from(sel.options).forEach(opt => {
    const val = parseInt(opt.value);
    const geldig = max === null || val <= max;
    opt.disabled = !geldig;
    opt.style.color = geldig ? '' : '#bbb';
    if (geldig && !eersteGeldig) eersteGeldig = opt;
  });
  // Als huidige keuze nu disabled is, selecteer eerste geldige
  if (sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].disabled && eersteGeldig) {
    sel.value = eersteGeldig.value;
  }
}

function filterCProfielen() {
  const hoogte_m = parseFloat(DOM.wandHoogte().value) || 0;
  const hoogte_mm = hoogte_m * 1000;
  const sel = DOM.profielCLengte();
  let eersteGeldig = null;

  Array.from(sel.options).forEach(opt => {
    const val = parseInt(opt.value);
    const geldig = val >= hoogte_mm;
    opt.disabled = !geldig;
    opt.style.color = geldig ? '' : '#ccc';
    if (geldig && !eersteGeldig) eersteGeldig = opt;
  });

  // zet eerste geldige optie actief als huidige disabled is
  const huidig = parseInt(sel.value);
  if (huidig < hoogte_mm && eersteGeldig) {
    sel.value = eersteGeldig.value;
  }
}

// ─── TRIGGER BEREKENING ─────────────────────────────────────────────────────
function triggerBerekening() {
  const inp = getInputs();
  if (!geldigeInputs(inp)) {
    state.berekening = null;
    DOM.wandOppervlakte().textContent = '—';
    DOM.btnAdd().disabled = true;
    setStatus('');
    return;
  }
  DOM.wandOppervlakte().textContent = round2(inp.wand_lengte * inp.wand_hoogte) + ' m²';
  setStatus('Berekenen…', 'calculating');

  debounce(() => {
    const result = berekenLokaal(inp);
    if (result) {
      state.berekening = { inp, result };
      DOM.btnAdd().disabled = false;
      setStatus('✓ Klaar om toe te voegen', 'ready');
    } else {
      state.berekening = null;
      DOM.btnAdd().disabled = true;
      setStatus('Ongeldige invoer', 'error');
    }
  });
}

// ─── TOEVOEGEN ──────────────────────────────────────────────────────────────
function voegToe() {
  if (!state.berekening) return;
  const { inp, result } = state.berekening;

  const wand = {
    id: Date.now(),
    omschrijving: inp.omschrijving,
    wand_type: inp.wand_type,
    wand_lengte: inp.wand_lengte,
    wand_hoogte: inp.wand_hoogte,
    wand_opp: result.wand_opp,
    gips_type_links_1: inp.gips_type_links_1,
    gips_type_links_2: inp.gips_type_links_2,
    gips_type_rechts_1: inp.gips_type_rechts_1,
    gips_type_rechts_2: inp.gips_type_rechts_2,
    hoh_afstand: inp.hoh_afstand,
    isolatie_dikte: inp.isolatie_dikte,
    gips_breedte: inp.gips_breedte,
    gips_lengte: inp.gips_lengte,
    profiel_u_lengte: inp.profiel_u_lengte,
    profiel_c_lengte: inp.profiel_c_lengte,
    profiel_breedte: result.cfg.profiel_breedte,
    profiel_u_aantal: result.profiel_u_aantal,
    profiel_c_aantal: result.profiel_c_aantal,
    gips_opp: result.gips_opp,
    gips_lagen: result.gips_lagen,
    gips_aantal: result.gips_aantal,
    heeft_isolatie: result.heeft_isolatie,
    isolatie_lagen: result.isolatie_lagen,
    iso_opp: result.iso_opp,
    iso_aantal: result.iso_aantal,
    schroeven_per_laag: result.schroeven_per_laag,
    dubbel_profiel: result.cfg.dubbel_profiel || false,
  };

  state.wanden.push(wand);
  opslaan();
  renderAlles();
  setStatus('✓ Toegevoegd!', 'ready');
  setTimeout(() => setStatus(''), 2000);
}

// ─── VERWIJDEREN ────────────────────────────────────────────────────────────

function allesVerwijderen() {
  if (!confirm('Alles verwijderen? Alle wanden, handmatige items en de projectnaam worden gewist.')) return;
  state.wanden = [];
  state.extra_materialen = [];
  try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
  try { localStorage.removeItem(STORAGE_KEY_EXTRA); } catch(e) {}
  try { localStorage.removeItem(STORAGE_KEY_PROJECT); } catch(e) {}
  DOM.projectNaam().value = '';
  renderAlles();
}

function verwijder(id) {
  state.wanden = state.wanden.filter(w => w.id !== id);
  opslaan();
  renderAlles();
}

// ─── OPSLAAN / LADEN ────────────────────────────────────────────────────────
function opslaan() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.wanden)); } catch(e) {}
  try { localStorage.setItem(STORAGE_KEY_EXTRA, JSON.stringify(state.extra_materialen)); } catch(e) {}
}

function slaProjectOp(naam) {
  try { localStorage.setItem(STORAGE_KEY_PROJECT, naam); } catch(e) {}
}

function laadOpgeslagen() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state.wanden = JSON.parse(raw);
  } catch(e) { state.wanden = []; }
  // Projectnaam herstellen
  try {
    const naam = localStorage.getItem(STORAGE_KEY_PROJECT) || '';
    if (naam) DOM.projectNaam().value = naam;
  } catch(e) {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXTRA);
    if (raw) state.extra_materialen = JSON.parse(raw);
  } catch(e) { state.extra_materialen = []; }
}

// ─── RENDER ─────────────────────────────────────────────────────────────────
function renderAlles() {
  document.getElementById('results-section').style.display = state.wanden.length > 0 ? '' : 'none';
  renderAlgemeen();
  renderUProfielen();
  renderCProfielen();
  renderGips();
  renderIsolatie();
  renderSchroeven();
  renderTotalen();
  DOM.countWanden().textContent = `${state.wanden.length} ${state.wanden.length === 1 ? 'wand' : 'wanden'}`;
}

function emptyRow(colspan) {
  return `<tr class="empty-row"><td colspan="${colspan}">Nog geen gegevens</td></tr>`;
}

// Tabel 1: Algemeen
function renderAlgemeen() {
  const tbody = DOM.tbodyAlgemeen();
  if (!state.wanden.length) { tbody.innerHTML = emptyRow(6); return; }

  tbody.innerHTML = state.wanden.map(w => `
    <tr>
      <td>${esc(w.omschrijving)}</td>
      <td>${w.wand_type.replace(/_/g,' ')}</td>
      <td class="num">${fmtNum(w.wand_lengte)}</td>
      <td class="num">${fmtNum(w.wand_hoogte)}</td>
      <td class="num">${fmtNum(w.wand_opp)}</td>
      <td><button class="btn-delete" data-action="verwijder" data-id="${w.id}" title="Verwijder" aria-label="Wand '${esc(w.omschrijving)}' verwijderen">✕</button></td>
    </tr>`).join('');
}


// Tabel 2b: VU-profielen (verzwaard, optioneel, bij kozijnen)
function renderVUProfielen() {
  const tbody = document.getElementById('tbody-vu');
  const tfoot = document.getElementById('tfoot-vu');
  if (!tbody) return;

  const metVU = state.wanden.filter(w => w.vu_aantal > 0);
  if (!metVU.length) { tbody.innerHTML = emptyRow(4); if (tfoot) tfoot.innerHTML = ''; return; }

  tbody.innerHTML = metVU.map(w => `
    <tr>
      <td>${esc(w.omschrijving)}</td>
      <td class="num">VU${w.vu_type}</td>
      <td class="num">${w.vu_lengte}</td>
      <td class="num">${w.vu_aantal}</td>
    </tr>`).join('');

  // Totalen: groepeer op type + lengte
  const groepen = groepeer(metVU, w => `${w.vu_type}|${w.vu_lengte}`);
  if (tfoot) tfoot.innerHTML = Object.entries(groepen).map(([key, wanden]) => {
    const [type, lengte] = key.split('|');
    const totaal = wanden.reduce((s, w) => s + w.vu_aantal, 0);
    return `<tr>
      <td class="totaal-label" colspan="2">Totaal VU${type} / ${lengte}mm</td>
      <td></td>
      <td class="totaal-val num">${totaal} st</td>
    </tr>`;
  }).join('');
}

// Tabel 2: U-profielen
function renderUProfielen() {
  const tbody = DOM.tbodyU();
  const tfoot = DOM.tfootU();
  if (!state.wanden.length) { tbody.innerHTML = emptyRow(4); tfoot.innerHTML = ''; return; }

  tbody.innerHTML = state.wanden.map(w => `
    <tr>
      <td>${esc(w.omschrijving)}</td>
      <td class="num">${w.profiel_breedte}</td>
      <td class="num">${w.profiel_u_lengte}</td>
      <td class="num">${w.profiel_u_aantal}</td>
    </tr>`).join('');

  // Totalen: groepeer op breedte + lengte
  const groepen = groepeer(state.wanden, w => `${w.profiel_breedte}|${w.profiel_u_lengte}`);
  tfoot.innerHTML = Object.entries(groepen).map(([key, wanden]) => {
    const [breedte, lengte] = key.split('|');
    const totaal = wanden.reduce((s, w) => s + w.profiel_u_aantal, 0);
    return `<tr>
      <td class="totaal-label" colspan="2">Totaal U${breedte} / ${lengte}mm</td>
      <td></td>
      <td class="totaal-val num">${totaal} st</td>
    </tr>`;
  }).join('');
}

// Tabel 3: C-profielen
function renderCProfielen() {
  const tbody = DOM.tbodyC();
  const tfoot = DOM.tfootC();
  if (!state.wanden.length) { tbody.innerHTML = emptyRow(5); tfoot.innerHTML = ''; return; }

  tbody.innerHTML = state.wanden.map(w => `
    <tr>
      <td>${esc(w.omschrijving)}</td>
      <td class="num">${w.profiel_breedte}</td>
      <td class="num">${w.profiel_c_lengte}</td>
      <td class="num">${fmtNum(w.hoh_afstand)}</td>
      <td class="num">${w.profiel_c_aantal}</td>
    </tr>`).join('');

  const groepen = groepeer(state.wanden, w => `${w.profiel_breedte}|${w.profiel_c_lengte}`);
  tfoot.innerHTML = Object.entries(groepen).map(([key, wanden]) => {
    const [breedte, lengte] = key.split('|');
    const totaal = wanden.reduce((s, w) => s + w.profiel_c_aantal, 0);
    return `<tr>
      <td class="totaal-label" colspan="3">Totaal C${breedte} / ${lengte}mm</td>
      <td></td>
      <td class="totaal-val num">${totaal} st</td>
    </tr>`;
  }).join('');
}

// Tabel 4: Gipskarton — één rij per laag per zijde
function renderGips() {
  const tbody = DOM.tbodyGips();
  const tfoot = DOM.tfootGips();
  if (!state.wanden.length) { tbody.innerHTML = emptyRow(7); tfoot.innerHTML = ''; return; }

  const rijen = [];
  state.wanden.forEach(w => {
    (w.gips_lagen || []).forEach(l => {
      rijen.push({
        omschrijving: w.omschrijving,
        zijde_laag:   `${l.zijde.charAt(0).toUpperCase() + l.zijde.slice(1)} — laag ${l.laag_nr}`,
        gips_type:    l.gips_type,
        gips_lengte:  l.lengte,
        gips_breedte: l.breedte,
        gips_opp:     l.opp,
        aantal:       l.aantal,
      });
    });
  });

  tbody.innerHTML = rijen.map(r => `
    <tr>
      <td>${esc(r.omschrijving)}</td>
      <td>${esc(r.zijde_laag)}</td>
      <td>${GIPS_LABELS[r.gips_type] || r.gips_type}</td>
      <td class="num">${r.gips_lengte}</td>
      <td class="num">${r.gips_breedte}</td>
      <td class="num">${fmtNum(r.gips_opp)}</td>
      <td class="num">${r.aantal}</td>
    </tr>`).join('');

  // Totalen: groepeer op gipstype + afmeting
  const groepen = groepeer(rijen, r => `${r.gips_type}|${r.gips_lengte}|${r.gips_breedte}`);
  tfoot.innerHTML = Object.entries(groepen).map(([key, items]) => {
    const [type, lengte, breedte] = key.split('|');
    const totaal = items.reduce((s, r) => s + r.aantal, 0);
    return `<tr>
      <td class="totaal-label" colspan="5">Totaal ${GIPS_LABELS[type] || type} ${lengte}×${breedte}mm</td>
      <td></td>
      <td class="totaal-val num">${totaal} st</td>
    </tr>`;
  }).join('');
}

// Tabel 5: Isolatie
function renderIsolatie() {
  const tbody = DOM.tbodyIsolatie();
  const tfoot = DOM.tfootIsolatie();
  const metIsolatie = state.wanden.filter(w => w.heeft_isolatie);

  if (!metIsolatie.length) { tbody.innerHTML = emptyRow(6); tfoot.innerHTML = ''; return; }

  tbody.innerHTML = metIsolatie.map(w => `
    <tr>
      <td>${esc(w.omschrijving)}</td>
      <td class="num">${w.isolatie_dikte}</td>
      <td class="num">${ISOLATIE_LENGTE}×${ISOLATIE_BREEDTE}</td>
      <td class="num">${fmtNum(w.iso_opp)}</td>
      <td class="num">${w.isolatie_lagen}×</td>
      <td class="num">${w.iso_aantal}</td>
    </tr>`).join('');

  const groepen = groepeer(metIsolatie, w => `${w.isolatie_dikte}`);
  tfoot.innerHTML = Object.entries(groepen).map(([dikte, wanden]) => {
    const totaal = wanden.reduce((s, w) => s + w.iso_aantal, 0);
    return `<tr>
      <td class="totaal-label" colspan="4">Totaal isolatie ${dikte}mm</td>
      <td></td>
      <td class="totaal-val num">${totaal} st</td>
    </tr>`;
  }).join('');
}


// Tabel 6: Schroeven
function renderSchroeven() {
  const tbody = DOM.tbodySchroeven();
  const tfoot = DOM.tfootSchroeven();

  // Bouw rijen: per wand, per laag
  const rijen = [];
  state.wanden.forEach(w => {
    (w.schroeven_per_laag || []).forEach(s => {
      rijen.push({
        omschrijving:   w.omschrijving,
        laag:           s.laag,
        lengte:         s.lengte,
        afstand_lengte: s.afstand_lengte,
        totaal:         s.totaal,
      });
    });
  });

  if (!rijen.length) { tbody.innerHTML = emptyRow(6); tfoot.innerHTML = ''; return; }

  tbody.innerHTML = rijen.map(r => `
    <tr>
      <td>${esc(r.omschrijving)}</td>
      <td class="num">Laag ${r.laag}</td>
      <td class="num">${r.lengte}</td>
      <td class="num">${r.afstand_lengte}</td>
      <td class="num">${r.totaal}</td>
    </tr>`).join('');

  // Totalen groeperen op lengte (schroeftype)
  const groepen = groepeer(rijen, r => `${r.lengte}`);
  tfoot.innerHTML = Object.entries(groepen).map(([lengte, items]) => {
    const totaal = items.reduce((s, r) => s + r.totaal, 0);
    return `<tr>
      <td class="totaal-label" colspan="3">Totaal schroeven ${lengte}mm</td>
      <td></td>
      <td class="totaal-val num">${totaal} st</td>
    </tr>`;
  }).join('');
}


// Tabel 7: Totaaloverzicht — alle materialen gesommeerd + handmatig toegevoegde
function renderTotalen() {
  const el = document.getElementById('tbody-totalen');
  if (!el) return;

  const heeftWanden = state.wanden.length > 0;
  const heeftExtra  = state.extra_materialen.length > 0;

  if (!heeftWanden && !heeftExtra) {
    el.innerHTML = emptyRow(4);
    return;
  }

  // ── Materialen uit wanden ─────────────────────────────────────────────────
  const materialen = {};
  function tel(categorie, omschrijving, eenheid, aantal) {
    const key = `${categorie}||${omschrijving}||${eenheid}`;
    if (!materialen[key]) materialen[key] = { categorie, omschrijving, eenheid, totaal: 0 };
    materialen[key].totaal += aantal;
  }

  state.wanden.forEach(w => {
    tel('U-profielen',  `U${w.profiel_breedte} — ${w.profiel_u_lengte}mm`, 'st', w.profiel_u_aantal);
    tel('C-profielen',  `C${w.profiel_breedte} — ${w.profiel_c_lengte}mm`, 'st', w.profiel_c_aantal);
    (w.gips_lagen || []).forEach(l => {
      tel('Gipskarton', `${GIPS_LABELS[l.gips_type] || l.gips_type} ${l.lengte}×${l.breedte}mm`, 'st', l.aantal);
    });
    if (w.heeft_isolatie && w.iso_aantal > 0) {
      tel('Isolatie', `Isolatie ${w.isolatie_dikte}mm — ${ISOLATIE_LENGTE}×${ISOLATIE_BREEDTE}mm`, 'st', w.iso_aantal);
    }
    (w.schroeven_per_laag || []).forEach(s => {
      tel('Schroeven', `Schroef ${s.lengte}mm`, 'st', s.totaal);
    });
  });

  // Vaste categorie-volgorde
  const CATEGORIE_VOLGORDE = [
    'U-profielen',
    'C-profielen',
    'Gipskarton',
    'Isolatie',
    'Schroeven',
  ];

  const wandRijen = Object.values(materialen).sort((a, b) => {
    const ai = CATEGORIE_VOLGORDE.indexOf(a.categorie);
    const bi = CATEGORIE_VOLGORDE.indexOf(b.categorie);
    const catSort = (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    if (catSort !== 0) return catSort;
    return a.omschrijving.localeCompare(b.omschrijving);
  });

  let huidigCategorie = '';
  let html = wandRijen.map(r => {
    let row = '';
    if (r.categorie !== huidigCategorie) {
      huidigCategorie = r.categorie;
      row += `<tr class="totaal-categorie-header"><td colspan="4">${esc(r.categorie)}</td></tr>`;
    }
    row += `<tr>
      <td>${esc(r.omschrijving)}</td>
      <td class="num">${r.totaal}</td>
      <td>${esc(r.eenheid)}</td>
      <td></td>
    </tr>`;
    return row;
  }).join('');

  // ── Handmatig toegevoegde materialen ─────────────────────────────────────
  if (heeftExtra) {
    // Groepeer extra materialen op categorie
    const extraGroepen = {};
    state.extra_materialen.forEach(e => {
      const cat = e.categorie || 'Handmatig toegevoegd';
      if (!extraGroepen[cat]) extraGroepen[cat] = [];
      extraGroepen[cat].push(e);
    });

    // Sorteer: VU-profielen eerst, dan rest alfabetisch
    const catVolgorde = Object.keys(extraGroepen).sort((a, b) => {
      if (a === 'VU-profielen') return -1;
      if (b === 'VU-profielen') return 1;
      return a.localeCompare(b);
    });

    catVolgorde.forEach(cat => {
      html += `<tr class="totaal-categorie-header totaal-header-extra"><td colspan="4">${esc(cat)}</td></tr>`;
      html += extraGroepen[cat].map(e => `
        <tr class="extra-rij">
          <td>${esc(e.omschrijving)}</td>
          <td class="num">${e.aantal}</td>
          <td>${esc(e.eenheid)}</td>
          <td><button class="btn-delete" data-action="verwijder-extra" data-id="${e.id}" title="Verwijder" aria-label="'${esc(e.omschrijving)}' verwijderen">✕</button></td>
        </tr>`).join('');
    });
  }

  el.innerHTML = html;
}

// ── Handmatig materiaal toevoegen ────────────────────────────────────────────
function voegHandmatigToe() {
  // Bepaal of VU of vrij materiaal ingevuld is
  const vuAantal  = parseInt(DOM.vuAantal().value);
  const vuLengte  = parseInt(DOM.vuLengte().value);
  const vuType    = DOM.vuType().value;
  const isVU      = !isNaN(vuAantal) && vuAantal > 0 && !isNaN(vuLengte) && vuLengte > 0;

  const omschrijving = DOM.extraOmschrijving().value.trim();
  const extraAantal  = parseFloat(DOM.extraAantal().value);
  const eenheid      = DOM.extraEenheid().value.trim() || 'st';
  const isVrij       = omschrijving && !isNaN(extraAantal) && extraAantal > 0;

  if (!isVU && !isVrij) {
    // Niets geldig ingevuld
    DOM.vuAantal().focus();
    return;
  }

  if (isVU) {
    state.extra_materialen.push({
      id: Date.now(),
      categorie: 'VU-profielen',
      omschrijving: `VU${vuType} — ${vuLengte}mm`,
      aantal: vuAantal,
      eenheid: 'st',
    });
    DOM.vuAantal().value = '';
    DOM.vuLengte().value = '';
  }

  if (isVrij) {
    state.extra_materialen.push({
      id: Date.now() + 1,
      omschrijving,
      aantal: extraAantal,
      eenheid,
    });
    DOM.extraOmschrijving().value = '';
    DOM.extraAantal().value = '';
    DOM.extraEenheid().value = '';
  }

  opslaan();
  renderTotalen();
}

function verwijderExtra(id) {
  state.extra_materialen = state.extra_materialen.filter(e => e.id !== id);
  opslaan();
  renderTotalen();
}

// ─── UTILITY ─────────────────────────────────────────────────────────────────
/**
 * Groepeert een array op een sleutel geproduceerd door keyFn.
 * @template T
 * @param {T[]} arr
 * @param {(item: T) => string} keyFn
 * @returns {Record<string, T[]>}
 */
function groepeer(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const k = keyFn(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

/**
 * Escapet een string voor veilig gebruik in innerHTML.
 * @param {string} str
 * @returns {string}
 */
function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────
function initEvents() {
  // Type dropdown → direct
  DOM.wandType().addEventListener('change', onTypeChange);
  DOM.wandType().addEventListener('blur', () => {
    valideerVeld(DOM.wandType(), !!DOM.wandType().value, 'Kies een wandtype');
  });

  // Numerieke inputs → debounce
  [DOM.wandLengte, DOM.wandHoogte, DOM.hohAfstand, DOM.gipsBreedte,
   DOM.gipsLengte, DOM.profielULengte, DOM.profielCLengte,
   DOM.isolatieDikte, DOM.gipsTypeLinks1, DOM.gipsTypeLinks2,
   DOM.gipsTypeRechts1, DOM.gipsTypeRechts2,
  ].forEach(getFn => {
    getFn().addEventListener('input', () => {
      if (getFn === DOM.wandHoogte) filterCProfielen();
      // Fout verbergen zodra waarde geldig wordt tijdens typen
      if (getFn === DOM.wandLengte || getFn === DOM.wandHoogte) {
        const v = parseFloat(getFn().value);
        if (v > 0) verbergFout(getFn());
      }
      triggerBerekening();
    });
    getFn().addEventListener('change', triggerBerekening);
  });

  // Blur-validatie voor verplichte numerieke velden
  DOM.wandLengte().addEventListener('blur', () => {
    const v = parseFloat(DOM.wandLengte().value);
    valideerVeld(DOM.wandLengte(), v > 0, 'Voer een geldige wandlengte in (bijv. 5.40)');
  });
  DOM.wandHoogte().addEventListener('blur', () => {
    const v = parseFloat(DOM.wandHoogte().value);
    valideerVeld(DOM.wandHoogte(), v > 0, 'Voer een geldige wandhoogte in (bijv. 2.70)');
  });

  DOM.omschrijving().addEventListener('input', triggerBerekening);
  DOM.btnAdd().addEventListener('click', voegToe);
  DOM.projectNaam().addEventListener('input', e => slaProjectOp(e.target.value));
  DOM.btnAllesReset().addEventListener('click', allesVerwijderen);
  DOM.btnHandmatigAdd().addEventListener('click', voegHandmatigToe);
  document.getElementById('btn-afdrukken').addEventListener('click', () => window.print());

  // Enter in handmatig invoer velden → toevoegen
  [DOM.extraOmschrijving, DOM.extraAantal, DOM.extraEenheid,
   DOM.vuAantal, DOM.vuLengte].forEach(getFn => {
    getFn().addEventListener('keydown', e => { if (e.key === 'Enter') voegHandmatigToe(); });
  });

  // Event delegation voor delete-knoppen in tabellen
  DOM.tbodyAlgemeen().addEventListener('click', e => {
    const btn = e.target.closest('[data-action="verwijder"]');
    if (btn) verwijder(Number(btn.dataset.id));
  });
  document.getElementById('tbody-totalen').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="verwijder-extra"]');
    if (btn) verwijderExtra(Number(btn.dataset.id));
  });
}

// ─── INIT ───────────────────────────────────────────────────────────────────
function init() {
  laadOpgeslagen();
  renderAlles();
  initEvents();
}

document.addEventListener('DOMContentLoaded', init);
