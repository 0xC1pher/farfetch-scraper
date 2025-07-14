#!/usr/bin/env node

/**
 * Script simple para configurar MinIO con credenciales por defecto
 */

const { Client } = require('minio');

// Configuración de MinIO con credenciales por defecto
const MINIO_CONFIG = {
  endPoint: 'localhost',
  port: 9010,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin'
};

const BUCKET_NAME = 'mexa-data';

async function setupMinIO() {
  console.log('🗄️ Configurando MinIO...\n');

  try {
    // 1. Crear cliente MinIO
    console.log('🔌 Conectando a MinIO...');
    const minioClient = new Client(MINIO_CONFIG);

    // 2. Verificar conexión
    try {
      const buckets = await minioClient.listBuckets();
      console.log('✅ Conexión a MinIO exitosa');
      console.log(`📦 Buckets existentes: ${buckets.length}`);
    } catch (error) {
      console.error('❌ Error conectando a MinIO:', error.message);
      console.log('💡 Intentando con credenciales alternativas...');
      
      // Intentar con credenciales alternativas
      const altConfig = { ...MINIO_CONFIG, secretKey: '***REMOVED***' };
      const altClient = new Client(altConfig);
      
      try {
        await altClient.listBuckets();
        console.log('✅ Conexión exitosa con credenciales alternativas');
        minioClient = altClient;
      } catch (altError) {
        console.error('❌ Error con credenciales alternativas:', altError.message);
        process.exit(1);
      }
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

    // 4. Subir datos de prueba
    console.log('\n📊 Subiendo datos de prueba...');
    
    const testData = {
      scraperr: {
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
      },
      deepscrape: {
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
      },
      browserMcp: {
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
      }
    };

    // Subir archivos de datos
    const uploads = [
      { path: 'scraperr/demo-data.json', data: testData.scraperr },
      { path: 'deepscrape/demo-data.json', data: testData.deepscrape },
      { path: 'browser-mcp/demo-data.json', data: testData.browserMcp }
    ];

    for (const upload of uploads) {
      try {
        await minioClient.putObject(
          BUCKET_NAME, 
          upload.path, 
          JSON.stringify(upload.data, null, 2),
          { 'Content-Type': 'application/json' }
        );
        console.log(`✅ Subido: ${upload.path}`);
      } catch (error) {
        console.log(`⚠️ Error subiendo ${upload.path}:`, error.message);
      }
    }

    // 5. Verificar archivos subidos
    console.log('\n🔍 Verificando archivos...');
    
    const objects = [];
    const stream = minioClient.listObjects(BUCKET_NAME, '', true);
    
    for await (const obj of stream) {
      objects.push(obj.name);
    }

    console.log('📁 Archivos en el bucket:');
    objects.forEach(obj => {
      console.log(`   ${obj}`);
    });

    console.log('\n🎉 ¡MinIO configurado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log(`   Archivos: ${objects.length}`);
    console.log(`   API: http://localhost:9010`);
    console.log(`   Console: http://localhost:9011`);
    console.log(`   Credenciales: minioadmin / minioadmin`);

  } catch (error) {
    console.error('💥 Error configurando MinIO:', error);
    process.exit(1);
  }
}

setupMinIO();
