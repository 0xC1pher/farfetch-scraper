import { NextApiRequest, NextApiResponse } from 'next';
import { SimpleOrchestrator } from '../../../orchestrator/simple-orchestrator';

/**
 * API para scraping agresivo que extrae TODAS las ofertas disponibles
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category = 'all', maxOffers = 500 } = req.body;

    console.log(`🚀 Iniciando scraping AGRESIVO para categoría: ${category}`);

    // Crear orquestador
    const orchestrator = await SimpleOrchestrator.create();

    // URLs para scraping agresivo
    const urls = {
      women: 'https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx',
      men: 'https://www.farfetch.com/nl/shopping/men/sale/all/items.aspx', 
      kids: 'https://www.farfetch.com/nl/shopping/kids/sale/all/items.aspx',
      all: ['women', 'men', 'kids']
    };

    let allOffers: any[] = [];
    let metadata: any = {};

    if (category === 'all') {
      // Scraping de todas las categorías
      console.log('🌐 Scraping AGRESIVO de TODAS las categorías...');
      
      for (const cat of urls.all) {
        try {
          console.log(`🔍 Scraping categoría: ${cat.toUpperCase()}`);
          
          const result = await orchestrator.scrapeWithSession({
            scrapeUrl: urls[cat as keyof typeof urls] as string,
            maxRetries: 1,
            useAggressiveMode: true
          });

          // Marcar ofertas con categoría
          const categoryOffers = result.map(offer => ({
            ...offer,
            category: cat,
            extractedFrom: urls[cat as keyof typeof urls]
          }));

          allOffers.push(...categoryOffers);
          console.log(`✅ ${cat.toUpperCase()}: ${categoryOffers.length} ofertas extraídas`);

          // Pausa entre categorías
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
          console.error(`❌ Error en categoría ${cat}:`, error);
        }
      }

      metadata = {
        totalCategories: urls.all.length,
        categoriesScraped: urls.all.length,
        totalOffers: allOffers.length
      };

    } else {
      // Scraping de una categoría específica
      const url = urls[category as keyof typeof urls] as string;
      if (!url) {
        return res.status(400).json({ error: 'Categoría no válida' });
      }

      console.log(`🔍 Scraping AGRESIVO de categoría: ${category.toUpperCase()}`);
      
      const result = await orchestrator.scrapeWithSession({
        scrapeUrl: url,
        maxRetries: 1,
        useAggressiveMode: true
      });

      allOffers = result.map(offer => ({
        ...offer,
        category,
        extractedFrom: url
      }));

      metadata = {
        category,
        url,
        totalOffers: allOffers.length
      };
    }

    // Eliminar duplicados con algoritmo estricto
    const uniqueOffers = removeDuplicatesStrict(allOffers);
    
    // Limitar número de ofertas si es necesario
    const finalOffers = uniqueOffers.slice(0, maxOffers);

    console.log(`✅ Scraping AGRESIVO completado:`);
    console.log(`   📦 Total extraído: ${allOffers.length} ofertas`);
    console.log(`   🔍 Después de duplicados: ${uniqueOffers.length} ofertas`);
    console.log(`   📋 Final: ${finalOffers.length} ofertas`);

    // Análisis de calidad
    const realImages = finalOffers.filter(offer => 
      offer.imageUrl && offer.imageUrl.includes('farfetch-contents.com')
    ).length;

    const qualityMetrics = {
      totalExtracted: allOffers.length,
      afterDuplicateRemoval: uniqueOffers.length,
      finalCount: finalOffers.length,
      realImagesPercentage: Math.round((realImages / finalOffers.length) * 100),
      categories: [...new Set(finalOffers.map(offer => offer.category))],
      priceRange: {
        min: Math.min(...finalOffers.map(offer => offer.price || 0)),
        max: Math.max(...finalOffers.map(offer => offer.price || 0))
      }
    };

    res.status(200).json({
      success: true,
      offers: finalOffers,
      metadata: {
        ...metadata,
        quality: qualityMetrics,
        timestamp: new Date(),
        aggressiveMode: true
      }
    });

  } catch (error) {
    console.error('❌ Error en scraping agresivo:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Eliminación estricta de duplicados
 */
function removeDuplicatesStrict(offers: any[]): any[] {
  const seen = new Map();
  const imagesSeen = new Set();
  
  return offers.filter(offer => {
    // Criterio 1: URL de imagen exacta
    const imageUrl = offer.imageUrl?.split('?')[0];
    if (imageUrl && imagesSeen.has(imageUrl)) {
      return false;
    }
    
    // Criterio 2: Título + precio + marca
    const key = `${offer.title?.toLowerCase().trim()}-${offer.price}-${offer.brand?.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    
    // Registrar
    if (imageUrl) imagesSeen.add(imageUrl);
    seen.set(key, true);
    
    return true;
  });
}
