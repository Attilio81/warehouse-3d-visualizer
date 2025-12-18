import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, ArrowRight, RefreshCw, Clock, Package, AlertCircle } from 'lucide-react';
import { Movement } from '../types';

interface MovementsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_MOVEMENTS_URL = 'http://localhost:4000/api/movimenti';

export const MovementsPanel: React.FC<MovementsPanelProps> = ({ isOpen, onClose }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
  }, [isOpen]);

  const loadMovements = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_MOVEMENTS_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMovements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (id: number) => {
    if (!window.confirm('Confermare questo movimento? Questa azione è irreversibile.')) {
      return;
    }

    try {
      const response = await fetch(`${API_MOVEMENTS_URL}/${id}/conferma`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella conferma');
      }

      await loadMovements();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore nella conferma del movimento');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Eliminare questo movimento?')) {
      return;
    }

    try {
      const response = await fetch(`${API_MOVEMENTS_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'eliminazione');
      }

      await loadMovements();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore nell\'eliminazione del movimento');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Movimenti Pendenti</h2>
              <p className="text-sm text-slate-400">Movimenti in attesa di conferma</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadMovements}
              disabled={isLoading}
              className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
              title="Ricarica"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded mb-4 flex items-start gap-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Errore</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-slate-400">Caricamento movimenti...</div>
              </div>
            </div>
          ) : movements.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock size={48} className="text-slate-600 mx-auto mb-4" />
                <div className="text-slate-400 text-lg">Nessun movimento pendente</div>
                <div className="text-slate-500 text-sm mt-1">
                  Tutti i movimenti sono stati confermati
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Movement Info */}
                    <div className="flex-1 space-y-3">
                      {/* Header with ID and Date */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500">
                            #{movement.id}
                          </span>
                          {movement.data_movimento && (
                            <span className="text-xs text-slate-500">
                              {new Date(movement.data_movimento).toLocaleString('it-IT')}
                            </span>
                          )}
                        </div>
                        {movement.utente && (
                          <span className="text-xs text-slate-500">
                            Utente: {movement.utente}
                          </span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="bg-slate-800 rounded p-3">
                        <div className="text-sm text-slate-400 mb-1">Articolo</div>
                        <div className="text-white font-medium">{movement.lp_codart}</div>
                        <div className="text-sm text-green-400 mt-1">
                          Quantità: {movement.quantita}
                        </div>
                      </div>

                      {/* Movement Path */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-800 rounded p-3">
                          <div className="text-xs text-slate-400 mb-1">Da</div>
                          <div className="text-white font-mono font-medium">
                            {movement.ubicaz_partenza}
                          </div>
                        </div>

                        <ArrowRight size={24} className="text-blue-400 flex-shrink-0" />

                        <div className="flex-1 bg-slate-800 rounded p-3">
                          <div className="text-xs text-slate-400 mb-1">A</div>
                          <div className="text-white font-mono font-medium">
                            {movement.ubicaz_destinazione}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {movement.note && (
                        <div className="text-sm text-slate-400 italic">
                          Note: {movement.note}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleConfirm(movement.id!)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors flex items-center gap-2 whitespace-nowrap"
                        title="Conferma movimento"
                      >
                        <Check size={16} />
                        Conferma
                      </button>
                      <button
                        onClick={() => handleDelete(movement.id!)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors flex items-center gap-2 whitespace-nowrap"
                        title="Elimina movimento"
                      >
                        <Trash2 size={16} />
                        Elimina
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 bg-slate-900/50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-400">
              {movements.length > 0 && (
                <>
                  {movements.length} movimento{movements.length !== 1 ? 'i' : ''} in attesa
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
