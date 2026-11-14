# Font archive (blockallisto-media parity)

Byte-exact backup of the public/fonts/ object set served by the media worker
from Backblaze B2 (494 woff2 + 8 CSS + 12 license/checksum files = 514 keys;
the 3 Inter woff2 + Inter-OFL.txt also still live in frontend/public/fonts/
for the app build).

Provenance: downloaded through the worker from B2 on 2026-11-07; every file
sha1-verified against a fresh b2_list_file_names listing (543-key audit).
SHA256SUMS.txt records SHA256 and byte count for 501 archived files, relative
to assets/. It includes the eight CSS files, whose URLs were later made
portable for Pages. It describes current repository bytes, not an unchanged
copy of the original B2 manifest. Run `python3 scripts/check-font-archive.py`
from the repository root; CI also checks this manifest and rejects drift.
Fonts are open-source (OFL); upstream re-derivation: Google Fonts (Inter,
Montserrat, Plus Jakarta Sans, Poppins, Noto families).

This directory carries `export-ignore` in .gitattributes so gate/deploy
archives (git archive) stay slim; it ships in full clones only.
Owner decision 2026-11-07 (wamid.HBgMMzUxOTEwMTMwMTIxFQIAEhgWM0VCMDMxNDAwQjI1ODM4OUFFNTFENgA=).
