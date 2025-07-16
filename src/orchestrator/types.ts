export interface Offer {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  brand: string;
  category: string;
  url: string;
  imageUrl?: string;
  description?: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  timestamp: Date;
}

// Tipos para cookies y fingerprint
export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface Fingerprint {
  userAgent: string;
  platform: string;
  viewport: { width: number; height: number };
  timezone: string;
  locale: string;
  languages: string[];
  webglVendor: string;
  webglRenderer: string;
  audioContext: number;
  lastRotation: Date;
}

export interface SessionData {
  sessionId: string;
  cookies: Cookie[];
  userId?: string; // Opcional para compatibilidad con MinIO
  fingerprint?: Fingerprint; // Opcional para compatibilidad con MinIO
  timestamp: Date;
  status: 'active' | 'expired' | 'error'; // Compatible con MinIO
}

export interface ScrapingData {
  url: string;
  selectors: string[];
  data: {
    offers: Offer[];
    timestamp: Date;
    totalFound: number;
    source?: string;
    strategies?: string[];
    originalCount?: number;
    duplicatesRemoved?: number;
  };
  timestamp: Date;
}

// Interfaces para los módulos externos
export interface ModuleStatus {
  available: boolean;
  status: 'running' | 'stopped' | 'starting' | 'not_found';
  version?: string;
  url?: string;
  path?: string;
  error?: string;
}

export interface LoginOptions {
  use2FA?: boolean;
  fingerprint?: Fingerprint | string;
  proxy?: string;
  timeout?: number;
}

export interface LoginResult {
  success: boolean;
  sessionId?: string;
  cookies?: Cookie[];
  fingerprint?: Fingerprint;
  message?: string;
  error?: string;
}

export interface ScrapeOptions {
  useSession?: boolean;
  sessionId?: string;
  timeout?: number;
  waitForSelector?: string;
  scrollTimes?: number;
  scrollDelay?: number;
}

export interface DeepScrapeRequest {
  pageUrl: string;
  elements: string[];
  timeout?: number;
  options?: Record<string, unknown>;
}

export interface DeepScrapeResult {
  url: string;
  data: Offer[];
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface ScraperStats {
  totalScrapes: number;
  successfulScrapes: number;
  failedScrapes: number;
  averageTime: number;
  error?: string;
}

// Interfaces para los módulos
export interface IBrowserMCP {
  getStatus(): Promise<ModuleStatus>;
  startService(): Promise<boolean>;
  login(email: string, password: string, options?: LoginOptions): Promise<LoginResult>;
  scrapeOffers(url: string, options?: ScrapeOptions): Promise<Offer[]>;
  exportSession(sessionId: string): Promise<SessionData>;
  closeSession(sessionId: string): Promise<boolean>;
}

export interface IScraperr {
  getStatus(): Promise<ModuleStatus>;
  getStatsAsync(): Promise<ScraperStats>;
  scrapeOffers(url: string, options?: ScrapeOptions): Promise<Offer[]>;
  extractWithFallback(url: string, options?: ScrapeOptions): Promise<Offer[]>;
  loadSession(sessionData: any): Promise<boolean>; // Usar any temporalmente para compatibilidad
}

export interface IDeepScrape {
  getStatus(): Promise<ModuleStatus>;
  resolve(request: DeepScrapeRequest): Promise<DeepScrapeResult>;
}
