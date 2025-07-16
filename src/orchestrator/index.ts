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

// Tipo para sesión
interface SessionData {
  sessionId: string;
  cookies: any[];
  userId: string;
  timestamp: Date;
  status: string;
  fingerprint?: any;
}

// Tipo para datos de scraping
interface ScrapingData {
  url: string;
  selectors?: string[];
  data: {
    offers: Offer[];
    timestamp: Date;
    totalFound: number;
    source: string;
    [key: string]: any; // Permitir propiedades adicionales
  };
  timestamp: Date;
}

type OrchestratorOptions = {
  sessionId?: string;
  email?: string;
  password?: string;
  loginIfNeeded?: boolean;
  proxy?: string;
  fingerprintLevel?: 'low' | 'medium' | 'high';
  scrapeUrl?: string;
  persistSession?: boolean;
  maxRetries?: number;
};

interface IOrchestratorDependencies {
  browserMCP: IBrowserMCP;
  scraperr: IScraperr;
  deepscrape: IDeepScrape;
}

export class Orchestrator {
  private browserMCP: IBrowserMCP | null = null;
  private scraperr: IScraperr | null = null;
  private deepscrape: IDeepScrape | null = null;
  private dataDirectory = join(process.cwd(), 'data', 'scraping');

  /**
   * Método de fábrica para crear una instancia del orquestador
   */
  static async create(): Promise<Orchestrator> {
    try {
      log.info('Orchestrator', 'Iniciando carga de módulos...');

      const [browserMCP, scraperr, deepscrape] = await Promise.all([
        loadBrowserMCP().then(module => {
          log.success('Orchestrator', 'Módulo Browser-MCP cargado exitosamente');
          return module;
        }),
        loadScraperr().then(module => {
          log.success('Orchestrator', 'Módulo Scraperr cargado exitosamente');
          return module;
        }),
        loadDeepScrape().then(module => {
          log.success('Orchestrator', 'Módulo DeepScrape cargado exitosamente');
          return module;
        })
      ]);

      log.success('Orchestrator', 'Todos los módulos cargados correctamente');
      return new Orchestrator({ browserMCP, scraperr, deepscrape });
    } catch (error) {
      log.error('Orchestrator', 'Error al inicializar el orquestador', error);
      throw new Error('No se pudieron cargar los módulos necesarios');
    }
  }

  // Constructor público para compatibilidad
  constructor(deps?: IOrchestratorDependencies) {
    if (deps) {
      this.browserMCP = deps.browserMCP;
      this.scraperr = deps.scraperr;
      this.deepscrape = deps.deepscrape;
    }
    // Si no se proporcionan deps, se inicializarán como null y se cargarán bajo demanda
  }

  /**
   * Inicializar módulos bajo demanda
   */
  private async ensureModulesLoaded() {
    if (!this.browserMCP || !this.scraperr || !this.deepscrape) {
      try {
        const [browserMCP, scraperr, deepscrape] = await Promise.all([
          loadBrowserMCP(),
          loadScraperr(),
          loadDeepScrape()
        ]);
        this.browserMCP = browserMCP;
        this.scraperr = scraperr;
        this.deepscrape = deepscrape;
      } catch (error) {
        console.error('Error al cargar módulos:', error);
        throw new Error('No se pudieron cargar los módulos necesarios');
      }
    }
  }

  /**
   * Flujo robusto de login y persistencia de sesión
   */
  async ensureSession(options: OrchestratorOptions): Promise<SessionData> {
    await this.ensureModulesLoaded();
    const {
      sessionId = '',
      email,
      password,
      loginIfNeeded = true,
      fingerprintLevel = 'medium',
      persistSession = true,
      proxy
    } = options;

    // 1. Crear sesión temporal (sin persistencia)
    if (sessionId) {
      this.log(`🔄 Usando sessionId: ${sessionId}`);
    }

    // 2. Si no existe, hacer login si está permitido
    if (loginIfNeeded && email && password) {
      this.log('🔐 Iniciando login con Browser MCP...');
      
      try {
        const loginResult = await this.browserMCP!.login(email, password, {
          use2FA: false,
          fingerprint: this.generateFingerprint(fingerprintLevel),
          proxy
        });

        if (loginResult.success && persistSession) {
          const sessionData: SessionData = {
            sessionId: loginResult.sessionId || `session-${Date.now()}`,
            cookies: loginResult.cookies || [],
            userId: '',
            fingerprint: {},
            timestamp: new Date(),
            status: 'active'
          };
          
          this.log(`✅ Sesión temporal creada: ${sessionData.sessionId}`);
          return sessionData;
        } else {
          throw new Error(`Login fallido: ${loginResult.error || 'Unknown error'}`);
        }
      } catch (error) {
        this.log(`❌ Error en login: ${error}`);
        throw error;
      }
    }

    throw new Error('No se pudo obtener una sesión válida');
  }

  /**
   * Flujo robusto de scraping con manejo de sesión y fallback
   */
  async scrapeWithSession(options: OrchestratorOptions): Promise<Offer[]> {
    await this.ensureModulesLoaded();
    const {
      sessionId = '',
      scrapeUrl = ''
    } = options;

    if (!scrapeUrl) {
      throw new Error('URL de scraping requerida');
    }

    let session: SessionData | null = null;

    // 1. Crear sesión temporal
    if (sessionId) {
      session = {
        sessionId,
        cookies: [],
        userId: '',
        timestamp: new Date(),
        status: 'active'
      };
      this.log(`✅ Sesión temporal: ${sessionId}`);
    }

    // 2. EJECUTAR LOS 3 MÓDULOS SECUENCIALMENTE
    this.log(`🎯 Ejecutando scraping secuencial: Browser-MCP → Scraperr → DeepScrape`);

    let allOffers: Offer[] = [];
    let successfulModules = 0;
    const moduleResults: { module: string; offers: Offer[]; success: boolean; error?: string }[] = [];

    // PASO 1: Browser-MCP (Autenticación y scraping inicial)
    this.log(`🌐 [1/3] Ejecutando Browser-MCP...`);
    try {
      const browserOffers = await this.executeBrowserMCP(scrapeUrl, session, sessionId);
      moduleResults.push({ module: 'browser-mcp', offers: browserOffers, success: browserOffers.length > 0 });

      if (browserOffers.length > 0) {
        allOffers.push(...browserOffers);
        successfulModules++;
        this.log(`✅ Browser-MCP: ${browserOffers.length} ofertas extraídas`);
      } else {
        this.log(`⚠️ Browser-MCP: Sin ofertas extraídas`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      moduleResults.push({ module: 'browser-mcp', offers: [], success: false, error: errorMsg });
      this.log(`❌ Browser-MCP falló: ${errorMsg}`);
    }

    // PASO 2: Scraperr (Scraping con sesión establecida)
    this.log(`🔍 [2/3] Ejecutando Scraperr...`);
    try {
      const scraperOffers = await this.executeScraperr(scrapeUrl, session, sessionId);
      moduleResults.push({ module: 'scraperr', offers: scraperOffers, success: scraperOffers.length > 0 });

      if (scraperOffers.length > 0) {
        allOffers.push(...scraperOffers);
        successfulModules++;
        this.log(`✅ Scraperr: ${scraperOffers.length} ofertas extraídas`);
      } else {
        this.log(`⚠️ Scraperr: Sin ofertas extraídas`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      moduleResults.push({ module: 'scraperr', offers: [], success: false, error: errorMsg });
      this.log(`❌ Scraperr falló: ${errorMsg}`);
    }

    // PASO 3: DeepScrape (Fallback y scraping profundo)
    this.log(`🤖 [3/3] Ejecutando DeepScrape...`);
    try {
      const deepOffers = await this.executeDeepScrape(scrapeUrl);
      moduleResults.push({ module: 'deepscrape', offers: deepOffers, success: deepOffers.length > 0 });

      if (deepOffers.length > 0) {
        allOffers.push(...deepOffers);
        successfulModules++;
        this.log(`✅ DeepScrape: ${deepOffers.length} ofertas extraídas`);
      } else {
        this.log(`⚠️ DeepScrape: Sin ofertas extraídas`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      moduleResults.push({ module: 'deepscrape', offers: [], success: false, error: errorMsg });
      this.log(`❌ DeepScrape falló: ${errorMsg}`);
    }

    // Filtrar ofertas duplicadas entre módulos
    const uniqueOffers = this.removeDuplicateOffers(allOffers);
    this.log(`🔍 Total: ${allOffers.length} ofertas → ${uniqueOffers.length} únicas de ${successfulModules}/3 módulos`);

    // Guardar resumen consolidado con resultados de cada módulo
    if (uniqueOffers.length > 0) {
      this.log(`✅ Scraping secuencial exitoso: ${uniqueOffers.length} ofertas únicas`);

      try {
        await this.saveToLocalDirectory({
          url: scrapeUrl,
          selectors: [],
          data: {
            offers: uniqueOffers,
            timestamp: new Date(),
            totalFound: uniqueOffers.length,
            source: 'sequential-workflow',
            moduleResults,
            successfulModules,
            originalCount: allOffers.length,
            duplicatesRemoved: allOffers.length - uniqueOffers.length
          },
          timestamp: new Date()
        }, 'workflow-consolidated');
        this.log(`📦 Resumen del workflow guardado en MinIO`);
      } catch (error) {
        this.log(`⚠️ Error guardando resumen del workflow: ${error}`);
      }

      return uniqueOffers;
    }

    // Si ningún módulo encontró ofertas
    if (successfulModules === 0) {
      this.log(`❌ Ningún módulo pudo extraer ofertas de ${scrapeUrl}`);
      throw new Error('Todos los módulos de scraping fallaron');
    }

    this.log(`⚠️ Solo ${successfulModules}/3 módulos extrajeron ofertas exitosamente`);
    return [];
  }

  /**
   * Ejecutar Browser-MCP y guardar datos en MinIO
   */
  public async executeBrowserMCP(scrapeUrl: string, session: SessionData | null, sessionId: string): Promise<Offer[]> {
    try {
      this.log(`🌐 Ejecutando Browser-MCP para ${scrapeUrl}`);

      const offers = await this.browserMCP!.scrapeOffers(scrapeUrl, {
        useSession: !!session,
        sessionId,
        timeout: 40000
      });

      if (offers.length > 0) {
        // Guardar datos específicos de Browser-MCP en directorio local
        await this.saveToLocalDirectory({
          url: scrapeUrl,
          selectors: ['[data-testid="product-card"]', '.product-item'],
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
      this.log(`❌ Error en Browser-MCP: ${error}`);
      return [];
    }
  }

  /**
   * Ejecutar Scraperr y guardar datos en MinIO
   */
  public async executeScraperr(scrapeUrl: string, session: SessionData | null, sessionId: string): Promise<Offer[]> {
    try {
      this.log(`🔍 Ejecutando Scraperr para ${scrapeUrl}`);

      if (session) {
        await this.scraperr!.loadSession(session);
      }

      const offers = await this.scraperr!.scrapeOffers(scrapeUrl, {
        useSession: !!session,
        sessionId,
        timeout: 45000,
        waitForSelector: '[data-component="ProductCard"]',
        scrollTimes: 5,
        scrollDelay: 3000
      });

      if (offers.length > 0) {
        // Guardar datos específicos de Scraperr en MinIO
        await this.saveToLocalDirectory({
          url: scrapeUrl,
          selectors: [
            '[data-component="ProductCard"]',
            '[data-component="ProductCardPrice"]',
            '.product-card'
          ],
          data: {
            offers,
            timestamp: new Date(),
            totalFound: offers.length,
            source: 'scraperr'
          },
          timestamp: new Date()
        }, 'scraperr');

        this.log(`📦 Scraperr: ${offers.length} ofertas guardadas en MinIO`);
      }

      return offers;
    } catch (error) {
      this.log(`❌ Error en Scraperr: ${error}`);
      return [];
    }
  }

  /**
   * Ejecutar DeepScrape y guardar datos en MinIO
   */
  public async executeDeepScrape(scrapeUrl: string): Promise<Offer[]> {
    try {
      this.log(`🤖 Ejecutando DeepScrape para ${scrapeUrl}`);

      const result = await this.deepscrape!.resolve({
        pageUrl: scrapeUrl,
        elements: [
          '[data-testid="product-card"]',
          '.product-item',
          '.offer-card',
          '[data-component="ProductCard"]'
        ],
        timeout: 30000
      });

      const offers = result.data || [];

      if (offers.length > 0) {
        // Guardar datos específicos de DeepScrape en MinIO
        await this.saveToLocalDirectory({
          url: scrapeUrl,
          selectors: [
            '[data-testid="product-card"]',
            '.product-item',
            '.offer-card'
          ],
          data: {
            offers,
            timestamp: new Date(),
            totalFound: offers.length,
            source: 'deepscrape'
          },
          timestamp: new Date()
        }, 'deepscrape');

        this.log(`📦 DeepScrape: ${offers.length} ofertas guardadas en MinIO`);
      }

      return offers;
    } catch (error) {
      this.log(`❌ Error en DeepScrape: ${error}`);
      return [];
    }
  }

  /**
   * Guardar datos en directorio local
   */
  private async saveToLocalDirectory(data: ScrapingData, module: string): Promise<void> {
    try {
      // Crear directorio si no existe
      const moduleDir = join(this.dataDirectory, module);
      await fs.mkdir(moduleDir, { recursive: true });

      // Crear nombre de archivo con timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}-${Date.now()}.json`;
      const filepath = join(moduleDir, filename);

      // Guardar datos
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      this.log(`💾 Datos guardados: ${filepath}`);
    } catch (error) {
      this.log(`❌ Error guardando datos: ${error}`);
    }
  }

  /**
   * Cargar datos desde directorio local
   */
  private async loadFromLocalDirectory(module?: string, limit: number = 10): Promise<ScrapingData[]> {
    try {
      const results: ScrapingData[] = [];
      const searchDir = module ? join(this.dataDirectory, module) : this.dataDirectory;

      // Verificar si el directorio existe
      try {
        await fs.access(searchDir);
      } catch {
        return [];
      }

      if (module) {
        // Cargar archivos de un módulo específico
        const files = await fs.readdir(searchDir);
        const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, limit);

        for (const file of jsonFiles) {
          try {
            const content = await fs.readFile(join(searchDir, file), 'utf-8');
            const data = JSON.parse(content);
            results.push(data);
          } catch (error) {
            this.log(`⚠️ Error leyendo archivo ${file}: ${error}`);
          }
        }
      } else {
        // Cargar archivos de todos los módulos
        const modules = await fs.readdir(searchDir);
        for (const mod of modules) {
          const modData = await this.loadFromLocalDirectory(mod, Math.ceil(limit / modules.length));
          results.push(...modData);
        }
      }

      return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      this.log(`❌ Error cargando datos: ${error}`);
      return [];
    }
  }

  /**
   * Obtener todas las ofertas desde directorio local
   */
  public async getAllOffers(limit: number = 50): Promise<Offer[]> {
    const allData = await this.loadFromLocalDirectory(undefined, limit);
    const offers: Offer[] = [];

    allData.forEach(data => {
      if (data.data?.offers && Array.isArray(data.data.offers)) {
        offers.push(...data.data.offers);
      }
    });

    // Filtrar duplicados por ID
    const uniqueOffers = offers.filter((offer, index, self) =>
      index === self.findIndex(o => o.id === offer.id)
    );

    return uniqueOffers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Generar fingerprint para Browser MCP
   */
  private generateFingerprint(_level: 'low' | 'medium' | 'high' = 'medium'): Fingerprint {
    // Implementación básica de fingerprint
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
   * Utilidad para logging centralizado
   */
  private log(msg: string, level: 'info' | 'warn' | 'error' | 'debug' | 'success' = 'info') {
    // Determinar el nivel basado en el contenido del mensaje
    if (msg.includes('❌') || msg.includes('Error') || msg.includes('fallido')) {
      level = 'error';
    } else if (msg.includes('⚠️') || msg.includes('Warning')) {
      level = 'warn';
    } else if (msg.includes('✅') || msg.includes('exitoso') || msg.includes('guardado')) {
      level = 'success';
    } else if (msg.includes('🔍') || msg.includes('Debug')) {
      level = 'debug';
    }

    log[level]('Orchestrator', msg);
  }

  /**
   * Utilidad para delays/reintentos
   */
  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getStats() {
    try {
      const [browserStatus, scraperrStats] = await Promise.all([
        this.browserMCP!.getStatus(),
        this.scraperr!.getStatsAsync()
      ]);

      return {
        browserMCP: browserStatus,
        scraperr: scraperrStats,
        localStorage: { available: true, directory: this.dataDirectory },
        timestamp: new Date()
      };
    } catch (error) {
      this.log(`❌ Error obteniendo estadísticas: ${error}`);
      throw error;
    }
  }

  // Método para cerrar sesión
  async logout() {
    try {
      // Implementar lógica de cierre de sesión si es necesario
      this.log('Cerrando sesión...');
      // Ejemplo: await this.browserMCP.logout();
    } catch (error) {
      this.log(`⚠️ Error al cerrar sesión: ${error}`);
      throw error;
    }
  }

  /**
   * Remover ofertas duplicadas basándose en título y precio
   */
  private removeDuplicateOffers(offers: Offer[]): Offer[] {
    const uniqueMap = new Map<string, Offer>();

    offers.forEach(offer => {
      // Crear clave única basada en título normalizado y precio
      const normalizedTitle = offer.title.toLowerCase().replace(/\s+/g, ' ').trim();
      const key = `${normalizedTitle}_${offer.price}`;

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, offer);
      } else {
        // Si ya existe, mantener el que tenga más información
        const existing = uniqueMap.get(key)!;
        if (this.isOfferMoreComplete(offer, existing)) {
          uniqueMap.set(key, offer);
        }
      }
    });

    return Array.from(uniqueMap.values());
  }

  /**
   * Determinar si una oferta es más completa que otra
   */
  private isOfferMoreComplete(offer1: Offer, offer2: Offer): boolean {
    let score1 = 0;
    let score2 = 0;

    // Puntos por tener información completa
    if (offer1.brand) score1++;
    if (offer2.brand) score2++;

    if (offer1.originalPrice) score1++;
    if (offer2.originalPrice) score2++;

    if (offer1.imageUrl) score1++;
    if (offer2.imageUrl) score2++;

    if (offer1.url) score1++;
    if (offer2.url) score2++;

    return score1 > score2;
  }

}

// Ejemplo de uso (puedes mover esto a un handler o script aparte)
async function exampleUsage() {
  try {
    const orchestrator = await Orchestrator.create();
    
    // Ejemplo: Iniciar sesión
    const session = await orchestrator.ensureSession({
      email: process.env.FF_EMAIL || 'usuario@ejemplo.com',
      password: process.env.FF_PASSWORD || 'contraseña',
      loginIfNeeded: true,
      fingerprintLevel: 'medium'
    });
    
    console.log('Sesión iniciada:', session);
    
    // Ejemplo: Ejecutar scraping
    const results = await orchestrator.scrapeWithSession({
      sessionId: session.sessionId,
      scrapeUrl: 'https://www.farfetch.com/shopping/men/shoes-2/items.aspx',
      maxRetries: 3
    });
    
    console.log('Resultados del scraping:', results);
    
    // Cerrar sesión
    await orchestrator.logout();
  } catch (error) {
    console.error('Error en el flujo principal:', error);
    process.exit(1);
  }
}

// Si se ejecuta directamente como script
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().catch((err) => {
    console.error('Error en orquestador:', err);
    process.exit(1);
  });
}

export default Orchestrator; 