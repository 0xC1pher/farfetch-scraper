/**
 * Servidor MinIO Mock para desarrollo
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 9002;
const DATA_DIR = path.join(__dirname, '../.minio-mock-data');

// Middleware
app.use(cors());
app.use(express.json());

// Crear directorio de datos si no existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Simular bucket
const BUCKET = 'mexa-data';
const BUCKET_DIR = path.join(DATA_DIR, BUCKET);
if (!fs.existsSync(BUCKET_DIR)) {
  fs.mkdirSync(BUCKET_DIR, { recursive: true });
}

// Health check
app.get('/minio/health/live', (req, res) => {
  res.status(200).send('OK');
});

// Bucket operations
app.head(`/${BUCKET}`, (req, res) => {
  res.status(200).send();
});

app.get(`/${BUCKET}`, (req, res) => {
  const prefix = req.query.prefix || '';
  const files = [];
  
  function scanDir(dir, currentPrefix = '') {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      const key = currentPrefix ? `${currentPrefix}/${item}` : item;
      
      if (stat.isDirectory()) {
        scanDir(itemPath, key);
      } else if (key.startsWith(prefix)) {
        files.push({
          Key: key,
          LastModified: stat.mtime.toISOString(),
          Size: stat.size,
          ETag: `"${stat.mtime.getTime()}"`,
          StorageClass: 'STANDARD'
        });
      }
    }
  }
  
  scanDir(BUCKET_DIR);
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult>
  <Name>${BUCKET}</Name>
  <Prefix>${prefix}</Prefix>
  <MaxKeys>1000</MaxKeys>
  <IsTruncated>false</IsTruncated>
  ${files.map(file => `
  <Contents>
    <Key>${file.Key}</Key>
    <LastModified>${file.LastModified}</LastModified>
    <Size>${file.Size}</Size>
    <ETag>${file.ETag}</ETag>
    <StorageClass>${file.StorageClass}</StorageClass>
  </Contents>`).join('')}
</ListBucketResult>`;
  
  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// Object operations
app.put(`/${BUCKET}/*`, (req, res) => {
  const objectKey = req.params[0];
  const filePath = path.join(BUCKET_DIR, objectKey);
  const dir = path.dirname(filePath);
  
  // Crear directorio si no existe
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });
  
  req.on('end', () => {
    fs.writeFileSync(filePath, body);
    console.log(`✅ Objeto guardado: ${objectKey}`);
    res.status(200).send();
  });
});

app.get(`/${BUCKET}/*`, (req, res) => {
  const objectKey = req.params[0];
  const filePath = path.join(BUCKET_DIR, objectKey);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Object not found');
  }
  
  const data = fs.readFileSync(filePath);
  res.set('Content-Type', 'application/json');
  res.send(data);
});

app.delete(`/${BUCKET}/*`, (req, res) => {
  const objectKey = req.params[0];
  const filePath = path.join(BUCKET_DIR, objectKey);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Objeto eliminado: ${objectKey}`);
  }
  
  res.status(204).send();
});

// Inicializar datos mock
function initializeMockData() {
  const mockOffers = {
    offers: [
      {
        id: 'mock-1',
        precio: 299.99,
        precioOriginal: 399.99,
        referencia: 'NK-AIR-001',
        categoria: 'hombre',
        cantidadDisponible: 15,
        estatus: 'disponible',
        imagenes: [
          {
            id: 'img-1',
            url: 'https://via.placeholder.com/375x667/FF6B6B/FFFFFF?text=Nike+Air+Max',
            width: 375,
            height: 667,
            alt: 'Nike Air Max - Vista principal',
            isMain: true
          }
        ],
        titulo: 'Nike Air Max 270 React',
        marca: 'Nike',
        descripcion: 'Zapatillas deportivas con tecnología React',
        url: 'https://farfetch.com/nike-air-max-270',
        descuento: 25,
        tallas: ['40', '41', '42', '43', '44'],
        colores: ['Negro', 'Blanco', 'Gris'],
        timestamp: new Date()
      },
      {
        id: 'mock-2',
        precio: 1299.99,
        precioOriginal: 1599.99,
        referencia: 'GC-BELT-002',
        categoria: 'mujer',
        cantidadDisponible: 3,
        estatus: 'limitado',
        imagenes: [
          {
            id: 'img-3',
            url: 'https://via.placeholder.com/375x667/FFD93D/000000?text=Gucci+Belt',
            width: 375,
            height: 667,
            alt: 'Cinturón Gucci - Vista principal',
            isMain: true
          }
        ],
        titulo: 'Cinturón Gucci GG Marmont',
        marca: 'Gucci',
        descripcion: 'Cinturón de cuero con hebilla GG dorada',
        url: 'https://farfetch.com/gucci-gg-marmont-belt',
        descuento: 19,
        tallas: ['75', '80', '85', '90'],
        colores: ['Negro', 'Marrón'],
        timestamp: new Date()
      },
      {
        id: 'mock-3',
        precio: 89.99,
        precioOriginal: 129.99,
        referencia: 'AD-KIDS-003',
        categoria: 'niño',
        cantidadDisponible: 25,
        estatus: 'disponible',
        imagenes: [
          {
            id: 'img-4',
            url: 'https://via.placeholder.com/375x667/6BCF7F/FFFFFF?text=Adidas+Kids',
            width: 375,
            height: 667,
            alt: 'Adidas Kids - Vista principal',
            isMain: true
          }
        ],
        titulo: 'Adidas Superstar Kids',
        marca: 'Adidas',
        descripcion: 'Zapatillas clásicas para niños',
        url: 'https://farfetch.com/adidas-superstar-kids',
        descuento: 31,
        tallas: ['28', '29', '30', '31', '32'],
        colores: ['Blanco', 'Negro'],
        timestamp: new Date()
      }
    ],
    timestamp: new Date(),
    count: 3
  };

  const offersPath = path.join(BUCKET_DIR, 'telegram', 'offers');
  if (!fs.existsSync(offersPath)) {
    fs.mkdirSync(offersPath, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(offersPath, `${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(mockOffers, null, 2));
  
  console.log('✅ Datos mock inicializados');
}

app.listen(PORT, () => {
  console.log(`🚀 MinIO Mock Server running on port ${PORT}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
  console.log(`🪣 Bucket: ${BUCKET}`);
  
  // Inicializar datos mock
  initializeMockData();
});

module.exports = app;
