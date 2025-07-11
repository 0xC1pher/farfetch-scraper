import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserMCPHook } from '../index';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

// Mock de módulos externos
vi.mock('child_process');
vi.mock('fs');
vi.mock('path');

// Configuración para las pruebas
const TEST_CONFIG = {
  externalPath: '/test/path',
  timeout: 1000,
  retries: 3
};

// Tipo para el mock de spawn
interface MockSpawn {
  stdout: {
    on: (event: string, listener: (data: Buffer) => void) => any;
  };
  stderr: {
    on: (event: string, listener: (data: Buffer) => void) => any;
  };
  on: (event: string, listener: (...args: any[]) => void) => any;
  kill: () => void;
}

describe('BrowserMCPHook', () => {
  let browserMCP: BrowserMCPHook;
  let mockSpawn: MockSpawn;

  beforeEach(() => {
    // Configurar mocks
    mockSpawn = {
      stdout: {
        on: vi.fn().mockReturnThis()
      },
      stderr: {
        on: vi.fn().mockReturnThis()
      },
      on: vi.fn().mockReturnThis(),
      kill: vi.fn()
    };

    vi.mocked(spawn).mockReturnValue(mockSpawn as any);
    vi.mocked(join).mockImplementation((...args) => args.join('/'));
    vi.mocked(existsSync).mockReturnValue(true);
    
    // Crear una nueva instancia para cada prueba
    browserMCP = new BrowserMCPHook(TEST_CONFIG);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Inicialización', () => {
    it('debe inicializarse correctamente con la configuración proporcionada', () => {
      expect(browserMCP).toBeInstanceOf(BrowserMCPHook);
      // Verificar que se haya llamado a checkAvailability
      expect(existsSync).toHaveBeenCalledWith('/test/path/package.json');
    });

    it('debe marcar como no disponible si el módulo no existe', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(false);
      const instance = new BrowserMCPHook(TEST_CONFIG);
      
      // Verificar que está marcado como no disponible
      await expect(instance.getStatus()).resolves.toEqual({ available: false });
    });
  });

  describe('Manejo de sesiones', () => {
    it('debe iniciar una sesión correctamente', async () => {
      // Configurar el mock para simular una respuesta exitosa
      const mockData = JSON.stringify({
        success: true,
        sessionId: 'test-session-123',
        cookies: []
      });
      
      // Configurar el mock para stdout
      const stdoutOnMock = vi.fn().mockImplementation((event: string, listener: (data: Buffer) => void) => {
        if (event === 'data') {
          listener(Buffer.from(mockData, 'utf-8'));
        }
        return mockSpawn.stdout;
      });
      mockSpawn.stdout.on = stdoutOnMock;
      
      // Configurar el mock para el evento close
      const onMock = vi.fn().mockImplementation((event: string, listener: (code: number) => void) => {
        if (event === 'close') {
          listener(0);
        }
        return mockSpawn;
      });
      mockSpawn.on = onMock;
      
      const result = await browserMCP.login(
        'test@example.com',
        'password123',
        { proxy: 'http://proxy:port' }
      );
      
      expect(result).toEqual({
        success: true,
        sessionId: 'test-session-123',
        cookies: []
      });
    });

    it('debe manejar errores al iniciar sesión', async () => {
      // Configurar el mock para stderr
      const stderrOnMock = vi.fn().mockImplementation((event: string, listener: (data: Buffer) => void) => {
        if (event === 'data') {
          listener(Buffer.from('Error: Authentication failed', 'utf-8'));
        }
        return mockSpawn.stderr;
      });
      mockSpawn.stderr.on = stderrOnMock;
      
      // Configurar el mock para el evento close con error
      const onErrorMock = vi.fn().mockImplementation((event: string, listener: (code: number) => void) => {
        if (event === 'close') {
          listener(1);
        }
        return mockSpawn;
      });
      mockSpawn.on = onErrorMock;
      
      await expect(browserMCP.login(
        'test@example.com',
        'wrong-password'
      )).rejects.toThrow('Login failed: Error: Authentication failed');
    });
  });

  describe('Manejo de tiempo de espera', () => {
    it('debe manejar el tiempo de espera agotado', async () => {
      // Configurar el mock para el evento timeout
      const onTimeoutMock = vi.fn().mockImplementation((event: string, listener: () => void) => {
        if (event === 'timeout') {
          listener();
        }
        return mockSpawn;
      });
      mockSpawn.on = onTimeoutMock;
      
      // The method now rejects on timeout, so we test for that
      await expect(browserMCP.login(
        'test@example.com',
        'password123'
      )).rejects.toThrow('Login timeout');

      // We can't check kill easily as the promise rejects, but the timeout mock ensures the path is tested
    });
  });
});
