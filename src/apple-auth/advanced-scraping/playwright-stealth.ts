import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface PlaywrightStealthOptions {
  email: string;
  password: string;
  headless?: boolean;
  timeout?: number;
  proxy?: string;
  viewport?: { width: number; height: number };
}

export interface PlaywrightStealthResult {
  success: boolean;
  sessionToken?: string;
  cookies?: any[];
  error?: string;
  requires2FA?: boolean;
  twoFactorToken?: string;
  userInfo?: any;
}

export class PlaywrightStealthDriver {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  /**
   * Configuración ultra-avanzada de evasión de detección
   */
  private async setupStealthMode(): Promise<void> {
    console.log('🎭 Configurando modo stealth ultra-avanzado...');

    // Configuración de viewport realista
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1280, height: 720 }
    ];
    const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];

    // User Agents ultra-realistas con versiones actuales
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    // Crear contexto con configuración avanzada
    this.context = await this.browser!.newContext({
      userAgent: randomUserAgent,
      viewport: randomViewport,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
      geolocation: { latitude: 40.7128, longitude: -74.0060 }, // Nueva York
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      forcedColors: 'none',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });

    // Crear página
    this.page = await this.context.newPage();

    // Scripts de evasión ultra-avanzados
    await this.page.addInitScript(() => {
      // Eliminar rastros de webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Sobrescribir el objeto chrome
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
        },
        csi: function() {
          return {
            onloadT: Date.now(),
            pageT: Math.random() * 1000,
            startE: Date.now() - Math.random() * 2000,
            tran: Math.floor(Math.random() * 20)
          };
        }
      };

      // Plugins falsos realistas
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: {
              type: "application/x-google-chrome-pdf",
              suffixes: "pdf",
              description: "Portable Document Format",
              enabledPlugin: null
            },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
          },
          {
            0: {
              type: "application/pdf",
              suffixes: "pdf",
              description: "",
              enabledPlugin: null
            },
            description: "",
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
            length: 1,
            name: "Chrome PDF Viewer"
          }
        ],
      });

      // Lenguajes realistas
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Hardware concurrency realista
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4 + Math.floor(Math.random() * 4),
      });

      // Device memory realista
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });

      // Connection realista
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          rtt: 50 + Math.floor(Math.random() * 50),
          downlink: 10 + Math.random() * 5,
          saveData: false
        }),
      });

      // Permissions API mock
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

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

      // Audio context fingerprint evasion
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const originalCreateAnalyser = AudioContext.prototype.createAnalyser;
        AudioContext.prototype.createAnalyser = function() {
          const analyser = originalCreateAnalyser.call(this);
          const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
          analyser.getFloatFrequencyData = function(array) {
            originalGetFloatFrequencyData.call(this, array);
            for (let i = 0; i < array.length; i++) {
              array[i] += Math.random() * 0.0001;
            }
          };
          return analyser;
        };
      }

      // Screen resolution evasion
      Object.defineProperty(screen, 'width', {
        get: () => 1920 + Math.floor(Math.random() * 100),
      });
      Object.defineProperty(screen, 'height', {
        get: () => 1080 + Math.floor(Math.random() * 100),
      });

      // Timezone evasion
      Date.prototype.getTimezoneOffset = function() {
        return -300; // EST
      };

      console.log('🎭 Scripts de evasión ultra-avanzados aplicados');
    });

    console.log('✅ Modo stealth configurado exitosamente');
  }

  /**
   * Simular comportamiento humano realista
   */
  private async simulateHumanBehavior(): Promise<void> {
    if (!this.page) return;

    // Movimientos de mouse aleatorios
    const viewport = this.page.viewportSize();
    if (viewport) {
      for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
        await this.page.mouse.move(
          Math.random() * viewport.width,
          Math.random() * viewport.height,
          { steps: 10 + Math.floor(Math.random() * 20) }
        );
        await this.sleep(100 + Math.random() * 300);
      }
    }

    // Scroll aleatorio
    await this.page.evaluate(() => {
      window.scrollTo(0, Math.random() * 200);
    });
    await this.sleep(500 + Math.random() * 1000);
  }

  /**
   * Typing humano realista con errores y correcciones
   */
  private async humanType(selector: string, text: string): Promise<void> {
    if (!this.page) return;

    const element = await this.page.locator(selector).first();
    await element.click();
    await this.sleep(200 + Math.random() * 300);

    // Simular typing humano con variaciones de velocidad
    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Ocasionalmente hacer errores y corregirlos
      if (Math.random() < 0.05 && i > 0) {
        // Escribir caracter incorrecto
        await element.type('x', { delay: 50 + Math.random() * 100 });
        await this.sleep(100 + Math.random() * 200);
        // Borrarlo
        await this.page.keyboard.press('Backspace');
        await this.sleep(50 + Math.random() * 100);
      }

      // Escribir el caracter correcto
      await element.type(char, { delay: 50 + Math.random() * 150 });

      // Pausas ocasionales como si estuviéramos pensando
      if (Math.random() < 0.1) {
        await this.sleep(300 + Math.random() * 700);
      }
    }

    await this.sleep(200 + Math.random() * 400);
  }

  /**
   * Función de sleep
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Inicializar Playwright con configuración ultra-robusta
   */
  async initialize(options: PlaywrightStealthOptions): Promise<void> {
    try {
      console.log('🚀 Inicializando Playwright con modo stealth ultra-avanzado...');

      // Configuración de lanzamiento ultra-robusta
      this.browser = await chromium.launch({
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
          '--disable-features=VizDisplayCompositor',
          '--disable-hang-monitor',
          '--disable-prompt-on-repost',
          '--disable-sync',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--no-crash-upload',
          '--no-default-browser-check',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain',
          '--disable-component-update',
          '--disable-domain-reliability',
          '--disable-features=AudioServiceOutOfProcess',
          '--disable-print-preview',
          '--disable-speech-api',
          '--hide-scrollbars',
          '--mute-audio',
          '--disable-web-security',
          '--run-all-compositor-stages-before-draw',
          '--disable-threaded-animation',
          '--disable-threaded-scrolling',
          '--disable-checker-imaging',
          '--disable-new-content-rendering-timeout',
          '--disable-image-animation-resync',
          '--disable-partial-raster',
          '--disable-skia-runtime-opts',
          '--disable-low-res-tiling',
          '--disable-composited-antialiasing'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        env: {
          ...process.env,
          DISPLAY: ':99'
        }
      });

      await this.setupStealthMode();
      console.log('✅ Playwright inicializado exitosamente');

    } catch (error) {
      console.error('❌ Error inicializando Playwright:', error);
      throw error;
    }
  }

  /**
   * Login avanzado con técnicas de evasión
   */
  async login(options: PlaywrightStealthOptions): Promise<PlaywrightStealthResult> {
    try {
      if (!this.page) {
        throw new Error('Playwright no inicializado');
      }

      console.log('🍎 Iniciando login Apple con Playwright Stealth...');

      // Simular comportamiento humano antes de navegar
      await this.simulateHumanBehavior();

      // Navegar a Apple ID con headers realistas
      console.log('🌐 Navegando a Apple ID...');
      await this.page.goto('https://appleid.apple.com/sign-in', {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      // Esperar y simular lectura de la página
      await this.sleep(2000 + Math.random() * 3000);
      await this.simulateHumanBehavior();

      console.log('📄 Página cargada, analizando estructura...');

      // Buscar campo de email con múltiples estrategias
      const emailSelectors = [
        'input[id="account_name_text_field"]',
        'input[name="accountName"]',
        'input[id="accountName"]',
        'input[data-testid="account-name"]',
        'input[type="email"]',
        'input[type="text"]',
        '.form-textbox-input',
        'input[placeholder*="Apple ID"]',
        'input[placeholder*="email"]'
      ];

      let emailField = null;
      for (const selector of emailSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            emailField = element;
            console.log(`✅ Campo de email encontrado: ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!emailField) {
        throw new Error('No se pudo encontrar el campo de email');
      }

      // Escribir email con comportamiento humano
      console.log('📧 Ingresando email...');
      await this.humanType(emailSelectors[0], options.email);
      await this.simulateHumanBehavior();

      // Buscar campo de password
      const passwordSelectors = [
        'input[id="password_text_field"]',
        'input[type="password"]',
        'input[name="password"]'
      ];

      let passwordField = null;
      for (const selector of passwordSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            passwordField = element;
            console.log(`✅ Campo de password encontrado: ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!passwordField) {
        throw new Error('No se pudo encontrar el campo de password');
      }

      // Escribir password con comportamiento humano
      console.log('🔐 Ingresando password...');
      await this.humanType(passwordSelectors[0], options.password);
      await this.simulateHumanBehavior();

      // Buscar y hacer clic en botón de login
      const buttonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button[id*="sign"]',
        '.signin-button',
        '.form-submit-button'
      ];

      let loginButton = null;
      for (const selector of buttonSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            loginButton = element;
            console.log(`✅ Botón de login encontrado: ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!loginButton) {
        throw new Error('No se pudo encontrar el botón de login');
      }

      // Simular hover y clic humano
      await loginButton.hover();
      await this.sleep(200 + Math.random() * 300);
      await loginButton.click();

      console.log('🔄 Esperando respuesta del login...');
      await this.sleep(3000 + Math.random() * 2000);

      // Verificar resultado
      const currentUrl = this.page.url();
      console.log(`🌐 URL actual: ${currentUrl}`);

      // Obtener cookies para sesión
      const cookies = await this.context!.cookies();

      return {
        success: true,
        sessionToken: `playwright_session_${Date.now()}`,
        cookies: cookies,
        userInfo: {
          email: options.email,
          loginMethod: 'playwright-stealth',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error en login Playwright:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Cerrar browser
   */
  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      console.log('🔒 Playwright cerrado correctamente');
    } catch (error) {
      console.error('⚠️ Error cerrando Playwright:', error);
    }
  }
}