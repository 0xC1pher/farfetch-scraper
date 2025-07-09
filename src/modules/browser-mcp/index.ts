// Hook que usa el repo externo browser-mcp
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

export interface BrowserMCPConfig {
  externalPath: string;
  timeout: number;
  retries: number;
}

export interface LoginResult {
  success: boolean;
  sessionId?: string;
  cookies?: any[];
  error?: string;
}

export interface SessionData {
  sessionId: string;
  cookies: any[];
  userId?: string;
  fingerprint?: any;
  timestamp: Date;
}

export class BrowserMCPHook {
  private config: BrowserMCPConfig;
  private isAvailable: boolean = false;

  constructor(config: BrowserMCPConfig) {
    this.config = config;
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

  async login(email: string, password: string, options?: {
    use2FA?: boolean;
    fingerprint?: any;
    proxy?: string;
  }): Promise<LoginResult> {
    if (!this.isAvailable) {
      return { success: false, error: 'Browser MCP not available' };
    }

    return new Promise((resolve, reject) => {
      const args = [
        'login',
        '--email', email,
        '--password', password
      ];

      if (options?.use2FA) {
        args.push('--2fa');
      }

      if (options?.fingerprint) {
        args.push('--fingerprint', JSON.stringify(options.fingerprint));
      }

      if (options?.proxy) {
        args.push('--proxy', options.proxy);
      }

      const process = spawn('node', ['index.js', ...args], {
        cwd: this.config.externalPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            resolve({ success: true, sessionId: output.trim() });
          }
        } else {
          reject(new Error(`Login failed: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Process error: ${error.message}`));
      });

      // Timeout
      setTimeout(() => {
        process.kill();
        reject(new Error('Login timeout'));
      }, this.config.timeout);
    });
  }

  async submit2FA(code: string, sessionId: string): Promise<LoginResult> {
    if (!this.isAvailable) {
      return { success: false, error: 'Browser MCP not available' };
    }

    return new Promise((resolve, reject) => {
      const args = [
        '2fa',
        '--code', code,
        '--session', sessionId
      ];

      const process = spawn('node', ['index.js', ...args], {
        cwd: this.config.externalPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            resolve({ success: true, sessionId: output.trim() });
          }
        } else {
          reject(new Error(`2FA failed: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Process error: ${error.message}`));
      });

      setTimeout(() => {
        process.kill();
        reject(new Error('2FA timeout'));
      }, this.config.timeout);
    });
  }

  async exportSession(sessionId: string): Promise<SessionData | null> {
    if (!this.isAvailable) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const args = [
        'export',
        '--session', sessionId
      ];

      const process = spawn('node', ['index.js', ...args], {
        cwd: this.config.externalPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            const sessionData = JSON.parse(output);
            resolve(sessionData);
          } catch (e) {
            reject(new Error('Invalid session data format'));
          }
        } else {
          reject(new Error(`Export failed: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Process error: ${error.message}`));
      });

      setTimeout(() => {
        process.kill();
        reject(new Error('Export timeout'));
      }, this.config.timeout);
    });
  }

  async rotateFingerprint(sessionId: string): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const args = [
        'rotate',
        '--session', sessionId
      ];

      const process = spawn('node', ['index.js', ...args], {
        cwd: this.config.externalPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Rotation failed: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Process error: ${error.message}`));
      });

      setTimeout(() => {
        process.kill();
        reject(new Error('Rotation timeout'));
      }, this.config.timeout);
    });
  }

  async setProxy(sessionId: string, proxy: string): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const args = [
        'proxy',
        '--session', sessionId,
        '--proxy', proxy
      ];

      const process = spawn('node', ['index.js', ...args], {
        cwd: this.config.externalPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Proxy setting failed: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Process error: ${error.message}`));
      });

      setTimeout(() => {
        process.kill();
        reject(new Error('Proxy setting timeout'));
      }, this.config.timeout);
    });
  }

  async closeSession(sessionId: string): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const args = [
        'close',
        '--session', sessionId
      ];

      const process = spawn('node', ['index.js', ...args], {
        cwd: this.config.externalPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Close failed: ${errorOutput}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Process error: ${error.message}`));
      });

      setTimeout(() => {
        process.kill();
        reject(new Error('Close timeout'));
      }, this.config.timeout);
    });
  }
}

// Exportar instancia por defecto
export const browserMCP = new BrowserMCPHook({
  externalPath: join(process.cwd(), 'external', 'browser-mcp'),
  timeout: 30000,
  retries: 3
}); 