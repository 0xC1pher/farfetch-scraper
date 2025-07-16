#!/usr/bin/env node

/**
 * Script para verificar la estructura de datos de los 3 módulos en MinIO
 * Ejecutar: node verify-minio-structure.js
 */

import { minioStorage } from './src/modules/minio/index.js';

async function verifyMinioStructure() {
  console.log('🔍 VERIFICANDO ESTRUCTURA DE DATOS DE LOS 3 MÓDULOS EN MINIO\n');

  try {
    // 1. Verificar conexión a MinIO
    console.log('1️⃣ Verificando conexión a MinIO...');
    const status = await minioStorage.getStatus();
    console.log('   Estado:', status);
    
    if (!status.available) {
      throw new Error('MinIO no está disponible');
    }

    // 2. Verificar estructura por módulo
    console.log('\n2️⃣ Verificando estructura por módulo...');
    
    const modules = ['browser-mcp', 'scraperr', 'deepscrape', 'consolidated'];
    const moduleData = {};

    for (const module of modules) {
      console.log(`\n📦 Módulo: ${module.toUpperCase()}`);
      
      try {
        // Verificar archivos en la carpeta del módulo
        const objects = await minioStorage.listObjects(`scraping/${module}/`);
        moduleData[module] = {
          fileCount: objects.length,
          files: objects.slice(-5), // Últimos 5 archivos
          success: true
        };
        
        console.log(`   📁 Archivos encontrados: ${objects.length}`);
        
        if (objects.length > 0) {
          console.log('   📋 Últimos archivos:');
          objects.slice(-3).forEach((obj, index) => {
            const date = obj.lastModified ? new Date(obj.lastModified).toLocaleString() : 'N/A';
            console.log(`   ${index + 1}. ${obj.name} (${obj.size} bytes) - ${date}`);
          });
        } else {
          console.log('   ⚠️  Sin archivos encontrados');
        }
        
      } catch (error) {
        moduleData[module] = {
          success: false,
          error: error.message
        };
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // 3. Verificar contenido de datos
    console.log('\n3️⃣ Verificando contenido de datos...');
    
    for (const module of modules) {
      if (moduleData[module].success && moduleData[module].fileCount > 0) {
        console.log(`\n🔍 Analizando contenido de ${module.toUpperCase()}:`);
        
        try {
          // Obtener datos de scraping del módulo
          const scrapingData = await minioStorage.loadScrapingData('', 3);
          const moduleSpecificData = scrapingData.filter(data => 
            data.data?.source === module || 
            (module === 'consolidated' && data.data?.source === 'consolidated')
          );
          
          if (moduleSpecificData.length > 0) {
            const latestData = moduleSpecificData[0];
            console.log(`   📊 Registros encontrados: ${moduleSpecificData.length}`);
            console.log(`   📅 Último registro: ${latestData.timestamp}`);
            console.log(`   🔗 URL: ${latestData.url}`);
            console.log(`   🎯 Ofertas: ${latestData.data?.offers?.length || 0}`);
            console.log(`   📝 Fuente: ${latestData.data?.source || 'N/A'}`);
            
            if (latestData.data?.offers?.length > 0) {
              const offer = latestData.data.offers[0];
              console.log(`   📋 Muestra de oferta:`);
              console.log(`      - ID: ${offer.id}`);
              console.log(`      - Título: ${offer.title}`);
              console.log(`      - Precio: $${offer.price}`);
              console.log(`      - Marca: ${offer.brand}`);
              console.log(`      - Estado: ${offer.availability}`);
              console.log(`      - Timestamp: ${offer.timestamp}`);
            }
            
            // Verificar estructura específica del módulo
            if (module === 'consolidated') {
              console.log(`   🔄 Datos consolidados:`);
              console.log(`      - Estrategias: ${latestData.data?.strategies?.join(', ') || 'N/A'}`);
              console.log(`      - Módulos exitosos: ${latestData.data?.successfulModules || 0}`);
              console.log(`      - Duplicados removidos: ${latestData.data?.duplicatesRemoved || 0}`);
            }
          } else {
            console.log(`   ⚠️  Sin datos específicos encontrados para ${module}`);
          }
          
        } catch (error) {
          console.log(`   ❌ Error analizando contenido: ${error.message}`);
        }
      }
    }

    // 4. Verificar integridad de datos
    console.log('\n4️⃣ Verificando integridad de datos...');
    
    try {
      const allScrapingData = await minioStorage.loadScrapingData('', 10);
      console.log(`   📊 Total registros de scraping: ${allScrapingData.length}`);
      
      // Agrupar por fuente
      const bySource = {};
      allScrapingData.forEach(data => {
        const source = data.data?.source || 'unknown';
        bySource[source] = (bySource[source] || 0) + 1;
      });
      
      console.log('   📈 Distribución por fuente:');
      Object.entries(bySource).forEach(([source, count]) => {
        console.log(`      - ${source}: ${count} registros`);
      });
      
      // Verificar timestamps recientes
      const recentData = allScrapingData.filter(data => {
        const dataTime = new Date(data.timestamp).getTime();
        const now = Date.now();
        return (now - dataTime) < (24 * 60 * 60 * 1000); // Últimas 24 horas
      });
      
      console.log(`   ⏰ Datos recientes (24h): ${recentData.length} registros`);
      
    } catch (error) {
      console.log(`   ❌ Error verificando integridad: ${error.message}`);
    }

    // 5. Resumen final
    console.log('\n📊 RESUMEN DE ESTRUCTURA EN MINIO:');
    
    let totalFiles = 0;
    let successfulModules = 0;
    
    modules.forEach(module => {
      const data = moduleData[module];
      if (data.success) {
        successfulModules++;
        totalFiles += data.fileCount;
        console.log(`   ✅ ${module.toUpperCase()}: ${data.fileCount} archivos`);
      } else {
        console.log(`   ❌ ${module.toUpperCase()}: ${data.error}`);
      }
    });
    
    console.log(`\n🎯 RESULTADO FINAL:`);
    console.log(`   - Módulos con datos: ${successfulModules}/${modules.length}`);
    console.log(`   - Total archivos: ${totalFiles}`);
    console.log(`   - Estructura correcta: ${successfulModules > 0 ? '✅' : '❌'}`);
    console.log(`   - Datos accesibles: ${successfulModules > 0 ? '✅' : '❌'}`);
    
    if (successfulModules === modules.length) {
      console.log('\n🎉 ESTRUCTURA DE DATOS COMPLETA Y CORRECTA');
    } else if (successfulModules > 0) {
      console.log('\n⚠️  ESTRUCTURA PARCIALMENTE CORRECTA');
    } else {
      console.log('\n❌ ESTRUCTURA DE DATOS INCOMPLETA');
    }

  } catch (error) {
    console.error('\n❌ ERROR EN LA VERIFICACIÓN:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar la verificación
verifyMinioStructure().catch(console.error);
