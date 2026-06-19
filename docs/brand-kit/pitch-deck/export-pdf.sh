#!/usr/bin/env bash
# Export the pitch deck to a print-clean PDF.
#
# Why this exists: the deck renders through <deck-stage> (a shadow-DOM web
# component). Chrome headless --print-to-pdf drops the background of
# shadow-DOM ::slotted elements, so the dark slides export WHITE. This script
# generates a flat, shadow-DOM-free build (print.html) from index.html where
# each slide is a plain page-break block, which prints the dark/light rhythm
# correctly. index.html stays the single source of truth; print.html is a
# disposable build artifact.
#
# Usage:  ./export-pdf.sh [output.pdf] [source.html]
#   ./export-pdf.sh                          → deck.pdf      from index.html
#   ./export-pdf.sh timeline.pdf timeline.html → timeline.pdf from timeline.html
set -euo pipefail
cd "$(dirname "$0")"

OUT="${1:-deck.pdf}"
SRC="${2:-index.html}"
TMP=".print-$$.html"

cp "$SRC" "$TMP"
perl -0pi -e 's/<deck-stage[^>]*>/<div class="printroot">/'                   "$TMP"
perl -0pi -e 's/<\/deck-stage>/<\/div>/'                                      "$TMP"
perl -0pi -e 's/\s*<script src="\.\.\/deck-stage\.js"><\/script>//'           "$TMP"
perl -0pi -e 's/<body style="margin:0;background:#000">/<body style="margin:0;background:#F7F5F1">/' "$TMP"
perl -0pi -e 's/<\/style>/\n  \@page { size:1920px 1080px; margin:0; }\n  .printroot .slide { width:1920px; height:1080px; break-after:page; page-break-after:always; }\n  .printroot .slide:last-child { break-after:auto; }\n  \@media print { * { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; } }\n<\/style>/' "$TMP"

CHROME="$(ls /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome 2>/dev/null || command -v google-chrome || echo google-chrome)"
"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --allow-file-access-from-files \
  --print-to-pdf="$OUT" "file://$(pwd)/$TMP" 2>/dev/null

rm -f "$TMP"
echo "Exported $OUT ($(pdfinfo "$OUT" 2>/dev/null | awk '/Pages/{print $2" pages"}'))"
