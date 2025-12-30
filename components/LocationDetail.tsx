import React, { useState, useEffect } from 'react';
import { LocationData, Article } from '../types';
import { Map, Box, Layers, Barcode, PackagePlus, Send, X, Loader2, MousePointer2, History, ArrowDownCircle, ArrowUpCircle, ChevronDown, ChevronUp, Package } from 'lucide-react';

interface MovementHistoryItem {
  ubicazione: string;
  magazzino: string;
  codiceArticolo: string;
  descrizioneArticolo: string;
  causale: string;
  tipoMovimento: number;
  tipo: 'entrata' | 'uscita';
  colli: number;
  quantita: number;
  dataMovimento: string;
  numeroDocumento: string;
  utente: string;
}

interface LocationDetailProps {
  location: LocationData;
  showCoordinates?: boolean;
  onMoveArticle?: (destinationCode: string, quantity: number) => Promise<void>;
  onStartSelectDestination?: () => void;
  isSelectingDestination?: boolean;
  selectedDestination?: string | null;
}

export const LocationDetail: React.FC<LocationDetailProps> = ({
  location,
  showCoordinates = true,
  onMoveArticle,
  onStartSelectDestination,
  isSelectingDestination = false,
  selectedDestination
}) => {
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [destinationCode, setDestinationCode] = useState('');
  const [quantity, setQuantity] = useState(location.quantity || 0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sezione posizione (collassata di default)
  const [showPosition, setShowPosition] = useState(false);

  // Sezione articoli (espansa se più di uno)
  const [showArticles, setShowArticles] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Storico movimenti
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [movementHistory, setMovementHistory] = useState<MovementHistoryItem[]>([]);

  // Aggiorna destinazione quando viene selezionata dalla mappa
  useEffect(() => {
    if (selectedDestination) {
      setDestinationCode(selectedDestination);
    }
  }, [selectedDestination]);

  // Carica storico movimenti
  const loadHistory = async () => {
    if (historyLoading) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const locationCode = location.locationCode || location.originalString;
      const apiBase = `http://${window.location.hostname}:4000`;
      const response = await fetch(`${apiBase}/api/movimenti/storico/${encodeURIComponent(locationCode)}?limit=20`);

      if (!response.ok) {
        throw new Error('Errore nel caricamento dello storico');
      }

      const data = await response.json();
      setMovementHistory(data);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Toggle storico
  const toggleHistory = () => {
    if (!showHistory && movementHistory.length === 0) {
      loadHistory();
    }
    setShowHistory(!showHistory);
  };

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

      {/* Sezione Posizione - Toggle collassabile */}
      <button
        onClick={() => setShowPosition(!showPosition)}
        className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-slate-200 transition-colors py-1"
      >
        <span className="flex items-center gap-2">
          <Map size={14} />
          Posizione
          <span className="text-xs text-slate-500">({location.aisle}-{location.bay}-{location.level})</span>
        </span>
        {showPosition ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showPosition && (
        <div className="space-y-2 pl-6 pb-2 border-l-2 border-slate-700 ml-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-2"><Map size={14} /> Corsia</span>
            <span className="font-mono text-white">{location.aisle}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-2"><Box size={14} /> Posto</span>
            <span className="font-mono text-white">{location.bay}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-2"><Layers size={14} /> Livello</span>
            <span className="font-mono text-white">{location.level}</span>
          </div>
        </div>
      )}

      {/* Sezione Articoli - Mostra elenco se più di uno */}
      {location.articles && location.articles.length > 1 ? (
        <div className="mt-4 pt-3 border-t border-slate-700">
          <button
            onClick={() => setShowArticles(!showArticles)}
            className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-slate-200 transition-colors py-1"
          >
            <span className="flex items-center gap-2">
              <Package size={14} />
              Articoli in ubicazione
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {location.articles.length}
              </span>
            </span>
            {showArticles ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showArticles && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {location.articles.map((article, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedArticle(selectedArticle?.productCode === article.productCode ? null : article)}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    selectedArticle?.productCode === article.productCode
                      ? 'bg-blue-900/40 border-blue-500'
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-white text-sm">{article.productCode}</span>
                    <span className="font-mono text-green-400 font-bold text-sm">{article.quantity}</span>
                  </div>
                  {article.description && (
                    <div className="text-xs text-slate-400 truncate mt-1">
                      {article.description}
                    </div>
                  )}
                  {article.barcode && (
                    <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                      <Barcode size={10} />
                      {article.barcode}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Dettaglio articolo selezionato */}
          {selectedArticle && (
            <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/50 rounded">
              <div className="text-xs text-blue-400 mb-2 font-semibold">Articolo Selezionato</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Codice</span>
                  <span className="font-mono text-white">{selectedArticle.productCode}</span>
                </div>
                {selectedArticle.description && (
                  <div className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded">
                    {selectedArticle.description}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Quantità</span>
                  <span className="font-mono text-green-400 font-bold">{selectedArticle.quantity}</span>
                </div>
                {selectedArticle.barcode && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2"><Barcode size={14} /> Barcode</span>
                    <span className="font-mono text-blue-400">{selectedArticle.barcode}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : location.productCode && (
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

      {/* Movement History Section */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <button
          onClick={toggleHistory}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 px-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
        >
          <History size={16} />
          Storico Movimenti
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2">
            {historyLoading && (
              <div className="flex items-center justify-center py-4 text-slate-400">
                <Loader2 size={20} className="animate-spin mr-2" />
                Caricamento...
              </div>
            )}

            {historyError && (
              <div className="bg-red-900/30 border border-red-500 rounded p-2 text-xs text-red-200">
                {historyError}
              </div>
            )}

            {!historyLoading && !historyError && movementHistory.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                Nessun movimento trovato
              </div>
            )}

            {!historyLoading && movementHistory.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {movementHistory.map((mov, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-xs border ${mov.tipo === 'entrata'
                        ? 'bg-green-900/20 border-green-700/50'
                        : 'bg-red-900/20 border-red-700/50'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {mov.tipo === 'entrata' ? (
                          <ArrowDownCircle size={12} className="text-green-400" />
                        ) : (
                          <ArrowUpCircle size={12} className="text-red-400" />
                        )}
                        <span className={mov.tipo === 'entrata' ? 'text-green-400' : 'text-red-400'}>
                          {mov.causale}
                        </span>
                      </div>
                      <span className="text-slate-500">
                        {mov.dataMovimento ? new Date(mov.dataMovimento).toLocaleDateString('it-IT') : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-mono">{mov.codiceArticolo}</span>
                      <span className={`font-bold ${mov.tipo === 'entrata' ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {mov.tipo === 'entrata' ? '+' : '-'}{mov.quantita}
                      </span>
                    </div>
                    {mov.descrizioneArticolo && (
                      <div className="text-slate-500 truncate mt-1">
                        {mov.descrizioneArticolo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={destinationCode}
                    onChange={(e) => setDestinationCode(e.target.value.toUpperCase())}
                    placeholder="es. 01 02 03"
                    className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-600"
                    disabled={isSubmitting || isSelectingDestination}
                  />
                  {onStartSelectDestination && (
                    <button
                      type="button"
                      onClick={onStartSelectDestination}
                      disabled={isSubmitting}
                      className={`px-3 py-2 rounded border transition-colors flex items-center gap-1 ${isSelectingDestination
                          ? 'bg-blue-600 border-blue-400 text-white animate-pulse'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                        }`}
                      title="Seleziona sulla mappa"
                    >
                      <MousePointer2 size={16} />
                    </button>
                  )}
                </div>
                {isSelectingDestination && (
                  <div className="text-[10px] text-blue-400 mt-1 animate-pulse">
                    👆 Clicca su un'ubicazione nella mappa...
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !destinationCode.trim() || quantity <= 0}
                className={`w-full py-2 px-3 rounded font-medium text-sm flex items-center justify-center gap-2 transition-colors ${isSubmitting || !destinationCode.trim() || quantity <= 0
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
