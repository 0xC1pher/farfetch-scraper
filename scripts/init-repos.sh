#!/bin/bash

# Directorio base del proyecto
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODULES_DIR="${BASE_DIR}/src/modules"
REPOS=(
  "https://github.com/hangwin/mcp-chrome,browser-mcp"
  "https://github.com/jaypyles/Scraperr,scraperr"
  "https://github.com/stretchcloud/deepscrape,deepscrape"
)

echo "🚀 Inicializando repositorios..."

for repo in "${REPOS[@]}"; do
  # Separar URL y directorio destino
  IFS=',' read -r url dir <<< "${repo}"
  TARGET_DIR="${MODULES_DIR}/${dir}"
  
  echo "\n🔧 Procesando ${url}..."
  
  # Verificar si el directorio ya existe
  if [ -d "${TARGET_DIR}" ]; then
    echo "   ✓ El directorio ${dir} ya existe. Actualizando..."
    cd "${TARGET_DIR}" && git pull
  else
    echo "   ➜ Clonando en ${dir}..."
    git clone "${url}" "${TARGET_DIR}"
  fi
  
  # Instalar dependencias si hay un package.json
  if [ -f "${TARGET_DIR}/package.json" ]; then
    echo "   📦 Instalando dependencias para ${dir}..."
    (cd "${TARGET_DIR}" && npm install)
  fi
  
  # Crear archivo .gitkeep si el directorio está vacío
  if [ -z "$(ls -A ${TARGET_DIR} 2>/dev/null)" ]; then
    touch "${TARGET_DIR}/.gitkeep"
  fi
done

echo "\n✅ Inicialización completada!"
