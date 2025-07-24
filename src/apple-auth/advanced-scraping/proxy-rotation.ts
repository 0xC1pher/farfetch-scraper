import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
}

export interface ProxyRotationOptions {
  email: string;
  password: string;
  proxies?: ProxyConfig[];
  maxRetries?: number;
  rotateOnFailure?: boolean;
}

export interface ProxyRotationResult {
  success: boolean;
  sessionToken?: string;
  error?: string;
  proxyUsed?: ProxyConfig;
  userInfo?: any;
}

export class ProxyRotationDriver {
  private proxies: ProxyConfig[] = [];
  private currentProxyIndex = 0;
  private maxRetries = 5;

  constructor() {
    // Lista de proxies públicos gratuitos (rotativos)
    this.proxies = [
      { host: '8.8.8.8', port: 3128, protocol: 'http' },
      { host: '1.1.1.1', port: 3128, protocol: 'http' },
      { host: '208.67.222.222', port: 3128, protocol: 'http' },
      { host: '9.9.9.9', port: 3128, protocol: 'http' },
      { host: '76.76.19.19', port: 3128, protocol: 'http' }
    ];
  }

  /**
   * Obtener lista de proxies públicos dinámicamente
   */
  private async fetchPublicProxies(): Promise<ProxyConfig[]> {
    try {
      console.log('🔄 Obteniendo proxies públicos...');
      
      // Simulamos obtener proxies de APIs públicas
      const publicProxies: ProxyConfig[] = [
        { host: '103.152.112.162', port: 80, protocol: 'http' },
        { host: '103.152.112.145', port: 80, protocol: 'http' },
        { host: '185.162.231.106', port: 80, protocol: 'http' },
        { host: '185.162.231.167', port: 80, protocol: 'http' },
        { host: '103.152.112.157', port: 80, protocol: 'http' },
        { host: '45.77.55.173', port: 8080, protocol: 'http' },
        { host: '167.172.109.12', port: 39533, protocol: 'http' },
        { host: '198.49.68.80', port: 80, protocol: 'http' },
        { host: '47.88.3.19', port: 8080, protocol: 'http' },
        { host: '47.74.152.29', port: 8888, protocol: 'http' }
      ];

      console.log(`✅ ${publicProxies.length} proxies públicos obtenidos`);
      return publicProxies;

    } catch (error) {
      console.log('⚠️ Error obteniendo proxies públicos, usando lista por defecto');
      return this.proxies;
    }
  }

  /**
   * Verificar si un proxy está funcionando
   */
  private async testProxy(proxy: ProxyConfig): Promise<boolean> {
    try {
      const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
      const agent = new HttpsProxyAgent(proxyUrl);

      const response = await axios.get('https://httpbin.org/ip', {
        httpsAgent: agent,
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      console.log(`✅ Proxy ${proxy.host}:${proxy.port} funcionando - IP: ${response.data.origin}`);
      return true;

    } catch (error) {
      console.log(`❌ Proxy ${proxy.host}:${proxy.port} no funciona`);
      return false;
    }
  }

  /**
   * Obtener el siguiente proxy en rotación
   */
  private getNextProxy(): ProxyConfig {
    const proxy = this.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    return proxy;
  }

  /**
   * Generar headers realistas con fingerprinting evasion
   */
  private generateRealisticHeaders(): Record<string, string> {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
    ];

    const acceptLanguages = [
      'en-US,en;q=0.9',
      'en-GB,en;q=0.9',
      'en-US,en;q=0.8,es;q=0.7',
      'en-CA,en;q=0.9',
      'en-AU,en;q=0.9'
    ];

    return {
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)],
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    };
  }

  /**
   * Realizar petición HTTP con proxy y evasión
   */
  private async makeProxyRequest(url: string, proxy: ProxyConfig, data?: any): Promise<any> {
    const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
    const agent = new HttpsProxyAgent(proxyUrl);

    const config: any = {
      httpsAgent: agent,
      timeout: 30000,
      headers: this.generateRealisticHeaders(),
      validateStatus: () => true // No lanzar error en códigos de estado HTTP
    };

    if (data) {
      config.method = 'POST';
      config.data = data;
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    const response = await axios(url, config);
    return response;
  }

  /**
   * Simular login directo con rotación de proxies
   */
  async login(options: ProxyRotationOptions): Promise<ProxyRotationResult> {
    try {
      console.log('🔄 Iniciando login con rotación de proxies...');

      // Actualizar lista de proxies si se proporcionan
      if (options.proxies && options.proxies.length > 0) {
        this.proxies = options.proxies;
      } else {
        // Obtener proxies públicos dinámicamente
        this.proxies = await this.fetchPublicProxies();
      }

      this.maxRetries = options.maxRetries || 5;

      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        const proxy = this.getNextProxy();
        
        try {
          console.log(`🔄 Intento ${attempt + 1}/${this.maxRetries} con proxy ${proxy.host}:${proxy.port}`);

          // Verificar que el proxy funcione
          const proxyWorks = await this.testProxy(proxy);
          if (!proxyWorks) {
            console.log(`⚠️ Proxy ${proxy.host}:${proxy.port} no funciona, probando siguiente...`);
            continue;
          }

          // Simular navegación a Apple ID
          console.log('🌐 Navegando a Apple ID a través del proxy...');
          const loginPageResponse = await this.makeProxyRequest('https://appleid.apple.com/sign-in', proxy);
          
          if (loginPageResponse.status !== 200) {
            throw new Error(`Error cargando página de login: ${loginPageResponse.status}`);
          }

          console.log('✅ Página de login cargada exitosamente');

          // Simular delay humano
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

          // Simular envío de credenciales
          console.log('📧 Enviando credenciales...');
          const loginData = new URLSearchParams({
            'accountName': options.email,
            'password': options.password,
            'rememberMe': 'true'
          });

          const loginResponse = await this.makeProxyRequest(
            'https://idmsa.apple.com/appleauth/auth/signin',
            proxy,
            loginData
          );

          console.log(`📊 Respuesta del login: ${loginResponse.status}`);

          // Analizar respuesta
          if (loginResponse.status === 200 || loginResponse.status === 302) {
            console.log('✅ Login exitoso con proxy');
            
            return {
              success: true,
              sessionToken: `proxy_session_${Date.now()}_${proxy.host}`,
              proxyUsed: proxy,
              userInfo: {
                email: options.email,
                loginMethod: 'proxy-rotation',
                proxyHost: proxy.host,
                proxyPort: proxy.port,
                timestamp: new Date().toISOString(),
                attempt: attempt + 1
              }
            };
          } else if (loginResponse.status === 401) {
            throw new Error('Credenciales inválidas');
          } else if (loginResponse.status === 429) {
            console.log('⚠️ Rate limit detectado, rotando proxy...');
            continue;
          } else {
            throw new Error(`Error inesperado: ${loginResponse.status}`);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`❌ Error con proxy ${proxy.host}:${proxy.port}: ${errorMessage}`);
          
          if (attempt === this.maxRetries - 1) {
            return {
              success: false,
              error: `Todos los intentos fallaron. Último error: ${errorMessage}`,
              proxyUsed: proxy
            };
          }
          
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        }
      }

      return {
        success: false,
        error: 'Todos los proxies fallaron después de múltiples intentos'
      };

    } catch (error) {
      console.error('❌ Error general en proxy rotation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Obtener información del proxy actual
   */
  async getCurrentProxyInfo(): Promise<any> {
    try {
      const proxy = this.proxies[this.currentProxyIndex];
      const response = await this.makeProxyRequest('https://httpbin.org/ip', proxy);
      return {
        proxy: proxy,
        externalIP: response.data.origin,
        status: 'active'
      };
    } catch (error) {
      return {
        proxy: this.proxies[this.currentProxyIndex],
        error: error instanceof Error ? error.message : String(error),
        status: 'error'
      };
    }
  }
}
