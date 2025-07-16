# 🔄 Guía de Ejecución de los 3 Módulos de Scraping

## 📋 Resumen

El sistema ahora ejecuta **simultáneamente** los 3 módulos de scraping (Browser-MCP, Scraperr, DeepScrape) y cada uno guarda sus datos estructurados en MinIO de forma independiente.

## 🏗️ Arquitectura del Flujo

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ORQUESTADOR   │───▶│   3 MÓDULOS      │───▶│     MINIO       │
│                 │    │   EN PARALELO    │    │   ESTRUCTURADO  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼───┐ ┌───▼───┐ ┌───▼────┐
            │Browser-MCP│ │Scraperr│ │DeepScrp│
            └───────────┘ └───────┘ └────────┘
                    │         │         │
                    ▼         ▼         ▼
            ┌─────────────────────────────────┐
            │        MinIO Buckets            │
            │ /scraping/browser-mcp/          │
            │ /scraping/scraperr/             │
            │ /scraping/deepscrape/           │
            │ /scraping/consolidated/         │
            └─────────────────────────────────┘
```

## 🔧 Cambios Implementados

### 1. **Orquestador Modificado** (`src/orchestrator/index.ts`)

- ✅ **Ejecución en paralelo** de los 3 módulos
- ✅ **Métodos específicos** para cada módulo:
  - `executeBrowserMCP()` - Ejecuta Browser-MCP y guarda datos
  - `executeScraperr()` - Ejecuta Scraperr y guarda datos  
  - `executeDeepScrape()` - Ejecuta DeepScrape y guarda datos
- ✅ **Guardado independiente** en MinIO por módulo
- ✅ **Consolidación final** de resultados únicos

### 2. **Estructura de Datos en MinIO**

```
bucket/
├── scraping/
│   ├── browser-mcp/
│   │   └── 2024-01-15/
│   │       └── 2024-01-15T10-30-00-123456.json
│   ├── scraperr/
│   │   └── 2024-01-15/
│   │       └── 2024-01-15T10-30-05-789012.json
│   ├── deepscrape/
│   │   └── 2024-01-15/
│   │       └── 2024-01-15T10-30-10-345678.json
│   └── consolidated/
│       └── 2024-01-15/
│           └── 2024-01-15T10-30-15-901234.json
```

### 3. **Schema de Datos por Módulo**

Cada módulo guarda datos con esta estructura:

```typescript
{
  url: string,
  selectors: string[],  // Selectores específicos del módulo
  data: {
    offers: Offer[],    // Ofertas extraídas
    timestamp: Date,
    totalFound: number,
    source: 'browser-mcp' | 'scraperr' | 'deepscrape' | 'consolidated'
  },
  timestamp: Date
}
```

## 🚀 Cómo Usar el Sistema

### 1. **Iniciar el Sistema**

```bash
# Asegurar que todos los servicios estén corriendo
npm run dev

# Verificar que MinIO esté activo
curl http://localhost:9010
```

### 2. **Ejecutar Scraping con los 3 Módulos**

```bash
# Via API
curl -X POST http://localhost:3000/api/scraping/start \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "scrapeUrl": "https://www.farfetch.com/shopping/men/shoes-2/items.aspx",
    "maxRetries": 1
  }'
```

### 3. **Verificar Resultados por Módulo**

```bash
# Browser-MCP
curl "http://localhost:3000/api/modules/data?module=browser-mcp&limit=5"

# Scraperr
curl "http://localhost:3000/api/modules/data?module=scraperr&limit=5"

# DeepScrape
curl "http://localhost:3000/api/modules/data?module=deepscrape&limit=5"

# Consolidado
curl "http://localhost:3000/api/modules/data?module=consolidated&limit=5"
```

## 🧪 Scripts de Verificación

### 1. **Verificar Ejecución de los 3 Módulos**

```bash
node test-three-modules.js
```

Este script:
- ✅ Ejecuta scraping con los 3 módulos
- ✅ Verifica que cada módulo guarde datos
- ✅ Muestra estadísticas por módulo
- ✅ Verifica datos consolidados

### 2. **Verificar Estructura en MinIO**

```bash
node verify-minio-structure.js
```

Este script:
- ✅ Verifica estructura de carpetas por módulo
- ✅ Analiza contenido de datos guardados
- ✅ Verifica integridad de datos
- ✅ Muestra distribución por fuente

### 3. **Rastrear Flujo Completo**

```bash
node trace-data-flow.js
```

Este script:
- ✅ Ejecuta flujo completo via API
- ✅ Verifica datos en cada paso
- ✅ Confirma accesibilidad de datos

## 📊 Monitoreo y Logs

### Logs del Orquestador

```
🎯 Ejecutando scraping con los 3 módulos en paralelo...
🌐 Ejecutando Browser-MCP para https://...
🔍 Ejecutando Scraperr para https://...
🤖 Ejecutando DeepScrape para https://...
📦 Browser-MCP: 15 ofertas guardadas en MinIO
📦 Scraperr: 12 ofertas guardadas en MinIO
📦 DeepScrape: 8 ofertas guardadas en MinIO
✅ Browser-MCP: 15 ofertas extraídas y guardadas
✅ Scraperr: 12 ofertas extraídas y guardadas
✅ DeepScrape: 8 ofertas extraídas y guardadas
🔍 Total: 35 ofertas → 28 únicas de 3 módulos
📦 Resumen consolidado guardado en MinIO
```

### APIs de Monitoreo

- **`/api/modules/stats`** - Estadísticas de todos los módulos
- **`/api/offers/latest`** - Últimas ofertas consolidadas
- **`/api/modules/data?module=X`** - Datos específicos por módulo

## 🔧 Configuración Avanzada

### Selectores por Módulo

Cada módulo usa selectores específicos optimizados:

```typescript
// Browser-MCP
selectors: ['[data-testid="product-card"]', '.product-item']

// Scraperr  
selectors: ['[data-component="ProductCard"]', '[data-component="ProductCardPrice"]', '.product-card']

// DeepScrape
selectors: ['[data-testid="product-card"]', '.product-item', '.offer-card']
```

### Timeouts por Módulo

```typescript
// Browser-MCP: 40 segundos
// Scraperr: 45 segundos  
// DeepScrape: 30 segundos
```

## ✅ Verificación de Funcionamiento

Para confirmar que todo funciona:

1. **Ejecutar**: `node test-three-modules.js`
2. **Verificar logs**: Debe mostrar "TODOS LOS MÓDULOS FUNCIONANDO CORRECTAMENTE"
3. **Verificar MinIO**: `node verify-minio-structure.js`
4. **Verificar APIs**: Cada módulo debe tener datos en `/api/modules/data?module=X`

## 🎯 Resultado Esperado

- ✅ **3 módulos ejecutándose simultáneamente**
- ✅ **Datos estructurados por módulo en MinIO**
- ✅ **Consolidación de ofertas únicas**
- ✅ **APIs accesibles por módulo específico**
- ✅ **Logs detallados de cada módulo**
