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

  constructor() {
    this.sessionStorage = new SessionStorage();
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
      
      // Configuración básica
      chromeOptions.addArguments('--no-sandbox');
      chromeOptions.addArguments('--disable-dev-shm-usage');
      chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
      chromeOptions.addArguments('--disable-extensions');
      chromeOptions.addArguments('--no-first-run');
      chromeOptions.addArguments('--disable-default-apps');
      
      // User agent realista
      chromeOptions.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Configuración de ventana
      if (options.headless) {
        chromeOptions.addArguments('--headless=new');
      }
      chromeOptions.addArguments('--window-size=1366,768');
      
      // Configurar proxy si se proporciona
      if (options.proxy) {
        chromeOptions.addArguments(`--proxy-server=${options.proxy}`);
        console.log('🌐 Proxy configurado:', options.proxy);
      }

      // Configuraciones anti-detección
      chromeOptions.excludeSwitches('enable-automation');
      chromeOptions.addArguments('--disable-web-security');
      chromeOptions.addArguments('--allow-running-insecure-content');
      
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
   * Realizar login en Apple
   */
  async login(options: AppleLoginOptions): Promise<AppleLoginResult> {
    try {
      await this.initialize(options);
      
      if (!this.driver) {
        throw new Error('Driver not initialized');
      }

      console.log('🍎 Iniciando login en Apple ID...');

      // Navegar a Apple ID con retry
      let navigationSuccess = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await this.driver.get('https://appleid.apple.com/sign-in');

          // Esperar a que cargue la página
          await this.driver.wait(until.titleContains('Apple'), 15000);
          navigationSuccess = true;
          break;
        } catch (error) {
          console.log(`⚠️ Intento ${attempt + 1} de navegación falló, reintentando...`);
          if (attempt === 2) throw error;
          await this.driver.sleep(2000);
        }
      }

      if (!navigationSuccess) {
        throw new Error('No se pudo navegar a Apple ID después de 3 intentos');
      }

      console.log('✅ Página de Apple ID cargada correctamente');
      
      // Buscar y llenar email - múltiples selectores
      let emailField;
      try {
        emailField = await this.driver.wait(
          until.elementLocated(By.css('input[type="email"], input[name="accountName"], input[id*="account"], input[placeholder*="email"], input[placeholder*="Apple ID"]')),
          15000
        );
      } catch (error) {
        // Intentar selectores alternativos
        emailField = await this.driver.wait(
          until.elementLocated(By.css('input[type="text"]:first-of-type, .form-textbox-input:first-of-type')),
          10000
        );
      }
      await emailField.clear();
      await emailField.sendKeys(options.email);

      // Buscar y llenar password - múltiples selectores
      let passwordField;
      try {
        passwordField = await this.driver.wait(
          until.elementLocated(By.css('input[type="password"], input[name="password"], input[id*="password"]')),
          10000
        );
      } catch (error) {
        // Intentar selector alternativo
        passwordField = await this.driver.wait(
          until.elementLocated(By.css('.form-textbox-input[type="password"]')),
          5000
        );
      }
      await passwordField.clear();
      await passwordField.sendKeys(options.password);

      // Hacer clic en el botón de login - múltiples selectores
      let loginButton;
      try {
        loginButton = await this.driver.wait(
          until.elementLocated(By.css('button[type="submit"], input[type="submit"], button[id*="sign"], .signin-button, .form-submit-button')),
          5000
        );
      } catch (error) {
        // Intentar selector alternativo
        loginButton = await this.driver.wait(
          until.elementLocated(By.css('button:contains("Sign In"), button:contains("Continue"), .btn-primary')),
          5000
        );
      }
      await loginButton.click();
      
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
