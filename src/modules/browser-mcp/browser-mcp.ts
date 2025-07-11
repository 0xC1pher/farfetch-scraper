import { v4 as uuidv4 } from 'uuid';
import puppeteer, { Browser, Page, LaunchOptions } from 'puppeteer';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { BrowserMCPConfig } from './config';
import { MODULE_PATHS } from '../../config/modules';

// Enhanced Page interface with additional methods
interface EnhancedPage extends Page {
  setUserAgent(userAgent: string): Promise<void>;
  setViewport(viewport: ViewportConfig): Promise<void>;
}

// Viewport configuration interface
interface ViewportConfig {
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  isLandscape?: boolean;
}

// Fingerprint type definition
type Fingerprint = {
  userAgent: string;
  platform: string;
  viewport: ViewportConfig;
  timezone: string;
  locale: string;
  languages: string[];
  webglVendor: string;
  webglRenderer: string;
  canvas: string;
  audioContext: number;
  lastRotation: Date;
  level: string;
};

// Session state type
type SessionState = {
  sessionId: string;
  cookies?: any;
  userId?: string;
  status: 'pending' | '2fa_required' | 'active' | 'error';
  error?: string;
  fingerprint?: Fingerprint;
  browser?: Browser;
  page?: EnhancedPage;
};

// Session store
const sessionStore: Record<string, SessionState> = {};

/**
 * Generate a random browser fingerprint
 */
function generateFingerprint(level: keyof typeof BrowserMCPConfig.fingerprinting.levels = 'medium'): Fingerprint {
  const levelValue = BrowserMCPConfig.fingerprinting.levels[level];
  const now = new Date();
  
  // Default fingerprint in case of errors
  const defaultFingerprint: Fingerprint = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    platform: 'Win32',
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: true
    },
    timezone: 'America/New_York',
    locale: 'en-US',
    languages: ['en-US', 'en'],
    webglVendor: 'Google Inc.',
    webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    canvas: 'canvas-wp8-1',
    audioContext: 12345,
    lastRotation: now,
    level: level
  };

  try {
    // Select a random user agent
    const userAgents = BrowserMCPConfig.fingerprinting.userAgents[level];
    if (!userAgents || userAgents.length === 0) {
      console.warn('No user agents found for level, using default');
      return defaultFingerprint;
    }
    
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // Configure viewport based on level
    const viewport: ViewportConfig = {
      width: levelValue.minWidth + Math.floor(Math.random() * (levelValue.maxWidth - levelValue.minWidth + 1)),
      height: levelValue.minHeight + Math.floor(Math.random() * (levelValue.maxHeight - levelValue.minHeight + 1)),
      deviceScaleFactor: levelValue.deviceScaleFactor,
      isMobile: levelValue.isMobile,
      hasTouch: levelValue.hasTouch,
      isLandscape: Math.random() > 0.5
    };
    
    // Generate other fingerprint properties
    const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];
    const locales = ['en-US', 'es-ES', 'fr-FR', 'de-DE'];
    const languagesList = ['en-US', 'en', 'es-ES', 'es', 'fr', 'de'];
    
    return {
      userAgent,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      viewport,
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      locale: locales[Math.floor(Math.random() * locales.length)],
      languages: [languagesList[Math.floor(Math.random() * languagesList.length)]],
      webglVendor: Math.random() > 0.5 ? 'Google Inc.' : 'Intel Inc.',
      webglRenderer: Math.random() > 0.5 
        ? 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)' 
        : 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
      canvas: 'canvas-wp8-1',
      audioContext: Math.random(),
      lastRotation: now,
      level
    };
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    return defaultFingerprint;
  }
}

export class BrowserMCP {
  private proxyConfig: string | null = null;
  private proxyAuth: { username: string; password: string } | null = null;

  private extractUserIdFromCookies(cookies: any[]): string {
    // Implementación básica - ajustar según sea necesario
    const userIdCookie = cookies.find(cookie => cookie.name === 'user_id' || cookie.name.endsWith('_user_id'));
    return userIdCookie ? userIdCookie.value : 'unknown-user-id';
  }

  constructor(proxyConfig?: string) {
    if (proxyConfig) {
      this.setProxy(proxyConfig);
    }
  }

  /**
   * Set proxy configuration
   */
  async setProxy(proxy: string): Promise<boolean> {
    try {
      // Parse proxy string (format: http://username:password@host:port)
      const proxyMatch = proxy.match(/^(?:([^:@/]+)(?::([^@/]+))?@)?([^:@/]+)(?::(\d+))?$/);
      
      if (!proxyMatch) {
        throw new Error('Invalid proxy format. Expected format: [username:password@]host[:port]');
      }
      
      const [, username, password, host, port = '80'] = proxyMatch;
      
      this.proxyConfig = `${host}:${port}`;
      
      if (username && password) {
        this.proxyAuth = { username, password };
      }
      
      return true;
    } catch (error) {
      console.error('Error setting proxy:', error);
      return false;
    }
  }

  /**
   * Login to the target website
   */
  async login(
    email: string, 
    password: string, 
    sessionId: string = uuidv4()
  ): Promise<{ sessionId: string; status: string; message?: string; cookies?: any; userId?: string }> {
    // Asegurarse de que sessionId siempre esté definido
    const finalSessionId = sessionId || uuidv4();
    let browser: Browser | null = null;
    
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Verificar si ya existe una sesión con este ID
      if (sessionStore[finalSessionId]) {
        throw new Error('Ya existe una sesión con este ID');
      }

      // Configure browser launch options
      const launchOptions: LaunchOptions = {
        headless: false, // Set to true for production
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      };

      // Add proxy configuration if available
      if (this.proxyConfig) {
        launchOptions.args = launchOptions.args || [];
        launchOptions.args.push(`--proxy-server=${this.proxyConfig}`);
      }

      // Launch browser with fingerprint configuration
      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      const enhancedPage = page as unknown as EnhancedPage;
      
      // Generate and apply initial fingerprint
      const fingerprint = generateFingerprint('medium');
      await enhancedPage.setUserAgent(fingerprint.userAgent);
      await enhancedPage.setViewport(fingerprint.viewport);
      
      // Navigate to login page
      try {
        await enhancedPage.goto('https://www.farfetch.com/login', { 
          waitUntil: 'networkidle2',
          timeout: 30000 // 30 second timeout
        });
      } catch (error) {
        throw new Error(`Failed to load login page: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Fill out login form
      try {
        await enhancedPage.waitForSelector('input[type="email"]', { timeout: 10000 });
        await enhancedPage.type('input[type="email"]', email, { delay: 50 });
        await enhancedPage.type('input[type="password"]', password, { delay: 50 });
        
        // Click login button
        await enhancedPage.click('button[type="submit"]');
      } catch (error) {
        throw new Error(`Error filling out login form: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Wait for login response or redirect
      try {
        await enhancedPage.waitForNavigation({ 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        });
      } catch (error) {
        console.warn('Timeout waiting for navigation after login:', error);
        
        // Check if we're on the 2FA page
        const is2FAPage = await enhancedPage.$('input[data-testid="twoFactorAuthInput"]') !== null;
        if (is2FAPage) {
          // Save session state for 2FA
          sessionStore[finalSessionId] = {
            sessionId: finalSessionId,
            status: '2fa_required',
            browser,
            page: enhancedPage,
            fingerprint
          };
          
          return { 
            status: '2fa_required', 
            sessionId: finalSessionId, 
            message: 'Two-factor authentication required' 
          };
        }
        
        throw new Error('Error during login process');
      }
      
      // If we get here, login was successful
      try {
        const cookies = await page.cookies();
        const userId = this.extractUserIdFromCookies(cookies);
        
        // Save session
        sessionStore[finalSessionId] = {
          sessionId: finalSessionId,
          status: 'active',
          userId,
          cookies,
          fingerprint,
          browser,
          page: enhancedPage
        };
        
        return { 
          status: 'success', 
          sessionId: finalSessionId, 
          message: 'Login successful', 
          cookies, 
          userId 
        };
      } catch (error) {
        throw new Error(`Error getting cookies: ${error instanceof Error ? error.message : String(error)}`);
      }
      
    } catch (error) {
      // Clean up resources on error
      if (browser) {
        try {
          await browser.close();
        } catch (browserError) {
          console.error('Error closing browser:', browserError);
        }
      }
      
      // Remove session if it was created
      if (finalSessionId && sessionStore[finalSessionId]) {
        delete sessionStore[finalSessionId];
      }
      
      // Re-throw the error for the caller to handle
      throw error;
    }
  }

  /**
   * Submit 2FA code
   */
  async submit2FA(sessionId: string, code: string): Promise<{ status: string; cookies?: any; userId?: string; message?: string }> {
    if (!sessionId) {
      throw new Error('Se requiere un ID de sesión válido');
    }
    const session = sessionStore[sessionId];
    
    if (!session || session.status !== '2fa_required' || !session.page) {
      throw new Error('No active 2FA session found');
    }
    
    try {
      const { page } = session;
      if (!page) {
        throw new Error('No hay una página activa en la sesión');
      }
      
      // Enter 2FA code
      await page.type('input[data-testid="twoFactorAuthInput"]', code, { delay: 50 });
      
      // Submit the form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        page.click('button[type="submit"]')
      ]);
      
      // Get cookies and update session
      const cookies = await page.cookies();
      const userId = this.extractUserIdFromCookies(cookies);
      
      sessionStore[sessionId] = {
        ...session,
        status: 'active',
        cookies,
        userId
      };
      
      return { 
        status: 'success',
        cookies,
        userId,
        message: '2FA verification successful'
      };
      
    } catch (error) {
      throw new Error(`2FA verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export session data
   */
  async exportSession(sessionId: string): Promise<{ cookies: any; userId: string; fingerprint: Fingerprint } | null> {
    const session = sessionStore[sessionId];
    
    if (!session || session.status !== 'active' || !session.cookies || !session.userId || !session.fingerprint) {
      return null;
    }
    
    return {
      cookies: session.cookies,
      userId: session.userId,
      fingerprint: session.fingerprint
    };
  }

  /**
   * Rotate fingerprint for a session
   */
  async rotateFingerprint(sessionId: string, level: keyof typeof BrowserMCPConfig.fingerprinting.levels = 'medium'): Promise<Fingerprint> {
    const session = sessionStore[sessionId];
    
    if (!session || !session.page) {
      throw new Error('No active session or page found');
    }
    
    try {
      const newFingerprint = generateFingerprint(level);
      const enhancedPage = session.page as unknown as EnhancedPage;
      
      // Apply new fingerprint
      await enhancedPage.setUserAgent(newFingerprint.userAgent);
      await enhancedPage.setViewport(newFingerprint.viewport);
      
      // Update session with new fingerprint
      session.fingerprint = newFingerprint;
      
      return newFingerprint;
      
    } catch (error) {
      console.error('Error rotating fingerprint:', error);
      return null;
    }
  }

  /**
   * Close a session and clean up resources
   */
  async closeSession(sessionId: string): Promise<boolean> {
    const session = sessionStore[sessionId];
    
    if (!session) {
      return false;
    }
    
    try {
      // Close browser if it's open
      if (sessionStore[sessionId]?.browser) {
        await sessionStore[sessionId].browser?.close().catch(console.error);
      }
      delete sessionStore[sessionId];
      
      return true;
      
    } catch (error) {
      console.error('Error closing session:', error);
      return false;
    }
  }
}

// Export a default instance for convenience
export const browserMCP = new BrowserMCP();

export default BrowserMCP;
