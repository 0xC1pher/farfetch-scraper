# 🎨 MeXa - Guía de Branding y Assets

## 📋 Resumen

Se han creado los assets de branding para MeXa, incluyendo logos SVG, banners y componentes React para usar en las mini apps de Telegram y otras interfaces.

## 🎯 Assets Creados

### 1. Logo Principal (`/public/assets/logo-mexa.svg`)
- **Dimensiones**: 120x40px
- **Formato**: SVG vectorial
- **Características**:
  - Gradiente púrpura-rosa (#667eea → #764ba2 → #f093fb)
  - Icono hexagonal decorativo
  - Texto "MeXa" con la X destacada en rosa
  - Fondo redondeado con borde sutil

### 2. Banner para Mini Apps (`/public/assets/banner-mexa.svg`)
- **Dimensiones**: 375x80px (optimizado para móviles)
- **Formato**: SVG vectorial
- **Características**:
  - Gradiente horizontal completo
  - Logo centrado con subtítulo "Ofertas Exclusivas"
  - Elementos decorativos sutiles
  - Efecto de brillo y glow

### 3. Favicon (`/public/favicon.svg`)
- **Dimensiones**: 32x32px
- **Formato**: SVG vectorial
- **Características**:
  - Versión circular del logo
  - Icono hexagonal simplificado
  - Optimizado para tamaños pequeños

## 🧩 Componentes React

### MexaLogo Component

```tsx
import MexaLogo from '../components/MexaLogo';

// Logo estándar
<MexaLogo variant="logo" size="medium" />

// Banner para headers
<MexaLogo variant="banner" size="medium" className="w-full" />
```

#### Props:
- `variant`: `'logo' | 'banner'` - Tipo de logo a mostrar
- `size`: `'small' | 'medium' | 'large'` - Tamaño del logo
- `className`: string - Clases CSS adicionales

#### Tamaños disponibles:

**Logo estándar:**
- `small`: 20x7 (w-20 h-7)
- `medium`: 30x10 (w-30 h-10) 
- `large`: 40x13 (w-40 h-13)

**Banner:**
- `small`: 64x12 (w-64 h-12)
- `medium`: 80x16 (w-80 h-16)
- `large`: 96x20 (w-96 h-20)

### MexaFooter Component

```tsx
import { MexaFooter } from '../components/MexaLogo';

// Footer completo con texto
<MexaFooter showText={true} />

// Footer solo con logo
<MexaFooter showText={false} />
```

#### Props:
- `className`: string - Clases CSS adicionales
- `showText`: boolean - Mostrar texto "Powered by MeXa" y bucket info

## 🎨 Paleta de Colores

```css
/* Gradiente principal */
--mexa-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);

/* Colores individuales */
--mexa-purple: #667eea;
--mexa-violet: #764ba2;
--mexa-pink: #f093fb;

/* Theme color para meta tags */
--mexa-theme: #667eea;
```

## 📱 Implementación en Telegram Mini App

El banner ya está implementado en la mini app de Telegram:

```tsx
// En src/pages/telegram-app.tsx
<div className="fixed top-0 left-0 right-0 z-50">
  <MexaLogo variant="banner" size="medium" className="w-full" />
</div>
```

### Características implementadas:
- ✅ Header fijo con banner MeXa
- ✅ Theme color actualizado (#667eea)
- ✅ Favicon SVG configurado
- ✅ Apple touch icon
- ✅ Espaciado ajustado para el carrusel

## 🗄️ Integración con MinIO

El sistema utiliza el bucket **`mexa-data`** para almacenar:

- **Ofertas de Telegram**: `telegram/offers/`
- **Datos de usuarios**: `telegram/users/`
- **Sesiones de scraping**: `scraping/`
- **Favoritos**: `telegram/favorites/`

Esta información se muestra sutilmente en el footer cuando `showText={true}`.

## 🚀 Uso en Otras Páginas

Para agregar branding a otras páginas:

```tsx
// En el head
<meta name="theme-color" content="#667eea" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

// En el header
<MexaLogo variant="banner" size="large" />

// En el footer
<MexaFooter showText={true} />
```

## 📐 Especificaciones Técnicas

- **Formato**: SVG vectorial (escalable sin pérdida)
- **Compatibilidad**: Todos los navegadores modernos
- **Optimización**: Gradientes CSS, filtros SVG
- **Accesibilidad**: Alt text y aria-labels incluidos
- **Performance**: Inline SVG para carga rápida

## 🎯 Próximos Pasos

1. **Testing**: Verificar visualización en diferentes dispositivos
2. **PWA**: Agregar iconos para Progressive Web App
3. **Dark Mode**: Variantes para tema oscuro si es necesario
4. **Animaciones**: Efectos de hover/tap opcionales

---

**Bucket de datos**: `mexa-data`  
**Última actualización**: 2025-07-12
