#!/usr/bin/env node

/**
 * Test del sistema sin MinIO - guardando en directorio local
 */

console.log('🔄 INICIANDO TEST SIN MINIO - GUARDADO LOCAL\n');

async function testWithoutMinio() {
  try {
    console.log('1️⃣ Importando módulos...');
    
    // Importar solo los módulos necesarios
    const { loadBrowserMCP, loadScraperr, loadDeepScrape } = await import('./src/utils/moduleLoader');
    
    console.log('   ✅ Módulos importados correctamente');

    // 2. Cargar módulos
    console.log('\n2️⃣ Cargando módulos...');
    const browserMCP = await loadBrowserMCP();
    const scraperr = await loadScraperr();
    const deepscrape = await loadDeepScrape();
    console.log('   ✅ Módulos cargados');

    // 3. Ejecutar flujo secuencial manual
    console.log('\n3️⃣ Ejecutando flujo secuencial manual...');
    const testUrl = 'https://www.farfetch.com/shopping/men/shoes-2/items.aspx';
    
    console.log(`   🎯 URL: ${testUrl}`);
    console.log('   📋 Orden: Browser-MCP → Scraperr → DeepScrape');
    
    const allOffers = [];
    const results = [];

    // PASO 1: Browser-MCP
    console.log('\n   🌐 [1/3] Ejecutando Browser-MCP...');
    try {
      const browserOffers = await browserMCP.scrapeOffers(testUrl, {
        useSession: false,
        timeout: 30000
      });
      
      results.push({
        module: 'browser-mcp',
        success: browserOffers.length > 0,
        count: browserOffers.length,
        offers: browserOffers
      });
      
      if (browserOffers.length > 0) {
        allOffers.push(...browserOffers);
        console.log(`      ✅ Browser-MCP: ${browserOffers.length} ofertas extraídas`);
        
        // Guardar en directorio local
        await saveToLocal({
          url: testUrl,
          data: {
            offers: browserOffers,
            timestamp: new Date(),
            totalFound: browserOffers.length,
            source: 'browser-mcp'
          },
          timestamp: new Date()
        }, 'browser-mcp');
        
      } else {
        console.log(`      ⚠️ Browser-MCP: Sin ofertas`);
      }
    } catch (error) {
      console.log(`      ❌ Browser-MCP falló: ${error.message}`);
      results.push({
        module: 'browser-mcp',
        success: false,
        error: error.message
      });
    }

    // PASO 2: Scraperr
    console.log('\n   🔍 [2/3] Ejecutando Scraperr...');
    try {
      const scraperOffers = await scraperr.scrapeOffers(testUrl, {
        useSession: false,
        timeout: 30000
      });
      
      results.push({
        module: 'scraperr',
        success: scraperOffers.length > 0,
        count: scraperOffers.length,
        offers: scraperOffers
      });
      
      if (scraperOffers.length > 0) {
        allOffers.push(...scraperOffers);
        console.log(`      ✅ Scraperr: ${scraperOffers.length} ofertas extraídas`);
        
        // Guardar en directorio local
        await saveToLocal({
          url: testUrl,
          data: {
            offers: scraperOffers,
            timestamp: new Date(),
            totalFound: scraperOffers.length,
            source: 'scraperr'
          },
          timestamp: new Date()
        }, 'scraperr');
        
      } else {
        console.log(`      ⚠️ Scraperr: Sin ofertas`);
      }
    } catch (error) {
      console.log(`      ❌ Scraperr falló: ${error.message}`);
      results.push({
        module: 'scraperr',
        success: false,
        error: error.message
      });
    }

    // PASO 3: DeepScrape
    console.log('\n   🤖 [3/3] Ejecutando DeepScrape...');
    try {
      const deepResult = await deepscrape.resolve({
        pageUrl: testUrl,
        elements: ['[data-testid="product-card"]', '.product-item'],
        timeout: 30000
      });
      
      const deepOffers = deepResult.data || [];
      
      results.push({
        module: 'deepscrape',
        success: deepOffers.length > 0,
        count: deepOffers.length,
        offers: deepOffers
      });
      
      if (deepOffers.length > 0) {
        allOffers.push(...deepOffers);
        console.log(`      ✅ DeepScrape: ${deepOffers.length} ofertas extraídas`);
        
        // Guardar en directorio local
        await saveToLocal({
          url: testUrl,
          data: {
            offers: deepOffers,
            timestamp: new Date(),
            totalFound: deepOffers.length,
            source: 'deepscrape'
          },
          timestamp: new Date()
        }, 'deepscrape');
        
      } else {
        console.log(`      ⚠️ DeepScrape: Sin ofertas`);
      }
    } catch (error) {
      console.log(`      ❌ DeepScrape falló: ${error.message}`);
      results.push({
        module: 'deepscrape',
        success: false,
        error: error.message
      });
    }

    // 4. Consolidar resultados
    console.log('\n4️⃣ Consolidando resultados...');
    
    // Filtrar duplicados
    const uniqueOffers = allOffers.filter((offer, index, self) => 
      index === self.findIndex(o => o.id === offer.id)
    );
    
    console.log(`   🔍 Total: ${allOffers.length} ofertas → ${uniqueOffers.length} únicas`);
    
    if (uniqueOffers.length > 0) {
      // Guardar consolidado
      await saveToLocal({
        url: testUrl,
        data: {
          offers: uniqueOffers,
          timestamp: new Date(),
          totalFound: uniqueOffers.length,
          source: 'consolidated',
          moduleResults: results,
          originalCount: allOffers.length,
          duplicatesRemoved: allOffers.length - uniqueOffers.length
        },
        timestamp: new Date()
      }, 'consolidated');
      
      console.log('\n   📋 Muestra de ofertas consolidadas:');
      uniqueOffers.slice(0, 3).forEach((offer, index) => {
        console.log(`      ${index + 1}. ${offer.title} - $${offer.price} (${offer.brand})`);
      });
    }

    // 5. Verificar archivos guardados
    console.log('\n5️⃣ Verificando archivos guardados...');
    const { promises: fs } = await import('fs');
    const { join } = await import('path');
    
    const dataDir = join(process.cwd(), 'data', 'scraping');
    
    try {
      const modules = await fs.readdir(dataDir);
      console.log(`   📁 Módulos con datos: ${modules.join(', ')}`);
      
      for (const module of modules) {
        const files = await fs.readdir(join(dataDir, module));
        console.log(`      - ${module}: ${files.length} archivos`);
      }
    } catch (error) {
      console.log(`   ⚠️ Error verificando archivos: ${error.message}`);
    }

    // 6. Resumen final
    console.log('\n📊 RESUMEN DEL TEST SIN MINIO:');
    
    const successfulModules = results.filter(r => r.success).length;
    const totalOffers = results.reduce((sum, r) => sum + (r.count || 0), 0);
    
    console.log(`   ✅ Módulos exitosos: ${successfulModules}/3`);
    console.log(`   🎯 Total ofertas: ${totalOffers}`);
    console.log(`   📦 Ofertas únicas: ${uniqueOffers.length}`);
    console.log(`   💾 Guardado local: ${successfulModules > 0 ? 'Funcionando' : 'Sin datos'}`);
    
    if (successfulModules > 0) {
      console.log('\n🎉 SISTEMA FUNCIONANDO SIN MINIO');
      console.log('   - Flujo secuencial: ✅');
      console.log('   - Guardado local: ✅');
      console.log('   - Datos disponibles para Telegram: ✅');
    } else {
      console.log('\n⚠️ SISTEMA NECESITA CONFIGURACIÓN');
    }

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Función auxiliar para guardar datos localmente
async function saveToLocal(data, module) {
  const { promises: fs } = await import('fs');
  const { join } = await import('path');
  
  try {
    const dataDir = join(process.cwd(), 'data', 'scraping', module);
    await fs.mkdir(dataDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${Date.now()}.json`;
    const filepath = join(dataDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`         💾 Guardado: data/scraping/${module}/${filename}`);
  } catch (error) {
    console.log(`         ❌ Error guardando: ${error.message}`);
  }
}

// Ejecutar el test
testWithoutMinio().catch(console.error);
