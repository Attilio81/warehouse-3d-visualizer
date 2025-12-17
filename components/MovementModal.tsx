import React, { useState } from 'react';
import { X, ArrowRight, PackagePlus } from 'lucide-react';
import { LocationData } from '../types';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: LocationData | null;
  onCreateMovement: (movement: {
    codditt: string;
    lp_codart: string;
    lp_magaz: string;
    ubicaz_partenza: string;
    ubicaz_destinazione: string;
    quantita: number;
    utente: string;
    note: string;
  }) => Promise<void>;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  selectedLocation,
  onCreateMovement
}) => {
  const [codditt, setCodditt] = useState('1');
  const [lp_magaz, setLpMagaz] = useState('1');
  const [ubicazPartenza, setUbicazPartenza] = useState('');
  const [ubicazDestinazione, setUbicazDestinazione] = useState('');
  const [quantita, setQuantita] = useState('');
  const [utente, setUtente] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-populate ubicaz_partenza when a location is selected
  React.useEffect(() => {
    if (selectedLocation && selectedLocation.locationCode) {
      setUbicazPartenza(selectedLocation.locationCode);
    }
  }, [selectedLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!ubicazPartenza || !ubicazDestinazione) {
      setError('Ubicazioni partenza e destinazione sono obbligatorie');
      return;
    }

    if (!quantita || parseFloat(quantita) <= 0) {
      setError('Quantità deve essere maggiore di 0');
      return;
    }

    if (ubicazPartenza === ubicazDestinazione) {
      setError('Ubicazione partenza e destinazione devono essere diverse');
      return;
    }

    const lp_codart = selectedLocation?.productCode || '';
    if (!lp_codart) {
      setError('Nessun articolo presente nell\'ubicazione selezionata');
      return;
    }

    setIsLoading(true);

    try {
      await onCreateMovement({
        codditt,
        lp_codart,
        lp_magaz,
        ubicaz_partenza: ubicazPartenza,
        ubicaz_destinazione: ubicazDestinazione,
        quantita: parseFloat(quantita),
        utente,
        note
      });

      // Reset form
      setUbicazDestinazione('');
      setQuantita('');
      setNote('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione del movimento');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <PackagePlus size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Nuovo Movimento</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Article Info (Read-only) */}
          {selectedLocation && selectedLocation.productCode && (
            <div className="bg-slate-900 border border-slate-700 rounded p-3">
              <div className="text-xs text-slate-400 mb-1">Articolo Selezionato</div>
              <div className="text-white font-medium">{selectedLocation.productCode}</div>
              <div className="text-sm text-slate-400">{selectedLocation.productDesc}</div>
              <div className="text-xs text-green-400 mt-1">
                Giacenza disponibile: {selectedLocation.quantity?.toFixed(2) || 0}
              </div>
            </div>
          )}

          {/* Ubicazioni */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Da Ubicazione *
              </label>
              <input
                type="text"
                value={ubicazPartenza}
                onChange={(e) => setUbicazPartenza(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="es. 01 02 03"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                A Ubicazione *
              </label>
              <input
                type="text"
                value={ubicazDestinazione}
                onChange={(e) => setUbicazDestinazione(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="es. 05 10 02"
                required
              />
            </div>
          </div>

          {/* Visual Arrow */}
          <div className="flex items-center justify-center text-slate-500">
            <ArrowRight size={24} />
          </div>

          {/* Quantità e Utente */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Quantità *
              </label>
              <input
                type="number"
                step="0.01"
                value={quantita}
                onChange={(e) => setQuantita(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Utente
              </label>
              <input
                type="text"
                value={utente}
                onChange={(e) => setUtente(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome utente"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Note opzionali..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm"
              disabled={isLoading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-sm flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creazione...
                </>
              ) : (
                <>
                  <PackagePlus size={16} />
                  Crea Movimento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
