#!/bin/bash

echo "�� Actualizando repos externos..."

cd external

for repo in browser-mcp scraperr deepscrape; do
    echo "�� Actualizando $repo..."
    cd $repo
    git pull origin main
    npm install
    cd ..
done

cd ..

echo "✅ Repos actualizados correctamente"