#!/usr/bin/env bash

if [ -p /dev/stdin ]; then
  while IFS= read line; do
    curl "https://${line}" \
        -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/112.0' \
        -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8' \
        -H 'Accept-Encoding: gzip, deflate' \
        --max-redirs 10 \
        -Ls -w "%{url_effective}\n" -o /dev/null
  done
fi
