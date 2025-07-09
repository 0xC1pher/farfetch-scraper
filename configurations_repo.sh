#!/bin/bash

echo "�� Configurando repos externos..."

# Crear directorio external
mkdir -p external
cd external

# Clonar repos
echo "�� Clonando browser-mcp..."
git clone https://github.com/hangwin/mcp-chrome.git browser-mcp

echo "📥 Clonando scraperr..."
git clone https://github.com/jaypyles/Scraperr.git scraperr

echo "📥 Clonando deepscrape..."
git clone https://github.com/stretchcloud/deepscrape.git deepscrape

# Instalar dependencias de cada repo
echo "📦 Instalando dependencias..."

cd browser-mcp && npm install && cd ..
cd scraperr && npm install && cd ..
cd deepscrape && npm install && cd ..

cd ..

echo "✅ Repos externos configurados correctamente"
echo "�� Estructura creada:"
tree external/ -L 1