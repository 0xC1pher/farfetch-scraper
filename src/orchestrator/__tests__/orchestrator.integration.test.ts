import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Orchestrator } from '../orchestrator';
import { existsSync } from 'fs';
import { MinioStorage } from '../../modules/minio/index';

// Mock the lowest-level dependencies: fs
vi.mock('fs');

// Mock the Minio client, as we don't want to connect to a real server
vi.mock('minio', () => {
    const mockMinioClient = {
      bucketExists: vi.fn().mockResolvedValue(true),
      makeBucket: vi.fn(),
      putObject: vi.fn(),
      getObject: vi.fn(),
    };
    return { Client: vi.fn(() => mockMinioClient) };
});

// Mock the browser-mcp module to simulate availability
vi.mock('../../modules/browser-mcp/index', () => {
    const mockBrowserMCP = {
        login: vi.fn(),
        getStatus: vi.fn().mockResolvedValue({ available: true, version: '1.0.0' }),
        submit2FA: vi.fn(),
        exportSession: vi.fn(),
        rotateFingerprint: vi.fn(),
        setProxy: vi.fn(),
        closeSession: vi.fn()
    };
    return { browserMCP: mockBrowserMCP };
});

// Mock the scraperr module to simulate availability
vi.mock('../../modules/scraperr/index', () => {
    const mockScraperr = {
        scrapeOffers: vi.fn(),
        getStatus: vi.fn().mockResolvedValue({ available: true, version: '1.0.0' }),
        getStatsAsync: vi.fn().mockResolvedValue({ totalScrapes: 0, successRate: 100 }),
        setSessionCookies: vi.fn(),
        clearSession: vi.fn()
    };
    return { scraperr: mockScraperr };
});


describe('Orchestrator Integration Test', () => {
    let orchestrator: Orchestrator;
    let mockBrowserMCP: any;
    let mockScraperr: any;

    beforeEach(async () => {
        // Mock existsSync to simulate all modules are available
        vi.mocked(existsSync).mockReturnValue(true);

        // Get the mocked modules
        const { browserMCP } = await import('../../modules/browser-mcp/index');
        const { scraperr } = await import('../../modules/scraperr/index');
        mockBrowserMCP = browserMCP;
        mockScraperr = scraperr;

        // Instantiate the real orchestrator
        orchestrator = new Orchestrator();

        // Mock MinioStorage methods used by the orchestrator
        vi.spyOn(MinioStorage.prototype, 'loadSession').mockResolvedValue(null);
        vi.spyOn(MinioStorage.prototype, 'saveSession').mockResolvedValue();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully scrape multiple items in a realistic flow', async () => {
        // 1. Mock the login process (BrowserMCP)
        const loginResult = {
            success: true,
            sessionId: 'real-session-id',
            cookies: [{ name: 'a', value: 'b' }]
        };

        // Mock the browser MCP login method
        vi.mocked(mockBrowserMCP.login).mockResolvedValue(loginResult);

        const session = await orchestrator.ensureSession({
            email: 'test@example.com',
            password: 'password',
            loginIfNeeded: true,
        });
        expect(session.sessionId).toBe('real-session-id');

        // 2. Mock the scraping process (Scraperr) to return multiple items
        const scrapedOffers = Array.from({ length: 25 }, (_, i) => ({
            id: `product-${i + 1}`,
            title: `Product ${i + 1}`,
            brand: 'Brand Name',
            price: 100 + i * 5,
            imageUrl: '',
            productUrl: '',
            availability: true,
            timestamp: new Date()
        }));

        // Mock the scraperr scrapeOffers method
        vi.mocked(mockScraperr.scrapeOffers).mockResolvedValue(scrapedOffers);

        const offers = await orchestrator.scrapeWithSession({
            sessionId: session.sessionId,
            scrapeUrl: 'https://www.farfetch.com/shopping/men/shoes-2/items.aspx'
        });

        // 3. Assert the results
        expect(offers).toHaveLength(25);
        expect(offers[0].title).toBe('Product 1');
        expect(offers[24].title).toBe('Product 25');
        console.log(`Integration test passed: Successfully scraped ${offers.length} items.`);
    });
});
