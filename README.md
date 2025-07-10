# Mexa - Sistema de Web Scraping para Farfetch con Telegram Bot

![Banner del Proyecto](https://via.placeholder.com/1200x400?text=Mexa+Farfetch+Scraper+Orchestrator)

Sistema avanzado de web scraping para monitoreo de ofertas en Farfetch, con integración de Telegram para notificaciones y gestión de catálogos.

## 🚀 Características Principales

- **Scraping Avanzado** - Extracción de datos de Farfetch con soporte para elementos dinámicos
- **Automatización Completa** - Flujos de autenticación, navegación y extracción
- **Integración con Telegram** - Bot interactivo para gestión de catálogos y alertas
- **Gestión de Sesiones** - Persistencia de cookies y estados de navegación
- **Sistema de Proxies** - Rotación automática y gestión de huellas digitales
- **Persistencia en MinIO** - Almacenamiento seguro de workflows y sesiones

## 🏗️ Estructura del Proyecto

```
├── src/
│   ├── config/           # Configuraciones globales
│   ├── modules/          # Módulos independientes
│   ├── orchestrator/     # Lógica de orquestación
│   ├── pages/            # Vistas de la interfaz web
│   ├── proxy-manager/    # Gestión de proxies
│   ├── types/            # Definiciones de tipos TypeScript
│   ├── ui/               # Componentes de interfaz compartidos
│   └── workflows/        # Flujos de trabajo automatizados
├── external/             # Dependencias externas
├── import/               # Documentación y recursos
├── scripts/              # Scripts de utilidad
├── tests/                # Pruebas automatizadas
├── k8s/                  # Configuraciones de Kubernetes
│   ├── deployments/      # Despliegues
│   ├── services/         # Servicios
│   └── configs/          # ConfigMaps y Secrets
└── docker/               # Configuraciones de Docker
    ├── app/              # Dockerfile de la aplicación
    └── services/         # Dockerfiles para servicios adicionales
```

## 🐳 Despliegue con Docker

### Requisitos
- Docker 20.10+
- Docker Compose 2.0+
- Kubernetes (opcional, para producción)

### Construir las imágenes
```bash
# Construir imagen principal
docker build -t mexa-scraper -f docker/app/Dockerfile .

# Construir todos los servicios
docker-compose build
```

### Iniciar los contenedores
```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## ☸️ Despliegue en Kubernetes

### Requisitos
- kubectl configurado con acceso a un cluster
- Helm (opcional)

### Aplicar configuraciones
```bash
# Aplicar configuraciones base
kubectl apply -f k8s/configs/

# Desplegar servicios
kubectl apply -f k8s/services/

# Desplegar aplicaciones
kubectl apply -f k8s/deployments/
```

### Usando Helm (recomendado)
```bash
# Instalar chart
helm install mexa ./helm/mexa

# Actualizar despliegue
helm upgrade mexa ./helm/mexa
```

## 🔄 Workflows

El sistema utiliza workflows definidos en YAML para orquestar las tareas de scraping. Los workflows se encuentran en `src/workflows/`.

### Estructura de un Workflow

```yaml
name: farfetch-daily-scrape
schedule: "0 2 * * *"  # Ejecutar diariamente a las 2 AM
timeout: 2h

steps:
  - name: authenticate
    module: browser-mcp
    config:
      url: "https://www.farfetch.com"
      credentials: ${env.FARFETCH_CREDENTIALS}

  - name: scrape-products
    module: deepscrape
    dependsOn: ["authenticate"]
    config:
      selectors:
        products: ".product-card"
        price: ".price"
        name: ".product-name"

  - name: process-data
    module: processor
    config:
      filters:
        min_discount: 30
        max_price: 200

  - name: send-notifications
    module: telegram
    config:
      chat_id: ${env.TELEGRAM_CHAT_ID}
      message: "Nuevas ofertas disponibles!"
```

### Ejecutar un Workflow

```bash
# Ejecutar workflow local
npm run workflow -- farfetch-daily.yaml

# Programar con cron
crontab -e
# Agregar: 0 2 * * * cd /ruta/a/mexa && npm run workflow farfetch-daily.yaml
```

## 🛠️ Requisitos

### Desarrollo
- Node.js 18+
- npm 9+
- Git

### Producción
- Docker 20.10+
- Kubernetes 1.20+ (para orquestación)
- Redis 6+ (para colas de trabajo)
- MinIO (para almacenamiento de sesiones)
- PostgreSQL 13+ (para base de datos principal)

## 🚀 Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/0xC1pher/farfetch-scraper.git
   cd mexa
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

4. Iniciar el sistema:
   ```bash
   npm run dev
   ```

## 📚 Documentación Técnica

### Flujo Principal

1. **Autenticación y Sesión**
   - Gestión de sesiones con rotación de IP
   - Resolución automática de CAPTCHAs
   - Persistencia de cookies en MinIO

2. **Scraping Inteligente**
   - Detección de cambios en la estructura
   - Ajuste dinámico de selectores
   - Extracción de datos estructurados

3. **Procesamiento**
   - Filtrado de ofertas según reglas de negocio
   - Análisis de tendencias
   - Generación de informes

4. **Integración con Telegram**
   - Comandos interactivos
   - Catálogos personalizados
   - Alertas en tiempo real

### Módulos Clave

- **Browser MCP Hook**: Autenticación y gestión de sesiones
- **Scraperr Hook**: Navegación y extracción básica
- **Deepscrape**: Manejo de elementos dinámicos
- **MinIO**: Almacenamiento de sesiones y datos

### Documentación Adicional

- [Estrategias de Proxies](./import/estrategias-proxys.md)
- [Arquitectura del Sistema](./import/proxy-system.md)
- [Planificación Técnica](./import/planning-scraper.md)
- [Guía de Implementación](./import/plaining.md)

## 🤝 Contribución

1. Haz fork del proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

¿Preguntas o sugerencias? ¡Abre un issue o contáctanos en [alfierimorillo@gmail.com](mailto:alfierimorillo@gmail.com)!

---

<div align="center">
  Hecho con ❤️ por el equipo de Mexa
</div>
