'use strict';

// ─── CONSTANTEN ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'afbouwr_msplafond_v1';

// Schroeven per plaat per laag (gemiddelde inclusief randverdichting)
const SCHROEVEN_PER_PLAAT = 25;

// UD-profiel standaardlengte in mm
const UD_LENGTE = 3000;

// CD-profiel standaardlengte in mm
const CD_LENGTE = 3600;

// Draadhangers hart-op-hart in mm (langs de hoofdprofielen)
const DRAADHANGER_HOH = 1000;

// Veerprofielen per m² hoofdprofiel (gekoppeld systeem)
const VEERPROFIEL_PER_M = 1.5; // per strekkende meter hoofdprofiel

// ─── STAAT ───────────────────────────────────────────────────────────────────

let ruimtes       = [];
let extraMaterialen = [];
let gekozenSysteem = 'zwevend';
let gekozenLagen   = 1;
let gekozenHoh     = 400;

// ─── DOM ─────────────────────────────────────────────────────────────────────

const DOM = {
  projectNaam:      () => document.getElementById('project-naam'),
  ruimteNaam:       () => document.getElementById('ruimte-naam'),
  ruimteLengte:     () => document.getElementById('ruimte-lengte'),
  ruimteBreedte:    () => document.getElementById('ruimte-breedte'),
  gipsType:         () => document.getElementById('gips-type'),
  plaatBreedte:     () => document.getElementById('plaat-breedte'),
  plaatLengte:      () => document.getElementById('plaat-lengte'),
  btnToevoegen:     () => document.getElementById('btn-toevoegen'),
  calcStatus:       () => document.getElementById('calc-status'),
  resultsSection:   () => document.getElementById('results-section'),
  countRuimtes:     () => document.getElementById('count-ruimtes'),
  ruimtesTbody:     () => document.getElementById('ruimtes-tbody'),
  totalSqm:         () => document.getElementById('total-sqm'),
  tbodyTotalen:     () => document.getElementById('tbody-totalen'),
  extraOmschrijving: () => document.getElementById('extra-omschrijving'),
  extraAantal:      () => document.getElementById('extra-aantal'),
  extraEenheid:     () => document.getElementById('extra-eenheid'),
  btnAllesReset:    () => document.getElementById('btn-alles-reset'),
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

function getLengte()  { return parseFloat(DOM.ruimteLengte().value)  || 0; }
function getBreedte() { return parseFloat(DOM.ruimteBreedte().value) || 0; }
function getSqm()     { return +(getLengte() * getBreedte()).toFixed(2); }
function getOmtrek()  { return +((getLengte() + getBreedte()) * 2).toFixed(2); }

// ─── BEREKENING ──────────────────────────────────────────────────────────────

/**
 * Bereken materialen voor één ruimte.
 * @param {number} lengte   - in meter
 * @param {number} breedte  - in meter
 * @param {number} hoh      - hart-op-hart CD-profiel in mm (400 of 600)
 * @param {number} lagen    - aantal gipslagen (1 of 2)
 * @param {string} systeem  - 'zwevend' of 'gekoppeld'
 * @param {number} plaatB   - plaatbreedte in mm
 * @param {number} plaatL   - plaatlengte in mm
 */
function bereken(lengte, breedte, hoh, lagen, systeem, plaatB, plaatL) {
  const sqm    = lengte * breedte;
  const omtrek = (lengte + breedte) * 2;

  // ── UD-randprofiel (3000 mm staven) ──────────────────────────────────────
  const udTotal_mm  = omtrek * 1000;
  const udStaven    = ceil(udTotal_mm / UD_LENGTE);

  // ── CD-hoofdprofielen (lopen over de breedte, h-o-h in lengterichinng) ──
  // Aantal rijen hoofdprofielen:
  const aantalHoofdRijen = ceil((lengte * 1000) / hoh) + 1;
  // Lengte per rij ≈ breedte van de ruimte; we rekenen in staven van 3600 mm
  const cdHoofdPerRij   = ceil((breedte * 1000) / CD_LENGTE);
  const cdHoofdTotaal   = aantalHoofdRijen * cdHoofdPerRij;

  // ── CD-dwarsprofielen (h-o-h 600 mm, loodrecht op hoofdprofielen) ────────
  const aantalDwarsRijen = ceil((breedte * 1000) / 600) + 1;
  const cdDwarsPerRij    = ceil((lengte * 1000) / CD_LENGTE);
  const cdDwarsTotaal    = aantalDwarsRijen * cdDwarsPerRij;

  // ── Draadhangers (zwevend systeem: h-o-h 1000 mm langs de hoofdprofielen)
  let draadhangers = 0;
  if (systeem === 'zwevend') {
    // Per rij hoofdprofiel: aantal draadhangers = ceil(breedte / 1m) + 1
    const dhangerPerRij = ceil((breedte * 1000) / DRAADHANGER_HOH) + 1;
    draadhangers = aantalHoofdRijen * dhangerPerRij;
  }

  // ── Veerprofielen (gekoppeld systeem) ─────────────────────────────────────
  let veerprofielen = 0;
  if (systeem === 'gekoppeld') {
    // 1 veerprofiel per strekkende meter hoofdprofiel (afgerond)
    const totalHoofdMeter = aantalHoofdRijen * breedte;
    veerprofielen = ceil(totalHoofdMeter * VEERPROFIEL_PER_M);
  }

  // ── Gipskartonplaten ──────────────────────────────────────────────────────
  const plaatOpp  = (plaatB / 1000) * (plaatL / 1000); // m²
  const plaatMaat = `${plaatL}×${plaatB} mm`;
  // Snijverlies: 10%
  const plaatBruto = sqm * 1.10;
  const platen     = ceil(plaatBruto / plaatOpp) * lagen;

  // ── Schroeven ─────────────────────────────────────────────────────────────
  const plaatPerLaag = ceil(plaatBruto / plaatOpp);
  const schroeven    = plaatPerLaag * SCHROEVEN_PER_PLAAT * lagen;

  return {
    sqm:           +sqm.toFixed(2),
    omtrek:        +omtrek.toFixed(2),
    udStaven,
    cdHoofdTotaal,
    cdDwarsTotaal,
    draadhangers,
    veerprofielen,
    platen,
    plaatMaat,
    schroeven,
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
    if (data.projectNaam) DOM.projectNaam().value = data.projectNaam;
    if (Array.isArray(data.ruimtes))          ruimtes          = data.ruimtes;
    if (Array.isArray(data.extraMaterialen))  extraMaterialen  = data.extraMaterialen;
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
    rows += `<tr>
      <td>${esc(r.naam)}</td>
      <td>${r.systeem === 'zwevend' ? 'Zwevend' : 'Gekoppeld'}</td>
      <td>${esc(r.gipsLabel)} ${r.lagen > 1 ? `(${r.lagen}×)` : ''}</td>
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

  // Accumuleer totalen over alle ruimtes
  let udStaven      = 0;
  let cdHoofd       = 0;
  let cdDwars       = 0;
  let draadhangers  = 0;
  let veerprofielen = 0;
  let platen        = 0;
  let schroeven     = 0;

  // Bijhouden gipstype-combinaties (voor label in totaal)
  const gipsTypes = new Set();
  const plaatMaten = new Set();

  for (const r of ruimtes) {
    const res = r.resultaten;
    udStaven      += res.udStaven;
    cdHoofd       += res.cdHoofdTotaal;
    cdDwars       += res.cdDwarsTotaal;
    draadhangers  += res.draadhangers;
    veerprofielen += res.veerprofielen;
    platen        += res.platen;
    schroeven     += res.schroeven;
    gipsTypes.add(r.gipsLabel);
    plaatMaten.add(res.plaatMaat);
  }

  const gipsLabel  = [...gipsTypes].join(', ') || '—';
  const plaatLabel = [...plaatMaten].join(', ') || '—';

  let html = '';

  // Groep: Randprofielen
  html += groepHeader('Randprofiel');
  html += rij('UD-randprofiel', '30 mm / 3000 mm', udStaven, 'staven');

  // Groep: CD-profielen
  html += groepHeader('CD-profielen');
  html += rij('CD-hoofdprofiel', '60 mm / 3600 mm', cdHoofd, 'staven');
  html += rij('CD-dwarsprofiel', '60 mm / 3600 mm', cdDwars, 'staven');

  // Groep: Bevestiging
  if (draadhangers > 0 || veerprofielen > 0) {
    html += groepHeader('Bevestiging');
    if (draadhangers > 0)  html += rij('Draadhangers',  'Zwevend systeem', draadhangers,  'st');
    if (veerprofielen > 0) html += rij('Veerprofielen', 'Gekoppeld systeem', veerprofielen, 'st');
  }

  // Groep: Gipskarton
  html += groepHeader('Gipskarton');
  html += rij(`Gipskartonplaat — ${gipsLabel}`, plaatLabel, platen, 'platen');

  // Groep: Schroeven
  html += groepHeader('Bevestigingsmateriaal');
  html += rij('TN-schroeven', '35 mm', schroeven, 'st');

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

  const naam      = DOM.ruimteNaam().value.trim() || `Ruimte ${ruimtes.length + 1}`;
  const gipsEl    = DOM.gipsType();
  const gipsWaarde = gipsEl.value;
  const gipsLabel  = gipsEl.options[gipsEl.selectedIndex]?.text || gipsWaarde;
  const plaatB    = parseInt(DOM.plaatBreedte().value) || 1200;
  const plaatL    = parseInt(DOM.plaatLengte().value)  || 2600;

  ruimtes.push({
    id:         Date.now(),
    naam,
    lengte,
    breedte,
    systeem:    gekozenSysteem,
    lagen:      gekozenLagen,
    hoh:        gekozenHoh,
    gipsWaarde,
    gipsLabel,
    resultaten: bereken(lengte, breedte, gekozenHoh, gekozenLagen, gekozenSysteem, plaatB, plaatL),
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

// ─── INVOER VALIDATIE / STATUS ────────────────────────────────────────────────

function updateStatus() {
  const lengte  = getLengte();
  const breedte = getBreedte();
  const btn     = DOM.btnToevoegen();
  const status  = DOM.calcStatus();

  if (lengte > 0 && breedte > 0) {
    const sqm = (lengte * breedte).toFixed(2);
    status.textContent = `${sqm} m² — ${gekozenSysteem}, ${gekozenLagen} laag/lagen, h-o-h ${gekozenHoh} mm`;
    btn.disabled = false;
  } else {
    status.textContent = lengte <= 0 && breedte <= 0
      ? 'Vul lengte en breedte in'
      : lengte <= 0 ? 'Vul de lengte in' : 'Vul de breedte in';
    btn.disabled = true;
  }
}

function resetInvoer() {
  DOM.ruimteNaam().value = '';
  DOM.ruimteLengte().value = '';
  DOM.ruimteBreedte().value = '';
  DOM.ruimteLengte().focus();
  updateStatus();
}

function resetAlles() {
  if (ruimtes.length === 0 && extraMaterialen.length === 0) return;
  if (!confirm('Weet je zeker dat je alles wilt wissen?')) return;
  ruimtes = [];
  extraMaterialen = [];
  DOM.projectNaam().value = '';
  slaOp();
  renderTabel();
  resetInvoer();
}

// ─── GIPSTYPE DROPDOWN ────────────────────────────────────────────────────────

function vulGipsTypeSelect() {
  const sel = DOM.gipsType();
  sel.innerHTML = PRODUCTEN.gipstypen.map(g => {
    const maat = g.vasteMaten ? ` (${g.vasteMaten.lengte}×${g.vasteMaten.breedte})` : '';
    return `<option value="${g.waarde}">${g.label}${maat}</option>`;
  }).join('');

  // Vaste maten: update plaatafmetingen als een type met vaste maten gekozen wordt
  sel.addEventListener('change', () => {
    const gevonden = PRODUCTEN.gipstypen.find(g => g.waarde === sel.value);
    if (gevonden?.vasteMaten) {
      DOM.plaatBreedte().value = gevonden.vasteMaten.breedte;
      DOM.plaatLengte().value  = gevonden.vasteMaten.lengte;
    }
    updateStatus();
  });
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
      updateStatus();
    });
  });

  // Hart-op-hart knoppen
  document.querySelectorAll('[data-hoh]').forEach(btn => {
    btn.addEventListener('click', () => {
      gekozenHoh = parseInt(btn.dataset.hoh);
      document.querySelectorAll('[data-hoh]').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
      updateStatus();
    });
  });

  // Invoervelden
  [DOM.ruimteLengte(), DOM.ruimteBreedte(), DOM.plaatBreedte(), DOM.plaatLengte()].forEach(el => {
    el.addEventListener('input', updateStatus);
  });

  // Enter in naam-veld
  DOM.ruimteNaam().addEventListener('keydown', e => {
    if (e.key === 'Enter') DOM.ruimteLengte().focus();
  });

  // Enter in invoervelden → toevoegen
  [DOM.ruimteLengte(), DOM.ruimteBreedte()].forEach(el => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !DOM.btnToevoegen().disabled) voegToe();
    });
  });

  // Toevoegen knop
  DOM.btnToevoegen().addEventListener('click', voegToe);

  // Reset alles
  DOM.btnAllesReset().addEventListener('click', resetAlles);

  // Projectnaam opslaan
  DOM.projectNaam().addEventListener('input', slaOp);

  // Afdrukken + PDF (via gedeelde utility in components.js)
  initAfdrukKnoppen();

  // Handmatig toevoegen
  DOM.btnHandmatigAdd = () => document.getElementById('btn-handmatig-add');
  document.getElementById('btn-handmatig-add').addEventListener('click', voegHandmatigToe);
  [DOM.extraOmschrijving(), DOM.extraAantal(), DOM.extraEenheid()].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') voegHandmatigToe(); });
  });

  // Delegated events: verwijder ruimte / extra materiaal
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
  vulGipsTypeSelect();
  laadOp();
  renderTabel();
  initEvents();
}

window.PRODUCTEN_READY.then(init);
