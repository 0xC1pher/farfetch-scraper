# 🤖 Configuración del Bot de Telegram MeXa

## 🚀 Configuración Rápida (5 minutos)

### **Paso 1: Crear el Bot**

1. **Abre Telegram** y busca `@BotFather`
2. **Envía** `/newbot`
3. **Nombre del bot:** `MeXa Shopping Assistant`
4. **Username:** `mexashoppingbot` (o similar, debe ser único)
5. **Copia el token** que te dé @BotFather

### **Paso 2: Configurar Automáticamente**

```bash
# Ejecutar script de configuración
npm run telegram:setup
```

El script te pedirá:
- ✅ **Token del bot** (obligatorio)
- ✅ **Tu Chat ID** (opcional, para funciones de admin)
- ✅ **Configuraciones por defecto** (precio máximo, descuentos)

### **Paso 3: Iniciar el Bot**

```bash
# Iniciar bot en modo desarrollo
npm run bot:dev

# O iniciar todo el sistema
npm run dev
```

---

## 🎯 Funcionalidades del Bot

### **📱 Comandos Disponibles**

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `/start` | Iniciar bot y ver bienvenida | `/start` |
| `/search` | Buscar ofertas de Farfetch | `/search` |
| `/filters` | Configurar filtros de búsqueda | `/filters` |
| `/favorites` | Ver productos favoritos | `/favorites` |
| `/status` | Estado del sistema (admins) | `/status` |
| `/help` | Mostrar ayuda | `/help` |

### **🎮 Mini App Integrada**

- **Botón "Abrir MeXa"** en el menú del bot
- **Carrusel estilo Tinder** para navegar ofertas
- **Gestos swipe** para like/pass
- **Sistema de favoritos** sincronizado
- **Filtros en tiempo real**

---

## 🔧 Configuración Manual (Opcional)

### **Configurar Comandos Manualmente**

Si el script automático falla, puedes configurar los comandos manualmente:

1. **Envía** `/setcommands` a @BotFather
2. **Selecciona tu bot**
3. **Pega estos comandos:**

```
start - Iniciar el bot y ver bienvenida
search - Buscar ofertas de Farfetch
filters - Configurar filtros de búsqueda
favorites - Ver productos favoritos
status - Estado del sistema
help - Mostrar ayuda y comandos
```

### **Configurar Mini App Manualmente**

1. **Envía** `/newapp` a @BotFather
2. **Selecciona tu bot**
3. **URL de la app:** `http://localhost:3000/telegram-app`
4. **Nombre:** `MeXa Shopping`
5. **Descripción:** `Encuentra las mejores ofertas de moda`

---

## 🧪 Testing del Bot

### **Pruebas Básicas**

```bash
# 1. Verificar que el bot responde
/start

# 2. Probar búsqueda de ofertas
/search

# 3. Abrir Mini App
# Usar botón "Abrir MeXa" en el menú

# 4. Probar filtros
/filters

# 5. Ver favoritos
/favorites
```

### **Pruebas Avanzadas**

```bash
# Verificar APIs del bot
curl http://localhost:3000/api/bot/status

# Ver estadísticas
curl http://localhost:3000/api/telegram/offers?chatId=YOUR_CHAT_ID

# Probar favoritos
curl -X POST http://localhost:3000/api/telegram/favorites \
  -H "Content-Type: application/json" \
  -d '{"chatId":"YOUR_CHAT_ID","offerId":"test_001"}'
```

---

## 🔍 Troubleshooting

### **❌ Bot no responde**

```bash
# Verificar token
echo $TELEGRAM_BOT_TOKEN

# Verificar que el bot esté corriendo
ps aux | grep bot

# Reiniciar bot
npm run bot:dev
```

### **❌ Mini App no carga**

```bash
# Verificar servidor
curl http://localhost:3000/telegram-app

# Verificar datos
curl http://localhost:3000/api/telegram/offers
```

### **❌ No hay ofertas**

```bash
# Generar datos de prueba
curl -X POST http://localhost:3000/api/telegram/generate-demo-data

# Verificar MinIO
curl http://localhost:9001
```

---

## 📊 URLs Importantes

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Bot** | `https://t.me/YOUR_BOT_USERNAME` | Tu bot en Telegram |
| **Mini App** | `http://localhost:3000/telegram-app` | Aplicación web |
| **Admin Panel** | `http://localhost:3000/admin` | Panel de administración |
| **MinIO Console** | `http://localhost:9001` | Gestión de datos |
| **APIs** | `http://localhost:3000/api/*` | APIs del sistema |

---

## 🎉 ¡Listo para Usar!

Una vez configurado, tu bot de Telegram estará completamente funcional con:

- ✅ **Comandos interactivos**
- ✅ **Mini App estilo Tinder**
- ✅ **Datos reales de ofertas**
- ✅ **Sistema de favoritos**
- ✅ **Filtros personalizables**
- ✅ **Integración completa con MeXa**

**¡Disfruta tu bot de shopping inteligente!** 🛍️
