# Plan de Mejoras para Hard Extraction en Módulos de Scraping

**Fecha:** 2025-07-16

Este documento detalla estrategias avanzadas para mejorar la extracción de datos difíciles (hard extraction) en los módulos de scraping de MeXa, conservando la estructura de los schemas y los datos extraídos por cada módulo. El objetivo es maximizar la cantidad y calidad de ofertas reales extraídas, sin alterar el flujo ni la lógica general del sistema.
**IMPORTANTE**
* debemos validar las ofertas que no se repitan por modelos.
ejemplo, que no pueden repetirse los productos, y solo hay ofertas de la categoria woman, de , niños (kids) y men, (hombres) no hay ofertas, debes asegurarte de traerte las ofertas reales

---

## Índice
1. [Browser-MCP](#browser-mcp)
2. [Scraperr](#scraperr)
3. [DeepScrape](#deepscrape)

---

## 1. Browser-MCP

**Función:** Scraping con navegador real, autenticación, gestión de sesiones, fingerprints y proxies.

**Schema de datos:**
- Sesión: `{ sessionId, cookies, localStorage, fingerprint, proxy, createdAt, lastUsed, isValid }`
- Extracción: `{ action, email, sessionId, cookies, userAgent, fingerprint, proxy }`

**Estrategias propuestas:**
- Espera activa de carga de JS y recursos dinámicos (`waitForNetworkIdle`, `waitForSelector` avanzado).
- Simulación de scroll infinito y clics en "ver más" para cargar todas las ofertas.
- Extracción de datos embebidos en scripts (`application/ld+json`, JSON en DOM).
- Interceptación y análisis de XHR/fetch para capturar datos de ofertas cargadas por AJAX.
- Rotación de fingerprints y proxies ya gestionada, pero añadir heurísticas para detectar bloqueos o respuestas parciales.
- Guardar HTML crudo de páginas problemáticas para análisis offline.

**Trackerlist de funciones a implementar:**
- [ ] Implementar espera activa de carga de JS y recursos dinámicos (`waitForNetworkIdle`, `waitForSelector` avanzado).
- [ ] Simular scroll infinito y clics en "ver más" para cargar todas las ofertas reales.
- [ ] Extraer y parsear datos embebidos en scripts (`application/ld+json`, JSON en DOM).
- [ ] Interceptar y analizar XHR/fetch para capturar datos de ofertas cargadas por AJAX.
- [ ] Añadir heurísticas para detectar bloqueos, respuestas parciales o páginas incompletas.
- [ ] Guardar HTML crudo de páginas problemáticas para análisis offline.
- [ ] Validar que las imágenes descargadas sean las reales de farfetch.com (no thumbnails ni placeholders).
- [ ] Validar que no se repitan productos por modelo y que se incluyan ofertas de todas las categorías disponibles (woman, men, kids).

---

## 📋 Pasos detallados para implementar la espera avanzada de JS y recursos dinámicos (Browser-MCP)

1. **Análisis del flujo actual**
   - Revisar cómo y dónde se realiza la navegación y extracción de datos en el módulo Browser-MCP.
   - Identificar el punto exacto donde el navegador (Playwright/Puppeteer) navega a la URL objetivo y comienza la extracción.

2. **Diseño de la función utilitaria**
   - Definir una función, por ejemplo, `waitForDynamicContent(page, selector, timeout)`.
   - Esta función debe:
     - Esperar a que la red esté ociosa (`networkidle`),
     - Esperar a que el selector clave esté presente y visible,
     - Permitir configurar el selector según el tipo de página/oferta.

3. **Integración en el flujo de scraping**
   - Llamar a la función utilitaria justo después de la navegación y antes de la extracción de datos.
   - Asegurarse de que el selector usado corresponda a los contenedores de ofertas reales (por ejemplo, cards de producto en Farfetch).

4. **Validación y manejo de errores**
   - Si el selector no aparece en el tiempo esperado, registrar un log de advertencia y guardar el HTML crudo para análisis offline.
   - Si la red no se estabiliza, intentar un reintento limitado antes de fallar.

5. **Configurabilidad y compatibilidad**
   - Permitir que el selector sea configurable por parámetro o por tipo de scraping.
   - No modificar la estructura de los datos extraídos ni el contrato de la API.

6. **Pruebas y validación real**
   - Probar la función en escenarios reales de Farfetch (y otros sitios si aplica).
   - Validar que las ofertas extraídas sean completas y que las imágenes sean las reales.
   - Asegurarse de que no se repitan productos por modelo y que se cubran todas 
   - Verificar que no se altere el flujo ni la lógica general del sistema.

7. **Documentación y checklist**
   - Documentar el uso de la función y los parámetros recomendados para cada tipo de página.
   - Añadir un checklist de validación para asegurar que la función cumple con los objetivos (no mocks, datos reales, imágenes reales, sin duplicados).

---

## 2. Scraperr

**Función:** Scraping alternativo, navegación rápida, extracción de productos y ofertas.

**Schema de datos:**
- Extracción: `{ selectors, items, itemCount, options, timestamp }`

**Estrategias propuestas:**
- Implementar fallback de selectores: probar múltiples selectores alternativos si el principal falla.
- Simulación de eventos de usuario (scroll, clics, hover) para forzar la carga de nuevos elementos.
- Detección y extracción de datos de scripts embebidos y endpoints internos (AJAX, fetch).
- Soporte para extracción por lotes/paginación automática.
- Logs detallados de scraping para identificar en qué paso se pierden ofertas.
- Guardar snapshots de HTML y respuestas XHR para debugging.

**Trackerlist de funciones a implementar:**
- [ ] Implementar fallback de selectores: probar múltiples selectores alternativos si el principal falla.
- [ ] Simular eventos de usuario (scroll, clics, hover) para forzar la carga de nuevos elementos.
- [ ] Detectar y extraer datos de scripts embebidos y endpoints internos (AJAX, fetch).
- [ ] Soportar extracción por lotes/paginación automática para obtener todas las ofertas.
- [ ] Agregar logs detallados de scraping para identificar en qué paso se pierden ofertas.
- [ ] Guardar snapshots de HTML y respuestas XHR para debugging.
- [ ] Validar que las imágenes descargadas sean las reales de farfetch.com.
- [ ] Validar unicidad de productos y cobertura de categorías (woman, men, kids).

---

## 3. DeepScrape

**Función:** Scraping profundo, extracción semántica, fallback cuando los otros módulos fallan.

**Schema de datos:**
- Extracción: `{ elements, extractedData, extractedCount, depth, waitForSelector, timeout }`

**Estrategias propuestas:**
- Mejorar el uso de PlaywrightScraper para soportar acciones complejas (multi-scroll, espera de animaciones, etc.).
- Entrenamiento y ajuste del extractor LLM para identificar patrones de ofertas en layouts cambiantes.
- Extracción semántica de precios, imágenes y descripciones aunque cambien los selectores.
- Análisis de scripts y JSON embebido para obtener datos no visibles en el DOM.
- Guardar ejemplos de HTML y resultados de extracción para retroalimentar el modelo.

**Trackerlist de funciones a implementar:**
- [ ] Mejorar PlaywrightScraper para soportar multi-scroll, espera de animaciones y carga dinámica.
- [ ] Ajustar el extractor LLM para identificar patrones de ofertas en layouts cambiantes.
- [ ] Implementar extracción semántica robusta de precios, imágenes y descripciones aunque cambien los selectores.
- [ ] Analizar scripts y JSON embebido para obtener datos no visibles en el DOM.
- [ ] Guardar ejemplos de HTML y resultados de extracción para retroalimentar el modelo.
- [ ] Validar que las imágenes sean reales y que no haya duplicados de productos.
- [ ] Asegurar que se cubran todas las categorías de ofertas reales.

---

## 🚦 Reglas estrictas para la implementación de funciones avanzadas

- Solo se deben realizar las actividades documentadas en la sección "📋 Pasos detallados para implementar la espera avanzada de JS y recursos dinámicos (Browser-MCP)".
- Antes de comenzar cada actividad, se deben leer y repasar nuevamente estas reglas y la lista de tareas para asegurar que no se pierde el enfoque, la lógica ni el flujo del sistema.
- No se permite agregar, modificar o eliminar ninguna otra funcionalidad fuera de las actividades listadas.
- No se deben alterar los contratos de datos, la estructura de los schemas ni el flujo de orquestación.
- No se deben usar datos mock, pruebas artificiales ni imágenes que no sean reales de la web objetivo.
- Cada avance debe ser validado contra estas reglas antes de continuar con la siguiente actividad.

---

## Consideraciones Generales
- **No modificar los schemas ni la estructura de datos:** Todas las mejoras deben respetar los contratos de datos actuales.
- **No alterar el flujo ni la lógica de orquestación:** Las estrategias se implementan solo dentro de los módulos.
- **Solo datos reales:** Prohibido el uso de mocks, datos de test o información ficticia en producción.

---

**Siguiente paso:**
- Revisar y priorizar las estrategias propuestas por módulo.
- Definir responsables y tiempos de implementación para cada técnica.

---

*Documento generado automáticamente para discusión y planificación técnica.*
