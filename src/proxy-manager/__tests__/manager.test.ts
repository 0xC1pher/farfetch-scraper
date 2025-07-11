import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProxyManager } from '../core/manager';
import type { ProxyConfig, ProxyProvider } from '../types/index';

const sampleProxies: ProxyConfig[] = [
  { host: 'proxy1.com', port: 8080, protocol: 'http', provider: 'test' },
  { host: 'proxy2.com', port: 8081, protocol: 'http', provider: 'test' },
  { host: 'proxy3.com', port: 8082, protocol: 'http', provider: 'test' },
];

const createMockProvider = (proxies = [...sampleProxies]): ProxyProvider => ({
  fetchProxies: vi.fn().mockResolvedValue(proxies),
  validateProxy: vi.fn().mockImplementation((proxy: ProxyConfig) => 
    Promise.resolve({
      isValid: proxy.isActive !== false,
      latency: 100,
      timestamp: new Date(),
    })
  ),
});

describe('ProxyManager (Comprehensive Tests)', () => {
  let mockProvider: ProxyProvider;

  beforeEach(() => {
    mockProvider = createMockProvider();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Rotation Strategies', () => {
    it('should use random strategy when configured', async () => {
      const manager = new ProxyManager({ rotationStrategy: 'random' });
      manager.registerProvider('test', mockProvider);
      await manager.initialize();

      const selections = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const proxy = manager.getNextProxy();
        if (proxy) {
          selections.add(proxy.host);
        }
      }
      // With 3 proxies and 10 selections, it's highly probable we'll see more than 1 unique proxy
      expect(selections.size).toBeGreaterThan(1);
    });
  });

  describe('Proxy Health and Validation', () => {
    it('should deactivate a proxy after a failed validation', async () => {
      const manager = new ProxyManager();
      // Modify the mock provider for this specific test
      mockProvider.validateProxy = vi.fn()
        .mockResolvedValueOnce({ isValid: false, latency: 0, timestamp: new Date() })
        .mockResolvedValue({ isValid: true, latency: 100, timestamp: new Date() });
        
      manager.registerProvider('test', mockProvider);
      await manager.initialize();

      // Manually trigger validation on the first proxy
      const proxyToDeactivate = sampleProxies[0];
      // Access private method for testing purposes
      await (manager as any).validateProxy(proxyToDeactivate);

      // Check that the proxy is now inactive
      const deactivatedProxy = Array.from((manager as any).proxies.values()).find(p => (p as ProxyConfig).host === proxyToDeactivate.host) as ProxyConfig;
      expect(deactivatedProxy.isActive).toBe(false);

      // Verify that getNextProxy does not return the deactivated proxy
      for (let i = 0; i < 10; i++) {
        const proxy = manager.getNextProxy();
        expect(proxy?.host).not.toBe(proxyToDeactivate.host);
      }
    });

    it('should run validation cycle periodically', async () => {
      vi.useFakeTimers();
      const validationInterval = 10000;
      const manager = new ProxyManager({ validationInterval });
      manager.registerProvider('test', mockProvider);
      await manager.initialize();

      // Should be called once on initialize
      expect(mockProvider.validateProxy).toHaveBeenCalledTimes(sampleProxies.length);

      // Advance time to trigger next validation
      await vi.advanceTimersByTimeAsync(validationInterval);
      expect(mockProvider.validateProxy).toHaveBeenCalledTimes(sampleProxies.length * 2);

      // Advance time again
      await vi.advanceTimersByTimeAsync(validationInterval);
      expect(mockProvider.validateProxy).toHaveBeenCalledTimes(sampleProxies.length * 3);
      
      manager.stop();
      vi.useRealTimers();
    });
  });
});
