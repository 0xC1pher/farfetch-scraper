import React from 'react';

interface MexaLogoProps {
  variant?: 'logo' | 'banner';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const MexaLogo: React.FC<MexaLogoProps> = ({ 
  variant = 'logo', 
  size = 'medium',
  className = '' 
}) => {
  const getSizeClasses = () => {
    if (variant === 'banner') {
      switch (size) {
        case 'small': return 'w-64 h-12';
        case 'medium': return 'w-80 h-16';
        case 'large': return 'w-96 h-20';
        default: return 'w-80 h-16';
      }
    } else {
      switch (size) {
        case 'small': return 'w-20 h-8';
        case 'medium': return 'w-32 h-12';
        case 'large': return 'w-40 h-16';
        default: return 'w-32 h-12';
      }
    }
  };

  if (variant === 'banner') {
    return (
      <div className={`${getSizeClasses()} ${className}`}>
        <svg width="100%" height="100%" viewBox="0 0 375 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bannerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{stopColor:'#667eea', stopOpacity:0.95}} />
              <stop offset="30%" style={{stopColor:'#764ba2', stopOpacity:0.95}} />
              <stop offset="70%" style={{stopColor:'#f093fb', stopOpacity:0.95}} />
              <stop offset="100%" style={{stopColor:'#667eea', stopOpacity:0.95}} />
            </linearGradient>
            <linearGradient id="bannerTextGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{stopColor:'#ffffff', stopOpacity:1}} />
              <stop offset="50%" style={{stopColor:'#f8f9fa', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#ffffff', stopOpacity:1}} />
            </linearGradient>
            <radialGradient id="glowEffect" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style={{stopColor:'#ffffff', stopOpacity:0.3}} />
              <stop offset="100%" style={{stopColor:'#ffffff', stopOpacity:0}} />
            </radialGradient>
            <filter id="bannerGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <rect width="375" height="80" fill="url(#bannerGradient)"/>
          <rect width="375" height="80" fill="url(#glowEffect)"/>
          
          <g opacity="0.1">
            <circle cx="50" cy="20" r="15" fill="white"/>
            <circle cx="325" cy="60" r="20" fill="white"/>
            <circle cx="300" cy="15" r="8" fill="white"/>
            <polygon points="20,60 35,45 35,75" fill="white"/>
            <polygon points="340,25 355,10 370,25 355,40" fill="white"/>
          </g>
          
          <g transform="translate(187.5, 40)">
            <g transform="translate(-25, -12)">
              <polygon points="12,4 20,8 20,16 12,20 4,16 4,8" fill="rgba(255,255,255,0.95)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
              <polygon points="12,6 18,9 18,15 12,18 6,15 6,9" fill="rgba(255,255,255,0.8)"/>
              <circle cx="12" cy="12" r="3" fill="#f093fb"/>
            </g>
            
            <text x="0" y="8" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="url(#bannerTextGradient)" filter="url(#bannerGlow)">
              Me<tspan fill="#f093fb">X</tspan>a
            </text>
          </g>
          
          <text x="187.5" y="60" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="normal" fill="rgba(255,255,255,0.9)">
            Ofertas Exclusivas
          </text>
          
          <g opacity="0.6">
            <circle cx="30" cy="40" r="2" fill="white"/>
            <circle cx="25" cy="35" r="1.5" fill="white"/>
            <circle cx="35" cy="45" r="1" fill="white"/>
            <circle cx="345" cy="40" r="2" fill="white"/>
            <circle cx="350" cy="35" r="1.5" fill="white"/>
            <circle cx="340" cy="45" r="1" fill="white"/>
          </g>
          
          <rect x="0" y="78" width="375" height="2" fill="rgba(255,255,255,0.2)"/>
        </svg>
      </div>
    );
  }

  return (
    <div className={`${getSizeClasses()} ${className}`}>
      <svg width="100%" height="100%" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mexaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#667eea', stopOpacity:1}} />
            <stop offset="50%" style={{stopColor:'#764ba2', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#f093fb', stopOpacity:1}} />
          </linearGradient>
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor:'#ffffff', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#f8f9fa', stopOpacity:1}} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <rect x="2" y="2" width="116" height="36" rx="18" ry="18" fill="url(#mexaGradient)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        
        <g transform="translate(12, 8)">
          <polygon points="12,4 20,8 20,16 12,20 4,16 4,8" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
          <polygon points="12,6 18,9 18,15 12,18 6,15 6,9" fill="rgba(255,255,255,0.7)"/>
          <circle cx="12" cy="12" r="3" fill="url(#mexaGradient)"/>
        </g>
        
        <text x="40" y="26" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="url(#textGradient)" filter="url(#glow)">
          Me<tspan fill="#f093fb">X</tspan>a
        </text>
        
        <circle cx="108" cy="20" r="2" fill="rgba(255,255,255,0.8)"/>
      </svg>
    </div>
  );
};

export default MexaLogo;
