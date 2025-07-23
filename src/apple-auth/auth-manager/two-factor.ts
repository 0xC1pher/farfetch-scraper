export interface TwoFactorRequest {
  token: string;
  email: string;
  timestamp: Date;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

export class TwoFactorHandler {
  private pendingRequests: Map<string, TwoFactorRequest> = new Map();
  private readonly maxAttempts = 3;
  private readonly tokenExpiryMinutes = 10;

  /**
   * Crear solicitud de 2FA
   */
  createTwoFactorRequest(email: string): string {
    const token = this.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.tokenExpiryMinutes * 60 * 1000);

    const request: TwoFactorRequest = {
      token,
      email,
      timestamp: now,
      expiresAt,
      attempts: 0,
      maxAttempts: this.maxAttempts
    };

    this.pendingRequests.set(token, request);
    
    // Limpiar token después de expirar
    setTimeout(() => {
      this.pendingRequests.delete(token);
    }, this.tokenExpiryMinutes * 60 * 1000);

    console.log('🔐 Solicitud 2FA creada para:', email);
    return token;
  }

  /**
   * Validar token de 2FA
   */
  validateToken(token: string): TwoFactorRequest | null {
    const request = this.pendingRequests.get(token);
    
    if (!request) {
      console.log('❌ Token 2FA no encontrado:', token);
      return null;
    }

    if (new Date() > request.expiresAt) {
      console.log('⏰ Token 2FA expirado:', token);
      this.pendingRequests.delete(token);
      return null;
    }

    if (request.attempts >= request.maxAttempts) {
      console.log('🚫 Máximo de intentos 2FA alcanzado:', token);
      this.pendingRequests.delete(token);
      return null;
    }

    return request;
  }

  /**
   * Incrementar intentos de 2FA
   */
  incrementAttempts(token: string): boolean {
    const request = this.pendingRequests.get(token);
    
    if (!request) return false;

    request.attempts++;
    
    if (request.attempts >= request.maxAttempts) {
      console.log('🚫 Máximo de intentos 2FA alcanzado, eliminando token:', token);
      this.pendingRequests.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Completar solicitud 2FA
   */
  completeTwoFactorRequest(token: string): boolean {
    const request = this.pendingRequests.get(token);
    
    if (!request) return false;

    this.pendingRequests.delete(token);
    console.log('✅ Solicitud 2FA completada para:', request.email);
    return true;
  }

  /**
   * Obtener información de solicitud 2FA
   */
  getTwoFactorInfo(token: string): Partial<TwoFactorRequest> | null {
    const request = this.validateToken(token);
    
    if (!request) return null;

    return {
      email: request.email,
      timestamp: request.timestamp,
      expiresAt: request.expiresAt,
      attempts: request.attempts,
      maxAttempts: request.maxAttempts
    };
  }

  /**
   * Limpiar solicitudes expiradas
   */
  cleanExpiredRequests(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [token, request] of this.pendingRequests.entries()) {
      if (now > request.expiresAt) {
        this.pendingRequests.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 ${cleanedCount} solicitudes 2FA expiradas limpiadas`);
    }
  }

  /**
   * Obtener estadísticas de 2FA
   */
  getStats(): {
    pendingRequests: number;
    totalRequests: number;
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      totalRequests: this.pendingRequests.size // Simplificado para esta implementación
    };
  }

  /**
   * Generar token único
   */
  private generateToken(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `2fa_${timestamp}_${random}`;
  }

  /**
   * Validar formato de código 2FA
   */
  validateCodeFormat(code: string): boolean {
    // Apple típicamente usa códigos de 6 dígitos
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(code.trim());
  }

  /**
   * Limpiar código 2FA (remover espacios, guiones, etc.)
   */
  cleanCode(code: string): string {
    return code.replace(/\s|-/g, '').trim();
  }
}
