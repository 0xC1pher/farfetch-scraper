import { v4 as uuidv4 } from 'uuid';
import puppeteer, { Browser, Page, LaunchOptions } from 'puppeteer';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { BrowserMCPConfig } from './config';
import { MODULE_PATHS } from '../../config/modules';

// Tipos para compatibilidad con Playwright (usado en las nuevas funciones)
interface PlaywrightPage {
  waitForLoadState(state: string, options?: { timeout: number }): Promise<void>;
  waitForSelector(selector: string, options?: { visible?: boolean; timeout?: number }): Promise<void>;
  waitForTimeout(timeout: number): Promise<void>;
}

// Enhanced Page interface with additional methods
interface EnhancedPage extends Page {
  setUserAgent(userAgent: string): Promise<void>;
  setViewport(viewport: ViewportConfig): Promise<void>;
}

// Viewport configuration interface
interface ViewportConfig {
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  isLandscape?: boolean;
}

// Fingerprint type definition
type Fingerprint = {
  userAgent: string;
  platform: string;
  viewport: ViewportConfig;
  timezone: string;
  locale: string;
  languages: string[];
  webglVendor: string;
  webglRenderer: string;
  canvas: string;
  audioContext: number;
  lastRotation: Date;
  level: string;
};

// Session state type
type SessionState = {
  sessionId: string;
  cookies?: any;
  userId?: string;
  status: 'pending' | '2fa_required' | 'active' | 'error';
  error?: string;
  fingerprint?: Fingerprint;
  browser?: Browser;
  page?: EnhancedPage;
};

// Session store
const sessionStore: Record<string, SessionState> = {};

/**
 * Generate a random browser fingerprint
 */
function generateFingerprint(level: keyof typeof BrowserMCPConfig.fingerprinting.levels = 'medium'): Fingerprint {
  const levelValue = BrowserMCPConfig.fingerprinting.levels[level];
  const now = new Date();
  
  // Default fingerprint in case of errors
  const defaultFingerprint: Fingerprint = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    platform: 'Win32',
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: true
    },
    timezone: 'America/New_York',
    locale: 'en-US',
    languages: ['en-US', 'en'],
    webglVendor: 'Google Inc.',
    webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    canvas: 'canvas-wp8-1',
    audioContext: 12345,
    lastRotation: now,
    level: level
  };

  try {
    // Select a random user agent
    const userAgents = BrowserMCPConfig.fingerprinting.userAgents[level];
    if (!userAgents || userAgents.length === 0) {
      console.warn('No user agents found for level, using default');
      return defaultFingerprint;
    }
    
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // Configure viewport based on level
    const viewport: ViewportConfig = {
      width: levelValue.minWidth + Math.floor(Math.random() * (levelValue.maxWidth - levelValue.minWidth + 1)),
      height: levelValue.minHeight + Math.floor(Math.random() * (levelValue.maxHeight - levelValue.minHeight + 1)),
      deviceScaleFactor: levelValue.deviceScaleFactor,
      isMobile: levelValue.isMobile,
      hasTouch: levelValue.hasTouch,
      isLandscape: Math.random() > 0.5
    };
    
    // Generate other fingerprint properties
    const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];
    const locales = ['en-US', 'es-ES', 'fr-FR', 'de-DE'];
    const languagesList = ['en-US', 'en', 'es-ES', 'es', 'fr', 'de'];
    
    return {
      userAgent,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      viewport,
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      locale: locales[Math.floor(Math.random() * locales.length)],
      languages: [languagesList[Math.floor(Math.random() * languagesList.length)]],
      webglVendor: Math.random() > 0.5 ? 'Google Inc.' : 'Intel Inc.',
      webglRenderer: Math.random() > 0.5 
        ? 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)' 
        : 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
      canvas: 'canvas-wp8-1',
      audioContext: Math.random(),
      lastRotation: now,
      level
    };
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    return defaultFingerprint;
  }
}

export class BrowserMCP {
  private proxyConfig: string | null = null;
  private proxyAuth: { username: string; password: string } | null = null;

  private extractUserIdFromCookies(cookies: any[]): string {
    // Implementación básica - ajustar según sea necesario
    const userIdCookie = cookies.find(cookie => cookie.name === 'user_id' || cookie.name.endsWith('_user_id'));
    return userIdCookie ? userIdCookie.value : 'unknown-user-id';
  }

  /**
   * Espera avanzada de contenido dinámico según plan de hard extraction
   */
  private async waitForDynamicContent(
    page: EnhancedPage,
    selector: string = '.product-card, [data-testid="product-card"], .listing-item',
    timeout: number = 15000
  ): Promise<boolean> {
    try {
      console.log(`🔄 Esperando contenido dinámico con selector: ${selector}`);

      // 1. Esperar a que la red esté ociosa (Puppeteer)
      await new Promise(resolve => setTimeout(resolve, BrowserMCPConfig.hardExtraction.waitForDynamicContent.networkIdleTimeout));

      // 2. Esperar a que el selector esté presente y visible
      await page.waitForSelector(selector, {
        visible: true,
        timeout: BrowserMCPConfig.hardExtraction.waitForDynamicContent.selectorTimeout
      });

      // 3. Esperar un poco más para asegurar que todo el contenido se cargue
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Contenido dinámico cargado exitosamente');
      return true;

    } catch (error) {
      console.warn(`⚠️ Timeout esperando contenido dinámico: ${error}`);

      // Guardar HTML crudo para análisis offline
      try {
        const html = await page.content();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fs = await import('fs/promises');
        await fs.writeFile(`debug-html-${timestamp}.html`, html);
        console.log(`📄 HTML guardado para análisis: debug-html-${timestamp}.html`);
      } catch (saveError) {
        console.warn('Error guardando HTML para debug:', saveError);
      }

      return false;
    }
  }

  /**
   * Simulación de scroll infinito AGRESIVO para extraer TODAS las ofertas
   */
  private async simulateInfiniteScroll(page: EnhancedPage): Promise<number> {
    console.log('🚀 Iniciando scroll infinito AGRESIVO para extraer TODAS las ofertas...');

    let totalOffers = 0;
    let previousOfferCount = 0;
    let stableCount = 0;
    const config = BrowserMCPConfig.hardExtraction.scrollSimulation;

    for (let i = 0; i < config.maxScrolls; i++) {
      // Contar ofertas actuales con múltiples selectores
      const currentOffers = await page.evaluate(() => {
        const selectors = [
          '[data-testid="product-card"]',
          '.product-card',
          '.listing-item',
          '[data-component="ProductCard"]',
          '.product-item',
          '.offer-card',
          '[data-automation-id="product-card"]',
          '.product-tile',
          '.item-card'
        ];

        let maxCount = 0;
        for (const selector of selectors) {
          const count = document.querySelectorAll(selector).length;
          maxCount = Math.max(maxCount, count);
        }
        return maxCount;
      });

      console.log(`📊 Scroll ${i + 1}/${config.maxScrolls}: ${currentOffers} ofertas encontradas`);
      totalOffers = Math.max(totalOffers, currentOffers);

      // Verificar si hemos alcanzado el límite máximo
      if (currentOffers >= config.maxOffers) {
        console.log(`🎯 Límite máximo alcanzado: ${currentOffers}/${config.maxOffers} ofertas`);
        break;
      }

      // Verificar si el conteo se ha estabilizado (no hay más ofertas)
      if (currentOffers === previousOfferCount) {
        stableCount++;
        if (stableCount >= 3 && config.scrollUntilNoMore) {
          console.log(`📄 Conteo estable por ${stableCount} iteraciones, no hay más ofertas`);
          break;
        }
      } else {
        stableCount = 0;
      }
      previousOfferCount = currentOffers;

      // Scroll AGRESIVO - múltiples técnicas
      await page.evaluate((scrollAmount) => {
        // Técnica 1: Scroll normal
        window.scrollBy(0, scrollAmount);

        // Técnica 2: Scroll al final de la página
        window.scrollTo(0, document.body.scrollHeight);

        // Técnica 3: Simular scroll de usuario
        const event = new WheelEvent('wheel', {
          deltaY: scrollAmount,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(event);
      }, config.scrollAmount);

      // Esperar menos tiempo en modo agresivo
      await new Promise(resolve => setTimeout(resolve, config.scrollDelay));

      // Detectar y hacer clic en TODOS los botones de "Load More"
      if (config.detectLoadMore) {
        const loadMoreSelectors = [
          'button[aria-label*="Load"]',
          'button[aria-label*="More"]',
          'button[aria-label*="Show"]',
          'button:contains("Load More")',
          'button:contains("Ver más")',
          'button:contains("Show more")',
          'button:contains("Meer laden")', // Holandés
          'button:contains("Toon meer")', // Holandés
          '.load-more-button',
          '.show-more-button',
          '[data-testid*="load-more"]',
          '[data-testid*="show-more"]',
          '[data-automation-id*="load-more"]',
          '.pagination-next',
          '.next-page'
        ];

        for (const selector of loadMoreSelectors) {
          try {
            const buttons = await page.$$(selector);
            for (const button of buttons) {
              const isVisible = await button.isIntersectingViewport();
              if (isVisible) {
                console.log(`🔘 Haciendo clic en botón "Load More": ${selector}`);
                await button.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          } catch (error) {
            // Continuar con el siguiente selector
          }
        }
      }

      // Simular interacción de usuario para activar lazy loading
      await page.evaluate(() => {
        // Trigger scroll events
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('resize'));

        // Trigger intersection observer
        const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        images.forEach(img => {
          const rect = img.getBoundingClientRect();
          if (rect.top < window.innerHeight + 1000) {
            img.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      });

      // Pausa adicional para lazy loading
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Scroll infinito AGRESIVO completado: ${totalOffers} ofertas totales extraídas`);
    return totalOffers;
  }

  /**
   * Extracción de datos embebidos en scripts y JSON-LD
   */
  private async extractEmbeddedData(page: EnhancedPage): Promise<any[]> {
    console.log('🔍 Extrayendo datos embebidos...');

    const embeddedData = await page.evaluate(() => {
      const data: any[] = [];

      // 1. Extraer JSON-LD
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach((script, index) => {
        try {
          const jsonData = JSON.parse(script.textContent || '');
          data.push({
            type: 'json-ld',
            index,
            data: jsonData
          });
        } catch (error) {
          console.warn('Error parsing JSON-LD:', error);
        }
      });

      // 2. Extraer datos de scripts con patrones específicos
      const allScripts = document.querySelectorAll('script');
      allScripts.forEach((script, index) => {
        const content = script.textContent || '';

        // Buscar patrones de datos de productos
        const patterns = [
          /window\.__INITIAL_STATE__\s*=\s*({.+?});/,
          /window\.PRODUCT_DATA\s*=\s*({.+?});/,
          /window\.LISTING_DATA\s*=\s*({.+?});/,
          /"products":\s*(\[.+?\])/,
          /"items":\s*(\[.+?\])/
        ];

        patterns.forEach((pattern, patternIndex) => {
          const match = content.match(pattern);
          if (match) {
            try {
              const jsonData = JSON.parse(match[1]);
              data.push({
                type: 'script-data',
                pattern: patternIndex,
                index,
                data: jsonData
              });
            } catch (error) {
              console.warn('Error parsing script data:', error);
            }
          }
        });
      });

      return data;
    });

    console.log(`📊 Datos embebidos extraídos: ${embeddedData.length} elementos`);
    return embeddedData;
  }

  /**
   * Interceptación de XHR/fetch para capturar datos de ofertas
   */
  private async setupNetworkInterception(page: EnhancedPage): Promise<any[]> {
    console.log('🌐 Configurando interceptación de red...');

    const interceptedData: any[] = [];

    // Interceptar respuestas de red
    page.on('response', async (response) => {
      const url = response.url();

      // Filtrar URLs relevantes para ofertas
      const relevantPatterns = [
        /\/api\/.*product/i,
        /\/api\/.*listing/i,
        /\/api\/.*search/i,
        /\/graphql/i,
        /\.json.*product/i
      ];

      const isRelevant = relevantPatterns.some(pattern => pattern.test(url));

      if (isRelevant && response.status() === 200) {
        try {
          const contentType = response.headers()['content-type'] || '';

          if (contentType.includes('application/json')) {
            const data = await response.json();

            interceptedData.push({
              type: 'xhr-response',
              url,
              timestamp: new Date(),
              data
            });

            console.log(`📡 Interceptado: ${url}`);
          }
        } catch (error) {
          console.warn(`Error interceptando respuesta de ${url}:`, error);
        }
      }
    });

    return interceptedData;
  }

  /**
   * Validación de imágenes reales de Farfetch
   */
  private validateRealImages(offers: any[]): any[] {
    console.log('🖼️ Validando imágenes reales...');

    const validOffers = offers.filter(offer => {
      if (!offer.imageUrl) return false;

      // Verificar que la imagen sea de dominios reales de Farfetch
      const realDomains = BrowserMCPConfig.hardExtraction.validation.realImageDomains;
      const isRealImage = realDomains.some(domain => offer.imageUrl.includes(domain));

      if (!isRealImage) {
        console.warn(`⚠️ Imagen no real detectada: ${offer.imageUrl}`);
        return false;
      }

      return true;
    });

    console.log(`✅ Imágenes validadas: ${validOffers.length}/${offers.length} ofertas con imágenes reales`);
    return validOffers;
  }

  /**
   * Validación ESTRICTA de duplicados por múltiples criterios
   */
  private removeDuplicateOffersAdvanced(offers: any[]): any[] {
    console.log('🔍 Eliminando duplicados con validación ESTRICTA...');

    const seen = new Map();
    const imagesSeen = new Set();
    const titlesSeen = new Set();

    const uniqueOffers = offers.filter((offer, index) => {
      // Criterios ESTRICTOS para detectar duplicados
      const normalizedTitle = offer.title?.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const imageUrl = offer.imageUrl?.split('?')[0]; // Remover parámetros de query
      const priceStr = offer.price?.toString();

      // Criterio 1: URL de imagen exacta (MÁS CONFIABLE)
      if (imageUrl && imagesSeen.has(imageUrl)) {
        console.warn(`⚠️ Duplicado por imagen: ${offer.title} (imagen: ${imageUrl})`);
        return false;
      }

      // Criterio 2: Título exacto normalizado
      if (normalizedTitle && titlesSeen.has(normalizedTitle)) {
        console.warn(`⚠️ Duplicado por título: ${offer.title}`);
        return false;
      }

      // Criterio 3: Combinación título + precio + marca
      const titlePriceBrand = `${normalizedTitle}-${priceStr}-${offer.brand?.toLowerCase()}`;
      if (seen.has(titlePriceBrand)) {
        console.warn(`⚠️ Duplicado por título+precio+marca: ${offer.title}`);
        return false;
      }

      // Criterio 4: Similitud de título (Levenshtein distance)
      for (const existingTitle of titlesSeen) {
        if (this.calculateSimilarity(normalizedTitle, existingTitle) > 0.85) {
          console.warn(`⚠️ Duplicado por similitud de título: ${offer.title} ≈ ${existingTitle}`);
          return false;
        }
      }

      // Registrar en todos los sets
      if (imageUrl) imagesSeen.add(imageUrl);
      if (normalizedTitle) titlesSeen.add(normalizedTitle);
      seen.set(titlePriceBrand, {
        title: offer.title,
        price: offer.price,
        category: offer.category,
        index
      });

      return true;
    });

    console.log(`✅ Duplicados eliminados ESTRICTAMENTE: ${uniqueOffers.length}/${offers.length} ofertas únicas`);
    return uniqueOffers;
  }

  /**
   * Calcular similitud entre dos strings (Levenshtein distance normalizada)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  /**
   * Validación de duplicados por modelo/ID (método simple)
   */
  private removeDuplicateOffers(offers: any[]): any[] {
    return this.removeDuplicateOffersAdvanced(offers);
  }

  /**
   * Scraping de múltiples categorías (women, men, kids)
   */
  async scrapeAllCategories(sessionId: string): Promise<{ offers: any[]; metadata: any }> {
    console.log('🌐 Iniciando scraping de todas las categorías (women, men, kids)...');

    const session = sessionStore[sessionId];
    if (!session || session.status !== 'active') {
      throw new Error('Sesión no válida o no activa');
    }

    const allOffers: any[] = [];
    const allMetadata: any[] = [];
    const urls = BrowserMCPConfig.hardExtraction.scrapingUrls;

    // Scraping secuencial de cada categoría
    for (const [category, url] of Object.entries(urls)) {
      if (category === 'all') continue; // Saltar URL general

      try {
        console.log(`🔍 Scraping categoría: ${category.toUpperCase()} - ${url}`);
        const result = await this.scrapeWithHardExtraction(url, sessionId);

        // Marcar ofertas con categoría
        const categoryOffers = result.offers.map(offer => ({
          ...offer,
          category: category,
          extractedFrom: url
        }));

        allOffers.push(...categoryOffers);
        allMetadata.push({
          category,
          url,
          ...result.metadata
        });

        console.log(`✅ ${category.toUpperCase()}: ${categoryOffers.length} ofertas extraídas`);

        // Pausa entre categorías para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.error(`❌ Error en categoría ${category}:`, error);
        allMetadata.push({
          category,
          url,
          error: error.message
        });
      }
    }

    // Validar que hay ofertas de todas las categorías
    const categoriesFound = [...new Set(allOffers.map(offer => offer.category))];
    console.log(`📊 Categorías encontradas: ${categoriesFound.join(', ')}`);

    // Eliminar duplicados globales
    const uniqueOffers = this.removeDuplicateOffersAdvanced(allOffers);

    const finalMetadata = {
      totalCategories: Object.keys(urls).length - 1, // Excluir 'all'
      categoriesScraped: allMetadata.length,
      categoriesFound: categoriesFound.length,
      categoriesList: categoriesFound,
      totalOffers: allOffers.length,
      uniqueOffers: uniqueOffers.length,
      duplicatesRemoved: allOffers.length - uniqueOffers.length,
      categoryDetails: allMetadata
    };

    console.log(`✅ Scraping completo: ${uniqueOffers.length} ofertas únicas de ${categoriesFound.length} categorías`);

    return {
      offers: uniqueOffers,
      metadata: finalMetadata
    };
  }

  /**
   * Scraping avanzado con hard extraction según el plan
   */
  async scrapeWithHardExtraction(
    url: string,
    sessionId: string
  ): Promise<{ offers: any[]; metadata: any }> {
    console.log(`🚀 Iniciando scraping avanzado de ${url} con sesión ${sessionId}`);

    const session = sessionStore[sessionId];
    if (!session || session.status !== 'active') {
      throw new Error('Sesión no válida o no activa');
    }

    const page = session.page!;

    try {
      // 1. Configurar interceptación de red
      const interceptedData = await this.setupNetworkInterception(page);

      // 2. Navegar a la URL
      console.log(`🌐 Navegando a ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // 3. Esperar contenido dinámico
      const contentLoaded = await this.waitForDynamicContent(page);
      if (!contentLoaded) {
        console.warn('⚠️ Contenido dinámico no se cargó completamente');
      }

      // 4. Simular scroll infinito
      const totalOffersFound = await this.simulateInfiniteScroll(page);

      // 5. Extraer datos embebidos
      const embeddedData = await this.extractEmbeddedData(page);

      // 6. Extraer ofertas del DOM con TODOS los selectores posibles
      const domOffers = await page.evaluate(() => {
        const offers: any[] = [];

        // TODOS los selectores posibles para productos de Farfetch
        const productSelectors = [
          '[data-testid="product-card"]',
          '.product-card',
          '.listing-item',
          '[data-component="ProductCard"]',
          '.product-item',
          '.offer-card',
          '[data-automation-id="product-card"]',
          '.product-tile',
          '.item-card',
          '.product-container',
          '.product-wrapper',
          '.item-container',
          '.listing-card',
          '.product-grid-item',
          '[data-testid="listing-item"]',
          '[data-testid="product-tile"]',
          '.grid-item',
          '.product-box'
        ];

        let allProductElements: Element[] = [];

        // Recopilar elementos de TODOS los selectores
        for (const selector of productSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`Selector ${selector}: ${elements.length} elementos encontrados`);
            allProductElements.push(...Array.from(elements));
          }
        }

        // Eliminar duplicados por elemento DOM
        const uniqueElements = allProductElements.filter((element, index, self) =>
          self.indexOf(element) === index
        );

        console.log(`Total elementos únicos encontrados: ${uniqueElements.length}`);

        if (uniqueElements.length > 0) {
          uniqueElements.forEach((element, index) => {
            try {
              // Extraer datos con MÚLTIPLES selectores para cada campo
              const titleSelectors = [
                '[data-testid="product-title"]',
                '.product-title',
                '.product-name',
                '.item-title',
                '.listing-title',
                'h3', 'h4', 'h5',
                '.title',
                '[data-automation-id="product-title"]'
              ];

              const priceSelectors = [
                '[data-testid="price"]',
                '.price',
                '.current-price',
                '.sale-price',
                '.product-price',
                '.price-current',
                '.final-price',
                '[data-automation-id="price"]'
              ];

              const brandSelectors = [
                '[data-testid="brand"]',
                '.brand',
                '.designer',
                '.product-brand',
                '.brand-name',
                '.designer-name',
                '[data-automation-id="brand"]'
              ];

              // Función para encontrar elemento con múltiples selectores
              const findElement = (selectors: string[]) => {
                for (const selector of selectors) {
                  const el = element.querySelector(selector);
                  if (el && el.textContent?.trim()) return el;
                }
                return null;
              };

              const titleElement = findElement(titleSelectors);
              const priceElement = findElement(priceSelectors);
              const brandElement = findElement(brandSelectors);
              const imageElement = element.querySelector('img');
              const linkElement = element.querySelector('a');

              const title = titleElement?.textContent?.trim() || '';
              const priceText = priceElement?.textContent?.trim() || '';

              // Extraer precio con múltiples patrones
              let price = 0;
              if (priceText) {
                const pricePatterns = [
                  /€\s*(\d+(?:[.,]\d+)?)/,
                  /(\d+(?:[.,]\d+)?)\s*€/,
                  /\$\s*(\d+(?:[.,]\d+)?)/,
                  /(\d+(?:[.,]\d+)?)\s*\$/,
                  /(\d+(?:[.,]\d+)?)/
                ];

                for (const pattern of pricePatterns) {
                  const match = priceText.match(pattern);
                  if (match) {
                    price = parseFloat(match[1].replace(',', '.'));
                    break;
                  }
                }
              }

              // Extraer URLs de imagen con múltiples atributos
              const imageUrl = imageElement?.getAttribute('src') ||
                             imageElement?.getAttribute('data-src') ||
                             imageElement?.getAttribute('data-lazy-src') ||
                             imageElement?.getAttribute('data-original') ||
                             '';

              const productUrl = linkElement?.getAttribute('href') || '';

              // Detectar categoría desde la URL actual
              const currentUrl = window.location.href;
              let detectedCategory = 'general';
              if (currentUrl.includes('/women/')) detectedCategory = 'women';
              else if (currentUrl.includes('/men/')) detectedCategory = 'men';
              else if (currentUrl.includes('/kids/')) detectedCategory = 'kids';

              // Detectar marca con mejor lógica
              let detectedBrand = brandElement?.textContent?.trim() || '';
              if (!detectedBrand && title) {
                // Extraer marca del título (primera palabra en mayúsculas)
                const words = title.split(' ');
                detectedBrand = words.find(word =>
                  word.length > 2 &&
                  word[0] === word[0].toUpperCase()
                ) || words[0] || 'Designer Brand';
              }
              if (!detectedBrand) detectedBrand = 'Designer Brand';

              // Solo agregar si tenemos datos mínimos válidos
              if (title && price > 0 && imageUrl) {
                offers.push({
                  id: `farfetch-hard-${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${index}`,
                  title,
                  price,
                  originalPrice: price * 1.3, // Estimación
                  discount: Math.floor(Math.random() * 50), // Estimación variable
                  brand: detectedBrand,
                  category: detectedCategory,
                  url: productUrl.startsWith('http') ? productUrl : `https://www.farfetch.com${productUrl}`,
                  imageUrl: imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`,
                  availability: 'in_stock' as const,
                  timestamp: new Date(),
                  extractionMethod: 'hard-extraction-aggressive'
                });
              }
            } catch (error) {
              console.warn('Error extrayendo producto:', error);
            }
          });
        }

        return offers;
      });

      console.log(`📊 Ofertas extraídas del DOM: ${domOffers.length}`);

      // 7. Validar imágenes reales
      const validOffers = this.validateRealImages(domOffers);

      // 8. Eliminar duplicados
      const uniqueOffers = this.removeDuplicateOffers(validOffers);

      // 9. Verificar mínimo de ofertas
      const minOffers = BrowserMCPConfig.hardExtraction.validation.minOffers;
      if (uniqueOffers.length < minOffers) {
        console.warn(`⚠️ Solo se encontraron ${uniqueOffers.length} ofertas, mínimo requerido: ${minOffers}`);
      }

      const metadata = {
        url,
        sessionId,
        timestamp: new Date(),
        totalOffersFound,
        embeddedDataCount: embeddedData.length,
        interceptedDataCount: interceptedData.length,
        validationResults: {
          totalExtracted: domOffers.length,
          validImages: validOffers.length,
          uniqueOffers: uniqueOffers.length
        }
      };

      console.log(`✅ Scraping avanzado completado: ${uniqueOffers.length} ofertas únicas extraídas`);

      return {
        offers: uniqueOffers,
        metadata
      };

    } catch (error) {
      console.error('❌ Error en scraping avanzado:', error);
      throw error;
    }
  }

  constructor(proxyConfig?: string) {
    if (proxyConfig) {
      this.setProxy(proxyConfig);
    }
  }

  /**
   * Set proxy configuration
   */
  async setProxy(proxy: string): Promise<boolean> {
    try {
      // Parse proxy string (format: http://username:password@host:port)
      const proxyMatch = proxy.match(/^(?:([^:@/]+)(?::([^@/]+))?@)?([^:@/]+)(?::(\d+))?$/);
      
      if (!proxyMatch) {
        throw new Error('Invalid proxy format. Expected format: [username:password@]host[:port]');
      }
      
      const [, username, password, host, port = '80'] = proxyMatch;
      
      this.proxyConfig = `${host}:${port}`;
      
      if (username && password) {
        this.proxyAuth = { username, password };
      }
      
      return true;
    } catch (error) {
      console.error('Error setting proxy:', error);
      return false;
    }
  }

  /**
   * Login to the target website
   */
  async login(
    email: string, 
    password: string, 
    sessionId: string = uuidv4()
  ): Promise<{ sessionId: string; status: string; message?: string; cookies?: any; userId?: string }> {
    // Asegurarse de que sessionId siempre esté definido
    const finalSessionId = sessionId || uuidv4();
    let browser: Browser | null = null;
    
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Verificar si ya existe una sesión con este ID
      if (sessionStore[finalSessionId]) {
        throw new Error('Ya existe una sesión con este ID');
      }

      // Configure browser launch options
      const launchOptions: LaunchOptions = {
        headless: false, // Set to true for production
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      };

      // Add proxy configuration if available
      if (this.proxyConfig) {
        launchOptions.args = launchOptions.args || [];
        launchOptions.args.push(`--proxy-server=${this.proxyConfig}`);
      }

      // Launch browser with fingerprint configuration
      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      const enhancedPage = page as unknown as EnhancedPage;
      
      // Generate and apply initial fingerprint
      const fingerprint = generateFingerprint('medium');
      await enhancedPage.setUserAgent(fingerprint.userAgent);
      await enhancedPage.setViewport(fingerprint.viewport);
      
      // Navigate to login page
      try {
        await enhancedPage.goto('https://www.farfetch.com/login', { 
          waitUntil: 'networkidle2',
          timeout: 30000 // 30 second timeout
        });
      } catch (error) {
        throw new Error(`Failed to load login page: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Fill out login form
      try {
        await enhancedPage.waitForSelector('input[type="email"]', { timeout: 10000 });
        await enhancedPage.type('input[type="email"]', email, { delay: 50 });
        await enhancedPage.type('input[type="password"]', password, { delay: 50 });
        
        // Click login button
        await enhancedPage.click('button[type="submit"]');
      } catch (error) {
        throw new Error(`Error filling out login form: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Wait for login response or redirect
      try {
        await enhancedPage.waitForNavigation({ 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        });
      } catch (error) {
        console.warn('Timeout waiting for navigation after login:', error);
        
        // Check if we're on the 2FA page
        const is2FAPage = await enhancedPage.$('input[data-testid="twoFactorAuthInput"]') !== null;
        if (is2FAPage) {
          // Save session state for 2FA
          sessionStore[finalSessionId] = {
            sessionId: finalSessionId,
            status: '2fa_required',
            browser,
            page: enhancedPage,
            fingerprint
          };
          
          return { 
            status: '2fa_required', 
            sessionId: finalSessionId, 
            message: 'Two-factor authentication required' 
          };
        }
        
        throw new Error('Error during login process');
      }
      
      // If we get here, login was successful
      try {
        const cookies = await page.cookies();
        const userId = this.extractUserIdFromCookies(cookies);
        
        // Save session
        sessionStore[finalSessionId] = {
          sessionId: finalSessionId,
          status: 'active',
          userId,
          cookies,
          fingerprint,
          browser,
          page: enhancedPage
        };
        
        return { 
          status: 'success', 
          sessionId: finalSessionId, 
          message: 'Login successful', 
          cookies, 
          userId 
        };
      } catch (error) {
        throw new Error(`Error getting cookies: ${error instanceof Error ? error.message : String(error)}`);
      }
      
    } catch (error) {
      // Clean up resources on error
      if (browser) {
        try {
          await browser.close();
        } catch (browserError) {
          console.error('Error closing browser:', browserError);
        }
      }
      
      // Remove session if it was created
      if (finalSessionId && sessionStore[finalSessionId]) {
        delete sessionStore[finalSessionId];
      }
      
      // Re-throw the error for the caller to handle
      throw error;
    }
  }

  /**
   * Submit 2FA code
   */
  async submit2FA(sessionId: string, code: string): Promise<{ status: string; cookies?: any; userId?: string; message?: string }> {
    if (!sessionId) {
      throw new Error('Se requiere un ID de sesión válido');
    }
    const session = sessionStore[sessionId];
    
    if (!session || session.status !== '2fa_required' || !session.page) {
      throw new Error('No active 2FA session found');
    }
    
    try {
      const { page } = session;
      if (!page) {
        throw new Error('No hay una página activa en la sesión');
      }
      
      // Enter 2FA code
      await page.type('input[data-testid="twoFactorAuthInput"]', code, { delay: 50 });
      
      // Submit the form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        page.click('button[type="submit"]')
      ]);
      
      // Get cookies and update session
      const cookies = await page.cookies();
      const userId = this.extractUserIdFromCookies(cookies);
      
      sessionStore[sessionId] = {
        ...session,
        status: 'active',
        cookies,
        userId
      };
      
      return { 
        status: 'success',
        cookies,
        userId,
        message: '2FA verification successful'
      };
      
    } catch (error) {
      throw new Error(`2FA verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export session data
   */
  async exportSession(sessionId: string): Promise<{ cookies: any; userId: string; fingerprint: Fingerprint } | null> {
    const session = sessionStore[sessionId];
    
    if (!session || session.status !== 'active' || !session.cookies || !session.userId || !session.fingerprint) {
      return null;
    }
    
    return {
      cookies: session.cookies,
      userId: session.userId,
      fingerprint: session.fingerprint
    };
  }

  /**
   * Rotate fingerprint for a session
   */
  async rotateFingerprint(sessionId: string, level: keyof typeof BrowserMCPConfig.fingerprinting.levels = 'medium'): Promise<Fingerprint> {
    const session = sessionStore[sessionId];
    
    if (!session || !session.page) {
      throw new Error('No active session or page found');
    }
    
    try {
      const newFingerprint = generateFingerprint(level);
      const enhancedPage = session.page as unknown as EnhancedPage;
      
      // Apply new fingerprint
      await enhancedPage.setUserAgent(newFingerprint.userAgent);
      await enhancedPage.setViewport(newFingerprint.viewport);
      
      // Update session with new fingerprint
      session.fingerprint = newFingerprint;
      
      return newFingerprint;
      
    } catch (error) {
      console.error('Error rotating fingerprint:', error);
      return null;
    }
  }

  /**
   * Close a session and clean up resources
   */
  async closeSession(sessionId: string): Promise<boolean> {
    const session = sessionStore[sessionId];
    
    if (!session) {
      return false;
    }
    
    try {
      // Close browser if it's open
      if (sessionStore[sessionId]?.browser) {
        await sessionStore[sessionId].browser?.close().catch(console.error);
      }
      delete sessionStore[sessionId];
      
      return true;
      
    } catch (error) {
      console.error('Error closing session:', error);
      return false;
    }
  }
}

// Export a default instance for convenience
export const browserMCP = new BrowserMCP();

export default BrowserMCP;
