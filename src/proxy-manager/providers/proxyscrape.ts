import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ProxyConfig, ProxyValidationResult } from '../types/index';
import { BaseProxyProvider } from './base';

// Definición de tipos para axios
type AxiosInstance = any;
type AxiosRequestConfig = any;

// Definición de tipos para los agentes de proxy
type ProxyAgent = any; // Usamos any temporalmente


interface ProxyScrapeOptions {
  apiKey?: string;
  protocols?: ('http' | 'socks4' | 'socks5')[];
  timeout?: number;
  country?: string;
  ssl?: 'all' | 'yes' | 'no';
  anonymity?: 'all' | 'elite' | 'anonymous' | 'transparent';
}

export class ProxyScrapeProvider extends BaseProxyProvider {
  private readonly baseUrl = 'https://api.proxyscrape.com/v2';
  private readonly client: AxiosInstance;
  private readonly options: Required<ProxyScrapeOptions>;
  private agentCache: Map<string, ProxyAgent>;

  constructor(options: ProxyScrapeOptions = {}) {
    super('ProxyScrape');
    
    this.options = {
      apiKey: options.apiKey || '',
      protocols: options.protocols || ['http', 'socks4', 'socks5'],
      timeout: options.timeout || 10000,
      country: options.country || 'all',
      ssl: options.ssl || 'all',
      anonymity: options.anonymity || 'all',
    };

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.options.timeout,
    });
    
    this.agentCache = new Map();
  }

  /**
   * Obtiene la lista de proxies de ProxyScrape
   */
  public async fetchProxies(): Promise<ProxyConfig[]> {
    try {
      const proxies: ProxyConfig[] = [];
      
      // Obtener proxies para cada protocolo
      for (const protocol of this.options.protocols) {
        const url = this.buildProxyUrl(protocol);
        const response = await this.client.get(url, { responseType: 'text' });
        
        if (response.status === 200 && response.data) {
          const proxyList = this.parseProxyList(response.data, protocol);
          proxies.push(...proxyList);
        }
      }

      super.updateProxies(proxies);
      return proxies;
    } catch (error) {
      console.error('Error fetching proxies from ProxyScrape:', error);
      throw error;
    }
  }

  /**
   * Valida un proxy individual
   */
  public async validateProxy(proxy: ProxyConfig): Promise<ProxyValidationResult> {
    const startTime = Date.now();
    
    try {
      const testUrl = 'https://httpbin.org/ip';
      // Create proxy agent based on protocol
      const proxyUrl = `${proxy.protocol}://${proxy.username && proxy.password 
        ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@` 
        : ''}${proxy.host}:${proxy.port}`;
      
      // Usar el agente de caché si está disponible
      const cacheKey = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
      let agent = this.agentCache.get(cacheKey);

      // Crear un nuevo agente si no está en caché
      if (!agent) {
        if (proxy.protocol.startsWith('socks')) {
          agent = new SocksProxyAgent(proxyUrl);
        } else {
          agent = new HttpsProxyAgent(proxyUrl);
        }
        this.agentCache.set(cacheKey, agent);
      }

      // Configuración de la petición con tipos correctos
      const requestConfig: AxiosRequestConfig = {
        timeout: this.options.timeout,
        httpAgent: agent,
        httpsAgent: agent,
        proxy: false, // Deshabilitar el proxy integrado de axios
      };

      // Realizar la petición a través del proxy
      const response = await axios.get(testUrl, requestConfig);

      const latency = Date.now() - startTime;
      
      return {
        isValid: response.status === 200,
        latency,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        isValid: false,
        latency: -1,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Construye la URL de la API de ProxyScrape
   */
  private buildProxyUrl(protocol: string): string {
    const params = new URLSearchParams({
      request: 'displayproxies',
      protocol,
      timeout: this.options.timeout.toString(),
      country: this.options.country,
      ssl: this.options.ssl,
      anonymity: this.options.anonymity,
      ...(this.options.apiKey ? { key: this.options.apiKey } : {}),
    });

    return `/?${params.toString()}`;
  }

  /**
   * Parsea la lista de proxies en el formato IP:PORT
   */
  private parseProxyList(data: string, protocol: string): ProxyConfig[] {
    return data
      .split(/\r?\n/)
      .filter(line => line.trim() && line.includes(':'))
      .map(line => {
        const [host, port] = line.trim().split(':');
        return {
          host: host.trim(),
          port: parseInt(port, 10),
          protocol: protocol as 'http' | 'https' | 'socks4' | 'socks5',
          lastChecked: new Date(),
          isActive: true,
          score: 100, // Puntuación inicial
        };
      });
  }
}
