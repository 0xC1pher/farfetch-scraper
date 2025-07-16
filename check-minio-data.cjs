#!/usr/bin/env node

const { Client } = require('minio');

async function checkMinIOData() {
  console.log('🔍 Verificando datos en MinIO...');

  try {
    const minioClient = new Client({
      endPoint: 'localhost',
      port: 9010,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin123'
    });
    
    const bucket = 'mexa-data';

    // Verificar todos los prefijos
    const prefixes = ['extraction/', 'modules/', 'telegram/'];
    
    for (const prefix of prefixes) {
      console.log(`\n📁 Verificando ${prefix}:`);
      
      try {
        const objects = [];
        const stream = minioClient.listObjects(bucket, prefix, true);
        
        for await (const obj of stream) {
          objects.push(obj);
        }
        
        if (objects.length > 0) {
          console.log(`   ✅ ${objects.length} objetos encontrados:`);
          objects.forEach(obj => {
            console.log(`      📄 ${obj.name} (${obj.size} bytes)`);
          });
          
          // Si es extraction/, verificar contenido del primer archivo
          if (prefix === 'extraction/' && objects.length > 0) {
            try {
              const data = await minioClient.getObject(bucket, objects[0].name);
              const chunks = [];
              
              for await (const chunk of data) {
                chunks.push(chunk);
              }
              
              const content = Buffer.concat(chunks).toString();
              const jsonData = JSON.parse(content);
              
              if (jsonData.data && jsonData.data.offers) {
                console.log(`      📊 Contiene ${jsonData.data.offers.length} ofertas`);
                console.log(`      🏷️ Primera oferta: ${jsonData.data.offers[0].title} - €${jsonData.data.offers[0].price}`);
              }
            } catch (error) {
              console.log(`      ⚠️ Error leyendo contenido: ${error.message}`);
            }
          }
        } else {
          console.log(`   ❌ No hay objetos en ${prefix}`);
        }
      } catch (error) {
        console.log(`   ❌ Error listando ${prefix}: ${error.message}`);
      }
    }

    // Verificar módulos específicos
    console.log('\n🔧 Verificando módulos específicos:');
    const modules = ['browser-mcp', 'scraperr', 'deepscrape'];
    
    for (const module of modules) {
      const modulePrefix = `extraction/${module}/`;
      
      try {
        const objects = [];
        const stream = minioClient.listObjects(bucket, modulePrefix, true);
        
        for await (const obj of stream) {
          objects.push(obj);
        }
        
        console.log(`   ${module}: ${objects.length} archivos`);
      } catch (error) {
        console.log(`   ${module}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error verificando MinIO:', error.message);
  }
}

checkMinIOData();
