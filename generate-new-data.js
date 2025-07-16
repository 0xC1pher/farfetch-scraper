#!/usr/bin/env node

/**
 * Script para generar nuevos datos con imágenes reales de Farfetch
 */

import { loadBrowserMCP } from './src/utils/moduleLoader.js';
import { promises as fs } from 'fs';
import { join } from 'path';

async function generateNewData() {
  console.log('🔄 Generando nuevos datos con imágenes reales de Farfetch...\n');

  try {
    // Crear directorio de datos si no existe
    const dataDir = join(process.cwd(), 'data', 'scraping');
    await fs.mkdir(dataDir, { recursive: true });

    // Crear instancia del módulo Browser-MCP
    const browserMcp = await loadBrowserMCP();
    
    console.log('🚀 Ejecutando Browser-MCP...');
    const offers = await browserMcp.scrapeOffers('https://www.farfetch.com/es/shopping/men/sneakers/items.aspx');
    
    console.log(`✅ Generadas ${offers.length} ofertas`);
    
    // Mostrar las primeras 3 ofertas con sus imágenes
    console.log('\n📋 Ofertas generadas:');
    offers.slice(0, 3).forEach((offer, index) => {
      console.log(`\n🛍️  Oferta ${index + 1}:`);
      console.log(`   ID: ${offer.id}`);
      console.log(`   Título: ${offer.title}`);
      console.log(`   Precio: €${offer.price}`);
      console.log(`   Marca: ${offer.brand}`);
      console.log(`   Imagen: ${offer.imageUrl}`);
    });

    // Guardar datos en archivo JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${Date.now()}.json`;
    const browserDir = join(dataDir, 'browser-mcp');
    await fs.mkdir(browserDir, { recursive: true });
    
    const data = {
      timestamp: new Date().toISOString(),
      data: {
        source: 'browser-mcp',
        offers: offers
      }
    };
    
    await fs.writeFile(join(browserDir, filename), JSON.stringify(data, null, 2));
    console.log(`\n💾 Datos guardados en: data/scraping/browser-mcp/${filename}`);
    
    console.log('\n✅ Nuevos datos generados exitosamente!');

  } catch (error) {
    console.error('💥 Error generando datos:', error.message);
  }
}

// Ejecutar la generación
generateNewData();
