#!/bin/sh
set -eu

# Substitui ${API_BASE_URL} no env-config.js (lido pelo browser)
envsubst '${API_BASE_URL}' \
  < /usr/share/nginx/html/env-config.js \
  > /tmp/env-config.js
mv /tmp/env-config.js /usr/share/nginx/html/env-config.js

# Substitui ${API_ORIGIN} no nginx.conf e gera o default.conf final
# Usa lista explícita de variáveis para não tocar nas variáveis do próprio nginx ($uri, $remote_addr, etc.)
envsubst '${API_ORIGIN}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf
