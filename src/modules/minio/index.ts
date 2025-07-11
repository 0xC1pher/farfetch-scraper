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
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
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
    return {
      available: this.isAvailable,
      bucket: this.bucket
    };
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
   * Guardar datos de scraping
   */
  async saveScrapingData(scrapingData: ScrapingData): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('MinIO not available');
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const key = `scraping/${timestamp}-${Date.now()}.json`;
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

      console.log(`✅ Datos de scraping guardados: ${key}`);
    } catch (error) {
      console.error('❌ Error guardando datos de scraping:', error);
      throw error;
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
}

// Exportar instancia por defecto
export const minioStorage = new MinioStorage();
