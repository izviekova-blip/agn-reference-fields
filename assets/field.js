const APASS_VIZIER_URL = 'https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=II%2F336%2Fapass9';
const APASS_PROJECT_URL = 'https://www.aavso.org/apass';

function fmtPhot(mag, err) {
  if (mag === null || mag === undefined || Number.isNaN(Number(mag))) return '—';
  const m = Number(mag).toFixed(3);
  if (err === null || err === undefined || Number.isNaN(Number(err)) || Number(err) <= 0) return `${m} ± —`;
  return `${m} ± ${Number(err).toFixed(3)}`;
}
function apassQueryUrl(s) {
  const c = `${Number(s.ra).toFixed(6)} ${Number(s.dec).toFixed(6)},eq=J2000,rs=3`;
  return `https://vizier.cds.unistra.fr/viz-bin/VizieR/VizieR-6?-c=${encodeURIComponent(c)}&-source=II%2F336%2Fapass9`;
}
function multibandTable(f) {
  const rows = f.stars.map(s => `
    <tr>
      <td><strong>${s.id}</strong></td>
      <td class="coord">${Number(s.ra).toFixed(6)}</td>
      <td class="coord">${Number(s.dec).toFixed(6)}</td>
      <td>${fmtPhot(s.B, s.eB)}</td>
      <td><strong>${fmtPhot(s.V, s.eV)}</strong></td>
      <td>${fmtPhot(s.g, s.eg)}</td>
      <td>${fmtPhot(s.r, s.er)}</td>
      <td>${fmtPhot(s.i, s.ei)}</td>
      <td><a href="${apassQueryUrl(s)}" target="_blank" rel="noopener">APASS DR9</a></td>
      <td><button class="copy" data-copy="${Number(s.ra).toFixed(6)} ${Number(s.dec).toFixed(6)}">Copy</button></td>
    </tr>`).join('');
  return `
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
    <tbody>${rows}</tbody>`;
}

async function initField() {
  const slug = document.body.dataset.field;
  const res = await fetch('data/fields.json');
  const fields = await res.json();
  const f = fields.find(x => x.slug === slug);
  if (!f) return;

  // Replace the static V-only table in the SEO page with the complete APASS table.
  const starWrap = document.querySelector('.star-table-wrap');
  if (starWrap) {
    const h3 = starWrap.querySelector('h3');
    if (h3) h3.textContent = 'Comparison-star sequence — APASS DR9 multiband photometry';
    const table = starWrap.querySelector('table');
    if (table) table.innerHTML = multibandTable(f);
    const note = document.createElement('p');
    note.className = 'footer-note';
    note.style.margin = '10px 0 0';
    note.innerHTML = 'Johnson <em>B</em> and <em>V</em> are Vega magnitudes; Sloan <em>g′r′i′</em> are AB magnitudes. The cited IAC80 analysis used <em>V</em>; the additional bands are supplied for reuse. “—” means unavailable or unusable catalogue uncertainty.';
    starWrap.appendChild(note);
  }

  const details = document.querySelector('.details');
  if (details) {
    const provenance = document.createElement('div');
    provenance.className = 'note';
    provenance.innerHTML = `<strong>Catalogue photometry.</strong> Reference-star values are from <a href="${APASS_VIZIER_URL}" target="_blank" rel="noopener">APASS DR9 in VizieR</a> (<a href="${APASS_PROJECT_URL}" target="_blank" rel="noopener">AAVSO APASS project</a>).`;
    details.appendChild(provenance);
  }

  document.querySelectorAll('.copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(btn.dataset.copy);
      const old = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => btn.textContent = old, 900);
    });
  });

  if (!window.A) {
    document.querySelector('.chart-help').textContent =
      'Interactive chart could not load. The reference-star table remains available below.';
    return;
  }

  const aladin = A.aladin('#field-aladin', {
    survey: 'P/DSS2/color',
    fov: f.field_fov_deg,
    target: `${f.ra_deg} ${f.dec_deg}`,
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
  refCat.addSources(f.stars.map(s => A.source(s.ra, s.dec, {
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
}
window.addEventListener('DOMContentLoaded', initField);
