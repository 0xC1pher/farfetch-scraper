/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuración de imágenes
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configuración de headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Configuración de redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: false,
      },
    ];
  },
  
  // Configuración de variables de entorno
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Configuración de webpack para optimizaciones
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimizaciones para producción
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      };
    }
    
    return config;
  },
  
  // Configuración experimental
  experimental: {
    // Habilitar características experimentales si es necesario
  },
  
  // Configuración de compilación
  compiler: {
    // Remover console.log en producción
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Configuración de TypeScript
  typescript: {
    // Ignorar errores de TypeScript durante el build (solo para desarrollo)
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Configuración de ESLint
  eslint: {
    // Ignorar errores de ESLint durante el build (solo para desarrollo)
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  
  // Configuración de output
  output: 'standalone',
  
  // Configuración de trailing slash
  trailingSlash: false,
  
  // Configuración de poweredByHeader
  poweredByHeader: false,
};

export default nextConfig;
