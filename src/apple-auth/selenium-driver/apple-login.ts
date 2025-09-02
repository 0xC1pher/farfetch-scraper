import { Builder, By, WebDriver, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { SessionStorage } from '../storage/session-storage';

export interface AppleLoginOptions {
  email: string;
  password: string;
  proxy?: string;
  headless?: boolean;
  timeout?: number;
}

export interface AppleLoginResult {
  success: boolean;
  sessionId?: string;
  cookies?: any[];
  error?: string;
  requires2FA?: boolean;
  twoFactorToken?: string;
}

export class AppleSeleniumDriver {
  private driver: WebDriver | null = null;
  private sessionStorage: SessionStorage;
  private isInitialized = false;
  private retryCount = 0;
  private maxRetries = 5;

  constructor() {
    this.sessionStorage = new SessionStorage();
  }

  /**
   * Función auxiliar para reintentar operaciones con backoff exponencial
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🔄 ${operationName} - Intento ${attempt + 1}/${maxRetries}`);
        const result = await operation();
        console.log(`✅ ${operationName} - Éxito en intento ${attempt + 1}`);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`⚠️ ${operationName} - Intento ${attempt + 1} falló: ${errorMessage}`);

        if (attempt === maxRetries - 1) {
          console.log(`❌ ${operationName} - Todos los intentos fallaron`);
          throw error;
        }

        // Backoff exponencial: 1s, 2s, 4s, 8s...
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
        await this.sleep(delay);
      }
    }

    throw new Error(`${operationName} falló después de ${maxRetries} intentos`);
  }

  /**
   * Función auxiliar para esperar
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verificar si el driver está activo y funcional
   */
  private async isDriverActive(): Promise<boolean> {
    try {
      if (!this.driver) return false;
      await this.driver.getTitle();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reinicializar el driver si es necesario
   */
  private async ensureDriverActive(options: AppleLoginOptions): Promise<void> {
    const isActive = await this.isDriverActive();
    if (!isActive) {
      console.log('🔄 Driver no activo, reinicializando...');
      await this.close();
      this.isInitialized = false;
      await this.initialize(options);
    }
  }

  /**
   * Inicializar el driver de Chrome
   */
  async initialize(options: AppleLoginOptions): Promise<void> {
    if (this.isInitialized && this.driver) {
      return;
    }

    try {
      const chromeOptions = new ChromeOptions();
      
      // Configuración básica para Linux/Chromium - ULTRA ROBUSTA
      chromeOptions.addArguments('--no-sandbox');
      chromeOptions.addArguments('--disable-dev-shm-usage');
      chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
      chromeOptions.addArguments('--disable-extensions');
      chromeOptions.addArguments('--no-first-run');
      chromeOptions.addArguments('--disable-default-apps');
      chromeOptions.addArguments('--disable-background-timer-throttling');
      chromeOptions.addArguments('--disable-backgrounding-occluded-windows');
      chromeOptions.addArguments('--disable-renderer-backgrounding');
      chromeOptions.addArguments('--disable-features=TranslateUI');
      chromeOptions.addArguments('--disable-ipc-flooding-protection');

      // Configuraciones adicionales para estabilidad extrema
      chromeOptions.addArguments('--disable-crash-reporter');
      chromeOptions.addArguments('--disable-in-process-stack-traces');
      chromeOptions.addArguments('--disable-logging');
      chromeOptions.addArguments('--disable-dev-tools');
      chromeOptions.addArguments('--disable-plugins');
      chromeOptions.addArguments('--disable-plugins-discovery');
      chromeOptions.addArguments('--disable-preconnect');
      chromeOptions.addArguments('--disable-translate');
      chromeOptions.addArguments('--disable-sync');
      chromeOptions.addArguments('--disable-background-networking');

      // Configuración específica para sistemas Linux
      chromeOptions.addArguments('--disable-setuid-sandbox');
      chromeOptions.addArguments('--no-zygote');
      chromeOptions.addArguments('--disable-gpu-sandbox');
      chromeOptions.addArguments('--disable-software-rasterizer');
      chromeOptions.addArguments('--disable-background-timer-throttling');
      chromeOptions.addArguments('--disable-backgrounding-occluded-windows');
      chromeOptions.addArguments('--disable-renderer-backgrounding');
      chromeOptions.addArguments('--disable-field-trial-config');
      chromeOptions.addArguments('--disable-hang-monitor');
      chromeOptions.addArguments('--disable-prompt-on-repost');
      chromeOptions.addArguments('--disable-sync');
      chromeOptions.addArguments('--force-color-profile=srgb');
      chromeOptions.addArguments('--metrics-recording-only');
      chromeOptions.addArguments('--no-first-run');
      chromeOptions.addArguments('--enable-automation');
      chromeOptions.addArguments('--password-store=basic');
      chromeOptions.addArguments('--use-mock-keychain');

      // Lista de User Agents para rotación
      const userAgents = [
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
      ];

      // Seleccionar User Agent aleatorio
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      chromeOptions.addArguments(`--user-agent=${randomUserAgent}`);

      // Especificar la ruta de Chromium si está disponible
      const chromiumPath = '/usr/bin/chromium';
      try {
        const fs = require('fs');
        if (fs.existsSync(chromiumPath)) {
          chromeOptions.setChromeBinaryPath(chromiumPath);
          console.log('🔧 Usando Chromium desde:', chromiumPath);
        }
      } catch (error) {
        console.log('⚠️ No se pudo verificar la ruta de Chromium, usando configuración por defecto');
      }
      
      // Configuración de ventana - SIEMPRE headless para estabilidad
      chromeOptions.addArguments('--headless=new');
      chromeOptions.addArguments('--disable-gpu');
      chromeOptions.addArguments('--window-size=1920,1080');
      chromeOptions.addArguments('--virtual-time-budget=5000');

      console.log('🔧 Configurando Chrome en modo headless para estabilidad');
      
      // Configurar proxy si se proporciona
      if (options.proxy) {
        chromeOptions.addArguments(`--proxy-server=${options.proxy}`);
        console.log('🌐 Proxy configurado:', options.proxy);
      }

      // Configuraciones anti-detección y estabilidad
      chromeOptions.excludeSwitches('enable-automation');
      chromeOptions.addArguments('--disable-web-security');
      chromeOptions.addArguments('--allow-running-insecure-content');
      chromeOptions.addArguments('--disable-features=VizDisplayCompositor');
      chromeOptions.addArguments('--disable-logging');
      chromeOptions.addArguments('--disable-gpu-logging');
      chromeOptions.addArguments('--silent');
      chromeOptions.addArguments('--log-level=3');

      // Configuración de timeouts más largos
      chromeOptions.addArguments('--timeout=60000');
      chromeOptions.addArguments('--page-load-strategy=normal');
      
      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

      // Configurar timeouts
      await this.driver.manage().setTimeouts({
        implicit: options.timeout || 30000,
        pageLoad: options.timeout || 30000,
        script: options.timeout || 30000
      });

      this.isInitialized = true;
      console.log('✅ Selenium Chrome Driver inicializado para Apple Auth');
    } catch (error) {
      console.error('❌ Error inicializando Selenium Driver:', error);
      throw new Error(`Failed to initialize Chrome driver: ${error}`);
    }
  }

  /**
   * Realizar login en Apple con máxima robustez
   */
  async login(options: AppleLoginOptions): Promise<AppleLoginResult> {
    this.retryCount++;

    try {
      console.log(`🍎 Iniciando login en Apple ID (Intento ${this.retryCount}/${this.maxRetries})...`);

      // Inicializar con reintentos
      await this.retryWithBackoff(
        () => this.initialize(options),
        'Inicialización del driver',
        3,
        2000
      );

      if (!this.driver) {
        throw new Error('Driver not initialized after retries');
      }

      // Navegar a Apple ID con reintentos robustos
      await this.retryWithBackoff(
        async () => {
          await this.ensureDriverActive(options);

          console.log('🌐 Navegando a Apple ID...');
          await this.driver!.get('https://appleid.apple.com/sign-in');

          // Verificar múltiples condiciones de carga exitosa
          const verificationPromises = [
            // Intentar esperar por título
            this.driver!.wait(until.titleContains('Apple'), 15000).catch(() => null),
            // Intentar esperar por body
            this.driver!.wait(until.elementLocated(By.css('body')), 10000).catch(() => null),
            // Intentar esperar por cualquier input
            this.driver!.wait(until.elementLocated(By.css('input')), 8000).catch(() => null)
          ];

          // Esperar a que al menos una verificación sea exitosa
          const results = await Promise.allSettled(verificationPromises);
          const hasSuccess = results.some(result => result.status === 'fulfilled' && result.value !== null);

          if (!hasSuccess) {
            throw new Error('Página no cargó correctamente - ninguna verificación exitosa');
          }

          // Esperar estabilización
          await this.sleep(3000);

          // Verificar URL final
          const currentUrl = await this.driver!.getCurrentUrl();
          const title = await this.driver!.getTitle();

          console.log(`🌐 URL actual: ${currentUrl}`);
          console.log(`📄 Título actual: ${title}`);

          if (!currentUrl.includes('apple') && !title.toLowerCase().includes('apple')) {
            throw new Error(`URL/título no parece ser de Apple: ${currentUrl} / ${title}`);
          }

          console.log('✅ Navegación a Apple ID exitosa');
        },
        'Navegación a Apple ID',
        5,
        3000
      );

      // Buscar y llenar email con reintentos robustos
      const emailField = await this.retryWithBackoff(
        async () => {
          await this.ensureDriverActive(options);

          console.log('🔍 Buscando campo de email...');

          const emailSelectors = [
            // Selectores específicos de Apple ID más actualizados
            'input[id="account_name_text_field"]',
            'input[name="accountName"]',
            'input[id="accountName"]',
            'input[data-testid="account-name"]',
            'input[data-testid="username"]',
            'input[data-testid="email"]',
            'input[aria-label*="Apple ID"]',
            'input[aria-label*="email"]',
            'input[aria-label*="username"]',
            'input[placeholder*="Apple ID"]',
            'input[placeholder*="email"]',
            'input[placeholder*="username"]',
            // Selectores por tipo
            'input[type="email"]',
            'input[type="text"]',
            // Selectores por clase CSS
            '.form-textbox-input',
            'input.form-textbox-input',
            '.signin-form input[type="text"]',
            '.signin-form input[type="email"]',
            '.account-name input',
            '.username-field input',
            '.email-field input',
            // Selectores genéricos más amplios
            'form input[type="text"]:first-of-type',
            'form input:first-of-type',
            '[data-testid*="email"]',
            '[data-testid*="account"]',
            '[data-testid*="username"]',
            // Selectores por posición y contexto
            '.signin-container input[type="text"]',
            '.login-form input[type="text"]',
            '.auth-form input[type="text"]',
            '#signin input[type="text"]',
            '#login input[type="text"]',
            // Selectores más agresivos
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
            'input[type="text"]:visible',
            'input[type="email"]:visible'
          ];

          // Intentar cada selector
          for (const selector of emailSelectors) {
            try {
              console.log(`🔍 Probando selector: ${selector}`);

              const elements = await this.driver!.findElements(By.css(selector));
              console.log(`🔍 Elementos encontrados con ${selector}: ${elements.length}`);

              for (const element of elements) {
                try {
                  const isDisplayed = await element.isDisplayed();
                  const isEnabled = await element.isEnabled();

                  if (isDisplayed && isEnabled) {
                    console.log(`✅ Campo de email encontrado con selector: ${selector}`);
                    return element;
                  }
                } catch (elementError) {
                  // Continuar con el siguiente elemento
                  continue;
                }
              }
            } catch (selectorError) {
              // Continuar con el siguiente selector
              continue;
            }
          }

          // Análisis detallado como último recurso
          console.log('🔍 Análisis detallado de la página...');

          const allInputs = await this.driver!.findElements(By.css('input'));
          console.log(`🔍 Total de inputs encontrados: ${allInputs.length}`);

          for (let i = 0; i < allInputs.length; i++) {
            const input = allInputs[i];
            try {
              const isDisplayed = await input.isDisplayed();
              const isEnabled = await input.isEnabled();
              const type = await input.getAttribute('type');
              const id = await input.getAttribute('id');
              const name = await input.getAttribute('name');

              console.log(`📝 Input ${i + 1}: type="${type}", id="${id}", name="${name}", visible=${isDisplayed}, enabled=${isEnabled}`);

              if (isDisplayed && isEnabled && (type === 'text' || type === 'email' || !type)) {
                console.log(`✅ Campo de email encontrado por análisis (Input ${i + 1})`);
                return input;
              }
            } catch (inputError) {
              continue;
            }
          }

          throw new Error('No se pudo encontrar el campo de email');
        },
        'Búsqueda de campo de email',
        4,
        2000
      );

      // Llenar email con reintentos
      await this.retryWithBackoff(
        async () => {
          await emailField.clear();
          await emailField.sendKeys(options.email);

          // Verificar que se escribió correctamente
          const value = await emailField.getAttribute('value');
          if (value !== options.email) {
            throw new Error(`Email no se escribió correctamente: esperado "${options.email}", obtenido "${value}"`);
          }

          console.log('✅ Email ingresado correctamente');
        },
        'Ingreso de email',
        3,
        1000
      );

      // Buscar y llenar password con reintentos robustos
      const passwordField = await this.retryWithBackoff(
        async () => {
          await this.ensureDriverActive(options);

          console.log('🔍 Buscando campo de password...');

          const passwordSelectors = [
            'input[id="password_text_field"]',
            'input[type="password"]',
            'input[name="password"]',
            'input[id*="password"]',
            'input[aria-label*="password"]',
            'input[placeholder*="password"]',
            '.form-textbox-input[type="password"]',
            'input.form-textbox-input[type="password"]',
            '[data-testid*="password"]',
            '.password-field input',
            '.signin-form input[type="password"]',
            'form input[type="password"]'
          ];

          for (const selector of passwordSelectors) {
            try {
              console.log(`🔍 Probando selector password: ${selector}`);
              const elements = await this.driver!.findElements(By.css(selector));

              for (const element of elements) {
                try {
                  const isDisplayed = await element.isDisplayed();
                  const isEnabled = await element.isEnabled();

                  if (isDisplayed && isEnabled) {
                    console.log(`✅ Campo de password encontrado con selector: ${selector}`);
                    return element;
                  }
                } catch (elementError) {
                  continue;
                }
              }
            } catch (selectorError) {
              continue;
            }
          }

          throw new Error('No se pudo encontrar el campo de password');
        },
        'Búsqueda de campo de password',
        4,
        2000
      );

      // Llenar password con reintentos
      await this.retryWithBackoff(
        async () => {
          await passwordField.clear();
          await passwordField.sendKeys(options.password);

          // Verificar que se escribió (sin mostrar la password en logs)
          const value = await passwordField.getAttribute('value');
          if (!value || value.length !== options.password.length) {
            throw new Error('Password no se escribió correctamente');
          }

          console.log('✅ Password ingresado correctamente');
        },
        'Ingreso de password',
        3,
        1000
      );

      // Buscar y hacer clic en botón de login con reintentos
      await this.retryWithBackoff(
        async () => {
          await this.ensureDriverActive(options);

          console.log('🔍 Buscando botón de login...');

          const buttonSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button[id*="sign"]',
            'button[id*="login"]',
            '.signin-button',
            '.form-submit-button',
            '.btn-primary',
            'button:contains("Sign In")',
            'button:contains("Continue")',
            'button:contains("Next")',
            '[data-testid*="submit"]',
            '[data-testid*="login"]',
            '[data-testid*="signin"]',
            'form button:last-of-type',
            'form button[type="button"]'
          ];

          for (const selector of buttonSelectors) {
            try {
              console.log(`🔍 Probando selector botón: ${selector}`);
              const elements = await this.driver!.findElements(By.css(selector));

              for (const element of elements) {
                try {
                  const isDisplayed = await element.isDisplayed();
                  const isEnabled = await element.isEnabled();
                  const text = await element.getText();

                  console.log(`🔍 Botón encontrado: visible=${isDisplayed}, enabled=${isEnabled}, text="${text}"`);

                  if (isDisplayed && isEnabled) {
                    console.log(`✅ Haciendo clic en botón de login con selector: ${selector}`);
                    await element.click();
                    return;
                  }
                } catch (elementError) {
                  continue;
                }
              }
            } catch (selectorError) {
              continue;
            }
          }

          throw new Error('No se pudo encontrar el botón de login');
        },
        'Clic en botón de login',
        4,
        2000
      );
      
      console.log('📝 Credenciales enviadas, esperando respuesta...');
      
      // Esperar respuesta (puede ser 2FA, error, o éxito)
      await this.driver.sleep(3000);
      
      const currentUrl = await this.driver.getCurrentUrl();
      console.log('🔍 URL actual:', currentUrl);
      
      // Verificar si requiere 2FA
      if (await this.check2FARequired()) {
        console.log('🔐 Se requiere autenticación de dos factores');
        return {
          success: false,
          requires2FA: true,
          twoFactorToken: await this.generate2FAToken()
        };
      }
      
      // Verificar si hay error de login
      if (await this.checkLoginError()) {
        const errorMsg = await this.getErrorMessage();
        console.log('❌ Error de login:', errorMsg);
        return {
          success: false,
          error: errorMsg || 'Invalid credentials'
        };
      }
      
      // Verificar si el login fue exitoso
      if (await this.checkLoginSuccess()) {
        console.log('✅ Login exitoso, guardando sesión...');
        
        const cookies = await this.driver.manage().getCookies();
        const sessionId = await this.sessionStorage.saveSession({
          email: options.email,
          cookies,
          timestamp: new Date(),
          userAgent: await this.driver.executeScript('return navigator.userAgent;'),
          url: currentUrl
        });
        
        return {
          success: true,
          sessionId,
          cookies
        };
      }
      
      // Si llegamos aquí, algo inesperado pasó
      return {
        success: false,
        error: 'Unexpected response from Apple ID'
      };
      
    } catch (error) {
      console.error('❌ Error durante login Apple:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Manejar autenticación de dos factores
   */
  async handle2FA(twoFactorCode: string, twoFactorToken: string): Promise<AppleLoginResult> {
    try {
      if (!this.driver) {
        throw new Error('Driver not initialized');
      }

      console.log('🔐 Procesando código 2FA...');
      
      // Buscar campos de código 2FA con múltiples selectores
      let codeFields = await this.driver.findElements(
        By.css('input[type="tel"], input[maxlength="1"], input[maxlength="6"], .two-factor input, .verification-code input, input[name*="code"], input[placeholder*="code"]')
      );

      // Si no encuentra campos específicos, buscar todos los inputs visibles
      if (codeFields.length === 0) {
        codeFields = await this.driver.findElements(
          By.css('input[type="text"], input[type="number"]')
        );
        // Filtrar solo los visibles
        const visibleFields = [];
        for (const field of codeFields) {
          if (await field.isDisplayed()) {
            visibleFields.push(field);
          }
        }
        codeFields = visibleFields;
      }

      if (codeFields.length === 0) {
        throw new Error('No se encontraron campos de código 2FA');
      }

      // Si hay múltiples campos (un dígito por campo)
      if (codeFields.length > 1 && codeFields.length <= 6) {
        for (let i = 0; i < Math.min(twoFactorCode.length, codeFields.length); i++) {
          await codeFields[i].clear();
          await codeFields[i].sendKeys(twoFactorCode[i]);
        }
      } else {
        // Un solo campo para todo el código
        await codeFields[0].clear();
        await codeFields[0].sendKeys(twoFactorCode);
      }

      // Buscar y hacer clic en botón de continuar/verificar
      let continueButton;
      try {
        continueButton = await this.driver.wait(
          until.elementLocated(By.css('button[type="submit"], .continue-button, .btn-primary, button:contains("Continue"), button:contains("Verify"), button:contains("Trust")')),
          5000
        );
      } catch (error) {
        // Buscar cualquier botón visible
        const buttons = await this.driver.findElements(By.css('button, input[type="submit"]'));
        for (const button of buttons) {
          if (await button.isDisplayed()) {
            continueButton = button;
            break;
          }
        }
      }

      if (continueButton) {
        await continueButton.click();
      }
      
      // Esperar respuesta
      await this.driver.sleep(3000);
      
      // Verificar resultado
      if (await this.checkLoginSuccess()) {
        console.log('✅ 2FA exitoso, guardando sesión...');
        
        const cookies = await this.driver.manage().getCookies();
        const currentUrl = await this.driver.getCurrentUrl();
        
        const sessionId = await this.sessionStorage.saveSession({
          email: process.env.Apple_user || '',
          cookies,
          timestamp: new Date(),
          userAgent: await this.driver.executeScript('return navigator.userAgent;'),
          url: currentUrl
        });
        
        return {
          success: true,
          sessionId,
          cookies
        };
      } else {
        return {
          success: false,
          error: 'Código 2FA inválido o expirado'
        };
      }
      
    } catch (error) {
      console.error('❌ Error durante 2FA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Verificar si se requiere 2FA
   */
  private async check2FARequired(): Promise<boolean> {
    if (!this.driver) return false;

    try {
      // Buscar elementos típicos de 2FA con selectores mejorados
      const twoFactorElements = await this.driver.findElements(
        By.css('.two-factor, [data-testid="two-factor"], input[maxlength="1"], input[maxlength="6"], .verification-code, input[name*="code"], input[placeholder*="verification"], .security-code, .auth-code')
      );

      // También verificar por texto en la página
      const pageText = await this.driver.findElement(By.css('body')).getText();
      const has2FAText = pageText.includes('verification code') ||
                        pageText.includes('two-factor') ||
                        pageText.includes('security code') ||
                        pageText.includes('Enter the code');

      return twoFactorElements.length > 0 || has2FAText;
    } catch {
      return false;
    }
  }

  /**
   * Verificar si hay error de login
   */
  private async checkLoginError(): Promise<boolean> {
    if (!this.driver) return false;
    
    try {
      const errorElements = await this.driver.findElements(
        By.css('.error, .alert-error, .form-error, [role="alert"]')
      );
      
      return errorElements.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Verificar si el login fue exitoso
   */
  private async checkLoginSuccess(): Promise<boolean> {
    if (!this.driver) return false;

    try {
      const currentUrl = await this.driver.getCurrentUrl();

      // URLs que indican éxito
      const successUrls = [
        'appleid.apple.com/account',
        'appleid.apple.com/#/account',
        'appleid.apple.com/us/account',
        'appleid.apple.com/auth/authorize',
        'idmsa.apple.com/appleauth'
      ];

      const urlSuccess = successUrls.some(url => currentUrl.includes(url));

      // También verificar elementos que indican éxito
      try {
        const successElements = await this.driver.findElements(
          By.css('.account-header, .profile-header, .user-info, [data-testid="account"], .signed-in')
        );
        const hasSuccessElements = successElements.length > 0;

        // Verificar que no estemos en página de error
        const errorElements = await this.driver.findElements(
          By.css('.error, .alert-error, .signin-error, [role="alert"]')
        );
        const hasErrors = errorElements.length > 0;

        return (urlSuccess || hasSuccessElements) && !hasErrors;
      } catch {
        return urlSuccess;
      }
    } catch {
      return false;
    }
  }

  /**
   * Obtener mensaje de error
   */
  private async getErrorMessage(): Promise<string | null> {
    if (!this.driver) return null;
    
    try {
      const errorElement = await this.driver.findElement(
        By.css('.error, .alert-error, .form-error, [role="alert"]')
      );
      
      return await errorElement.getText();
    } catch {
      return null;
    }
  }

  /**
   * Generar token para 2FA
   */
  private async generate2FAToken(): Promise<string> {
    return `2fa_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Cerrar el driver
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
      this.isInitialized = false;
      console.log('🔒 Selenium Driver cerrado');
    }
  }

  /**
   * Verificar si el driver está activo
   */
  isActive(): boolean {
    return this.isInitialized && this.driver !== null;
  }
}
