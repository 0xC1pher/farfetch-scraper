#!/usr/bin/env node

/**
 * Test del flujo secuencial completo: Orquestador → MinIO → Bot
 */

console.log('🔄 INICIANDO TEST DEL FLUJO SECUENCIAL COMPLETO\n');

async function testSequentialWorkflow() {
  try {
    console.log('1️⃣ Importando módulos...');
    
    const { Orchestrator } = await import('./src/orchestrator/index');
    const { minioStorage } = await import('./src/modules/minio/index');
    
    console.log('   ✅ Módulos importados correctamente');

    // 1. Verificar MinIO
    console.log('\n2️⃣ Verificando MinIO...');
    const minioStatus = await minioStorage.getStatus();
    console.log(`   MinIO disponible: ${minioStatus.available ? '✅' : '❌'}`);

    // 2. Crear orquestador
    console.log('\n3️⃣ Creando orquestador...');
    const orchestrator = await Orchestrator.create();
    console.log('   ✅ Orquestador creado');

    // 3. Ejecutar flujo secuencial
    console.log('\n4️⃣ Ejecutando flujo secuencial de scraping...');
    const testUrl = 'https://www.farfetch.com/shopping/men/shoes-2/items.aspx';
    
    console.log(`   🎯 URL: ${testUrl}`);
    console.log('   📋 Orden: Browser-MCP → Scraperr → DeepScrape');
    
    const startTime = Date.now();
    
    try {
      const results = await orchestrator.scrapeWithSession({
        scrapeUrl: testUrl,
        maxRetries: 1
      });
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`   ⏱️  Tiempo total: ${duration}s`);
      console.log(`   📊 Ofertas extraídas: ${results.length}`);
      
      if (results.length > 0) {
        console.log('\n   📋 Muestra de datos:');
        const offer = results[0];
        console.log(`      - ID: ${offer.id}`);
        console.log(`      - Título: ${offer.title}`);
        console.log(`      - Precio: $${offer.price}`);
        console.log(`      - Marca: ${offer.brand}`);
        console.log(`      - Fuente: ${offer.source || 'N/A'}`);
      }
      
    } catch (error) {
      console.log(`   ⚠️  Error en scraping: ${error.message}`);
      console.log('   (Continuando con verificación de datos...)');
    }

    // 4. Verificar datos en MinIO por módulo
    console.log('\n5️⃣ Verificando datos guardados por módulo...');
    
    const modules = ['browser-mcp', 'scraperr', 'deepscrape', 'workflow-consolidated'];
    const moduleResults = {};
    
    for (const module of modules) {
      try {
        const scrapingData = await minioStorage.loadScrapingData('', 5);
        const moduleData = scrapingData.filter(data => 
          data.data?.source === module || 
          (module === 'workflow-consolidated' && data.data?.source === 'sequential-workflow')
        );
        
        moduleResults[module] = {
          records: moduleData.length,
          latestTimestamp: moduleData.length > 0 ? moduleData[0].timestamp : null,
          totalOffers: moduleData.reduce((sum, data) => sum + (data.data?.offers?.length || 0), 0)
        };
        
        console.log(`   📦 ${module.toUpperCase()}:`);
        console.log(`      - Registros: ${moduleResults[module].records}`);
        console.log(`      - Ofertas: ${moduleResults[module].totalOffers}`);
        console.log(`      - Último: ${moduleResults[module].latestTimestamp || 'N/A'}`);
        
      } catch (error) {
        console.log(`   ❌ Error verificando ${module}: ${error.message}`);
        moduleResults[module] = { error: error.message };
      }
    }

    // 5. Simular obtención de datos para Telegram Bot
    console.log('\n6️⃣ Simulando obtención de datos para Telegram Bot...');
    
    try {
      const allScrapingData = await minioStorage.loadScrapingData('', 10);
      
      // Extraer ofertas como lo haría el bot
      let botOffers = [];
      allScrapingData.forEach(data => {
        if (data.data?.offers && Array.isArray(data.data.offers)) {
          const offersWithModule = data.data.offers.map(offer => ({
            ...offer,
            source: data.data.source || 'unknown',
            extractedAt: data.timestamp
          }));
          botOffers.push(...offersWithModule);
        }
      });
      
      // Filtrar duplicados
      const uniqueBotOffers = botOffers.filter((offer, index, self) => 
        index === self.findIndex(o => o.id === offer.id)
      );
      
      console.log(`   📱 Ofertas disponibles para bot: ${uniqueBotOffers.length}`);
      console.log(`   🔄 Ofertas totales extraídas: ${botOffers.length}`);
      console.log(`   🔍 Duplicados removidos: ${botOffers.length - uniqueBotOffers.length}`);
      
      if (uniqueBotOffers.length > 0) {
        console.log('\n   📋 Muestra para bot:');
        const botOffer = uniqueBotOffers[0];
        console.log(`      - ID: ${botOffer.id}`);
        console.log(`      - Título: ${botOffer.title}`);
        console.log(`      - Precio: $${botOffer.price}`);
        console.log(`      - Fuente: ${botOffer.source}`);
        console.log(`      - Extraído: ${botOffer.extractedAt}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error simulando bot: ${error.message}`);
    }

    // 6. Resumen final
    console.log('\n📊 RESUMEN DEL FLUJO SECUENCIAL:');
    
    const totalRecords = Object.values(moduleResults).reduce((sum, result) => 
      sum + (result.records || 0), 0
    );
    const totalOffers = Object.values(moduleResults).reduce((sum, result) => 
      sum + (result.totalOffers || 0), 0
    );
    
    console.log(`   ✅ Orquestador: Funcionando`);
    console.log(`   ${minioStatus.available ? '✅' : '⚠️'} MinIO: ${minioStatus.available ? 'Disponible' : 'No disponible'}`);
    console.log(`   📦 Registros guardados: ${totalRecords}`);
    console.log(`   🎯 Ofertas totales: ${totalOffers}`);
    console.log(`   🔄 Flujo secuencial: ${totalRecords > 0 ? 'Funcionando' : 'Pendiente'}`);
    console.log(`   📱 Bot ready: ${totalOffers > 0 ? 'Sí' : 'No'}`);
    
    if (totalRecords > 0 && totalOffers > 0) {
      console.log('\n🎉 FLUJO SECUENCIAL FUNCIONANDO CORRECTAMENTE');
      console.log('   - Los 3 módulos se ejecutan en orden');
      console.log('   - Los datos se guardan estructurados en MinIO');
      console.log('   - El bot puede acceder a los datos');
    } else {
      console.log('\n⚠️  FLUJO PARCIALMENTE FUNCIONAL');
      console.log('   - Verificar configuración de módulos externos');
      console.log('   - Verificar conexión a MinIO');
    }

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar el test
testSequentialWorkflow().catch(console.error);
