#!/usr/bin/env node

import { Builder, By, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Cargar variables de entorno
config({ path: join(projectRoot, '.env') });

console.log('🍎 PRUEBA SIMPLE DE LOGIN APPLE');
console.log('===============================');

async function testAppleLogin() {
  let driver = null;
  
  try {
    console.log('🔧 Configurando Chrome...');
    
    const chromeOptions = new ChromeOptions();
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
    chromeOptions.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    chromeOptions.addArguments('--window-size=1366,768');
    
    // Modo visible para debugging
    // chromeOptions.addArguments('--headless=new');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();

    console.log('✅ Chrome iniciado');
    
    console.log('🌐 Navegando a Apple ID...');
    await driver.get('https://appleid.apple.com/sign-in');
    
    // Esperar a que cargue
    await driver.sleep(3000);
    
    console.log('📄 Página cargada, analizando elementos...');
    
    // Obtener título de la página
    const title = await driver.getTitle();
    console.log('📋 Título de página:', title);
    
    // Obtener URL actual
    const currentUrl = await driver.getCurrentUrl();
    console.log('🔗 URL actual:', currentUrl);
    
    // Buscar todos los inputs
    console.log('🔍 Buscando campos de entrada...');
    const allInputs = await driver.findElements(By.css('input'));
    console.log(`📝 Encontrados ${allInputs.length} campos de entrada`);
    
    for (let i = 0; i < allInputs.length; i++) {
      try {
        const input = allInputs[i];
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const id = await input.getAttribute('id');
        const placeholder = await input.getAttribute('placeholder');
        const className = await input.getAttribute('class');
        
        console.log(`  Input ${i + 1}:`);
        console.log(`    Type: ${type}`);
        console.log(`    Name: ${name}`);
        console.log(`    ID: ${id}`);
        console.log(`    Placeholder: ${placeholder}`);
        console.log(`    Class: ${className}`);
        console.log('    ---');
      } catch (error) {
        console.log(`  Input ${i + 1}: Error obteniendo atributos`);
      }
    }
    
    // Buscar botones
    console.log('🔍 Buscando botones...');
    const allButtons = await driver.findElements(By.css('button, input[type="submit"]'));
    console.log(`🔘 Encontrados ${allButtons.length} botones`);
    
    for (let i = 0; i < allButtons.length; i++) {
      try {
        const button = allButtons[i];
        const type = await button.getAttribute('type');
        const id = await button.getAttribute('id');
        const className = await button.getAttribute('class');
        const text = await button.getText();
        
        console.log(`  Botón ${i + 1}:`);
        console.log(`    Type: ${type}`);
        console.log(`    ID: ${id}`);
        console.log(`    Text: ${text}`);
        console.log(`    Class: ${className}`);
        console.log('    ---');
      } catch (error) {
        console.log(`  Botón ${i + 1}: Error obteniendo atributos`);
      }
    }
    
    // Intentar encontrar campo de email con selectores mejorados
    console.log('🔍 Intentando encontrar campo de email...');
    
    const emailSelectors = [
      'input[type="email"]',
      'input[name="accountName"]',
      'input[id*="account"]',
      'input[placeholder*="email"]',
      'input[placeholder*="Apple ID"]',
      'input[type="text"]:first-of-type',
      '.form-textbox-input:first-of-type'
    ];
    
    let emailField = null;
    for (const selector of emailSelectors) {
      try {
        const elements = await driver.findElements(By.css(selector));
        if (elements.length > 0) {
          emailField = elements[0];
          console.log(`✅ Campo de email encontrado con selector: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Selector ${selector} falló:`, error.message);
      }
    }
    
    if (emailField) {
      console.log('📧 Intentando llenar campo de email...');
      await emailField.clear();
      await emailField.sendKeys(process.env.Apple_user || 'test@example.com');
      console.log('✅ Email ingresado');
    } else {
      console.log('❌ No se pudo encontrar campo de email');
    }
    
    // Intentar encontrar campo de password
    console.log('🔍 Intentando encontrar campo de password...');
    
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id*="password"]',
      '.form-textbox-input[type="password"]'
    ];
    
    let passwordField = null;
    for (const selector of passwordSelectors) {
      try {
        const elements = await driver.findElements(By.css(selector));
        if (elements.length > 0) {
          passwordField = elements[0];
          console.log(`✅ Campo de password encontrado con selector: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Selector ${selector} falló:`, error.message);
      }
    }
    
    if (passwordField) {
      console.log('🔐 Intentando llenar campo de password...');
      await passwordField.clear();
      await passwordField.sendKeys(process.env.apple_passw || 'testpassword');
      console.log('✅ Password ingresado');
    } else {
      console.log('❌ No se pudo encontrar campo de password');
    }
    
    // Esperar un poco para ver el resultado
    console.log('⏳ Esperando 5 segundos para observar...');
    await driver.sleep(5000);
    
    console.log('✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    if (driver) {
      console.log('🔒 Cerrando navegador...');
      await driver.quit();
    }
  }
}

// Ejecutar prueba
testAppleLogin();
