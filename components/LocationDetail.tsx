import React, { useState } from 'react';
import { LocationData } from '../types';
import { Map, Box, Layers, Barcode, PackagePlus, Send, X, Loader2 } from 'lucide-react';

interface LocationDetailProps {
  location: LocationData;
  showCoordinates?: boolean;
  onMoveArticle?: (destinationCode: string, quantity: number) => Promise<void>;
}

export const LocationDetail: React.FC<LocationDetailProps> = ({ 
  location, 
  showCoordinates = true,
  onMoveArticle
}) => {
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [destinationCode, setDestinationCode] = useState('');
  const [quantity, setQuantity] = useState(location.quantity || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onMoveArticle || !destinationCode.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onMoveArticle(destinationCode.trim(), quantity);
      setShowMoveForm(false);
      setDestinationCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante lo spostamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canMove = location.productCode && location.quantity && location.quantity > 0;
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

      {/* Move Article Section */}
      {canMove && onMoveArticle && (
        <div className="mt-4 pt-3 border-t border-slate-700">
          {!showMoveForm ? (
            <button
              onClick={() => {
                setQuantity(location.quantity || 0);
                setShowMoveForm(true);
              }}
              className="w-full bg-green-600 hover:bg-green-500 text-white text-sm py-2 px-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
            >
              <PackagePlus size={16} />
              Sposta Articolo
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Sposta Articolo</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoveForm(false);
                    setError(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500 rounded p-2 text-xs text-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-500 block mb-1">Quantità</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(Number(e.target.value), location.quantity || 0))}
                  min={1}
                  max={location.quantity || 0}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isSubmitting}
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Max: {location.quantity}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Ubicazione Destinazione</label>
                <input
                  type="text"
                  value={destinationCode}
                  onChange={(e) => setDestinationCode(e.target.value.toUpperCase())}
                  placeholder="es. 01 02 03"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-600"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !destinationCode.trim() || quantity <= 0}
                className={`w-full py-2 px-3 rounded font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                  isSubmitting || !destinationCode.trim() || quantity <= 0
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creazione...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Crea Movimento
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
