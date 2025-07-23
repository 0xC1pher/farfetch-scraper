export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
}

export class ProxyHandler {
  /**
   * Parsear string de proxy a configuración
   */
  parseProxy(proxyString: string): string | null {
    try {
      // Formatos soportados:
      // ip:port
      // protocol://ip:port
      // protocol://username:password@ip:port
      // username:password@ip:port
      
      let cleanProxy = proxyString.trim();
      
      // Si no tiene protocolo, asumir http
      if (!cleanProxy.includes('://')) {
        cleanProxy = `http://${cleanProxy}`;
      }
      
      const url = new URL(cleanProxy);
      
      // Validar que tenga host y port
      if (!url.hostname || !url.port) {
        console.warn('⚠️ Proxy inválido: falta host o puerto');
        return null;
      }
      
      // Construir string de proxy para Chrome
      let proxyConfig = `${url.protocol.replace(':', '')}://${url.hostname}:${url.port}`;
      
      console.log('🌐 Proxy configurado:', proxyConfig);
      return proxyConfig;
      
    } catch (error) {
      console.error('❌ Error parseando proxy:', error);
      return null;
    }
  }

  /**
   * Validar configuración de proxy
   */
  validateProxy(config: ProxyConfig): boolean {
    if (!config.host || !config.port) {
      return false;
    }
    
    if (config.port < 1 || config.port > 65535) {
      return false;
    }
    
    const validProtocols = ['http', 'https', 'socks4', 'socks5'];
    if (!validProtocols.includes(config.protocol)) {
      return false;
    }
    
    return true;
  }

  /**
   * Generar configuración de proxy para Chrome
   */
  generateChromeProxyConfig(config: ProxyConfig): string {
    if (!this.validateProxy(config)) {
      throw new Error('Configuración de proxy inválida');
    }
    
    return `${config.protocol}://${config.host}:${config.port}`;
  }

  /**
   * Probar conectividad del proxy
   */
  async testProxy(proxyString: string): Promise<boolean> {
    try {
      // Implementación básica de test de proxy
      // En un entorno real, podrías hacer una petición HTTP a través del proxy
      const config = this.parseProxy(proxyString);
      return config !== null;
    } catch {
      return false;
    }
  }
}
