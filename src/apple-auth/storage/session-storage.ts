import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash, createCipher, createDecipher } from 'crypto';

export interface AppleSession {
  sessionId: string;
  email: string;
  cookies: any[];
  timestamp: Date;
  userAgent: string;
  url: string;
  isValid: boolean;
  expiresAt: Date;
}

export interface SessionData {
  email: string;
  cookies: any[];
  timestamp: Date;
  userAgent: string;
  url: string;
}

export class SessionStorage {
  private readonly storageDir: string;
  private readonly encryptionKey: string;

  constructor() {
    this.storageDir = join(process.cwd(), 'data', 'apple-sessions');
    this.encryptionKey = this.generateEncryptionKey();
    this.ensureStorageDir();
  }

  /**
   * Asegurar que el directorio de almacenamiento existe
   */
  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('❌ Error creando directorio de sesiones:', error);
    }
  }

  /**
   * Generar clave de encriptación basada en el entorno
   */
  private generateEncryptionKey(): string {
    const baseKey = process.env.APPLE_SESSION_KEY || 'mexa-apple-auth-key-2024';
    return createHash('sha256').update(baseKey).digest('hex').substring(0, 32);
  }

  /**
   * Encriptar datos
   */
  private encrypt(data: string): string {
    try {
      const cipher = createCipher('aes-256-cbc', this.encryptionKey);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      console.error('❌ Error encriptando datos:', error);
      return data; // Fallback sin encriptación
    }
  }

  /**
   * Desencriptar datos
   */
  private decrypt(encryptedData: string): string {
    try {
      const decipher = createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('❌ Error desencriptando datos:', error);
      return encryptedData; // Fallback sin desencriptación
    }
  }

  /**
   * Guardar sesión
   */
  async saveSession(sessionData: SessionData): Promise<string> {
    try {
      const sessionId = this.generateSessionId(sessionData.email);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

      const session: AppleSession = {
        sessionId,
        email: sessionData.email,
        cookies: sessionData.cookies,
        timestamp: sessionData.timestamp,
        userAgent: sessionData.userAgent,
        url: sessionData.url,
        isValid: true,
        expiresAt
      };

      const sessionJson = JSON.stringify(session, null, 2);
      const encryptedSession = this.encrypt(sessionJson);
      
      const filePath = join(this.storageDir, `${sessionId}.json`);
      await fs.writeFile(filePath, encryptedSession, 'utf8');

      console.log('💾 Sesión Apple guardada:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('❌ Error guardando sesión:', error);
      throw new Error(`Failed to save session: ${error}`);
    }
  }

  /**
   * Cargar sesión
   */
  async loadSession(sessionId: string): Promise<AppleSession | null> {
    try {
      const filePath = join(this.storageDir, `${sessionId}.json`);
      
      // Verificar si el archivo existe
      try {
        await fs.access(filePath);
      } catch {
        console.log('📂 Sesión no encontrada:', sessionId);
        return null;
      }

      const encryptedData = await fs.readFile(filePath, 'utf8');
      const decryptedData = this.decrypt(encryptedData);
      const session: AppleSession = JSON.parse(decryptedData);

      // Verificar si la sesión ha expirado
      if (new Date() > new Date(session.expiresAt)) {
        console.log('⏰ Sesión expirada:', sessionId);
        await this.deleteSession(sessionId);
        return null;
      }

      // Verificar si la sesión es válida
      if (!session.isValid) {
        console.log('❌ Sesión inválida:', sessionId);
        return null;
      }

      console.log('✅ Sesión Apple cargada:', sessionId);
      return session;
    } catch (error) {
      console.error('❌ Error cargando sesión:', error);
      return null;
    }
  }

  /**
   * Obtener sesión activa para un email
   */
  async getActiveSession(email: string): Promise<AppleSession | null> {
    try {
      const files = await fs.readdir(this.storageDir);
      const sessionFiles = files.filter(file => file.endsWith('.json'));

      for (const file of sessionFiles) {
        const sessionId = file.replace('.json', '');
        const session = await this.loadSession(sessionId);
        
        if (session && session.email === email && session.isValid) {
          return session;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error buscando sesión activa:', error);
      return null;
    }
  }

  /**
   * Invalidar sesión
   */
  async invalidateSession(sessionId: string): Promise<void> {
    try {
      const session = await this.loadSession(sessionId);
      if (session) {
        session.isValid = false;
        
        const sessionJson = JSON.stringify(session, null, 2);
        const encryptedSession = this.encrypt(sessionJson);
        
        const filePath = join(this.storageDir, `${sessionId}.json`);
        await fs.writeFile(filePath, encryptedSession, 'utf8');
        
        console.log('❌ Sesión invalidada:', sessionId);
      }
    } catch (error) {
      console.error('❌ Error invalidando sesión:', error);
    }
  }

  /**
   * Eliminar sesión
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const filePath = join(this.storageDir, `${sessionId}.json`);
      await fs.unlink(filePath);
      console.log('🗑️ Sesión eliminada:', sessionId);
    } catch (error) {
      console.error('❌ Error eliminando sesión:', error);
    }
  }

  /**
   * Limpiar sesiones expiradas
   */
  async cleanExpiredSessions(): Promise<void> {
    try {
      const files = await fs.readdir(this.storageDir);
      const sessionFiles = files.filter(file => file.endsWith('.json'));
      let cleanedCount = 0;

      for (const file of sessionFiles) {
        const sessionId = file.replace('.json', '');
        const session = await this.loadSession(sessionId);
        
        if (!session) {
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 ${cleanedCount} sesiones expiradas limpiadas`);
      }
    } catch (error) {
      console.error('❌ Error limpiando sesiones:', error);
    }
  }

  /**
   * Listar todas las sesiones
   */
  async listSessions(): Promise<AppleSession[]> {
    try {
      const files = await fs.readdir(this.storageDir);
      const sessionFiles = files.filter(file => file.endsWith('.json'));
      const sessions: AppleSession[] = [];

      for (const file of sessionFiles) {
        const sessionId = file.replace('.json', '');
        const session = await this.loadSession(sessionId);
        
        if (session) {
          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      console.error('❌ Error listando sesiones:', error);
      return [];
    }
  }

  /**
   * Generar ID de sesión único
   */
  private generateSessionId(email: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const emailHash = createHash('md5').update(email).digest('hex').substring(0, 8);
    
    return `apple_${emailHash}_${timestamp}_${random}`;
  }

  /**
   * Verificar si hay sesión válida para Apple
   */
  async hasValidAppleSession(): Promise<boolean> {
    const appleEmail = process.env.Apple_user;
    if (!appleEmail) return false;

    const session = await this.getActiveSession(appleEmail);
    return session !== null;
  }

  /**
   * Obtener sesión Apple del .env
   */
  async getAppleSession(): Promise<AppleSession | null> {
    const appleEmail = process.env.Apple_user;
    if (!appleEmail) return null;

    return await this.getActiveSession(appleEmail);
  }
}
