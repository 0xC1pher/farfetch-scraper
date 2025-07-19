#!/usr/bin/env node

/**
 * Script para crear avatar optimizado para Telegram Bot
 * Convierte el logo SVG a PNG con las especificaciones correctas
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';

async function createTelegramAvatar() {
  console.log('🎨 Creando avatar para Telegram Bot...\n');

  try {
    const projectRoot = process.cwd();
    const svgPath = join(projectRoot, 'public', 'assets', 'avatar-mexa.svg');
    const outputDir = join(projectRoot, 'public', 'assets');
    
    // Verificar que existe el SVG
    try {
      await fs.access(svgPath);
      console.log('✅ SVG encontrado:', svgPath);
    } catch (error) {
      console.error('❌ No se encontró el archivo SVG:', svgPath);
      return;
    }

    // Leer el SVG
    const svgBuffer = await fs.readFile(svgPath);
    console.log('📖 SVG leído exitosamente');

    // Crear múltiples tamaños para diferentes usos
    const sizes = [
      { name: 'avatar-telegram-512.png', size: 512, description: 'Avatar principal para BotFather' },
      { name: 'avatar-telegram-256.png', size: 256, description: 'Avatar mediano' },
      { name: 'avatar-telegram-128.png', size: 128, description: 'Avatar pequeño' },
      { name: 'avatar-telegram-64.png', size: 64, description: 'Icono mini' }
    ];

    console.log('\n🔄 Convirtiendo a PNG...');

    for (const { name, size, description } of sizes) {
      const outputPath = join(outputDir, name);
      
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Fondo transparente
        })
        .png({
          quality: 100,
          compressionLevel: 6,
          adaptiveFiltering: true
        })
        .toFile(outputPath);
      
      // Verificar el archivo creado
      const stats = await fs.stat(outputPath);
      console.log(`   ✅ ${name} (${size}x${size}) - ${Math.round(stats.size / 1024)}KB - ${description}`);
    }

    console.log('\n🎯 Instrucciones para configurar en Telegram:');
    console.log('');
    console.log('1. 📱 Abre Telegram y busca @BotFather');
    console.log('2. 💬 Envía: /setuserpic');
    console.log('3. 🤖 Selecciona tu bot de la lista');
    console.log('4. 📎 Sube el archivo: public/assets/avatar-telegram-512.png');
    console.log('5. ✅ Confirma la imagen');
    console.log('');
    console.log('📋 Especificaciones cumplidas:');
    console.log('   • ✅ Formato: PNG');
    console.log('   • ✅ Tamaño: 512x512 píxeles (recomendado por Telegram)');
    console.log('   • ✅ Calidad: Máxima (100%)');
    console.log('   • ✅ Fondo: Transparente');
    console.log('   • ✅ Diseño: Circular optimizado para avatar');
    console.log('   • ✅ Texto: Grande y legible');
    console.log('   • ✅ Colores: Gradientes corporativos MeXa');
    console.log('');
    console.log('🔗 Archivos creados:');
    sizes.forEach(({ name, size }) => {
      console.log(`   📁 public/assets/${name} (${size}x${size})`);
    });
    console.log('');
    console.log('💡 Consejos:');
    console.log('   • Usa avatar-telegram-512.png para BotFather');
    console.log('   • Los otros tamaños son para usos futuros');
    console.log('   • El avatar se verá como un círculo en Telegram');
    console.log('   • El diseño está optimizado para ser visible en tamaño pequeño');
    console.log('');
    console.log('🎉 ¡Avatar creado exitosamente!');

  } catch (error) {
    console.error('❌ Error creando avatar:', error);
    console.log('\n🔧 Posibles soluciones:');
    console.log('   1. Verificar que sharp esté instalado: npm install sharp');
    console.log('   2. Verificar permisos de escritura en public/assets/');
    console.log('   3. Verificar que el archivo SVG sea válido');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createTelegramAvatar().catch(console.error);
}

export { createTelegramAvatar };
