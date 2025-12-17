import React, { useEffect, useRef, useState } from 'react';
import { LocationData } from '../types';
import { LocationDetail } from './LocationDetail';

interface LocationTooltipProps {
  location: LocationData;
  mouseX: number;
  mouseY: number;
  onClose: () => void;
  onMoveArticle?: (destinationCode: string, quantity: number) => Promise<void>;
  onStartSelectDestination?: () => void;
  isSelectingDestination?: boolean;
  selectedDestination?: string | null;
}

export const LocationTooltip: React.FC<LocationTooltipProps> = ({
  location,
  mouseX,
  mouseY,
  onClose,
  onMoveArticle,
  onStartSelectDestination,
  isSelectingDestination,
  selectedDestination
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: mouseX, y: mouseY });
  const [maxHeight, setMaxHeight] = useState(500);

  useEffect(() => {
    // Calcola posizione e altezza massima disponibile
    let x = mouseX;
    let y = mouseY;
    const tooltipWidth = 350;
    const margin = 20;

    // Check right edge
    if (x + tooltipWidth > window.innerWidth - margin) {
      x = window.innerWidth - tooltipWidth - margin;
    }

    // Check left edge
    if (x < margin) {
      x = margin;
    }

    // Check top edge
    if (y < margin) {
      y = margin;
    }

    // Calcola altezza massima disponibile dal punto y fino al fondo dello schermo
    const availableHeight = window.innerHeight - y - margin;
    setMaxHeight(Math.max(300, availableHeight));

    setPosition({ x, y });
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Overlay to close on click outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-slate-900 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-700 flex flex-col"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          minWidth: '320px',
          maxWidth: '380px',
          maxHeight: `${maxHeight}px`
        }}
      >
        {/* Header */}
        <div className="bg-slate-800 px-4 py-2 rounded-t-lg flex justify-between items-center border-b border-slate-700 flex-shrink-0">
          <h3 className="font-bold text-sm text-white">Dettagli Selezione</h3>
          <button
            onClick={onClose}
            className="hover:bg-slate-700 rounded p-1 transition-colors text-slate-400 hover:text-white"
            aria-label="Chiudi"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div 
          className="p-4 overflow-y-auto"
          style={{ maxHeight: 'calc(100% - 50px)' }}
        >
          <LocationDetail 
            location={location} 
            showCoordinates={true} 
            onMoveArticle={onMoveArticle}
            onStartSelectDestination={onStartSelectDestination}
            isSelectingDestination={isSelectingDestination}
            selectedDestination={selectedDestination}
          />
        </div>
      </div>
    </>
  );
};
