// Hook que usa MinIO para persistencia de datos
import { Client } from 'minio';
import { join } from 'path';

export interface SessionData {
  sessionId: string;
  cookies: any[];
  userId?: string;
  fingerprint?: any;
  timestamp: Date;
  status: 'active' | 'expired' | 'error';
}

export interface ScrapingData {
  url: string;
  selectors: any[];
  data: any;
  timestamp: Date;
  module?: string;
  metadata?: any;
}

export interface ModuleData {
  module: string;
  url: string;
  data: any;
  timestamp: Date;
  metadata?: any;
  success: boolean;
  error?: string;
}

export interface MinioConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export class MinioStorage {
  private client: Client;
  private bucket: string;
  private isAvailable: boolean = false;

  constructor(config?: Partial<MinioConfig>) {
    const defaultConfig: MinioConfig = {
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: Number(process.env.MINIO_PORT) || 9010,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || '***REMOVED***',
      bucket: process.env.MINIO_BUCKET || 'mexa-data'
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.client = new Client({
      endPoint: finalConfig.endPoint,
      port: finalConfig.port,
      useSSL: finalConfig.useSSL,
      accessKey: finalConfig.accessKey,
      secretKey: finalConfig.secretKey,
    });
    
    this.bucket = finalConfig.bucket;
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      await this.ensureBucket();
      this.isAvailable = true;
    } catch (error) {
      console.warn('⚠️ MinIO no disponible:', error);
      this.isAvailable = false;
    }
  }

  async getStatus(): Promise<{ available: boolean; bucket: string }> {
    try {
      // Verificar en tiempo real si MinIO está disponible
      await this.client.bucketExists(this.bucket);
      this.isAvailable = true;
      return {
        available: true,
        bucket: this.bucket
      };
    } catch (error) {
      this.isAvailable = false;
      return {
        available: false,
        bucket: this.bucket
      };
    }
  }

  /**
   * Guardar sesión en MinIO
   */
  async saveSession(sessionData: SessionData): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('MinIO not available');
    }

    try {
      const key = `sessions/${sessionData.sessionId}.json`;
      const data = JSON.stringify(sessionData, null, 2);
      
      await this.client.putObject(
        this.bucket,
        key,
        Buffer.from(data),
        data.length,
        {
          'Content-Type': 'application/json'
        }
      );

      console.log(`✅ Sesión guardada en MinIO: ${key}`);
    } catch (error) {
      console.error('❌ Error guardando sesión:', error);
      throw error;
    }
  }

  /**
   * Cargar sesión desde MinIO
   */
  async loadSession(sessionId: string): Promise<SessionData | null> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const key = `sessions/${sessionId}.json`;
      const stream = await this.client.getObject(this.bucket, key);
      
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        stream.on('end', () => {
          try {
            const data = Buffer.concat(chunks).toString();
            const parsedData = JSON.parse(data);
            // Ensure timestamp is a Date object
            const sessionData: SessionData = {
              ...parsedData,
              timestamp: new Date(parsedData.timestamp),
            };
            resolve(sessionData);
          } catch (error) {
            reject(error);
          }
        });
        
        stream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.warn(`⚠️ Sesión no encontrada: ${sessionId}`);
      return null;
    }
  }

  /**
   * Guardar datos de scraping con soporte para múltiples módulos
   */
  async saveScrapingData(scrapingData: ScrapingData, module: string = 'scraperr'): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('MinIO not available');
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const date = new Date().toISOString().split('T')[0];
      const key = `scraping/${module}/${date}/${timestamp}-${Date.now()}.json`;
      const data = JSON.stringify(scrapingData, null, 2);

      await this.client.putObject(
        this.bucket,
        key,
        Buffer.from(data),
        data.length,
        {
          'Content-Type': 'application/json'
        }
      );

      console.log(`✅ Datos de scraping guardados [${module}]: ${key}`);
    } catch (error) {
      console.error(`❌ Error guardando datos de scraping [${module}]:`, error);
      throw error;
    }
  }

  /**
   * Guardar datos de cualquier módulo de extracción
   */
  async saveModuleData(moduleData: ModuleData): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('MinIO not available');
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const date = new Date().toISOString().split('T')[0];
      const key = `extraction/${moduleData.module}/${date}/${timestamp}-${Date.now()}.json`;

      const dataToSave = {
        ...moduleData,
        savedAt: new Date().toISOString(),
        version: '1.0'
      };

      const jsonData = JSON.stringify(dataToSave, null, 2);

      await this.client.putObject(
        this.bucket,
        key,
        Buffer.from(jsonData),
        jsonData.length,
        {
          'Content-Type': 'application/json',
          'X-Module': moduleData.module,
          'X-Success': moduleData.success.toString()
        }
      );

      console.log(`✅ Datos del módulo guardados [${moduleData.module}]: ${key}`);
    } catch (error) {
      console.error(`❌ Error guardando datos del módulo [${moduleData.module}]:`, error);
      throw error;
    }
  }

  /**
   * Guardar datos específicos de Browser-MCP
   */
  async saveBrowserMCPData(data: any, url: string, success: boolean, error?: string): Promise<void> {
    const moduleData: ModuleData = {
      module: 'browser-mcp',
      url,
      data,
      timestamp: new Date(),
      success,
      error,
      metadata: {
        userAgent: data.userAgent,
        viewport: data.viewport,
        fingerprint: data.fingerprint
      }
    };

    return this.saveModuleData(moduleData);
  }

  /**
   * Guardar datos específicos de Scraperr
   */
  async saveScaperrData(data: any, url: string, success: boolean, error?: string): Promise<void> {
    const moduleData: ModuleData = {
      module: 'scraperr',
      url,
      data,
      timestamp: new Date(),
      success,
      error,
      metadata: {
        selectors: data.selectors,
        itemCount: Array.isArray(data.items) ? data.items.length : 0
      }
    };

    return this.saveModuleData(moduleData);
  }

  /**
   * Guardar datos específicos de DeepScrape
   */
  async saveDeepScrapeData(data: any, url: string, success: boolean, error?: string): Promise<void> {
    const moduleData: ModuleData = {
      module: 'deepscrape',
      url,
      data,
      timestamp: new Date(),
      success,
      error,
      metadata: {
        elements: data.elements,
        depth: data.depth,
        extractedCount: data.extractedCount
      }
    };

    return this.saveModuleData(moduleData);
  }

  /**
   * Listar datos por módulo específico
   */
  async listModuleData(module: string, limit: number = 50): Promise<ModuleData[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const prefix = `extraction/${module}/`;
      const objects = this.client.listObjects(this.bucket, prefix, true);
      const results: ModuleData[] = [];
      let count = 0;

      for await (const obj of objects) {
        if (count >= limit) break;

        try {
          const data = await this.client.getObject(this.bucket, obj.name!);
          const chunks: Buffer[] = [];

          for await (const chunk of data) {
            chunks.push(chunk);
          }

          const content = Buffer.concat(chunks).toString();
          const moduleData = JSON.parse(content) as ModuleData;
          results.push(moduleData);
          count++;
        } catch (error) {
          console.error(`Error leyendo datos del módulo ${module}:`, error);
        }
      }

      return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error(`Error listando datos del módulo ${module}:`, error);
      return [];
    }
  }

  /**
   * Obtener estadísticas por módulo
   */
  async getModuleStats(module: string): Promise<{
    totalExtractions: number;
    successfulExtractions: number;
    failedExtractions: number;
    successRate: number;
    lastExtraction?: Date;
  }> {
    if (!this.isAvailable) {
      return {
        totalExtractions: 0,
        successfulExtractions: 0,
        failedExtractions: 0,
        successRate: 0
      };
    }

    try {
      const data = await this.listModuleData(module, 1000);
      const total = data.length;
      const successful = data.filter(d => d.success).length;
      const failed = total - successful;
      const successRate = total > 0 ? (successful / total) * 100 : 0;
      const lastExtraction = data.length > 0 ? new Date(data[0].timestamp) : undefined;

      return {
        totalExtractions: total,
        successfulExtractions: successful,
        failedExtractions: failed,
        successRate: Math.round(successRate * 100) / 100,
        lastExtraction
      };
    } catch (error) {
      console.error(`Error obteniendo estadísticas del módulo ${module}:`, error);
      return {
        totalExtractions: 0,
        successfulExtractions: 0,
        failedExtractions: 0,
        successRate: 0
      };
    }
  }

  /**
   * Cargar datos de scraping
   */
  async loadScrapingData(url: string, limit: number = 10): Promise<ScrapingData[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const objects = await this.client.listObjects(this.bucket, 'scraping/', true);
      const results: ScrapingData[] = [];

      for await (const obj of objects) {
        if (results.length >= limit) break;

        try {
          const stream = await this.client.getObject(this.bucket, obj.name);
          const data = await this.streamToBuffer(stream);
          const scrapingData = JSON.parse(data.toString()) as ScrapingData;

          if (scrapingData.url === url) {
            results.push(scrapingData);
          }
        } catch (error) {
          console.warn(`⚠️ Error cargando objeto: ${obj.name}`);
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Error cargando datos de scraping:', error);
      return [];
    }
  }

  /**
   * Obtener datos de scraping para la API (formato optimizado)
   */
  async getScrapingData(url: string, limit: number = 10): Promise<any[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const prefix = `scraping/`;
      const objects: any[] = [];

      const stream = this.client.listObjects(this.bucket, prefix, true);

      for await (const obj of stream) {
        if (objects.length >= limit) break;

        try {
          const dataStream = await this.client.getObject(this.bucket, obj.name!);
          const data = await this.streamToBuffer(dataStream);
          const scrapingData = JSON.parse(data.toString());

          // Filtrar por URL si se especifica
          if (url === 'https://www.farfetch.com' || scrapingData.url?.includes(url)) {
            objects.push(scrapingData);
          }
        } catch (error) {
          console.warn(`⚠️ Error reading object ${obj.name}:`, error);
        }
      }

      // Ordenar por timestamp (más recientes primero)
      objects.sort((a, b) => {
        const timestampA = new Date(a.timestamp || 0).getTime();
        const timestampB = new Date(b.timestamp || 0).getTime();
        return timestampB - timestampA;
      });

      return objects;
    } catch (error) {
      console.error(`❌ Error getting scraping data for ${url}:`, error);
      return [];
    }
  }

  /**
   * Eliminar sesión
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!this.isAvailable) {
      return;
    }

    try {
      const key = `sessions/${sessionId}.json`;
      await this.client.removeObject(this.bucket, key);
      console.log(`✅ Sesión eliminada: ${key}`);
    } catch (error) {
      console.error('❌ Error eliminando sesión:', error);
      throw error;
    }
  }

  /**
   * Listar todas las sesiones
   */
  async listSessions(): Promise<string[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const objects = await this.client.listObjects(this.bucket, 'sessions/', true);
      const sessions: string[] = [];
      
      for await (const obj of objects) {
        if (obj.name.endsWith('.json')) {
          const sessionId = obj.name.replace('sessions/', '').replace('.json', '');
          sessions.push(sessionId);
        }
      }
      
      return sessions;
    } catch (error) {
      console.error('❌ Error listando sesiones:', error);
      return [];
    }
  }

  /**
   * Verificar o crear bucket si no existe
   */
  private async ensureBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        console.log(`✅ Bucket creado: ${this.bucket}`);
      }
    } catch (error) {
      console.error('❌ Error verificando bucket:', error);
      throw error;
    }
  }

  /**
   * Utilidad para convertir stream a buffer
   */
  private async streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      stream.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Guardar datos genéricos
   */
  async saveData(key: string, data: any): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('MinIO not available');
    }

    try {
      const jsonData = JSON.stringify(data, null, 2);

      await this.client.putObject(
        this.bucket,
        key,
        Buffer.from(jsonData),
        jsonData.length,
        {
          'Content-Type': 'application/json'
        }
      );

      console.log(`✅ Datos guardados: ${key}`);
    } catch (error) {
      console.error('❌ Error guardando datos:', error);
      throw error;
    }
  }

  /**
   * Cargar datos genéricos
   */
  async loadData(key: string): Promise<any> {
    if (!this.isAvailable) {
      throw new Error('MinIO not available');
    }

    try {
      const stream = await this.client.getObject(this.bucket, key);
      const data = await this.streamToBuffer(stream);
      return JSON.parse(data.toString());
    } catch (error) {
      console.error(`❌ Error cargando datos: ${key}`, error);
      throw error;
    }
  }

  /**
   * Listar objetos
   */
  async listObjects(prefix: string = ''): Promise<any[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const objects = await this.client.listObjects(this.bucket, prefix, true);
      const results: any[] = [];

      for await (const obj of objects) {
        results.push(obj);
      }

      return results;
    } catch (error) {
      console.error(`❌ Error listando objetos: ${prefix}`, error);
      return [];
    }
  }
}

// Exportar instancia por defecto
export const minioStorage = new MinioStorage();
