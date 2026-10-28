# Reference Field Lab

Developed by Inna Izviekova. English/Ukrainian finding-chart tool.

Site: https://izviekova-blip.github.io/agn-reference-fields/

## Hosting

GitHub Pages serves the repository root on the main branch. No server, build step, API key or ChatGPT account is required. The browser queries public catalogue and sky-image services.

The main application uses index.html, app.js, catalogue-client.js, science.js, recommendations.js, viewport.js, i18n.js, style.css and fields.json. The original per-object pages, assets/, data/ and finding_charts/ remain available at their existing URLs.

## Curated fields

Edit the root fields.json to update the interactive tool's curated collection. Each record contains its coordinates, square field size, catalogue photometry, source links, validation notes and an embedded sky image. Existing data/ files serve the original object pages. The existing APASS update workflow updates data/ only; review and synchronize the tool's curated collection separately.

JSON imports and saved fields stay in the visitor's browser. They are not published to GitHub. Export JSON to keep a backup or transfer a field between browsers and website addresses.

## Chart export

Select comparison stars in the table, enable the monochrome sky option, and save PNG (3000 × 3316 px) or SVG. Only selected, accepted stars receive green markers. A red arrow identifies the target with clearance from its centre. The sky remains monochrome. Exports retain the full field of view.

## Checks

Run node tests/science.test.cjs node tests/brightness.test.cjs and node tests/catalogue-client.test.cjs. Catalogue screening identifies candidates and does not establish long-term constancy. Validate comparisons on your own images and time series.

## Citation

Finding charts were prepared with Reference Field Lab (Inna Izviekova). For curated sequences, cite AGN Reference Fields (https://doi.org/10.5281/zenodo.22036357), specifying the version used.

## Catalogue connections

The browser uses the official VizieR ASU service, with the CfA Harvard and NAOJ mirrors as fallbacks for network failures, timeouts and server errors. Each attempt has a 25-second timeout covering the response body. A working endpoint is preferred for subsequent queries in that page session. The exact successful query URL and access time are included in exported provenance. No proxy, cached substitute or relaxed scientific checks are used. All required catalogue checks must succeed before a new candidate list is committed.

Endpoint documentation: https://vizier.cds.unistra.fr/doc/asu-summary.htx

## Sky background

New and curated fields automatically request a 1400-pixel square DESI Legacy Surveys cutout directly from the Legacy Surveys viewer (layer ls-dr10: southern DR10 plus northern DR9). The TAN scale is derived from the same tangent-plane field width as the chart overlay; north is up and east is left. Empty images, unexpected dimensions and large blank patches are rejected. This conservative pixel check is not a formal footprint mask or a photometric quality test.

If the image is unavailable or incomplete, retain an existing embedded sky image or request DSS2 through the two official CDS HiPS2FITS endpoints. A timeout is not reported as proof of missing survey coverage. The actual source, layer, successful URL, access time, pixel scale and failures are included in JSON provenance; the displayed source is also printed in PNG/SVG. Catalogue photometry and candidate screening are independent of the background. Legacy Surveys acknowledgements: https://www.legacysurvey.org/acknowledgment/

Run node tests/sky-background.test.cjs to check projection scale, blank-image rejection and fallback behavior.
