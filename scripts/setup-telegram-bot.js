#!/usr/bin/env node

/**
 * Script para configurar el bot de Telegram con token real
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupTelegramBot() {
  console.log('🤖 Configuración del Bot de Telegram MeXa\n');
  
  console.log('📋 Pasos para crear el bot:');
  console.log('1. Abre Telegram y busca @BotFather');
  console.log('2. Envía /newbot');
  console.log('3. Elige un nombre: "MeXa Shopping Assistant"');
  console.log('4. Elige un username: "mexashoppingbot" (o similar)');
  console.log('5. Copia el token que te dé @BotFather\n');

  const token = await question('🔑 Pega aquí el token del bot: ');
  
  if (!token || !token.includes(':')) {
    console.log('❌ Token inválido. Debe tener formato: 123456789:ABCdefGHIjklMNOpqrstUVWxyz');
    process.exit(1);
  }

  console.log('\n📱 Configuración adicional:');
  
  const adminChatId = await question('👤 Tu Chat ID de Telegram (opcional, presiona Enter para omitir): ');
  const maxPrice = await question('💰 Precio máximo por defecto (EUR, presiona Enter para 1000): ') || '1000';
  const minDiscount = await question('🏷️ Descuento mínimo por defecto (%, presiona Enter para 0): ') || '0';

  // Leer archivo .env actual
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Actualizar configuración de Telegram
  const telegramConfig = [
    `# Configuración del Bot de Telegram`,
    `TELEGRAM_BOT_TOKEN=${token}`,
    `TELEGRAM_ADMIN_CHAT_IDS=${adminChatId || ''}`,
    `MAX_OFFERS_PER_MESSAGE=10`,
    `DEFAULT_MAX_PRICE=${maxPrice}`,
    `DEFAULT_MIN_DISCOUNT=${minDiscount}`
  ].join('\n');

  // Reemplazar sección de Telegram en .env
  const telegramSectionRegex = /# Configuración del Bot de Telegram[\s\S]*?(?=\n#|\n[A-Z]|$)/;
  
  if (telegramSectionRegex.test(envContent)) {
    envContent = envContent.replace(telegramSectionRegex, telegramConfig);
  } else {
    envContent += '\n\n' + telegramConfig;
  }

  // Guardar archivo .env
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Configuración guardada en .env');
  
  // Configurar comandos del bot
  console.log('\n🔧 Configurando comandos del bot...');
  
  try {
    const axios = require('axios');
    
    const commands = [
      { command: 'start', description: 'Iniciar el bot y ver bienvenida' },
      { command: 'search', description: 'Buscar ofertas de Farfetch' },
      { command: 'filters', description: 'Configurar filtros de búsqueda' },
      { command: 'favorites', description: 'Ver productos favoritos' },
      { command: 'status', description: 'Estado del sistema' },
      { command: 'help', description: 'Mostrar ayuda y comandos' }
    ];

    const response = await axios.post(`https://api.telegram.org/bot${token}/setMyCommands`, {
      commands: commands
    });

    if (response.data.ok) {
      console.log('✅ Comandos del bot configurados exitosamente');
    } else {
      console.log('⚠️ Error configurando comandos:', response.data.description);
    }

  } catch (error) {
    console.log('⚠️ No se pudieron configurar los comandos automáticamente');
    console.log('   Puedes configurarlos manualmente enviando /setcommands a @BotFather');
  }

  // Configurar Mini App
  console.log('\n📱 Configurando Mini App...');
  
  const miniAppUrl = await question('🌐 URL de tu Mini App (presiona Enter para localhost:3000): ') || 'http://localhost:3000/telegram-app';
  
  try {
    const axios = require('axios');
    
    const response = await axios.post(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
      menu_button: {
        type: 'web_app',
        text: 'Abrir MeXa',
        web_app: {
          url: miniAppUrl
        }
      }
    });

    if (response.data.ok) {
      console.log('✅ Mini App configurada exitosamente');
    } else {
      console.log('⚠️ Error configurando Mini App:', response.data.description);
    }

  } catch (error) {
    console.log('⚠️ No se pudo configurar la Mini App automáticamente');
  }

  console.log('\n🎉 ¡Configuración completada!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Ejecuta: npm run bot:dev');
  console.log('2. Busca tu bot en Telegram');
  console.log('3. Envía /start para probar');
  console.log('4. Usa el botón "Abrir MeXa" para la Mini App');
  
  console.log('\n🔧 URLs importantes:');
  console.log(`   Bot: https://t.me/${token.split(':')[0]}`);
  console.log(`   Mini App: ${miniAppUrl}`);
  console.log(`   Panel Admin: http://localhost:3000/admin`);
  console.log(`   MinIO Console: http://localhost:9001`);

  rl.close();
}

// Verificar si axios está disponible
try {
  require('axios');
} catch (error) {
  console.log('📦 Instalando dependencia axios...');
  const { execSync } = require('child_process');
  execSync('npm install axios', { stdio: 'inherit' });
}

setupTelegramBot().catch(error => {
  console.error('💥 Error en configuración:', error);
  process.exit(1);
});
