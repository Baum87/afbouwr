'use strict';

// ─── CONSTANTEN ──────────────────────────────────────────────────────────────

const STORAGE_KEY     = 'afbouwr_msplafond_v3';
const RANDPROFIEL_LEN = 3000;  // mm
const PROFIEL_LEN     = 3600;  // mm
const ISOLATIE_OPP    = (1350 / 1000) * (600 / 1000); // 0.81 m²

// ─── STAAT ───────────────────────────────────────────────────────────────────

let ruimtes         = [];
let extraMaterialen = [];
let gekozenSysteem  = 'enkel';  // 'enkel' | 'dubbel'
let gekozenLagen    = 1;        // 1 | 2
let gekozenIsolatie = false;

// ─── DOM ─────────────────────────────────────────────────────────────────────

const DOM = {
  projectNaam:         () => document.getElementById('project-naam'),
  ruimteNaam:          () => document.getElementById('ruimte-naam'),
  ruimteLengte:        () => document.getElementById('ruimte-lengte'),
  ruimteBreedte:       () => document.getElementById('ruimte-breedte'),
  gipsType1:           () => document.getElementById('gips-type-1'),
  gipsType2:           () => document.getElementById('gips-type-2'),
  gipsType2Groep:      () => document.getElementById('gips-type-2-groep'),
  gipsLengte:          () => document.getElementById('gips-lengte'),
  gipsBreedte:         () => document.getElementById('gips-breedte'),
  hohPD:               () => document.getElementById('hoh-pd'),
  hohBasis:            () => document.getElementById('hoh-basis'),
  hohBasisGroep:       () => document.getElementById('hoh-basis-groep'),
  hohAfhangers:        () => document.getElementById('hoh-afhangers'),
  isolatieDikte:       () => document.getElementById('isolatie-dikte'),
  isolatieDikteGroep:  () => document.getElementById('isolatie-dikte-groep'),
  btnToevoegen:        () => document.getElementById('btn-toevoegen'),
  calcStatus:          () => document.getElementById('calc-status'),
  resultsSection:      () => document.getElementById('results-section'),
  countRuimtes:        () => document.getElementById('count-ruimtes'),
  ruimtesTbody:        () => document.getElementById('ruimtes-tbody'),
  totalSqm:            () => document.getElementById('total-sqm'),
  tbodyTotalen:        () => document.getElementById('tbody-totalen'),
  extraOmschrijving:   () => document.getElementById('extra-omschrijving'),
  extraAantal:         () => document.getElementById('extra-aantal'),
  extraEenheid:        () => document.getElementById('extra-eenheid'),
  btnAllesReset:       () => document.getElementById('btn-alles-reset'),
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ceil(n) { return Math.ceil(n); }

function getLengte()       { return parseFloat(DOM.ruimteLengte().value)  || 0; }
function getBreedte()      { return parseFloat(DOM.ruimteBreedte().value) || 0; }
function getHohPD()        { return parseInt(DOM.hohPD().value)           || 400; }
function getHohBasis()     { return parseInt(DOM.hohBasis().value)        || 600; }
function getHohAfhangers() { return parseInt(DOM.hohAfhangers().value)    || 1000; }
function getGipsLengte()   { return parseInt(DOM.gipsLengte().value)      || 2600; }
function getGipsBreedte()  { return parseInt(DOM.gipsBreedte().value)     || 1200; }
function getIsolatieDikte(){ return parseInt(DOM.isolatieDikte().value)   || 45; }

/**
 * Geeft de werkelijke plaatmaten terug; types met vasteMaten overschrijven de dropdowns.
 */
function resolveGipsMaten(gipsType, gipsLengte, gipsBreedte) {
  const g = (PRODUCTEN.gipstypen || []).find(t => t.waarde === gipsType);
  if (g?.vasteMaten) return { lengte: g.vasteMaten.lengte, breedte: g.vasteMaten.breedte };
  return { lengte: gipsLengte, breedte: gipsBreedte };
}

// ─── BEREKENING ──────────────────────────────────────────────────────────────

/**
 * Berekent alle materialenhoeveelheden voor één ruimte.
 *
 * @param {{
 *   lengte: number,         meter
 *   breedte: number,        meter
 *   systeem: string,        'enkel' | 'dubbel'
 *   lagen: number,          1 | 2
 *   gipsType1: string,
 *   gipsType2: string,
 *   gipsLengte: number,     mm
 *   gipsBreedte: number,    mm
 *   hohPD: number,          mm — hoh plaatdragende profielen (beide systemen)
 *   hohBasis: number,       mm — hoh basisprofielen (alleen dubbel)
 *   hohAfhangers: number,   mm — hoh afhangers
 *   isolatie: boolean,
 *   isolatieDikte: number   mm
 * }} inp
 */
function bereken(inp) {
  const {
    lengte, breedte, systeem, lagen,
    gipsType1, gipsType2, gipsLengte, gipsBreedte,
    hohPD, hohBasis, hohAfhangers,
    isolatie, isolatieDikte,
  } = inp;

  const sqm    = lengte * breedte;
  const omtrek = (lengte + breedte) * 2;
  const L      = lengte  * 1000; // mm
  const B      = breedte * 1000; // mm

  // ── Randprofiel U27 (3000 mm) ────────────────────────────────────────────
  const randprofiel_st = ceil(omtrek * 1000 / RANDPROFIEL_LEN);

  // ── Gipskarton ────────────────────────────────────────────────────────────
  const maten1    = resolveGipsMaten(gipsType1, gipsLengte, gipsBreedte);
  const plaatOpp1 = (maten1.breedte / 1000) * (maten1.lengte / 1000);
  const platen1   = ceil(sqm * 1.1 / plaatOpp1);

  let platen2 = 0;
  let maten2  = maten1;
  if (lagen === 2) {
    maten2 = resolveGipsMaten(gipsType2 || gipsType1, gipsLengte, gipsBreedte);
    const plaatOpp2 = (maten2.breedte / 1000) * (maten2.lengte / 1000);
    platen2 = ceil(sqm * 1.1 / plaatOpp2);
  }

  // ── Schroeven ─────────────────────────────────────────────────────────────
  // Gipskarton wordt altijd op de plaatdragende profielen geschroefd → hohPD bepaalt de breedte.
  // Laag 1: hoh 750 mm in lengterichting gipsplaat
  const rijen_l1   = ceil(maten1.lengte / 750);
  const rijen_b1   = ceil(maten1.breedte / hohPD);
  const schroeven1 = rijen_l1 * rijen_b1 * platen1;

  // Laag 2: hoh 250 mm in lengterichting
  let schroeven2 = 0;
  if (lagen === 2) {
    const rijen_l2 = ceil(maten2.lengte / 250);
    const rijen_b2 = ceil(maten2.breedte / hohPD);
    schroeven2 = rijen_l2 * rijen_b2 * platen2;
  }

  // ── Profielen & bevestiging ───────────────────────────────────────────────
  let cdPlaatdragend  = 0;
  let cdBasisprofiel  = 0;
  let afhangers       = 0;
  let kruisverbinders = 0;
  let verbindingstukken = 0;

  if (systeem === 'enkel') {
    // Plaatdragende profielen: lopen over breedte (B), gepositioneerd langs lengte (L)
    const aantalRijen  = ceil(L / hohPD) + 1;
    const stavenPerRij = ceil(B / PROFIEL_LEN);
    cdPlaatdragend     = aantalRijen * stavenPerRij;

    // Verbindingstukken (breedte > 3600 mm)
    if (B > PROFIEL_LEN) {
      verbindingstukken = (ceil(B / PROFIEL_LEN) - 1) * aantalRijen;
    }

    // Afhangers langs elk plaatdragend profiel (langs breedte)
    const afhangerPerRij = ceil(B / hohAfhangers) + 1;
    afhangers = aantalRijen * afhangerPerRij;

  } else {
    // DUBBEL SYSTEEM
    //
    // Basisprofielen: lopen over breedte (B), gepositioneerd langs lengte (L)
    // Eerste basisprofiel op 300 mm van de kant, daarna hoh = hohBasis.
    const aantalBasis = Math.max(1, Math.floor((L - 300) / hohBasis) + 1);
    const stavenBasis = ceil(B / PROFIEL_LEN);
    cdBasisprofiel    = aantalBasis * stavenBasis;

    // Verbindingstukken basisprofielen (breedte > 3600 mm)
    if (B > PROFIEL_LEN) {
      verbindingstukken += (ceil(B / PROFIEL_LEN) - 1) * aantalBasis;
    }

    // Plaatdragende profielen: lopen over lengte (L), gepositioneerd langs breedte (B)
    const aantalPD = ceil(B / hohPD) + 1;
    const stavenPD = ceil(L / PROFIEL_LEN);
    cdPlaatdragend = aantalPD * stavenPD;

    // Verbindingstukken plaatdragende profielen (lengte > 3600 mm)
    if (L > PROFIEL_LEN) {
      verbindingstukken += (ceil(L / PROFIEL_LEN) - 1) * aantalPD;
    }

    // Afhangers langs elk basisprofiel (langs breedte)
    const afhangerPerBasis = ceil(B / hohAfhangers) + 1;
    afhangers = aantalBasis * afhangerPerBasis;

    // Kruisverbinders: formule per specificatie
    const k = (L - 300) / hohBasis * (B - hohPD) / hohPD;
    kruisverbinders = Math.max(0, ceil(k));
  }

  // ── Isolatie ─────────────────────────────────────────────────────────────
  const iso_aantal = isolatie ? ceil(sqm / ISOLATIE_OPP) : 0;

  return {
    sqm:               +sqm.toFixed(2),
    omtrek:            +omtrek.toFixed(2),
    randprofiel_st,
    cdPlaatdragend,
    cdBasisprofiel,
    afhangers,
    kruisverbinders,
    verbindingstukken,
    platen1,
    platen2,
    maten1,
    maten2,
    schroeven1,
    schroeven2,
    iso_aantal,
    isolatieDikte,
  };
}

// ─── OPSLAAN / LADEN ─────────────────────────────────────────────────────────

function slaOp() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      projectNaam: DOM.projectNaam().value,
      ruimtes,
      extraMaterialen,
    }));
  } catch (_) {}
}

function laadOp() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!data) return;
    if (data.projectNaam)                    DOM.projectNaam().value = data.projectNaam;
    if (Array.isArray(data.ruimtes))         ruimtes         = data.ruimtes;
    if (Array.isArray(data.extraMaterialen)) extraMaterialen = data.extraMaterialen;
  } catch (_) {}
}

// ─── RENDER ──────────────────────────────────────────────────────────────────

function renderTabel() {
  const resultsEl = DOM.resultsSection();
  const countEl   = DOM.countRuimtes();
  const tbody     = DOM.ruimtesTbody();
  const totSqmEl  = DOM.totalSqm();

  resultsEl.style.display = ruimtes.length > 0 ? 'flex' : 'none';
  countEl.textContent = `${ruimtes.length} ruimte${ruimtes.length !== 1 ? 's' : ''}`;

  if (ruimtes.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Nog geen ruimtes toegevoegd</td></tr>';
    totSqmEl.textContent = '0';
    DOM.tbodyTotalen().innerHTML = '';
    return;
  }

  let totSqm = 0;
  let rows = '';
  for (const r of ruimtes) {
    totSqm += r.resultaten.sqm;
    const systeemLabel = r.systeem === 'enkel' ? 'Enkel' : 'Dubbel';
    // Formatteer L en B met max 2 decimalen, trailing zeros verwijderd
    const lStr = parseFloat(r.lengte.toFixed(2));
    const bStr = parseFloat(r.breedte.toFixed(2));
    rows += `<tr>
      <td>${esc(r.naam)}</td>
      <td class="num">${lStr} × ${bStr}</td>
      <td>${systeemLabel}</td>
      <td class="num">${r.lagen}</td>
      <td class="num">${r.resultaten.sqm}</td>
      <td><button class="btn-delete-room" data-action="verwijder" data-id="${r.id}" aria-label="${esc(r.naam)} verwijderen">✕</button></td>
    </tr>`;
  }
  tbody.innerHTML = rows;
  totSqmEl.textContent = totSqm.toFixed(2);

  renderTotaalTabel();
}

function renderTotaalTabel() {
  const totaalEl = DOM.tbodyTotalen();

  let randprofiel_st    = 0;
  let cdPlaatdragend    = 0;
  let cdBasisprofiel    = 0;
  let afhangers         = 0;
  let kruisverbinders   = 0;
  let verbindingstukken = 0;
  let schroeven1        = 0;
  let schroeven2        = 0;
  let iso_aantal        = 0;

  // Gipskarton gegroepeerd per type + maat
  const gipsMap = new Map(); // key → { label, maten, platen }

  let heeftDubbel  = false;
  let heeftIsolatie = false;
  const isolatieDiktes = new Set();

  for (const r of ruimtes) {
    const res = r.resultaten;
    randprofiel_st    += res.randprofiel_st;
    cdPlaatdragend    += res.cdPlaatdragend;
    cdBasisprofiel    += res.cdBasisprofiel;
    afhangers         += res.afhangers;
    kruisverbinders   += res.kruisverbinders;
    verbindingstukken += res.verbindingstukken;
    schroeven1        += res.schroeven1;
    schroeven2        += res.schroeven2;

    if (r.systeem === 'dubbel') heeftDubbel = true;

    // Laag 1
    const key1 = `${r.gipsType1}|${res.maten1.lengte}|${res.maten1.breedte}`;
    if (!gipsMap.has(key1)) gipsMap.set(key1, { label: r.gipsLabel1, maten: res.maten1, platen: 0 });
    gipsMap.get(key1).platen += res.platen1;

    // Laag 2
    if (r.lagen === 2) {
      const key2 = `${r.gipsType2}|${res.maten2.lengte}|${res.maten2.breedte}`;
      if (!gipsMap.has(key2)) gipsMap.set(key2, { label: r.gipsLabel2, maten: res.maten2, platen: 0 });
      gipsMap.get(key2).platen += res.platen2;
    }

    if (res.iso_aantal > 0) {
      heeftIsolatie = true;
      iso_aantal += res.iso_aantal;
      isolatieDiktes.add(res.isolatieDikte);
    }
  }

  let html = '';

  // Randprofiel
  html += groepHeader('Randprofiel');
  html += rij('Randprofiel U27', '3000 mm', randprofiel_st, 'st');

  // Profielen
  html += groepHeader('Profielen');
  if (cdBasisprofiel > 0) {
    html += rij('C60-profiel — basisprofiel', '3600 mm', cdBasisprofiel, 'st');
  }
  html += rij('C60-profiel — plaatdragend', '3600 mm', cdPlaatdragend, 'st');

  // Verbindingstukken
  if (verbindingstukken > 0) {
    html += groepHeader('Verbindingstukken');
    html += rij('Verbindingstuk C60-profiel', '—', verbindingstukken, 'st');
  }

  // Bevestiging
  html += groepHeader('Bevestiging');
  const afhangerLabel = heeftDubbel ? 'Draadhanger / afhanger (op basisprofiel)' : 'Draadhanger / afhanger';
  html += rij(afhangerLabel, '—', afhangers, 'st');
  if (kruisverbinders > 0) {
    html += rij('Kruisverbinder', '—', kruisverbinders, 'st');
  }

  // Gipskarton
  html += groepHeader('Gipskarton');
  for (const [, { label, maten, platen }] of gipsMap) {
    const maatStr = `${maten.lengte}×${maten.breedte} mm`;
    html += rij(`Gipskartonplaat — ${esc(label)}`, maatStr, platen, 'st');
  }

  // Isolatie
  if (heeftIsolatie) {
    html += groepHeader('Isolatie');
    const dikteStr = [...isolatieDiktes].sort((a, b) => a - b).join(' / ') + ' mm';
    html += rij(`Isolatie — ${dikteStr}`, '1350×600 mm', iso_aantal, 'st');
  }

  // Schroeven — zelfde naamgeving als wand calculator
  html += groepHeader('Schroeven');
  if (schroeven1 > 0) html += rij('Schroef 25mm', '1e laag — hoh 750 mm', schroeven1, 'st');
  if (schroeven2 > 0) html += rij('Schroef 35mm', '2e laag — hoh 250 mm', schroeven2, 'st');

  // Handmatig toegevoegd
  if (extraMaterialen.length > 0) {
    html += `<tr class="totaal-categorie-header totaal-header-extra"><td colspan="4">Handmatig toegevoegd</td></tr>`;
    for (const em of extraMaterialen) {
      html += `<tr class="extra-rij">
        <td colspan="2">${esc(em.omschrijving)}</td>
        <td class="num">${em.aantal}</td>
        <td>${esc(em.eenheid)} <button class="btn-delete-room" data-action="verwijder-extra" data-id="${em.id}" style="margin-left:4px;" title="Verwijder" aria-label="'${esc(em.omschrijving)}' verwijderen">✕</button></td>
      </tr>`;
    }
  }

  totaalEl.innerHTML = html || '<tr class="empty-row"><td colspan="4">—</td></tr>';
  renderHandmatigLijst();
}

function groepHeader(label) {
  return `<tr class="totaal-categorie-header"><td colspan="4">${esc(label)}</td></tr>`;
}

function rij(naam, maat, aantal, eenheid) {
  return `<tr>
    <td>${esc(naam)}</td>
    <td class="num" style="color:var(--ink-2);font-size:12px;">${esc(maat)}</td>
    <td class="num">${aantal}</td>
    <td>${esc(eenheid)}</td>
  </tr>`;
}

function renderHandmatigLijst() {
  const lijstEl = document.getElementById('handmatig-lijst');
  if (!lijstEl) return;
  lijstEl.innerHTML = extraMaterialen.map(e =>
    `<div class="handmatig-item">
      <span class="handmatig-item-naam">${esc(e.omschrijving)}</span>
      <span class="handmatig-item-detail">${e.aantal}\u00a0${esc(e.eenheid)}</span>
      <button class="handmatig-item-delete" data-action="verwijder-extra" data-id="${e.id}" aria-label="${esc(e.omschrijving)} verwijderen">✕</button>
    </div>`
  ).join('');
}

// ─── TOEVOEGEN / VERWIJDEREN ─────────────────────────────────────────────────

function voegToe() {
  const lengte  = getLengte();
  const breedte = getBreedte();
  if (lengte <= 0 || breedte <= 0) return;

  const naam = DOM.ruimteNaam().value.trim() || `Ruimte ${ruimtes.length + 1}`;

  const gipsEl1    = DOM.gipsType1();
  const gipsType1  = gipsEl1.value;
  const gipsLabel1 = gipsEl1.options[gipsEl1.selectedIndex]?.text || gipsType1;

  let gipsType2  = gipsType1;
  let gipsLabel2 = gipsLabel1;
  if (gekozenLagen === 2) {
    const gipsEl2 = DOM.gipsType2();
    gipsType2  = gipsEl2.value;
    gipsLabel2 = gipsEl2.options[gipsEl2.selectedIndex]?.text || gipsType2;
  }

  const inp = {
    lengte,
    breedte,
    systeem:      gekozenSysteem,
    lagen:        gekozenLagen,
    gipsType1,
    gipsType2,
    gipsLengte:   getGipsLengte(),
    gipsBreedte:  getGipsBreedte(),
    hohPD:        getHohPD(),
    hohBasis:     getHohBasis(),
    hohAfhangers: getHohAfhangers(),
    isolatie:     gekozenIsolatie,
    isolatieDikte: getIsolatieDikte(),
  };

  ruimtes.push({
    id:        Date.now(),
    naam,
    lengte,
    breedte,
    systeem:   gekozenSysteem,
    lagen:     gekozenLagen,
    gipsType1,
    gipsType2,
    gipsLabel1,
    gipsLabel2,
    resultaten: bereken(inp),
  });

  slaOp();
  renderTabel();
  resetInvoer();
}

function verwijderRuimte(id) {
  ruimtes = ruimtes.filter(r => r.id !== id);
  slaOp();
  renderTabel();
}

function voegHandmatigToe() {
  const omschr  = DOM.extraOmschrijving().value.trim();
  const aantal  = parseFloat(DOM.extraAantal().value);
  const eenheid = DOM.extraEenheid().value.trim();

  if (!omschr || !aantal || aantal <= 0) return;

  extraMaterialen.push({ id: Date.now(), omschrijving: omschr, aantal, eenheid: eenheid || 'st' });
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

// ─── STATUS / VALIDATIE ───────────────────────────────────────────────────────

function updateStatus() {
  const lengte  = getLengte();
  const breedte = getBreedte();
  const btn     = DOM.btnToevoegen();
  const status  = DOM.calcStatus();

  if (lengte > 0 && breedte > 0) {
    const sqm        = (lengte * breedte).toFixed(2);
    const systeemStr = gekozenSysteem === 'enkel' ? 'Enkel' : 'Dubbel';
    status.textContent = `${sqm} m² — ${systeemStr} systeem, ${gekozenLagen} laag/lagen`;
    btn.disabled = false;
  } else {
    status.textContent = lengte <= 0 && breedte <= 0
      ? 'Vul lengte en breedte in'
      : lengte <= 0 ? 'Vul de lengte in' : 'Vul de breedte in';
    btn.disabled = true;
  }
}

function resetInvoer() {
  const volgend = ruimtes.length + 1;
  DOM.ruimteNaam().value    = `Ruimte ${volgend}`;
  DOM.ruimteLengte().value  = '';
  DOM.ruimteBreedte().value = '';
  DOM.ruimteLengte().focus();
  updateStatus();
}

function resetAlles() {
  if (ruimtes.length === 0 && extraMaterialen.length === 0) return;
  if (!confirm('Weet je zeker dat je alles wilt wissen?')) return;
  ruimtes         = [];
  extraMaterialen = [];
  DOM.projectNaam().value = '';
  slaOp();
  renderTabel();
  resetInvoer();
}

// ─── UI: TOON/VERBERG ──────────────────────────────────────────────────────

function updateSysteemUI() {
  const isDubbel = gekozenSysteem === 'dubbel';
  DOM.hohBasisGroep().style.display = isDubbel ? '' : 'none';
}

function updateLagenUI() {
  DOM.gipsType2Groep().style.display = gekozenLagen === 2 ? '' : 'none';
}

function updateIsolatieUI() {
  DOM.isolatieDikteGroep().style.display = gekozenIsolatie ? '' : 'none';
}

// ─── GIPSTYPE DROPDOWNS ───────────────────────────────────────────────────────

function vulGipsTypeSelects() {
  const opties = (PRODUCTEN.gipstypen || []).map(g => {
    const maat = g.vasteMaten ? ` (${g.vasteMaten.lengte}×${g.vasteMaten.breedte})` : '';
    return `<option value="${g.waarde}">${g.label}${maat}</option>`;
  }).join('');

  DOM.gipsType1().innerHTML = opties;
  DOM.gipsType2().innerHTML = opties;

  const defaultType = 'standaard_4ak';
  if ([...DOM.gipsType1().options].some(o => o.value === defaultType)) {
    DOM.gipsType1().value = defaultType;
    DOM.gipsType2().value = defaultType;
  }
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────

function initEvents() {
  // Systeemknoppen
  document.querySelectorAll('[data-systeem]').forEach(btn => {
    btn.addEventListener('click', () => {
      gekozenSysteem = btn.dataset.systeem;
      document.querySelectorAll('[data-systeem]').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
      updateSysteemUI();
      updateStatus();
    });
  });

  // Lagenknoppen
  document.querySelectorAll('[data-lagen]').forEach(btn => {
    btn.addEventListener('click', () => {
      gekozenLagen = parseInt(btn.dataset.lagen);
      document.querySelectorAll('[data-lagen]').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
      updateLagenUI();
      updateStatus();
    });
  });

  // Isolatieknoppen
  document.querySelectorAll('[data-isolatie]').forEach(btn => {
    btn.addEventListener('click', () => {
      gekozenIsolatie = btn.dataset.isolatie === 'ja';
      document.querySelectorAll('[data-isolatie]').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
      updateIsolatieUI();
      updateStatus();
    });
  });

  // Invoervelden
  [
    DOM.ruimteLengte(), DOM.ruimteBreedte(),
    DOM.hohPD(), DOM.hohBasis(), DOM.hohAfhangers(),
    DOM.gipsLengte(), DOM.gipsBreedte(),
  ].forEach(el => el.addEventListener('input', updateStatus));

  DOM.gipsType1().addEventListener('change', updateStatus);
  DOM.gipsType2().addEventListener('change', updateStatus);

  // Enter in naam → lengte
  DOM.ruimteNaam().addEventListener('keydown', e => {
    if (e.key === 'Enter') DOM.ruimteLengte().focus();
  });

  // Enter in afmetingsvelden → toevoegen
  [DOM.ruimteLengte(), DOM.ruimteBreedte()].forEach(el => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !DOM.btnToevoegen().disabled) voegToe();
    });
  });

  // Knoppen
  DOM.btnToevoegen().addEventListener('click', voegToe);
  DOM.btnAllesReset().addEventListener('click', resetAlles);
  DOM.projectNaam().addEventListener('input', slaOp);

  // Afdrukken + PDF
  initAfdrukKnoppen();

  // Handmatig toevoegen
  document.getElementById('btn-handmatig-add').addEventListener('click', voegHandmatigToe);
  [DOM.extraOmschrijving(), DOM.extraAantal(), DOM.extraEenheid()].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') voegHandmatigToe(); });
  });

  // Delegated: verwijder ruimte / extra
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    if (btn.dataset.action === 'verwijder')       verwijderRuimte(id);
    if (btn.dataset.action === 'verwijder-extra') verwijderExtra(id);
  });

  updateStatus();
}

// ─── INIT ────────────────────────────────────────────────────────────────────

function init() {
  vulGipsTypeSelects();
  laadOp();
  updateSysteemUI();
  updateLagenUI();
  updateIsolatieUI();
  // Auto-voorvullen omschrijving
  DOM.ruimteNaam().value = `Ruimte ${ruimtes.length + 1}`;
  renderTabel();
  initEvents();
}

window.PRODUCTEN_READY.then(init);
