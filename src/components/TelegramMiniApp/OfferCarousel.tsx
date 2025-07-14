import React, { useState, useEffect, useRef } from 'react';
import { TelegramOffer, TelegramCarousel, TELEGRAM_IMAGE_CONFIG } from '../../types/telegram-offers';
import { Heart, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';

interface OfferCarouselProps {
  chatId: string;
  onFavorite?: (offerId: string, isFavorite: boolean) => void;
  onPurchase?: (offer: TelegramOffer) => void;
}

export default function OfferCarousel({ chatId, onFavorite, onPurchase }: OfferCarouselProps) {
  const [carousel, setCarousel] = useState<TelegramCarousel | null>(null);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar ofertas al montar el componente
  useEffect(() => {
    loadOffers();
    loadFavorites();
  }, [chatId]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      console.log('🔍 OfferCarousel: Cargando ofertas para chatId:', chatId);

      const response = await fetch(`/api/telegram/offers?chatId=${chatId}&limit=20`);
      const data = await response.json();

      console.log('📊 OfferCarousel: Respuesta recibida:', data);

      if (data.success) {
        // La respuesta ya viene en el formato correcto
        const carouselData: TelegramCarousel = {
          offers: data.offers || [],
          totalCount: data.totalCount || 0,
          currentPage: 0,
          totalPages: Math.ceil((data.totalCount || 0) / 20)
        };

        setCarousel(carouselData);
        console.log(`✅ OfferCarousel: ${carouselData.offers.length} ofertas cargadas`);
      } else {
        console.error('❌ OfferCarousel: Error en respuesta:', data);
      }
    } catch (error) {
      console.error('❌ OfferCarousel: Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await fetch(`/api/telegram/favorites?chatId=${chatId}`);
      const data = await response.json();
      
      if (data.success) {
        const favoriteIds = new Set<string>(data.data.map((offer: TelegramOffer) => offer.id));
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleFavorite = async (offerId: string) => {
    const isFavorite = favorites.has(offerId);
    
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const response = await fetch(`/api/telegram/favorites?chatId=${chatId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId })
      });

      if (response.ok) {
        const newFavorites = new Set(favorites);
        if (isFavorite) {
          newFavorites.delete(offerId);
        } else {
          newFavorites.add(offerId);
        }
        setFavorites(newFavorites);
        onFavorite?.(offerId, !isFavorite);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  // Navegación por ofertas
  const nextOffer = () => {
    if (carousel && currentOfferIndex < carousel.offers.length - 1) {
      setCurrentOfferIndex(currentOfferIndex + 1);
      setCurrentImageIndex(0);
    }
  };

  const prevOffer = () => {
    if (currentOfferIndex > 0) {
      setCurrentOfferIndex(currentOfferIndex - 1);
      setCurrentImageIndex(0);
    }
  };

  // Navegación por imágenes
  const nextImage = () => {
    const currentOffer = carousel?.offers[currentOfferIndex];
    if (currentOffer && currentImageIndex < currentOffer.imagenes.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Manejo de gestos táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextOffer();
    }
    if (isRightSwipe) {
      prevOffer();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!carousel || carousel.offers.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">No hay ofertas disponibles</h2>
          <p className="text-gray-500 mt-2">Intenta más tarde</p>
        </div>
      </div>
    );
  }

  const currentOffer = carousel.offers[currentOfferIndex];
  const currentImage = currentOffer.imagenes[currentImageIndex];
  const isFavorite = favorites.has(currentOffer.id);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Imagen principal */}
      <div className="relative h-full w-full">
        <img
          src={currentImage.url}
          alt={currentImage.alt}
          className="w-full h-full object-cover"
          style={{
            width: TELEGRAM_IMAGE_CONFIG.CAROUSEL.width,
            height: TELEGRAM_IMAGE_CONFIG.CAROUSEL.height
          }}
        />
        
        {/* Overlay con información */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30">
          
          {/* Header con navegación */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <div className="flex space-x-2">
              {currentOffer.imagenes.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 w-4'
                  }`}
                />
              ))}
            </div>
            <div className="text-white text-sm font-medium">
              {currentOfferIndex + 1} / {carousel.offers.length}
            </div>
          </div>

          {/* Información del producto */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="mb-4">
              <h1 className="text-2xl font-bold mb-2">{currentOffer.titulo}</h1>
              <p className="text-lg text-gray-200 mb-2">{currentOffer.marca}</p>
              
              <div className="flex items-center space-x-4 mb-3">
                <span className="text-3xl font-bold">${currentOffer.precio}</span>
                {currentOffer.precioOriginal && (
                  <>
                    <span className="text-lg text-gray-300 line-through">
                      ${currentOffer.precioOriginal}
                    </span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                      -{currentOffer.descuento}%
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <span className={`px-3 py-1 rounded-full ${
                  currentOffer.estatus === 'disponible' ? 'bg-green-500' :
                  currentOffer.estatus === 'limitado' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {currentOffer.estatus === 'disponible' ? 'Disponible' :
                   currentOffer.estatus === 'limitado' ? 'Limitado' : 'Agotado'}
                </span>
                <span className="text-gray-300">
                  {currentOffer.cantidadDisponible} unidades
                </span>
                <span className="capitalize text-gray-300">
                  {currentOffer.categoria}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-4">
              <button
                onClick={() => handleFavorite(currentOffer.id)}
                className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all duration-200 ${
                  isFavorite 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/20 text-white border border-white/30'
                }`}
              >
                <Heart className={`inline mr-2 h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Favorito' : 'Me gusta'}
              </button>
              
              <button
                onClick={() => onPurchase?.(currentOffer)}
                className="flex-1 py-3 px-6 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors duration-200"
              >
                <ShoppingBag className="inline mr-2 h-5 w-5" />
                Ver producto
              </button>
            </div>
          </div>

          {/* Navegación lateral */}
          {currentOffer.imagenes.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                disabled={currentImageIndex === 0}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                disabled={currentImageIndex === currentOffer.imagenes.length - 1}
              >
                <ArrowRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
