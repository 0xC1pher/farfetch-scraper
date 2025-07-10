import { ProxyConfig, ProxyProvider, ProxyValidationResult } from '../types/index.js';

/**
 * Clase base abstracta para proveedores de proxies
 */
export abstract class BaseProxyProvider implements ProxyProvider {
  protected name: string;
  protected lastFetch: Date | null = null;
  protected proxies: ProxyConfig[] = [];

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Obtiene la lista de proxies del proveedor
   */
  public abstract fetchProxies(): Promise<ProxyConfig[]>;

  /**
   * Valida un proxy individual
   */
  public abstract validateProxy(proxy: ProxyConfig): Promise<ProxyValidationResult>;

  /**
   * Filtra proxies por criterios específicos
   */
  public filterProxies(filters: Partial<ProxyConfig>): ProxyConfig[] {
    return this.proxies.filter(proxy => {
      return Object.entries(filters).every(([key, value]) => {
        return proxy[key as keyof ProxyConfig] === value;
      });
    });
  }

  /**
   * Actualiza la lista de proxies
   */
  protected updateProxies(newProxies: ProxyConfig[]): void {
    this.proxies = newProxies;
    this.lastFetch = new Date();
  }

  /**
   * Obtiene estadísticas del proveedor
   */
  public getStats() {
    return {
      name: this.name,
      totalProxies: this.proxies.length,
      activeProxies: this.proxies.filter(p => p.isActive).length,
      lastFetch: this.lastFetch,
    };
  }
}
