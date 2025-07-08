// create-structure.js
const fs = require('fs');
const path = require('path');

const dirs = [
  'src/pages/api',
  'src/modules/browser-mcp',
  'src/modules/scraperr',
  'src/modules/deepscrape',
  'src/modules/minio',
  'src/ui/components',
  'src/workflows',
  'src/types'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Carpeta creada: ${dir}`);
  } else {
    console.log(`ℹ️ Carpeta ya existe: ${dir}`);
  }
});