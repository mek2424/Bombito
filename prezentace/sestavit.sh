#!/usr/bin/env bash
# Celé sestavení: obrázky → PPTX → PDF → náhledy. Spouštěj ze složky prezentace/.
#   bash sestavit.sh            … bez nového focení (použije pracovni/snimky)
#   bash sestavit.sh --foto     … nejdřív nafotí všechny scény znovu
set -euo pipefail
cd "$(dirname "$0")"
[[ "${1:-}" == "--foto" ]] && node snimky.js
node pripravit.js
node sestav.js
SOFFICE=$(command -v soffice || command -v libreoffice || echo "/Applications/LibreOffice.app/Contents/MacOS/soffice")
"$SOFFICE" --headless --convert-to pdf --outdir pracovni pracovni/Bombito-pro-trenery.pptx >/dev/null
cp pracovni/Bombito-pro-trenery.pdf Bombito-pro-trenery.pdf
node nahled.js
echo "Hotovo: prezentace/Bombito-pro-trenery.pdf  (náhledy: prezentace/pracovni/nahled/mrizka-*.png)"
