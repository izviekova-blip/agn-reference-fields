const DATA_URL = 'data/fields.json';
const EXTRA_DATA_URLS = ['data/ic1495.json'];
const APASS_VIZIER_URL = 'https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=II%2F336%2Fapass9';
const APASS_PROJECT_URL = 'https://www.aavso.org/apass';
let fields = [];

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function fmt(v) {
  return v === null || v === undefined || Number.isNaN(Number(v)) ? '—' : Number(v).toFixed(3);
}
function fmtPhot(mag, err) {
  if (mag === null || mag === undefined || Number.isNaN(Number(mag))) return '—';
  const m = Number(mag).toFixed(3);
  if (err === null || err === undefined || Number.isNaN(Number(err)) || Number(err) <= 0) return `${m} ± —`;
  return `${m} ± ${Number(err).toFixed(3)}`;
}
function hasCoord(s) {
  return s && Number.isFinite(Number(s.ra)) && Number.isFinite(Number(s.dec));
}
function apassQueryUrl(s) {
  if (!hasCoord(s)) return '';
  const c = `${Number(s.ra).toFixed(6)} ${Number(s.dec).toFixed(6)},eq=J2000,rs=3`;
  return `https://vizier.cds.unistra.fr/viz-bin/VizieR/VizieR-6?-c=${encodeURIComponent(c)}&-source=II%2F336%2Fapass9`;
}
function catalogueCell(s) {
  const label = esc(s.catalog || 'Catalogue');
  if ((s.catalog || '').toLowerCase().includes('apass') && hasCoord(s)) {
    return `<a href="${apassQueryUrl(s)}" target="_blank" rel="noopener">${label}</a>`;
  }
  return label;
}
function copyCell(s) {
  if (!hasCoord(s)) return '<span aria-label="coordinates unavailable">—</span>';
  const coord = `${Number(s.ra).toFixed(6)} ${Number(s.dec).toFixed(6)}`;
  return `<button class="copy" data-copy="${coord}">Copy</button>`;
}
function starRows(f) {
  if (f.multiband === false) {
    return f.stars.map(s => `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td class="coord">${hasCoord(s) ? Number(s.ra).toFixed(6) : '—'}</td>
        <td class="coord">${hasCoord(s) ? Number(s.dec).toFixed(6) : '—'}</td>
        <td>${fmtPhot(s.R, s.eR)}</td>
        <td><strong>${fmtPhot(s.V, s.eV)}</strong></td>
        <td>${catalogueCell(s)}</td>
        <td>${copyCell(s)}</td>
      </tr>`).join('');
  }
  return f.stars.map(s => `
    <tr>
      <td><strong>${s.id}</strong></td>
      <td class="coord">${Number(s.ra).toFixed(6)}</td>
      <td class="coord">${Number(s.dec).toFixed(6)}</td>
      <td>${fmtPhot(s.B, s.eB)}</td>
      <td><strong>${fmtPhot(s.V, s.eV)}</strong></td>
      <td>${fmtPhot(s.g, s.eg)}</td>
      <td>${fmtPhot(s.r, s.er)}</td>
      <td>${fmtPhot(s.i, s.ei)}</td>
      <td>${catalogueCell(s)}</td>
      <td>${copyCell(s)}</td>
    </tr>`).join('');
}
function starTable(f) {
  const rows = starRows(f);
  if (f.multiband === false) {
    return `
      <div class="star-table-wrap">
        <h3>Comparison-star sequence — working R/V calibration</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>RA (deg)</th><th>Dec (deg)</th>
              <th>R ± σR</th><th>V ± σV</th><th>Source</th><th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="footer-note" style="margin:10px 0 0">
          “—” marks values not yet imported into the repository. The numbered stars and adopted V magnitudes are also shown on the supplied static finding chart.
        </p>
      </div>`;
  }
  return `
    <div class="star-table-wrap">
      <h3>Comparison-star sequence — APASS DR9 multiband photometry</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>RA (deg)</th><th>Dec (deg)</th>
            <th>B ± σB<br><small>Vega</small></th>
            <th>V ± σV<br><small>Vega · used</small></th>
            <th>g′ ± σg′<br><small>AB</small></th>
            <th>r′ ± σr′<br><small>AB</small></th>
            <th>i′ ± σi′<br><small>AB</small></th>
            <th>Catalogue</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="footer-note" style="margin:10px 0 0">
        “—” means that the catalogue value or a usable uncertainty is unavailable. Catalogue-reported zero uncertainties are not interpreted as physically zero.
      </p>
    </div>`;
}
function catalogueNote(f) {
  if (f.multiband === false) {
    return `<div class="note"><strong>Photometric sequence.</strong> ${esc(f.photometry_system_note || '')}</div>`;
  }
  return `<div class="note">
    <strong>Catalogue photometry.</strong>
    Reference-star photometry is from <a href="${APASS_VIZIER_URL}" target="_blank" rel="noopener">APASS DR9 in VizieR</a>
    (<a href="${APASS_PROJECT_URL}" target="_blank" rel="noopener">AAVSO APASS project</a>).
    Johnson <em>B</em> and <em>V</em> are Vega magnitudes; Sloan <em>g′r′i′</em> are AB magnitudes.
    The cited IAC80 analyses used the <em>V</em> band; the additional APASS bands are provided for future reuse.
  </div>`;
}
function renderCard(f) {
  const nights = f.nights.map(n => `
    <tr><td>${esc(n.night)}</td><td>${esc(n.exp)}</td><td>${esc(n.duration)}</td><td>${esc(n.frames)}</td></tr>`).join('');

  const paperLink = f.paper_url
    ? `<a href="${esc(f.paper_url)}" target="_blank" rel="noopener">Open paper</a>`
    : `<span>Public link to be added after release.</span>`;

  const staticChart = f.static_chart
    ? `<p><a class="small-button" href="${esc(f.static_chart)}" target="_blank" rel="noopener">Open static finding chart</a></p>`
    : '';

  const chartHelp = f.star_coordinates_available === false
    ? 'Interactive DSS2 view centred on the AGN. The numbered comparison stars are identified in the supplied static finding chart; their J2000 coordinates are awaiting import into the machine-readable table.'
    : 'Interactive sky view. The AGN is labelled “AGN”; comparison stars are labelled 1, 2, 3… to match the table below. Click a marker for its details.';

  return `
    <article class="field-card" id="${esc(f.slug)}" data-search="${esc((f.name+' '+f.aliases).toLowerCase())}">
      <div class="field-head">
        <div>
          <h2>${esc(f.name)}</h2>
          <div class="alias">${esc(f.aliases)}</div>
        </div>
        <span class="badge">${f.stars.length} comparison stars</span>
      </div>
      <div class="field-grid">
        <div class="chart-panel">
          <div class="aladin" id="aladin-${esc(f.slug)}"></div>
          <div class="chart-help">${chartHelp}</div>
          ${staticChart}
        </div>
        <div class="details">
          <div class="meta">
            <div class="meta-item"><span>Target (J2000)</span><strong>${esc(f.ra_sex)} &nbsp; ${esc(f.dec_sex)}</strong></div>
            <div class="meta-item"><span>Degrees</span><strong class="coord">${Number(f.ra_deg).toFixed(6)}, ${Number(f.dec_deg).toFixed(6)}</strong></div>
            <div class="meta-item"><span>Instrument</span><strong>${esc(f.instrument)}</strong></div>
            <div class="meta-item"><span>Observed filter / aperture</span><strong>${esc(f.filter)} · ${esc(f.aperture)}</strong></div>
          </div>
          <p>${esc(f.observing_summary)}</p>
          <div class="note"><strong>Reference-star use.</strong> ${esc(f.reference_note)}</div>
          <div class="note"><strong>Validation.</strong> ${esc(f.validation_note)}</div>
          ${f.extra_note ? `<div class="note"><strong>Field note.</strong> ${esc(f.extra_note)}</div>` : ''}
          ${catalogueNote(f)}
        </div>
      </div>
      ${starTable(f)}
      <div class="subsection">
        <h3>Observing log</h3>
        <div class="star-table-wrap" style="padding:0">
          <table>
            <thead><tr><th>Night</th><th>Exposure</th><th>Duration</th><th>Frames</th></tr></thead>
            <tbody>${nights}</tbody>
          </table>
        </div>
      </div>
      <div class="paper">
        <strong>Source:</strong> ${esc(f.paper_short)} — ${esc(f.paper_title)}<br>
        ${paperLink}
      </div>
    </article>`;
}

async function loadFields() {
  const mainRes = await fetch(DATA_URL);
  const mainFields = await mainRes.json();
  const extras = [];
  for (const url of EXTRA_DATA_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const value = await res.json();
      if (Array.isArray(value)) extras.push(...value);
      else if (value) extras.push(value);
    } catch (err) {
      console.warn(`Could not load supplemental field data from ${url}`, err);
    }
  }
  return [...mainFields, ...extras];
}

async function init() {
  fields = await loadFields();
  document.getElementById('cards').innerHTML = fields.map(renderCard).join('');
  document.getElementById('nfields').textContent = fields.length;
  document.getElementById('nstars').textContent = fields.reduce((a,f) => a+f.stars.length, 0);

  document.querySelectorAll('.copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(btn.dataset.copy);
      const old = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => btn.textContent = old, 900);
    });
  });

  const q = document.getElementById('search');
  q.addEventListener('input', () => {
    const term = q.value.trim().toLowerCase();
    document.querySelectorAll('.field-card').forEach(card => {
      card.classList.toggle('hidden', term && !card.dataset.search.includes(term));
    });
  });

  setupAladin();
}

function setupAladin() {
  if (!window.A) {
    document.querySelectorAll('.chart-help').forEach(el => el.textContent =
      'Interactive chart could not load. Target coordinates and static finding charts remain available.');
    return;
  }
  fields.forEach(f => {
    const target = `${f.ra_deg} ${f.dec_deg}`;
    const aladin = A.aladin(`#aladin-${f.slug}`, {
      survey: 'P/DSS2/color',
      fov: f.field_fov_deg,
      target,
      showReticle: true,
      showGotoControl: true,
      showFullscreenControl: true,
      showLayersControl: true,
      showSimbadPointerControl: true
    });

    const targetCat = A.catalog({
      name: `${f.name} nucleus`,
      sourceSize: 18,
      color: '#19d28b',
      shape: 'cross',
      labelColumn: 'label',
      displayLabel: true,
      labelColor: '#7CFFCB',
      labelFont: 'bold 14px Arial',
      onClick: 'showPopup'
    });
    aladin.addCatalog(targetCat);
    targetCat.addSources([A.source(f.ra_deg, f.dec_deg, {
      label: 'AGN',
      name: f.name,
      coordinates: `${Number(f.ra_deg).toFixed(6)}, ${Number(f.dec_deg).toFixed(6)}`,
      description: `${f.name} nucleus (J2000)`
    })]);

    const validStars = f.stars.filter(hasCoord);
    if (!validStars.length) return;

    const refCat = A.catalog({
      name: 'Comparison stars',
      sourceSize: 18,
      color: '#ff5a5f',
      shape: 'square',
      labelColumn: 'label',
      displayLabel: true,
      labelColor: '#FFE66D',
      labelFont: 'bold 17px Arial',
      onClick: 'showPopup'
    });
    aladin.addCatalog(refCat);
    refCat.addSources(validStars.map(s => A.source(s.ra, s.dec, {
      label: String(s.id),
      star_id: `Reference star ${s.id}`,
      B_mag: fmtPhot(s.B, s.eB),
      V_mag: fmtPhot(s.V, s.eV),
      g_mag: fmtPhot(s.g, s.eg),
      r_mag: fmtPhot(s.r, s.er),
      i_mag: fmtPhot(s.i, s.ei),
      catalogue: s.catalog || 'APASS DR9',
      coordinates: `${Number(s.ra).toFixed(6)}, ${Number(s.dec).toFixed(6)}`,
      description: `${f.name}: comparison star ${s.id}`
    })));
  });
}

window.addEventListener('DOMContentLoaded', init);
