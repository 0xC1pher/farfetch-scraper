import { EventEmitter } from 'events';
import { 
  ProxyConfig, 
  ProxyManagerOptions, 
  ProxyProvider, 
  ProxyRotationStrategy, 
  ProxyStats, 
  ProxyValidationResult 
} from '../types/index.js';
import { RoundRobinStrategy } from './strategies/round-robin.js';

/**
 * Clase principal del Proxy Manager
 */
export class ProxyManager extends EventEmitter {
  private providers: Map<string, ProxyProvider> = new Map();
  private proxies: Map<string, ProxyConfig> = new Map();
  private stats: Map<string, ProxyStats> = new Map();
  private rotationStrategy: ProxyRotationStrategy;
  private options: Required<ProxyManagerOptions>;
  private validationInterval?: NodeJS.Timeout;

  constructor(options: ProxyManagerOptions = {}) {
    super();
    
    this.options = {
      maxRetries: options.maxRetries || 3,
      requestTimeout: options.requestTimeout || 10000,
      validationInterval: options.validationInterval || 300000, // 5 minutos
      rotationStrategy: options.rotationStrategy || 'round-robin',
      maxConcurrentRequests: options.maxConcurrentRequests || 10,
      blacklist: options.blacklist || [],
      whitelist: options.whitelist || [],
    };

    // Configurar estrategia de rotación
    this.rotationStrategy = this.createRotationStrategy();
  }

  /**
   * Inicializa el Proxy Manager
   */
  public async initialize(): Promise<void> {
    // Cargar proxies de los proveedores
    await this.refreshProxies();
    
    // Iniciar validación periódica
    this.startValidationCycle();
    
    this.emit('ready');
  }

  /**
   * Registra un nuevo proveedor de proxies
   */
  public registerProvider(name: string, provider: ProxyProvider): void {
    this.providers.set(name, provider);
    this.emit('provider:registered', { name });
  }

  /**
   * Obtiene el siguiente proxy disponible según la estrategia de rotación
   */
  public getNextProxy(): ProxyConfig | null {
    const activeProxies = Array.from(this.proxies.values())
      .filter(proxy => proxy.isActive);

    if (activeProxies.length === 0) {
      return null;
    }

    return this.rotationStrategy.getNextProxy(activeProxies);
  }

  /**
   * Actualiza la lista de proxies de todos los proveedores
   */
  public async refreshProxies(): Promise<void> {
    const allProxies: ProxyConfig[] = [];
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        const proxies = await provider.fetchProxies();
        allProxies.push(...proxies);
        this.emit('provider:refreshed', { name, count: proxies.length });
      } catch (error) {
        this.emit('error', { 
          source: 'refreshProxies', 
          provider: name, 
          error: error instanceof Error ? error : new Error(String(error)) 
        });
      }
    }

    // Actualizar el mapa de proxies
    this.updateProxyMap(allProxies);
  }

  /**
   * Valida todos los proxies activos
   */
  public async validateProxies(): Promise<void> {
    const validationPromises = Array.from(this.proxies.values())
      .map(proxy => this.validateProxy(proxy));

    await Promise.all(validationPromises);
  }

  /**
   * Obtiene estadísticas del Proxy Manager
   */
  public getStats() {
    const activeProxies = Array.from(this.proxies.values())
      .filter(proxy => proxy.isActive);

    const totalRequests = Array.from(this.stats.values())
      .reduce((sum, stat) => sum + stat.totalRequests, 0);

    const failedRequests = Array.from(this.stats.values())
      .reduce((sum, stat) => sum + stat.failedRequests, 0);

    const successRate = totalRequests > 0 
      ? ((totalRequests - failedRequests) / totalRequests) * 100 
      : 0;

    return {
      totalProxies: this.proxies.size,
      activeProxies: activeProxies.length,
      providers: Array.from(this.providers.keys()),
      successRate: parseFloat(successRate.toFixed(2)),
      totalRequests,
      failedRequests,
      lastUpdated: new Date(),
    };
  }

  /**
   * Detiene el ciclo de validación
   */
  public stop(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.emit('stopped');
    }
  }

  /**
   * Valida un proxy individual
   */
  private async validateProxy(proxy: ProxyConfig): Promise<void> {
    if (!proxy.provider) {
      this.emit('proxyValidationFailed', { 
        proxy, 
        error: 'No provider specified for proxy' 
      });
      return;
    }

    const provider = this.providers.get(proxy.provider);
    if (!provider) {
      this.emit('proxyValidationFailed', { 
        proxy, 
        error: `Provider '${proxy.provider}' not found` 
      });
      return;
    }

    try {
      const result = await provider.validateProxy(proxy);
      const proxyId = this.getProxyId(proxy);
      
      // Actualizar estado del proxy
      proxy.isActive = result.isValid;
      proxy.lastChecked = new Date();
      
      // Emit event for successful validation
      this.emit('proxyValidated', { proxy, result });
      
      // Actualizar estadísticas
      this.updateProxyStats(proxyId, result);
      
      this.emit('proxy:validated', { 
        proxyId, 
        isValid: result.isValid,
        latency: result.latency 
      });
      
    } catch (error) {
      this.emit('error', { 
        source: 'validateProxy', 
        proxy,
        error: error instanceof Error ? error : new Error(String(error)) 
      });
    }
  }

  /**
   * Actualiza el mapa de proxies con una nueva lista
   */
  private updateProxyMap(newProxies: ProxyConfig[]): void {
    const newMap = new Map<string, ProxyConfig>();
    
    for (const proxy of newProxies) {
      const proxyId = this.getProxyId(proxy);
      
      // Mantener el estado existente si el proxy ya existe
      const existingProxy = this.proxies.get(proxyId);
      if (existingProxy) {
        newMap.set(proxyId, { ...existingProxy, ...proxy });
      } else {
        newMap.set(proxyId, { 
          ...proxy, 
          isActive: proxy.isActive ?? true,
          score: proxy.score ?? 100,
          lastChecked: proxy.lastChecked ?? new Date()
        });
      }
    }
    
    this.proxies = newMap;
    this.emit('proxies:updated', { count: newProxies.length });
  }

  /**
   * Actualiza las estadísticas de un proxy
   */
  private updateProxyStats(proxyId: string, result: ProxyValidationResult): void {
    const currentStats = this.stats.get(proxyId) || {
      totalRequests: 0,
      failedRequests: 0,
      successRate: 0,
      avgResponseTime: 0,
      lastUsed: new Date(),
      uptime: 0,
    };

    currentStats.totalRequests++;
    
    if (!result.isValid) {
      currentStats.failedRequests++;
    }

    currentStats.successRate = 
      ((currentStats.totalRequests - currentStats.failedRequests) / currentStats.totalRequests) * 100;
    
    if (result.latency > 0) {
      currentStats.avgResponseTime = Math.round(
        (currentStats.avgResponseTime * (currentStats.totalRequests - 1) + result.latency) / 
        currentStats.totalRequests
      );
    }

    currentStats.lastUsed = new Date();
    this.stats.set(proxyId, currentStats);
  }

  /**
   * Inicia el ciclo de validación periódica
   */
  private startValidationCycle(): void {
    // Validar inmediatamente al inicio
    this.validateProxies().catch(error => {
      this.emit('error', { 
        source: 'startValidationCycle', 
        error: error instanceof Error ? error : new Error(String(error)) 
      });
    });

    // Configurar validación periódica
    this.validationInterval = setInterval(() => {
      this.validateProxies().catch(error => {
        this.emit('error', { 
          source: 'validationCycle', 
          error: error instanceof Error ? error : new Error(String(error)) 
        });
      });
    }, this.options.validationInterval);
  }

  /**
   * Crea una estrategia de rotación basada en la configuración
   */
  private createRotationStrategy(): ProxyRotationStrategy {
    switch (this.options.rotationStrategy) {
      case 'round-robin':
        return new RoundRobinStrategy();
      case 'best-performance':
        // Implementar estrategia de mejor rendimiento
        throw new Error('Not implemented yet');
      case 'random':
        // Implementar estrategia aleatoria
        throw new Error('Not implemented yet');
      default:
        return new RoundRobinStrategy();
    }
  }

  /**
   * Genera un ID único para un proxy
   */
  private getProxyId(proxy: ProxyConfig): string {
    return `${proxy.protocol}://${proxy.host}:${proxy.port}`;
  }
}
