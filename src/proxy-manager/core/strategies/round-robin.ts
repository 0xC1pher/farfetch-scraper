import { ProxyConfig, ProxyRotationStrategy } from '../../types/index.js';

/**
 * Simple Round-Robin strategy
 */
export class RoundRobinStrategy implements ProxyRotationStrategy {
  private currentIndex: number = -1;

  public getNextProxy(proxies: ProxyConfig[]): ProxyConfig | null {
    if (proxies.length === 0) {
      return null;
    }

    this.currentIndex = (this.currentIndex + 1) % proxies.length;
    return proxies[this.currentIndex];
  }
}
