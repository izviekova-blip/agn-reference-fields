
async function initField() {
  const slug = document.body.dataset.field;
  const res = await fetch('data/fields.json');
  const fields = await res.json();
  const f = fields.find(x => x.slug === slug);
  if (!f) return;

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
    coordinates: `${f.ra_deg.toFixed(6)}, ${f.dec_deg.toFixed(6)}`,
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
    V_mag: s.V.toFixed(3),
    sigma_V: s.eV == null ? 'not available' : s.eV.toFixed(3),
    catalogue: s.catalog,
    coordinates: `${s.ra.toFixed(6)}, ${s.dec.toFixed(6)}`,
    description: `${f.name}: comparison star ${s.id}`
  })));
}
window.addEventListener('DOMContentLoaded', initField);
