# 📖 Guía Completa de Uso - Sistema Mexa

## 🚀 **Inicio Rápido**

### **1. Configuración Inicial**

```bash
# 1. Clonar y configurar
cd Mexa
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Iniciar servicios
npm run dev          # API y panel web
npm run bot          # Bot de Telegram (en otra terminal)
```

### **2. Configurar Bot de Telegram**

1. **Crear bot**: Habla con [@BotFather](https://t.me/BotFather) en Telegram
2. **Obtener token**: Copia el token que te da BotFather
3. **Configurar**: Agrega el token en `.env` como `TELEGRAM_BOT_TOKEN`

---

## 🎛️ **Panel de Administración**

### **Acceso**: `http://localhost:3000/admin`

#### **Dashboard Principal** (`/admin`)
- **Estado del sistema** en tiempo real
- **Configuración de credenciales** de Farfetch
- **Pruebas de workflows** con un clic
- **Acciones rápidas** para APIs

#### **Gestión de Logs** (`/admin/logs`)
- **Logs en tiempo real** de todos los componentes
- **Filtros** por nivel (error, warn, info, debug)
- **Búsqueda** por texto en logs
- **Exportación** de logs a archivo

#### **Gestión de Workflows** (`/admin/workflows`)
- **Ejecutar workflows** con parámetros personalizados
- **Monitorear progreso** en tiempo real
- **Historial** de ejecuciones
- **Cancelar** workflows en ejecución

#### **Gestión de Cache** (`/admin/cache`)
- **Estadísticas** de rendimiento del cache
- **Control de memoria** utilizada
- **Invalidar cache** por patrones
- **Entradas más populares**

---

## 🤖 **Bot de Telegram**

### **Comandos Disponibles**

#### **Comandos Básicos**
- `/start` - Iniciar el bot y ver bienvenida
- `/help` - Mostrar ayuda completa
- `/estado` - Ver estado del sistema

#### **Gestión de Ofertas**
- `/ofertas` - Ver catálogo de ofertas con navegación
- `/filtros` - Configurar filtros de búsqueda
- `/favoritos` - Gestionar ofertas favoritas

#### **Configuración**
- `/login` - Configurar credenciales de Farfetch

### **Funcionalidades Avanzadas**

#### **Navegación de Ofertas**
- **Paginación**: Navega con botones ⬅️ ➡️
- **Filtros**: Precio, marca, descuento
- **Favoritos**: Guarda ofertas con ❤️
- **Enlaces directos**: Botón 🛒 para ver en Farfetch

#### **Sistema de Favoritos**
- **Agregar**: Presiona ❤️ en cualquier oferta
- **Ver**: Usa `/favoritos` para gestionar
- **Buscar similares**: Encuentra ofertas parecidas

---

## 🔧 **API REST**

### **Endpoints Principales**

#### **Autenticación**
```bash
POST /api/auth/login
{
  "email": "tu@email.com",
  "password": "tupassword"
}
```

#### **Ofertas**
```bash
GET /api/offers/latest?limit=10&maxPrice=500&brand=Nike
```

#### **Scraping**
```bash
POST /api/scraping/start
{
  "url": "https://www.farfetch.com/shopping/women/items.aspx",
  "filters": { "maxPrice": 500 }
}
```

#### **Workflows**
```bash
POST /api/workflows/execute
{
  "workflowName": "scraping-flow",
  "params": { "email": "...", "password": "..." }
}
```

#### **Estado del Sistema**
```bash
GET /api/health
GET /api/proxies/status
GET /api/cache/stats
```

### **Documentación Completa**
- **Swagger UI**: `http://localhost:3000/api/docs`
- **Ejemplos interactivos** y esquemas completos

---

## ⚙️ **Workflows Disponibles**

### **1. auth-flow** - Autenticación
```yaml
# Parámetros
email: string
password: string
fingerprintLevel: 'low' | 'medium' | 'high'
```

### **2. scraping-flow** - Scraping Completo
```yaml
# Parámetros
email: string
password: string
scrapeUrl: string
maxRetries: number
filters: object
```

### **3. proxy-rotation** - Gestión de Proxies
```yaml
# Parámetros
rotationCount: number
delayBetweenRotations: number
```

### **4. monitoring** - Monitoreo del Sistema
```yaml
# Parámetros
checkInterval: number
maxChecks: number
```

---

## 🚀 **Optimizaciones Implementadas**

### **Sistema de Cache**
- **Ofertas**: 5 minutos de cache
- **Health checks**: 30 segundos
- **Sesiones**: 30 minutos
- **Invalidación automática** y manual

### **Bot Optimizado**
- **Paginación inteligente**: 5 ofertas por página
- **Navegación rápida**: Botones de primera/última página
- **Favoritos persistentes**: Guardado automático
- **Respuestas rápidas**: Cache de ofertas

### **Panel de Admin**
- **Tiempo real**: Actualización cada 5-10 segundos
- **Acciones directas**: Sin necesidad de línea de comandos
- **Visualización clara**: Métricas y gráficos
- **Gestión completa**: Todos los aspectos del sistema

---

## 🔍 **Casos de Uso Comunes**

### **Usuario Final (Telegram)**
1. **Configurar**: `/login` con credenciales
2. **Filtrar**: `/filtros` para establecer preferencias
3. **Buscar**: `/ofertas` para ver catálogo
4. **Navegar**: Usar botones de paginación
5. **Guardar**: ❤️ en ofertas favoritas
6. **Gestionar**: `/favoritos` para ver guardadas

### **Administrador (Panel Web)**
1. **Monitorear**: Dashboard principal para estado
2. **Configurar**: Credenciales y parámetros
3. **Probar**: Workflows desde interfaz
4. **Depurar**: Logs en tiempo real
5. **Optimizar**: Gestión de cache

### **Desarrollador (API)**
1. **Integrar**: Endpoints REST documentados
2. **Automatizar**: Workflows programáticos
3. **Monitorear**: Health checks automáticos
4. **Escalar**: Cache y optimizaciones

---

## 🛠️ **Solución de Problemas**

### **Bot no responde**
1. Verificar token en `.env`
2. Comprobar que `npm run bot` esté ejecutándose
3. Ver logs en `/admin/logs`

### **Ofertas no aparecen**
1. Verificar credenciales en panel admin
2. Probar workflow de scraping manualmente
3. Revisar filtros configurados

### **Sistema lento**
1. Verificar estadísticas de cache en `/admin/cache`
2. Limpiar cache si es necesario
3. Revisar uso de memoria

### **Errores de conexión**
1. Verificar estado en `/api/health`
2. Comprobar configuración de proxies
3. Ver logs detallados

---

## 📊 **Métricas y Monitoreo**

### **Panel de Admin**
- **Servicios**: Estado de todos los componentes
- **Memoria**: Uso actual y límites
- **Cache**: Hit rate y estadísticas
- **Sesiones**: Usuarios activos del bot

### **Logs Detallados**
- **Niveles**: Error, Warning, Info, Debug
- **Módulos**: Orchestrator, Bot, API, Workflow, Proxy
- **Tiempo real**: Actualización automática
- **Exportación**: Descarga para análisis

### **API de Métricas**
- **Health**: `/api/health` - Estado general
- **Cache**: `/api/cache/stats` - Rendimiento
- **Bot**: `/api/bot/status` - Estado del bot

---

## 🎯 **Conclusión**

El sistema Mexa está **completamente implementado** y optimizado para uso local. Incluye:

✅ **Interfaz completa** - Bot de Telegram + Panel web  
✅ **API robusta** - 8 endpoints con cache  
✅ **Workflows automatizados** - 4 flujos YAML  
✅ **Monitoreo completo** - Logs, métricas, estado  
✅ **Optimizaciones** - Cache, paginación, favoritos  

**¡Listo para usar!** 🚀
