import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Configurar plugins de stealth
puppeteer.use(StealthPlugin());

export interface PuppeteerStealthOptions {
  email: string;
  password: string;
  headless?: boolean;
  timeout?: number;
  proxy?: string;
}

export interface PuppeteerStealthResult {
  success: boolean;
  sessionToken?: string;
  cookies?: any[];
  error?: string;
  requires2FA?: boolean;
  userInfo?: any;
}

export class PuppeteerStealthDriver {
  private browser: any = null;
  private page: any = null;

  /**
   * Configuración ultra-avanzada de evasión
   */
  private async setupAdvancedEvasion(): Promise<void> {
    if (!this.page) return;

    console.log('🎭 Configurando evasión ultra-avanzada con Puppeteer...');

    // Configurar viewport realista
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 }
    ];
    const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];
    await this.page.setViewport(randomViewport);

    // User agents ultra-realistas
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await this.page.setUserAgent(randomUserAgent);

    // Headers extra realistas
    await this.page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    });

    // Scripts de evasión ultra-avanzados
    await this.page.evaluateOnNewDocument(() => {
      // Eliminar rastros de webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Sobrescribir chrome object
      (window as any).chrome = {
        runtime: {},
        loadTimes: function() {
          return {
            commitLoadTime: Date.now() - Math.random() * 1000,
            finishDocumentLoadTime: Date.now() - Math.random() * 500,
            finishLoadTime: Date.now() - Math.random() * 200,
            firstPaintAfterLoadTime: Date.now() - Math.random() * 100,
            firstPaintTime: Date.now() - Math.random() * 50,
            navigationType: 'Other',
            npnNegotiatedProtocol: 'h2',
            requestTime: Date.now() - Math.random() * 2000,
            startLoadTime: Date.now() - Math.random() * 1500,
            wasAlternateProtocolAvailable: false,
            wasFetchedViaSpdy: true,
            wasNpnNegotiated: true
          };
        }
      };

      // Plugins falsos
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: {
              type: "application/x-google-chrome-pdf",
              suffixes: "pdf",
              description: "Portable Document Format"
            },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
          }
        ],
      });

      // Languages realistas
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Hardware concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4 + Math.floor(Math.random() * 4),
      });

      // Device memory
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });

      // WebGL fingerprint evasion
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel(R) Iris(TM) Graphics 6100';
        }
        return getParameter(parameter);
      };

      // Canvas fingerprint evasion
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(...args) {
        const context = this.getContext('2d');
        if (context) {
          const imageData = context.getImageData(0, 0, this.width, this.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] += Math.floor(Math.random() * 3) - 1;
            imageData.data[i + 1] += Math.floor(Math.random() * 3) - 1;
            imageData.data[i + 2] += Math.floor(Math.random() * 3) - 1;
          }
          context.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.apply(this, args);
      };

      // Timezone evasion
      Date.prototype.getTimezoneOffset = function() {
        return -300; // EST
      };

      console.log('🎭 Scripts de evasión Puppeteer aplicados');
    });

    console.log('✅ Evasión ultra-avanzada configurada');
  }

  /**
   * Simular comportamiento humano
   */
  private async simulateHuman(): Promise<void> {
    if (!this.page) return;

    // Movimientos de mouse aleatorios
    const viewport = await this.page.viewport();
    for (let i = 0; i < 3; i++) {
      await this.page.mouse.move(
        Math.random() * viewport.width,
        Math.random() * viewport.height
      );
      await this.sleep(100 + Math.random() * 200);
    }

    // Scroll aleatorio
    await this.page.evaluate(() => {
      window.scrollTo(0, Math.random() * 200);
    });
    await this.sleep(500 + Math.random() * 1000);
  }

  /**
   * Typing humano con errores
   */
  private async humanType(selector: string, text: string): Promise<void> {
    if (!this.page) return;

    await this.page.click(selector);
    await this.sleep(200 + Math.random() * 300);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Ocasionalmente hacer errores
      if (Math.random() < 0.05 && i > 0) {
        await this.page.type(selector, 'x', { delay: 50 + Math.random() * 100 });
        await this.sleep(100);
        await this.page.keyboard.press('Backspace');
        await this.sleep(50);
      }

      await this.page.type(selector, char, { delay: 50 + Math.random() * 150 });
      
      if (Math.random() < 0.1) {
        await this.sleep(300 + Math.random() * 700);
      }
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Inicializar Puppeteer
   */
  async initialize(options: PuppeteerStealthOptions): Promise<void> {
    try {
      console.log('🚀 Inicializando Puppeteer Stealth...');

      this.browser = await puppeteer.launch({
        headless: options.headless !== false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-blink-features=AutomationControlled',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-hang-monitor',
          '--disable-prompt-on-repost',
          '--disable-sync',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--no-crash-upload',
          '--no-default-browser-check',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        defaultViewport: null
      });

      this.page = await this.browser.newPage();
      await this.setupAdvancedEvasion();
      
      console.log('✅ Puppeteer Stealth inicializado');

    } catch (error) {
      console.error('❌ Error inicializando Puppeteer:', error);
      throw error;
    }
  }

  /**
   * Login con Puppeteer Stealth
   */
  async login(options: PuppeteerStealthOptions): Promise<PuppeteerStealthResult> {
    try {
      if (!this.page) {
        throw new Error('Puppeteer no inicializado');
      }

      console.log('🍎 Login Apple con Puppeteer Stealth...');

      await this.simulateHuman();

      console.log('🌐 Navegando a Apple ID...');
      await this.page.goto('https://appleid.apple.com/sign-in', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await this.sleep(2000 + Math.random() * 3000);
      await this.simulateHuman();

      // Buscar campos con múltiples selectores
      const emailSelectors = [
        'input[id="account_name_text_field"]',
        'input[name="accountName"]',
        'input[type="email"]',
        'input[type="text"]'
      ];

      let emailSelector = null;
      for (const selector of emailSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          emailSelector = selector;
          console.log(`✅ Campo email: ${selector}`);
          break;
        } catch (error) {
          continue;
        }
      }

      if (!emailSelector) {
        throw new Error('Campo de email no encontrado');
      }

      console.log('📧 Ingresando email...');
      await this.humanType(emailSelector, options.email);
      await this.simulateHuman();

      const passwordSelectors = [
        'input[id="password_text_field"]',
        'input[type="password"]'
      ];

      let passwordSelector = null;
      for (const selector of passwordSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          passwordSelector = selector;
          console.log(`✅ Campo password: ${selector}`);
          break;
        } catch (error) {
          continue;
        }
      }

      if (!passwordSelector) {
        throw new Error('Campo de password no encontrado');
      }

      console.log('🔐 Ingresando password...');
      await this.humanType(passwordSelector, options.password);
      await this.simulateHuman();

      const buttonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        '.signin-button'
      ];

      let buttonSelector = null;
      for (const selector of buttonSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          buttonSelector = selector;
          console.log(`✅ Botón login: ${selector}`);
          break;
        } catch (error) {
          continue;
        }
      }

      if (!buttonSelector) {
        throw new Error('Botón de login no encontrado');
      }

      await this.page.hover(buttonSelector);
      await this.sleep(200);
      await this.page.click(buttonSelector);

      console.log('🔄 Esperando respuesta...');
      await this.sleep(3000 + Math.random() * 2000);

      const cookies = await this.page.cookies();
      
      return {
        success: true,
        sessionToken: `puppeteer_session_${Date.now()}`,
        cookies: cookies,
        userInfo: {
          email: options.email,
          loginMethod: 'puppeteer-stealth',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error Puppeteer login:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      console.log('🔒 Puppeteer cerrado');
    } catch (error) {
      console.error('⚠️ Error cerrando Puppeteer:', error);
    }
  }
}
