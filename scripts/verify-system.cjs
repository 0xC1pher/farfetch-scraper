#!/usr/bin/env node

/**
 * Script para verificar que todo el sistema esté funcionando correctamente
 */

const https = require('https');
const http = require('http');

function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function verifySystem() {
  console.log('🔍 Verificando sistema MeXa...\n');

  const checks = [
    {
      name: 'MinIO API',
      url: 'http://localhost:9010',
      expected: 'XML response'
    },
    {
      name: 'MinIO Console',
      url: 'http://localhost:9011',
      expected: 'HTML response'
    },
    {
      name: 'Next.js Server',
      url: 'http://localhost:3000',
      expected: 'HTML response'
    },
    {
      name: 'Telegram Offers API',
      url: 'http://localhost:3000/api/telegram/offers?chatId=test&limit=3',
      expected: 'JSON with offers'
    },
    {
      name: 'Bot Status API',
      url: 'http://localhost:3000/api/bot/status',
      expected: 'JSON with bot status'
    },
    {
      name: 'Mini App',
      url: 'http://localhost:3000/telegram-app',
      expected: 'HTML response'
    },
    {
      name: 'Admin Panel',
      url: 'http://localhost:3000/admin',
      expected: 'HTML response'
    },
    {
      name: 'External Modules API',
      url: 'http://localhost:3000/api/external-modules',
      expected: 'JSON with modules'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      console.log(`🔍 Verificando ${check.name}...`);
      const result = await makeRequest(check.url);
      
      if (result.status >= 200 && result.status < 400) {
        console.log(`✅ ${check.name}: OK (${result.status})`);
        
        // Verificaciones específicas
        if (check.name === 'Telegram Offers API' && result.data) {
          if (result.data.success && result.data.offers) {
            console.log(`   📊 Ofertas encontradas: ${result.data.offers.length}`);
          } else {
            console.log(`   ⚠️ No hay ofertas disponibles`);
          }
        }
        
        if (check.name === 'Bot Status API' && result.data) {
          if (result.data.isRunning) {
            console.log(`   🤖 Bot activo con ${result.data.activeSessions} sesiones`);
          } else {
            console.log(`   ⚠️ Bot no está activo`);
          }
        }
        
        passed++;
      } else {
        console.log(`❌ ${check.name}: Error ${result.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
      failed++;
    }
  }

  console.log('\n📊 Resumen de verificación:');
  console.log(`✅ Pasaron: ${passed}`);
  console.log(`❌ Fallaron: ${failed}`);
  console.log(`📈 Éxito: ${Math.round((passed / checks.length) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 ¡Todo el sistema está funcionando correctamente!');
    console.log('\n🔗 URLs importantes:');
    console.log('   Bot: https://t.me/Shopping_MeXa_bot');
    console.log('   Mini App: http://localhost:3000/telegram-app');
    console.log('   Admin Panel: http://localhost:3000/admin');
    console.log('   MinIO Console: http://localhost:9011');
  } else {
    console.log('\n⚠️ Algunos servicios no están funcionando correctamente.');
    console.log('   Revisa los logs y configuraciones.');
  }

  // Verificar datos en MinIO
  console.log('\n🗄️ Verificando datos en MinIO...');
  try {
    const { Client } = require('minio');
    const minioClient = new Client({
      endPoint: 'localhost',
      port: 9010,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin'
    });

    const objects = [];
    const stream = minioClient.listObjects('mexa-data', '', true);
    
    for await (const obj of stream) {
      objects.push(obj.name);
    }

    console.log(`📁 Archivos en MinIO: ${objects.length}`);
    objects.forEach(obj => {
      console.log(`   ${obj}`);
    });

  } catch (error) {
    console.log('❌ Error verificando MinIO:', error.message);
  }
}

// Verificar si minio está disponible
try {
  require('minio');
} catch (error) {
  console.log('📦 MinIO client no está instalado, saltando verificación de datos...');
}

verifySystem().catch(error => {
  console.error('💥 Error en verificación:', error);
  process.exit(1);
});
