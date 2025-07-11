import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeepscrapeHook } from '../index';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

// Mock external modules
vi.mock('child_process');
vi.mock('fs');
vi.mock('path');

// Test configuration
const TEST_CONFIG = {
  externalPath: '/test/deepscrape/path',
  timeout: 5000,
  retries: 2
};

// Type for the spawn mock
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

describe('DeepscrapeHook', () => {
  let deepscrape: DeepscrapeHook;
  let mockSpawn: MockSpawn;

  beforeEach(() => {
    // Setup mocks
    mockSpawn = {
      stdout: { on: vi.fn().mockReturnThis() },
      stderr: { on: vi.fn().mockReturnThis() },
      on: vi.fn().mockReturnThis(),
      kill: vi.fn()
    };

    vi.mocked(spawn).mockReturnValue(mockSpawn as any);
    vi.mocked(join).mockImplementation((...args) => args.join('/'));
    vi.mocked(existsSync).mockReturnValue(true);
    
    // Create a new instance for each test
    deepscrape = new DeepscrapeHook(TEST_CONFIG);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize correctly with the provided configuration', () => {
      expect(deepscrape).toBeInstanceOf(DeepscrapeHook);
      expect(existsSync).toHaveBeenCalledWith('/test/deepscrape/path/package.json');
    });

    it('should mark as unavailable if the module does not exist', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(false);
      const instance = new DeepscrapeHook(TEST_CONFIG);
      await expect(instance.getStatus()).resolves.toEqual({ available: false });
    });
  });

  describe('Element Resolution Logic', () => {
    it('should resolve dynamic elements successfully', async () => {
      // Mock a successful response from the external script
      const mockResponseData = {
        success: true,
        data: [
          { selector: '.price-123', value: '€100' },
          { selector: 'button.buy-now', value: 'Add to Cart' }
        ]
      };
      const mockData = JSON.stringify(mockResponseData.data);
      
      // Mock stdout
      const stdoutOnMock = vi.fn().mockImplementation((event: string, listener: (data: Buffer) => void) => {
        if (event === 'data') {
          listener(Buffer.from(mockData, 'utf-8'));
        }
        return mockSpawn.stdout;
      });
      mockSpawn.stdout.on = stdoutOnMock;
      
      // Mock the close event
      const onMock = vi.fn().mockImplementation((event: string, listener: (code: number) => void) => {
        if (event === 'close') {
          listener(0);
        }
        return mockSpawn;
      });
      mockSpawn.on = onMock;
      
      const result = await deepscrape.resolve({
        pageUrl: 'https://example.com/product/1',
        elements: [
          { selector: '.price-123', type: 'text' },
          { selector: 'button.buy-now', type: 'text' }
        ]
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponseData.data);
      expect(spawn).toHaveBeenCalled();
    });

    it('should handle resolution errors', async () => {
      // Mock an error response
      const errorMessage = 'Error: Could not resolve elements from page';
      
      // Mock stderr
      const stderrOnMock = vi.fn().mockImplementation((event: string, listener: (data: Buffer) => void) => {
        if (event === 'data') {
          listener(Buffer.from(errorMessage, 'utf-8'));
        }
        return mockSpawn.stderr;
      });
      mockSpawn.stderr.on = stderrOnMock;
      
      // Mock the close event with an error code
      const onErrorMock = vi.fn().mockImplementation((event: string, listener: (code: number) => void) => {
        if (event === 'close') {
          listener(1);
        }
        return mockSpawn;
      });
      mockSpawn.on = onErrorMock;
      
      const result = await deepscrape.resolve({
        pageUrl: 'https://example.com/product/1',
        elements: [{ selector: '.non-existent', type: 'text' }]
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Deepscrape failed: Error: Could not resolve elements from page');
    });
  });
});
