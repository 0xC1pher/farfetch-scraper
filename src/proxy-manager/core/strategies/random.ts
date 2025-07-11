import { ProxyConfig, ProxyRotationStrategy } from '../../types/index';

export class RandomStrategy implements ProxyRotationStrategy {
  public getNextProxy(proxies: ProxyConfig[]): ProxyConfig | null {
    if (proxies.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * proxies.length);
    return proxies[randomIndex];
  }
}
