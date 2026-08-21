#!/usr/bin/env python3
"""
Query APASS DR9 (VizieR II/336/apass9) for every comparison star already
listed in data/fields.json, add all available B,V,g',r',i' magnitudes and
uncertainties, and rewrite both fields.json and reference-stars.csv.

Safety checks:
- nearest APASS source must be within 3 arcsec;
- queried APASS V must agree with the already published/site V value
  to within 0.03 mag, otherwise the script stops rather than accepting
  a possibly wrong cross-match.

Catalogue-reported uncertainty == 0 is preserved in *_err_raw but exposed
as null in the public table because it is not interpreted as physically zero.
"""

from pathlib import Path
import csv
import json
import math
import sys

import numpy as np
import astropy.units as u
from astropy.coordinates import SkyCoord
from astroquery.vizier import Vizier

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "data" / "fields.json"
CSV_PATH = ROOT / "data" / "reference-stars.csv"

CATALOG = "II/336/apass9"
CATALOG_URL = "https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=II%2F336%2Fapass9"
AAVSO_URL = "https://www.aavso.org/apass"
RADIUS = 5 * u.arcsec
MAX_MATCH_ARCSEC = 3.0
MAX_V_DIFF = 0.03

viz = Vizier(columns=["*"], row_limit=50)

BANDS = {
    "B": ("Bmag", "e_Bmag", "u_e_Bmag"),
    "V": ("Vmag", "e_Vmag", "u_e_Vmag"),
    "g": ("g'mag", "e_g'mag", "u_e_g'mag"),
    "r": ("r'mag", "e_r'mag", "u_e_r'mag"),
    "i": ("i'mag", "e_i'mag", "u_e_i'mag"),
}

def number(row, name):
    if name not in row.colnames:
        return None
    v = row[name]
    if np.ma.is_masked(v):
        return None
    try:
        x = float(v)
    except Exception:
        return None
    return x if math.isfinite(x) else None

def integer(row, name):
    x = number(row, name)
    return None if x is None else int(x)

def clean_error(x):
    # Zero uncertainties in catalog tables are not treated as physically zero.
    return None if x is None or x <= 0 else x

def query_star(ra, dec):
    target = SkyCoord(ra=ra * u.deg, dec=dec * u.deg, frame="icrs")
    result = viz.query_region(target, radius=RADIUS, catalog=CATALOG)
    if not result:
        raise RuntimeError(f"No APASS DR9 source within {RADIUS} of {ra:.6f}, {dec:.6f}")

    tab = result[0]
    if len(tab) == 0:
        raise RuntimeError(f"Empty APASS result at {ra:.6f}, {dec:.6f}")

    coords = SkyCoord(
        ra=np.asarray(tab["RAJ2000"], dtype=float) * u.deg,
        dec=np.asarray(tab["DEJ2000"], dtype=float) * u.deg,
        frame="icrs",
    )
    sep = target.separation(coords).arcsec
    idx = int(np.argmin(sep))
    if float(sep[idx]) > MAX_MATCH_ARCSEC:
        raise RuntimeError(
            f"Nearest APASS source is {float(sep[idx]):.3f}\" away at "
            f"{ra:.6f}, {dec:.6f}; refusing automatic match."
        )
    return tab[idx], float(sep[idx])

def cone_url(ra, dec):
    from urllib.parse import quote
    c = f"{ra:.6f} {dec:.6f},eq=J2000,rs=3"
    return (
        "https://vizier.cds.unistra.fr/viz-bin/VizieR/VizieR-6?"
        f"-c={quote(c)}&-source=II%2F336%2Fapass9"
    )

fields = json.loads(JSON_PATH.read_text(encoding="utf-8"))

for f in fields:
    f["photometry_catalog"] = "APASS DR9"
    f["photometry_catalog_vizier"] = CATALOG_URL
    f["photometry_catalog_project"] = AAVSO_URL
    f["photometry_system_note"] = (
        "Johnson B,V are Vega magnitudes; Sloan g',r',i' are AB magnitudes. "
        "The cited IAC80 analyses used V; the additional bands are supplied for reuse."
    )

    for s in f["stars"]:
        old_v = s.get("V")
        row, sep = query_star(float(s["ra"]), float(s["dec"]))

        vcat = number(row, "Vmag")
        if old_v is not None and vcat is not None and abs(float(old_v) - vcat) > MAX_V_DIFF:
            raise RuntimeError(
                f"{f['name']} star {s['id']}: APASS V={vcat:.3f} differs from "
                f"existing V={float(old_v):.3f} by > {MAX_V_DIFF:.2f} mag. "
                "Refusing automatic match."
            )

        s["catalog"] = "APASS DR9"
        s["apass_ra"] = number(row, "RAJ2000")
        s["apass_dec"] = number(row, "DEJ2000")
        s["apass_match_sep_arcsec"] = round(sep, 4)
        s["apass_field"] = None if "Field" not in row.colnames else str(row["Field"]).strip()
        s["apass_nobs"] = integer(row, "nobs")
        s["apass_mobs"] = integer(row, "mobs")
        s["apass_query_url"] = cone_url(float(s["ra"]), float(s["dec"]))

        for key, (mcol, ecol, fcol) in BANDS.items():
            mag = number(row, mcol)
            err_raw = number(row, ecol)
            flag = integer(row, fcol)

            s[key] = mag
            s[f"e{key}"] = clean_error(err_raw)
            s[f"e{key}_raw"] = err_raw
            s[f"e{key}_flag"] = flag

        print(
            f"{f['name']:8s} star {s['id']}: sep={sep:5.3f}\" "
            f"B={s.get('B')} V={s.get('V')} g={s.get('g')} r={s.get('r')} i={s.get('i')}"
        )

JSON_PATH.write_text(json.dumps(fields, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

columns = [
    "object", "alias", "star_id", "ra_deg", "dec_deg",
    "apass_ra_deg", "apass_dec_deg", "match_sep_arcsec",
    "B_mag", "B_mag_err", "B_mag_err_raw", "B_err_flag",
    "V_mag", "V_mag_err", "V_mag_err_raw", "V_err_flag",
    "g_mag", "g_mag_err", "g_mag_err_raw", "g_err_flag",
    "r_mag", "r_mag_err", "r_mag_err_raw", "r_err_flag",
    "i_mag", "i_mag_err", "i_mag_err_raw", "i_err_flag",
    "apass_field", "apass_nobs", "apass_mobs",
    "catalog", "catalog_query_url", "instrument", "observed_filter", "aperture",
]

with CSV_PATH.open("w", newline="", encoding="utf-8") as fh:
    writer = csv.DictWriter(fh, fieldnames=columns)
    writer.writeheader()
    for f in fields:
        for s in f["stars"]:
            writer.writerow({
                "object": f["name"],
                "alias": f["aliases"],
                "star_id": s["id"],
                "ra_deg": f"{float(s['ra']):.6f}",
                "dec_deg": f"{float(s['dec']):.6f}",
                "apass_ra_deg": "" if s.get("apass_ra") is None else f"{s['apass_ra']:.6f}",
                "apass_dec_deg": "" if s.get("apass_dec") is None else f"{s['apass_dec']:.6f}",
                "match_sep_arcsec": s.get("apass_match_sep_arcsec", ""),
                "B_mag": s.get("B", ""), "B_mag_err": s.get("eB", ""),
                "B_mag_err_raw": s.get("eB_raw", ""), "B_err_flag": s.get("eB_flag", ""),
                "V_mag": s.get("V", ""), "V_mag_err": s.get("eV", ""),
                "V_mag_err_raw": s.get("eV_raw", ""), "V_err_flag": s.get("eV_flag", ""),
                "g_mag": s.get("g", ""), "g_mag_err": s.get("eg", ""),
                "g_mag_err_raw": s.get("eg_raw", ""), "g_err_flag": s.get("eg_flag", ""),
                "r_mag": s.get("r", ""), "r_mag_err": s.get("er", ""),
                "r_mag_err_raw": s.get("er_raw", ""), "r_err_flag": s.get("er_flag", ""),
                "i_mag": s.get("i", ""), "i_mag_err": s.get("ei", ""),
                "i_mag_err_raw": s.get("ei_raw", ""), "i_err_flag": s.get("ei_flag", ""),
                "apass_field": s.get("apass_field", ""),
                "apass_nobs": s.get("apass_nobs", ""),
                "apass_mobs": s.get("apass_mobs", ""),
                "catalog": "APASS DR9",
                "catalog_query_url": s.get("apass_query_url", ""),
                "instrument": f["instrument"],
                "observed_filter": f["filter"],
                "aperture": f["aperture"],
            })

print(f"\nUpdated {JSON_PATH.relative_to(ROOT)}")
print(f"Updated {CSV_PATH.relative_to(ROOT)}")
