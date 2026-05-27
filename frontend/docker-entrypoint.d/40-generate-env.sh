#!/bin/sh
set -eu

envsubst '${API_BASE_URL}' \
  < /usr/share/nginx/html/env-config.js \
  > /tmp/env-config.js

mv /tmp/env-config.js /usr/share/nginx/html/env-config.js
