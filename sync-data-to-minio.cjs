#!/usr/bin/env node

/**
 * Script para sincronizar datos del directorio local a MinIO
 */

const { Client } = require('minio');
const fs = require('fs').promises;
const path = require('path');

async function syncDataToMinIO() {
  console.log('🔄 Sincronizando datos del directorio local a MinIO...');

  try {
    // Crear cliente MinIO
    const minioClient = new Client({
      endPoint: 'localhost',
      port: 9010,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin123'
    });
    
    const bucket = 'mexa-data';
    const localDataDir = './data/scraping';

    // Verificar que el directorio existe
    try {
      await fs.access(localDataDir);
    } catch (error) {
      console.error('❌ Directorio de datos no encontrado:', localDataDir);
      return;
    }

    // Leer módulos
    const modules = await fs.readdir(localDataDir);
    console.log(`📁 Módulos encontrados: ${modules.join(', ')}`);

    let totalFiles = 0;
    let uploadedFiles = 0;

    for (const module of modules) {
      const modulePath = path.join(localDataDir, module);
      const stat = await fs.stat(modulePath);
      
      if (stat.isDirectory()) {
        console.log(`\n📦 Procesando módulo: ${module}`);
        
        // Leer archivos del módulo
        const files = await fs.readdir(modulePath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        console.log(`   📄 Archivos JSON encontrados: ${jsonFiles.length}`);
        totalFiles += jsonFiles.length;

        for (const file of jsonFiles) {
          const filePath = path.join(modulePath, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          
          // Verificar que es JSON válido
          try {
            const data = JSON.parse(fileContent);
            
            // Crear clave para MinIO
            const minioKey = `modules/${module}/${file}`;
            
            // Subir a MinIO
            await minioClient.putObject(
              bucket,
              minioKey,
              fileContent,
              {
                'Content-Type': 'application/json'
              }
            );
            
            uploadedFiles++;
            console.log(`   ✅ Subido: ${file} -> ${minioKey}`);
            
            // Mostrar resumen del contenido
            if (data.data && data.data.offers) {
              console.log(`      📊 ${data.data.offers.length} ofertas`);
            }
            
          } catch (parseError) {
            console.warn(`   ⚠️ Error parseando ${file}:`, parseError.message);
          }
        }
      }
    }

    console.log(`\n✅ Sincronización completada:`);
    console.log(`   📁 Total archivos procesados: ${totalFiles}`);
    console.log(`   ⬆️ Archivos subidos exitosamente: ${uploadedFiles}`);
    console.log(`   ❌ Archivos con errores: ${totalFiles - uploadedFiles}`);

    // Verificar que los datos están en MinIO
    console.log('\n🔍 Verificando datos en MinIO...');
    
    try {
      const objects = [];
      const stream = minioClient.listObjects(bucket, 'modules/', true);
      
      for await (const obj of stream) {
        objects.push(obj);
      }
      
      console.log(`✅ ${objects.length} objetos encontrados en MinIO`);
      
      // Mostrar algunos ejemplos
      objects.slice(0, 3).forEach(obj => {
        console.log(`   📄 ${obj.name} (${obj.size} bytes)`);
      });
      
    } catch (listError) {
      console.warn('⚠️ Error listando objetos en MinIO:', listError.message);
    }

  } catch (error) {
    console.error('❌ Error sincronizando datos:', error.message);
  }
}

// Ejecutar
syncDataToMinIO();
