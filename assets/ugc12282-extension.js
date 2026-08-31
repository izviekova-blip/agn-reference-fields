// UGC 12282 extension: load the field and render its supplied V / B−V table
// without changing the existing APASS multiband layouts used by the other fields.
EXTRA_DATA_URLS.push('data/ugc12282.json');

const _ugcBaseStarRows = starRows;
starRows = function (f) {
  if (f.photometry_mode === 'v_bv') {
    return f.stars.map(s => `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td class="coord">${hasCoord(s) ? Number(s.ra).toFixed(6) : '—'}</td>
        <td class="coord">${hasCoord(s) ? Number(s.dec).toFixed(6) : '—'}</td>
        <td><strong>${fmtPhot(s.V, s.eV)}</strong></td>
        <td>${fmtPhot(s.BV, s.eBV)}</td>
        <td>${catalogueCell(s)}</td>
        <td>${copyCell(s)}</td>
      </tr>`).join('');
  }
  return _ugcBaseStarRows(f);
};

const _ugcBaseStarTable = starTable;
starTable = function (f) {
  if (f.photometry_mode === 'v_bv') {
    const rows = starRows(f);
    return `
      <div class="star-table-wrap">
        <h3>Comparison-star sequence — supplied V and B−V photometry</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>RA (deg)</th><th>Dec (deg)</th>
              <th>V ± σV</th>
              <th>B−V ± σ</th>
              <th>Source</th><th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="footer-note" style="margin:10px 0 0">
          Values are reproduced from the supplied UGC 12282 standard-star table. A reported zero V uncertainty for star 1 is shown as “—” and retained separately as a raw zero in the machine-readable data.
        </p>
      </div>`;
  }
  return _ugcBaseStarTable(f);
};

const _ugcBaseCatalogueNote = catalogueNote;
catalogueNote = function (f) {
  if (f.photometry_mode === 'v_bv') {
    return `<div class="note"><strong>Reference-star photometry.</strong> ${esc(f.photometry_system_note || '')}</div>`;
  }
  return _ugcBaseCatalogueNote(f);
};
