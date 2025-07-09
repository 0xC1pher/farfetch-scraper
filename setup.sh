# 1. Crear directorio external y clonar repos
mkdir -p external
cd external

git clone https://github.com/hangwin/mcp-chrome.git browser-mcp
git clone https://github.com/jaypyles/Scraperr.git scraperr
git clone https://github.com/stretchcloud/deepscrape.git deepscrape

cd ..

# 2. Verificar estructura
tree external/ -L 1
# Debe mostrar:
# external/
# ├── browser-mcp
# ├── deepscrape
# └── scraperr