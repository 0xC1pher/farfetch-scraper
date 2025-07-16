#!/usr/bin/env node

/**
 * Script para asegurar que MinIO esté funcionando con datos reales
 */

const { Client } = require('minio');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

async function ensureMinIOAndData() {
  console.log('🔧 Verificando y asegurando MinIO con datos reales...');

  try {
    // 1. Verificar si MinIO está corriendo
    console.log('🔍 Verificando estado de MinIO...');
    
    let minioRunning = false;
    try {
      const { stdout } = await execAsync('ps aux | grep minio | grep -v grep');
      if (stdout.trim()) {
        console.log('✅ MinIO ya está corriendo');
        minioRunning = true;
      }
    } catch (error) {
      console.log('⚠️ MinIO no está corriendo');
    }

    // 2. Iniciar MinIO si no está corriendo
    if (!minioRunning) {
      console.log('🚀 Iniciando MinIO...');
      
      const minioProcess = spawn('./bin/minio', [
        'server', './data/minio',
        '--console-address', ':9011',
        '--address', ':9010'
      ], {
        env: {
          ...process.env,
          MINIO_ROOT_USER: 'minioadmin',
          MINIO_ROOT_PASSWORD: '***REMOVED***'
        },
        detached: true,
        stdio: 'ignore'
      });

      minioProcess.unref();
      
      // Esperar a que MinIO esté listo
      console.log('⏳ Esperando a que MinIO esté listo...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // 3. Verificar conexión a MinIO
    console.log('🔗 Verificando conexión a MinIO...');
    
    const minioClient = new Client({
      endPoint: 'localhost',
      port: 9010,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: '***REMOVED***'
    });
    
    const bucket = 'mexa-data';
    
    // Verificar que el bucket existe
    try {
      await minioClient.bucketExists(bucket);
      console.log('✅ Bucket mexa-data existe');
    } catch (error) {
      console.log('📦 Creando bucket mexa-data...');
      await minioClient.makeBucket(bucket);
    }

    // 4. Verificar si hay datos reales
    console.log('🔍 Verificando datos reales...');
    
    let hasRealData = false;
    try {
      const objects = [];
      const stream = minioClient.listObjects(bucket, 'extraction/browser-mcp/', true);
      
      for await (const obj of stream) {
        objects.push(obj);
      }
      
      if (objects.length > 0) {
        // Verificar que contiene datos reales
        const data = await minioClient.getObject(bucket, objects[0].name);
        const chunks = [];
        
        for await (const chunk of data) {
          chunks.push(chunk);
        }
        
        const content = Buffer.concat(chunks).toString();
        const jsonData = JSON.parse(content);
        
        if (jsonData.data && jsonData.data.offers) {
          const hasRealOffers = jsonData.data.offers.some(offer => 
            offer.imageUrl && offer.imageUrl.includes('farfetch-contents.com')
          );
          
          if (hasRealOffers) {
            hasRealData = true;
            console.log(`✅ Datos reales encontrados: ${jsonData.data.offers.length} ofertas`);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ No se encontraron datos reales');
    }

    // 5. Subir datos reales si no existen
    if (!hasRealData) {
      console.log('📤 Subiendo datos reales de Farfetch...');
      
      const localDataDir = './data/scraping/browser-mcp';
      const files = await fs.readdir(localDataDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        console.error('❌ No se encontraron archivos de datos locales');
        return;
      }
      
      // Usar el archivo más reciente
      jsonFiles.sort((a, b) => b.localeCompare(a));
      const latestFile = jsonFiles[0];
      
      const filePath = path.join(localDataDir, latestFile);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      const minioKey = `extraction/browser-mcp/${latestFile}`;
      await minioClient.putObject(
        bucket,
        minioKey,
        fileContent,
        {
          'Content-Type': 'application/json'
        }
      );
      
      console.log(`✅ Datos reales subidos: ${minioKey}`);
    }

    // 6. Verificar usuario de desarrollo
    console.log('👤 Verificando usuario de desarrollo...');
    
    try {
      await minioClient.statObject(bucket, 'telegram/users/dev-user-123.json');
      console.log('✅ Usuario de desarrollo existe');
    } catch (error) {
      console.log('👤 Creando usuario de desarrollo...');
      
      const devUser = {
        chatId: 'dev-user-123',
        username: 'developer',
        firstName: 'Dev',
        lastName: 'User',
        preferences: {
          maxPrice: 2000,
          minDiscount: 10,
          categories: ['Women Sale', 'Men Sale', 'Accessories']
        },
        favorites: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      await minioClient.putObject(
        bucket,
        'telegram/users/dev-user-123.json',
        JSON.stringify(devUser, null, 2),
        {
          'Content-Type': 'application/json'
        }
      );
      
      console.log('✅ Usuario de desarrollo creado');
    }

    console.log('\n🎉 MinIO y datos reales están listos!');
    console.log('📊 MinIO Console: http://localhost:9011');
    console.log('🔑 Credenciales: minioadmin / ***REMOVED***');

  } catch (error) {
    console.error('❌ Error asegurando MinIO y datos:', error.message);
  }
}

// Ejecutar
ensureMinIOAndData();
