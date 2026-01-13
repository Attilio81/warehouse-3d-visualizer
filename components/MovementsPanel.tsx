import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, ArrowRight, RefreshCw, Clock, Package } from 'lucide-react';
import { Movement } from '../types';
import { API_BASE } from '../utils/config';
import { Modal } from './common/Modal';
import { Alert } from './common/Alert';
import { EmptyState } from './common/EmptyState';

interface MovementsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_MOVEMENTS_URL = `${API_BASE}/api/movimenti`;

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
      console.error('Error loading movements:', err);
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

  const headerContent = (
    <div>
      <h2 className="text-xl font-semibold text-white">Movimenti Pendenti</h2>
      <p className="text-sm text-slate-400 font-normal">Movimenti in attesa di conferma</p>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={headerContent}
      headerIcon={<Package size={24} className="text-blue-400" />}
      maxWidth="max-w-6xl"
      footer={
        <div className="flex items-center justify-between text-sm w-full">
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
      }
    >
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={loadMovements}
            disabled={isLoading}
            className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white flex items-center gap-2"
            title="Ricarica"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Ricarica
          </button>
        </div>

        {error && (
          <Alert type="error" title="Errore">
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-slate-400">Caricamento movimenti...</div>
            </div>
          </div>
        ) : movements.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Nessun movimento pendente"
            description="Tutti i movimenti sono stati confermati"
          />
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
    </Modal>
  );
};
