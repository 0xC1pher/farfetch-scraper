#!/usr/bin/env node

/**
 * Script para probar que el bot puede enviar imágenes reales de Farfetch
 */

import { MexaTelegramBot } from './src/telegram-bot/index.ts';
import axios from 'axios';

async function testBotRealImages() {
  console.log('🧪 Probando bot con imágenes REALES de Farfetch...\n');

  try {
    // Configuración del bot
    const config = {
      token: process.env.TELEGRAM_BOT_TOKEN || 'demo_token_for_development',
      adminChatIds: ['123456789'],
      maxOffersPerMessage: 3,
      defaultFilters: { maxPrice: 1000, minDiscount: 0 }
    };

    console.log('🤖 Creando instancia del bot...');
    const bot = new MexaTelegramBot(config);

    console.log('📊 Obteniendo ofertas...');
    const offers = await bot.getPublicOffers({});
    
    console.log(`✅ Ofertas obtenidas: ${offers.length}`);
    
    if (offers.length > 0) {
      console.log('\n🖼️ Probando descarga de imágenes reales de Farfetch:');
      
      for (let i = 0; i < Math.min(3, offers.length); i++) {
        const offer = offers[i];
        console.log(`\n📸 Probando imagen ${i + 1}:`);
        console.log(`   Producto: ${offer.title}`);
        console.log(`   URL: ${offer.imageUrl}`);
        
        if (offer.imageUrl) {
          try {
            console.log('   🔄 Descargando imagen...');
            const response = await axios.get(offer.imageUrl, { 
              responseType: 'arraybuffer',
              timeout: 10000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            
            const imageSize = response.data.byteLength;
            console.log(`   ✅ Imagen descargada: ${imageSize} bytes`);
            console.log(`   📊 Tipo de contenido: ${response.headers['content-type']}`);
            
            if (imageSize > 0) {
              console.log('   🎉 ¡Imagen válida y descargable!');
            } else {
              console.log('   ❌ Imagen vacía');
            }
            
          } catch (error) {
            console.log(`   ❌ Error descargando imagen: ${error.message}`);
            console.log('   ⚠️ La URL puede no ser válida o la imagen no existe');
          }
        } else {
          console.log('   ❌ No hay URL de imagen');
        }
      }
      
      console.log('\n📊 RESUMEN:');
      const offersWithImages = offers.filter(offer => offer.imageUrl);
      console.log(`   Total ofertas: ${offers.length}`);
      console.log(`   Ofertas con imágenes: ${offersWithImages.length}`);
      
      if (offersWithImages.length > 0) {
        console.log('\n✅ El bot está configurado para mostrar imágenes de Farfetch');
        console.log('🔗 Ejemplos de URLs que usará:');
        offersWithImages.slice(0, 3).forEach((offer, index) => {
          console.log(`   ${index + 1}. ${offer.imageUrl}`);
        });
      } else {
        console.log('\n❌ El bot NO tiene imágenes válidas');
      }
      
    } else {
      console.log('\n⚠️ No hay ofertas disponibles para probar');
    }

  } catch (error) {
    console.error('💥 Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testBotRealImages();
