#!/bin/bash

# Script para configurar estructura de MinIO para múltiples módulos de extracción
echo "🚀 Configurando estructura de MinIO para múltiples módulos..."

# Configurar alias de MinIO
echo "📡 Configurando conexión a MinIO..."
./mc alias set mexa-local http://localhost:9002 minioadmin minioadmin123

# Verificar conexión
echo "🔍 Verificando conexión..."
./mc admin info mexa-local

# Crear bucket si no existe
echo "📦 Verificando bucket mexa-data..."
./mc mb mexa-local/mexa-data --ignore-existing

# Crear estructura de directorios para múltiples módulos
echo "📁 Creando estructura de directorios para módulos de extracción..."

# Crear archivos temporales para crear la estructura de directorios
mkdir -p /tmp/mexa-modules-structure/extraction/browser-mcp/$(date +%Y-%m-%d)
mkdir -p /tmp/mexa-modules-structure/extraction/scraperr/$(date +%Y-%m-%d)
mkdir -p /tmp/mexa-modules-structure/extraction/deepscrape/$(date +%Y-%m-%d)
mkdir -p /tmp/mexa-modules-structure/extraction/custom/$(date +%Y-%m-%d)

# Crear estructura de sesiones por módulo
mkdir -p /tmp/mexa-modules-structure/sessions/browser-mcp
mkdir -p /tmp/mexa-modules-structure/sessions/scraperr
mkdir -p /tmp/mexa-modules-structure/sessions/deepscrape

# Crear estructura de configuraciones por módulo
mkdir -p /tmp/mexa-modules-structure/config/browser-mcp
mkdir -p /tmp/mexa-modules-structure/config/scraperr
mkdir -p /tmp/mexa-modules-structure/config/deepscrape

# Crear archivos de ejemplo para cada módulo
echo "📄 Creando datos de ejemplo para cada módulo..."

# Browser-MCP example
cat > /tmp/mexa-modules-structure/extraction/browser-mcp/$(date +%Y-%m-%d)/example.json << 'EOF'
{
  "module": "browser-mcp",
  "url": "https://www.farfetch.com/shopping/women/items.aspx",
  "data": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "viewport": {"width": 1366, "height": 768},
    "fingerprint": {"canvas": "abc123", "webgl": "def456"},
    "extractedData": []
  },
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "success": true,
  "metadata": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "viewport": {"width": 1366, "height": 768},
    "fingerprint": {"canvas": "abc123", "webgl": "def456"}
  },
  "savedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "version": "1.0"
}
EOF

# Scraperr example
cat > /tmp/mexa-modules-structure/extraction/scraperr/$(date +%Y-%m-%d)/example.json << 'EOF'
{
  "module": "scraperr",
  "url": "https://www.farfetch.com/shopping/women/items.aspx",
  "data": {
    "selectors": [".product-card", ".price", ".title"],
    "items": [
      {"title": "Example Product", "price": "$299", "url": "https://example.com/product/1"}
    ]
  },
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "success": true,
  "metadata": {
    "selectors": [".product-card", ".price", ".title"],
    "itemCount": 1
  },
  "savedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "version": "1.0"
}
EOF

# DeepScrape example
cat > /tmp/mexa-modules-structure/extraction/deepscrape/$(date +%Y-%m-%d)/example.json << 'EOF'
{
  "module": "deepscrape",
  "url": "https://www.farfetch.com/shopping/women/items.aspx",
  "data": {
    "elements": [
      {"selector": ".product-card", "type": "text"},
      {"selector": ".price", "type": "text"}
    ],
    "extractedData": [
      {"element": "product-card", "value": "Example Product"},
      {"element": "price", "value": "$299"}
    ]
  },
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "success": true,
  "metadata": {
    "elements": [
      {"selector": ".product-card", "type": "text"},
      {"selector": ".price", "type": "text"}
    ],
    "depth": 2,
    "extractedCount": 2
  },
  "savedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "version": "1.0"
}
EOF

# Configuraciones por módulo
cat > /tmp/mexa-modules-structure/config/browser-mcp/config.json << 'EOF'
{
  "module": "browser-mcp",
  "version": "1.0",
  "settings": {
    "timeout": 30000,
    "retries": 3,
    "fingerprinting": {
      "level": "medium",
      "ttl": 60
    },
    "viewport": {
      "width": 1366,
      "height": 768
    }
  },
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
}
EOF

cat > /tmp/mexa-modules-structure/config/scraperr/config.json << 'EOF'
{
  "module": "scraperr",
  "version": "1.0",
  "settings": {
    "timeout": 30000,
    "retries": 2,
    "selectors": {
      "product": ".product-card",
      "price": ".price",
      "title": ".title",
      "image": ".product-image img"
    }
  },
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
}
EOF

cat > /tmp/mexa-modules-structure/config/deepscrape/config.json << 'EOF'
{
  "module": "deepscrape",
  "version": "1.0",
  "settings": {
    "timeout": 45000,
    "maxDepth": 3,
    "elements": [
      {"selector": ".product-card", "type": "text"},
      {"selector": ".price", "type": "text"},
      {"selector": ".title", "type": "text"}
    ]
  },
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
}
EOF

# Subir estructura a MinIO
echo "📤 Subiendo estructura de directorios a MinIO..."
./mc cp --recursive /tmp/mexa-modules-structure/ mexa-local/mexa-data/

# Crear archivo de documentación de la estructura
cat > /tmp/mexa-structure-docs.md << 'EOF'
# Estructura de MinIO para Módulos de Extracción

## Estructura de Directorios

```
mexa-data/
├── extraction/                 # Datos extraídos por módulos
│   ├── browser-mcp/           # Datos de Browser-MCP
│   │   └── YYYY-MM-DD/        # Organizados por fecha
│   │       └── timestamp-id.json
│   ├── scraperr/              # Datos de Scraperr
│   │   └── YYYY-MM-DD/
│   │       └── timestamp-id.json
│   ├── deepscrape/            # Datos de DeepScrape
│   │   └── YYYY-MM-DD/
│   │       └── timestamp-id.json
│   └── custom/                # Módulos personalizados
│       └── YYYY-MM-DD/
├── sessions/                   # Sesiones por módulo
│   ├── browser-mcp/           # Sesiones de navegador
│   ├── scraperr/              # Sesiones de scraping
│   └── deepscrape/            # Sesiones de deep scraping
├── config/                     # Configuraciones por módulo
│   ├── browser-mcp/
│   ├── scraperr/
│   └── deepscrape/
└── telegram/                   # Datos de Telegram (existente)
    ├── offers/
    └── users/
```

## Formato de Datos por Módulo

### Browser-MCP
- Incluye fingerprinting, viewport, user agent
- Metadatos de sesión del navegador
- Datos extraídos con contexto de navegación

### Scraperr
- Selectores utilizados
- Datos estructurados extraídos
- Conteo de elementos encontrados

### DeepScrape
- Elementos configurados para extracción
- Profundidad de scraping
- Datos extraídos con jerarquía

## APIs Disponibles

- `saveModuleData(moduleData)` - Guardar datos de cualquier módulo
- `saveBrowserMCPData(data, url, success, error?)` - Específico para Browser-MCP
- `saveScaperrData(data, url, success, error?)` - Específico para Scraperr
- `saveDeepScrapeData(data, url, success, error?)` - Específico para DeepScrape
- `listModuleData(module, limit?)` - Listar datos por módulo
- `getModuleStats(module)` - Estadísticas por módulo
EOF

./mc cp /tmp/mexa-structure-docs.md mexa-local/mexa-data/README.md

# Limpiar archivos temporales
rm -rf /tmp/mexa-modules-structure
rm -f /tmp/mexa-structure-docs.md

echo "✅ Estructura de MinIO configurada para múltiples módulos!"
echo "📊 Estructura disponible:"
echo "   - extraction/browser-mcp/"
echo "   - extraction/scraperr/"
echo "   - extraction/deepscrape/"
echo "   - extraction/custom/"
echo "   - sessions/ (por módulo)"
echo "   - config/ (por módulo)"
echo ""
echo "🔗 Accede a MinIO Console: http://localhost:9003"
echo "   Usuario: minioadmin"
echo "   Contraseña: minioadmin123"
