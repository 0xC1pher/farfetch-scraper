import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Orchestrator } from '../orchestrator';
import { browserMCP } from '../../modules/browser-mcp/index';
import { minioStorage, SessionData } from '../../modules/minio/index';
import { scraperr } from '../../modules/scraperr/index';

// Mock the modules
vi.mock('../../modules/browser-mcp/index', () => ({
  browserMCP: {
    login: vi.fn(),
    getStatus: vi.fn(),
  },
}));

vi.mock('../../modules/minio/index', () => ({
  minioStorage: {
    loadSession: vi.fn(),
    saveSession: vi.fn(),
    getStatus: vi.fn(),
  },
}));

vi.mock('../../modules/scraperr/index', () => ({
  scraperr: {
    loadSession: vi.fn(),
    scrapeOffers: vi.fn(),
    extractWithFallback: vi.fn(),
    getStatsAsync: vi.fn(),
  },
}));

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new Orchestrator();
  });

  describe('ensureSession', () => {
    it('should load a session from MinIO if sessionId is provided and session is active', async () => {
      const mockSession: SessionData = { sessionId: 'existing-session', status: 'active', cookies: [], timestamp: new Date() };
      vi.mocked(minioStorage.loadSession).mockResolvedValue(mockSession);

      const session = await orchestrator.ensureSession({ sessionId: 'existing-session' });

      expect(minioStorage.loadSession).toHaveBeenCalledWith('existing-session');
      expect(browserMCP.login).not.toHaveBeenCalled();
      expect(session).toEqual(mockSession);
    });

    it('should perform login if session is not found and login is needed', async () => {
      vi.mocked(minioStorage.loadSession).mockResolvedValue(null);
      const loginResult = { success: true, sessionId: 'new-session', cookies: [{ name: 'c1' }] };
      vi.mocked(browserMCP.login).mockResolvedValue(loginResult);

      const session = await orchestrator.ensureSession({
        email: 'test@test.com',
        password: 'password',
        loginIfNeeded: true,
      });

      expect(minioStorage.loadSession).not.toHaveBeenCalled();
      expect(browserMCP.login).toHaveBeenCalled();
      expect(minioStorage.saveSession).toHaveBeenCalled();
      expect(session.sessionId).toBe('new-session');
    });

    it('should throw an error if no session can be obtained', async () => {
        vi.mocked(minioStorage.loadSession).mockResolvedValue(null);
        await expect(orchestrator.ensureSession({ loginIfNeeded: false })).rejects.toThrow('No se pudo obtener una sesión válida');
    });
  });

  describe('scrapeWithSession', () => {
    it('should successfully scrape offers on the first attempt', async () => {
        const mockOffers = [{ id: '1', title: 'Offer 1' }];
        vi.mocked(scraperr.scrapeOffers).mockResolvedValue(mockOffers as any);

        const offers = await orchestrator.scrapeWithSession({ scrapeUrl: 'https://example.com' });

        expect(scraperr.scrapeOffers).toHaveBeenCalledTimes(1);
        expect(offers).toEqual(mockOffers);
    });

    it('should retry scraping on failure and then succeed', async () => {
        const mockOffers = [{ id: '2', title: 'Offer 2' }];
        vi.mocked(scraperr.scrapeOffers)
            .mockRejectedValueOnce(new Error('Scrape failed'))
            .mockResolvedValue(mockOffers as any);

        const offers = await orchestrator.scrapeWithSession({ scrapeUrl: 'https://example.com', maxRetries: 1 });

        expect(scraperr.scrapeOffers).toHaveBeenCalledTimes(2);
        expect(offers).toEqual(mockOffers);
    });

    it('should use fallback if all scraping retries fail', async () => {
        const fallbackOffers = [{ id: '3', title: 'Fallback Offer' }];
        vi.mocked(scraperr.scrapeOffers).mockRejectedValue(new Error('Scrape failed'));
        vi.mocked(scraperr.extractWithFallback).mockResolvedValue(fallbackOffers as any);

        const offers = await orchestrator.scrapeWithSession({ scrapeUrl: 'https://example.com', maxRetries: 1 });

        expect(scraperr.scrapeOffers).toHaveBeenCalledTimes(2);
        expect(scraperr.extractWithFallback).toHaveBeenCalledTimes(1);
        expect(offers).toEqual(fallbackOffers);
    });
  });
});
