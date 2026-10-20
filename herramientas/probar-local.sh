#!/usr/bin/env bash
# Arma una copia de la app en el mismo motor de la nube (workerd), con una base
# limpia, para probar antes de publicar. Uso:
#   bash herramientas/probar-local.sh <carpeta-de-pruebas> [--sin-compilar]
# Después: cd <carpeta> && npx wrangler@4 dev --no-bundle --port 8830 --local
set -euo pipefail
DESTINO="${1:?falta la carpeta de pruebas}"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$DESTINO"
cd "$RAIZ"
if [ "${2:-}" != "--sin-compilar" ]; then
  GITHUB_SHA="prueba$(date +%s)" npx opennextjs-cloudflare build > "$DESTINO/compilacion.log" 2>&1
fi
npx wrangler deploy --dry-run --outdir="$DESTINO/.dist" --minify > "$DESTINO/empaque.log" 2>&1
cp "$DESTINO/.dist/worker.js" "$DESTINO/_worker.js"
node herramientas/limpiar-worker.js "$DESTINO/_worker.js" > /dev/null
rsync -a --delete .open-next/assets/ "$DESTINO/assets/"
cat > "$DESTINO/wrangler.jsonc" <<'JSON'
{
  "name": "proinshop-pruebas",
  "main": "_worker.js",
  "compatibility_date": "2026-07-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": "assets", "binding": "ASSETS" },
  "d1_databases": [{ "binding": "DB", "database_name": "site-proinshop", "database_id": "local" }],
  "r2_buckets": [{ "binding": "BUCKET", "bucket_name": "site-proinshop" }]
}
JSON
if [ ! -d "$DESTINO/.wrangler/state/v3/d1" ]; then
  cd "$DESTINO"
  for archivo in "$RAIZ/db/schema.sql" "$RAIZ"/db/migraciones/00{1,2,3}-*.sql; do
    npx --yes wrangler@4 d1 execute site-proinshop --local --file "$archivo" > /dev/null 2>&1
  done
  echo "base nueva creada"
fi
echo "listo: $DESTINO"
