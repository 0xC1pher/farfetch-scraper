import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { ProxyManager } from '../core/manager';
import type { ProxyConfig, ProxyProvider, ProxyValidationResult } from '../types/index';

describe('ProxyManager', () => {
  let manager: ProxyManager;
  let mockProvider: ProxyProvider;
  
  const sampleProxies: ProxyConfig[] = [
    { 
      host: 'proxy1.example.com', 
      port: 8080, 
      protocol: 'http',
      isActive: true,
      provider: 'test'
    },
    {
      host: 'proxy2.example.com',
      port: 8080,
      protocol: 'https',
      isActive: true,
      provider: 'test'
    }
  ];

  // Función para crear un mock de proveedor con proxies personalizados
  const createMockProvider = (proxies = [...sampleProxies]) => {
    return {
      fetchProxies: vi.fn().mockResolvedValue(proxies),
      validateProxy: vi.fn().mockImplementation((proxy: ProxyConfig) => {
        // Simular validación exitosa para proxies activos
        const isValid = proxy.isActive !== false;
        return Promise.resolve({
          isValid,
          latency: isValid ? Math.floor(Math.random() * 100) : 0,
          timestamp: new Date(),
          ...(isValid ? {} : { error: 'Connection failed' })
        });
      })
    };
  };

  beforeEach(() => {
    // Crear un nuevo mock para cada prueba
    mockProvider = createMockProvider();
    
    // Crear una nueva instancia del ProxyManager
    manager = new ProxyManager({
      maxRetries: 3,
      requestTimeout: 5000,
      validationInterval: 60000,
      rotationStrategy: 'round-robin',
      maxConcurrentRequests: 10
    });
    
    // Registrar el proveedor mock
    manager.registerProvider('test', mockProvider);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    
    if ('validationInterval' in manager) {
      clearInterval(manager['validationInterval']);
    }
  });

  describe('Inicialización', () => {
    it('debe inicializarse correctamente', async () => {
      await manager.initialize();
      expect(manager).toBeDefined();
      expect(mockProvider.fetchProxies).toHaveBeenCalled();
    });

    it('debe cargar proxies del proveedor', async () => {
      await manager.initialize();
      const proxy = manager.getNextProxy();
      expect(proxy).toBeDefined();
      expect(proxy?.host).toMatch(/\.example\.com$/);
    });
  });

  describe('Rotación de Proxies', () => {
    it('debe rotar entre los proxies disponibles', async () => {
      await manager.initialize();
      
      // Obtener el primer proxy
      const proxy1 = manager.getNextProxy();
      expect(proxy1).toBeDefined();
      
      // Obtener el segundo proxy (debería ser diferente al primero)
      const proxy2 = manager.getNextProxy();
      expect(proxy2).toBeDefined();
      expect(proxy1?.host).not.toBe(proxy2?.host);
      
      // El siguiente debería volver al primero (round-robin)
      const proxy3 = manager.getNextProxy();
      expect(proxy3?.host).toBe(proxy1?.host);
    });
  });

  describe('Validación de Proxies', () => {
    it('debe manejar la validación de proxies', async () => {
      // Crear un proxy personalizado para la prueba
      const testProxy = { 
        ...sampleProxies[0], 
        isActive: true,
        failureCount: 0 
      };
      
      const mockProvider = createMockProvider([testProxy]);
      
      // Configurar validación para fallar
      mockProvider.validateProxy = vi.fn().mockResolvedValue({
        isValid: false,
        latency: 0,
        timestamp: new Date(),
        error: 'Connection failed'
      });
      
      // Registrar el proveedor personalizado
      manager.registerProvider('test-validate', mockProvider);
      await manager.initialize();
      
      // Obtener el proxy (debería estar activo inicialmente)
      const proxy = manager.getNextProxy();
      expect(proxy).toBeDefined();
      
      // Verificar que podemos obtener el proxy nuevamente
      // (en este caso, el ProxyManager no marca automáticamente los proxies como inactivos)
      const sameProxy = manager.getNextProxy();
      expect(sameProxy).toBeDefined();
    });
  });

  describe('Manejo de Errores', () => {
    it('debe manejar errores al cargar proxies', async () => {
      // Crear un nuevo manager para esta prueba
      const errorManager = new ProxyManager({
        maxRetries: 3,
        requestTimeout: 5000,
        validationInterval: 60000,
        rotationStrategy: 'round-robin',
        maxConcurrentRequests: 10
      });
      
      // Crear un proveedor que falle
      const errorProvider = {
        fetchProxies: vi.fn().mockRejectedValue(new Error('Failed to fetch proxies')),
        validateProxy: vi.fn().mockResolvedValue({
          isValid: true,
          latency: 100,
          timestamp: new Date()
        })
      };
      
      // Manejar el evento de error
      const errorPromise = new Promise<{source: string, provider: string, error: Error}>((resolve) => {
        errorManager.on('error', (error: {source: string, provider: string, error: Error}) => {
          resolve(error);
        });
      });
      
      // Registrar el proveedor que falla
      errorManager.registerProvider('error-provider', errorProvider);
      
      // Inicializar y esperar a que se emita el error
      await errorManager.initialize();
      const error = await errorPromise;
      
      // Verificar que se emitió el error esperado
      expect(error).toBeDefined();
      expect(error.source).toBe('refreshProxies');
      
      // Limpiar
      if ('validationInterval' in errorManager) {
        clearInterval(errorManager['validationInterval']);
      }
    });
  });
});
