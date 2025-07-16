#!/usr/bin/env node

/**
 * Test simple del orquestador
 */

console.log('🔍 INICIANDO TEST SIMPLE DEL ORQUESTADOR\n');

async function simpleTest() {
  try {
    console.log('1️⃣ Importando módulos...');
    
    // Importar solo el orquestador
    const { Orchestrator } = await import('./src/orchestrator/index');
    console.log('   ✅ Orquestador importado');

    console.log('\n2️⃣ Creando instancia del orquestador...');
    const orchestrator = await Orchestrator.create();
    console.log('   ✅ Orquestador creado exitosamente');

    console.log('\n3️⃣ Probando scraping básico...');
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

    if (results.length > 0) {
      console.log('\n4️⃣ Muestra de datos extraídos:');
      const offer = results[0];
      console.log(`   - ID: ${offer.id}`);
      console.log(`   - Título: ${offer.title}`);
      console.log(`   - Precio: $${offer.price}`);
      console.log(`   - Marca: ${offer.brand}`);
      console.log(`   - Estado: ${offer.availability}`);
    }

    console.log('\n🎉 TEST COMPLETADO EXITOSAMENTE');
    console.log(`   ✅ Orquestador funcionando`);
    console.log(`   ✅ ${results.length} ofertas extraídas`);
    console.log(`   ⏱️  Tiempo: ${duration}s`);

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST:', error.message);
    console.error('Stack:', error.stack);
  }
}

simpleTest().catch(console.error);
