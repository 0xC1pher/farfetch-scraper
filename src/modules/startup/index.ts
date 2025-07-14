import PortManager from '../port-manager';
import { MinioStorage } from '../minio';

export class StartupManager {
  private portManager: PortManager;
  private minioStorage: MinioStorage | null = null;

  constructor() {
    this.portManager = PortManager.getInstance();
  }

  /**
   * Inicialización completa del sistema
   */
  async initialize(): Promise<{
    success: boolean;
    ports: Map<string, any>;
    minio: { available: boolean; port: number; consolePort: number };
    errors: string[];
  }> {
    const errors: string[] = [];
    
    console.log('🚀 Iniciando configuración automática del sistema...\n');

    try {
      // 1. Configurar puertos automáticamente
      console.log('📊 Detectando puertos disponibles...');
      const portConfigs = await this.portManager.configureServicePorts();
      this.portManager.printPortSummary();

      // 2. Actualizar variables de entorno
      this.portManager.updateEnvironmentVariables();

      // 3. Asegurar que MinIO esté corriendo (SIEMPRE)
      console.log('🗄️ Iniciando MinIO automáticamente...');
      let minioInfo;
      try {
        minioInfo = await this.portManager.ensureMinIORunning();
        if (minioInfo.started) {
          console.log(`🚀 MinIO iniciado en puerto ${minioInfo.port}`);
        } else {
          console.log(`✅ MinIO ya estaba corriendo en puerto ${minioInfo.port}`);
        }

        // Mostrar información de acceso
        console.log(`📊 MinIO Console: http://localhost:${minioInfo.consolePort}`);
        console.log(`🔑 Credenciales: minioadmin / minioadmin123`);

      } catch (error) {
        const errorMsg = `Error crítico con MinIO: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        console.log('🔄 Intentando configuración de respaldo...');

        // Configuración de respaldo
        minioInfo = { port: 9000, consolePort: 9001, started: false };

        // Intentar encontrar MinIO existente como último recurso
        try {
          const existingMinio = await this.findAnyMinIOProcess();
          if (existingMinio) {
            minioInfo = existingMinio;
            console.log(`🔍 MinIO encontrado en puerto ${existingMinio.port} (respaldo)`);
          }
        } catch (backupError) {
          console.error('❌ No se pudo encontrar MinIO de respaldo');
        }
      }

      // 4. Verificar conexión a MinIO
      console.log('🔗 Verificando conexión a MinIO...');
      let minioAvailable = false;
      try {
        this.minioStorage = new MinioStorage();
        await this.minioStorage.ensureBucket();
        minioAvailable = true;
        console.log('✅ MinIO conectado y bucket verificado');
      } catch (error) {
        const errorMsg = `Error conectando a MinIO: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }

      // 5. Generar datos de prueba si MinIO está disponible
      if (minioAvailable && this.minioStorage) {
        console.log('🧪 Generando datos de prueba...');
        try {
          await this.generateTestData();
          console.log('✅ Datos de prueba generados exitosamente');
        } catch (error) {
          const errorMsg = `Error generando datos de prueba: ${error instanceof Error ? error.message : 'Error desconocido'}`;
          errors.push(errorMsg);
          console.error(`⚠️ ${errorMsg}`);
        }
      }

      console.log('\n🎉 Inicialización completada');
      if (errors.length > 0) {
        console.log(`⚠️ Se encontraron ${errors.length} errores no críticos`);
      }

      return {
        success: errors.length === 0,
        ports: portConfigs,
        minio: {
          available: minioAvailable,
          port: minioInfo.port,
          consolePort: minioInfo.consolePort
        },
        errors
      };

    } catch (error) {
      const errorMsg = `Error crítico en inicialización: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      errors.push(errorMsg);
      console.error(`💥 ${errorMsg}`);

      return {
        success: false,
        ports: new Map(),
        minio: { available: false, port: 9000, consolePort: 9001 },
        errors
      };
    }
  }

  /**
   * Genera datos de prueba para verificar que el sistema funciona
   */
  private async generateTestData(): Promise<void> {
    if (!this.minioStorage) {
      throw new Error('MinIO no está disponible');
    }

    // Datos de prueba para Browser-MCP
    await this.minioStorage.saveBrowserMCPData({
      action: 'login',
      email: 'test@farfetch.com',
      sessionId: 'sess_startup_' + Date.now(),
      cookies: [
        { name: 'session_token', value: 'startup_token_123', domain: '.farfetch.com' }
      ],
      userAgent: 'Mozilla/5.0 (Startup Test)',
      viewport: { width: 1920, height: 1080 },
      fingerprint: {
        canvas: 'startup_canvas_hash',
        webgl: 'startup_webgl_hash',
        fonts: ['Arial', 'Helvetica']
      }
    }, 'https://www.farfetch.com/startup-test');

    // Datos de prueba para Scraperr
    await this.minioStorage.saveScaperrData({
      selectors: ['.startup-test', '.product-card'],
      items: [
        {
          id: 'startup_prod_001',
          title: 'Producto de Prueba Startup',
          price: 99.99,
          currency: 'EUR',
          image: 'https://example.com/startup-test.jpg',
          brand: 'TestBrand',
          category: 'Test',
          sizes: ['M', 'L'],
          colors: ['Negro'],
          discount: 0
        }
      ],
      itemCount: 1,
      options: {
        maxPages: 1,
        delay: 1000,
        scrollTimes: 1
      }
    }, 'https://www.farfetch.com/startup-scraping-test');

    // Datos de prueba para DeepScrape
    await this.minioStorage.saveDeepScrapeData({
      elements: [
        {
          type: 'test-element',
          selector: 'div[data-testid="startup-test"]',
          description: 'Elemento de prueba del startup',
          confidence: 1.0,
          attributes: {
            'data-test': 'startup-verification'
          }
        }
      ],
      extractedData: [
        {
          testId: 'startup_001',
          extractedBy: 'startup-verification',
          confidence: 1.0,
          data: {
            message: 'Sistema iniciado correctamente',
            timestamp: new Date().toISOString(),
            status: 'success'
          }
        }
      ],
      extractedCount: 1,
      depth: 1,
      waitForSelector: 'div[data-testid="startup-test"]',
      timeout: 5000
    }, 'https://www.farfetch.com/startup-deepscrape-test');

    console.log('📊 Datos de prueba generados:');
    console.log('   - Browser-MCP: 1 sesión de login');
    console.log('   - Scraperr: 1 producto extraído');
    console.log('   - DeepScrape: 1 elemento analizado');
  }

  /**
   * Busca cualquier proceso MinIO como respaldo
   */
  private async findAnyMinIOProcess(): Promise<{ port: number; consolePort: number; started: boolean } | null> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout } = await execAsync('netstat -tulpn | grep minio || ps aux | grep minio | grep -v grep');

      // Buscar puertos en uso por MinIO
      const portMatches = stdout.match(/:(\d+)/g);
      if (portMatches && portMatches.length > 0) {
        const port = parseInt(portMatches[0].replace(':', ''));
        return {
          port: port,
          consolePort: port + 1,
          started: false
        };
      }
    } catch (error) {
      // No se encontró MinIO
    }

    return null;
  }

  /**
   * Obtiene el estado actual del sistema
   */
  getSystemStatus(): {
    ports: Map<string, any>;
    minio: { available: boolean; storage?: MinioStorage };
  } {
    return {
      ports: this.portManager.getPortConfiguration(),
      minio: {
        available: this.minioStorage !== null,
        storage: this.minioStorage || undefined
      }
    };
  }
}

export default StartupManager;
