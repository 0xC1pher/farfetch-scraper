import React from 'react';
import MexaLogo from './MexaLogo';

interface MexaFooterProps {
  className?: string;
  showText?: boolean;
}

const MexaFooter: React.FC<MexaFooterProps> = ({ 
  className = '',
  showText = true 
}) => {
  return (
    <footer className={`bg-gradient-to-r from-gray-900 to-black py-4 px-6 ${className}`}>
      <div className="flex items-center justify-center space-x-3">
        <MexaLogo variant="logo" size="small" />
        {showText && (
          <div className="text-center">
            <p className="text-white/80 text-sm">
              Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold">MeXa</span>
            </p>
            <p className="text-white/60 text-xs">
              Bucket: mexa-data
            </p>
          </div>
        )}
      </div>
    </footer>
  );
};

export default MexaFooter;
