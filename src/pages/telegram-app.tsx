import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import OfferCarousel from '../components/TelegramMiniApp/OfferCarousel';
import MexaLogo from '../components/MexaLogo';
import { TelegramOffer } from '../types/telegram-offers';

// Tipos para Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
          chat?: {
            id: number;
            type: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export default function TelegramApp() {
  const [chatId, setChatId] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Inicializar Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Expandir la app a pantalla completa
      tg.expand();
      
      // Obtener datos del usuario
      const initData = tg.initDataUnsafe;
      if (initData.user) {
        setUser(initData.user);
        setChatId(initData.user.id.toString());
      } else if (initData.chat) {
        setChatId(initData.chat.id.toString());
      }
      
      // Marcar como listo
      tg.ready();
      setIsReady(true);

      // Configurar botón principal (oculto por defecto)
      tg.MainButton.hide();
    } else {
      // Modo de desarrollo - usar datos mock
      setChatId('dev-user-123');
      setUser({ id: 123, first_name: 'Usuario', username: 'dev_user' });
      setIsReady(true);
    }
  }, []);

  const handleFavorite = (offerId: string, isFavorite: boolean) => {
    // Feedback háptico
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    console.log(`Offer ${offerId} ${isFavorite ? 'added to' : 'removed from'} favorites`);
  };

  const handlePurchase = (offer: TelegramOffer) => {
    // Feedback háptico
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    // Abrir enlace del producto
    if (typeof window !== 'undefined') {
      window.open(offer.url, '_blank');
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando Mexa App...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Mexa - Ofertas Exclusivas</title>
        <meta name="description" content="Descubre las mejores ofertas de moda en Farfetch" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#667eea" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/assets/logo-mexa.svg" />

        {/* Telegram WebApp Script */}
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Prevent zoom */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" 
        />
      </Head>

      <main className="h-screen w-full overflow-hidden bg-black">
        {/* Header con logo MeXa */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <MexaLogo variant="banner" size="medium" className="w-full" />
        </div>

        {chatId && (
          <div className="pt-20">
            <OfferCarousel
              chatId={chatId}
              onFavorite={handleFavorite}
              onPurchase={handlePurchase}
            />
          </div>
        )}
      </main>

      {/* Estilos específicos para Telegram */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }

        * {
          box-sizing: border-box;
        }

        /* Prevenir zoom en iOS */
        input, textarea, select {
          font-size: 16px !important;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Ocultar scrollbars */
        ::-webkit-scrollbar {
          display: none;
        }

        /* Animaciones suaves */
        * {
          transition: transform 0.2s ease-out;
        }

        /* Estilos para gestos táctiles */
        .swipe-container {
          touch-action: pan-x;
        }

        /* Optimizaciones para móvil */
        img {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }
      `}</style>
    </>
  );
}
