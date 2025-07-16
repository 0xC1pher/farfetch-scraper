import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import { join } from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      limit = '20', 
      module, 
      minPrice, 
      maxPrice, 
      brand, 
      category,
      minDiscount 
    } = req.query;

    console.log('🔍 API: Obteniendo ofertas desde directorio local...');
    
    const dataDir = join(process.cwd(), 'data', 'scraping');
    
    // Verificar si el directorio existe
    try {
      await fs.access(dataDir);
    } catch {
      return res.status(200).json({
        success: true,
        offers: [],
        totalFound: 0,
        message: 'No hay datos disponibles'
      });
    }

    // Obtener datos de módulos
    let allOffers: any[] = [];
    
    try {
      const modules = module ? [module as string] : await fs.readdir(dataDir);
      console.log(`📁 Módulos a procesar: ${modules.join(', ')}`);
      
      for (const mod of modules) {
        const moduleDir = join(dataDir, mod);
        
        try {
          const files = await fs.readdir(moduleDir);
          const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, 10); // Últimos 10 archivos por módulo
          
          for (const file of jsonFiles) {
            try {
              const content = await fs.readFile(join(moduleDir, file), 'utf-8');
              const data = JSON.parse(content);
              
              if (data.data?.offers && Array.isArray(data.data.offers)) {
                // Agregar información del módulo a cada oferta
                const offersWithModule = data.data.offers.map((offer: any) => ({
                  ...offer,
                  source: data.data.source || mod,
                  extractedAt: data.timestamp,
                  moduleFile: file
                }));
                allOffers.push(...offersWithModule);
              }
            } catch (error) {
              console.log(`⚠️ Error leyendo archivo ${file}: ${error.message}`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Error leyendo módulo ${mod}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`⚠️ Error leyendo directorio: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Error leyendo directorio de datos'
      });
    }

    console.log(`📊 Total ofertas encontradas: ${allOffers.length}`);

    // Filtrar duplicados por ID
    const uniqueOffers = allOffers.filter((offer, index, self) => 
      index === self.findIndex(o => o.id === offer.id)
    );

    console.log(`🔍 Ofertas únicas: ${uniqueOffers.length}`);

    // Aplicar filtros
    let filteredOffers = uniqueOffers;
    
    // Filtro por precio mínimo
    if (minPrice) {
      const min = parseFloat(minPrice as string);
      filteredOffers = filteredOffers.filter(offer => offer.price >= min);
    }
    
    // Filtro por precio máximo
    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      filteredOffers = filteredOffers.filter(offer => offer.price <= max);
    }
    
    // Filtro por marca
    if (brand) {
      filteredOffers = filteredOffers.filter(offer => 
        offer.brand?.toLowerCase().includes((brand as string).toLowerCase())
      );
    }
    
    // Filtro por categoría
    if (category) {
      filteredOffers = filteredOffers.filter(offer => 
        offer.category?.toLowerCase().includes((category as string).toLowerCase())
      );
    }
    
    // Filtro por descuento mínimo
    if (minDiscount) {
      const minDisc = parseFloat(minDiscount as string);
      filteredOffers = filteredOffers.filter(offer => {
        if (!offer.originalPrice) return false;
        const discount = ((offer.originalPrice - offer.price) / offer.originalPrice) * 100;
        return discount >= minDisc;
      });
    }

    console.log(`✅ Ofertas después de filtros: ${filteredOffers.length}`);

    // Ordenar por timestamp más reciente
    filteredOffers.sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime());

    // Aplicar límite
    const limitNum = parseInt(limit as string);
    const limitedOffers = filteredOffers.slice(0, limitNum);

    // Estadísticas por módulo
    const moduleStats = {};
    filteredOffers.forEach(offer => {
      const source = offer.source || 'unknown';
      moduleStats[source] = (moduleStats[source] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      offers: limitedOffers,
      totalFound: filteredOffers.length,
      totalUnique: uniqueOffers.length,
      totalRaw: allOffers.length,
      moduleStats,
      filters: {
        module: module || 'all',
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        brand: brand || null,
        category: category || null,
        minDiscount: minDiscount || null,
        limit: limitNum
      },
      message: `${limitedOffers.length} ofertas encontradas`
    });

  } catch (error) {
    console.error('❌ Error en API de ofertas locales:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Error obteniendo ofertas desde directorio local'
    });
  }
}
