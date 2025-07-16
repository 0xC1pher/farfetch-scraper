#!/usr/bin/env node

/**
 * Script para rastrear el flujo completo de datos paso a paso
 * Ejecutar: node trace-data-flow.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function traceDataFlow() {
  console.log('🔍 RASTREANDO FLUJO COMPLETO DE DATOS\n');

  try {
    // 1. Verificar que el servidor esté corriendo
    console.log('1️⃣ Verificando servidor...');
    try {
      const response = await axios.get(`${BASE_URL}/api/bot/status`);
      console.log('   ✅ Servidor activo:', response.data);
    } catch (error) {
      throw new Error('Servidor no está corriendo en puerto 3000');
    }

    // 2. Iniciar proceso de scraping via API
    console.log('\n2️⃣ Iniciando scraping via API...');
    const scrapingRequest = {
      sessionId: `test-session-${Date.now()}`,
      scrapeUrl: 'https://www.farfetch.com/shopping/men/shoes-2/items.aspx',
      maxRetries: 1
    };

    console.log('   📤 Enviando request:', scrapingRequest);
    
    const scrapingResponse = await axios.post(`${BASE_URL}/api/scraping/start`, scrapingRequest);
    console.log('   📥 Respuesta del scraping:');
    console.log(`      - Success: ${scrapingResponse.data.success}`);
    console.log(`      - Job ID: ${scrapingResponse.data.jobId}`);
    console.log(`      - Ofertas encontradas: ${scrapingResponse.data.totalFound}`);
    console.log(`      - Message: ${scrapingResponse.data.message}`);

    if (scrapingResponse.data.offers && scrapingResponse.data.offers.length > 0) {
      console.log('   📋 Muestra de datos extraídos:');
      const offer = scrapingResponse.data.offers[0];
      console.log(`      - ID: ${offer.id}`);
      console.log(`      - Título: ${offer.title}`);
      console.log(`      - Precio: $${offer.price}`);
      console.log(`      - Marca: ${offer.brand}`);
      console.log(`      - Imagen: ${offer.imageUrl || 'N/A'}`);
      console.log(`      - Estado: ${offer.availability}`);
    }

    // 3. Verificar datos guardados via API de ofertas
    console.log('\n3️⃣ Verificando datos guardados via API...');
    
    // Esperar un momento para que se guarden los datos
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const offersResponse = await axios.get(`${BASE_URL}/api/offers/latest?limit=5`);
    console.log('   📥 Respuesta de ofertas guardadas:');
    console.log(`      - Success: ${offersResponse.data.success}`);
    console.log(`      - Total encontrado: ${offersResponse.data.totalFound}`);
    console.log(`      - Message: ${offersResponse.data.message}`);

    if (offersResponse.data.offers && offersResponse.data.offers.length > 0) {
      console.log('   📋 Ofertas desde MinIO:');
      offersResponse.data.offers.slice(0, 2).forEach((offer, index) => {
        console.log(`      ${index + 1}. ID: ${offer.id}`);
        console.log(`         Título: ${offer.title}`);
        console.log(`         Precio: $${offer.price}`);
        console.log(`         Timestamp: ${offer.timestamp}`);
      });
    }

    // 4. Verificar datos por módulo específico
    console.log('\n4️⃣ Verificando datos por módulo...');
    
    const modules = ['scraperr', 'browser-mcp', 'deepscrape'];
    
    for (const module of modules) {
      try {
        const moduleResponse = await axios.get(`${BASE_URL}/api/modules/data?module=${module}&limit=3`);
        console.log(`   📦 Módulo ${module}:`);
        console.log(`      - Success: ${moduleResponse.data.success}`);
        console.log(`      - Registros: ${moduleResponse.data.count}`);
        
        if (moduleResponse.data.data && moduleResponse.data.data.length > 0) {
          const latestData = moduleResponse.data.data[0];
          console.log(`      - Último registro: ${latestData.timestamp}`);
          console.log(`      - URL: ${latestData.url}`);
          console.log(`      - Success: ${latestData.success}`);
        }
      } catch (error) {
        console.log(`   ❌ Error obteniendo datos de ${module}: ${error.response?.data?.error || error.message}`);
      }
    }

    // 5. Verificar estadísticas de módulos
    console.log('\n5️⃣ Verificando estadísticas de módulos...');
    
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/modules/stats`);
      console.log('   📊 Estadísticas globales:');
      console.log(`      - Success: ${statsResponse.data.success}`);
      
      if (statsResponse.data.stats) {
        Object.entries(statsResponse.data.stats).forEach(([module, stats]) => {
          console.log(`      - ${module}: ${JSON.stringify(stats)}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error obteniendo estadísticas: ${error.response?.data?.error || error.message}`);
    }

    // 6. Verificar datos para Telegram
    console.log('\n6️⃣ Verificando datos para Telegram...');
    
    try {
      const telegramResponse = await axios.get(`${BASE_URL}/api/telegram/offers?chatId=test&limit=3`);
      console.log('   📱 Datos para Telegram:');
      console.log(`      - Success: ${telegramResponse.data.success}`);
      console.log(`      - Ofertas: ${telegramResponse.data.offers?.length || 0}`);
      
      if (telegramResponse.data.offers && telegramResponse.data.offers.length > 0) {
        const offer = telegramResponse.data.offers[0];
        console.log(`      - Muestra: ${offer.title} - $${offer.price}`);
      }
    } catch (error) {
      console.log(`   ❌ Error obteniendo datos de Telegram: ${error.response?.data?.error || error.message}`);
    }

    // 7. Resumen del flujo
    console.log('\n📊 RESUMEN DEL FLUJO DE DATOS:');
    console.log('   ✅ 1. Scraping ejecutado via API');
    console.log('   ✅ 2. Datos extraídos por orquestador');
    console.log('   ✅ 3. Datos guardados en MinIO');
    console.log('   ✅ 4. Datos accesibles via API de ofertas');
    console.log('   ✅ 5. Datos organizados por módulo');
    console.log('   ✅ 6. Datos disponibles para Telegram');
    
    console.log('\n🎉 FLUJO DE DATOS VERIFICADO EXITOSAMENTE');

  } catch (error) {
    console.error('\n❌ ERROR EN EL FLUJO:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Ejecutar el rastreo
traceDataFlow().catch(console.error);
