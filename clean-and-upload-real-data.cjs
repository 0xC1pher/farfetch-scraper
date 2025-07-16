#!/usr/bin/env node

/**
 * Script para limpiar datos de prueba y subir solo datos reales de Farfetch
 */

const { Client } = require('minio');
const fs = require('fs').promises;
const path = require('path');

async function cleanAndUploadRealData() {
  console.log('🧹 Limpiando datos de prueba y subiendo datos reales...');

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

    // 1. Limpiar datos existentes de módulos
    console.log('🗑️ Limpiando datos existentes...');

    const prefixes = ['modules/', 'extraction/'];
    let totalDeleted = 0;

    for (const prefix of prefixes) {
      try {
        const objects = [];
        const stream = minioClient.listObjects(bucket, prefix, true);

        for await (const obj of stream) {
          objects.push(obj.name);
        }

        if (objects.length > 0) {
          await minioClient.removeObjects(bucket, objects);
          console.log(`✅ ${objects.length} objetos eliminados de ${prefix}`);
          totalDeleted += objects.length;
        }
      } catch (error) {
        console.warn(`⚠️ Error limpiando ${prefix}:`, error.message);
      }
    }

    if (totalDeleted === 0) {
      console.log('ℹ️ No hay objetos para eliminar');
    }

    // 2. Subir solo los datos reales más recientes
    console.log('\n📤 Subiendo datos reales de Farfetch...');
    
    const localDataDir = './data/scraping/browser-mcp';
    const files = await fs.readdir(localDataDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // Ordenar por fecha (más reciente primero)
    jsonFiles.sort((a, b) => b.localeCompare(a));
    
    console.log(`📄 Archivos encontrados: ${jsonFiles.length}`);
    
    // Tomar solo el archivo más reciente
    const latestFile = jsonFiles[0];
    if (!latestFile) {
      console.error('❌ No se encontraron archivos de datos');
      return;
    }
    
    console.log(`📋 Usando archivo más reciente: ${latestFile}`);
    
    const filePath = path.join(localDataDir, latestFile);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Verificar que contiene datos reales de Farfetch
    const data = JSON.parse(fileContent);
    if (!data.data || !data.data.offers || data.data.offers.length === 0) {
      console.error('❌ El archivo no contiene ofertas válidas');
      return;
    }
    
    // Verificar que son datos reales (deben tener imageUrl de Farfetch)
    const hasRealData = data.data.offers.some(offer => 
      offer.imageUrl && offer.imageUrl.includes('farfetch-contents.com')
    );
    
    if (!hasRealData) {
      console.error('❌ El archivo no contiene datos reales de Farfetch');
      return;
    }
    
    console.log(`✅ Archivo contiene ${data.data.offers.length} ofertas reales de Farfetch`);
    
    // Mostrar algunas ofertas
    data.data.offers.slice(0, 3).forEach((offer, i) => {
      console.log(`   ${i + 1}. ${offer.title} - €${offer.price} (${offer.brand})`);
    });
    
    // Subir a MinIO (ubicación correcta para la API)
    const minioKey = `extraction/browser-mcp/${latestFile}`;
    await minioClient.putObject(
      bucket,
      minioKey,
      fileContent,
      {
        'Content-Type': 'application/json'
      }
    );
    
    console.log(`\n✅ Datos reales subidos exitosamente: ${minioKey}`);
    
    // Verificar que se subió correctamente
    try {
      const objectInfo = await minioClient.statObject(bucket, minioKey);
      console.log(`📊 Tamaño del archivo: ${objectInfo.size} bytes`);
      console.log(`📅 Última modificación: ${objectInfo.lastModified}`);
    } catch (error) {
      console.warn('⚠️ Error verificando objeto subido:', error.message);
    }

  } catch (error) {
    console.error('❌ Error procesando datos:', error.message);
  }
}

// Ejecutar
cleanAndUploadRealData();
