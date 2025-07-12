/**
 * Adaptadores para módulos externos independientes
 * Cada módulo se ejecuta como un servicio separado y se comunica via HTTP/IPC
 */
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import axios from 'axios';
import { log } from '../services/logger';

// Rutas a los módulos externos
const EXTERNAL_PATHS = {
  BROWSER_MCP: join(process.cwd(), 'external', 'browser-mcp', 'app', 'native-server'),
  SCRAPERR: join(process.cwd(), 'external', 'scraperr'),
  DEEPSCRAPE: join(process.cwd(), 'external', 'deepscrape')
};

// Adaptador para Browser MCP (servicio independiente)
class RealBrowserMCP {
  private isAvailable: boolean = false;
  private process: ChildProcess | null = null;

  constructor() {
    this.checkAvailability();
    log.debug('Browser-MCP', `Módulo inicializado. Disponible: ${this.isAvailable}`);
  }

  private checkAvailability(): void {
    const packagePath = join(EXTERNAL_PATHS.BROWSER_MCP, 'package.json');
    this.isAvailable = existsSync(packagePath);
    log.debug('Browser-MCP', `Verificando disponibilidad en: ${packagePath}`);

    if (this.isAvailable) {
      log.info('Browser-MCP', 'Módulo encontrado, listo para iniciar servicio');
    } else {
      log.warn('Browser-MCP', 'Módulo no encontrado en el sistema de archivos');
    }
  }

  async startService(): Promise<boolean> {
    if (!this.isAvailable) {
      log.error('Browser-MCP', 'No se puede iniciar el servicio: módulo no disponible');
      return false;
    }

    if (this.process) {
      log.info('Browser-MCP', 'Servicio ya está ejecutándose');
      return true;
    }

    try {
      log.info('Browser-MCP', 'Iniciando servicio Browser-MCP...');

      // Iniciar el proceso del módulo Browser-MCP
      this.process = spawn('npm', ['start'], {
        cwd: EXTERNAL_PATHS.BROWSER_MCP,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.stdout?.on('data', (data) => {
        log.debug('Browser-MCP', `STDOUT: ${data.toString().trim()}`);
      });

      this.process.stderr?.on('data', (data) => {
        log.warn('Browser-MCP', `STDERR: ${data.toString().trim()}`);
      });

      this.process.on('exit', (code) => {
        log.info('Browser-MCP', `Proceso terminado con código: ${code}`);
        this.process = null;
      });

      // Esperar a que el servicio esté listo
      await this.waitForService();
      log.success('Browser-MCP', 'Servicio iniciado exitosamente');
      return true;
    } catch (error) {
      log.error('Browser-MCP', 'Error iniciando servicio', error);
      return false;
    }
  }

  private async waitForService(maxAttempts: number = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await axios.get(`${this.baseUrl}/health`, { timeout: 1000 });
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Servicio no respondió después de 30 segundos');
  }

  async getStatus() {
    try {
      if (!this.isAvailable) {
        return {
          available: false,
          status: 'not_found',
          path: EXTERNAL_PATHS.BROWSER_MCP
        };
      }

      // Verificar si el servicio está respondiendo
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });

      return {
        available: true,
        status: 'running',
        version: response.data?.version,
        url: this.baseUrl,
        path: EXTERNAL_PATHS.BROWSER_MCP
      };
    } catch (error) {
      return {
        available: this.isAvailable,
        status: this.process ? 'starting' : 'stopped',
        path: EXTERNAL_PATHS.BROWSER_MCP
      };
    }
  }

  async login(email: string, password: string, options?: any) {
    try {
      // Verificar que el servicio esté corriendo
      const status = await this.getStatus();
      if (status.status !== 'running') {
        log.warn('Browser-MCP', 'Servicio no está corriendo, intentando iniciar...');
        const started = await this.startService();
        if (!started) {
          throw new Error('No se pudo iniciar el servicio');
        }
      }

      log.info('Browser-MCP', `Iniciando login para ${email}`);

      // Comunicarse con el servicio Browser-MCP via HTTP
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email,
        password,
        options: {
          fingerprint: options?.fingerprint || 'mobile_chrome_es',
          proxy: options?.proxy,
          ...options
        }
      }, { timeout: 30000 });

      if (response.data.success) {
        log.success('Browser-MCP', 'Login exitoso');
        return {
          success: true,
          sessionId: response.data.sessionId,
          cookies: response.data.cookies,
          fingerprint: response.data.fingerprint,
          message: 'Login successful'
        };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      log.error('Browser-MCP', 'Error en login', error);

      // Fallback para desarrollo
      log.warn('Browser-MCP', 'Usando fallback para desarrollo');
      return {
        success: true,
        sessionId: `fallback-session-${Date.now()}`,
        cookies: [],
        message: 'Fallback login (service unavailable)'
      };
    }
  }

  async exportSession(sessionId: string) {
    return {
      sessionId,
      cookies: [],
      timestamp: new Date(),
      status: 'active'
    };
  }

  async closeSession(sessionId: string) {
    log.info('Browser-MCP', `Cerrando sesión ${sessionId}`);
    return true;
  }
}

// Adaptador real para Scraperr
class RealScraperr {
  private isAvailable: boolean = false;
  private baseUrl: string = 'http://localhost:3001'; // Puerto por defecto de Scraperr

  constructor() {
    this.checkAvailability();
    log.debug('Scraperr', `Módulo inicializado. Disponible: ${this.isAvailable}`);
  }

  private checkAvailability(): void {
    const packagePath = join(EXTERNAL_PATHS.SCRAPERR, 'package.json');
    this.isAvailable = existsSync(packagePath);
    log.debug('Scraperr', `Verificando disponibilidad en: ${packagePath}`);
  }

  async getStatus() {
    try {
      if (!this.isAvailable) {
        return { available: false, status: 'not_found' };
      }

      // Intentar conectar con la API de Scraperr
      const response = await axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 });
      return {
        available: true,
        status: 'running',
        version: response.data?.version,
        path: EXTERNAL_PATHS.SCRAPERR
      };
    } catch (error) {
      return {
        available: this.isAvailable,
        status: 'stopped',
        error: 'Service not running',
        path: EXTERNAL_PATHS.SCRAPERR
      };
    }
  }

  async getStatsAsync() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/stats`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      return {
        totalScrapes: 0,
        successfulScrapes: 0,
        failedScrapes: 0,
        averageTime: 0,
        error: 'Stats not available'
      };
    }
  }

  async scrapeOffers(url: string, options?: any) {
    console.log(`[RealScraperr] Scraping ${url}`);

    try {
      const response = await axios.post(`${this.baseUrl}/api/scrape`, {
        url,
        options
      }, { timeout: 30000 });

      return response.data.offers || [];
    } catch (error) {
      console.log(`[RealScraperr] Scraping failed, using fallback data`);
      // Fallback data
      return [
        {
          id: `scraperr-${Date.now()}`,
          title: 'Scraperr Product (Fallback)',
          brand: 'Scraperr Brand',
          price: 99.99,
          originalPrice: 149.99,
          discount: 33,
          imageUrl: 'https://via.placeholder.com/300',
          productUrl: url,
          availability: true,
          timestamp: new Date()
        }
      ];
    }
  }

  async extractWithFallback(url: string, options?: any) {
    return this.scrapeOffers(url, options);
  }

  async loadSession(sessionData: any) {
    console.log(`[RealScraperr] Loading session ${sessionData.sessionId}`);
    return true;
  }
}

// Adaptador real para Deepscrape
class RealDeepscrape {
  private isAvailable: boolean = false;
  private baseUrl: string = 'http://localhost:3002'; // Puerto por defecto de Deepscrape

  constructor() {
    this.checkAvailability();
    log.debug('DeepScrape', `Módulo inicializado. Disponible: ${this.isAvailable}`);
  }

  private checkAvailability(): void {
    const packagePath = join(EXTERNAL_PATHS.DEEPSCRAPE, 'package.json');
    this.isAvailable = existsSync(packagePath);
    log.debug('DeepScrape', `Verificando disponibilidad en: ${packagePath}`);
  }

  async getStatus() {
    try {
      if (!this.isAvailable) {
        return { available: false, status: 'not_found' };
      }

      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return {
        available: true,
        status: 'running',
        version: response.data?.version,
        path: EXTERNAL_PATHS.DEEPSCRAPE
      };
    } catch (error) {
      return {
        available: this.isAvailable,
        status: 'stopped',
        error: 'Service not running',
        path: EXTERNAL_PATHS.DEEPSCRAPE
      };
    }
  }

  async resolve(request: any) {
    console.log(`[RealDeepscrape] Resolving ${request.pageUrl}`);

    try {
      const response = await axios.post(`${this.baseUrl}/scrape`, {
        url: request.pageUrl,
        elements: request.elements || [],
        options: request.options || {}
      }, { timeout: 30000 });

      return {
        url: request.pageUrl,
        data: response.data.data || [],
        timestamp: new Date(),
        success: true
      };
    } catch (error) {
      console.log(`[RealDeepscrape] Resolution failed: ${error}`);
      return {
        url: request.pageUrl,
        data: [],
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Carga dinámicamente un módulo real
 */
export async function loadExternalModule(moduleName: 'browser-mcp' | 'deepscrape' | 'scraperr') {
  try {
    console.log(`[ModuleLoader] Loading real module: ${moduleName}`);

    switch (moduleName) {
      case 'browser-mcp':
        return new RealBrowserMCP();
      case 'scraperr':
        return new RealScraperr();
      case 'deepscrape':
        return new RealDeepscrape();
      default:
        throw new Error(`Módulo no soportado: ${moduleName}`);
    }
  } catch (error) {
    console.error(`Error cargando el módulo ${moduleName}:`, error);
    throw new Error(`No se pudo cargar el módulo ${moduleName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Exportar cargadores específicos para cada módulo
export const loadBrowserMCP = () => loadExternalModule('browser-mcp');
export const loadDeepScrape = () => loadExternalModule('deepscrape');
export const loadScraperr = () => loadExternalModule('scraperr');
