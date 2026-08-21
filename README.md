# AGN Reference Fields

Finding charts and validated comparison-star sequences for optical monitoring of active galactic nuclei.

Public site: https://izviekova-blip.github.io/agn-reference-fields/

## Included fields

- [Mrk 42](https://izviekova-blip.github.io/agn-reference-fields/mrk42.html)
- [IC 5287](https://izviekova-blip.github.io/agn-reference-fields/ic5287.html)
- [Mrk 845](https://izviekova-blip.github.io/agn-reference-fields/mrk845.html)

## Reference-star photometry

Reference-star catalogue photometry is taken from **AAVSO Photometric All-Sky Survey (APASS) DR9**, VizieR catalogue `II/336/apass9`.

- VizieR catalogue: https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=II%2F336%2Fapass9
- AAVSO APASS project: https://www.aavso.org/apass
- Catalogue bibliographic source: Henden et al. (2016), `2015AAS...22533616H`

The resource exposes every APASS DR9 magnitude available for these comparison stars:

- Johnson **B** and **V** — Vega magnitude system
- Sloan **g′, r′, i′** — AB magnitude system

The cited IAC80/CAMELOT2 observing analyses used **V-band** reference photometry. The additional APASS bands are included to make the reference-star sequences reusable for future observations in other filters; they are not presented as bands used retrospectively in the published reductions.

Catalogue-reported zero uncertainties are retained in the machine-readable data as `*_err_raw`, but are shown as unavailable in the public table rather than interpreted as physically zero.

## Machine-readable data

- `data/reference-stars.csv` — one row per comparison star, including B, V, g′, r′ and i′ magnitudes, uncertainties, APASS uncertainty flags, catalogue-match coordinates and separation.
- `data/fields.json` — field metadata plus the same APASS multiband photometry used by the website.

## Reproducible APASS refresh

`scripts/update_apass_dr9.py` cross-matches each stored comparison-star coordinate against VizieR `II/336/apass9`, selects the nearest source, and updates the CSV and JSON tables.

The workflow `.github/workflows/update-apass.yml` can be run manually from the GitHub **Actions** tab. It includes safeguards against a wrong cross-match: the nearest catalogue source must be within 3 arcsec and its APASS V magnitude must agree with the existing published/site V magnitude to within 0.03 mag.

## Search-engine support

The site contains dedicated object pages, descriptive metadata, canonical URLs, structured Dataset metadata (JSON-LD), `robots.txt`, and `sitemap.xml`.

Sitemap:
https://izviekova-blip.github.io/agn-reference-fields/sitemap.xml

## Data provenance

The finding-chart numbering and comparison-star selections follow the cited observing studies/manuscripts. APASS DR9 supplies the catalogue photometry. The website is a convenience and reproducibility resource; the cited papers remain the authoritative source for the observing reduction, quality-control tests, and variability classifications.

If VizieR catalogue access is used in downstream work, please follow the acknowledgement requested by CDS/VizieR.
