#!/usr/bin/env node

/**
 * Script completo para configurar MinIO con buckets y estructura de datos
 */

const { Client } = require('minio');
const fs = require('fs');
const path = require('path');

// Configuración de MinIO
const MINIO_CONFIG = {
  endPoint: 'localhost',
  port: 9010,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: '***REMOVED***'
};

const BUCKET_NAME = 'mexa-data';

async function setupMinIO() {
  console.log('🗄️ Configurando MinIO completamente...\n');

  try {
    // 1. Crear cliente MinIO
    console.log('🔌 Conectando a MinIO...');
    const minioClient = new Client(MINIO_CONFIG);

    // 2. Verificar conexión
    try {
      await minioClient.listBuckets();
      console.log('✅ Conexión a MinIO exitosa');
    } catch (error) {
      console.error('❌ Error conectando a MinIO:', error.message);
      console.log('💡 Asegúrate de que MinIO esté corriendo en puerto 9000');
      process.exit(1);
    }

    // 3. Crear bucket si no existe
    console.log(`\n📦 Verificando bucket '${BUCKET_NAME}'...`);
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`📦 Creando bucket '${BUCKET_NAME}'...`);
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log('✅ Bucket creado exitosamente');
    } else {
      console.log('✅ Bucket ya existe');
    }

    // 4. Configurar política del bucket (público para lectura)
    console.log('\n🔐 Configurando política del bucket...');
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
        },
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:ListBucket'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}`]
        }
      ]
    };

    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    console.log('✅ Política del bucket configurada (acceso público de lectura)');

    // 5. Crear estructura de directorios
    console.log('\n📁 Creando estructura de directorios...');
    
    const directories = [
      'scraperr/',
      'deepscrape/',
      'browser-mcp/',
      'images/',
      'cache/',
      'logs/',
      'favorites/',
      'sessions/'
    ];

    for (const dir of directories) {
      try {
        // Crear un archivo .keep para mantener la estructura
        const keepContent = `# Directorio ${dir}\nCreado automáticamente por MeXa\n`;
        await minioClient.putObject(BUCKET_NAME, `${dir}.keep`, keepContent);
        console.log(`✅ Directorio creado: ${dir}`);
      } catch (error) {
        console.log(`⚠️ Error creando ${dir}:`, error.message);
      }
    }

    // 6. Subir datos de prueba
    console.log('\n📊 Generando datos de prueba...');
    
    // Datos de Scraperr
    const scaperrData = {
      url: 'https://www.farfetch.com/shopping/men/sneakers-1.aspx',
      timestamp: new Date().toISOString(),
      items: [
        {
          id: 'scraperr_001',
          title: 'Nike Air Max 270 React',
          price: 149.99,
          currency: 'EUR',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=375&h=667&fit=crop',
          brand: 'Nike',
          category: 'hombre',
          sizes: ['40', '41', '42', '43', '44'],
          colors: ['Negro', 'Blanco'],
          discount: 25,
          available: true,
          stock: 15,
          reference: 'NK-AM270-001',
          url: 'https://www.farfetch.com/shopping/men/nike-air-max-270-react-sneakers-item-12345.aspx'
        },
        {
          id: 'scraperr_002',
          title: 'Gucci Ace Sneakers',
          price: 590.00,
          currency: 'EUR',
          image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=375&h=667&fit=crop',
          brand: 'Gucci',
          category: 'mujer',
          sizes: ['36', '37', '38', '39', '40'],
          colors: ['Blanco', 'Verde'],
          discount: 15,
          available: true,
          stock: 8,
          reference: 'GC-ACE-002',
          url: 'https://www.farfetch.com/shopping/women/gucci-ace-sneakers-item-67890.aspx'
        }
      ]
    };

    // Datos de DeepScrape
    const deepscrapeData = {
      url: 'https://www.farfetch.com/shopping/women/designer-shoes.aspx',
      timestamp: new Date().toISOString(),
      extractedData: [
        {
          id: 'deepscrape_001',
          title: 'Balenciaga Triple S Sneakers',
          price: 850.00,
          currency: 'EUR',
          image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=375&h=667&fit=crop',
          brand: 'Balenciaga',
          category: 'unisex',
          sizes: ['39', '40', '41', '42', '43'],
          colors: ['Blanco', 'Negro', 'Gris'],
          discount: 20,
          available: true,
          stock: 5,
          reference: 'BAL-TS-001',
          url: 'https://www.farfetch.com/shopping/women/balenciaga-triple-s-sneakers-item-11111.aspx'
        }
      ]
    };

    // Datos de Browser-MCP
    const browserMcpData = {
      sessionId: 'demo_session_' + Date.now(),
      timestamp: new Date().toISOString(),
      products: [
        {
          id: 'browser_mcp_001',
          title: 'Versace Medusa Sneakers',
          price: 695.00,
          currency: 'EUR',
          image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=375&h=667&fit=crop',
          brand: 'Versace',
          category: 'mujer',
          sizes: ['36', '37', '38', '39', '40'],
          colors: ['Dorado', 'Negro'],
          discount: 12,
          available: true,
          stock: 6,
          reference: 'VER-MED-001',
          url: 'https://www.farfetch.com/shopping/women/versace-medusa-sneakers-item-22222.aspx'
        }
      ]
    };

    // Subir datos
    const dataFiles = [
      { path: 'scraperr/demo-data.json', data: scaperrData },
      { path: 'deepscrape/demo-data.json', data: deepscrapeData },
      { path: 'browser-mcp/demo-data.json', data: browserMcpData }
    ];

    for (const file of dataFiles) {
      await minioClient.putObject(
        BUCKET_NAME, 
        file.path, 
        JSON.stringify(file.data, null, 2),
        { 'Content-Type': 'application/json' }
      );
      console.log(`✅ Datos subidos: ${file.path}`);
    }

    // 7. Verificar estructura final
    console.log('\n🔍 Verificando estructura final...');
    
    const objects = [];
    const stream = minioClient.listObjects(BUCKET_NAME, '', true);
    
    for await (const obj of stream) {
      objects.push(obj.name);
    }

    console.log('📁 Estructura del bucket:');
    objects.forEach(obj => {
      console.log(`   ${obj}`);
    });

    console.log('\n🎉 ¡MinIO configurado completamente!');
    console.log('\n📊 Resumen:');
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log(`   Objetos: ${objects.length}`);
    console.log(`   Endpoint: http://localhost:9000`);
    console.log(`   Console: http://localhost:9001`);
    console.log(`   Credenciales: minioadmin / ***REMOVED***`);

  } catch (error) {
    console.error('💥 Error configurando MinIO:', error);
    process.exit(1);
  }
}

// Verificar si minio está disponible
try {
  require('minio');
} catch (error) {
  console.log('📦 Instalando cliente MinIO...');
  const { execSync } = require('child_process');
  execSync('npm install minio', { stdio: 'inherit' });
}

setupMinIO();
