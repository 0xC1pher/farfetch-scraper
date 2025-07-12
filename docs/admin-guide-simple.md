# 📱 Guía Simple de Administración - MeXa

## 🎯 ¿Qué es MeXa?

MeXa es un sistema inteligente que busca ofertas en Farfetch automáticamente y las envía a tu Telegram. Es como tener un asistente personal que revisa la tienda 24/7 y te avisa cuando encuentra buenas ofertas.

## 🏠 ¿Cómo Funciona?

Imagina que MeXa es como una oficina con 4 empleados especializados:

### 👨‍💼 **El Jefe (Orquestador)**
- Coordina a todo el equipo
- Decide quién hace qué trabajo
- Te muestra los resultados en una página web

### 🔐 **El Especialista en Acceso (Browser-MCP)**
- Se encarga de entrar a Farfetch con tu usuario y contraseña
- Guarda las "llaves" para no tener que entrar cada vez
- Cambia de "disfraz" para que no lo detecten

### 🕵️ **El Buscador (Scraperr)**
- Navega por las páginas de ofertas
- Busca productos y precios
- Recopila la información básica

### 🤖 **El Experto en IA (DeepScrape)**
- Entra en acción cuando las páginas son muy complicadas
- Usa inteligencia artificial para encontrar ofertas escondidas
- Es el "plan B" cuando los otros no pueden

### 📦 **El Almacén (MinIO)**
- Guarda toda la información encontrada
- Organiza las ofertas por fecha y categoría
- Mantiene tus preferencias y favoritos

## 🖥️ Panel de Control

### 📍 ¿Dónde Está?
Abre tu navegador y ve a: `http://localhost:3000/admin`

### 🎛️ ¿Qué Puedes Hacer?

#### 1. **Ver Logs en Tiempo Real**
- **¿Qué es?** Una ventana que te muestra lo que está pasando ahora mismo
- **¿Para qué sirve?** Para saber si todo funciona bien o si hay problemas
- **¿Cómo usarlo?**
  1. Haz clic en la pestaña "Logs"
  2. Presiona "Mostrar Logs en Tiempo Real"
  3. Verás mensajes como: "✅ Login exitoso" o "❌ Error de conexión"

#### 2. **Generar Ofertas de Prueba**
- **¿Qué es?** Un botón que crea ofertas falsas para probar
- **¿Para qué sirve?** Para verificar que todo funciona sin esperar ofertas reales
- **¿Cómo usarlo?**
  1. Busca el botón "Generar Logs de Prueba"
  2. Haz clic y verás actividad en los logs
  3. Aparecerán mensajes de todos los "empleados"

#### 3. **Ver el Estado del Sistema**
- **¿Qué es?** Indicadores que te dicen si cada parte funciona
- **¿Para qué sirve?** Para saber qué está bien y qué necesita atención
- **¿Cómo leerlo?**
  - 🟢 Verde = Todo bien
  - 🟡 Amarillo = Advertencia, pero funciona
  - 🔴 Rojo = Problema, necesita atención

## 📱 Mini App de Telegram

### 🎯 ¿Qué Es?
Una aplicación dentro de Telegram que muestra ofertas como si fuera Tinder - deslizas para ver más ofertas.

### 📍 ¿Dónde Está?
Ve a: `http://localhost:3000/telegram-app`

### 👆 ¿Cómo Usarla?
- **Deslizar a la derecha** ➡️ = Me gusta esta oferta
- **Deslizar a la izquierda** ⬅️ = No me interesa
- **Tocar el corazón** ❤️ = Guardar en favoritos
- **Tocar "Ver producto"** 👁️ = Ir a la página de Farfetch

## 🗄️ Almacén de Datos (MinIO)

### 📍 ¿Dónde Está?
Ve a: `http://localhost:9003`
- Usuario: `minioadmin`
- Contraseña: `***REMOVED***`

### 📁 ¿Qué Hay Guardado?

#### **Carpeta "telegram"**
- **offers/** = Todas las ofertas encontradas
- **users/** = Información de usuarios de Telegram
- **favorites/** = Ofertas que marcaste como favoritas

#### **Carpeta "scraping"**
- Datos sin procesar de las búsquedas
- Información técnica del proceso

#### **Carpeta "sessions"**
- "Llaves" para entrar a Farfetch
- Información del navegador

## 🚨 ¿Qué Hacer Si Algo No Funciona?

### 🔍 **Paso 1: Revisar los Logs**
1. Ve al panel de administración
2. Abre la pestaña "Logs"
3. Busca mensajes rojos (❌) que indican errores

### 🔄 **Paso 2: Reiniciar Servicios**
Si ves muchos errores, puedes reiniciar:

```bash
# Reiniciar el almacén de datos
docker restart minio-mexa

# Reiniciar el sistema principal
npm restart
```

### 📞 **Paso 3: Problemas Comunes**

#### **"No aparecen ofertas"**
- ✅ Verifica que MinIO esté funcionando (luz verde)
- ✅ Revisa que las credenciales de Farfetch sean correctas
- ✅ Genera ofertas de prueba para verificar el sistema

#### **"Los logs no se actualizan"**
- ✅ Refresca la página del navegador
- ✅ Verifica tu conexión a internet
- ✅ Reinicia el navegador

#### **"No puedo acceder al panel"**
- ✅ Verifica que la dirección sea `http://localhost:3000/admin`
- ✅ Asegúrate de que el sistema esté encendido
- ✅ Prueba con otro navegador

## ⚙️ Configuración Básica

### 📝 **Archivo de Configuración (.env)**
Este archivo contiene la configuración del sistema. Los valores importantes son:

```
# Tu email y contraseña de Farfetch
FF_EMAIL=tu_email@ejemplo.com
FF_PASSWORD=tu_contraseña_segura

# Configuración del almacén
MINIO_BUCKET=mexa-data

# Token de tu bot de Telegram (opcional)
TELEGRAM_BOT_TOKEN=tu_token_del_bot
```

### 🔧 **¿Cómo Cambiar la Configuración?**
1. Abre el archivo `.env` con un editor de texto
2. Cambia los valores que necesites
3. Guarda el archivo
4. Reinicia el sistema con `npm restart`

## 📊 **Entendiendo los Números**

### **En los Logs Verás:**
- **✅ Éxito** = Todo salió bien
- **⚠️ Advertencia** = Hay algo raro pero no es grave
- **❌ Error** = Algo salió mal y necesita atención
- **ℹ️ Información** = Solo te cuenta qué está pasando
- **🐛 Debug** = Información técnica detallada

### **En el Panel Verás:**
- **Ofertas procesadas** = Cuántas ofertas encontró
- **Tiempo de respuesta** = Qué tan rápido funciona
- **Errores** = Cuántos problemas hubo
- **Estado de servicios** = Si cada parte funciona

## 🎯 **Consejos para Usar MeXa**

### ✅ **Buenas Prácticas**
- Revisa los logs una vez al día
- Mantén las credenciales actualizadas
- Limpia los datos antiguos cada semana
- Haz copias de seguridad de tus favoritos

### ⚠️ **Qué Evitar**
- No cambies configuraciones si no estás seguro
- No borres archivos del almacén sin saber qué son
- No compartas tus credenciales de Farfetch
- No ejecutes múltiples búsquedas al mismo tiempo

### 🚀 **Para Obtener Mejores Resultados**
- Configura filtros específicos (precio, marca, categoría)
- Revisa las ofertas regularmente
- Marca como favoritas las que te interesen
- Usa la mini app de Telegram para una experiencia más fluida

## 📞 **¿Necesitas Ayuda?**

Si algo no funciona o tienes preguntas:
1. Revisa esta guía primero
2. Mira los logs para entender el problema
3. Intenta reiniciar el sistema
4. Si nada funciona, contacta al soporte técnico

¡MeXa está diseñado para ser fácil de usar! Con un poco de práctica, encontrarás las mejores ofertas sin esfuerzo. 🛍️✨
