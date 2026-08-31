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
- `finding_charts/ic1495_finding_chart.jpg`

The AGN is marked by a green cross and comparison stars are numbered consistently with the field tables. The first three charts are clean publication/reuse versions with photometry kept in the machine-readable tables. The IC 1495 chart is the supplied working V-band chart and retains the three adopted V magnitudes on the image.

## Reference-star photometry

Reference-star catalogue photometry is based on **AAVSO Photometric All-Sky Survey (APASS) DR9**, VizieR catalogue `II/336/apass9`.

- VizieR catalogue: https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=II%2F336%2Fapass9
- AAVSO APASS project: https://www.aavso.org/apass
- Catalogue bibliographic source: Henden et al. (2016), `2015AAS...22533616H`

For Mrk 42, IC 5287 and Mrk 845, the public tables expose the available Johnson **B**, **V** and Sloan **g′, r′, i′** APASS DR9 photometry. B and V are in the Vega system; g′, r′ and i′ are in the AB system.

For IC 1495, the supplied standard-star tables provide J2000 coordinates and APASS DR9 V, B−V, g′, r′ and i′ photometry for three comparison stars. The IAC80 R-band reference magnitudes are estimated from APASS r′ and i′ using the Lupton transformation:

- star 1: RA = 352.644555°, Dec = −13.503099°, V = 14.544 ± 0.037, R_est = 13.994 ± 0.039
- star 2: RA = 352.739712°, Dec = −13.531192°, V = 15.816, R_est = 15.374 ± 0.025
- star 3: RA = 352.707451°, Dec = −13.544119°, V = 13.876 ± 0.016, R_est = 13.489 ± 0.023

The independently transformed Lupton V values from g′−r′ differ from the direct APASS V values by 0.029, 0.028 and 0.038 mag for stars 1–3, respectively. The R values are transformed estimates and are not direct APASS R measurements.

Catalogue-reported zero uncertainties are retained in the machine-readable data as raw values but are shown as unavailable in the public tables rather than interpreted as physically zero.

## Machine-readable data

- `data/reference-stars.csv` — APASS DR9 comparison-star table for Mrk 42, IC 5287 and Mrk 845.
- `data/fields.json` — core field metadata for Mrk 42, IC 5287 and Mrk 845.
- `data/ic1495.json` — IC 1495 metadata, observing log, J2000 comparison-star positions, APASS photometry and Lupton transformations.
- `data/ic1495-reference-stars.csv` — full IC 1495 comparison-star table including APASS values, transformed V consistency check and Lupton R estimates.

## IC 1495 observing sequence

IC 1495 was observed with IAC80/CAMELOT2 on two consecutive nights. The 2025 October 13 sequence contains 26 exposures of 250 s in Johnson/Bessell R; the 2025 October 14 sequence contains 35 exposures of 300 s in Johnson/Bessell V. The fiducial aperture radius is 5 pixels = 1.61 arcsec.

## Reproducible APASS refresh

`scripts/update_apass_dr9.py` cross-matches stored comparison-star coordinates against VizieR `II/336/apass9`, selects the nearest source, and updates the core CSV and JSON tables for the original three APASS fields.

The workflow `.github/workflows/update-apass.yml` can be run manually from the GitHub **Actions** tab. It includes safeguards against a wrong cross-match: the nearest catalogue source must be within 3 arcsec and its APASS V magnitude must agree with the existing published/site V magnitude to within 0.03 mag.

IC 1495 currently uses its separately supplied APASS/Lupton table and is not modified by this automatic refresh workflow.

## Search-engine support

The site contains dedicated object pages, descriptive metadata, canonical URLs, structured Dataset metadata (JSON-LD), `robots.txt`, and `sitemap.xml`.

Sitemap:
https://izviekova-blip.github.io/agn-reference-fields/sitemap.xml

## Data provenance

The finding-chart numbering and comparison-star selections follow the corresponding observing analyses/manuscripts. APASS DR9 supplies the catalogue photometry. For IC 1495, the R estimates and the independent transformed-V check are calculated from the supplied APASS Sloan photometry using the Lupton transformations. The cited papers/manuscripts remain the authoritative source for reduction, quality-control tests and variability classifications.

If VizieR catalogue access is used in downstream work, please follow the acknowledgement requested by CDS/VizieR.
