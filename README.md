# AGN Reference Fields

Finding charts and comparison-star sequences for optical monitoring of active galactic nuclei.

Public site: https://izviekova-blip.github.io/agn-reference-fields/

## Included fields

- [Mrk 42](https://izviekova-blip.github.io/agn-reference-fields/mrk42.html)
- [IC 5287](https://izviekova-blip.github.io/agn-reference-fields/ic5287.html)
- [Mrk 845](https://izviekova-blip.github.io/agn-reference-fields/mrk845.html)
- [IC 1495](https://izviekova-blip.github.io/agn-reference-fields/ic1495.html)

## Static finding charts

Static finding charts are provided for all four fields:

- `finding_charts/mrk42_finding_chart_clean.png`
- `finding_charts/ic5287_finding_chart_clean.png`
- `finding_charts/mrk845_finding_chart_clean.png`
- `finding_charts/ic1495_finding_chart.png`

The AGN is marked by a green cross and comparison stars are numbered consistently with the field tables. The first three charts are clean publication/reuse versions with the photometry kept in the machine-readable tables. The IC 1495 chart is the supplied working V-band chart and retains the three adopted V magnitudes on the image.

## Reference-star photometry

For Mrk 42, IC 5287 and Mrk 845, reference-star catalogue photometry is taken from **AAVSO Photometric All-Sky Survey (APASS) DR9**, VizieR catalogue `II/336/apass9`.

- VizieR catalogue: https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=II%2F336%2Fapass9
- AAVSO APASS project: https://www.aavso.org/apass
- Catalogue bibliographic source: Henden et al. (2016), `2015AAS...22533616H`

APASS DR9 provides Johnson **B** and **V** in the Vega system and Sloan **g′, r′, i′** in the AB system. The cited IAC80/CAMELOT2 analyses of these three fields used **V-band** reference photometry; the additional APASS bands are supplied for future reuse.

For IC 1495, the current release stores the working comparison-star magnitudes adopted for the IAC80 reductions: stars 1–3 have `R = 13.994, 15.374, 13.489` and `V = 14.544, 15.816, 13.876`, respectively. The supplied V-band finding chart carries the same numbering and V values. J2000 comparison-star coordinates and catalogue uncertainties are intentionally left pending until the original coordinate table is imported; no coordinates are inferred from detector pixels.

Catalogue-reported zero uncertainties in the APASS fields are retained in the machine-readable data as `*_err_raw`, but are shown as unavailable in the public table rather than interpreted as physically zero.

## Machine-readable data

- `data/reference-stars.csv` — APASS DR9 comparison-star table for Mrk 42, IC 5287 and Mrk 845, including B, V, g′, r′ and i′ photometry, uncertainties and catalogue-match metadata.
- `data/fields.json` — core field metadata and APASS multiband photometry used by the website for those three fields.
- `data/ic1495.json` — IC 1495 field metadata, observing log and current R/V comparison sequence.
- `data/ic1495-reference-stars.csv` — current IC 1495 comparison-star R/V values.

## IC 1495 observing sequence

IC 1495 was observed with IAC80/CAMELOT2 on two consecutive nights. The 2025 October 13 sequence contains 26 exposures of 250 s in Johnson/Bessell R; the 2025 October 14 sequence contains 35 exposures of 300 s in Johnson/Bessell V. The fiducial aperture radius is 5 pixels = 1.61 arcsec.

## Reproducible APASS refresh

`scripts/update_apass_dr9.py` cross-matches each stored APASS comparison-star coordinate against VizieR `II/336/apass9`, selects the nearest source, and updates the core CSV and JSON tables.

The workflow `.github/workflows/update-apass.yml` can be run manually from the GitHub **Actions** tab. It includes safeguards against a wrong cross-match: the nearest catalogue source must be within 3 arcsec and its APASS V magnitude must agree with the existing published/site V magnitude to within 0.03 mag.

IC 1495 is kept outside the automatic APASS refresh until its original comparison-star coordinate table is imported.

## Search-engine support

The site contains dedicated object pages, descriptive metadata, canonical URLs, structured Dataset metadata (JSON-LD), `robots.txt`, and `sitemap.xml`.

Sitemap:
https://izviekova-blip.github.io/agn-reference-fields/sitemap.xml

## Data provenance

The finding-chart numbering and comparison-star selections follow the corresponding observing analyses/manuscripts. APASS DR9 supplies the catalogue photometry for Mrk 42, IC 5287 and Mrk 845. The IC 1495 page records the supplied working field sequence without inventing catalogue coordinates that are not yet present in the repository. The cited papers/manuscripts remain the authoritative source for reduction, quality-control tests and variability classifications.

If VizieR catalogue access is used in downstream work, please follow the acknowledgement requested by CDS/VizieR.
