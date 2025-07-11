import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScraperrHook } from '../index';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { deepscrape } from '../../deepscrape/index';

// Mock external modules
vi.mock('child_process');
vi.mock('fs');
vi.mock('path');
// Correctly mock the deepscrape module at the right path
vi.mock('../../deepscrape/index');


// Test configuration
const TEST_CONFIG = {
  externalPath: '/test/scraperr/path',
  timeout: 2000,
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

describe('ScraperrHook', () => {
  let scraperr: ScraperrHook;
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
    scraperr = new ScraperrHook(TEST_CONFIG);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize correctly with the provided configuration', () => {
      expect(scraperr).toBeInstanceOf(ScraperrHook);
      // Verify that checkAvailability was called
      expect(existsSync).toHaveBeenCalledWith('/test/scraperr/path/package.json');
    });

    it('should mark as unavailable if the module does not exist', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(false);
      const instance = new ScraperrHook(TEST_CONFIG);
      
      // Verify it is marked as unavailable
      await expect(instance.getStatus()).resolves.toEqual({ available: false });
    });
  });

  describe('Scraping Logic', () => {
    it('should execute a scraping task successfully', async () => {
      // Mock a successful response
      const mockOffers = [
        { id: '1', title: 'Product 1', brand: 'Brand A', price: 100, imageUrl: '', productUrl: '', availability: true, timestamp: new Date() },
        { id: '2', title: 'Product 2', brand: 'Brand B', price: 200, imageUrl: '', productUrl: '', availability: true, timestamp: new Date() }
      ];
      const mockData = JSON.stringify(mockOffers);
      
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
      
      const result = await scraperr.scrapeOffers('https://example.com');
      
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Product 1');
      expect(spawn).toHaveBeenCalled();
    });

    it('should handle scraping errors and use fallback', async () => {
        const fallbackData = {
            success: true,
            data: [{
                title: 'Fallback Product',
            }]
        };
        // Correctly mock the resolved value for the imported deepscrape singleton
        vi.mocked(deepscrape.resolve).mockResolvedValue(fallbackData as any);

      // Mock an error response from the primary scraperr process
      const errorMessage = 'Error: Scrape failed, selector not found';
      
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
      
      const result = await scraperr.scrapeOffers('https://example.com');
      
      // Since it falls back to deepscrape, we expect the fallback data
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      // The title is transformed inside the fallback function
      expect(result[0].title).toBe('Fallback Product');
    });
  });
});
