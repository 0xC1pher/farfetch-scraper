#!/usr/bin/env bash

set -e

# Cargar variables de entorno
if [ -f "$(dirname "$0")/../.env" ]; then
  export $(grep -v '^#' "$(dirname "$0")/../.env" | xargs)
else
  echo "❌ Archivo .env no encontrado en $(dirname "$0")/../.env. Crea uno antes de continuar."
  exit 1
fi

# Variables por defecto si no están en .env
MINIO_ENDPOINT=${MINIO_ENDPOINT:-localhost}
MINIO_PORT=${MINIO_PORT:-9000}
MINIO_CONSOLE_PORT=${MINIO_CONSOLE_PORT:-9001}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-minioadmin}
MINIO_BUCKET=${MINIO_BUCKET:-mexa-data}

echo "🔍 Verificando si MinIO está corriendo en Docker..."
if ! docker ps | grep -q minio; then
  echo "🚀 Iniciando MinIO en Docker..."
  docker run -d -p ${MINIO_PORT}:9000 -p ${MINIO_CONSOLE_PORT}:9001 \
    --name minio \
    -e "MINIO_ROOT_USER=${MINIO_ACCESS_KEY}" \
    -e "MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}" \
    minio/minio server /data --console-address ":9001"
else
  echo "✅ MinIO ya está corriendo."
fi

# Esperar a que MinIO esté listo
echo "⏳ Esperando a que MinIO esté listo..."
until curl -s "http://${MINIO_ENDPOINT}:${MINIO_PORT}/minio/health/ready" | grep -q "OK"; do
  sleep 2
done
echo "✅ MinIO está listo."

# Instalar cliente mc si no existe
if ! command -v mc &> /dev/null; then
  echo "⬇️ Instalando cliente MinIO (mc)..."
  wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
  chmod +x /usr/local/bin/mc
fi

# Configurar alias de MinIO en mc
mc alias set mexa-minio "http://${MINIO_ENDPOINT}:${MINIO_PORT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}"

# Crear bucket si no existe
if ! mc ls mexa-minio | grep -q "${MINIO_BUCKET}"; then
  echo "🪣 Creando bucket '${MINIO_BUCKET}'..."
  mc mb mexa-minio/"${MINIO_BUCKET}"
else
  echo "✅ Bucket '${MINIO_BUCKET}' ya existe."
fi

echo "🌐 Acceso web MinIO: http://${MINIO_ENDPOINT}:${MINIO_CONSOLE_PORT}"
echo "🔑 Usuario: ${MINIO_ACCESS_KEY}"
echo "🔑 Password: ${MINIO_SECRET_KEY}"
echo "🪣 Bucket: ${MINIO_BUCKET}"
echo "✅ MinIO y bucket listos para usar."

exit 0