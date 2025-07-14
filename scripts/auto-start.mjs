#!/usr/bin/env node

/**
 * Script de inicio automático para el sistema Mexa
 * Se ejecuta antes de iniciar el servidor Next.js
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AutoStart {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
  }

  async initialize() {
    console.log('🚀 Iniciando sistema Mexa automáticamente...\n');

    try {
      // 1. Verificar dependencias
      await this.checkDependencies();

      // 2. Configurar puertos dinámicamente
      await this.configurePorts();

      // 3. Iniciar MinIO automáticamente
      await this.ensureMinIORunning();

      // 4. Verificar que todo esté listo
      await this.verifySystem();

      console.log('\n✅ Sistema Mexa listo para usar!');
      console.log('📊 Panel de administración: http://localhost:3000/admin');
      console.log('🗄️ MinIO Console: http://localhost:9001 (minioadmin/***REMOVED***)');

    } catch (error) {
      console.error('\n❌ Error en inicialización automática:', error.message);
      console.log('⚠️ El sistema puede funcionar con limitaciones');
    }
  }

  async checkDependencies() {
    console.log('📦 Verificando dependencias...');

    // Verificar Node.js
    const nodeVersion = process.version;
    console.log(`✅ Node.js: ${nodeVersion}`);

    // Verificar npm/yarn
    try {
      const { stdout } = await execAsync('npm --version');
      console.log(`✅ npm: v${stdout.trim()}`);
    } catch (error) {
      console.log('⚠️ npm no encontrado');
    }
  }

  async configurePorts() {
    console.log('🔧 Configurando puertos dinámicamente...');

    const ports = {
      nextjs: await this.findAvailablePort(3000),
      minio: await this.findAvailablePort(9000),
      minioConsole: await this.findAvailablePort(9001)
    };

    // Actualizar variables de entorno
    process.env.PORT = ports.nextjs.toString();
    process.env.MINIO_PORT = ports.minio.toString();
    process.env.MINIO_CONSOLE_PORT = ports.minioConsole.toString();

    console.log(`📊 Puertos configurados:`);
    console.log(`   Next.js: ${ports.nextjs}`);
    console.log(`   MinIO API: ${ports.minio}`);
    console.log(`   MinIO Console: ${ports.minioConsole}`);

    return ports;
  }

  async findAvailablePort(basePort) {
    
    for (let port = basePort; port < basePort + 10; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    
    throw new Error(`No se encontró puerto disponible desde ${basePort}`);
  }

  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
  }

  async ensureMinIORunning() {
    console.log('🗄️ Verificando MinIO...');

    // Verificar si MinIO ya está corriendo
    const isRunning = await this.isMinIORunning();
    if (isRunning) {
      console.log('✅ MinIO ya está corriendo');
      return;
    }

    console.log('🚀 Iniciando MinIO...');

    try {
      // Verificar/descargar binario de MinIO
      await this.ensureMinioBinary();

      // Crear directorio de datos
      await execAsync('mkdir -p minio-data', { cwd: this.projectRoot });

      // Iniciar MinIO
      const minioPort = process.env.MINIO_PORT || '9000';
      const consolePort = process.env.MINIO_CONSOLE_PORT || '9001';

      const minioProcess = spawn('./minio', [
        'server',
        './minio-data',
        '--address', `:${minioPort}`,
        '--console-address', `:${consolePort}`
      ], {
        cwd: this.projectRoot,
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          MINIO_ROOT_USER: 'minioadmin',
          MINIO_ROOT_PASSWORD: '***REMOVED***'
        }
      });

      minioProcess.unref();

      // Esperar a que inicie
      await this.waitForMinIO(minioPort);
      console.log(`✅ MinIO iniciado en puerto ${minioPort}`);

    } catch (error) {
      console.error('❌ Error iniciando MinIO:', error.message);
      throw error;
    }
  }

  async isMinIORunning() {
    try {
      const { stdout } = await execAsync('ps aux | grep minio | grep -v grep');
      return stdout.includes('minio server');
    } catch (error) {
      return false;
    }
  }

  async ensureMinioBinary() {
    const fs = await import('fs');
    const minioPath = path.join(this.projectRoot, 'minio');

    // Verificar si el binario existe
    if (fs.existsSync(minioPath)) {
      console.log('📦 Binario MinIO encontrado');
      return;
    }

    console.log('📥 Descargando MinIO...');
    try {
      await execAsync(
        'wget https://dl.min.io/server/minio/release/linux-amd64/minio -O minio && chmod +x minio',
        { cwd: this.projectRoot }
      );
      console.log('✅ MinIO descargado exitosamente');
    } catch (error) {
      throw new Error('No se pudo descargar MinIO: ' + error.message);
    }
  }

  async waitForMinIO(port, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const isOccupied = !(await this.isPortAvailable(port));
        if (isOccupied) {
          return; // MinIO está corriendo
        }
      } catch (error) {
        // Continuar esperando
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`MinIO no respondió después de ${timeout}ms`);
  }

  async verifySystem() {
    console.log('🔍 Verificando sistema...');

    // Verificar que los puertos estén configurados
    const requiredEnvVars = ['MINIO_PORT', 'MINIO_CONSOLE_PORT'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Variable de entorno ${envVar} no configurada`);
      }
    }

    console.log('✅ Variables de entorno configuradas');
    console.log('✅ Sistema verificado');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const autoStart = new AutoStart();
  autoStart.initialize().catch(error => {
    console.error('💥 Error crítico:', error);
    process.exit(1);
  });
}

export default AutoStart;
