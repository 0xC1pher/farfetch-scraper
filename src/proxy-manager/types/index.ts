/**
 * Tipos principales para el Proxy Manager
 */

export interface ProxyConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  username?: string;
  password?: string;
  country?: string;
  anonymityLevel?: 'transparent' | 'anonymous' | 'elite';
  lastChecked?: Date;
  score?: number;
  timeout?: number;
  retryCount?: number;
  isActive?: boolean;
  provider?: string;
}

export interface ProxyStats {
  totalRequests: number;
  failedRequests: number;
  successRate: number;
  avgResponseTime: number;
  lastUsed: Date;
  uptime: number;
}

export interface ProxyValidationResult {
  isValid: boolean;
  latency: number;
  error?: string;
  timestamp: Date;
}

export interface ProxyRotationStrategy {
  getNextProxy(proxies: ProxyConfig[]): ProxyConfig;
  onRequestSuccess(proxy: ProxyConfig): void;
  onRequestFailure(proxy: ProxyConfig): void;
}

export interface ProxyProvider {
  fetchProxies(): Promise<ProxyConfig[]>;
  validateProxy(proxy: ProxyConfig): Promise<ProxyValidationResult>;
}

export interface ProxyManagerOptions {
  maxRetries?: number;
  requestTimeout?: number;
  validationInterval?: number;
  rotationStrategy?: 'round-robin' | 'best-performance' | 'random';
  maxConcurrentRequests?: number;
  blacklist?: string[];
  whitelist?: string[];
}
