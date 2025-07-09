// Hook que usa el repo externo scraperr
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { deepscrape } from '../deepscrape/index.js';

export interface ScrapingOptions {
  waitForSelector?: string;
  scrollTimes?: number;
  scrollDelay?: number;
  timeout?: number;
  useSession?: boolean;
  sessionId?: string;
}

export interface Offer {
  id: string;
  title: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  imageUrl: string;
  productUrl: string;
  availability: boolean;
  timestamp: Date;
}

export interface ScraperrConfig {
  externalPath: string;
  timeout: number;
  retries: number;
}

export class ScraperrHook {
  private config: ScraperrConfig;
  private isAvailable: boolean = false;
  private sessionCookies: any[] = [];

  constructor(config: ScraperrConfig) {
    this.config = config;
    this.checkAvailability();
  }

  private checkAvailability(): void {
    const packageJsonPath = join(this.config.externalPath, 'package.json');
    this.isAvailable = existsSync(packageJsonPath);
  }

  async getStatus(): Promise<{ available: boolean; version?: string }> {
    if (!this.isAvailable) {
      return { available: false };
    }

    try {
      const packageJson = require(join(this.config.externalPath, 'package.json'));
      return { available: true, version: packageJson.version };
    } catch (e) {
      return { available: false };
    }
  }

  /**
   * Load session/cookies from Browser MCP
   */
  async loadSession(sessionData: any): Promise<void> {
    try {
      if (sessionData.cookies && Array.isArray(sessionData.cookies)) {
        this.sessionCookies = sessionData.cookies;
        console.log(`✅ Sesión cargada con ${sessionData.cookies.length} cookies`);
      } else {
        console.warn('⚠️ No se encontraron cookies en la sesión');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error cargando sesión:', errorMessage);
      throw error;
    }
  }

  /**
   * Scrape offers from Farfetch using external scraperr
   */
  async scrapeOffers(url: string, options: ScrapingOptions = {}): Promise<Offer[]> {
    if (!this.isAvailable) {
      console.log('🔄 Scraperr no disponible, usando deepscrape...');
      return await this.extractWithFallback(url, options);
    }

    const {
      waitForSelector = '.product-card',
      scrollTimes = 3,
      scrollDelay = 2000,
      timeout = this.config.timeout
    } = options;

    const config = {
      url,
      selectors: {
        productCards: waitForSelector,
        title: '[data-component="ProductCardName"], .product-card-name, h3',
        brand: '[data-component="ProductCardBrand"], .product-card-brand, .brand',
        price: '[data-component="ProductCardPrice"], .product-card-price, .price',
        image: 'img',
        link: 'a'
      },
      options: {
        scrollTimes,
        scrollDelay,
        timeout,
        useSession: options.useSession,
        sessionCookies: this.sessionCookies
      }
    };

    return new Promise<Offer[]>((resolve, reject) => {
      const childProcess: ChildProcess = spawn('node', ['scrape.js'], {
        cwd: this.config.externalPath,
        env: { 
          ...process.env, 
          CONFIG: JSON.stringify(config)
        }
      });

      let output = '';
      let errorOutput = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      childProcess.on('close', (code: number | null) => {
        if (code === 0) {
          try {
            const offers = JSON.parse(output);
            console.log(`✅ Scraping completado: ${offers.length} ofertas encontradas`);
            resolve(offers);
          } catch (e) {
            console.log(' Error parsing scraperr output, usando fallback...');
            this.extractWithFallback(url, options).then(resolve).catch(reject);
          }
        } else {
          console.log('🔄 Scraperr falló, usando fallback...');
          this.extractWithFallback(url, options).then(resolve).catch(reject);
        }
      });

      childProcess.on('error', (error: Error) => {
        console.log(' Error en scraperr, usando fallback...');
        this.extractWithFallback(url, options).then(resolve).catch(reject);
      });

      setTimeout(() => {
        childProcess.kill();
        console.log(' Timeout en scraperr, usando fallback...');
        this.extractWithFallback(url, options).then(resolve).catch(reject);
      }, timeout);
    });
  }

  /**
   * Extract with deepscrape fallback
   */
  async extractWithFallback(url: string, options: ScrapingOptions = {}): Promise<Offer[]> {
    try {
      console.log('🤖 Usando deepscrape para extracción...');
      
      const elements = [
        { selector: '.product-card', type: 'html' as const },
        { selector: '[data-component="ProductCardName"]', type: 'text' as const },
        { selector: '[data-component="ProductCardBrand"]', type: 'text' as const },
        { selector: '[data-component="ProductCardPrice"]', type: 'text' as const },
        { selector: 'img', type: 'attribute' as const, attribute: 'src' },
        { selector: 'a', type: 'attribute' as const, attribute: 'href' }
      ];

      const result = await deepscrape.resolve({
        pageUrl: url,
        elements,
        waitForSelector: options.waitForSelector || '.product-card',
        timeout: options.timeout || this.config.timeout
      });

      if (!result.success) {
        throw new Error(result.error || 'Deepscrape failed');
      }

      // Transform deepscrape data to offers format
      const offers: Offer[] = result.data.map((item: any, index: number) => ({
        id: `offer-${index}-${Date.now()}`,
        title: item.title || item.text || '',
        brand: item.brand || '',
        price: parseFloat(item.price?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        imageUrl: item.imageUrl || item.src || '',
        productUrl: item.productUrl || item.href || '',
        availability: true,
        timestamp: new Date()
      }));

      console.log(`✅ Fallback completado: ${offers.length} ofertas encontradas`);
      return offers;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error en fallback: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Get scraping statistics
   */
  getStats(): { 
    sessionLoaded: boolean; 
    cookiesCount: number; 
    scraperrAvailable: boolean;
    deepscrapeAvailable: boolean;
  } {
    return {
      sessionLoaded: this.sessionCookies.length > 0,
      cookiesCount: this.sessionCookies.length,
      scraperrAvailable: this.isAvailable,
      deepscrapeAvailable: false // Se actualizará de forma asíncrona si es necesario
    };
  }

  /**
   * Get async statistics including deepscrape status
   */
  async getStatsAsync(): Promise<{ 
    sessionLoaded: boolean; 
    cookiesCount: number; 
    scraperrAvailable: boolean;
    deepscrapeAvailable: boolean;
  }> {
    const deepscrapeStatus = await deepscrape.getStatus();
    return {
      sessionLoaded: this.sessionCookies.length > 0,
      cookiesCount: this.sessionCookies.length,
      scraperrAvailable: this.isAvailable,
      deepscrapeAvailable: deepscrapeStatus.available
    };
  }
}

// Exportar instancia por defecto
export const scraperr = new ScraperrHook({
  externalPath: join(process.cwd(), 'external', 'scraperr'),
  timeout: 30000,
  retries: 3
}); 