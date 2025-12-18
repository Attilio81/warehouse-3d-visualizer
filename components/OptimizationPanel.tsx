import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  MapPin,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Route,
  Zap,
  BarChart3,
  Loader2
} from 'lucide-react';
import { OptimalLocationSuggestion, HeatmapData, PickingPath, LocationData } from '../types';
import { calculateHeatmapStats, getTopLocations, getHeatmapColor } from '../utils/heatmapUtils';

interface OptimizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: OptimalLocationSuggestion[];
  heatmapData: HeatmapData[];
  pickingPath: PickingPath | null;
  onSuggestionClick?: (suggestion: OptimalLocationSuggestion) => void;
  onHighlightLocation?: (locationCode: string) => void;
  onCalculatePath?: (locationCodes: string[]) => void;
}

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  isOpen,
  onClose,
  suggestions,
  heatmapData,
  pickingPath,
  onSuggestionClick,
  onHighlightLocation,
  onCalculatePath
}) => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'heatmap' | 'path'>('suggestions');
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);
  const [pathInput, setPathInput] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);

  const heatmapStats = calculateHeatmapStats(heatmapData);
  const topLocations = getTopLocations(heatmapData, 10);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Ottimizzazione Logistica</h2>
              <p className="text-sm text-slate-400">Analisi e suggerimenti per migliorare l'efficienza</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-800/50">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-3 px-4 font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'suggestions'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Zap size={18} />
            Suggerimenti ({suggestions.length})
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex-1 py-3 px-4 font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'heatmap'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Activity size={18} />
            Heatmap
          </button>
          <button
            onClick={() => setActiveTab('path')}
            className={`flex-1 py-3 px-4 font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'path'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Route size={18} />
            Percorso Ottimale
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg">Nessun suggerimento disponibile</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Le ubicazioni sono già ottimizzate o non ci sono dati sufficienti
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-300 mb-1">
                          Trovati {suggestions.length} suggerimenti di ottimizzazione
                        </h3>
                        <p className="text-sm text-slate-400">
                          Prodotti ad alta rotazione potrebbero essere riposizionati per migliorare l'efficienza
                        </p>
                      </div>
                    </div>
                  </div>

                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-blue-500/50 transition-colors"
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() =>
                          setExpandedSuggestion(expandedSuggestion === index ? null : index)
                        }
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="bg-yellow-600/20 p-2 rounded">
                              <Package size={20} className="text-yellow-400" />
                            </div>
                            <div>
                              <div className="font-mono text-sm text-slate-400">
                                {suggestion.currentLocation}
                              </div>
                              <div className="text-xs text-slate-500">Ubicazione attuale</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-bold ${
                                suggestion.improvementScore >= 30
                                  ? 'bg-green-600/20 text-green-400'
                                  : 'bg-yellow-600/20 text-yellow-400'
                              }`}
                            >
                              +{suggestion.improvementScore}%
                            </div>
                            {expandedSuggestion === index ? (
                              <ChevronUp size={20} className="text-slate-400" />
                            ) : (
                              <ChevronDown size={20} className="text-slate-400" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                          <MapPin size={16} />
                          <span>Suggerita: </span>
                          <span className="font-mono text-green-400">{suggestion.suggestedLocation}</span>
                        </div>

                        <div className="text-sm text-slate-300">{suggestion.reason}</div>
                      </div>

                      {expandedSuggestion === index && (
                        <div className="bg-slate-900/50 p-4 border-t border-slate-700">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                            Fattori di Miglioramento
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Frequenza</span>
                                <span className="text-white font-mono">
                                  {Math.round(suggestion.factors.frequencyScore * 100)}%
                                </span>
                              </div>
                              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500"
                                  style={{ width: `${suggestion.factors.frequencyScore * 100}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Distanza</span>
                                <span className="text-white font-mono">
                                  {Math.round(suggestion.factors.distanceScore * 100)}%
                                </span>
                              </div>
                              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${suggestion.factors.distanceScore * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSuggestionClick) onSuggestionClick(suggestion);
                            }}
                            className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium transition-colors"
                          >
                            Visualizza sulla Mappa
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Heatmap Tab */}
          {activeTab === 'heatmap' && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Prelievi Totali</div>
                  <div className="text-2xl font-bold text-white">{heatmapStats.totalPickups}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Media Prelievi</div>
                  <div className="text-2xl font-bold text-white">{heatmapStats.averagePickups}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Ubicazioni Attive</div>
                  <div className="text-2xl font-bold text-green-400">{heatmapStats.activeLocations}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Max Prelievi</div>
                  <div className="text-2xl font-bold text-orange-400">{heatmapStats.maxPickups}</div>
                </div>
              </div>

              {/* Top Locations */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-400" />
                  Top 10 Ubicazioni Più Utilizzate
                </h3>
                <div className="space-y-2">
                  {topLocations.map((location, index) => (
                    <div
                      key={location.locationCode}
                      className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer"
                      onClick={() => onHighlightLocation && onHighlightLocation(location.locationCode)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: getHeatmapColor(location.intensity) }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-mono text-white">{location.locationCode}</div>
                            <div className="text-xs text-slate-400">
                              Intensità: {Math.round(location.intensity * 100)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{location.pickupCount}</div>
                          <div className="text-xs text-slate-400">prelievi</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Scale Legend */}
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-3">Scala Colori</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Basso</span>
                  <div className="flex-1 h-6 rounded" style={{
                    background: 'linear-gradient(to right, #1e3a8a, #3b82f6, #06b6d4, #10b981, #eab308, #f97316, #dc2626)'
                  }} />
                  <span className="text-xs text-slate-400">Alto</span>
                </div>
              </div>
            </div>
          )}

          {/* Picking Path Tab */}
          {activeTab === 'path' && (
            <div className="space-y-4">
              {/* Input per ubicazioni */}
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <MapPin size={16} />
                  Inserisci Ubicazioni da Visitare
                </h3>
                <textarea
                  value={pathInput}
                  onChange={(e) => setPathInput(e.target.value)}
                  placeholder="Inserisci i codici ubicazione separati da virgola o su righe diverse&#10;Es: 17 03 01, 06 05 01, 16 01 01"
                  className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white placeholder-slate-500 text-sm font-mono resize-none"
                  rows={3}
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-slate-500">
                    {pathInput.trim() ? `${pathInput.split(/[,\n]+/).filter(s => s.trim()).length} ubicazioni` : 'Nessuna ubicazione'}
                  </p>
                  <button
                    onClick={() => {
                      const codes = pathInput.split(/[,\n]+/).map(s => s.trim()).filter(s => s.length > 0);
                      if (codes.length >= 2 && onCalculatePath) {
                        setIsCalculating(true);
                        onCalculatePath(codes);
                        setTimeout(() => setIsCalculating(false), 500);
                      }
                    }}
                    disabled={pathInput.split(/[,\n]+/).filter(s => s.trim()).length < 2 || isCalculating}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                  >
                    {isCalculating ? <Loader2 size={16} className="animate-spin" /> : <Route size={16} />}
                    Calcola Percorso
                  </button>
                </div>
              </div>

              {!pickingPath || pickingPath.locations.length === 0 ? (
                <div className="text-center py-8">
                  <Route size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400">Inserisci almeno 2 ubicazioni e clicca "Calcola Percorso"</p>
                </div>
              ) : (
                <>
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <h3 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                      <Route size={20} />
                      Percorso Ottimizzato
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-slate-400">Distanza Totale</div>
                        <div className="text-2xl font-bold text-white">{pickingPath.totalDistance}m</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Tempo Stimato</div>
                        <div className="text-2xl font-bold text-white">{pickingPath.estimatedTime}min</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Fermate</div>
                        <div className="text-2xl font-bold text-white">{pickingPath.locations.length}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Ordine Picking</h3>
                    <div className="space-y-2">
                      {pickingPath.locations.map((locationCode, index) => (
                        <div
                          key={index}
                          className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-mono text-white">{locationCode}</div>
                          </div>
                          <button
                            onClick={() => onHighlightLocation && onHighlightLocation(locationCode)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <MapPin size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
