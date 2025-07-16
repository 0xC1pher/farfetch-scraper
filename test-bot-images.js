#!/usr/bin/env node

/**
 * Script de prueba para verificar que el bot puede leer las imágenes de los productos
 */

import { promises as fs } from 'fs';
import { join } from 'path';

async function testBotImages() {
  console.log('🧪 Probando lectura de imágenes del bot...\n');

  try {
    const dataDir = join(process.cwd(), 'data', 'scraping');
    
    // Verificar si el directorio existe
    try {
      await fs.access(dataDir);
      console.log('✅ Directorio de datos encontrado:', dataDir);
    } catch {
      console.log('❌ No hay directorio de datos');
      return;
    }

    // Obtener datos de todos los módulos
    let allOffers = [];
    const modules = await fs.readdir(dataDir);
    console.log(`📁 Módulos encontrados: ${modules.join(', ')}\n`);

    for (const module of modules) {
      console.log(`🔍 Procesando módulo: ${module}`);
      const moduleDir = join(dataDir, module);
      const files = await fs.readdir(moduleDir);
      const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, 2); // Últimos 2 archivos

      for (const file of jsonFiles) {
        try {
          console.log(`   📄 Leyendo archivo: ${file}`);
          const content = await fs.readFile(join(moduleDir, file), 'utf-8');
          const data = JSON.parse(content);

          // Manejar diferentes estructuras de datos según el módulo
          let offers = [];
          
          if (data.data?.offers && Array.isArray(data.data.offers)) {
            offers = data.data.offers;
          } else if (data.items && Array.isArray(data.items)) {
            offers = data.items;
          } else if (data.extractedData && Array.isArray(data.extractedData)) {
            offers = data.extractedData.map((item) => item.data || item);
          } else if (Array.isArray(data)) {
            offers = data;
          }

          console.log(`   📦 Ofertas encontradas: ${offers.length}`);

          if (offers.length > 0) {
            // Procesar ofertas y mapear imágenes
            const offersWithModule = offers.map((offer) => ({
              ...offer,
              source: data.data?.source || module,
              extractedAt: data.timestamp,
              // Mapear diferentes campos de imagen a imageUrl
              imageUrl: offer.imageUrl || offer.image || offer.img || offer.src || null,
              id: offer.id || `${module}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
              title: offer.title || offer.name || 'Producto sin título',
              price: parseFloat(offer.price) || 0,
              brand: offer.brand || 'Sin marca'
            }));

            // Mostrar información de las primeras 3 ofertas
            offersWithModule.slice(0, 3).forEach((offer, index) => {
              console.log(`   🛍️  Oferta ${index + 1}:`);
              console.log(`      ID: ${offer.id}`);
              console.log(`      Título: ${offer.title}`);
              console.log(`      Precio: €${offer.price}`);
              console.log(`      Marca: ${offer.brand}`);
              console.log(`      Imagen: ${offer.imageUrl || 'SIN IMAGEN'}`);
              console.log(`      Fuente: ${offer.source}`);
              console.log('');
            });

            allOffers.push(...offersWithModule);
          }
        } catch (error) {
          console.log(`   ❌ Error leyendo archivo ${file}: ${error.message}`);
        }
      }
      console.log('');
    }

    console.log(`📊 RESUMEN:`);
    console.log(`   Total ofertas: ${allOffers.length}`);
    
    const offersWithImages = allOffers.filter(offer => offer.imageUrl && offer.imageUrl !== 'SIN IMAGEN');
    console.log(`   Ofertas con imágenes: ${offersWithImages.length}`);
    
    const offersWithoutImages = allOffers.filter(offer => !offer.imageUrl || offer.imageUrl === 'SIN IMAGEN');
    console.log(`   Ofertas sin imágenes: ${offersWithoutImages.length}`);

    if (offersWithImages.length > 0) {
      console.log('\n✅ El bot DEBERÍA poder mostrar imágenes');
      console.log('🔗 Ejemplos de URLs de imágenes encontradas:');
      offersWithImages.slice(0, 5).forEach((offer, index) => {
        console.log(`   ${index + 1}. ${offer.imageUrl}`);
      });
    } else {
      console.log('\n❌ El bot NO puede mostrar imágenes - no hay URLs de imágenes válidas');
    }

  } catch (error) {
    console.error('💥 Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testBotImages();
