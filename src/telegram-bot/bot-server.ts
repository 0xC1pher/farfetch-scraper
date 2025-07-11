#!/usr/bin/env node

import { MexaTelegramBot } from './index.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Servidor del Telegram Bot
 */
class BotServer {
  private bot: MexaTelegramBot | null = null;

  async start(): Promise<void> {
    try {
      // Validar configuración
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) {
        throw new Error('TELEGRAM_BOT_TOKEN no está configurado en las variables de entorno');
      }

      // Configuración del bot
      const config = {
        token,
        adminChatIds: process.env.TELEGRAM_ADMIN_CHAT_IDS?.split(',') || [],
        maxOffersPerMessage: parseInt(process.env.MAX_OFFERS_PER_MESSAGE || '10'),
        defaultFilters: {
          maxPrice: parseInt(process.env.DEFAULT_MAX_PRICE || '1000'),
          minDiscount: parseInt(process.env.DEFAULT_MIN_DISCOUNT || '0')
        }
      };

      console.log('🤖 Iniciando Mexa Telegram Bot...');
      console.log(`📋 Configuración:`);
      console.log(`   - Max ofertas por mensaje: ${config.maxOffersPerMessage}`);
      console.log(`   - Precio máximo por defecto: €${config.defaultFilters.maxPrice}`);
      console.log(`   - Descuento mínimo por defecto: ${config.defaultFilters.minDiscount}%`);
      console.log(`   - Admins configurados: ${config.adminChatIds.length}`);

      // Crear e iniciar bot
      this.bot = new MexaTelegramBot(config);
      await this.bot.start();

      console.log('✅ Bot iniciado correctamente');
      console.log('📱 El bot está listo para recibir mensajes');

      // Manejar señales de cierre
      this.setupGracefulShutdown();

      // Mostrar estadísticas cada 5 minutos
      this.startStatsReporting();

    } catch (error) {
      console.error('❌ Error iniciando bot:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Recibida señal ${signal}, cerrando bot...`);
      
      if (this.bot) {
        try {
          await this.bot.stop();
          console.log('✅ Bot cerrado correctamente');
        } catch (error) {
          console.error('❌ Error cerrando bot:', error);
        }
      }
      
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Para nodemon
  }

  private startStatsReporting(): void {
    setInterval(() => {
      if (this.bot) {
        const stats = this.bot.getStats();
        console.log(`📊 Estadísticas del bot:`);
        console.log(`   - Estado: ${stats.isRunning ? '🟢 Activo' : '🔴 Inactivo'}`);
        console.log(`   - Sesiones activas: ${stats.activeSessions}`);
        console.log(`   - Tiempo activo: ${Math.floor(stats.uptime / 60)} minutos`);
      }
    }, 5 * 60 * 1000); // Cada 5 minutos
  }
}

// Función principal
async function main() {
  const server = new BotServer();
  await server.start();
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

export { BotServer };
