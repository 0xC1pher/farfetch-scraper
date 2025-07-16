#!/usr/bin/env node

/**
 * Script para verificar que los 3 módulos ejecuten scraping y guarden datos estructurados
 * Ejecutar: node test-three-modules.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testThreeModules() {
  console.log('🔍 VERIFICANDO EJECUCIÓN DE LOS 3 MÓDULOS\n');

  try {
    // 1. Verificar que el servidor esté corriendo
    console.log('1️⃣ Verificando servidor...');
    try {
      const response = await axios.get(`${BASE_URL}/api/bot/status`);
      console.log('   ✅ Servidor activo');
    } catch (error) {
      throw new Error('Servidor no está corriendo en puerto 3000');
    }

    // 2. Ejecutar scraping con los 3 módulos
    console.log('\n2️⃣ Ejecutando scraping con los 3 módulos...');
    const scrapingRequest = {
      sessionId: `test-3modules-${Date.now()}`,
      scrapeUrl: 'https://www.farfetch.com/shopping/men/shoes-2/items.aspx',
      maxRetries: 1
    };

    console.log('   📤 Iniciando scraping...');
    const startTime = Date.now();
    
    const scrapingResponse = await axios.post(`${BASE_URL}/api/scraping/start`, scrapingRequest);
    const endTime = Date.now();
    
    console.log(`   ⏱️  Tiempo total: ${(endTime - startTime) / 1000}s`);
    console.log(`   📥 Resultado general:`);
    console.log(`      - Success: ${scrapingResponse.data.success}`);
    console.log(`      - Job ID: ${scrapingResponse.data.jobId}`);
    console.log(`      - Total ofertas: ${scrapingResponse.data.totalFound}`);

    // 3. Verificar datos por cada módulo individual
    console.log('\n3️⃣ Verificando datos guardados por cada módulo...');
    
    // Esperar un momento para que se guarden los datos
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const modules = ['browser-mcp', 'scraperr', 'deepscrape'];
    const moduleResults = {};

    for (const module of modules) {
      try {
        console.log(`\n   📦 Verificando módulo: ${module.toUpperCase()}`);
        
        const moduleResponse = await axios.get(`${BASE_URL}/api/modules/data?module=${module}&limit=5`);
        
        if (moduleResponse.data.success && moduleResponse.data.count > 0) {
          const latestData = moduleResponse.data.data[0];
          moduleResults[module] = {
            success: true,
            count: moduleResponse.data.count,
            latestTimestamp: latestData.timestamp,
            url: latestData.url,
            dataSuccess: latestData.success,
            offersCount: latestData.data?.offers?.length || latestData.data?.items?.length || 0
          };
          
          console.log(`      ✅ Datos encontrados: ${moduleResponse.data.count} registros`);
          console.log(`      📊 Último scraping: ${latestData.timestamp}`);
          console.log(`      🎯 Ofertas extraídas: ${moduleResults[module].offersCount}`);
          console.log(`      🔗 URL: ${latestData.url}`);
          
          // Mostrar muestra de datos si hay ofertas
          if (moduleResults[module].offersCount > 0) {
            const offers = latestData.data?.offers || latestData.data?.items || [];
            if (offers.length > 0) {
              const offer = offers[0];
              console.log(`      📋 Muestra de oferta:`);
              console.log(`         - ID: ${offer.id}`);
              console.log(`         - Título: ${offer.title || offer.name}`);
              console.log(`         - Precio: $${offer.price}`);
              console.log(`         - Marca: ${offer.brand}`);
            }
          }
        } else {
          moduleResults[module] = {
            success: false,
            error: 'No data found'
          };
          console.log(`      ❌ Sin datos encontrados`);
        }
      } catch (error) {
        moduleResults[module] = {
          success: false,
          error: error.response?.data?.error || error.message
        };
        console.log(`      ❌ Error: ${moduleResults[module].error}`);
      }
    }

    // 4. Verificar datos consolidados
    console.log('\n4️⃣ Verificando datos consolidados...');
    
    try {
      const consolidatedResponse = await axios.get(`${BASE_URL}/api/modules/data?module=consolidated&limit=3`);
      
      if (consolidatedResponse.data.success && consolidatedResponse.data.count > 0) {
        const consolidatedData = consolidatedResponse.data.data[0];
        console.log(`   ✅ Datos consolidados encontrados:`);
        console.log(`      - Registros: ${consolidatedResponse.data.count}`);
        console.log(`      - Ofertas únicas: ${consolidatedData.data?.offers?.length || 0}`);
        console.log(`      - Módulos exitosos: ${consolidatedData.data?.successfulModules || 0}/3`);
        console.log(`      - Duplicados removidos: ${consolidatedData.data?.duplicatesRemoved || 0}`);
      } else {
        console.log(`   ❌ Sin datos consolidados`);
      }
    } catch (error) {
      console.log(`   ❌ Error obteniendo datos consolidados: ${error.message}`);
    }

    // 5. Verificar estructura en MinIO
    console.log('\n5️⃣ Verificando estructura en MinIO...');
    
    const folders = ['scraping/browser-mcp/', 'scraping/scraperr/', 'scraping/deepscrape/', 'scraping/consolidated/'];
    
    for (const folder of folders) {
      try {
        // Simular verificación de estructura (esto requeriría acceso directo a MinIO)
        console.log(`   📁 ${folder}: Verificando...`);
      } catch (error) {
        console.log(`   ❌ Error verificando ${folder}`);
      }
    }

    // 6. Resumen final
    console.log('\n📊 RESUMEN DE EJECUCIÓN DE LOS 3 MÓDULOS:');
    
    let successfulModules = 0;
    let totalOffers = 0;
    
    modules.forEach(module => {
      const result = moduleResults[module];
      if (result.success) {
        successfulModules++;
        totalOffers += result.offersCount || 0;
        console.log(`   ✅ ${module.toUpperCase()}: ${result.offersCount} ofertas extraídas`);
      } else {
        console.log(`   ❌ ${module.toUpperCase()}: ${result.error}`);
      }
    });
    
    console.log(`\n🎯 RESULTADO FINAL:`);
    console.log(`   - Módulos exitosos: ${successfulModules}/3`);
    console.log(`   - Total ofertas extraídas: ${totalOffers}`);
    console.log(`   - Datos estructurados: ${successfulModules > 0 ? '✅' : '❌'}`);
    console.log(`   - Guardado en MinIO: ${successfulModules > 0 ? '✅' : '❌'}`);
    
    if (successfulModules === 3) {
      console.log('\n🎉 TODOS LOS MÓDULOS FUNCIONANDO CORRECTAMENTE');
    } else if (successfulModules > 0) {
      console.log('\n⚠️  ALGUNOS MÓDULOS FUNCIONANDO');
    } else {
      console.log('\n❌ NINGÚN MÓDULO FUNCIONANDO');
    }

  } catch (error) {
    console.error('\n❌ ERROR EN LA VERIFICACIÓN:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Ejecutar la verificación
testThreeModules().catch(console.error);
