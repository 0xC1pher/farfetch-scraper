export interface Offer {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  brand: string;
  category: string;
  url: string;
  imageUrl?: string;
  description?: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  timestamp: Date;
}

export interface SessionData {
  sessionId: string;
  cookies: any[];
  userId: string;
  fingerprint: any;
  timestamp: Date;
  status: 'active' | 'expired' | 'invalid';
}

export interface ScrapingData {
  url: string;
  selectors: string[];
  data: {
    offers: Offer[];
    timestamp: Date;
    totalFound: number;
    source?: string;
  };
  timestamp: Date;
}
