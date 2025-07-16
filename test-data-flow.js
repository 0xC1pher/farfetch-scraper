#!/usr/bin/env node

/**
 * Script para verificar el flujo completo de datos desde scraping hasta MinIO
 * Ejecutar: node test-data-flow.js
 */

import { Orchestrator } from './src/orchestrator/index.js';
import { minioStorage } from './src/modules/minio/index.js';

async function testDataFlow() {
  console.log('🔍 INICIANDO VERIFICACIÓN DEL FLUJO DE DATOS\n');

  try {
    // 1. Verificar estado de MinIO
    console.log('1️⃣ Verificando conexión a MinIO...');
    const minioStatus = await minioStorage.getStatus();
    console.log('   Estado MinIO:', minioStatus);
    
    if (!minioStatus.available) {
      throw new Error('MinIO no está disponible');
    }

    // 2. Crear instancia del orquestador
    console.log('\n2️⃣ Creando instancia del orquestador...');
    const orchestrator = await Orchestrator.create();
    console.log('   ✅ Orquestador creado exitosamente');

    // 3. Ejecutar scraping de prueba
    console.log('\n3️⃣ Ejecutando scraping de prueba...');
    const testUrl = 'https://www.farfetch.com/shopping/men/shoes-2/items.aspx';
    
    const results = await orchestrator.scrapeWithSession({
      scrapeUrl: testUrl,
      maxRetries: 1
    });

    console.log(`   📊 Resultados del scraping: ${results.length} ofertas encontradas`);
    
    if (results.length > 0) {
      console.log('   📋 Muestra de datos extraídos:');
      results.slice(0, 2).forEach((offer, index) => {
        console.log(`   ${index + 1}. ID: ${offer.id}`);
        console.log(`      Título: ${offer.title}`);
        console.log(`      Precio: $${offer.price}`);
        console.log(`      Marca: ${offer.brand}`);
        console.log(`      Imagen: ${offer.imageUrl || 'N/A'}`);
        console.log(`      Estado: ${offer.availability}`);
        console.log(`      Timestamp: ${offer.timestamp}`);
        console.log('');
      });
    }

    // 4. Verificar datos guardados en MinIO
    console.log('4️⃣ Verificando datos guardados en MinIO...');
    
    // Esperar un momento para que se guarden los datos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const scrapingData = await minioStorage.loadScrapingData(testUrl, 5);
    console.log(`   📦 Datos encontrados en MinIO: ${scrapingData.length} registros`);
    
    if (scrapingData.length > 0) {
      console.log('   📋 Muestra de datos en MinIO:');
      scrapingData.slice(0, 1).forEach((data, index) => {
        console.log(`   ${index + 1}. URL: ${data.url}`);
        console.log(`      Ofertas: ${data.data?.offers?.length || 0}`);
        console.log(`      Timestamp: ${data.timestamp}`);
        console.log(`      Fuente: ${data.data?.source || 'múltiples estrategias'}`);
        console.log('');
      });
    }

    // 5. Verificar estructura del bucket
    console.log('5️⃣ Verificando estructura del bucket...');
    const objects = await minioStorage.listObjects('scraping/');
    console.log(`   📁 Objetos en bucket/scraping/: ${objects.length}`);
    
    if (objects.length > 0) {
      console.log('   📋 Últimos archivos creados:');
      objects.slice(-3).forEach((obj, index) => {
        console.log(`   ${index + 1}. ${obj.name} (${obj.size} bytes)`);
      });
    }

    // 6. Verificar API de datos
    console.log('\n6️⃣ Verificando API de datos...');
    const apiData = await minioStorage.getScrapingData(testUrl, 3);
    console.log(`   🔌 Datos disponibles para API: ${apiData.length} registros`);

    // 7. Resumen del flujo
    console.log('\n📊 RESUMEN DEL FLUJO DE DATOS:');
    console.log(`   ✅ Scraping ejecutado: ${results.length} ofertas extraídas`);
    console.log(`   ✅ Datos guardados en MinIO: ${scrapingData.length} registros`);
    console.log(`   ✅ Archivos en bucket: ${objects.length} archivos`);
    console.log(`   ✅ API data disponible: ${apiData.length} registros`);
    
    if (results.length > 0 && scrapingData.length > 0) {
      console.log('\n🎉 FLUJO DE DATOS FUNCIONANDO CORRECTAMENTE');
    } else {
      console.log('\n⚠️  POSIBLES PROBLEMAS EN EL FLUJO DE DATOS');
    }

  } catch (error) {
    console.error('\n❌ ERROR EN EL FLUJO DE DATOS:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Ejecutar el test
testDataFlow().catch(console.error);
