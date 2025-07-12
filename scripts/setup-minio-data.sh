#!/bin/bash

# Script para configurar MinIO y crear estructura de datos para MeXa
echo "🚀 Configurando MinIO y creando estructura de datos..."

# Configurar alias de MinIO
echo "📡 Configurando conexión a MinIO..."
./mc alias set mexa-local http://localhost:9002 minioadmin ***REMOVED***

# Verificar conexión
echo "🔍 Verificando conexión..."
./mc admin info mexa-local

# Crear bucket si no existe
echo "📦 Creando bucket mexa-data..."
./mc mb mexa-local/mexa-data --ignore-existing

# Configurar política pública para el bucket
echo "🔓 Configurando política de acceso..."
./mc anonymous set public mexa-local/mexa-data

# Crear estructura de directorios
echo "📁 Creando estructura de directorios..."

# Crear archivos temporales para crear la estructura de directorios
mkdir -p /tmp/mexa-structure/telegram/offers/2024-07-12
mkdir -p /tmp/mexa-structure/telegram/offers/favorites
mkdir -p /tmp/mexa-structure/telegram/users
mkdir -p /tmp/mexa-structure/scraping/sessions/2024-07-12
mkdir -p /tmp/mexa-structure/scraping/selectors/history
mkdir -p /tmp/mexa-structure/sessions/browser-mcp
mkdir -p /tmp/mexa-structure/sessions/fingerprints

# Crear archivos de ejemplo
echo "📄 Creando datos de ejemplo..."

# Ofertas de ejemplo
cat > /tmp/mexa-structure/telegram/offers/2024-07-12/offer-001.json << 'EOF'
{
  "id": "offer-001",
  "precio": 89.99,
  "precioOriginal": 149.99,
  "descuento": 40,
  "referencia": "FF-001-2024",
  "categoria": "hombre",
  "cantidadDisponible": 15,
  "estatus": "disponible",
  "marca": "Gucci",
  "descripcion": "Camiseta de algodón premium con logo bordado",
  "tallas": ["S", "M", "L", "XL"],
  "colores": ["Negro", "Blanco", "Azul"],
  "imagenes": [
    {
      "url": "https://cdn.farfetch.com/example1.jpg",
      "width": 375,
      "height": 667,
      "optimized": true
    }
  ],
  "fechaCreacion": "2024-07-12T06:00:00Z",
  "fuente": "scraperr",
  "url": "https://www.farfetch.com/shopping/men/gucci-example-item.aspx"
}
EOF

cat > /tmp/mexa-structure/telegram/offers/2024-07-12/offer-002.json << 'EOF'
{
  "id": "offer-002",
  "precio": 299.99,
  "precioOriginal": 499.99,
  "descuento": 40,
  "referencia": "FF-002-2024",
  "categoria": "mujer",
  "cantidadDisponible": 8,
  "estatus": "limitado",
  "marca": "Prada",
  "descripcion": "Bolso de cuero italiano con cadena dorada",
  "tallas": ["Único"],
  "colores": ["Negro", "Marrón"],
  "imagenes": [
    {
      "url": "https://cdn.farfetch.com/example2.jpg",
      "width": 375,
      "height": 667,
      "optimized": true
    }
  ],
  "fechaCreacion": "2024-07-12T06:15:00Z",
  "fuente": "browser-mcp",
  "url": "https://www.farfetch.com/shopping/women/prada-example-bag.aspx"
}
EOF

cat > /tmp/mexa-structure/telegram/offers/2024-07-12/offer-003.json << 'EOF'
{
  "id": "offer-003",
  "precio": 45.99,
  "precioOriginal": 89.99,
  "descuento": 49,
  "referencia": "FF-003-2024",
  "categoria": "niño",
  "cantidadDisponible": 25,
  "estatus": "disponible",
  "marca": "Burberry",
  "descripcion": "Sudadera con capucha para niños, diseño clásico",
  "tallas": ["4Y", "6Y", "8Y", "10Y", "12Y"],
  "colores": ["Beige", "Azul marino"],
  "imagenes": [
    {
      "url": "https://cdn.farfetch.com/example3.jpg",
      "width": 375,
      "height": 667,
      "optimized": true
    }
  ],
  "fechaCreacion": "2024-07-12T06:30:00Z",
  "fuente": "deepscrape",
  "url": "https://www.farfetch.com/shopping/kids/burberry-example-hoodie.aspx"
}
EOF

# Favoritos de ejemplo
cat > /tmp/mexa-structure/telegram/offers/favorites/user-123456789.json << 'EOF'
{
  "userId": "123456789",
  "chatId": 123456789,
  "favoritos": [
    {
      "offerId": "offer-001",
      "fechaAgregado": "2024-07-12T07:00:00Z",
      "notificaciones": true
    },
    {
      "offerId": "offer-003",
      "fechaAgregado": "2024-07-12T07:15:00Z",
      "notificaciones": false
    }
  ],
  "ultimaActualizacion": "2024-07-12T07:15:00Z"
}
EOF

# Usuario de ejemplo
cat > /tmp/mexa-structure/telegram/users/123456789/profile.json << 'EOF'
{
  "chatId": 123456789,
  "username": "usuario_demo",
  "firstName": "Usuario",
  "lastName": "Demo",
  "fechaRegistro": "2024-07-12T06:00:00Z",
  "ultimaActividad": "2024-07-12T07:15:00Z",
  "configuracion": {
    "idioma": "es",
    "notificaciones": true,
    "frecuenciaNotificaciones": "inmediata"
  }
}
EOF

cat > /tmp/mexa-structure/telegram/users/123456789/filters.json << 'EOF'
{
  "chatId": 123456789,
  "filtros": {
    "categorias": ["hombre", "mujer"],
    "marcas": ["Gucci", "Prada", "Burberry", "Versace"],
    "precioMinimo": 50,
    "precioMaximo": 500,
    "descuentoMinimo": 30,
    "tallas": ["S", "M", "L"],
    "colores": ["Negro", "Blanco", "Azul"]
  },
  "ultimaActualizacion": "2024-07-12T06:30:00Z"
}
EOF

# Sesión de ejemplo
cat > /tmp/mexa-structure/sessions/browser-mcp/session-001.json << 'EOF'
{
  "sessionId": "session-001",
  "cookies": [
    {
      "name": "farfetch_session",
      "value": "example_session_token_12345",
      "domain": ".farfetch.com",
      "path": "/",
      "expires": "2024-07-13T06:00:00Z"
    }
  ],
  "localStorage": {
    "user_preferences": "{\"currency\":\"EUR\",\"language\":\"es\"}"
  },
  "fingerprint": {
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    "viewport": {"width": 1920, "height": 1080},
    "language": "es-ES",
    "timezone": "Europe/Madrid"
  },
  "proxy": {
    "host": "proxy.example.com",
    "port": 8080,
    "country": "ES"
  },
  "createdAt": "2024-07-12T06:00:00Z",
  "lastUsed": "2024-07-12T07:00:00Z",
  "isValid": true
}
EOF

# Selectores de ejemplo
cat > /tmp/mexa-structure/scraping/selectors/latest.json << 'EOF'
{
  "version": "2024-07-12",
  "selectors": {
    "productCard": ".product-card, [data-testid='product-card']",
    "productName": ".product-name, [data-testid='product-name']",
    "productPrice": ".price, [data-testid='price']",
    "productImage": ".product-image img, [data-testid='product-image'] img",
    "productLink": ".product-link, [data-testid='product-link']",
    "nextPage": ".pagination-next, [data-testid='next-page']",
    "loadMore": ".load-more, [data-testid='load-more']"
  },
  "lastUpdated": "2024-07-12T06:00:00Z",
  "testedOn": "https://www.farfetch.com/shopping/men/",
  "success": true
}
EOF

# Subir archivos a MinIO
echo "📤 Subiendo estructura de datos a MinIO..."
./mc cp --recursive /tmp/mexa-structure/ mexa-local/mexa-data/

# Verificar estructura creada
echo "✅ Verificando estructura creada..."
./mc ls --recursive mexa-local/mexa-data/

# Limpiar archivos temporales
echo "🧹 Limpiando archivos temporales..."
rm -rf /tmp/mexa-structure

echo "🎉 ¡Configuración de MinIO completada!"
echo ""
echo "📊 Resumen de datos creados:"
echo "  • 3 ofertas de ejemplo (Gucci, Prada, Burberry)"
echo "  • 1 usuario demo con favoritos y filtros"
echo "  • 1 sesión de navegador de ejemplo"
echo "  • Selectores CSS actualizados"
echo ""
echo "🌐 Accede a MinIO Console en: http://localhost:9003"
echo "🔑 Credenciales: minioadmin / ***REMOVED***"
echo "📦 Bucket: mexa-data"
