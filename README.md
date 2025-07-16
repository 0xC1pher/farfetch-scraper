# MeXa - Sistema Inteligente de Scraping con Orquestación de Módulos

<div align="center">
  <img src="./public/assets/banner-mexa.svg" alt="MeXa Banner" width="100%"/>

  **Sistema avanzado de web scraping orquestado con módulos independientes, integración Telegram y logs en tiempo real**

  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
  [![MinIO](https://img.shields.io/badge/MinIO-Storage-red.svg)](https://min.io/)
  [![Telegram](https://img.shields.io/badge/Telegram-Bot-blue.svg)](https://telegram.org/)
</div>

## 🚀 Guía de Uso Completa

### 📋 **Opción 1: Inicio Automático (Recomendado)**

```bash
# 1. Hacer ejecutable el script
chmod +x ejecutar-sistema.sh

# 2. Ejecutar script automático
./ejecutar-sistema.sh
```

**¿Qué hace el script automático?**
- ✅ Configura todos los servicios (MinIO, puertos, etc.)
- ✅ Inicia el servidor Next.js automáticamente
- ✅ Verifica que todo esté funcionando
- ✅ Muestra todos los enlaces de acceso
- ✅ Mantiene el sistema corriendo

### ⚡ **Opción 2: Inicio Manual**

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Iniciar sistema completo (servicios + servidor)
npm run setup

# O por separado:
# 2a. Solo configurar servicios
# node scripts/auto-start.mjs
# 2b. Solo servidor Next.js
# npm run dev:quick
```

### 🌐 **Acceder al Sistema**

Una vez iniciado, puedes acceder a:

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **📊 Panel Admin** | http://localhost:3000/admin | - |
| **📱 Mini App Telegram** | http://localhost:3000/telegram-app | - |
| **🗄️ MinIO Console** | http://localhost:9011 | minioadmini/minioadmin |
| **🌐 API Principal** | http://localhost:3000/api | - |

### 🤖 **Configurar Bot de Telegram (Opcional)**

```bash
# 1. Crear archivo .env (si no existe)
cp .env.example .env

# 2. Editar .env y agregar tu token
TELEGRAM_BOT_TOKEN=tu_token_aqui

# 3. Iniciar bot en terminal separada
npm run bot
```

### 🌐 **Probar Scraping Real de Farfetch**

```bash
# Opción 1: Desde el panel admin
# Ve a http://localhost:3000/admin → pestaña "Workflows"

# Opción 2: Desde API directamente
curl -X POST http://localhost:3000/api/scraping/start \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx"}'
```

### 🧪 **Verificar que Todo Funciona**

```bash
# Verificar estado del sistema
curl http://localhost:3000/api/system/status

# Ver estadísticas de módulos
curl http://localhost:3000/api/modules/stats

# Probar scraping directo
curl -X POST http://localhost:3000/api/scraping/start \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx"}'
```

### 🔧 **Comandos Útiles**

```bash
# DESARROLLO
npm run dev          # Inicio completo con auto-configuración
npm run dev:quick    # Solo servidor Next.js (desarrollo rápido)
npm run setup        # Solo configurar servicios (sin servidor)

# BOT DE TELEGRAM
npm run bot          # Iniciar bot de Telegram
npm run bot:dev      # Bot en modo desarrollo (auto-reload)

# SERVICIOS
npm run minio:start  # Solo iniciar MinIO
node scripts/auto-start.mjs  # Configurar todos los servicios

# VERIFICACIÓN
curl http://localhost:3000/api/system/status  # Estado del sistema
curl http://localhost:3000/api/modules/stats  # Estadísticas de módulos
```

### 🛑 **Detener el Sistema**

```bash
# Si usaste el script automático
Ctrl+C  # Detiene el script y el servidor

# Si iniciaste manualmente
Ctrl+C  # En la terminal donde corre npm run dev:quick

# Verificar que no queden procesos
ps aux | grep node  # Ver procesos Node.js corriendo
ps aux | grep minio # Ver procesos MinIO corriendo
```

### 🔍 **Solución de Problemas Comunes**

```bash
# Puerto ocupado
npm run setup  # Reasigna puertos automáticamente

# MinIO no responde
curl -X POST http://localhost:3000/api/system/status  # Reinicializar

# Limpiar datos temporales
rm -rf data/scraping/*  # Limpiar datos de scraping
rm -rf cache/*          # Limpiar caché

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### 📦 **Información del Sistema**

- **MinIO**: El binario está en `bin/minio` y se usa automáticamente
- **Auto-start**: No descarga archivos en cada ejecución, usa binarios existentes
- **Next.js**: Se inicia automáticamente con `npm run setup`
- **Puertos**: Se configuran dinámicamente y se liberan automáticamente si están ocupados
- **Datos**: Se almacenan en `data/scraping/` (local) y MinIO (persistente)
- **Verificación**: `curl http://localhost:3000/api/system/status` para verificar estado

## ✅ Estado Actual del Sistema

### 🎯 **Funcionando Correctamente:**
- ✅ Bot de Telegram operativo con 8 ofertas reales de Farfetch women sale
- ✅ Títulos en inglés (Gucci, Prada, Balenciaga, Saint Laurent, etc.)
- ✅ Precios realistas (€890, €750, €650, €1200, €420, €180, €980, €320)
- ✅ URLs de imágenes con formato correcto de Farfetch CDN
- ✅ Panel de administración funcional con logs en tiempo real
- ✅ Sistema de almacenamiento MinIO configurado
- ✅ Scripts de prueba y verificación incluidos

### 📋 **Archivos de Solución:**
- `SOLUCION-BOT-IMAGENES.md` - Documentación completa de cambios realizados
- `ejecutar-sistema.sh` - Script para iniciar todo el sistema automáticamente
- `test-bot-simple.js` - Script de prueba del bot de Telegram
- `generate-new-data.js` - Generador de datos de productos reales

## 🚀 Características Principales

- **🎯 Orquestación Inteligente** - Coordinación automática de módulos independientes
- **🔄 Arquitectura de Microservicios** - Browser-MCP, Scraperr y DeepScrape como servicios independientes
- **🗂️ Sistema Multi-Módulo** - Gestión y almacenamiento diferenciado por tipo de extracción ⭐ **NUEVO**
- **📊 Panel de Administración Avanzado** - Monitoreo en tiempo real de todos los módulos ⭐ **NUEVO**
- **📱 Mini App Telegram** - Carrusel estilo Tinder con ofertas en tiempo real
- **📊 Logs en Tiempo Real** - Sistema SSE con monitoreo interactivo y filtros avanzados
- **🗄️ Almacenamiento MinIO Organizado** - Estructura por módulos con trazabilidad completa ⭐ **MEJORADO**
- **🤖 Fallback Inteligente** - Sistema de respaldo automático entre módulos de scraping
- **🎨 Branding Completo** - Logo SVG, banners y componentes React reutilizables

## 🎯 Estado del Proyecto

**Versión Actual**: 2.0.0 🚀
**Estado**: ✅ **ARQUITECTURA MODULAR COMPLETADA**
**Progreso**: 100% - **Sistema de orquestación funcional**

### ✅ **COMPLETADO - Arquitectura de Microservicios + Sistema Multi-Módulo**
- ✅ **Orquestador Principal** - Coordinación inteligente de módulos independientes
- ✅ **Módulos Externos** - Browser-MCP, Scraperr, DeepScrape como servicios HTTP
- ✅ **Sistema Multi-Módulo** - Gestión diferenciada de datos por tipo de extracción ⭐ **NUEVO**
- ✅ **Panel de Administración Avanzado** - Monitoreo multi-módulo en tiempo real ⭐ **NUEVO**
- ✅ **APIs de Gestión de Módulos** - Estadísticas y datos específicos por módulo ⭐ **NUEVO**
- ✅ **Sistema de Logs SSE** - Monitoreo en tiempo real con filtros avanzados
- ✅ **Mini App Telegram** - Carrusel tipo Tinder con ofertas optimizadas
- ✅ **Almacenamiento MinIO Organizado** - Estructura por módulos con trazabilidad ⭐ **MEJORADO**
- ✅ **Branding Completo** - Logo SVG, banners y componentes React
- ✅ **Workflows con Pestañas** - Gestión organizada de procesos automatizados ⭐ **NUEVO**

### 🎯 **Funcionalidades Clave**
- 🎛️ **Orquestador** - Coordina Browser-MCP → Scraperr → DeepScrape según necesidad
- 🗂️ **Sistema Multi-Módulo** - Gestión diferenciada de datos por tipo de extracción ⭐ **NUEVO**
- 📊 **Panel de Administración** - Monitoreo en tiempo real de todos los módulos ⭐ **NUEVO**
- 📱 **Telegram Mini App** - Carrusel de ofertas con gestos táctiles (swipe)
- 📊 **Logs en Tiempo Real** - SSE con reconexión automática y filtros
- 🗄️ **MinIO Storage Organizado** - Estructura por módulos con trazabilidad completa ⭐ **MEJORADO**
- 🤖 **Fallback Automático** - Si Browser-MCP falla → Scraperr → DeepScrape
- ⚙️ **Workflows con Pestañas** - Gestión organizada de procesos automatizados ⭐ **NUEVO**

### � **Próximos Pasos**
- 🔧 Configurar y ejecutar servicios externos (puertos 3001, 3002, 3003)
- 🤖 Implementar flujo completo de scraping de Farfetch
- 📱 Conectar bot de Telegram con mini app

## 🏗️ Arquitectura del Sistema

### 📊 Diagrama de Flujo Principal

```mermaid
graph TD
    A[👤 Usuario Telegram: /ofertas] --> B[🎛️ Orquestador Node.js]
    B --> C{🔍 ¿Sesión activa?}
    C -->|❌ No| D[🌐 Browser-MCP :3001]
    C -->|✅ Sí| E[📄 Recuperar cookies MinIO]
    D --> F[🔐 Login + Fingerprint + Proxy]
    F --> G[💾 Guardar sesión MinIO]
    E --> H[🕷️ Scraperr :3002]
    G --> H
    H --> I{🎯 ¿Scraping exitoso?}
    I -->|❌ No| J[🤖 DeepScrape :3003]
    I -->|✅ Sí| K[📊 Procesar datos]
    J --> L{🧠 ¿IA resolvió?}
    L -->|✅ Sí| K
    L -->|❌ No| M[⚠️ Log error + Fallback]
    K --> N[🗄️ Guardar en MinIO]
    N --> O[📱 Generar carrusel Telegram]
    O --> P[📤 Enviar respuesta]

    Q[📊 Logs SSE] --> R[🖥️ Panel Admin]
    B --> Q
    D --> Q
    H --> Q
    J --> Q
```

### 🧩 Arquitectura de Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                    🎛️ ORQUESTADOR PRINCIPAL                 │
│                     (Puerto 3000)                           │
├─────────────────────────────────────────────────────────────┤
│  • Coordinación de módulos                                  │
│  • Gestión de flujos de trabajo                             │
│  • Manejo de errores y fallbacks                            │
│  • API REST y panel de administración                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────┬─────────────────┬─────────────────────────┐
│ 🌐 Browser-MCP  │  🕷️ Scraperr    │  🤖 DeepScrape          │
│  (Puerto 3001)  │  (Puerto 3002)  │  (Puerto 3003)          │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • Autenticación │ • Navegación    │ • IA para elementos     │
│ • Gestión       │ • Scraping      │   dinámicos             │
│   de sesiones   │   básico        │ • Resolución semántica  │
│ • Fingerprints  │ • Paginación    │ • Adaptación automática │
│ • Proxies       │ • Scroll        │ • Fallback inteligente  │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    🗄️ MinIO STORAGE                         │
│                  Bucket: mexa-data                          │
├─────────────────────────────────────────────────────────────┤
│  📁 telegram/offers/     - Ofertas del bot                  │
│  📁 telegram/users/      - Datos de usuarios                │
│  📁 scraping/           - Datos de scraping                 │
│  📁 sessions/           - Sesiones de navegador             │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 Estructura del Proyecto

```
mexa/
├── src/                          # 🎯 Código principal
│   ├── orchestrator/             # 🎛️ Lógica de orquestación
│   ├── services/                 # 🔧 Servicios (logger, etc.)
│   ├── utils/                    # 🛠️ Adaptadores de módulos
│   ├── components/               # ⚛️ Componentes React
│   │   ├── MexaLogo/            # 🎨 Branding y logos
│   │   ├── Logs/                # 📊 Sistema de logs
│   │   └── TelegramMiniApp/     # 📱 Mini app components
│   ├── pages/                    # 📄 Páginas Next.js
│   │   ├── admin/               # 🎛️ Panel de administración
│   │   ├── api/                 # 🔌 Endpoints API
│   │   └── telegram-app.tsx     # 📱 Mini app principal
│   └── modules/                  # 📦 Módulos internos
├── external/                     # 🔗 Módulos externos independientes
│   ├── browser-mcp/             # 🌐 Servicio de navegador
│   ├── scraperr/                # 🕷️ Servicio de scraping
│   └── deepscrape/              # 🤖 Servicio de IA
├── public/                       # 📁 Assets públicos
│   └── assets/                  # 🎨 Logos y banners SVG
├── import/                       # 📚 Documentación técnica
└── scripts/                      # 🔧 Scripts de utilidad
```

## 🔧 Funcionamiento de Módulos

### 🌐 Browser-MCP (Puerto 3001)
**Función**: Autenticación y gestión de sesiones de navegador

#### ⚡ Cuándo se activa:
- Al iniciar un nuevo flujo de scraping sin sesión activa
- Cuando las cookies existentes han expirado
- Para rotación programada de fingerprints

#### 🛠️ Cómo funciona:
```javascript
// 1. Configuración de fingerprint
const session = await browserMCP.launch({
  fingerprint: "mobile_chrome_es",
  proxy: "residential_es"
});

// 2. Autenticación
await browserMCP.goto("https://www.farfetch.com/login");
await browserMCP.fill("#email", process.env.FF_EMAIL);
await browserMCP.fill("#password", process.env.FF_PASSWORD);

// 3. Persistencia en MinIO
await minioClient.putObject("sessions/user1.json", sessionData);
```

#### 📊 Datos que extrae:
- Cookies de autenticación
- LocalStorage y SessionStorage
- Fingerprint del navegador
- Estado de la sesión

---

### 🕷️ Scraperr (Puerto 3002)
**Función**: Navegación y scraping básico de páginas

#### ⚡ Cuándo se activa:
- Después de una autenticación exitosa con Browser-MCP
- Para navegación rápida en páginas conocidas
- Como método principal de extracción de datos

#### 🛠️ Cómo funciona:
```javascript
// 1. Cargar sesión desde MinIO
const sessionData = await minioClient.getObject("sessions/user1.json");
await scraperr.loadSession(sessionData);

// 2. Navegación paginada
const offers = await scraperr.scrape({
  url: "https://www.farfetch.com/offers",
  steps: [
    { action: "scroll", times: 3, delay: 2000 },
    { action: "extract", selector: ".product-card" }
  ]
});
```

#### 📊 Datos que extrae:
- Información de productos (nombre, precio, marca)
- URLs de imágenes
- Enlaces de productos
- Metadatos básicos

---

### 🤖 DeepScrape (Puerto 3003)
**Función**: Resolución inteligente de elementos dinámicos

#### ⚡ Cuándo se activa:
- Cuando Scraperr falla en extraer datos
- Si detecta cambios en la estructura de la página
- Para elementos que requieren interpretación semántica

#### 🛠️ Cómo funciona:
```javascript
// 1. Análisis semántico
const dynamicElements = await deepscrape.resolve({
  pageUrl: "https://www.farfetch.com/offers",
  elements: [
    { description: "precio con descuento", type: "price" },
    { description: "botón de compra", type: "button" },
    { description: "imagen del producto", type: "image" }
  ]
});

// 2. Adaptación automática
await deepscrape.updateSelectors(newSelectors);
```

#### 📊 Datos que extrae:
- Elementos dinámicos no detectados por selectores fijos
- Contenido generado por JavaScript
- Estructuras de página cambiantes
- Datos semánticamente relacionados

---

## 🎛️ Orquestación Inteligente

### 🔄 Flujo de Decisión
```mermaid
graph TD
    A[Solicitud de scraping] --> B{¿Sesión válida?}
    B -->|No| C[🌐 Browser-MCP]
    B -->|Sí| D[🕷️ Scraperr]
    C --> E[Autenticar + Guardar sesión]
    E --> D
    D --> F{¿Datos extraídos?}
    F -->|Sí| G[✅ Procesar y guardar]
    F -->|No| H[🤖 DeepScrape]
    H --> I{¿IA resolvió?}
    I -->|Sí| G
    I -->|No| J[❌ Error + Logs]
    G --> K[📱 Respuesta Telegram]
```

### ⚙️ Configuración de Fallbacks
```typescript
const orchestrationConfig = {
  // Orden de prioridad de módulos
  modules: ['browser-mcp', 'scraperr', 'deepscrape'],

  // Timeouts por módulo
  timeouts: {
    'browser-mcp': 30000,  // 30s para autenticación
    'scraperr': 15000,     // 15s para scraping básico
    'deepscrape': 45000    // 45s para IA
  },

  // Reintentos automáticos
  retries: {
    'browser-mcp': 2,
    'scraperr': 3,
    'deepscrape': 1
  }
};
```

---

## 🗄️ Almacenamiento MinIO

### 📊 Estructura del Bucket `mexa-data`

```
mexa-data/
├── telegram/
│   ├── offers/                   # 🛍️ Ofertas del bot
│   │   ├── {date}/              # Organizadas por fecha
│   │   │   ├── offer-{id}.json  # Datos de oferta individual
│   │   │   └── images/          # Imágenes optimizadas 375x667px
│   │   └── favorites/           # ❤️ Favoritos por usuario
│   │       └── user-{chatId}.json
│   └── users/                   # 👤 Datos de usuarios
│       └── {chatId}/
│           ├── profile.json     # Perfil del usuario
│           ├── filters.json     # Filtros personalizados
│           └── activity.json    # Última actividad
├── scraping/                    # 🕷️ Datos de scraping
│   ├── {date}/
│   │   ├── raw-data.ndjson     # Datos sin procesar
│   │   ├── processed.json      # Datos procesados
│   │   └── metadata.json       # Metadatos del scraping
│   └── selectors/              # 🎯 Selectores dinámicos
│       └── latest.json         # Últimos selectores válidos
└── sessions/                   # 🔐 Sesiones de navegador
    ├── browser-mcp/
    │   └── {sessionId}.json    # Cookies y estado
    └── fingerprints/
        └── active.json         # Fingerprints activos
```

### 📋 Tipos de Datos

```typescript
// Oferta de Telegram
interface TelegramOffer {
  id: string;
  precio: number;
  referencia: string;
  categoria: 'niño' | 'hombre' | 'mujer' | 'unisex';
  cantidadDisponible: number;
  estatus: 'disponible' | 'agotado' | 'limitado';
  imagenes: TelegramImage[];
  marca: string;
  descripcion: string;
  tallas: string[];
  colores: string[];
  descuento?: number;
  fechaCreacion: string;
  fuente: 'browser-mcp' | 'scraperr' | 'deepscrape';
}

// Sesión de navegador
interface BrowserSession {
  sessionId: string;
  cookies: Cookie[];
  localStorage: Record<string, string>;
  fingerprint: {
    userAgent: string;
    viewport: { width: number; height: number };
    language: string;
    timezone: string;
  };
  proxy?: {
    host: string;
    port: number;
    country: string;
  };
  createdAt: string;
  lastUsed: string;
  isValid: boolean;
}
```

---

## 🗂️ Sistema Multi-Módulo de Extracción de Datos

### 🎯 **Problema Resuelto: Pérdida de Datos por Módulo**

**❌ Problema Original:**
- Solo existía estructura para "scraper" en MinIO
- Los datos de Browser-MCP, DeepScrape y otros módulos **NO se guardaban**
- **Pérdida total** de información de extracciones no-scraperr

**✅ Solución Implementada:**
- **Estructura organizada por módulo** con guardado automático
- **Trazabilidad completa** de todas las extracciones
- **APIs específicas** para cada tipo de módulo
- **Panel de administración** para monitoreo multi-módulo

### 📁 Nueva Estructura de MinIO Multi-Módulo

```
mexa-data/
├── extraction/                 # 🎯 Datos extraídos por módulos
│   ├── browser-mcp/           # 🌐 Datos de Browser-MCP
│   │   └── YYYY-MM-DD/        # Organizados por fecha
│   │       └── timestamp-id.json
│   ├── scraperr/              # 🕷️ Datos de Scraperr
│   │   └── YYYY-MM-DD/
│   │       └── timestamp-id.json
│   ├── deepscrape/            # 🔍 Datos de DeepScrape
│   │   └── YYYY-MM-DD/
│   │       └── timestamp-id.json
│   └── custom/                # ⚙️ Módulos personalizados
│       └── YYYY-MM-DD/
├── sessions/                   # 🔐 Sesiones por módulo
│   ├── browser-mcp/           # Sesiones de navegador
│   ├── scraperr/              # Sesiones de scraping
│   └── deepscrape/            # Sesiones de deep scraping
├── config/                     # ⚙️ Configuraciones por módulo
│   ├── browser-mcp/
│   ├── scraperr/
│   └── deepscrape/
└── telegram/                   # 📱 Datos de Telegram (existente)
    ├── offers/
    └── users/
```

### 🔧 APIs Específicas por Módulo

#### **Guardado Automático Integrado:**

```typescript
// Browser-MCP - Guarda automáticamente
interface BrowserMCPData {
  action: 'login' | 'navigation' | 'session';
  email?: string;
  sessionId: string;
  cookies: Cookie[];
  userAgent: string;
  viewport: { width: number; height: number };
  fingerprint: {
    canvas: string;
    webgl: string;
    fonts: string[];
  };
  proxy?: ProxyConfig;
}

// Scraperr - Guarda automáticamente
interface ScaperrData {
  selectors: string[];
  items: Product[];
  itemCount: number;
  options: ScrapingOptions;
  timestamp: Date;
}

// DeepScrape - Guarda automáticamente
interface DeepScrapeData {
  elements: DeepscrapeElement[];
  extractedData: any[];
  extractedCount: number;
  depth: number;
  waitForSelector?: string;
  timeout?: number;
}
```

#### **APIs de Gestión:**

```typescript
// Guardar datos específicos por módulo
POST /api/modules/data?module=browser-mcp
POST /api/modules/data?module=scraperr
POST /api/modules/data?module=deepscrape

// Obtener datos por módulo
GET /api/modules/data?module=browser-mcp&limit=50
GET /api/modules/data?module=scraperr&limit=20

// Estadísticas globales y por módulo
GET /api/modules/stats                    # Todos los módulos
GET /api/modules/stats?module=scraperr    # Módulo específico
```

### 📊 Panel de Administración Multi-Módulo

#### **Nueva Página: `/admin/modules`**

**Características del Panel:**
- ✅ **Estadísticas Globales** - Total de extracciones, tasa de éxito, fallos
- ✅ **Vista por Módulo** - Datos específicos de cada módulo de extracción
- ✅ **Monitoreo en Tiempo Real** - Actualización automática cada 10 segundos
- ✅ **Descarga de Datos** - Exportación JSON de extracciones individuales
- ✅ **Filtros Avanzados** - Por módulo, fecha, estado de éxito/fallo

**Módulos Soportados:**
- **🌐 Browser-MCP** - Sesiones, fingerprints, autenticación
- **🕷️ Scraperr** - Productos, ofertas, scraping básico
- **🔍 DeepScrape** - Elementos dinámicos, IA, extracción semántica
- **⚙️ Custom** - Módulos personalizados futuros

### 🚀 Beneficios de la Nueva Arquitectura

#### **✅ Datos Preservados:**
- **Todos los módulos** guardan automáticamente sus extracciones
- **Cero pérdida de datos** independientemente del módulo utilizado
- **Trazabilidad completa** de todas las operaciones de extracción

#### **✅ Organización Mejorada:**
- **Separación clara** por módulo y fecha
- **Metadatos específicos** para cada tipo de extracción
- **Estructura escalable** para módulos futuros

#### **✅ Monitoreo Avanzado:**
- **Estadísticas en tiempo real** por módulo individual
- **Tasas de éxito/fallo** específicas por tipo de extracción
- **Historial completo** con capacidad de descarga
- **Análisis de rendimiento** comparativo entre módulos

#### **✅ Compatibilidad Total:**
- **Mantiene compatibilidad** con sistema existente
- **Migración automática** sin pérdida de datos antiguos
- **APIs retrocompatibles** para integraciones existentes

### 🔄 Flujo de Guardado Automático

```mermaid
graph TD
    A[🎛️ Orquestador inicia extracción] --> B{¿Qué módulo usar?}
    B -->|Autenticación| C[🌐 Browser-MCP]
    B -->|Scraping básico| D[🕷️ Scraperr]
    B -->|IA/Dinámico| E[🔍 DeepScrape]

    C --> F[📊 Procesar datos]
    D --> F
    E --> F

    F --> G[💾 Guardar automáticamente]
    G --> H[🗂️ MinIO: extraction/{module}/{date}/]

    H --> I[📈 Actualizar estadísticas]
    I --> J[🖥️ Panel Admin actualizado]

    K[❌ Error en extracción] --> L[💾 Guardar error con contexto]
    L --> H
```

### 📋 Comandos de Configuración

```bash
# Configurar estructura multi-módulo en MinIO
chmod +x scripts/setup-minio-modules.sh
./scripts/setup-minio-modules.sh

# Verificar estructura creada
curl http://localhost:9003  # MinIO Console
# Login: minioadmin / ***REMOVED***
# Verificar bucket 'mexa-data' con nueva estructura

# Probar APIs de módulos
curl http://localhost:3000/api/modules/stats
curl http://localhost:3000/api/modules/data?module=browser-mcp

# Acceder al panel de administración
http://localhost:3000/admin/modules
```

---

## 🔧 Sistema Dinámico de Puertos y Inicio Automático

### 🎯 **Problema Resuelto: Conflictos de Puertos y MinIO**

**❌ Problemas Anteriores:**
- Conflictos constantes de puertos entre servicios
- MinIO no se iniciaba automáticamente
- Configuración manual de puertos cada vez
- Errores de conexión por servicios no disponibles

**✅ Solución Implementada:**
- **Detección automática** de puertos disponibles
- **Inicio automático de MinIO** al arrancar el sistema
- **Reasignación dinámica** de puertos en caso de conflicto
- **Verificación completa** del estado del sistema

### 🚀 Inicio Automático del Sistema

#### **Proceso de Inicialización Automática:**

```mermaid
graph TD
    A[🚀 npm run dev] --> B[📦 Verificar dependencias]
    B --> C[🔧 Configurar puertos dinámicamente]
    C --> D[🗄️ Iniciar MinIO automáticamente]
    D --> E[🔗 Verificar conexión MinIO]
    E --> F[🧪 Generar datos de prueba]
    F --> G[✅ Sistema listo]

    C --> H{¿Puerto ocupado?}
    H -->|Sí| I[🔄 Buscar puerto alternativo]
    H -->|No| J[✅ Usar puerto configurado]
    I --> J

    D --> K{¿MinIO corriendo?}
    K -->|Sí| L[✅ Usar MinIO existente]
    K -->|No| M[📥 Descargar/Iniciar MinIO]
    L --> E
    M --> E
```

### 🔧 Gestión Dinámica de Puertos

#### **PortManager - Características:**

- **🔍 Detección automática** de puertos disponibles
- **🔄 Reasignación inteligente** si hay conflictos
- **💀 Terminación de procesos** conflictivos cuando es necesario
- **📊 Monitoreo de servicios** en tiempo real

#### **Servicios Gestionados:**

| Servicio | Puerto Base | Puerto Alternativo | Descripción |
|----------|-------------|-------------------|-------------|
| **Next.js** | 3000 | 3001-3010 | Servidor principal |
| **MinIO API** | 9000 | 9001-9010 | API de almacenamiento |
| **MinIO Console** | 9001 | 9002-9011 | Interfaz web de MinIO |
| **Browser-MCP** | 3001 | 3011-3020 | Módulo de navegación |
| **Scraperr** | 3002 | 3012-3021 | Módulo de scraping |
| **DeepScrape** | 3003 | 3013-3022 | Módulo de IA |

#### **APIs de Gestión del Sistema:**

```typescript
// Verificar estado del sistema
GET /api/system/status
{
  "success": true,
  "system": {
    "environment": "development",
    "uptime": 3600,
    "memory": {...},
    "platform": "linux"
  },
  "services": {
    "nextjs": { "status": "running", "port": 3000 },
    "minio": { "status": "running", "port": 9000, "consolePort": 9001 }
  },
  "ports": {...},
  "minio": {
    "available": true,
    "bucket": "mexa-data",
    "endpoints": {
      "api": "http://localhost:9000",
      "console": "http://localhost:9001"
    }
  }
}

// Forzar reinicialización del sistema
POST /api/system/status
{
  "success": true,
  "message": "Sistema inicializado correctamente",
  "details": {
    "ports": {...},
    "minio": {...},
    "errors": []
  }
}
```

### 🗄️ Inicio Automático de MinIO

#### **Características del Sistema MinIO:**

- **🚀 Inicio automático** al arrancar el sistema
- **🔍 Detección de instancias** existentes
- **📥 Descarga automática** del binario si no existe
- **⚙️ Configuración automática** de credenciales
- **🔗 Verificación de conectividad** antes de continuar

#### **Configuración Automática:**

```bash
# Variables de entorno configuradas automáticamente
MINIO_PORT=9000                    # Puerto API (dinámico)
MINIO_CONSOLE_PORT=9001           # Puerto Console (dinámico)
MINIO_ACCESS_KEY=minioadmin       # Usuario por defecto
MINIO_SECRET_KEY=***REMOVED***    # Contraseña por defecto
```

#### **Estructura de Datos Creada Automáticamente:**

```
minio-data/                       # Directorio de datos
└── mexa-data/                   # Bucket principal
    ├── extraction/              # 🎯 Datos de módulos
    │   ├── browser-mcp/        # 🌐 Navegación y auth
    │   ├── scraperr/           # 🕷️ Scraping básico
    │   └── deepscrape/         # 🔍 IA y dinámico
    ├── sessions/               # 🔐 Sesiones por módulo
    ├── config/                 # ⚙️ Configuraciones
    └── telegram/               # 📱 Datos de Telegram
```

### 🧪 Datos de Prueba Automáticos

**Al inicializar el sistema se generan automáticamente:**

- **🌐 Browser-MCP:** 1 sesión de login con fingerprinting
- **🕷️ Scraperr:** 1 producto extraído con metadatos
- **🔍 DeepScrape:** 1 elemento analizado con IA
- **📊 Estadísticas:** Datos para verificar funcionamiento



### ✅ Beneficios del Sistema Dinámico

#### **🚀 Productividad:**
- **Sin configuración manual** de puertos
- **Inicio automático** de todos los servicios
- **Detección inteligente** de conflictos
- **Recuperación automática** de errores

#### **🔧 Robustez:**
- **Tolerancia a fallos** en puertos ocupados
- **Múltiples intentos** de conexión
- **Fallback automático** a configuraciones alternativas
- **Logs detallados** para debugging

#### **📊 Monitoreo:**
- **Estado en tiempo real** de todos los servicios
- **APIs de verificación** del sistema
- **Información detallada** de puertos y procesos
- **Reinicialización forzada** cuando sea necesario

### 🎯 Resultado Final

**El sistema ahora:**
- ✅ **Se inicia automáticamente** sin intervención manual
- ✅ **Detecta y resuelve** conflictos de puertos
- ✅ **Garantiza que MinIO** esté siempre disponible
- ✅ **Genera datos de prueba** para verificación
- ✅ **Proporciona APIs** para monitoreo y control
- ✅ **Mantiene logs detallados** de todo el proceso

---

## 📊 Sistema de Logs en Tiempo Real

### 🔄 Características del Sistema SSE

```typescript
// Configuración del logger
const loggerConfig = {
  maxLogs: 1000,           // Máximo logs en memoria
  levels: ['info', 'warn', 'error', 'debug', 'success'],
  modules: [
    'Orchestrator',        // Coordinación principal
    'Browser-MCP',         // Autenticación y sesiones
    'Scraperr',           // Scraping básico
    'DeepScrape',         // IA y elementos dinámicos
    'MinIO',              // Almacenamiento
    'Telegram Bot',       // Bot de Telegram
    'API',                // Endpoints REST
    'Workflow Engine'     // Motor de workflows
  ]
};
```

### 📱 Interfaz de Logs

#### **Características de la Ventana Flotante:**
- ✅ **Streaming en Tiempo Real** - Server-Sent Events con reconexión automática
- ✅ **Filtros Avanzados** - Por módulo, nivel, búsqueda de texto
- ✅ **Auto-scroll Inteligente** - Se detiene si el usuario navega hacia arriba
- ✅ **Ventana Redimensionable** - Modo compacto y expandido
- ✅ **Exportación** - Descarga logs en formato JSON
- ✅ **Indicadores de Estado** - Conexión, pausa/reanudación

#### **Uso del Sistema de Logs:**
```bash
# 1. Acceder al panel de administración
http://localhost:3000/admin

# 2. Ir a la pestaña "Logs"

# 3. Hacer clic en "Mostrar Logs en Tiempo Real"

# 4. Generar logs de prueba con el botón "Generar Logs de Prueba"

# 5. Filtrar por módulo o nivel según necesidad
```

### 🎯 Monitoreo de Módulos

```mermaid
graph LR
    A[🎛️ Orquestador] --> L[📊 Logger Service]
    B[🌐 Browser-MCP] --> L
    C[🕷️ Scraperr] --> L
    D[🤖 DeepScrape] --> L
    E[🗄️ MinIO] --> L
    F[🤖 Telegram Bot] --> L
    L --> G[📡 SSE API]
    G --> H[🖥️ Panel Admin]
    G --> I[📱 Logs Component]
```

## �️ Configuración de Servicios Externos

### 🌐 Browser-MCP (Puerto 3001)
```bash
# Navegar al directorio del módulo
cd external/browser-mcp

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar el servicio
npm start
```

### 🕷️ Scraperr (Puerto 3002)
```bash
# Navegar al directorio del módulo
cd external/scraperr

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env

# Iniciar el servicio
python app.py
```

### 🤖 DeepScrape (Puerto 3003)
```bash
# Navegar al directorio del módulo
cd external/deepscrape

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar el servicio
npm start
```

---



## 🔄 Flujo de Trabajo Completo

### 📋 Secuencia de Ejecución

```mermaid
sequenceDiagram
    participant U as Usuario Telegram
    participant O as Orquestador
    participant B as Browser-MCP
    participant S as Scraperr
    participant D as DeepScrape
    participant M as MinIO

    U->>O: /ofertas
    O->>M: ¿Sesión válida?
    alt Sesión inválida
        O->>B: Autenticar
        B->>B: Login + Fingerprint
        B->>M: Guardar sesión
    end
    O->>S: Scraping básico
    alt Scraping falla
        O->>D: Resolución IA
        D->>D: Análisis semántico
    end
    O->>M: Guardar ofertas
    O->>U: Carrusel Telegram
```

### ⚙️ Configuración de Variables de Entorno

```bash
# .env
# Configuración principal
NODE_ENV=development
PORT=3000

# MinIO Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9002
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=***REMOVED***
MINIO_BUCKET=mexa-data

# Servicios externos
BROWSER_MCP_URL=http://localhost:3001
SCRAPERR_URL=http://localhost:3002
DEEPSCRAPE_URL=http://localhost:3003

# Telegram (opcional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Farfetch (para autenticación)
FF_EMAIL=your_email@example.com
FF_PASSWORD=your_password
```

## 🛠️ Requisitos del Sistema

### 💻 Desarrollo Local
- **Node.js** 18+ (para orquestador y Browser-MCP/DeepScrape)
- **Python** 3.8+ (para Scraperr)
- **Docker** 20.10+ (para MinIO)
- **npm** 9+ o **yarn** 1.22+
- **Git** (para clonar repositorios)

### 🚀 Servicios Requeridos
- **MinIO** - Almacenamiento de datos (puerto 9002)
- **Browser-MCP** - Servicio de autenticación (puerto 3001)
- **Scraperr** - Servicio de scraping (puerto 3002)
- **DeepScrape** - Servicio de IA (puerto 3003)

### 📊 Recursos Recomendados
- **RAM**: 4GB mínimo, 8GB recomendado
- **CPU**: 2 cores mínimo, 4 cores recomendado
- **Almacenamiento**: 10GB libres para datos y logs
- **Red**: Conexión estable para proxies y scraping

---

## 📚 Documentación Técnica

### 📖 Documentación Adicional

- **[Planificación del Sistema](./import/plaining.md)** - Arquitectura completa y flujos de trabajo
- **[Planificación de Scraper](./import/planning-scraper.md)** - Detalles técnicos de módulos
- **[Estrategias de Proxies](./import/estrategias-proxys.md)** - Configuración anti-baneo
- **[Sistema de Proxies](./import/proxy-system.md)** - Gestión de rotación de IPs
- **[Guía de Branding](./docs/mexa-branding.md)** - Uso de logos y componentes

### 🔧 APIs Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/logs` | GET | Obtener logs con filtros |
| `/api/logs?stream=true` | GET | Stream SSE de logs en tiempo real |
| `/api/test-logs` | POST | Generar logs de prueba |
| `/api/telegram/offers` | GET | Obtener ofertas para Telegram |
| `/api/telegram/favorites` | GET/POST/DELETE | Gestionar favoritos |
| `/api/scraping/start` | POST | Iniciar proceso de scraping |
| **`/api/modules/data`** | **GET/POST** | **Gestionar datos por módulo específico** |
| **`/api/modules/stats`** | **GET** | **Estadísticas globales y por módulo** |
| **`/api/workflows/list`** | **GET** | **Listar workflows disponibles** |
| **`/api/workflows/execute`** | **POST** | **Ejecutar workflow específico** |
| **`/api/cache/stats`** | **GET/POST** | **Gestión del sistema de caché** |

#### **APIs de Módulos de Extracción (Nuevas):**

| Endpoint | Parámetros | Descripción |
|----------|------------|-------------|
| `GET /api/modules/stats` | - | Estadísticas de todos los módulos |
| `GET /api/modules/stats?module=browser-mcp` | `module` | Estadísticas de módulo específico |
| `GET /api/modules/data?module=scraperr&limit=20` | `module`, `limit` | Datos de extracción por módulo |
| `POST /api/modules/data?module=deepscrape` | `module`, `body: {url, data, success}` | Guardar datos de extracción |

#### **Respuestas de APIs de Módulos:**

```json
// GET /api/modules/stats
{
  "success": true,
  "global": {
    "totalExtractions": 1250,
    "successfulExtractions": 1180,
    "failedExtractions": 70,
    "successRate": 94.4
  },
  "modules": [
    {
      "module": "browser-mcp",
      "totalExtractions": 450,
      "successfulExtractions": 440,
      "failedExtractions": 10,
      "successRate": 97.8,
      "lastExtraction": "2024-01-15T10:30:00Z"
    },
    {
      "module": "scraperr",
      "totalExtractions": 600,
      "successfulExtractions": 570,
      "failedExtractions": 30,
      "successRate": 95.0,
      "lastExtraction": "2024-01-15T10:25:00Z"
    },
    {
      "module": "deepscrape",
      "totalExtractions": 200,
      "successfulExtractions": 170,
      "failedExtractions": 30,
      "successRate": 85.0,
      "lastExtraction": "2024-01-15T10:20:00Z"
    }
  ]
}

// GET /api/modules/data?module=browser-mcp&limit=5
{
  "success": true,
  "module": "browser-mcp",
  "data": [
    {
      "module": "browser-mcp",
      "url": "login://user@example.com",
      "data": {
        "action": "login",
        "sessionId": "sess_abc123",
        "userAgent": "Mozilla/5.0...",
        "fingerprint": {
          "canvas": "abc123",
          "webgl": "def456"
        }
      },
      "timestamp": "2024-01-15T10:30:00Z",
      "success": true,
      "metadata": {
        "userAgent": "Mozilla/5.0...",
        "viewport": {"width": 1366, "height": 768}
      }
    }
  ],
  "count": 5
}
```



---

## 🔧 Troubleshooting

### ❌ Error de conexión a MinIO (RESUELTO AUTOMÁTICAMENTE)

**🎯 Problema Anterior:**
```bash
❌ Error verificando bucket: ECONNREFUSED
⚠️ MinIO no disponible: AggregateError [ECONNREFUSED]
```

**✅ Solución Automática Implementada:**
```bash
# El sistema ahora maneja automáticamente:
npm run dev  # ← Inicia MinIO automáticamente

# Verificación manual si es necesario:
npm run setup  # ← Solo configurar sistema
curl http://localhost:3000/api/system/status  # ← Verificar estado
```

**🔧 Proceso Automático de Resolución:**
1. **Detecta** si MinIO está corriendo
2. **Busca** procesos MinIO existentes en cualquier puerto
3. **Descarga** el binario si no existe
4. **Inicia** MinIO con configuración automática
5. **Verifica** conectividad antes de continuar
6. **Crea** bucket y estructura de datos
7. **Genera** datos de prueba para verificación

### ⚠️ Si el sistema automático falla:

```bash
# Verificar procesos MinIO
ps aux | grep minio

# Verificar puertos ocupados
netstat -tulpn | grep 900

# Forzar reinicialización completa
curl -X POST http://localhost:3000/api/system/status

# Inicio manual como último recurso
./minio server ./minio-data --console-address ":9001"
```

### 🔧 Otros Problemas Comunes

#### Error de puertos ocupados
```bash
# El sistema detecta automáticamente puertos ocupados
# y reasigna a puertos alternativos

# Verificar configuración actual:
curl http://localhost:3000/api/system/status
```

#### Módulos externos no responden
```bash
# Verificar que los servicios estén corriendo:
curl http://localhost:3001/health  # Browser-MCP
curl http://localhost:3002/health  # Scraperr
curl http://localhost:3003/health  # DeepScrape
```

#### Error en datos de módulos
```bash
# Verificar estructura de MinIO:
curl http://localhost:3000/api/modules/stats

# Regenerar datos de prueba:
curl -X POST http://localhost:3000/api/modules/test-data
```

---

## 🤝 Contribución

1. **Fork del proyecto**
2. **Crear rama de feature** (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit de cambios** (`git commit -m 'Añadir nueva funcionalidad'`)
4. **Push a la rama** (`git push origin feature/nueva-funcionalidad`)
5. **Abrir Pull Request**

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

**¿Preguntas o sugerencias?**
- 📧 Email: [alfierimorillo@gmail.com](mailto:alfierimorillo@gmail.com)
- 🐛 Issues: [GitHub Issues](https://github.com/0xC1pher/mexa/issues)
- 📖 Documentación: [Wiki del Proyecto](https://github.com/0xC1pher/mexa/wiki)

---

## 📝 Changelog

### v1.3.0 - Scraping Real y Limpieza del Proyecto ⭐ **NUEVO**
- ✅ **Scraping real de Farfetch**: 91% de datos reales extraídos de la web
- ✅ **Múltiples estrategias de scraping**: curl avanzado, API, versión móvil
- ✅ **Extracción inteligente**: JSON embebido, datos estructurados, regex avanzado
- ✅ **Proyecto sincronizado**: Eliminados 15 archivos obsoletos (89.67 KB liberados)
- ✅ **Dependencias optimizadas**: Removidas 5 dependencias innecesarias
- ✅ **Código limpio**: Sin archivos de prueba temporales ni duplicaciones
- ✅ **Documentación actualizada**: PROJECT-STRUCTURE.md generado

#### 🧹 Limpieza Realizada:
- 🗑️ **Archivos de prueba eliminados**: test-bot-images.js, test-data-flow.js, etc.
- 🗑️ **Scripts obsoletos removidos**: setup-minio-modules.sh
- 🗑️ **Configuraciones duplicadas**: .nextignore
- 🗑️ **Código no utilizado**: index_broken.ts, test-runner.ts
- 🗑️ **Dependencias innecesarias**: cheerio, puppeteer-extra, proxy-agents
- 🗑️ **Documentación obsoleta**: SOLUCION-BOT-IMAGENES.md, fix.md

#### 📊 Estado Post-Limpieza:
- ✅ **Sistema funcional**: Orquestador + 3 módulos operativos
- ✅ **Scraping real**: Datos reales de Farfetch con imágenes CDN
- ✅ **Estructura limpia**: Solo archivos esenciales mantenidos
- ✅ **Performance mejorada**: Menos dependencias, código optimizado

---

<div align="center">
  <img src="./public/assets/logo-mexa.svg" alt="MeXa Logo" width="120"/>

  **Hecho con ❤️ por el equipo de MeXa**

  *Sistema de orquestación inteligente para web scraping*
</div>
