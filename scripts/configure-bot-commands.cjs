#!/usr/bin/env node

/**
 * Script para configurar comandos del bot de Telegram
 */

const https = require('https');

const BOT_TOKEN = '7684393520:AAEl6kse7YMtf5iQWzfNSY6Ta4d_Cg6_xUQ';

function makeRequest(method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function configureBotCommands() {
  console.log('🤖 Configurando comandos del bot MeXa...\n');

  try {
    // 1. Configurar comandos del bot
    console.log('📋 Configurando comandos...');
    
    const commands = [
      { command: 'start', description: 'Iniciar el bot y ver bienvenida' },
      { command: 'search', description: 'Buscar ofertas de Farfetch' },
      { command: 'filters', description: 'Configurar filtros de búsqueda' },
      { command: 'favorites', description: 'Ver productos favoritos' },
      { command: 'status', description: 'Estado del sistema' },
      { command: 'help', description: 'Mostrar ayuda y comandos' }
    ];

    const commandsResult = await makeRequest('setMyCommands', { commands });
    
    if (commandsResult.ok) {
      console.log('✅ Comandos configurados exitosamente');
      commands.forEach(cmd => {
        console.log(`   /${cmd.command} - ${cmd.description}`);
      });
    } else {
      console.log('❌ Error configurando comandos:', commandsResult.description);
    }

    // 2. Configurar descripción del bot
    console.log('\n📝 Configurando descripción...');
    
    const description = 'MeXa Shopping Assistant - Encuentra las mejores ofertas de moda de Farfetch con IA. Navega productos con gestos estilo Tinder, guarda favoritos y recibe notificaciones de ofertas personalizadas.';
    
    const descResult = await makeRequest('setMyDescription', { description });
    
    if (descResult.ok) {
      console.log('✅ Descripción configurada');
    } else {
      console.log('⚠️ Error configurando descripción:', descResult.description);
    }

    // 3. Configurar descripción corta
    console.log('\n📄 Configurando descripción corta...');
    
    const shortDescription = 'Bot de shopping inteligente para ofertas de moda con IA';
    
    const shortDescResult = await makeRequest('setMyShortDescription', { short_description: shortDescription });
    
    if (shortDescResult.ok) {
      console.log('✅ Descripción corta configurada');
    } else {
      console.log('⚠️ Error configurando descripción corta:', shortDescResult.description);
    }

    // 4. Obtener información del bot
    console.log('\n🔍 Verificando información del bot...');
    
    const botInfo = await makeRequest('getMe', {});
    
    if (botInfo.ok) {
      console.log('✅ Bot verificado exitosamente:');
      console.log(`   Nombre: ${botInfo.result.first_name}`);
      console.log(`   Username: @${botInfo.result.username}`);
      console.log(`   ID: ${botInfo.result.id}`);
      console.log(`   Puede unirse a grupos: ${botInfo.result.can_join_groups ? 'Sí' : 'No'}`);
      console.log(`   Puede leer mensajes: ${botInfo.result.can_read_all_group_messages ? 'Sí' : 'No'}`);
    } else {
      console.log('❌ Error verificando bot:', botInfo.description);
    }

    console.log('\n🎉 ¡Configuración completada!');
    console.log('\n📱 Próximos pasos:');
    console.log('1. Ejecuta: npm run bot:dev');
    console.log(`2. Busca @${botInfo.result?.username || 'tu_bot'} en Telegram`);
    console.log('3. Envía /start para probar');
    console.log('4. Usa los comandos configurados');
    
    console.log('\n🔗 Enlaces útiles:');
    console.log(`   Bot: https://t.me/${botInfo.result?.username || 'tu_bot'}`);
    console.log('   Mini App: http://localhost:3000/telegram-app');
    console.log('   Panel Admin: http://localhost:3000/admin');

  } catch (error) {
    console.error('💥 Error configurando bot:', error.message);
    process.exit(1);
  }
}

configureBotCommands();
