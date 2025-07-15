#!/usr/bin/env node

/**
 * Script de inicio automático para el sistema Mexa
 * Se ejecuta antes de iniciar el servidor Next.js
 */

import 'dotenv/config';
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

      // 3. Forzar liberación de puertos ocupados
      await this.forcePortsAvailable();

      // 4. Iniciar MinIO automáticamente
      await this.ensureMinIORunning();

      // 5. Iniciar Bot de Telegram
      await this.ensureTelegramBotRunning();

      // 6. Verificar que todo esté listo
      await this.verifySystem();

      console.log('\n✅ Sistema Mexa listo para usar!');
      console.log('📊 Panel de administración: http://localhost:3000/admin');
      console.log('🗄️ MinIO Console: http://localhost:9011 (minioadmini/minioadmin)');
      console.log('🤖 Bot de Telegram: Verificar estado en panel admin');
      console.log('📱 Mini App: http://localhost:3000/telegram-app');

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

  async forcePortsAvailable() {
    console.log('🔧 Forzando liberación de puertos ocupados...');

    const criticalPorts = [3000, 9000, 9001, 9010, 9011];

    for (const port of criticalPorts) {
      try {
        const isOccupied = !(await this.isPortAvailable(port));
        if (isOccupied) {
          console.log(`⚠️ Puerto ${port} ocupado, liberando...`);
          await this.killProcessOnPort(port);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1s
        }
      } catch (error) {
        console.log(`⚠️ Error liberando puerto ${port}: ${error.message}`);
      }
    }
  }

  async killProcessOnPort(port) {
    try {
      // Buscar proceso en el puerto
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pids = stdout.trim().split('\n').filter(pid => pid);

      for (const pid of pids) {
        console.log(`🔪 Matando proceso ${pid} en puerto ${port}`);
        await execAsync(`kill -9 ${pid}`);
      }
    } catch (error) {
      // Puerto ya libre o comando falló
    }
  }

  async configurePorts() {
    console.log('🔧 Configurando puertos dinámicamente...');

    const ports = {
      nextjs: 3000,
      minio: 9010,
      minioConsole: 9011
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
          MINIO_ROOT_USER: 'minioadmini',
          MINIO_ROOT_PASSWORD: 'minioadmin'
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

  async killExistingBotProcess() {
    try {
      const { stdout } = await execAsync('ps aux | grep "telegram-bot/bot-server" | grep -v grep');
      const pids = stdout.split('\n').map(line => line.trim().split(/\s+/)[1]).filter(pid => pid);
      
      for (const pid of pids) {
        console.log(`🔪 Matando proceso del bot existente (PID: ${pid})...`);
        await execAsync(`kill -9 ${pid}`);
      }
    } catch (error) {
      // No process found, which is fine.
    }
  }

  async ensureTelegramBotRunning() {
    console.log('🤖 Verificando Bot de Telegram...');

    // Matar cualquier proceso del bot existente para asegurar que se carguen los cambios
    await this.killExistingBotProcess();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Dar tiempo a que el proceso muera
    // Verificar si el bot ya está corriendo
    const isBotRunning = await this.isTelegramBotRunning();
    if (isBotRunning) {
      // Esto no debería ocurrir si killExistingBotProcess funcionó, pero es una salvaguarda.
      console.log('✅ Bot de Telegram ya está corriendo');
      return;
    }

    // Verificar token
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token === 'demo_token_for_development') {
      console.log('⚠️ Bot de Telegram en modo demo (sin token real)');
      return;
    }

    console.log('🚀 Iniciando Bot de Telegram...');

    try {
      // Iniciar bot en background
      const botProcess = spawn('npx', ['tsx', 'src/telegram-bot/bot-server.ts'], {
        cwd: this.projectRoot,
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env
        }
      });

      botProcess.unref();

      // Esperar a que inicie
      await new Promise(resolve => setTimeout(resolve, 3000));

      const isRunning = await this.isTelegramBotRunning();
      if (isRunning) {
        console.log('✅ Bot de Telegram iniciado exitosamente');
      } else {
        console.log('⚠️ Bot de Telegram puede no haber iniciado correctamente');
      }

    } catch (error) {
      console.error('❌ Error iniciando Bot de Telegram:', error.message);
      console.log('⚠️ El sistema funcionará sin bot de Telegram');
    }
  }

  async isTelegramBotRunning() {
    try {
      const { stdout } = await execAsync('ps aux | grep "telegram-bot/bot-server" | grep -v grep');
      return stdout.includes('bot-server.ts');
    } catch (error) {
      return false;
    }
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
