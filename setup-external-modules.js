#!/usr/bin/env node

/**
 * Script para configurar y preparar los módulos externos para scraping real
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(spawn);

async function setupExternalModules() {
  console.log('🔧 Configurando módulos externos para scraping real...\n');

  const modulePaths = {
    browserMCP: join(process.cwd(), 'external', 'browser-mcp'),
    scraperr: join(process.cwd(), 'external', 'scraperr'),
    deepscrape: join(process.cwd(), 'external', 'deepscrape')
  };

  try {
    // 1. Configurar Browser-MCP
    console.log('🌐 Configurando Browser-MCP...');
    await setupBrowserMCP(modulePaths.browserMCP);

    // 2. Configurar Scraperr
    console.log('\n🔍 Configurando Scraperr...');
    await setupScraperr(modulePaths.scraperr);

    // 3. Configurar DeepScrape
    console.log('\n🤖 Configurando DeepScrape...');
    await setupDeepScrape(modulePaths.deepscrape);

    // 4. Iniciar Redis si es necesario
    console.log('\n🗄️ Verificando Redis...');
    await setupRedis();

    console.log('\n✅ Configuración de módulos externos completada!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Los módulos están configurados para scraping real');
    console.log('   2. Ejecuta: npx tsx test-real-scraping.js');
    console.log('   3. Los servicios se iniciarán automáticamente cuando sea necesario');

  } catch (error) {
    console.error('\n💥 Error durante la configuración:', error.message);
    process.exit(1);
  }
}

async function setupBrowserMCP(path) {
  try {
    // Verificar estructura del proyecto Browser-MCP
    const appPath = join(path, 'app');
    const nativeServerPath = join(appPath, 'native-server');
    
    console.log('   📁 Verificando estructura...');
    
    // Buscar el package.json correcto
    let packageJsonPath;
    const possiblePaths = [
      join(nativeServerPath, 'package.json'),
      join(appPath, 'package.json'),
      join(path, 'package.json')
    ];

    for (const possiblePath of possiblePaths) {
      try {
        await fs.access(possiblePath);
        packageJsonPath = possiblePath;
        console.log(`   ✅ Encontrado package.json en: ${possiblePath}`);
        break;
      } catch {
        // Continuar buscando
      }
    }

    if (!packageJsonPath) {
      throw new Error('No se encontró package.json para Browser-MCP');
    }

    // Leer y verificar package.json
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    
    if (!packageJson.scripts?.start) {
      console.log('   🔧 Agregando script start...');
      
      // Agregar script start apropiado
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      // Determinar el comando start apropiado basado en la estructura
      if (packageJson.main) {
        packageJson.scripts.start = `node ${packageJson.main}`;
      } else if (await fs.access(join(path, 'index.js')).then(() => true).catch(() => false)) {
        packageJson.scripts.start = 'node index.js';
      } else if (await fs.access(join(path, 'server.js')).then(() => true).catch(() => false)) {
        packageJson.scripts.start = 'node server.js';
      } else {
        packageJson.scripts.start = 'node app.js';
      }

      // Agregar también script dev si no existe
      if (!packageJson.scripts.dev) {
        packageJson.scripts.dev = packageJson.scripts.start;
      }

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('   ✅ Scripts agregados al package.json');
    } else {
      console.log('   ✅ Script start ya existe');
    }

    // Verificar dependencias
    console.log('   📦 Verificando dependencias...');
    const nodeModulesPath = join(packageJsonPath.replace('/package.json', ''), 'node_modules');
    
    try {
      await fs.access(nodeModulesPath);
      console.log('   ✅ Dependencias ya instaladas');
    } catch {
      console.log('   📥 Instalando dependencias...');
      await runCommand('npm', ['install'], packageJsonPath.replace('/package.json', ''));
      console.log('   ✅ Dependencias instaladas');
    }

  } catch (error) {
    console.log(`   ❌ Error configurando Browser-MCP: ${error.message}`);
    throw error;
  }
}

async function setupScraperr(path) {
  try {
    console.log('   📁 Verificando Scraperr...');
    
    const packageJsonPath = join(path, 'package.json');
    await fs.access(packageJsonPath);
    
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    console.log('   ✅ Package.json encontrado');

    // Verificar si existe build
    const distPath = join(path, '.next');
    try {
      await fs.access(distPath);
      console.log('   ✅ Build de Next.js ya existe');
    } catch {
      console.log('   🔨 Construyendo aplicación Next.js...');
      await runCommand('npm', ['run', 'build'], path);
      console.log('   ✅ Build completado');
    }

    // Verificar dependencias
    const nodeModulesPath = join(path, 'node_modules');
    try {
      await fs.access(nodeModulesPath);
      console.log('   ✅ Dependencias ya instaladas');
    } catch {
      console.log('   📥 Instalando dependencias...');
      await runCommand('npm', ['install'], path);
      console.log('   ✅ Dependencias instaladas');
    }

    // Configurar puerto alternativo si es necesario
    const envPath = join(path, '.env.local');
    try {
      const envContent = await fs.readFile(envPath, 'utf-8');
      if (!envContent.includes('PORT=')) {
        await fs.appendFile(envPath, '\nPORT=3001\n');
        console.log('   ✅ Puerto 3001 configurado');
      }
    } catch {
      await fs.writeFile(envPath, 'PORT=3001\n');
      console.log('   ✅ Archivo .env.local creado con puerto 3001');
    }

  } catch (error) {
    console.log(`   ❌ Error configurando Scraperr: ${error.message}`);
    throw error;
  }
}

async function setupDeepScrape(path) {
  try {
    console.log('   📁 Verificando DeepScrape...');
    
    const packageJsonPath = join(path, 'package.json');
    await fs.access(packageJsonPath);
    console.log('   ✅ Package.json encontrado');

    // Verificar build
    const distPath = join(path, 'dist');
    try {
      await fs.access(distPath);
      console.log('   ✅ Build ya existe');
    } catch {
      console.log('   🔨 Construyendo DeepScrape...');
      await runCommand('npm', ['run', 'build'], path);
      console.log('   ✅ Build completado');
    }

    // Verificar dependencias
    const nodeModulesPath = join(path, 'node_modules');
    try {
      await fs.access(nodeModulesPath);
      console.log('   ✅ Dependencias ya instaladas');
    } catch {
      console.log('   📥 Instalando dependencias...');
      await runCommand('npm', ['install'], path);
      console.log('   ✅ Dependencias instaladas');
    }

    // Configurar variables de entorno
    const envPath = join(path, '.env');
    try {
      const envContent = await fs.readFile(envPath, 'utf-8');
      if (!envContent.includes('PORT=')) {
        await fs.appendFile(envPath, '\nPORT=3002\n');
      }
      if (!envContent.includes('REDIS_URL=')) {
        await fs.appendFile(envPath, 'REDIS_URL=redis://localhost:6379\n');
      }
      console.log('   ✅ Variables de entorno configuradas');
    } catch {
      await fs.writeFile(envPath, 'PORT=3002\nREDIS_URL=redis://localhost:6379\n');
      console.log('   ✅ Archivo .env creado');
    }

  } catch (error) {
    console.log(`   ❌ Error configurando DeepScrape: ${error.message}`);
    throw error;
  }
}

async function setupRedis() {
  try {
    // Verificar si Redis está corriendo
    const { spawn } = await import('child_process');
    
    const redisCheck = spawn('redis-cli', ['ping'], { stdio: 'pipe' });
    
    await new Promise((resolve, reject) => {
      let output = '';
      
      redisCheck.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      redisCheck.on('close', (code) => {
        if (code === 0 && output.includes('PONG')) {
          console.log('   ✅ Redis ya está corriendo');
          resolve(true);
        } else {
          reject(new Error('Redis no está corriendo'));
        }
      });
      
      redisCheck.on('error', () => {
        reject(new Error('Redis no está instalado'));
      });
    });

  } catch (error) {
    console.log('   ⚠️ Redis no está disponible');
    console.log('   💡 Para instalar Redis:');
    console.log('      Ubuntu/Debian: sudo apt install redis-server');
    console.log('      macOS: brew install redis');
    console.log('      O usar Docker: docker run -d -p 6379:6379 redis:alpine');
    console.log('   📝 DeepScrape funcionará sin Redis pero con funcionalidad limitada');
  }
}

async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      cwd, 
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true 
    });

    let stdout = '';
    let stderr = '';

    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Ejecutar configuración
if (import.meta.url === `file://${process.argv[1]}`) {
  setupExternalModules().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

export { setupExternalModules };
