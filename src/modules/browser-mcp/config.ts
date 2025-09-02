// Configuración para Browser MCP
export const BrowserMCPConfig = {
  // Navegadores soportados para fingerprinting
  supportedBrowsers: [
    'chrome',
    'firefox',
    'safari',
    'edge'
  ],
  
  // Configuración de pantalla predeterminada
  defaultViewport: {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    isLandscape: false
  },
  
  // Configuración de user agent
  userAgents: {
    windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    macos: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  
  // Configuración de proxies
  proxySettings: {
    timeout: 30000, // 30 segundos
    retries: 3
  },
  
  // Configuración de fingerprinting
  fingerprinting: {
    // Niveles de aleatorización del fingerprint
    levels: {
      low: 0.3,    // Cambios mínimos
      medium: 0.6,  // Cambios moderados
      high: 0.9    // Cambios máximos
    },
    // Tiempo de vida de un fingerprint antes de rotar (en minutos)
    ttl: 60
  },

  // Configuración de hard extraction
  hardExtraction: {
    // URLs para todas las categorías con múltiples páginas
    scrapingUrls: {
      women: [
        'https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx',
        'https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx?page=2',
        'https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx?page=3',
        'https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx?page=4',
        'https://www.farfetch.com/nl/shopping/women/sale/all/items.aspx?page=5'
      ],
      men: [
        'https://www.farfetch.com/nl/shopping/men/sale/all/items.aspx',
        'https://www.farfetch.com/nl/shopping/men/sale/all/items.aspx?page=2',
        'https://www.farfetch.com/nl/shopping/men/sale/all/items.aspx?page=3',
        'https://www.farfetch.com/nl/shopping/men/sale/all/items.aspx?page=4',
        'https://www.farfetch.com/nl/shopping/men/sale/all/items.aspx?page=5'
      ],
      kids: [
        'https://www.farfetch.com/nl/shopping/kids/sale/all/items.aspx',
        'https://www.farfetch.com/nl/shopping/kids/sale/all/items.aspx?page=2',
        'https://www.farfetch.com/nl/shopping/kids/sale/all/items.aspx?page=3'
      ],
      all: 'https://www.farfetch.com/nl/shopping/sale/all/items.aspx'
    },

    // Espera avanzada de contenido dinámico
    waitForDynamicContent: {
      networkIdleTimeout: 2000,
      selectorTimeout: 15000,
      maxRetries: 3
    },

    // Simulación de scroll infinito AGRESIVO
    scrollSimulation: {
      maxScrolls: 50, // Aumentado para extraer TODAS las ofertas
      scrollDelay: 1500, // Reducido para ser más rápido
      scrollAmount: 1200, // Aumentado para scroll más agresivo
      detectLoadMore: true,
      maxOffers: 500, // Límite máximo de ofertas por categoría
      scrollUntilNoMore: true, // Continuar hasta que no haya más contenido
      aggressiveMode: true // Modo agresivo activado
    },

    // Extracción de datos embebidos
    dataExtraction: {
      extractJsonLD: true,
      extractScriptData: true,
      interceptXHR: true,
      saveRawHTML: true
    },

    // Validación de contenido real
    validation: {
      validateImages: true,
      checkDuplicates: true,
      minOffers: 15, // Aumentado para incluir todas las categorías
      realImageDomains: ['farfetch-contents.com', 'cdn-images.farfetch-contents.com'],
      requiredCategories: ['women', 'men', 'kids'] // Validar que hay ofertas de todas las categorías
    }
  }
} as const;

export type BrowserMCPConfigType = typeof BrowserMCPConfig;
