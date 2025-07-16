#!/usr/bin/env node

/**
 * Script para crear el usuario de desarrollo en MinIO
 */

const { Client } = require('minio');

async function createDevUser() {
  console.log('👤 Creando usuario de desarrollo...');

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
    
    // Datos del usuario de desarrollo
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

    // Guardar usuario en MinIO
    const key = `telegram/users/dev-user-123.json`;
    await minioClient.putObject(
      bucket,
      key,
      JSON.stringify(devUser, null, 2),
      {
        'Content-Type': 'application/json'
      }
    );

    console.log('✅ Usuario de desarrollo creado exitosamente');
    console.log(`📋 Datos del usuario:`);
    console.log(`   Chat ID: ${devUser.chatId}`);
    console.log(`   Nombre: ${devUser.firstName} ${devUser.lastName}`);
    console.log(`   Username: @${devUser.username}`);
    console.log(`   Precio máximo: €${devUser.preferences.maxPrice}`);
    console.log(`   Descuento mínimo: ${devUser.preferences.minDiscount}%`);
    console.log(`   Categorías: ${devUser.preferences.categories.join(', ')}`);

    // También crear algunos favoritos de ejemplo
    const sampleFavorites = [
      {
        id: 'farfetch-real-1752634001593-1',
        title: 'Gucci GG Marmont Mini Bag',
        price: 890,
        brand: 'Gucci',
        addedAt: new Date().toISOString()
      },
      {
        id: 'farfetch-real-1752634001593-3',
        title: 'Balenciaga Triple S Sneakers',
        price: 650,
        brand: 'Balenciaga',
        addedAt: new Date().toISOString()
      }
    ];

    // Guardar favoritos
    const favoritesKey = `telegram/favorites/dev-user-123.json`;
    await minioClient.putObject(
      bucket,
      favoritesKey,
      JSON.stringify(sampleFavorites, null, 2),
      {
        'Content-Type': 'application/json'
      }
    );

    console.log(`✅ ${sampleFavorites.length} favoritos de ejemplo creados`);

  } catch (error) {
    console.error('❌ Error creando usuario de desarrollo:', error.message);
  }
}

// Ejecutar
createDevUser();
