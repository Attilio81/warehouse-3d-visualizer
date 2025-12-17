import React from 'react';
import { LocationData } from '../types';
import { Map, Box, Layers, Barcode } from 'lucide-react';

interface LocationDetailProps {
  location: LocationData;
  showCoordinates?: boolean;
}

export const LocationDetail: React.FC<LocationDetailProps> = ({ 
  location, 
  showCoordinates = true 
}) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
        <span className="text-xl font-mono font-bold text-white">{location.originalString}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400 flex items-center gap-2"><Map size={14} /> Corsia (Aisle)</span>
          <span className="font-mono text-white">{location.aisle}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400 flex items-center gap-2"><Box size={14} /> Posto (Bay)</span>
          <span className="font-mono text-white">{location.bay}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400 flex items-center gap-2"><Layers size={14} /> Livello (Level)</span>
          <span className="font-mono text-white">{location.level}</span>
        </div>
      </div>

      {location.productCode && (
        <div className="mt-4 pt-3 border-t border-slate-700 space-y-2">
          <div className="text-xs text-slate-500 mb-1">Prodotto</div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Codice</span>
            <span className="font-mono text-white">{location.productCode}</span>
          </div>
          {location.productDesc && (
            <div className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded">
              {location.productDesc}
            </div>
          )}
          {location.quantity !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Quantità</span>
              <span className="font-mono text-green-400 font-bold">{location.quantity}</span>
            </div>
          )}
          {location.barcode && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-400 flex items-center gap-2"><Barcode size={14} /> Barcode</span>
              <span className="font-mono text-blue-400 font-bold">{location.barcode}</span>
            </div>
          )}
        </div>
      )}

      {showCoordinates && (
        <div className="mt-4 pt-3 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-1">Coordinates (XYZ)</div>
          <div className="font-mono text-xs text-slate-400">
            {location.x.toFixed(1)}, {location.y.toFixed(1)}, {location.z.toFixed(1)}
          </div>
        </div>
      )}
    </div>
  );
};
