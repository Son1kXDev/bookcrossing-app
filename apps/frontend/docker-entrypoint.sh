#!/bin/sh
set -e

cat > /usr/share/nginx/html/config.json <<EOF
{ "apiUrl": "${API_URL}" }
EOF

exec nginx -g "daemon off;"
