import { ProxyConfig, ProxyRotationStrategy } from '../../types/index';

interface ProxyWithWeight extends ProxyConfig {
  weight: number;
  lastUsed?: Date;
  successRate?: number;
  avgResponseTime?: number;
}

export class WeightedStrategy implements ProxyRotationStrategy {
  private weights: Map<string, number> = new Map();
  private readonly DEFAULT_WEIGHT = 1;
  private readonly MAX_WEIGHT = 10;
  private readonly MIN_WEIGHT = 0.1;
  private readonly SUCCESS_BOOST = 0.1;
  private readonly FAILURE_PENALTY = 0.2;

  constructor() {
    this.weights = new Map();
  }

  getNextProxy(proxies: ProxyConfig[]): ProxyConfig {
    if (proxies.length === 0) {
      throw new Error('No proxies available');
    }

    // Initialize weights for new proxies
    proxies.forEach(proxy => {
      const proxyKey = this.getProxyKey(proxy);
      if (!this.weights.has(proxyKey)) {
        this.weights.set(proxyKey, this.DEFAULT_WEIGHT);
      }
    });

    // Calculate total weight
    let totalWeight = 0;
    const weightedProxies = proxies.map(proxy => {
      const weight = this.weights.get(this.getProxyKey(proxy)) || this.DEFAULT_WEIGHT;
      totalWeight += weight;
      return { proxy, weight };
    });

    // Select proxy based on weight
    let random = Math.random() * totalWeight;
    for (const { proxy, weight } of weightedProxies) {
      if (random < weight) {
        return proxy;
      }
      random -= weight;
    }

    // Fallback to first proxy if something goes wrong
    return proxies[0];
  }

  onRequestSuccess(proxy: ProxyConfig): void {
    const key = this.getProxyKey(proxy);
    const currentWeight = this.weights.get(key) || this.DEFAULT_WEIGHT;
    const newWeight = Math.min(currentWeight + this.SUCCESS_BOOST, this.MAX_WEIGHT);
    this.weights.set(key, newWeight);
  }

  onRequestFailure(proxy: ProxyConfig): void {
    const key = this.getProxyKey(proxy);
    const currentWeight = this.weights.get(key) || this.DEFAULT_WEIGHT;
    const newWeight = Math.max(currentWeight - this.FAILURE_PENALTY, this.MIN_WEIGHT);
    this.weights.set(key, newWeight);
  }

  private getProxyKey(proxy: ProxyConfig): string {
    return `${proxy.host}:${proxy.port}:${proxy.protocol}`;
  }
}
