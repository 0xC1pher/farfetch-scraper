# Estructura Final del Proyecto Mexa

## 📁 Estructura de Directorios

```
mexa/
├── src/                          # Código fuente principal
│   ├── orchestrator/            # Orquestador de módulos
│   ├── telegram-bot/            # Bot de Telegram
│   ├── utils/                   # Utilidades (moduleLoader)
│   ├── services/                # Servicios (logger, etc.)
│   ├── modules/                 # Módulos internos (MinIO)
│   ├── workflow-engine/         # Motor de workflows
│   └── pages/                   # Páginas Next.js
├── external/                    # Módulos externos
│   ├── browser-mcp/            # Módulo Browser-MCP
│   ├── scraperr/               # Módulo Scraperr  
│   └── deepscrape/             # Módulo DeepScrape
├── scripts/                     # Scripts de automatización
├── workflows/                   # Definiciones de workflows
├── bin/                        # Binarios (MinIO)
└── public/                     # Archivos estáticos
```

## 🔧 Scripts Principales

- `npm run dev` - Desarrollo con auto-start
- `npm run start` - Producción con auto-start
- `npm run bot` - Solo bot de Telegram
- `node scripts/auto-start.mjs` - Iniciar servicios

## 📊 Módulos Activos

1. **Browser-MCP** - Scraping con navegador real
2. **Scraperr** - Scraping alternativo
3. **DeepScrape** - Scraping profundo
4. **MinIO** - Almacenamiento de datos
5. **Telegram Bot** - Interfaz de usuario

## 🗄️ Almacenamiento

- **Local**: `data/scraping/` - Datos de scraping por módulo
- **MinIO**: Bucket `mexa-data` - Almacenamiento persistente

Generado: 2025-07-16T04:45:33.305Z
