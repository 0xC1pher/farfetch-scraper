#!/usr/bin/env node

/**
 * Script de prueba simple para el bot de Telegram
 */

import { MexaTelegramBot } from './src/telegram-bot/index.ts';

async function testBot() {
  console.log('🧪 Probando bot de Telegram...\n');

  try {
    // Configuración de prueba
    const config = {
      token: process.env.TELEGRAM_BOT_TOKEN || 'demo_token_for_development',
      adminChatIds: ['123456789'],
      maxOffersPerMessage: 3,
      defaultFilters: { maxPrice: 1000, minDiscount: 0 }
    };

    console.log('🤖 Creando instancia del bot...');
    const bot = new MexaTelegramBot(config);

    console.log('📊 Probando obtención de ofertas...');
    const offers = await bot.getPublicOffers({});
    
    console.log(`✅ Ofertas obtenidas: ${offers.length}`);
    
    if (offers.length > 0) {
      console.log('\n📋 Primeras 3 ofertas:');
      offers.slice(0, 3).forEach((offer, index) => {
        console.log(`\n🛍️  Oferta ${index + 1}:`);
        console.log(`   ID: ${offer.id}`);
        console.log(`   Título: ${offer.title}`);
        console.log(`   Precio: €${offer.price}`);
        console.log(`   Marca: ${offer.brand}`);
        console.log(`   Imagen: ${offer.imageUrl || 'SIN IMAGEN'}`);
        console.log(`   Fuente: ${offer.source}`);
      });
      
      const offersWithImages = offers.filter(offer => offer.imageUrl);
      console.log(`\n📊 Ofertas con imágenes: ${offersWithImages.length}/${offers.length}`);
      
      if (offersWithImages.length > 0) {
        console.log('\n✅ El bot PUEDE mostrar imágenes');
        console.log('🔗 URLs de imágenes que se usarán:');
        offersWithImages.slice(0, 3).forEach((offer, index) => {
          console.log(`   ${index + 1}. ${offer.imageUrl}`);
        });
      } else {
        console.log('\n❌ El bot NO puede mostrar imágenes');
      }
    } else {
      console.log('\n⚠️ No hay ofertas disponibles para probar');
    }

  } catch (error) {
    console.error('💥 Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testBot();
