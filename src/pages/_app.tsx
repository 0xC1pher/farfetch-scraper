import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import { useRouter } from 'next/router';
import '../styles/admin.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith('/admin');
  // Only apply admin styles on admin routes
  const className = isAdmin ? 'admin-styles' : '';

  return (
    <div className={className}>
      <Head>
        <title>Sistema Mexa - Panel de Administración</title>
        <meta name="description" content="Sistema de scraping inteligente con orquestación avanzada" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preload de fuentes para mejor rendimiento */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          as="style"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          as="style"
        />
        
        {/* Meta tags para PWA */}
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mexa Admin" />
        
        {/* Open Graph meta tags */}
        <meta property="og:title" content="Sistema Mexa - Panel de Administración" />
        <meta property="og:description" content="Sistema de scraping inteligente con orquestación avanzada" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sistema Mexa - Panel de Administración" />
        <meta name="twitter:description" content="Sistema de scraping inteligente con orquestación avanzada" />
        <meta name="twitter:image" content="/og-image.png" />
      </Head>
      
      <Component {...pageProps} />
    </div>
  );
}
