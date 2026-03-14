/**
 * Systeemplafond Rekenmachine
 * Volledig lokaal — geen backend nodig.
 */

'use strict';

// ── Config ──────────────────────────────────────────────────────────────────
const DEBOUNCE_DELAY      = 400;
const STORAGE_KEY         = 'sp_ruimtes';
const STORAGE_KEY_PROJECT = 'sp_project';
const STORAGE_KEY_EXTRA   = 'sp_extra';
const KLEUR_ZWART_HEX     = '#1C2B3A';
const KLEUR_WIT_RAND_HEX  = '#CECCBF';
const KLEUR_WIT_HEX       = '#ffffff';

// ── Materiaalfactoren ──────────────────────────────────────────────────────

const SYSTEMEN = {
  '600x600': {
    label:    '600×600',
    plaatMaat: '600×600 mm',
    factoren: {
      plafondplaat:       2.78,
      hoofdprofiel:       0.2333,
      tussenprofiel_1200: 1.392,
      tussenprofiel_600:  1.392,
      hoeklijn:           1 / 3,
      kantlat:            1 / 3,
    }
  },
  '600x1200': {
    label:    '600×1200',
    plaatMaat: '600×1200 mm',
    factoren: {
      plafondplaat:       1.392,
      hoofdprofiel:       0.2333,
      tussenprofiel_1200: 1.392,
      tussenprofiel_600:  0,
      hoeklijn:           1 / 3,
      kantlat:            1 / 3,
    }
  }
};

// Profielmerken per systeemtype.
// Uitbreiden zodra een tweede merk ondersteund wordt — koppel dan
// aan een keuzelijst in de UI, net als bij plafondplaten.
const PROFIEL_MERKEN = {
  '600x600':  'API',
  '600x1200': 'API',
};

const MATERIAAL_VOLGORDE = [
  'Plafondplaten',
  'Hoofdprofielen',
  'Tussenprofielen 1200',
  'Tussenprofielen 600',
  'Hoeklijn',
  'Kantlat'
];

// ── State ──────────────────────────────────────────────────────────────────

let gekozenSysteem  = null;   // '600x600' | '600x1200'
let extraMaterialen  = [];    // handmatig toegevoegde items
let gekozenKleur    = 'wit';  // 'wit' | 'zwart'
let invoerModus     = 'sqm';  // 'sqm' | 'dimensions'
let ruimtes         = [];
let debounceTimer   = null;


// ── DOM cache ───────────────────────────────────────────────────────────────

const DOM = {
  // Invoer
  ruimteNaam:        () => document.getElementById('ruimte-naam'),
  sqmInput:          () => document.getElementById('vierkante-meters'),
  lengteInput:       () => document.getElementById('lengte'),
  breedteInput:      () => document.getElementById('breedte'),
  omtrekInput:       () => document.getElementById('strekkende-meters'),
  sqmInputGroup:     () => document.getElementById('sqm-input-group'),
  lengteInputGroup:  () => document.getElementById('lengte-input-group'),
  breedteInputGroup: () => document.getElementById('breedte-input-group'),
  berekendeGroup:    () => document.getElementById('berekende-sqm-group'),
  berekendeVal:      () => document.getElementById('berekende-sqm'),
  plaatMerk:         () => document.getElementById('plaat-merk'),
  plaatMerkAnders:   () => document.getElementById('plaat-merk-anders'),
  projectNaam:       () => document.getElementById('project-naam'),
  // Knoppen / status
  btnToevoegen:      () => document.getElementById('btn-toevoegen'),
  btnAllesReset:     () => document.getElementById('btn-alles-reset'),
  btnHandmatigAdd:   () => document.getElementById('btn-handmatig-add'),
  calcStatus:        () => document.getElementById('calc-status'),
  // Resultaten
  resultsSection:    () => document.getElementById('results-section'),
  countRuimtes:      () => document.getElementById('count-ruimtes'),
  ruimtesTbody:      () => document.getElementById('ruimtes-tbody'),
  totalSqm:          () => document.getElementById('total-sqm'),
  totalOmtrek:       () => document.getElementById('total-omtrek'),
  tbodyTotalen:      () => document.getElementById('tbody-totalen'),
  // Handmatig materiaal
  extraOmschrijving: () => document.getElementById('extra-omschrijving'),
  extraAantal:       () => document.getElementById('extra-aantal'),
  extraEenheid:      () => document.getElementById('extra-eenheid'),
};

// ── Berekening ─────────────────────────────────────────────────────────────

/**
 * Berekent alle materialenhoeveelheden voor één ruimte.
 * @param {number} sqm       - Oppervlakte in m²
 * @param {number} omtrek    - Omtrek / randlengte in m
 * @param {'600x600'|'600x1200'} systeemId
 * @returns {{
 *   plafondplaten: number,
 *   hoofdprofielen: number,
 *   tussenprofiel_1200: number,
 *   tussenprofiel_600: number|null,
 *   hoeklijn: number,
 *   kantlat: number
 * }}
 */
function bereken(sqm, omtrek, systeemId) {
  const f = SYSTEMEN[systeemId].factoren;
  return {
    plafondplaten:      Math.ceil(sqm   * f.plafondplaat),
    hoofdprofielen:     Math.ceil(sqm   * f.hoofdprofiel),
    tussenprofiel_1200: Math.ceil(sqm   * f.tussenprofiel_1200),
    tussenprofiel_600:  f.tussenprofiel_600 > 0 ? Math.ceil(sqm * f.tussenprofiel_600) : null,
    hoeklijn:           Math.ceil(omtrek * f.hoeklijn),
    kantlat:            Math.ceil(omtrek * f.kantlat),
  };
}

// ── Invoer lezen ───────────────────────────────────────────────────────────

/** @returns {number} Oppervlakte in m² op basis van actieve invoermodus (0 als leeg/ongeldig) */
function getSqm() {
  if (invoerModus === 'sqm') {
    return parseFloat(DOM.sqmInput().value) || 0;
  }
  const l = parseFloat(DOM.lengteInput().value)  || 0;
  const b = parseFloat(DOM.breedteInput().value) || 0;
  return (l > 0 && b > 0) ? l * b : 0;
}

/** @returns {number} Omtrek in m (0 als leeg/ongeldig) */
function getOmtrek() {
  return parseFloat(DOM.omtrekInput().value) || 0;
}

/** @returns {string} Plaatmerk/-type, of de vrije-tekst waarde als 'anders' geselecteerd is */
function getMerk() {
  const sel = DOM.plaatMerk().value;
  if (sel === 'anders') {
    return DOM.plaatMerkAnders().value.trim();
  }
  return sel;
}

// ── Statusbalk ─────────────────────────────────────────────────────────────

function updateStatus() {
  const knop    = DOM.btnToevoegen();
  const status  = DOM.calcStatus();
  const sqm     = getSqm();
  const omtrek  = getOmtrek();

  function setStatus(tekst, cls) {
    status.textContent = tekst;
    status.className   = cls ? `calc-status ${cls}` : 'calc-status';
  }

  if (!gekozenSysteem) {
    setStatus('Kies een systeemtype', ''); knop.disabled = true; return;
  }
  if (sqm <= 0) {
    setStatus('Voer een geldige oppervlakte in', ''); knop.disabled = true; return;
  }
  if (omtrek <= 0) {
    setStatus('Voer een geldige omtrek in', ''); knop.disabled = true; return;
  }

  setStatus('Klaar om toe te voegen', 'ready');
  knop.disabled = false;
}

function debounceUpdate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateStatus, DEBOUNCE_DELAY);
}

// ── Inline veldvalidatie ─────────────────────────────────────────────────────

/**
 * Markeert een inputveld als ongeldig en toont een foutmelding eronder.
 * @param {HTMLInputElement} el
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

/** @param {HTMLInputElement} el */
function verbergFout(el) {
  el.classList.remove('invalid');
  el.removeAttribute('aria-describedby');
  el.removeAttribute('aria-invalid');
  const fout = el.parentElement.querySelector('.field-error-msg');
  if (fout) fout.remove();
}

/**
 * Toont of verbergt een inline foutmelding afhankelijk van de conditie.
 * @param {HTMLInputElement} el
 * @param {boolean} conditie - `true` = geldig (geen fout)
 * @param {string} msg
 */
function valideerVeld(el, conditie, msg) {
  if (!conditie) toonFout(el, msg);
  else verbergFout(el);
}

// ── Helpers weergave ───────────────────────────────────────────────────────

/**
 * Genereert een inline HTML kleurblokje met label.
 * @param {'wit'|'zwart'} kleur
 * @returns {string} HTML string
 */
function kleurSwatch(kleur) {
  const bg   = kleur === 'zwart' ? KLEUR_ZWART_HEX : KLEUR_WIT_HEX;
  const rand = kleur === 'zwart' ? KLEUR_ZWART_HEX : KLEUR_WIT_RAND_HEX;
  const cap  = kleur.charAt(0).toUpperCase() + kleur.slice(1);
  return `<span style="display:inline-block;width:11px;height:11px;border-radius:2px;background:${bg};border:1.5px solid ${rand};vertical-align:middle;margin-right:5px;"></span>${cap}`;
}

function fmtSqm(n) {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Tabel renderen ─────────────────────────────────────────────────────────

function renderTabel() {
  const resultsEl = DOM.resultsSection();
  const countEl   = DOM.countRuimtes();
  const tbody     = DOM.ruimtesTbody();
  const totSqmEl  = DOM.totalSqm();
  const totOmEl   = DOM.totalOmtrek();
  const totaalEl  = DOM.tbodyTotalen();

  resultsEl.style.display = ruimtes.length > 0 ? 'flex' : 'none';
  countEl.textContent = `${ruimtes.length} ruimte${ruimtes.length !== 1 ? 's' : ''}`;

  if (ruimtes.length === 0) {
    tbody.innerHTML    = '<tr class="empty-row"><td colspan="13">Nog geen ruimtes toegevoegd</td></tr>';
    totSqmEl.textContent  = '0';
    totOmEl.textContent   = '0';
    totaalEl.innerHTML = '<tr class="empty-row"><td colspan="6">Nog geen ruimtes toegevoegd</td></tr>';
    return;
  }

  // Ruimterijen
  tbody.innerHTML = ruimtes.map(r => {
    const res = r.resultaten;
    return `<tr>
      <td>${esc(r.naam)}</td>
      <td>${SYSTEMEN[r.systeem].label}</td>
      <td style="max-width:110px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(r.merk)}">${esc(r.merk || '—')}</td>
      <td>${kleurSwatch(r.kleur)}</td>
      <td class="num">${fmtSqm(r.sqm)}</td>
      <td class="num">${r.omtrek}</td>
      <td class="num">${res.plafondplaten}</td>
      <td class="num">${res.hoofdprofielen}</td>
      <td class="num">${res.tussenprofiel_1200}</td>
      <td class="num">${res.tussenprofiel_600 !== null ? res.tussenprofiel_600 : '—'}</td>
      <td class="num">${res.hoeklijn}</td>
      <td class="num">${res.kantlat}</td>
      <td><button class="btn-delete-room" data-id="${r.id}" title="Verwijder" aria-label="Ruimte '${esc(r.naam)}' verwijderen">✕</button></td>
    </tr>`;
  }).join('');


  // Totaalrij
  const totSqm    = ruimtes.reduce((s, r) => s + r.sqm,    0);
  const totOmtrek = ruimtes.reduce((s, r) => s + r.omtrek, 0);
  totSqmEl.textContent = fmtSqm(totSqm);
  totOmEl.textContent  = totOmtrek;

  renderTotaalTabel();
}

// ── Totaaloverzicht ────────────────────────────────────────────────────────

function renderTotaalTabel() {
  const totaalEl = DOM.tbodyTotalen();

  // Bouw map op: key → {materiaal, merk, maat, kleur, aantal}
  const map = {};

  function add(materiaal, subkey, merk, maat, kleur, n) {
    const key = materiaal + '||' + subkey;
    if (!map[key]) {
      map[key] = { materiaal: materiaal, merk: merk, maat: maat, kleur: kleur, aantal: 0 };
    }
    map[key].aantal += n;
  }

  for (const r of ruimtes) {
    const res = r.resultaten;
    const sys = SYSTEMEN[r.systeem];

    add('Plafondplaten',      r.merk + '|' + sys.plaatMaat, r.merk, sys.plaatMaat, null, res.plafondplaten);
    const profielMerk = PROFIEL_MERKEN[r.systeem] || '';
    add('Hoofdprofielen',       r.kleur, profielMerk, '3600 mm', r.kleur, res.hoofdprofielen);
    add('Tussenprofielen 1200', r.kleur, profielMerk, '1200 mm', r.kleur, res.tussenprofiel_1200);
    if (res.tussenprofiel_600 !== null) {
      add('Tussenprofielen 600', r.kleur, profielMerk, '600 mm', r.kleur, res.tussenprofiel_600);
    }
    add('Hoeklijn',  r.kleur, profielMerk, '3000 mm', r.kleur, res.hoeklijn);
    add('Kantlat',   'kantlat', '', '3000 mm', null, res.kantlat);
  }

  // Sorteer op vaste volgorde
  const keys = Object.keys(map);
  keys.sort((a, b) => {
    const ia = MATERIAAL_VOLGORDE.indexOf(map[a].materiaal);
    const ib = MATERIAAL_VOLGORDE.indexOf(map[b].materiaal);
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
  });

  let html = '';
  let huidigMateriaal = null;

  for (const key of keys) {
    const item = map[key];

    if (item.materiaal !== huidigMateriaal) {
      huidigMateriaal = item.materiaal;
      html += `<tr class="totaal-categorie-header"><td colspan="6">${esc(item.materiaal)}</td></tr>`;
    }

    const kleurCel = item.kleur
      ? kleurSwatch(item.kleur)
      : '<span style="color:var(--ink-3)">\u2014</span>';

    const merkCel = item.merk
      ? esc(item.merk)
      : '<span style="color:var(--ink-3)">\u2014</span>';

    html += `<tr>
      <td>${esc(item.materiaal)}</td>
      <td>${merkCel}</td>
      <td class="num">${esc(item.maat)}</td>
      <td>${kleurCel}</td>
      <td class="num">${item.aantal}</td>
      <td>st</td>
    </tr>`;
  }

  // ── Handmatig toegevoegde materialen ─────────────────────────────────────
  if (extraMaterialen.length > 0) {
    html += '<tr class="totaal-categorie-header totaal-header-extra"><td colspan="6">Handmatig toegevoegd</td></tr>';
    for (const em of extraMaterialen) {
      html += `<tr class="extra-rij">
        <td colspan="4">${esc(em.omschrijving)}</td>
        <td class="num">${em.aantal}</td>
        <td>${esc(em.eenheid)} <button class="btn-delete-room" data-action="verwijder-extra" data-id="${em.id}" style="margin-left:4px;" title="Verwijder" aria-label="'${esc(em.omschrijving)}' verwijderen">✕</button></td>
      </tr>`;
    }
  }

  totaalEl.innerHTML = html || '<tr class="empty-row"><td colspan="6">—</td></tr>';
}

// ── Toevoegen / verwijderen ────────────────────────────────────────────────

function voegToe() {
  const sqm    = getSqm();
  const omtrek = getOmtrek();
  const merk   = getMerk();

  if (!gekozenSysteem || sqm <= 0 || omtrek <= 0) return;

  const naamInput = DOM.ruimteNaam();
  const naam = naamInput.value.trim() || `Ruimte ${ruimtes.length + 1}`;

  ruimtes.push({
    id:         Date.now(),
    naam:       naam,
    sqm:        sqm,
    omtrek:     omtrek,
    systeem:    gekozenSysteem,
    kleur:      gekozenKleur,
    merk:       merk,
    resultaten: bereken(sqm, omtrek, gekozenSysteem)
  });

  slaOp();
  renderTabel();
  resetInvoer();
}

/** @param {number} id - timestamp-id van de te verwijderen ruimte */
function verwijderRuimte(id) {
  ruimtes = ruimtes.filter(r => r.id !== id);
  slaOp();
  renderTabel();
}

function resetInvoer() {
  const volgend = ruimtes.length + 1;
  DOM.ruimteNaam().value         = `Ruimte ${volgend}`;
  DOM.sqmInput().value    = '';
  DOM.lengteInput().value              = '';
  DOM.breedteInput().value             = '';
  DOM.omtrekInput().value   = '';
  DOM.berekendeVal().textContent = '\u2014';
  DOM.btnToevoegen().disabled    = true;
  DOM.calcStatus().textContent   = '';
  DOM.calcStatus().className     = 'calc-status';
  DOM.sqmInput().focus();
}

// ── Invoermodus ────────────────────────────────────────────────────────────

/**
 * Schakelt tussen m²-invoer en L×B-invoer en past de UI aan.
 * @param {'sqm'|'dimensions'} modus
 */
function setInvoerModus(modus) {
  invoerModus = modus;
  const isDim = modus === 'dimensions';
  DOM.sqmInputGroup().style.display       = isDim ? 'none' : '';
  DOM.lengteInputGroup().style.display    = isDim ? '' : 'none';
  DOM.breedteInputGroup().style.display   = isDim ? '' : 'none';
  DOM.berekendeGroup().style.display   = isDim ? '' : 'none';
  updateStatus();
}

// ── Persistentie ───────────────────────────────────────────────────────────

function slaOp() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ruimtes));
    localStorage.setItem(STORAGE_KEY_PROJECT, DOM.projectNaam().value);
    localStorage.setItem(STORAGE_KEY_EXTRA, JSON.stringify(extraMaterialen));
  } catch(e) {}
}

function laadOp() {
  try {
    const opgeslagenRuimtes  = localStorage.getItem(STORAGE_KEY);
    const opgeslagenProject  = localStorage.getItem(STORAGE_KEY_PROJECT);
    const opgeslagenExtra    = localStorage.getItem(STORAGE_KEY_EXTRA);
    if (opgeslagenRuimtes) ruimtes = JSON.parse(opgeslagenRuimtes);
    if (opgeslagenProject) DOM.projectNaam().value = opgeslagenProject;
    if (opgeslagenExtra)   extraMaterialen = JSON.parse(opgeslagenExtra);
  } catch(e) {}
}

function resetAlles() {
  if ((ruimtes.length > 0 || extraMaterialen.length > 0) &&
      !confirm('Alle ruimtes, handmatige items en projectnaam verwijderen?')) return;
  ruimtes = [];
  extraMaterialen = [];
  DOM.projectNaam().value = '';
  try { localStorage.removeItem(STORAGE_KEY);         } catch(e) {}
  try { localStorage.removeItem(STORAGE_KEY_PROJECT); } catch(e) {}
  try { localStorage.removeItem(STORAGE_KEY_EXTRA);   } catch(e) {}
  renderTabel();
  resetInvoer();
}

// ── Handmatig materiaal toevoegen ────────────────────────────────────────────

function voegHandmatigToe() {
  const omschrijving = DOM.extraOmschrijving().value.trim();
  const aantalRaw    = DOM.extraAantal().value;
  const eenheid      = DOM.extraEenheid().value.trim() || 'st';
  const aantal       = parseFloat(aantalRaw);

  if (!omschrijving || isNaN(aantal) || aantal <= 0) {
    DOM.extraOmschrijving().focus();
    return;
  }

  extraMaterialen.push({
    id:           Date.now(),
    omschrijving: omschrijving,
    aantal:       aantal,
    eenheid:      eenheid,
  });

  DOM.extraOmschrijving().value = '';
  DOM.extraAantal().value       = '';
  DOM.extraEenheid().value      = '';

  slaOp();
  renderTotaalTabel();
}

function verwijderExtra(id) {
  extraMaterialen = extraMaterialen.filter(e => e.id !== id);
  slaOp();
  renderTotaalTabel();
}

// ── Init ───────────────────────────────────────────────────────────────────

window.addEventListener('load', () => {

  laadOp();
  renderTabel();

  // Systeemknoppen
  const systeemBtns = document.querySelectorAll('[data-system]');
  systeemBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      gekozenSysteem = btn.dataset.system;
      systeemBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      updateStatus();
    });
  });

  // Kleurknoppen
  const kleurBtns = document.querySelectorAll('[data-kleur]');
  kleurBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      gekozenKleur = btn.dataset.kleur;
      kleurBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      updateStatus();
    });
  });

  // Plaatmerk select
  DOM.plaatMerk().addEventListener('change', e => {
    const isAnders = e.target.value === 'anders';
    DOM.plaatMerkAnders().style.display = isAnders ? '' : 'none';
    if (isAnders) {
      DOM.plaatMerkAnders().focus();
    }
    updateStatus();
  });

  DOM.plaatMerkAnders().addEventListener('input', debounceUpdate);

  // Invoermodus radio
  const modeRadios = document.querySelectorAll('input[name="input-mode"]');
  modeRadios.forEach(radio => {
    radio.addEventListener('change', e => setInvoerModus(e.target.value));
  });

  // Numerieke inputs
  const elSqm    = DOM.sqmInput();
  const elLengte = DOM.lengteInput();
  const elBreedte= DOM.breedteInput();
  const elOmtrek = DOM.omtrekInput();
  const numInputs = [elSqm, elLengte, elBreedte, elOmtrek];
  numInputs.forEach(el => {
    el.addEventListener('input', e => {
      if (invoerModus === 'dimensions') {
        const l = parseFloat(DOM.lengteInput().value)  || 0;
        const b = parseFloat(DOM.breedteInput().value) || 0;
        DOM.berekendeVal().textContent =
          (l > 0 && b > 0) ? (l * b).toFixed(2) + ' m\u00b2' : '\u2014';
        // Auto-omtrek: 2×(L+B)
        if (l > 0 && b > 0) {
          const omtrek = 2 * (l + b);
          DOM.omtrekInput().value = omtrek % 1 === 0 ? String(omtrek) : omtrek.toFixed(2);
          verbergFout(DOM.omtrekInput());
        }
      }
      // Fout verbergen zodra waarde geldig wordt tijdens typen
      if (parseFloat(e.target.value) > 0) verbergFout(e.target);
      debounceUpdate();
    });
  });

  // Blur-validatie voor verplichte numerieke velden
  elSqm.addEventListener('blur', () => {
    if (invoerModus !== 'sqm') return;
    valideerVeld(elSqm, parseFloat(elSqm.value) > 0, 'Voer een geldige oppervlakte in (bijv. 20)');
  });
  elLengte.addEventListener('blur', () => {
    if (invoerModus !== 'dimensions') return;
    valideerVeld(elLengte, parseFloat(elLengte.value) > 0, 'Voer een geldige lengte in (bijv. 5)');
  });
  elBreedte.addEventListener('blur', () => {
    if (invoerModus !== 'dimensions') return;
    valideerVeld(elBreedte, parseFloat(elBreedte.value) > 0, 'Voer een geldige breedte in (bijv. 4)');
  });
  elOmtrek.addEventListener('blur', () => {
    valideerVeld(elOmtrek, parseFloat(elOmtrek.value) > 0, 'Voer een geldige omtrek in (bijv. 18)');
  });

  // Event delegation voor verwijder-knoppen in ruimteoverzicht
  DOM.ruimtesTbody().addEventListener('click', e => {
    const btn = e.target.closest('.btn-delete-room');
    if (btn) verwijderRuimte(Number(btn.dataset.id));
  });

  // Event delegation voor delete-knop handmatig materiaal
  DOM.tbodyTotalen().addEventListener('click', e => {
    const btn = e.target.closest('[data-action="verwijder-extra"]');
    if (btn) verwijderExtra(Number(btn.dataset.id));
  });

  // Handmatig toevoegen
  DOM.btnHandmatigAdd().addEventListener('click', voegHandmatigToe);

  // Enter in handmatig velden
  const handmatigInputs = [
    DOM.extraOmschrijving(),
    DOM.extraAantal(),
    DOM.extraEenheid()
  ];
  handmatigInputs.forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') voegHandmatigToe(); });
  });

  // Toevoegen
  DOM.btnToevoegen().addEventListener('click', voegToe);

  // Reset alles
  DOM.btnAllesReset().addEventListener('click', resetAlles);

  // Projectnaam opslaan
  DOM.projectNaam().addEventListener('input', slaOp);

  // Afdrukken
  document.getElementById('btn-afdrukken').addEventListener('click', () => window.print());

  // Initiële statusmelding
  DOM.calcStatus().textContent = 'Kies een systeemtype om te beginnen';

});
