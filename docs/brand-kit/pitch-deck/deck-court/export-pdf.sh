#!/usr/bin/env bash
# Export du deck court (3 slides) en PDF propre.
#
# Meme principe que ../export-pdf.sh : le deck passe par <deck-stage>, un
# composant a shadow DOM. Chrome headless --print-to-pdf perd le fond des
# elements ::slotted, donc les slides sombres sortent BLANCHES. Ce script
# genere une version aplatie et jetable (print.html), sans shadow DOM, ou
# chaque slide est un simple bloc a saut de page. index.html reste la seule
# source de verite.
#
# Usage :  ./export-pdf.sh [sortie.pdf] [source.html]
#   ./export-pdf.sh                -> deck-court.pdf depuis index.html
set -euo pipefail
cd "$(dirname "$0")"

OUT="${1:-deck-court.pdf}"
SRC="${2:-index.html}"
TMP=".print-$$.html"

cp "$SRC" "$TMP"
perl -0pi -e 's/<deck-stage[^>]*>/<div class="printroot">/'                   "$TMP"
perl -0pi -e 's/<\/deck-stage>/<\/div>/'                                      "$TMP"
perl -0pi -e 's/\s*<script src="\.\.\/\.\.\/deck-stage\.js"><\/script>//'     "$TMP"
perl -0pi -e 's/<body style="margin:0;background:#000">/<body style="margin:0;background:#F7F5F1">/' "$TMP"
perl -0pi -e 's/<\/style>/\n  \@page { size:1920px 1080px; margin:0; }\n  .printroot .slide { width:1920px; height:1080px; break-after:page; page-break-after:always; }\n  .printroot .slide:last-child { break-after:auto; }\n  \@media print { * { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; } }\n<\/style>/' "$TMP"

CHROME="$(ls /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome 2>/dev/null || command -v google-chrome || echo google-chrome)"
"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --allow-file-access-from-files \
  --print-to-pdf="$OUT" "file://$(pwd)/$TMP" 2>/dev/null

rm -f "$TMP"
echo "Exported $OUT ($(pdfinfo "$OUT" 2>/dev/null | awk '/Pages/{print $2" pages"}'))"
