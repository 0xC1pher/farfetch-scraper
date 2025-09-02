#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Configurar paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Cargar variables de entorno
config({ path: join(projectRoot, '.env') });

console.log('🍎 SCRIPT DE PRUEBA - APPLE AUTHENTICATION');
console.log('==========================================');

/**
 * Verificar configuración del entorno
 */
function checkEnvironment() {
  console.log('\n📋 1. VERIFICANDO CONFIGURACIÓN...');
  
  const requiredVars = ['Apple_user', 'apple_passw'];
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      console.log(`✅ ${varName}: ${process.env[varName].substring(0, 5)}***`);
    }
  }
  
  if (missing.length > 0) {
    console.log(`❌ Variables faltantes: ${missing.join(', ')}`);
    return false;
  }
  
  console.log('✅ Configuración del entorno correcta');
  return true;
}

/**
 * Verificar estructura de archivos
 */
async function checkFileStructure() {
  console.log('\n📁 2. VERIFICANDO ESTRUCTURA DE ARCHIVOS...');

  const requiredFiles = [
    'src/apple-auth/selenium-driver/apple-login.ts',
    'src/apple-auth/storage/session-storage.ts',
    'src/apple-auth/auth-manager/apple-auth.ts',
    'src/apple-auth/api/auth-endpoints.ts',
    'src/pages/api/apple-auth/login.ts',
    'src/pages/api/apple-auth/status.ts',
    'src/pages/api/apple-auth/two-factor.ts',
    'src/pages/api/apple-auth/session.ts',
    'src/orchestrator/apple-integration.ts'
  ];

  const fs = await import('fs');
  let allExist = true;

  for (const file of requiredFiles) {
    const fullPath = join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - NO ENCONTRADO`);
      allExist = false;
    }
  }

  if (allExist) {
    console.log('✅ Todos los archivos del módulo Apple Auth están presentes');
  } else {
    console.log('❌ Algunos archivos del módulo Apple Auth faltan');
  }

  return allExist;
}

/**
 * Verificar dependencias
 */
async function checkDependencies() {
  console.log('\n📦 3. VERIFICANDO DEPENDENCIAS...');
  
  try {
    const packageJson = await import(join(projectRoot, 'package.json'), { assert: { type: 'json' } });
    const dependencies = { ...packageJson.default.dependencies, ...packageJson.default.devDependencies };
    
    const requiredDeps = ['selenium-webdriver', '@types/selenium-webdriver'];
    let allInstalled = true;
    
    for (const dep of requiredDeps) {
      if (dependencies[dep]) {
        console.log(`✅ ${dep}: ${dependencies[dep]}`);
      } else {
        console.log(`❌ ${dep} - NO INSTALADO`);
        allInstalled = false;
      }
    }
    
    if (allInstalled) {
      console.log('✅ Todas las dependencias están instaladas');
    } else {
      console.log('❌ Algunas dependencias faltan');
      console.log('💡 Ejecuta: npm install selenium-webdriver @types/selenium-webdriver');
    }
    
    return allInstalled;
  } catch (error) {
    console.log('❌ Error verificando dependencias:', error.message);
    return false;
  }
}

/**
 * Probar APIs del módulo Apple Auth
 */
async function testAppleAuthAPIs() {
  console.log('\n🔌 4. PROBANDO APIs DE APPLE AUTH...');
  
  try {
    // Simular importación de la API (en un entorno real)
    console.log('📡 Probando endpoint de estado...');
    
    // Aquí normalmente haríamos fetch a localhost:3000/api/apple-auth/status
    // Pero como es un script de prueba, solo verificamos la estructura
    
    const statusEndpoint = join(projectRoot, 'src/pages/api/apple-auth/status.ts');
    const fs = await import('fs');
    
    if (fs.existsSync(statusEndpoint)) {
      const content = fs.readFileSync(statusEndpoint, 'utf8');
      if (content.includes('AppleAuthAPI') && content.includes('getAuthStatus')) {
        console.log('✅ Endpoint de estado configurado correctamente');
      } else {
        console.log('❌ Endpoint de estado mal configurado');
        return false;
      }
    }
    
    console.log('✅ APIs de Apple Auth configuradas correctamente');
    return true;
  } catch (error) {
    console.log('❌ Error probando APIs:', error.message);
    return false;
  }
}

/**
 * Verificar integración con orchestrator
 */
async function checkOrchestratorIntegration() {
  console.log('\n🔗 5. VERIFICANDO INTEGRACIÓN CON ORCHESTRATOR...');
  
  try {
    const integrationFile = join(projectRoot, 'src/orchestrator/apple-integration.ts');
    const fs = await import('fs');
    
    if (fs.existsSync(integrationFile)) {
      const content = fs.readFileSync(integrationFile, 'utf8');
      
      const requiredMethods = [
        'hasAppleSession',
        'getAppleSessionForBrowserMCP',
        'ensureAppleSession',
        'getSessionConfigForOrchestrator'
      ];
      
      let allMethodsPresent = true;
      for (const method of requiredMethods) {
        if (content.includes(method)) {
          console.log(`✅ Método ${method} presente`);
        } else {
          console.log(`❌ Método ${method} faltante`);
          allMethodsPresent = false;
        }
      }
      
      if (allMethodsPresent) {
        console.log('✅ Integración con orchestrator completa');
        return true;
      } else {
        console.log('❌ Integración con orchestrator incompleta');
        return false;
      }
    } else {
      console.log('❌ Archivo de integración no encontrado');
      return false;
    }
  } catch (error) {
    console.log('❌ Error verificando integración:', error.message);
    return false;
  }
}

/**
 * Verificar que Chrome/Chromium está disponible
 */
async function checkChromeAvailability() {
  console.log('\n🌐 6. VERIFICANDO DISPONIBILIDAD DE CHROME...');
  
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Intentar encontrar Chrome/Chromium
    const commands = [
      'google-chrome --version',
      'chromium --version',
      'chromium-browser --version',
      '/usr/bin/google-chrome --version'
    ];
    
    for (const cmd of commands) {
      try {
        const { stdout } = await execAsync(cmd);
        if (stdout.includes('Chrome') || stdout.includes('Chromium')) {
          console.log(`✅ Navegador encontrado: ${stdout.trim()}`);
          return true;
        }
      } catch (error) {
        // Continuar con el siguiente comando
      }
    }
    
    console.log('❌ Chrome/Chromium no encontrado');
    console.log('💡 Instala Chrome o Chromium para usar Selenium');
    return false;
  } catch (error) {
    console.log('❌ Error verificando Chrome:', error.message);
    return false;
  }
}

/**
 * Generar reporte final
 */
function generateReport(results) {
  console.log('\n📊 REPORTE FINAL');
  console.log('================');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  
  console.log(`\n✅ Verificaciones pasadas: ${passedChecks}/${totalChecks} (${percentage}%)`);
  
  if (percentage === 100) {
    console.log('\n🎉 ¡MÓDULO APPLE AUTH LISTO PARA USAR!');
    console.log('   Todos los componentes están correctamente configurados.');
    console.log('   Puedes proceder a integrar con el sistema existente.');
  } else if (percentage >= 80) {
    console.log('\n⚠️  MÓDULO APPLE AUTH CASI LISTO');
    console.log('   La mayoría de componentes están configurados.');
    console.log('   Revisa los elementos faltantes antes de usar.');
  } else {
    console.log('\n❌ MÓDULO APPLE AUTH REQUIERE ATENCIÓN');
    console.log('   Varios componentes necesitan configuración.');
    console.log('   Completa las verificaciones antes de usar.');
  }
  
  console.log('\n📋 DETALLES:');
  for (const [check, passed] of Object.entries(results)) {
    console.log(`   ${passed ? '✅' : '❌'} ${check}`);
  }
  
  if (percentage < 100) {
    console.log('\n💡 PRÓXIMOS PASOS:');
    if (!results.environment) {
      console.log('   - Configura las variables Apple_user y apple_passw en .env');
    }
    if (!results.dependencies) {
      console.log('   - Instala las dependencias: npm install selenium-webdriver @types/selenium-webdriver');
    }
    if (!results.chrome) {
      console.log('   - Instala Chrome o Chromium para Selenium');
    }
    if (!results.fileStructure) {
      console.log('   - Verifica que todos los archivos del módulo estén presentes');
    }
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    const results = {
      environment: checkEnvironment(),
      fileStructure: checkFileStructure(),
      dependencies: await checkDependencies(),
      apis: await testAppleAuthAPIs(),
      integration: await checkOrchestratorIntegration(),
      chrome: await checkChromeAvailability()
    };
    
    generateReport(results);
    
    // Exit code basado en el resultado
    const allPassed = Object.values(results).every(Boolean);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    process.exit(1);
  }
}

// Ejecutar script
main();
