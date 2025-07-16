#!/usr/bin/env node

/**
 * Test rápido para verificar si el bot puede obtener ofertas
 */

console.log('🤖 TEST RÁPIDO DEL BOT ARREGLADO\n');

async function testBotQuick() {
  try {
    console.log('1️⃣ Probando API de ofertas...');
    
    const response = await fetch('http://localhost:3001/api/offers/local?limit=3');
    const data = await response.json();
    
    if (data.success && data.offers && data.offers.length > 0) {
      console.log(`   ✅ API funcionando: ${data.offers.length} ofertas`);
      console.log(`   📊 Total disponible: ${data.totalFound}`);
      
      console.log('\n2️⃣ Muestra de ofertas:');
      data.offers.forEach((offer, index) => {
        console.log(`   ${index + 1}. ${offer.title} - $${offer.price} (${offer.brand})`);
      });
      
      console.log('\n✅ EL BOT AHORA PUEDE OBTENER OFERTAS REALES');
      console.log('📱 Prueba enviando /search al bot en Telegram');
      
    } else {
      console.log('   ❌ API no retorna ofertas');
      console.log(`   📊 Respuesta: ${JSON.stringify(data, null, 2)}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBotQuick().catch(console.error);
