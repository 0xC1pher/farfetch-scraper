import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual de manera compatible con ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta base del proyecto (subir un nivel desde src/config)
const PROJECT_ROOT = path.resolve(__dirname, '../..');

export const MODULE_PATHS = {
  // Ruta base de los módulos
  BASE: path.join(PROJECT_ROOT, 'src', 'modules'),
  
  // Rutas específicas de cada módulo
  BROWSER_MCP: {
    PATH: path.join(PROJECT_ROOT, 'src', 'modules', 'browser-mcp'),
    REPO: 'https://github.com/hangwin/mcp-chrome',
    ENTRY_POINT: 'src/index' // Ajustar según la estructura del repo
  },
  
  SCRAPERR: {
    PATH: path.join(PROJECT_ROOT, 'src', 'modules', 'scraperr'),
    REPO: 'https://github.com/jaypyles/Scraperr',
    ENTRY_POINT: 'dist/index'
  },
  
  DEEPSCRAPE: {
    PATH: path.join(PROJECT_ROOT, 'src', 'modules', 'deepscrape'),
    REPO: 'https://github.com/stretchcloud/deepscrape',
    ENTRY_POINT: 'dist/index'
  }
} as const;

export type ModuleName = keyof typeof MODULE_PATHS;

export const MODULE_CONFIG = {
  // Configuración común para todos los módulos
  COMMON: {
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    TIMEOUT: 30000 // 30 segundos
  },
  
  // Configuración específica por entorno
  ENVIRONMENTS: {
    development: {
      DEBUG: true,
      HEADLESS: false
    },
    production: {
      DEBUG: false,
      HEADLESS: true
    }
  }
} as const;
