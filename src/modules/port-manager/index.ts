import net from 'net';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PortConfig {
  service: string;
  port: number;
  available: boolean;
  process?: string;
}

export class PortManager {
  private static instance: PortManager;
  private portCache: Map<string, PortConfig> = new Map();

  static getInstance(): PortManager {
    if (!PortManager.instance) {
      PortManager.instance = new PortManager();
    }
    return PortManager.instance;
  }

  /**
   * Verifica si un puerto está disponible
   */
  async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
  }

  /**
   * Encuentra el siguiente puerto disponible a partir de un puerto base
   */
  async findAvailablePort(basePort: number, maxAttempts: number = 10): Promise<number> {
    for (let i = 0; i < maxAttempts; i++) {
      const port = basePort + i;
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`No se encontró puerto disponible después de ${maxAttempts} intentos desde ${basePort}`);
  }

  /**
   * Verifica qué proceso está usando un puerto
   */
  async getPortProcess(port: number): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pid = stdout.trim();
      if (pid) {
        const { stdout: processInfo } = await execAsync(`ps -p ${pid} -o comm=`);
        return processInfo.trim();
      }
    } catch (error) {
      // Puerto no está en uso
    }
    return null;
  }

  /**
   * Mata un proceso que está usando un puerto específico
   */
  async killPortProcess(port: number): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pid = stdout.trim();
      if (pid) {
        await execAsync(`kill -9 ${pid}`);
        console.log(`🔥 Proceso ${pid} en puerto ${port} terminado`);
        return true;
      }
    } catch (error) {
      console.log(`⚠️ No se pudo terminar proceso en puerto ${port}:`, error);
    }
    return false;
  }

  /**
   * Configura automáticamente los puertos para todos los servicios
   */
  async configureServicePorts(): Promise<Map<string, PortConfig>> {
    const services = [
      { name: 'minio-api', basePort: 9000 },
      { name: 'minio-console', basePort: 9001 },
      { name: 'next-server', basePort: 3000 },
      { name: 'browser-mcp', basePort: 3001 },
      { name: 'scraperr', basePort: 3002 },
      { name: 'deepscrape', basePort: 3003 }
    ];

    const configs = new Map<string, PortConfig>();

    for (const service of services) {
      try {
        const process = await this.getPortProcess(service.basePort);
        const available = await this.isPortAvailable(service.basePort);
        
        let finalPort = service.basePort;
        
        if (!available) {
          console.log(`⚠️ Puerto ${service.basePort} ocupado por: ${process || 'proceso desconocido'}`);
          
          // Si es MinIO, intentamos usar el proceso existente
          if (service.name.includes('minio') && process?.includes('minio')) {
            console.log(`✅ MinIO ya está corriendo en puerto ${service.basePort}`);
          } else {
            // Buscar puerto alternativo
            finalPort = await this.findAvailablePort(service.basePort + 1);
            console.log(`🔄 ${service.name} reasignado al puerto ${finalPort}`);
          }
        }

        configs.set(service.name, {
          service: service.name,
          port: finalPort,
          available: available,
          process: process || undefined
        });

      } catch (error) {
        console.error(`❌ Error configurando ${service.name}:`, error);
        configs.set(service.name, {
          service: service.name,
          port: service.basePort,
          available: false,
          process: undefined
        });
      }
    }

    this.portCache = configs;
    return configs;
  }

  /**
   * Inicia MinIO si no está corriendo
   */
  async ensureMinIORunning(): Promise<{ port: number; consolePort: number; started: boolean }> {
    const apiConfig = this.portCache.get('minio-api');
    const consoleConfig = this.portCache.get('minio-console');

    if (!apiConfig || !consoleConfig) {
      throw new Error('Configuración de MinIO no encontrada');
    }

    // Verificar si MinIO ya está corriendo en el puerto API
    const apiProcess = await this.getPortProcess(apiConfig.port);
    if (apiProcess?.includes('minio')) {
      console.log(`✅ MinIO ya está corriendo en puerto ${apiConfig.port}`);
      return {
        port: apiConfig.port,
        consolePort: consoleConfig.port,
        started: false
      };
    }

    // Verificar si hay algún MinIO corriendo en otros puertos
    const existingMinio = await this.findExistingMinIO();
    if (existingMinio) {
      console.log(`🔄 MinIO encontrado en puerto ${existingMinio.port}, actualizando configuración...`);

      // Actualizar configuración para usar el MinIO existente
      this.portCache.set('minio-api', {
        service: 'minio-api',
        port: existingMinio.port,
        available: false,
        process: 'minio'
      });

      this.portCache.set('minio-console', {
        service: 'minio-console',
        port: existingMinio.consolePort,
        available: false,
        process: 'minio'
      });

      return {
        port: existingMinio.port,
        consolePort: existingMinio.consolePort,
        started: false
      };
    }

    // Iniciar MinIO desde cero
    return await this.startMinIOFresh(apiConfig.port, consoleConfig.port);
  }

  /**
   * Busca procesos MinIO existentes
   */
  private async findExistingMinIO(): Promise<{ port: number; consolePort: number } | null> {
    try {
      const { stdout } = await execAsync('ps aux | grep minio | grep -v grep');
      const lines = stdout.split('\n').filter(line => line.includes('minio server'));

      for (const line of lines) {
        // Buscar patrones de puerto en la línea de comando
        const addressMatch = line.match(/--address\s+:?(\d+)/);
        const consoleMatch = line.match(/--console-address\s+:?(\d+)/);

        if (addressMatch) {
          const port = parseInt(addressMatch[1]);
          const consolePort = consoleMatch ? parseInt(consoleMatch[1]) : port + 1;

          console.log(`🔍 MinIO encontrado: API=${port}, Console=${consolePort}`);
          return { port, consolePort };
        }
      }
    } catch (error) {
      // No hay procesos MinIO corriendo
    }

    return null;
  }

  /**
   * Inicia MinIO con configuración fresca
   */
  private async startMinIOFresh(apiPort: number, consolePort: number): Promise<{ port: number; consolePort: number; started: boolean }> {
    console.log(`🚀 Iniciando MinIO fresco en puerto ${apiPort}...`);

    try {
      // Verificar que el binario de MinIO existe
      const minioPath = await this.findMinioBinary();
      if (!minioPath) {
        throw new Error('Binario de MinIO no encontrado');
      }

      // Crear directorio de datos si no existe
      await execAsync('mkdir -p ./minio-data');

      // Iniciar MinIO
      const minioProcess = spawn(minioPath, [
        'server',
        './minio-data',
        '--address', `:${apiPort}`,
        '--console-address', `:${consolePort}`
      ], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          MINIO_ROOT_USER: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          MINIO_ROOT_PASSWORD: process.env.MINIO_SECRET_KEY || 'minioadmin123'
        }
      });

      minioProcess.unref();

      // Capturar logs para debugging
      minioProcess.stdout?.on('data', (data) => {
        console.log(`[MinIO] ${data.toString().trim()}`);
      });

      minioProcess.stderr?.on('data', (data) => {
        console.error(`[MinIO Error] ${data.toString().trim()}`);
      });

      // Esperar a que MinIO inicie
      console.log('⏳ Esperando a que MinIO inicie...');
      await this.waitForMinIOStartup(apiPort, 30000); // 30 segundos timeout

      console.log(`✅ MinIO iniciado exitosamente en puerto ${apiPort}`);
      return {
        port: apiPort,
        consolePort: consolePort,
        started: true
      };

    } catch (error) {
      console.error('❌ Error iniciando MinIO:', error);
      throw error;
    }
  }

  /**
   * Busca el binario de MinIO
   */
  private async findMinioBinary(): Promise<string | null> {
    const possiblePaths = [
      './minio',
      '/usr/local/bin/minio',
      '/usr/bin/minio',
      'minio'
    ];

    for (const path of possiblePaths) {
      try {
        await execAsync(`which ${path}`);
        console.log(`📦 MinIO encontrado en: ${path}`);
        return path;
      } catch (error) {
        // Continuar buscando
      }
    }

    // Intentar descargar MinIO si no se encuentra
    console.log('📥 Descargando MinIO...');
    try {
      await execAsync('wget https://dl.min.io/server/minio/release/linux-amd64/minio -O ./minio && chmod +x ./minio');
      return './minio';
    } catch (error) {
      console.error('❌ No se pudo descargar MinIO:', error);
      return null;
    }
  }

  /**
   * Espera a que MinIO esté listo
   */
  private async waitForMinIOStartup(port: number, timeout: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Verificar si el puerto está ocupado (MinIO corriendo)
        const isOccupied = !(await this.isPortAvailable(port));
        if (isOccupied) {
          // Verificar que responde a requests HTTP
          const response = await fetch(`http://localhost:${port}/minio/health/live`);
          if (response.ok) {
            return; // MinIO está listo
          }
        }
      } catch (error) {
        // Continuar esperando
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    }

    throw new Error(`MinIO no respondió después de ${timeout}ms`);
  }

  /**
   * Actualiza las variables de entorno con los puertos configurados
   */
  updateEnvironmentVariables(): void {
    const minioApi = this.portCache.get('minio-api');
    const minioConsole = this.portCache.get('minio-console');
    
    if (minioApi) {
      process.env.MINIO_PORT = minioApi.port.toString();
    }
    if (minioConsole) {
      process.env.MINIO_CONSOLE_PORT = minioConsole.port.toString();
    }

    console.log(`🔧 Variables de entorno actualizadas:`);
    console.log(`   MINIO_PORT=${process.env.MINIO_PORT}`);
    console.log(`   MINIO_CONSOLE_PORT=${process.env.MINIO_CONSOLE_PORT}`);
  }

  /**
   * Obtiene la configuración actual de puertos
   */
  getPortConfiguration(): Map<string, PortConfig> {
    return new Map(this.portCache);
  }

  /**
   * Muestra un resumen de la configuración de puertos
   */
  printPortSummary(): void {
    console.log('\n📊 Configuración de Puertos:');
    console.log('================================');
    
    this.portCache.forEach((config, serviceName) => {
      const status = config.available ? '🟢 Libre' : '🔴 Ocupado';
      const process = config.process ? ` (${config.process})` : '';
      console.log(`${serviceName.padEnd(15)} | Puerto ${config.port} | ${status}${process}`);
    });
    
    console.log('================================\n');
  }
}

export default PortManager;
