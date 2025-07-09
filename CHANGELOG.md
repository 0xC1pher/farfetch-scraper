# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/spec/v2.0.0.html).

## [No Publicado]

### Agregado
- Archivo CHANGELOG.md para documentar cambios en el proyecto
- Estructura inicial del changelog siguiendo Keep a Changelog
- Módulo de fingerprinting con generación aleatoria de huellas digitales
- Soporte para rotación de fingerprint con diferentes niveles (bajo, medio, alto)
- Implementación de Browser MCP Hook para integración con repos externos
- Implementación de Scraperr Hook para integración con repos externos
- Implementación de Deepscrape Hook para integración con repos externos
- Sistema de gestión de sesiones con persistencia en MinIO
- Integración con repos externos (browser-mcp, scraperr, deepscrape)
- Scripts de configuración y actualización de repos externos
- Orquestador robusto para coordinar módulos desacoplados
- Sistema de logging y manejo de errores centralizado
- Sistema de fallback automático entre scraperr y deepscrape

### Cambiado
- Reorganización de la arquitectura para usar repos externos + hooks
- Refactorización completa del módulo Browser MCP para usar hook pattern
- Refactorización completa del módulo Scraperr para usar hook pattern
- Refactorización completa del módulo Deepscrape para usar hook pattern
- Mejora en la gestión de dependencias y configuración
- Actualización de la estructura de directorios para mejor escalabilidad

### Corregido
- Errores críticos de TypeScript en módulo Browser MCP
- Errores críticos de TypeScript en módulo Scraperr
- Errores críticos de TypeScript en módulo Deepscrape
- Problemas de imports y tipos en configuración
- Corrupción de archivos durante refactorización
- Dependencias circulares entre módulos
- Import incorrecto de Deepscrape en Scraperr
- Método waitForTimeout no existente en Puppeteer

### Eliminado
- Código legacy y duplicado entre módulos
- Acoplamiento directo entre implementaciones de módulos
- Archivos temporales y mocks innecesarios
- Dependencias directas de Puppeteer en hooks

## [0.1.0] - 2024-06-08

### Agregado
- Estructura inicial del proyecto
- Configuración base de TypeScript y Next.js
- Módulos base para Browser MCP, Scraperr, Deepscrape y MinIO
- UI básica con componentes Svelte
- Endpoints API iniciales