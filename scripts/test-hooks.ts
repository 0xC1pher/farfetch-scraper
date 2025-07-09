import { browserMCP } from '../src/modules/browser-mcp';
import { scraperr } from '../src/modules/scraperr';
import { deepscrape } from '../src/modules/deepscrape';

async function testHooks() {
  console.log('🧪 Probando hooks de repos externos...');

  try {
    // Test Browser MCP
    console.log('\n Probando Browser MCP...');
    const browserStatus = await browserMCP.getStatus();
    console.log('Browser MCP Status:', browserStatus);

    // Test Scraperr
    console.log('\n️ Probando Scraperr...');
    const scraperrStatus = await scraperr.getStatus();
    console.log('Scraperr Status:', scraperrStatus);

    // Test Deepscrape
    console.log('\n🤖 Probando Deepscrape...');
    const deepscrapeStatus = await deepscrape.getStatus();
    console.log('Deepscrape Status:', deepscrapeStatus);

    // Test Scraperr with fallback
    if (scraperrStatus.available) {
      console.log('\n🔍 Probando scraping con Scraperr...');
      try {
        const offers = await scraperr.scrapeOffers('https://www.farfetch.com/shopping/women/items.aspx', {
          waitForSelector: '.product-card',
          scrollTimes: 1,
          timeout: 10000
        });
        console.log(`✅ Scraping exitoso: ${offers.length} ofertas encontradas`);
      } catch (error) {
        console.log('⚠️ Error en scraping:', error instanceof Error ? error.message : String(error));
      }
    }

    // Test statistics
    console.log('\n📊 Estadísticas de módulos:');
    const scraperrStats = scraperr.getStats();
    console.log('Scraperr Stats:', scraperrStats);

    const scraperrStatsAsync = await scraperr.getStatsAsync();
    console.log('Scraperr Stats Async:', scraperrStatsAsync);

    console.log('\n✅ Pruebas de hooks completadas exitosamente');

  } catch (error) {
    console.error('❌ Error en pruebas:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testHooks().catch((error) => {
    console.error('❌ Error fatal en pruebas:', error);
    process.exit(1);
  });
}

export { testHooks }; 