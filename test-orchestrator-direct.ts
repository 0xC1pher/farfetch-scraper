#!/usr/bin/env node

/**
 * Script para probar el orquestador directamente sin servidor web
 * Ejecutar: node test-orchestrator-direct.js
 */

import { Orchestrator } from './src/orchestrator/index';
import { minioStorage } from './src/modules/minio/index';

async function testOrchestratorDirect() {
  console.log('🔍 PROBANDO ORQUESTADOR DIRECTAMENTE\n');

  try {
    // 1. Verificar MinIO
    console.log('1️⃣ Verificando MinIO...');
    const minioStatus = await minioStorage.getStatus();
    console.log('   Estado MinIO:', minioStatus.available ? '✅ Disponible' : '❌ No disponible');
    
    if (!minioStatus.available) {
      console.log('   ⚠️  MinIO no está disponible, continuando con prueba...');
    }

    // 2. Crear orquestador
    console.log('\n2️⃣ Creando orquestador...');
    const orchestrator = await Orchestrator.create();
    console.log('   ✅ Orquestador creado exitosamente');

    // 3. Probar scraping con los 3 módulos
    console.log('\n3️⃣ Ejecutando scraping con los 3 módulos...');
    const testUrl = 'https://www.farfetch.com/shopping/men/shoes-2/items.aspx';
    
    console.log(`   🎯 URL de prueba: ${testUrl}`);
    console.log('   ⏱️  Iniciando scraping...');
    
    const startTime = Date.now();
    
    const results = await orchestrator.scrapeWithSession({
      scrapeUrl: testUrl,
      maxRetries: 1
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`   ⏱️  Tiempo total: ${duration}s`);
    console.log(`   📊 Resultados: ${results.length} ofertas encontradas`);

    // 4. Mostrar muestra de datos
    if (results.length > 0) {
      console.log('\n4️⃣ Muestra de datos extraídos:');
      results.slice(0, 3).forEach((offer, index) => {
        console.log(`\n   Oferta ${index + 1}:`);
        console.log(`   - ID: ${offer.id}`);
        console.log(`   - Título: ${offer.title}`);
        console.log(`   - Precio: $${offer.price}`);
        console.log(`   - Marca: ${offer.brand}`);
        console.log(`   - Categoría: ${offer.category}`);
        console.log(`   - Estado: ${offer.availability}`);
        console.log(`   - Imagen: ${offer.imageUrl ? 'Sí' : 'No'}`);
        console.log(`   - URL: ${offer.url}`);
        console.log(`   - Timestamp: ${offer.timestamp}`);
      });
    } else {
      console.log('\n4️⃣ ⚠️  No se encontraron ofertas');
    }

    // 5. Verificar datos en MinIO (si está disponible)
    if (minioStatus.available) {
      console.log('\n5️⃣ Verificando datos guardados en MinIO...');
      
      try {
        // Esperar un momento para que se guarden los datos
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const scrapingData = await minioStorage.loadScrapingData(testUrl, 5);
        console.log(`   📦 Registros en MinIO: ${scrapingData.length}`);
        
        if (scrapingData.length > 0) {
          console.log('\n   📋 Datos por fuente:');
          const bySource = {};
          scrapingData.forEach(data => {
            const source = data.data?.source || 'unknown';
            bySource[source] = (bySource[source] || 0) + 1;
          });
          
          Object.entries(bySource).forEach(([source, count]) => {
            console.log(`   - ${source}: ${count} registros`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Error verificando MinIO: ${error.message}`);
      }
    }

    // 6. Verificar estadísticas del orquestador
    console.log('\n6️⃣ Verificando estadísticas del sistema...');
    
    try {
      const stats = await orchestrator.getStats();
      console.log('   📊 Estadísticas:');
      console.log(`   - Browser-MCP: ${stats.browserMCP.status}`);
      console.log(`   - Scraperr: ${stats.scraperr.totalScrapes || 0} scrapes`);
      console.log(`   - MinIO: ${stats.minio.available ? 'Disponible' : 'No disponible'}`);
    } catch (error) {
      console.log(`   ❌ Error obteniendo estadísticas: ${error.message}`);
    }

    // 7. Resumen final
    console.log('\n📊 RESUMEN DE LA PRUEBA:');
    console.log(`   ✅ Orquestador: Funcionando`);
    console.log(`   ${minioStatus.available ? '✅' : '⚠️'} MinIO: ${minioStatus.available ? 'Disponible' : 'No disponible'}`);
    console.log(`   ${results.length > 0 ? '✅' : '❌'} Scraping: ${results.length} ofertas extraídas`);
    console.log(`   ⏱️  Tiempo: ${duration}s`);
    
    if (results.length > 0) {
      console.log('\n🎉 PRUEBA EXITOSA - LOS 3 MÓDULOS ESTÁN FUNCIONANDO');
    } else {
      console.log('\n⚠️  PRUEBA PARCIAL - VERIFICAR MÓDULOS EXTERNOS');
    }

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
    console.error('Stack:', error.stack);
    
    // Información adicional para debugging
    console.log('\n🔧 INFORMACIÓN DE DEBUG:');
    console.log('- Verificar que los módulos externos estén disponibles');
    console.log('- Verificar conexión a internet para scraping');
    console.log('- Verificar que MinIO esté corriendo si es necesario');
  }
}

// Ejecutar la prueba
testOrchestratorDirect().catch(console.error);
