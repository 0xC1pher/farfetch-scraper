#!/usr/bin/env node

/**
 * Script para verificar la estructura de datos en MinIO
 * Ejecutar: node check-data-structure.js
 */

import { minioStorage } from './src/modules/minio/index.js';

async function checkDataStructure() {
  console.log('🔍 VERIFICANDO ESTRUCTURA DE DATOS EN MINIO\n');

  try {
    // 1. Verificar conexión
    console.log('1️⃣ Verificando conexión a MinIO...');
    const status = await minioStorage.getStatus();
    console.log('   Estado:', status);
    
    if (!status.available) {
      throw new Error('MinIO no está disponible');
    }

    // 2. Listar estructura del bucket
    console.log('\n2️⃣ Explorando estructura del bucket...');
    
    // Verificar carpetas principales
    const folders = ['scraping/', 'sessions/', 'extraction/'];
    
    for (const folder of folders) {
      console.log(`\n📁 Carpeta: ${folder}`);
      const objects = await minioStorage.listObjects(folder);
      console.log(`   Archivos encontrados: ${objects.length}`);
      
      if (objects.length > 0) {
        console.log('   📋 Últimos archivos:');
        objects.slice(-5).forEach((obj, index) => {
          const date = obj.lastModified ? new Date(obj.lastModified).toLocaleString() : 'N/A';
          console.log(`   ${index + 1}. ${obj.name} (${obj.size} bytes) - ${date}`);
        });
      }
    }

    // 3. Verificar datos de scraping específicos
    console.log('\n3️⃣ Verificando datos de scraping...');
    const scrapingData = await minioStorage.loadScrapingData('', 5);
    console.log(`   Registros de scraping: ${scrapingData.length}`);
    
    if (scrapingData.length > 0) {
      console.log('\n   📊 Análisis de estructura de datos:');
      scrapingData.forEach((data, index) => {
        console.log(`\n   Registro ${index + 1}:`);
        console.log(`   - URL: ${data.url}`);
        console.log(`   - Timestamp: ${data.timestamp}`);
        console.log(`   - Ofertas: ${data.data?.offers?.length || 0}`);
        console.log(`   - Fuente: ${data.data?.source || 'N/A'}`);
        console.log(`   - Estrategias: ${data.data?.strategies?.join(', ') || 'N/A'}`);
        
        if (data.data?.offers?.length > 0) {
          const offer = data.data.offers[0];
          console.log(`   - Muestra de oferta:`);
          console.log(`     * ID: ${offer.id}`);
          console.log(`     * Título: ${offer.title}`);
          console.log(`     * Precio: $${offer.price}`);
          console.log(`     * Marca: ${offer.brand}`);
          console.log(`     * Estado: ${offer.availability}`);
        }
      });
    }

    // 4. Verificar datos para API
    console.log('\n4️⃣ Verificando datos para API...');
    const apiData = await minioStorage.getScrapingData('', 3);
    console.log(`   Datos disponibles para API: ${apiData.length}`);

    // 5. Verificar sesiones
    console.log('\n5️⃣ Verificando sesiones...');
    const sessions = await minioStorage.listSessions();
    console.log(`   Sesiones guardadas: ${sessions.length}`);

    console.log('\n✅ VERIFICACIÓN COMPLETADA');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar la verificación
checkDataStructure().catch(console.error);
