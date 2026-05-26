#!/bin/sh
set -eu

cat >/usr/share/nginx/html/env-config.js <<EOF
window.__APP_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL:-/api/v1}"
};
EOF

exec nginx -g 'daemon off;'
