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
  }
} as const;

export type BrowserMCPConfigType = typeof BrowserMCPConfig;
