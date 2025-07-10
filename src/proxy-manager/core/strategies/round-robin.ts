import { ProxyConfig, ProxyRotationStrategy } from '../../types/index.js';

interface TimedProxyConfig extends ProxyConfig {
  lastFailure?: number;
  failureCount: number;
  isActive: boolean;
}

/**
 * Enhanced Round-Robin strategy with active proxy tracking and configurable retry delay
 */
export class RoundRobinStrategy implements ProxyRotationStrategy {
  private currentIndex: number = -1;
  private proxies: TimedProxyConfig[] = [];
  private readonly RETRY_DELAY_MS = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  /**
   * Get the next available proxy in round-robin fashion
   */
  public getNextProxy(proxies: ProxyConfig[]): ProxyConfig {
    if (proxies.length === 0) {
      throw new Error('No proxies available');
    }

    // Update the internal proxies list if needed
    this.syncProxies(proxies);
    
    // Find the next active proxy
    const startIndex = this.currentIndex;
    let attempts = 0;
    
    do {
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
      const proxy = this.proxies[this.currentIndex];
      
      // Skip inactive proxies
      if (!proxy.isActive) {
        const timeSinceFailure = Date.now() - (proxy.lastFailure || 0);
        // Reactivate proxy if retry delay has passed
        if (timeSinceFailure > this.RETRY_DELAY_MS) {
          proxy.isActive = true;
          proxy.failureCount = 0;
          console.log(`Reactivated proxy ${proxy.host}:${proxy.port} after delay`);
        } else {
          continue;
        }
      }
      
      return proxy;
      
    } while (attempts++ < this.proxies.length);
    
    throw new Error('No active proxies available');
  }

  /**
   * Called when a request is successful
   */
  public onRequestSuccess(proxy: ProxyConfig): void {
    const proxyObj = this.findProxy(proxy);
    if (proxyObj) {
      proxyObj.isActive = true;
      proxyObj.failureCount = 0;
    }
  }

  /**
   * Called when a request fails
   */
  public onRequestFailure(proxy: ProxyConfig): void {
    const proxyObj = this.findProxy(proxy);
    if (!proxyObj) return;
    
    proxyObj.failureCount = (proxyObj.failureCount || 0) + 1;
    proxyObj.lastFailure = Date.now();
    
    if (proxyObj.failureCount >= this.MAX_RETRIES) {
      proxyObj.isActive = false;
      console.log(`Marked ${proxy.host}:${proxy.port} as inactive after ${this.MAX_RETRIES} failures`);
    }
  }
  
  /**
   * Sync internal proxies list with the provided list
   */
  private syncProxies(proxies: ProxyConfig[]): void {
    // Add new proxies
    for (const proxy of proxies) {
      if (!this.proxies.some(p => p.host === proxy.host && p.port === proxy.port)) {
        this.proxies.push({
          ...proxy,
          isActive: true,
          failureCount: 0
        });
      }
    }
    
    // Remove proxies that are no longer in the list
    this.proxies = this.proxies.filter(proxy => 
      proxies.some(p => p.host === proxy.host && p.port === proxy.port)
    );
    
    // Reset current index if it's out of bounds
    if (this.currentIndex >= this.proxies.length) {
      this.currentIndex = -1;
    }
  }
  
  /**
   * Find a proxy in the internal list
   */
  private findProxy(proxy: ProxyConfig): TimedProxyConfig | undefined {
    return this.proxies.find(p => p.host === proxy.host && p.port === proxy.port);
  }
}
