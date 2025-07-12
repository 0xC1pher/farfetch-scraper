// Hook que usa el repo externo deepscrape
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { MinioStorage } from '../minio';

export interface DeepscrapeConfig {
  externalPath: string;
  timeout: number;
}

export interface DeepscrapeElement {
  selector: string;
  type: 'text' | 'attribute' | 'html';
  attribute?: string;
}

export interface DeepscrapeRequest {
  pageUrl: string;
  elements: DeepscrapeElement[];
  waitForSelector?: string;
  timeout?: number;
}

export interface DeepscrapeResult {
  url: string;
  data: any[];
  timestamp: Date;
  success: boolean;
  error?: string;
}

export class DeepscrapeHook {
  private config: DeepscrapeConfig;
  private isAvailable: boolean = false;
  private minio: MinioStorage;

  constructor(config: DeepscrapeConfig) {
    this.config = config;
    this.minio = new MinioStorage();
    this.checkAvailability();
  }

  private checkAvailability(): void {
    const packageJsonPath = join(this.config.externalPath, 'package.json');
    this.isAvailable = existsSync(packageJsonPath);
  }

  async getStatus(): Promise<{ available: boolean; version?: string }> {
    if (!this.isAvailable) {
      return { available: false };
    }

    try {
      const packageJson = require(join(this.config.externalPath, 'package.json'));
      return { available: true, version: packageJson.version };
    } catch (e) {
      return { available: false };
    }
  }

  async resolve(request: DeepscrapeRequest): Promise<DeepscrapeResult> {
    if (!this.isAvailable) {
      return {
        url: request.pageUrl,
        data: [],
        timestamp: new Date(),
        success: false,
        error: 'Deepscrape not available'
      };
    }

    const config = {
      url: request.pageUrl,
      elements: request.elements,
      waitForSelector: request.waitForSelector,
      timeout: request.timeout || this.config.timeout
    };

    return new Promise<DeepscrapeResult>((resolve, reject) => {
      const childProcess: ChildProcess = spawn('node', ['resolve'], {
        cwd: this.config.externalPath,
        env: { 
          ...process.env, 
          CONFIG: JSON.stringify(config)
        }
      });

      let output = '';
      let errorOutput = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      childProcess.on('close', async (code: number | null) => {
        if (code === 0) {
          try {
            const data = JSON.parse(output);
            const result = {
              url: request.pageUrl,
              data,
              timestamp: new Date(),
              success: true
            };

            // Guardar datos automáticamente en MinIO
            try {
              await this.minio.saveDeepScrapeData(
                {
                  elements: request.elements,
                  extractedData: data,
                  extractedCount: Array.isArray(data) ? data.length : 0,
                  depth: request.elements.length,
                  waitForSelector: request.waitForSelector,
                  timeout: request.timeout
                },
                request.pageUrl,
                true
              );
            } catch (minioError) {
              console.error('Error guardando datos de deepscrape en MinIO:', minioError);
            }

            resolve(result);
          } catch (e) {
            const result = {
              url: request.pageUrl,
              data: [],
              timestamp: new Date(),
              success: false,
              error: 'Invalid response format'
            };

            // Guardar error en MinIO
            try {
              await this.minio.saveDeepScrapeData(
                {
                  elements: request.elements,
                  extractedData: [],
                  extractedCount: 0,
                  depth: request.elements.length,
                  error: 'Invalid response format'
                },
                request.pageUrl,
                false,
                'Invalid response format'
              );
            } catch (minioError) {
              console.error('Error guardando error de deepscrape en MinIO:', minioError);
            }

            resolve(result);
          }
        } else {
          const result = {
            url: request.pageUrl,
            data: [],
            timestamp: new Date(),
            success: false,
            error: `Deepscrape failed: ${errorOutput}`
          };

          // Guardar error en MinIO
          try {
            await this.minio.saveDeepScrapeData(
              {
                elements: request.elements,
                extractedData: [],
                extractedCount: 0,
                depth: request.elements.length,
                error: errorOutput
              },
              request.pageUrl,
              false,
              `Deepscrape failed: ${errorOutput}`
            );
          } catch (minioError) {
            console.error('Error guardando error de deepscrape en MinIO:', minioError);
          }

          resolve(result);
        }
      });

      childProcess.on('error', (error: Error) => {
        resolve({
          url: request.pageUrl,
          data: [],
          timestamp: new Date(),
          success: false,
          error: `Process error: ${error.message}`
        });
      });

      setTimeout(() => {
        childProcess.kill();
        resolve({
          url: request.pageUrl,
          data: [],
          timestamp: new Date(),
          success: false,
          error: 'Deepscrape timeout'
        });
      }, this.config.timeout);
    });
  }
}

// Exportar instancia por defecto
export const deepscrape = new DeepscrapeHook({
  externalPath: join(process.cwd(), 'external', 'deepscrape'),
  timeout: 30000
}); 