#!/usr/bin/env bash
set -euo pipefail

# Creates ./fonts, downloads WOFF2 files referenced by Google Fonts CSS
# and writes a local fonts-local.css with @font-face rules referencing
# the downloaded files.

mkdir -p fonts
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"

CSS_URL="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Lato:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap&subset=latin,latin-ext"

echo "Fetching CSS from: $CSS_URL"
curl -s -A "$UA" "$CSS_URL" -o fonts/fonts.css

# Extract unique gstatic URLs
grep -oE 'https://fonts.gstatic.com/[^)" ]+' fonts/fonts.css | sort -u > fonts/urls.txt

# Download each woff2
while read -r url; do
  fname=$(basename "$url")
  if [ ! -f "fonts/$fname" ]; then
    echo "Downloading $fname"
    curl -L -s -A "$UA" "$url" -o "fonts/$fname"
  else
    echo "Already have $fname"
  fi
done < fonts/urls.txt

# Replace remote URLs in fonts.css with local paths (preserve @font-face blocks)
awk '{
  s=$0;
  while (match(s, /https:\/\/fonts\.gstatic\.com\/[^)\"]+/)) {
    url=substr(s, RSTART, RLENGTH);
    n=split(url,a,"/");
    rep="fonts/" a[n];
    printf "%s%s", substr(s,1,RSTART-1), rep;
    s=substr(s, RSTART+RLENGTH);
  }
  print s;
}' fonts/fonts.css > fonts/fonts-local.css

# Show summary
echo "Downloaded files:"
ls -lh fonts | sed -n '1,200p'

echo -n "Total size: "
du -sh fonts | cut -f1

echo "Local fonts CSS written to fonts/fonts-local.css"
