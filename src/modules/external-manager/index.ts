import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export interface ExternalModuleConfig {
  name: string;
  path: string;
  port: number;
  startCommand: string;
  healthEndpoint: string;
  dependencies?: string[];
  env?: Record<string, string>;
}

export interface ModuleStatus {
  name: string;
  status: 'stopped' | 'starting' | 'running' | 'error';
  port: number;
  pid?: number;
  uptime?: number;
  lastError?: string;
}

export class ExternalModuleManager {
  private static instance: ExternalModuleManager;
  private modules: Map<string, ExternalModuleConfig> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private status: Map<string, ModuleStatus> = new Map();

  static getInstance(): ExternalModuleManager {
    if (!ExternalModuleManager.instance) {
      ExternalModuleManager.instance = new ExternalModuleManager();
    }
    return ExternalModuleManager.instance;
  }

  constructor() {
    this.initializeModules();
  }

  private initializeModules() {
    // Configuración de Browser-MCP
    this.modules.set('browser-mcp', {
      name: 'browser-mcp',
      path: path.resolve(process.cwd(), 'external/browser-mcp'),
      port: 3001,
      startCommand: 'pnpm dev',
      healthEndpoint: '/health',
      dependencies: ['node', 'pnpm'],
      env: {
        PORT: '3001',
        NODE_ENV: 'development'
      }
    });

    // Configuración de Scraperr
    this.modules.set('scraperr', {
      name: 'scraperr',
      path: path.resolve(process.cwd(), 'external/scraperr'),
      port: 3002,
      startCommand: 'npm run dev',
      healthEndpoint: '/api/health',
      dependencies: ['node', 'npm'],
      env: {
        PORT: '3002',
        NODE_ENV: 'development'
      }
    });

    // Configuración de DeepScrape
    this.modules.set('deepscrape', {
      name: 'deepscrape',
      path: path.resolve(process.cwd(), 'external/deepscrape'),
      port: 3003,
      startCommand: 'npm start',
      healthEndpoint: '/health',
      dependencies: ['node', 'npm'],
      env: {
        PORT: '3003',
        NODE_ENV: 'production'
      }
    });

    // Inicializar estados
    for (const [name, config] of this.modules) {
      this.status.set(name, {
        name,
        status: 'stopped',
        port: config.port
      });
    }
  }

  /**
   * Verificar dependencias de un módulo
   */
  async checkDependencies(moduleName: string): Promise<boolean> {
    const config = this.modules.get(moduleName);
    if (!config) return false;

    try {
      // Verificar que el directorio existe
      if (!fs.existsSync(config.path)) {
        console.error(`❌ Directorio no encontrado: ${config.path}`);
        return false;
      }

      // Verificar package.json
      const packageJsonPath = path.join(config.path, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        console.error(`❌ package.json no encontrado en: ${packageJsonPath}`);
        return false;
      }

      // Verificar node_modules
      const nodeModulesPath = path.join(config.path, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        console.log(`📦 Instalando dependencias para ${moduleName}...`);
        await this.installDependencies(moduleName);
      }

      return true;
    } catch (error) {
      console.error(`❌ Error verificando dependencias de ${moduleName}:`, error);
      return false;
    }
  }

  /**
   * Instalar dependencias de un módulo
   */
  async installDependencies(moduleName: string): Promise<void> {
    const config = this.modules.get(moduleName);
    if (!config) throw new Error(`Módulo ${moduleName} no encontrado`);

    try {
      console.log(`📦 Instalando dependencias para ${moduleName}...`);

      // Determinar el gestor de paquetes
      let installCommand = 'npm install';
      if (moduleName === 'browser-mcp') {
        installCommand = 'pnpm install';
      }

      const { stdout, stderr } = await execAsync(installCommand, {
        cwd: config.path,
        timeout: 300000 // 5 minutos
      });

      if (stderr && !stderr.includes('WARN')) {
        console.warn(`⚠️ Advertencias en instalación de ${moduleName}:`, stderr);
      }

      console.log(`✅ Dependencias instaladas para ${moduleName}`);
    } catch (error) {
      console.error(`❌ Error instalando dependencias de ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Iniciar un módulo específico
   */
  async startModule(moduleName: string): Promise<boolean> {
    const config = this.modules.get(moduleName);
    if (!config) {
      console.error(`❌ Módulo ${moduleName} no encontrado`);
      return false;
    }

    try {
      // Verificar si ya está corriendo
      if (this.processes.has(moduleName)) {
        console.log(`⚠️ ${moduleName} ya está corriendo`);
        return true;
      }

      // Verificar dependencias
      const depsOk = await this.checkDependencies(moduleName);
      if (!depsOk) {
        console.error(`❌ Dependencias de ${moduleName} no están disponibles`);
        return false;
      }

      // Actualizar estado
      this.updateStatus(moduleName, { status: 'starting' });

      console.log(`🚀 Iniciando ${moduleName} en puerto ${config.port}...`);

      // Determinar comando y argumentos
      let command: string;
      let args: string[];

      if (moduleName === 'browser-mcp') {
        command = 'pnpm';
        args = ['dev'];
      } else {
        command = 'npm';
        args = ['run', 'dev'];
      }

      // Iniciar proceso
      const process = spawn(command, args, {
        cwd: config.path,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ...config.env
        },
        detached: false
      });

      // Manejar salida del proceso
      process.stdout?.on('data', (data) => {
        console.log(`[${moduleName}] ${data.toString().trim()}`);
      });

      process.stderr?.on('data', (data) => {
        const message = data.toString().trim();
        if (!message.includes('WARN')) {
          console.error(`[${moduleName}] ${message}`);
        }
      });

      // Manejar eventos del proceso
      process.on('spawn', () => {
        console.log(`✅ ${moduleName} iniciado con PID ${process.pid}`);
        this.updateStatus(moduleName, {
          status: 'running',
          pid: process.pid
        });
      });

      process.on('error', (error) => {
        console.error(`❌ Error en ${moduleName}:`, error);
        this.updateStatus(moduleName, {
          status: 'error',
          lastError: error.message
        });
        this.processes.delete(moduleName);
      });

      process.on('exit', (code) => {
        console.log(`🔄 ${moduleName} terminó con código ${code}`);
        this.updateStatus(moduleName, { status: 'stopped' });
        this.processes.delete(moduleName);
      });

      // Guardar referencia del proceso
      this.processes.set(moduleName, process);

      // Esperar un momento para verificar que inició correctamente
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verificar salud del módulo
      const isHealthy = await this.checkModuleHealth(moduleName);
      if (isHealthy) {
        console.log(`✅ ${moduleName} está funcionando correctamente`);
        return true;
      } else {
        console.warn(`⚠️ ${moduleName} inició pero no responde a health check`);
        return true; // Aún consideramos exitoso si el proceso inició
      }

    } catch (error) {
      console.error(`❌ Error iniciando ${moduleName}:`, error);
      this.updateStatus(moduleName, {
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Error desconocido'
      });
      return false;
    }
  }

  /**
   * Detener un módulo específico
   */
  async stopModule(moduleName: string): Promise<boolean> {
    const process = this.processes.get(moduleName);
    if (!process) {
      console.log(`⚠️ ${moduleName} no está corriendo`);
      return true;
    }

    try {
      console.log(`🛑 Deteniendo ${moduleName}...`);
      
      // Intentar terminación suave
      process.kill('SIGTERM');
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Si aún está corriendo, forzar terminación
      if (!process.killed) {
        process.kill('SIGKILL');
      }

      this.processes.delete(moduleName);
      this.updateStatus(moduleName, { status: 'stopped' });
      
      console.log(`✅ ${moduleName} detenido`);
      return true;
    } catch (error) {
      console.error(`❌ Error deteniendo ${moduleName}:`, error);
      return false;
    }
  }

  /**
   * Verificar salud de un módulo
   */
  async checkModuleHealth(moduleName: string): Promise<boolean> {
    const config = this.modules.get(moduleName);
    if (!config) return false;

    try {
      const response = await fetch(`http://localhost:${config.port}${config.healthEndpoint}`, {
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Actualizar estado de un módulo
   */
  private updateStatus(moduleName: string, updates: Partial<ModuleStatus>) {
    const current = this.status.get(moduleName);
    if (current) {
      this.status.set(moduleName, { ...current, ...updates });
    }
  }

  /**
   * Obtener estado de todos los módulos
   */
  getModulesStatus(): ModuleStatus[] {
    return Array.from(this.status.values());
  }

  /**
   * Obtener estado de un módulo específico
   */
  getModuleStatus(moduleName: string): ModuleStatus | undefined {
    return this.status.get(moduleName);
  }

  /**
   * Iniciar todos los módulos
   */
  async startAllModules(): Promise<boolean> {
    console.log('🚀 Iniciando todos los módulos externos...');
    
    const results = await Promise.allSettled([
      this.startModule('browser-mcp'),
      this.startModule('scraperr'),
      this.startModule('deepscrape')
    ]);

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const total = results.length;

    console.log(`📊 Módulos iniciados: ${successful}/${total}`);
    return successful === total;
  }

  /**
   * Detener todos los módulos
   */
  async stopAllModules(): Promise<boolean> {
    console.log('🛑 Deteniendo todos los módulos externos...');
    
    const results = await Promise.allSettled([
      this.stopModule('browser-mcp'),
      this.stopModule('scraperr'),
      this.stopModule('deepscrape')
    ]);

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const total = results.length;

    console.log(`📊 Módulos detenidos: ${successful}/${total}`);
    return successful === total;
  }
}

export default ExternalModuleManager;
