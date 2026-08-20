# AGN Reference Fields

Finding charts and validated comparison-star sequences for optical monitoring of active galactic nuclei.

## Included fields

- Mrk 42
- IC 5287
- Mrk 845


## Files

- `index.html` — the website
- `assets/style.css` — styling
- `assets/app.js` — interactive field rendering and Aladin Lite overlays
- `data/fields.json` — structured field metadata
- `data/reference-stars.csv` — machine-readable comparison-star table

## Publish with GitHub Pages

1. Upload all files and folders in this package to the repository root.
2. Open the repository on GitHub.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**.
6. Save.

The public URL will normally be:

`https://izviekova-blip.github.io/agn-reference-fields/`

## Notes

The interactive finding charts use **CDS Aladin Lite** with a DSS2 colour background, so an internet connection is needed for the sky imagery. The star tables and CSV/JSON data remain available even if Aladin is unavailable.

For Mrk 845 comparison star 4, APASS DR9 reports `σV = 0.000 mag`. This is not treated as a physically zero uncertainty, so the site displays it as unavailable.

## Data provenance

Reference-star coordinates and V-band catalogue photometry reproduce the values reported in the cited observing papers/manuscripts. The website is intended as a convenient reproducibility layer; the papers remain the authoritative source for reduction and validation details.
