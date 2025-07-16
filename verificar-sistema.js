#!/usr/bin/env node

/**
 * Script de verificación completa del sistema MeXa
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import axios from 'axios';

console.log('🔍 Verificando Sistema MeXa...\n');

async function verificarSistema() {
  const resultados = {
    archivos: { total: 0, encontrados: 0 },
    datos: { total: 0, ofertas: 0 },
    servicios: { total: 0, activos: 0 },
    bot: { configurado: false, funcionando: false }
  };

  // 1. Verificar archivos clave
  console.log('📁 Verificando archivos clave...');
  const archivosRequeridos = [
    'package.json',
    'src/telegram-bot/index.ts',
    'src/utils/moduleLoader.ts',
    'scripts/auto-start.mjs',
    'SOLUCION-BOT-IMAGENES.md',
    'ejecutar-sistema.sh'
  ];

  resultados.archivos.total = archivosRequeridos.length;
  
  for (const archivo of archivosRequeridos) {
    try {
      await fs.access(archivo);
      console.log(`   ✅ ${archivo}`);
      resultados.archivos.encontrados++;
    } catch {
      console.log(`   ❌ ${archivo} - NO ENCONTRADO`);
    }
  }

  // 2. Verificar datos de scraping
  console.log('\n📊 Verificando datos de scraping...');
  try {
    const dataDir = join(process.cwd(), 'data', 'scraping');
    const modules = await fs.readdir(dataDir).catch(() => []);
    
    for (const module of modules) {
      const modulePath = join(dataDir, module);
      const files = await fs.readdir(modulePath).catch(() => []);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = join(modulePath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          if (data.data && data.data.offers) {
            resultados.datos.ofertas += data.data.offers.length;
            resultados.datos.total++;
            console.log(`   ✅ ${module}/${file} - ${data.data.offers.length} ofertas`);
          }
        }
      }
    }
  } catch (error) {
    console.log(`   ⚠️ Error leyendo datos: ${error.message}`);
  }

  // 3. Verificar servicios
  console.log('\n🌐 Verificando servicios...');
  const servicios = [
    { nombre: 'MinIO API', url: 'http://localhost:9010/minio/health/live', puerto: 9010 },
    { nombre: 'MinIO Console', url: 'http://localhost:9011', puerto: 9011 }
  ];

  resultados.servicios.total = servicios.length;

  for (const servicio of servicios) {
    try {
      await axios.get(servicio.url, { timeout: 3000 });
      console.log(`   ✅ ${servicio.nombre} - Puerto ${servicio.puerto}`);
      resultados.servicios.activos++;
    } catch {
      console.log(`   ❌ ${servicio.nombre} - Puerto ${servicio.puerto} NO DISPONIBLE`);
    }
  }

  // 4. Verificar configuración del bot
  console.log('\n🤖 Verificando configuración del bot...');
  try {
    const envContent = await fs.readFile('.env', 'utf-8');
    if (envContent.includes('TELEGRAM_BOT_TOKEN=')) {
      console.log('   ✅ Token de Telegram configurado');
      resultados.bot.configurado = true;
    } else {
      console.log('   ⚠️ Token de Telegram no encontrado en .env');
    }
  } catch {
    console.log('   ⚠️ Archivo .env no encontrado');
  }

  // 5. Verificar que el bot puede obtener ofertas
  console.log('\n📱 Verificando funcionalidad del bot...');
  try {
    // Importar y probar el bot
    const { TelegramBot } = await import('./src/telegram-bot/index.js');
    const bot = new TelegramBot();
    const ofertas = await bot.getOffers();
    
    if (ofertas && ofertas.length > 0) {
      console.log(`   ✅ Bot puede obtener ${ofertas.length} ofertas`);
      console.log(`   ✅ Ofertas con imágenes: ${ofertas.filter(o => o.imageUrl).length}/${ofertas.length}`);
      resultados.bot.funcionando = true;
    } else {
      console.log('   ❌ Bot no puede obtener ofertas');
    }
  } catch (error) {
    console.log(`   ⚠️ Error probando bot: ${error.message}`);
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));
  
  console.log(`📁 Archivos: ${resultados.archivos.encontrados}/${resultados.archivos.total} encontrados`);
  console.log(`📊 Datos: ${resultados.datos.total} archivos con ${resultados.datos.ofertas} ofertas totales`);
  console.log(`🌐 Servicios: ${resultados.servicios.activos}/${resultados.servicios.total} activos`);
  console.log(`🤖 Bot: ${resultados.bot.configurado ? 'Configurado' : 'No configurado'} | ${resultados.bot.funcionando ? 'Funcionando' : 'No funcionando'}`);

  const todoOK = 
    resultados.archivos.encontrados === resultados.archivos.total &&
    resultados.datos.ofertas > 0 &&
    resultados.servicios.activos >= 1 &&
    resultados.bot.configurado;

  console.log('\n' + (todoOK ? '✅ SISTEMA VERIFICADO CORRECTAMENTE' : '⚠️ SISTEMA REQUIERE ATENCIÓN'));
  
  if (todoOK) {
    console.log('\n🚀 El sistema está listo para usar:');
    console.log('   📊 Panel Admin: http://localhost:3000/admin');
    console.log('   🗄️ MinIO Console: http://localhost:9011');
    console.log('   📱 Mini App: http://localhost:3000/telegram-app');
  } else {
    console.log('\n🔧 Para solucionar problemas:');
    console.log('   1. Ejecuta: ./ejecutar-sistema.sh');
    console.log('   2. Revisa: SOLUCION-BOT-IMAGENES.md');
    console.log('   3. Verifica variables de entorno en .env');
  }
}

// Ejecutar verificación
verificarSistema().catch(console.error);
