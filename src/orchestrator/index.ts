import { SessionData, ScrapingData } from '../modules/minio/index';
import { Offer } from './types';
import { loadBrowserMCP, loadScraperr } from '../utils/moduleLoader';
import { minioStorage } from '../modules/minio/index';

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
  browserMCP: any; // Reemplazar con el tipo correcto
  scraperr: any;    // Reemplazar con el tipo correcto
}

export class Orchestrator {
  private browserMCP: any;
  private minio = minioStorage;
  private scraperr: any;

  /**
   * Método de fábrica para crear una instancia del orquestador
   */
  static async create(): Promise<Orchestrator> {
    try {
      const [browserMCP, scraperr] = await Promise.all([
        loadBrowserMCP(),
        loadScraperr()
      ]);

      return new Orchestrator({ browserMCP, scraperr });
    } catch (error) {
      console.error('Error al inicializar el orquestador:', error);
      throw new Error('No se pudieron cargar los módulos necesarios');
    }
  }

  // Constructor público para compatibilidad
  constructor(deps?: IOrchestratorDependencies) {
    if (deps) {
      this.browserMCP = deps.browserMCP;
      this.scraperr = deps.scraperr;
    }
    // Si no se proporcionan deps, se inicializarán como null y se cargarán bajo demanda
  }

  /**
   * Inicializar módulos bajo demanda
   */
  private async ensureModulesLoaded() {
    if (!this.browserMCP || !this.scraperr) {
      try {
        const [browserMCP, scraperr] = await Promise.all([
          loadBrowserMCP(),
          loadScraperr()
        ]);
        this.browserMCP = browserMCP;
        this.scraperr = scraperr;
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

    // 1. Intentar cargar sesión desde MinIO
    if (sessionId) {
      try {
        const session = await this.minio.loadSession(sessionId);
        if (session && session.status === 'active') {
          this.log(`✅ Sesión encontrada en MinIO: ${sessionId}`);
          return session;
        }
      } catch (error) {
        this.log(`⚠️ Error cargando sesión: ${error}`);
      }
    }

    // 2. Si no existe, hacer login si está permitido
    if (loginIfNeeded && email && password) {
      this.log('🔐 Iniciando login con Browser MCP...');
      
      try {
        const loginResult = await this.browserMCP.login(email, password, {
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
          
          await this.minio.saveSession(sessionData);
          this.log(`💾 Sesión guardada en MinIO: ${sessionData.sessionId}`);
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
      scrapeUrl = '',
      maxRetries = 2
    } = options;

    if (!scrapeUrl) {
      throw new Error('URL de scraping requerida');
    }

    let session: SessionData | null = null;
    let retries = 0;
    let lastError: any = null;

    // 1. Cargar sesión
    try {
      if (sessionId) {
        session = await this.minio.loadSession(sessionId);
        if (session) {
          await this.scraperr.loadSession(session);
          this.log(`✅ Sesión cargada: ${sessionId}`);
        }
      }
    } catch (error) {
      this.log(`⚠️ Error cargando sesión: ${error}`);
      // Continuar sin sesión si falla
    }

    // 2. Intentar scraping con reintentos y fallback
    while (retries <= maxRetries) {
      try {
        this.log(`🔎 Scraping intento #${retries + 1} para ${scrapeUrl}`);
        const offers = await this.scraperr.scrapeOffers(scrapeUrl, { 
          useSession: !!session, 
          sessionId,
          timeout: 30000
        });
        
        if (offers.length > 0) {
          this.log(`✅ Scraping exitoso: ${offers.length} ofertas encontradas`);

          // Guardar datos de scraping en MinIO para la API
          try {
            await this.minio.saveScrapingData({
              url: scrapeUrl,
              selectors: [], // Los selectores se manejan internamente en scraperr
              data: { offers, timestamp: new Date(), totalFound: offers.length },
              timestamp: new Date()
            });
            this.log(`📦 Datos de scraping guardados en MinIO`);
          } catch (error) {
            this.log(`⚠️ Error guardando datos de scraping: ${error}`);
            // No fallar el scraping por error de guardado
          }

          return offers;
        }
        throw new Error('No se encontraron ofertas');
      } catch (error) {
        lastError = error;
        this.log(`❌ Error en scraping: ${error}`);
        retries++;
        if (retries > maxRetries) break;
        this.log('🔄 Reintentando scraping...');
        await this.delay(2000 * retries);
      }
    }

    // 3. Fallback a deepscrape si todo falla
    this.log('🤖 Fallback a deepscrape...');
    try {
      const offers = await this.scraperr.extractWithFallback(scrapeUrl, { 
        useSession: !!session, 
        sessionId,
        timeout: 30000
      });
      
      if (offers.length > 0) {
        this.log(`✅ Deepscrape exitoso: ${offers.length} ofertas encontradas`);

        // Guardar datos de scraping en MinIO para la API
        try {
          await this.minio.saveScrapingData({
            url: scrapeUrl,
            selectors: [], // Los selectores se manejan internamente en deepscrape
            data: { offers, timestamp: new Date(), totalFound: offers.length, source: 'deepscrape' },
            timestamp: new Date()
          });
          this.log(`📦 Datos de deepscrape guardados en MinIO`);
        } catch (error) {
          this.log(`⚠️ Error guardando datos de deepscrape: ${error}`);
          // No fallar el scraping por error de guardado
        }

        return offers;
      }
      throw new Error('Deepscrape tampoco encontró ofertas');
    } catch (error) {
      this.log(`❌ Fallback deepscrape fallido: ${error}`);
      throw lastError || error;
    }
  }

  /**
   * Generar fingerprint para Browser MCP
   */
  private generateFingerprint(level: 'low' | 'medium' | 'high' = 'medium') {
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
  private log(msg: string) {
    // Aquí puedes integrar winston, pino, Sentry, etc.
    console.log(`[Orchestrator] ${new Date().toISOString()} - ${msg}`);
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
      const [browserStatus, scraperrStats, minioStatus] = await Promise.all([
        this.browserMCP.getStatus(),
        this.scraperr.getStatsAsync(),
        this.minio.getStatus()
      ]);

      return {
        browserMCP: browserStatus,
        scraperr: scraperrStats,
        minio: minioStatus,
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
if (require.main === module) {
  exampleUsage().catch((err) => {
    console.error('Error en orquestador:', err);
    process.exit(1);
  });
}

export default Orchestrator; 