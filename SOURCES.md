# Data sources

## Catalogue photometry: APASS DR9

Reference-star photometry in this resource is drawn from the **AAVSO Photometric All-Sky Survey (APASS) DR9**, VizieR catalogue `II/336/apass9`, for fields where APASS is explicitly identified in the source table.

- VizieR: https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=II%2F336%2Fapass9
- AAVSO APASS: https://www.aavso.org/apass
- Bibliographic source: Henden, A. A., Templeton, M., Terrell, D., Smith, T. C., Levine, S., & Welch, D. (2016), `2015AAS...22533616H`
- VizieR service DOI: https://doi.org/10.26093/cds/vizier

APASS DR9 provides Johnson B and V magnitudes and Sloan g′, r′, i′ magnitudes for the main survey. B and V are in the Vega system; g′, r′, i′ are in the AB system.

## Mrk 42

Izviekova, I. O., Vavilova, I. B., Kompaniiets, O. V., Zamora, O., & Clavero, R. (2026).
*The 2MIG isolated AGNs. 3. Optical–IR variability and dust reverberation in the NLSy1 galaxies Mrk 42 and Mrk 493.*
arXiv:2605.06517.

Candidate comparison stars were selected based on brightness and isolation, cross-checked against APASS DR9 and Gaia DR3, and known/suspected variables were excluded using VSX as described in the paper.

## IC 5287 and Mrk 845

Izviekova, I. O., Vavilova, I. B., Kompaniiets, O. V., Zamora, O., & Clavero, R. (2026).
*The 2MIG isolated AGNs – 5. Hot-dust reverberation and spectroscopic constraints on BLR–dust scales in IC 5287 and Mrk 845.*
Manuscript.

Comparison-star coordinates and V-band values correspond to the sequences used in the manuscript. The website additionally exposes the other APASS DR9 bands for the same catalogue matches. Field-specific stability, leave-one-out, aperture, and seeing checks remain documented in the manuscript.

## IC 1495

Izviekova, I. O. et al. (2026).
IC 1495 multiwavelength analysis. Manuscript in preparation.

The IAC80/CAMELOT2 observations were obtained on 2025 October 13 (26 × 250 s, Johnson/Bessell R) and 2025 October 14 (35 × 300 s, Johnson/Bessell V). The fiducial photometric aperture is 5 pixels = 1.61 arcsec.

The IC 1495 comparison sequence is based on the supplied APASS DR9 standard-star tables. The three stars have J2000 positions:

- star 1: RA = 352.644555°, Dec = −13.503099°
- star 2: RA = 352.739712°, Dec = −13.531192°
- star 3: RA = 352.707451°, Dec = −13.544119°

Direct APASS V magnitudes are 14.544 ± 0.037, 15.816 and 13.876 ± 0.016 for stars 1–3. The supplied table also gives APASS B−V, g′, r′ and i′ photometry. For the R-band IAC80 reduction, R is estimated from Sloan r′ and i′ using the Lupton transformation, giving 13.994 ± 0.039, 15.374 ± 0.025 and 13.489 ± 0.023 mag. These R values are transformed estimates and are not direct APASS R measurements.

As an internal consistency check, V transformed independently from APASS g′ and r′ is 14.573 ± 0.033, 15.844 ± 0.035 and 13.914 ± 0.030 mag, differing from the direct APASS V values by 0.029, 0.028 and 0.038 mag, respectively.

Catalogue-reported zero formal uncertainties for star 2 are retained as raw zero values in the machine-readable table and displayed publicly as unavailable uncertainties.

## UGC 12282

UGC 12282 is 2MIG 3110. The target position used for the interactive field is J2000 RA = 22:58:55.28, Dec = +40:55:55.9, following the published 2MIG isolated-AGN sample.

The comparison-star sequence comes from the supplied `мапа стандартів UGC12282(1).csv` table and accompanying annotated finding chart. The source table contains:

- star 1: RA = 344.811083°, Dec = +40.902881°, V = 15.759, eV(raw) = 0.000, B−V = 1.066 ± 0.114
- star 2: RA = 344.812843°, Dec = +40.933759°, V = 14.721 ± 0.036, B−V = 0.777 ± 0.085
- star 3: RA = 344.824663°, Dec = +40.937892°, V = 14.658 ± 0.047, B−V = 0.664 ± 0.124

The table does not state the catalogue source, observing date, exposure time, number of frames or adopted aperture. Those quantities are therefore left unspecified. The zero V uncertainty for star 1 is retained as a raw catalogue value in the machine-readable data and displayed publicly as unavailable rather than interpreted as physically zero.
