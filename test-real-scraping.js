#!/usr/bin/env node

/**
 * Script para probar el scraping real de datos de la web
 * Verifica que los módulos estén extrayendo datos reales, no mock
 */

import { Orchestrator } from './src/orchestrator/index.js';
import { SimpleOrchestrator } from './src/orchestrator/simple-orchestrator.js';
import { promises as fs } from 'fs';
import { join } from 'path';

async function testRealScraping() {
  console.log('🧪 Probando scraping real de datos de la web...\n');

  try {
    // 1. Limpiar datos anteriores
    console.log('🧹 Limpiando datos anteriores...');
    const dataDir = join(process.cwd(), 'data', 'scraping');
    try {
      await fs.rm(dataDir, { recursive: true, force: true });
      await fs.mkdir(dataDir, { recursive: true });
      console.log('   ✅ Datos anteriores limpiados');
    } catch (error) {
      console.log('   ⚠️ Error limpiando datos:', error.message);
    }

    // 2. Crear instancia del orquestador
    console.log('\n🎯 Creando instancia del orquestador...');
    const orchestrator = await SimpleOrchestrator.create();
    console.log('   ✅ Orquestador creado exitosamente');

    // 3. Verificar estado de los módulos
    console.log('\n📊 Verificando estado de los módulos...');
    const moduleStatus = orchestrator.getModuleStatus();
    console.log('   Browser-MCP:', moduleStatus.browserMCP ? '✅ Cargado' : '❌ No cargado');
    console.log('   Scraperr:', moduleStatus.scraperr ? '✅ Cargado' : '❌ No cargado');
    console.log('   DeepScrape:', moduleStatus.deepscrape ? '✅ Cargado' : '❌ No cargado');

    // 4. Ejecutar scraping real de Farfetch women sale
    console.log('\n🌐 Ejecutando scraping real de Farfetch women sale...');
    const testUrl = 'https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx';
    console.log(`   URL objetivo: ${testUrl}`);

    const startTime = Date.now();
    const results = await orchestrator.scrapeWithSession({
      scrapeUrl: testUrl,
      maxRetries: 1
    });
    const endTime = Date.now();

    console.log(`\n⏱️ Tiempo de ejecución: ${(endTime - startTime) / 1000}s`);
    console.log(`📦 Total de ofertas extraídas: ${results.length}`);

    // 5. Analizar resultados
    if (results.length > 0) {
      console.log('\n🔍 Análisis de resultados:');
      
      // Verificar si son datos reales o mock
      const mockIndicators = [
        'fallback',
        'demo',
        'test',
        'placeholder',
        'example'
      ];

      let realDataCount = 0;
      let mockDataCount = 0;
      let withImagesCount = 0;
      let uniqueBrands = new Set();
      let priceRange = { min: Infinity, max: 0 };

      results.forEach(offer => {
        const isMock = mockIndicators.some(indicator => 
          offer.id.toLowerCase().includes(indicator) ||
          offer.title.toLowerCase().includes(indicator) ||
          (offer.imageUrl && offer.imageUrl.includes('placeholder'))
        );

        if (isMock) {
          mockDataCount++;
        } else {
          realDataCount++;
        }

        if (offer.imageUrl) {
          withImagesCount++;
        }

        if (offer.brand) {
          uniqueBrands.add(offer.brand);
        }

        if (offer.price > 0) {
          priceRange.min = Math.min(priceRange.min, offer.price);
          priceRange.max = Math.max(priceRange.max, offer.price);
        }
      });

      console.log(`   📊 Datos reales: ${realDataCount}/${results.length}`);
      console.log(`   🎭 Datos mock: ${mockDataCount}/${results.length}`);
      console.log(`   🖼️ Con imágenes: ${withImagesCount}/${results.length}`);
      console.log(`   🏷️ Marcas únicas: ${uniqueBrands.size}`);
      console.log(`   💰 Rango de precios: €${priceRange.min} - €${priceRange.max}`);

      // Mostrar algunas ofertas de ejemplo
      console.log('\n📋 Ejemplos de ofertas extraídas:');
      results.slice(0, 3).forEach((offer, i) => {
        console.log(`   ${i + 1}. ${offer.title}`);
        console.log(`      Marca: ${offer.brand}`);
        console.log(`      Precio: €${offer.price} (antes: €${offer.originalPrice})`);
        console.log(`      Descuento: ${offer.discount}%`);
        console.log(`      ID: ${offer.id}`);
        console.log(`      Imagen: ${offer.imageUrl ? '✅ Sí' : '❌ No'}`);
        console.log('');
      });

      // 6. Verificar datos guardados
      console.log('💾 Verificando datos guardados...');
      try {
        const modules = await fs.readdir(dataDir);
        console.log(`   📁 Módulos con datos: ${modules.join(', ')}`);

        for (const module of modules) {
          const moduleDir = join(dataDir, module);
          const files = await fs.readdir(moduleDir);
          const jsonFiles = files.filter(f => f.endsWith('.json'));
          console.log(`   📄 ${module}: ${jsonFiles.length} archivos`);

          if (jsonFiles.length > 0) {
            const latestFile = jsonFiles.sort().reverse()[0];
            const content = await fs.readFile(join(moduleDir, latestFile), 'utf-8');
            const data = JSON.parse(content);
            const offerCount = data.data?.offers?.length || 0;
            console.log(`      └─ Último archivo: ${offerCount} ofertas`);
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Error verificando datos guardados: ${error.message}`);
      }

      // 7. Evaluación final
      console.log('\n🎯 Evaluación final:');
      
      const realDataPercentage = (realDataCount / results.length) * 100;
      const withImagesPercentage = (withImagesCount / results.length) * 100;

      if (realDataPercentage >= 80) {
        console.log('   ✅ EXCELENTE: Mayoría de datos son reales');
      } else if (realDataPercentage >= 50) {
        console.log('   ⚠️ ACEPTABLE: Mezcla de datos reales y mock');
      } else {
        console.log('   ❌ PROBLEMA: Mayoría de datos son mock');
      }

      if (withImagesPercentage >= 70) {
        console.log('   ✅ BUENO: Mayoría de ofertas tienen imágenes');
      } else {
        console.log('   ⚠️ MEJORABLE: Pocas ofertas tienen imágenes');
      }

      if (uniqueBrands.size >= 5) {
        console.log('   ✅ DIVERSO: Buena variedad de marcas');
      } else {
        console.log('   ⚠️ LIMITADO: Poca variedad de marcas');
      }

      console.log('\n🎉 Prueba de scraping real completada exitosamente!');
      
    } else {
      console.log('\n❌ No se extrajeron ofertas. Posibles problemas:');
      console.log('   - Los módulos externos no están funcionando');
      console.log('   - La URL objetivo está bloqueando el scraping');
      console.log('   - Problemas de conectividad');
      console.log('   - Los selectores necesitan actualización');
    }

  } catch (error) {
    console.error('\n💥 Error durante la prueba:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Ejecutar la prueba
if (import.meta.url === `file://${process.argv[1]}`) {
  testRealScraping().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

export { testRealScraping };
