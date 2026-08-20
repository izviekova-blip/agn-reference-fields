
const DATA_URL = 'data/fields.json';
let fields = [];

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function fmtErr(v) {
  return v === null || v === undefined ? '—' : Number(v).toFixed(3);
}
function renderCard(f) {
  const rows = f.stars.map(s => `
    <tr>
      <td><strong>${s.id}</strong></td>
      <td class="coord">${s.ra.toFixed(6)}</td>
      <td class="coord">${s.dec.toFixed(6)}</td>
      <td>${s.V.toFixed(3)}</td>
      <td>${fmtErr(s.eV)}</td>
      <td>${esc(s.catalog)}</td>
      <td><button class="copy" data-copy="${s.ra.toFixed(6)} ${s.dec.toFixed(6)}">Copy</button></td>
    </tr>`).join('');

  const nights = f.nights.map(n => `
    <tr><td>${esc(n.night)}</td><td>${esc(n.exp)}</td><td>${esc(n.duration)}</td><td>${esc(n.frames)}</td></tr>`).join('');

  const paperLink = f.paper_url
    ? `<a href="${esc(f.paper_url)}" target="_blank" rel="noopener">Open paper</a>`
    : `<span>Public link to be added after release.</span>`;

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
          <div class="chart-help">Interactive sky view. Target = green marker; comparison stars = red markers. Pan/zoom to inspect the field.</div>
        </div>
        <div class="details">
          <div class="meta">
            <div class="meta-item"><span>Target (J2000)</span><strong>${esc(f.ra_sex)} &nbsp; ${esc(f.dec_sex)}</strong></div>
            <div class="meta-item"><span>Degrees</span><strong class="coord">${f.ra_deg.toFixed(6)}, ${f.dec_deg.toFixed(6)}</strong></div>
            <div class="meta-item"><span>Instrument</span><strong>${esc(f.instrument)}</strong></div>
            <div class="meta-item"><span>Filter / aperture</span><strong>${esc(f.filter)} · ${esc(f.aperture)}</strong></div>
          </div>
          <p>${esc(f.observing_summary)}</p>
          <div class="note"><strong>Reference-star use.</strong> ${esc(f.reference_note)}</div>
          <div class="note"><strong>Validation.</strong> ${esc(f.validation_note)}</div>
          ${f.extra_note ? `<div class="note"><strong>Catalogue note.</strong> ${esc(f.extra_note)}</div>` : ''}
        </div>
      </div>
      <div class="star-table-wrap">
        <table>
          <thead><tr><th>ID</th><th>RA (deg)</th><th>Dec (deg)</th><th>V</th><th>σV</th><th>Catalogue</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
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

async function init() {
  const res = await fetch(DATA_URL);
  fields = await res.json();
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
      'Interactive chart could not load. Coordinates and reference-star tables remain available below.');
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

    const targetCat = A.catalog({name: `${f.name} nucleus`, sourceSize: 18, color: '#19d28b'});
    aladin.addCatalog(targetCat);
    targetCat.addSources([A.source(f.ra_deg, f.dec_deg, {
      name: f.name,
      description: `${f.name} nucleus (J2000)`
    })]);

    const refCat = A.catalog({name: 'Comparison stars', sourceSize: 16, color: '#ff5a5f'});
    aladin.addCatalog(refCat);
    refCat.addSources(f.stars.map(s => A.source(s.ra, s.dec, {
      name: `${f.name} ref ${s.id}`,
      description: `Star ${s.id}; V=${s.V.toFixed(3)} mag; RA=${s.ra.toFixed(6)}, Dec=${s.dec.toFixed(6)}`
    })));
  });
}

window.addEventListener('DOMContentLoaded', init);
