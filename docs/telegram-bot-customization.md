# 🤖 Personalización del Bot de Telegram MeXa

## 📋 **Resumen**

Esta guía explica cómo personalizar la imagen y apariencia del bot de Telegram MeXa, incluyendo el uso del logo corporativo en mensajes y la configuración del avatar del bot.

## 🎨 **Opciones de Personalización**

### **1. 🖼️ Logo en Mensajes (✅ IMPLEMENTADO)**

**Ubicación**: `src/telegram-bot/index.ts`

**Características implementadas**:
- ✅ Carga automática del logo desde `public/assets/logo-mexa.svg`
- ✅ Conversión SVG a PNG (200x67 píxeles)
- ✅ Uso en mensaje de bienvenida (`/start`)
- ✅ Uso en mensaje de ayuda (`/help`)
- ✅ Uso en inicio de búsqueda (`/search`)
- ✅ Fallback a texto si falla la imagen

**Código clave**:
```typescript
// Cargar logo al inicializar
private async loadLogo(): Promise<void> {
  const logoPath = join(process.cwd(), 'public', 'assets', 'logo-mexa.svg');
  this.logoBuffer = await sharp(svgBuffer)
    .resize(200, 67)
    .png()
    .toBuffer();
}

// Usar en mensajes
await this.bot.sendPhoto(chatId, this.logoBuffer, {
  caption: message,
  parse_mode: 'Markdown'
});
```

### **2. 👤 Avatar del Bot (⚠️ MANUAL)**

**Limitación**: Solo se puede cambiar desde @BotFather, no desde código.

**Proceso**:
1. **Convertir logo a imagen**:
   ```bash
   # Usar herramienta online o comando
   inkscape --export-png=logo-512x512.png --export-width=512 --export-height=512 public/assets/logo-mexa.svg
   ```

2. **Configurar en BotFather**:
   - Abrir @BotFather en Telegram
   - Enviar `/setuserpic`
   - Seleccionar tu bot
   - Subir imagen (512x512 píxeles recomendado)

### **3. 🌐 Mini App (✅ DISPONIBLE)**

**Ubicación**: `src/pages/telegram-app.tsx`

**Logo ya disponible en**:
- Header de la mini app
- Footer de la mini app
- Componentes de interfaz

**Uso**:
```tsx
<img src="/assets/logo-mexa.svg" alt="MeXa" className="h-8" />
```

## 🔧 **Configuración Técnica**

### **Dependencias Requeridas**

```json
{
  "sharp": "^0.32.0",  // Para conversión SVG a PNG
  "fs": "built-in",    // Para lectura de archivos
  "path": "built-in"   // Para rutas de archivos
}
```

### **Estructura de Archivos**

```
public/
├── assets/
│   ├── logo-mexa.svg      # Logo principal (✅ EXISTE)
│   └── banner-mexa.svg    # Banner opcional (✅ EXISTE)
└── favicon.svg            # Favicon del sitio
```

### **Especificaciones del Logo**

**Logo actual (`logo-mexa.svg`)**:
- **Dimensiones**: 120x40 píxeles
- **Formato**: SVG con gradientes
- **Colores**: Gradiente azul-púrpura-rosa
- **Texto**: "MeXa" con efectos de brillo
- **Conversión**: 200x67 píxeles en PNG para Telegram

## 📱 **Uso en Telegram**

### **Comandos con Logo**

1. **`/start`** - Mensaje de bienvenida con logo
2. **`/help`** - Ayuda con logo
3. **`/search`** - Búsqueda con logo de marca

### **Ejemplo de Mensaje**

```
[IMAGEN: Logo MeXa]

🛍️ ¡Bienvenido a MeXa Bot!

Soy tu asistente personal para encontrar las mejores ofertas en Farfetch.

Comandos disponibles:
/search - Buscar ofertas
/filters - Configurar filtros
...
```

## 🎯 **Mejoras Futuras**

### **Posibles Implementaciones**

1. **🖼️ Logo en resultados de productos**
   - Watermark en imágenes de productos
   - Header en carrusel de ofertas

2. **🎨 Temas personalizados**
   - Colores corporativos en botones
   - Estilos de mensaje personalizados

3. **📊 Logo en estadísticas**
   - Gráficos con marca corporativa
   - Reportes con logo

### **Configuración Avanzada**

```typescript
// Configuración de logo personalizable
interface LogoConfig {
  enabled: boolean;
  size: { width: number; height: number };
  quality: number;
  watermark: boolean;
}

const logoConfig: LogoConfig = {
  enabled: true,
  size: { width: 200, height: 67 },
  quality: 90,
  watermark: false
};
```

## 🚀 **Estado Actual**

### ✅ **Implementado**
- Logo en mensajes principales
- Conversión automática SVG a PNG
- Fallback a texto si falla
- Carga automática al iniciar bot

### ⏳ **Pendiente**
- Avatar del bot (manual via BotFather)
- Logo en carrusel de productos
- Watermark en imágenes

### 🎉 **Resultado**

El bot MeXa ahora muestra el logo corporativo en:
- ✅ Mensaje de bienvenida
- ✅ Mensaje de ayuda  
- ✅ Inicio de búsquedas
- ✅ Mini app de Telegram

**¡El bot tiene ahora una identidad visual profesional con el logo MeXa!** 🎨✨
