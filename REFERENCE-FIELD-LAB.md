# Reference Field Lab

Developed by Inna Izviekova. English/Ukrainian finding-chart tool.

Site: https://izviekova-blip.github.io/agn-reference-fields/

## Hosting

GitHub Pages serves the repository root on the main branch. No server, build step, API key or ChatGPT account is required. The browser queries public catalogue and sky-image services.

The main application uses index.html, app.js, science.js, recommendations.js, viewport.js, i18n.js, style.css and fields.json. The original per-object pages, assets/, data/ and finding_charts/ remain available at their existing URLs.

## Curated fields

Edit the root fields.json to update the interactive tool's curated collection. Each record contains its coordinates, square field size, catalogue photometry, source links, validation notes and an embedded sky image. Existing data/ files serve the original object pages. The existing APASS update workflow updates data/ only; review and synchronize the tool's curated collection separately.

JSON imports and saved fields stay in the visitor's browser. They are not published to GitHub. Export JSON to keep a backup or transfer a field between browsers and website addresses.

## Chart export

Select comparison stars in the table, enable the monochrome sky option, and save PNG (3000 × 3316 px) or SVG. Only selected, accepted stars receive green markers. A red arrow identifies the target with clearance from its centre. The sky remains monochrome. Exports retain the full field of view.

## Checks

Run node tests/science.test.cjs and node tests/brightness.test.cjs. Catalogue screening identifies candidates and does not establish long-term constancy. Validate comparisons on your own images and time series.

## Citation

Finding charts were prepared with Reference Field Lab (Inna Izviekova). For curated sequences, cite AGN Reference Fields (https://doi.org/10.5281/zenodo.22036357), specifying the version used.
