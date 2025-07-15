import { 
  Offer, 
  IBrowserMCP, 
  IScraperr, 
  IDeepScrape, 
  Fingerprint
} from './types';
import { loadBrowserMCP, loadScraperr, loadDeepScrape } from '../utils/moduleLoader';
import { log } from '../services/logger';
import { promises as fs } from 'fs';
import { join } from 'path';

// Tipo simple para sesión
interface SimpleSession {
  sessionId: string;
  cookies: any[];
  userId: string;
  timestamp: Date;
  status: string;
}

// Tipo para datos de scraping
interface ScrapingData {
  url: string;
  data: {
    offers: Offer[];
    timestamp: Date;
    totalFound: number;
    source: string;
  };
  timestamp: Date;
}

// Opciones del orquestador
interface OrchestratorOptions {
  sessionId?: string;
  email?: string;
  password?: string;
  scrapeUrl: string;
  maxRetries?: number;
  fingerprintLevel?: 'low' | 'medium' | 'high';
}

export class SimpleOrchestrator {
  private browserMCP: IBrowserMCP | null = null;
  private scraperr: IScraperr | null = null;
  private deepscrape: IDeepScrape | null = null;
  private dataDirectory = join(process.cwd(), 'data', 'scraping');

  static async create(): Promise<SimpleOrchestrator> {
    const orchestrator = new SimpleOrchestrator();
    await orchestrator.ensureModulesLoaded();
    return orchestrator;
  }

  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`ℹ️ [${timestamp}] [Orchestrator] ${message}`);
  }

  /**
   * Cargar módulos si no están cargados
   */
  private async ensureModulesLoaded(): Promise<void> {
    if (!this.browserMCP || !this.scraperr || !this.deepscrape) {
      this.log('Iniciando carga de módulos...');
      
      try {
        this.browserMCP = await loadBrowserMCP();
        this.scraperr = await loadScraperr();
        this.deepscrape = await loadDeepScrape();
        
        this.log('✅ Todos los módulos cargados correctamente');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.log(`❌ Error cargando módulos: ${message}`);
        throw error;
      }
    }
  }

  /**
   * Crear sesión simple
   */
  private async createSimpleSession(options: OrchestratorOptions): Promise<SimpleSession> {
    const { sessionId = '', email, password } = options;

    if (email && password) {
      this.log('🔐 Intentando login...');
      
      try {
        const loginResult = await this.browserMCP!.login(email, password, {
          use2FA: false,
          fingerprint: this.generateFingerprint()
        });

        if (loginResult.success) {
          return {
            sessionId: loginResult.sessionId || `session-${Date.now()}`,
            cookies: loginResult.cookies || [],
            userId: '',
            timestamp: new Date(),
            status: 'active'
          };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.log(`⚠️ Login falló: ${message}`);
      }
    }

    // Sesión temporal sin login
    return {
      sessionId: sessionId || `temp-session-${Date.now()}`,
      cookies: [],
      userId: '',
      timestamp: new Date(),
      status: 'active'
    };
  }

  /**
   * Ejecutar scraping secuencial completo
   */
  async scrapeWithSession(options: OrchestratorOptions): Promise<Offer[]> {
    await this.ensureModulesLoaded();
    
    const { scrapeUrl, maxRetries = 3 } = options;
    
    if (!scrapeUrl) {
      throw new Error('URL de scraping requerida');
    }

    this.log(`🎯 Ejecutando scraping secuencial: Browser-MCP → Scraperr → DeepScrape`);
    
    const session = await this.createSimpleSession(options);
    const allOffers: Offer[] = [];
    const results: any[] = [];

    // 1. Browser-MCP
    this.log(`🌐 [1/3] Ejecutando Browser-MCP...`);
    try {
      const browserOffers = await this.executeBrowserMCP(scrapeUrl, session);
      if (browserOffers.length > 0) {
        allOffers.push(...browserOffers);
        results.push({ module: 'browser-mcp', count: browserOffers.length, success: true });
        this.log(`✅ Browser-MCP: ${browserOffers.length} ofertas extraídas`);
      } else {
        results.push({ module: 'browser-mcp', count: 0, success: false });
        this.log(`⚠️ Browser-MCP: Sin ofertas extraídas`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ module: 'browser-mcp', count: 0, success: false, error: message });
      this.log(`❌ Error en Browser-MCP: ${message}`);
    }

    // 2. Scraperr
    this.log(`🔍 [2/3] Ejecutando Scraperr...`);
    try {
      const scraperOffers = await this.executeScraperr(scrapeUrl, session);
      if (scraperOffers.length > 0) {
        allOffers.push(...scraperOffers);
        results.push({ module: 'scraperr', count: scraperOffers.length, success: true });
        this.log(`✅ Scraperr: ${scraperOffers.length} ofertas extraídas`);
      } else {
        results.push({ module: 'scraperr', count: 0, success: false });
        this.log(`⚠️ Scraperr: Sin ofertas extraídas`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ module: 'scraperr', count: 0, success: false, error: message });
      this.log(`❌ Error en Scraperr: ${message}`);
    }

    // 3. DeepScrape
    this.log(`🤖 [3/3] Ejecutando DeepScrape...`);
    try {
      const deepOffers = await this.executeDeepScrape(scrapeUrl);
      if (deepOffers.length > 0) {
        allOffers.push(...deepOffers);
        results.push({ module: 'deepscrape', count: deepOffers.length, success: true });
        this.log(`✅ DeepScrape: ${deepOffers.length} ofertas extraídas`);
      } else {
        results.push({ module: 'deepscrape', count: 0, success: false });
        this.log(`⚠️ DeepScrape: Sin ofertas extraídas`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ module: 'deepscrape', count: 0, success: false, error: message });
      this.log(`❌ Error en DeepScrape: ${message}`);
    }

    // Consolidar resultados
    const uniqueOffers = allOffers.filter((offer, index, self) => 
      index === self.findIndex(o => o.id === offer.id)
    );

    this.log(`🔍 Total: ${allOffers.length} ofertas → ${uniqueOffers.length} únicas de ${results.filter(r => r.success).length}/3 módulos`);

    if (uniqueOffers.length === 0) {
      throw new Error('Todos los módulos de scraping fallaron');
    }

    // Guardar consolidado
    try {
      await this.saveToLocalDirectory({
        url: scrapeUrl,
        data: {
          offers: uniqueOffers,
          timestamp: new Date(),
          totalFound: uniqueOffers.length,
          source: 'sequential-workflow'
        },
        timestamp: new Date()
      }, 'consolidated');
      
      this.log(`📦 Resumen del workflow guardado localmente`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`⚠️ Error guardando consolidado: ${message}`);
    }

    this.log(`✅ Scraping secuencial exitoso: ${uniqueOffers.length} ofertas únicas`);
    return uniqueOffers;
  }

  /**
   * Ejecutar Browser-MCP
   */
  public async executeBrowserMCP(scrapeUrl: string, session: SimpleSession): Promise<Offer[]> {
    try {
      this.log(`🌐 Ejecutando Browser-MCP para ${scrapeUrl}`);
      
      const offers = await this.browserMCP!.scrapeOffers(scrapeUrl, {
        useSession: !!session.sessionId,
        timeout: 30000
      });

      if (offers.length > 0) {
        await this.saveToLocalDirectory({
          url: scrapeUrl,
          data: {
            offers,
            timestamp: new Date(),
            totalFound: offers.length,
            source: 'browser-mcp'
          },
          timestamp: new Date()
        }, 'browser-mcp');
        
        this.log(`📦 Browser-MCP: ${offers.length} ofertas guardadas localmente`);
      }

      return offers;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`❌ Error en Browser-MCP: ${message}`);
      return [];
    }
  }

  /**
   * Ejecutar Scraperr
   */
  public async executeScraperr(scrapeUrl: string, session: SimpleSession): Promise<Offer[]> {
    try {
      this.log(`🔍 Ejecutando Scraperr para ${scrapeUrl}`);
      
      const offers = await this.scraperr!.scrapeOffers(scrapeUrl, {
        useSession: !!session.sessionId,
        timeout: 30000
      });

      if (offers.length > 0) {
        await this.saveToLocalDirectory({
          url: scrapeUrl,
          data: {
            offers,
            timestamp: new Date(),
            totalFound: offers.length,
            source: 'scraperr'
          },
          timestamp: new Date()
        }, 'scraperr');
        
        this.log(`📦 Scraperr: ${offers.length} ofertas guardadas localmente`);
      }

      return offers;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`❌ Error en Scraperr: ${message}`);
      return [];
    }
  }

  /**
   * Ejecutar DeepScrape
   */
  public async executeDeepScrape(scrapeUrl: string): Promise<Offer[]> {
    try {
      this.log(`🤖 Ejecutando DeepScrape para ${scrapeUrl}`);
      
      const result = await this.deepscrape!.resolve({
        pageUrl: scrapeUrl,
        elements: ['[data-testid="product-card"]', '.product-item'],
        timeout: 30000
      });

      const offers = result.data || [];

      if (offers.length > 0) {
        await this.saveToLocalDirectory({
          url: scrapeUrl,
          data: {
            offers,
            timestamp: new Date(),
            totalFound: offers.length,
            source: 'deepscrape'
          },
          timestamp: new Date()
        }, 'deepscrape');
        
        this.log(`📦 DeepScrape: ${offers.length} ofertas guardadas localmente`);
      }

      return offers;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`❌ Error en DeepScrape: ${message}`);
      return [];
    }
  }

  /**
   * Guardar datos en directorio local
   */
  private async saveToLocalDirectory(data: ScrapingData, module: string): Promise<void> {
    try {
      const moduleDir = join(this.dataDirectory, module);
      await fs.mkdir(moduleDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}-${Date.now()}.json`;
      const filepath = join(moduleDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      this.log(`💾 Datos guardados: ${filepath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`❌ Error guardando datos: ${message}`);
    }
  }

  /**
   * Generar fingerprint
   */
  private generateFingerprint(): Fingerprint {
    return {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      platform: 'Win32',
      viewport: { width: 1366, height: 768 },
      timezone: 'America/New_York',
      locale: 'en-US',
      languages: ['en-US', 'en'],
      webglVendor: 'Intel Inc.',
      webglRenderer: 'Intel Iris OpenGL Engine',
      audioContext: 44100,
      lastRotation: new Date()
    };
  }

  /**
   * Obtener estado de los módulos
   */
  public getModuleStatus() {
    return {
      browserMCP: !!this.browserMCP,
      scraperr: !!this.scraperr,
      deepscrape: !!this.deepscrape
    };
  }
}
