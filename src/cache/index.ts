/**
 * Sistema de Cache en Memoria para Mexa
 * Optimizado para sistema local con respuestas rápidas
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
  hits: number;
}

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

export class MexaCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats = {
    hits: 0,
    misses: 0
  };

  /**
   * Configuración de TTL por tipo de dato
   */
  private defaultTTLs = {
    offers: 5 * 60 * 1000,      // 5 minutos para ofertas
    sessions: 30 * 60 * 1000,   // 30 minutos para sesiones
    proxies: 10 * 60 * 1000,    // 10 minutos para estado de proxies
    health: 30 * 1000,          // 30 segundos para health checks
    workflows: 60 * 1000,       // 1 minuto para workflows
    api: 2 * 60 * 1000          // 2 minutos para respuestas de API
  };

  /**
   * Obtener datos del cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Incrementar hits
    entry.hits++;
    this.stats.hits++;
    
    return entry.data;
  }

  /**
   * Guardar datos en cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const cacheType = this.getCacheType(key);
    const finalTTL = ttl || this.defaultTTLs[cacheType] || this.defaultTTLs.api;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: finalTTL,
      hits: 0
    });
  }

  /**
   * Eliminar entrada del cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpiar cache expirado
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Limpiar todo el cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    // Calcular uso de memoria aproximado
    const memoryUsage = this.calculateMemoryUsage();

    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage
    };
  }

  /**
   * Obtener o establecer con función de callback
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    // Intentar obtener del cache primero
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Si no está en cache, ejecutar función y guardar resultado
    const data = await fetchFunction();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Cache específico para ofertas con filtros
   */
  async getOffers(
    url: string, 
    filters: any, 
    fetchFunction: () => Promise<any[]>
  ): Promise<any[]> {
    const filterKey = this.createFilterKey(filters);
    const key = `offers:${url}:${filterKey}`;
    
    return this.getOrSet(key, fetchFunction, this.defaultTTLs.offers);
  }

  /**
   * Cache específico para sesiones
   */
  async getSession(
    sessionId: string, 
    fetchFunction: () => Promise<any>
  ): Promise<any> {
    const key = `session:${sessionId}`;
    return this.getOrSet(key, fetchFunction, this.defaultTTLs.sessions);
  }

  /**
   * Cache específico para estado de proxies
   */
  async getProxyStatus(fetchFunction: () => Promise<any>): Promise<any> {
    const key = 'proxy:status';
    return this.getOrSet(key, fetchFunction, this.defaultTTLs.proxies);
  }

  /**
   * Cache específico para health checks
   */
  async getHealthStatus(fetchFunction: () => Promise<any>): Promise<any> {
    const key = 'health:status';
    return this.getOrSet(key, fetchFunction, this.defaultTTLs.health);
  }

  /**
   * Invalidar cache por patrón
   */
  invalidatePattern(pattern: string): number {
    let invalidated = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Invalidar cache de ofertas
   */
  invalidateOffers(url?: string): number {
    const pattern = url ? `offers:${url}:.*` : 'offers:.*';
    return this.invalidatePattern(pattern);
  }

  /**
   * Obtener entradas más populares
   */
  getPopularEntries(limit: number = 10): Array<{key: string, hits: number}> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, hits: entry.hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);

    return entries;
  }

  /**
   * Métodos privados
   */
  private getCacheType(key: string): keyof typeof this.defaultTTLs {
    if (key.startsWith('offers:')) return 'offers';
    if (key.startsWith('session:')) return 'sessions';
    if (key.startsWith('proxy:')) return 'proxies';
    if (key.startsWith('health:')) return 'health';
    if (key.startsWith('workflow:')) return 'workflows';
    return 'api';
  }

  private createFilterKey(filters: any): string {
    if (!filters || Object.keys(filters).length === 0) {
      return 'no-filters';
    }

    // Crear clave determinística basada en filtros
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');

    return Buffer.from(sortedFilters).toString('base64').slice(0, 16);
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Estimación aproximada del tamaño en bytes
      totalSize += key.length * 2; // String key
      totalSize += JSON.stringify(entry.data).length * 2; // Data
      totalSize += 32; // Metadata (timestamp, ttl, hits)
    }

    return Math.round(totalSize / 1024); // Retornar en KB
  }
}

// Instancia singleton del cache
export const mexaCache = new MexaCache();

// Limpiar cache expirado cada 5 minutos
setInterval(() => {
  const cleaned = mexaCache.cleanup();
  if (cleaned > 0) {
    console.log(`🧹 Cache cleanup: ${cleaned} entradas expiradas eliminadas`);
  }
}, 5 * 60 * 1000);

// Utilidades de cache para endpoints específicos
export const CacheUtils = {
  /**
   * Wrapper para endpoints de API con cache automático
   */
  withCache: <T>(
    cacheKey: string,
    ttl?: number
  ) => {
    return (fetchFunction: () => Promise<T>) => {
      return mexaCache.getOrSet(cacheKey, fetchFunction, ttl);
    };
  },

  /**
   * Invalidar cache relacionado con scraping
   */
  invalidateScraping: (url?: string) => {
    mexaCache.invalidateOffers(url);
    mexaCache.invalidatePattern('workflow:scraping.*');
  },

  /**
   * Invalidar cache relacionado con autenticación
   */
  invalidateAuth: (sessionId?: string) => {
    if (sessionId) {
      mexaCache.delete(`session:${sessionId}`);
    } else {
      mexaCache.invalidatePattern('session:.*');
    }
    mexaCache.invalidatePattern('workflow:auth.*');
  },

  /**
   * Precalentar cache con datos comunes
   */
  warmup: async () => {
    console.log('🔥 Precalentando cache...');
    
    try {
      // Precalentar health status
      await mexaCache.getHealthStatus(async () => {
        const response = await fetch('/api/health');
        return response.json();
      });

      // Precalentar proxy status
      await mexaCache.getProxyStatus(async () => {
        const response = await fetch('/api/proxies/status');
        return response.json();
      });

      console.log('✅ Cache precalentado exitosamente');
    } catch (error) {
      console.warn('⚠️ Error precalentando cache:', error);
    }
  }
};
