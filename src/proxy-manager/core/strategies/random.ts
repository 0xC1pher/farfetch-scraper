import { ProxyConfig, ProxyRotationStrategy } from '../../types/index.js';

export class RandomStrategy implements ProxyRotationStrategy {
  private lastProxyIndex: number = -1;

  getNextProxy(proxies: ProxyConfig[]): ProxyConfig {
    if (proxies.length === 0) {
      throw new Error('No proxies available');
    }
    
    // If there's only one proxy, return it
    if (proxies.length === 1) {
      return proxies[0];
    }

    // Generate a random index different from the last used one
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * proxies.length);
    } while (randomIndex === this.lastProxyIndex && proxies.length > 1);
    
    this.lastProxyIndex = randomIndex;
    return proxies[randomIndex];
  }

  onRequestSuccess(): void {
    // No special handling needed for random strategy
  }

  onRequestFailure(): void {
    // Reset last proxy index on failure to allow immediate retry with any proxy
    this.lastProxyIndex = -1;
  }
}
