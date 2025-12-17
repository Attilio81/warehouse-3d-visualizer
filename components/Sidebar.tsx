import React, { useState } from 'react';
import { LocationData, Stats } from '../types';
import { SearchBar } from './SearchBar';
import { Package, Box, Map, Layers, RefreshCw, ChevronRight, ChevronLeft, ChevronDown, ZoomIn, ZoomOut, Maximize, MousePointer2, Database, AlertCircle, PackagePlus, List, TrendingUp, Activity, Flame, Navigation } from 'lucide-react';

interface SidebarProps {
  onReload: () => void;
  selectedLocation: LocationData | null;
  stats: Stats | null;
  isLoading: boolean;
  error: string | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  filter: 'all' | 'full' | 'empty';
  onFilterChange: (filter: 'all' | 'full' | 'empty') => void;
  levelFilter: number | null;
  onLevelFilterChange: (level: number | null) => void;
  availableLevels: number[];
  onOpenMovementModal: () => void;
  onOpenMovementsPanel: () => void;
  locations: LocationData[];
  onSearchSelect: (location: LocationData) => void;
  onOpenOptimizationPanel?: () => void;
  onToggleHeatmap?: () => void;
  showHeatmap?: boolean;
  optimizationSuggestionsCount?: number;
  onToggleFPSMode?: () => void;
  fpsMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onReload,
  selectedLocation,
  stats,
  isLoading,
  error,
  onZoomIn,
  onZoomOut,
  onResetView,
  filter,
  onFilterChange,
  levelFilter,
  onLevelFilterChange,
  availableLevels,
  onOpenMovementModal,
  onOpenMovementsPanel,
  locations,
  onSearchSelect,
  onOpenOptimizationPanel,
  onToggleHeatmap,
  showHeatmap = false,
  optimizationSuggestionsCount = 0,
  onToggleFPSMode,
  fpsMode = false
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isCommandsOpen, setIsCommandsOpen] = useState(false);

  return (
    <div 
      className={`relative h-full bg-slate-900 border-r border-slate-700 shadow-2xl transition-all duration-300 z-10 flex flex-col flex-shrink-0 ${isOpen ? 'w-80' : 'w-12'}`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-6 bg-slate-700 rounded-full p-1 text-white hover:bg-slate-600 border border-slate-600 z-20"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${!isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Package className="text-blue-400" size={20} />
            <h1 className="font-bold text-lg text-white">Warehouse 3D</h1>
          </div>
          <p className="text-xs text-slate-400">Magazzino Visualizer</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-800">
            <SearchBar
              locations={locations}
              onSelectLocation={onSearchSelect}
            />
          </div>

          {/* Database Connection Area */}
          <div className="p-4 flex flex-col gap-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Database size={14} />
                Database SQL Server
              </label>
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              )}
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500 rounded p-2 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={onReload}
              disabled={isLoading}
              className={`${
                isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500'
              } text-white text-sm py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2`}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Caricamento...' : 'Ricarica Dati'}
            </button>

            <button
              onClick={onOpenMovementModal}
              disabled={isLoading || !selectedLocation || !selectedLocation.productCode}
              className={`${
                isLoading || !selectedLocation || !selectedLocation.productCode
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-green-600 hover:bg-green-500'
              } text-white text-sm py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2`}
              title={!selectedLocation ? 'Seleziona una ubicazione' : !selectedLocation.productCode ? 'Ubicazione vuota' : 'Crea movimento'}
            >
              <PackagePlus size={16} />
              Sposta Articolo
            </button>

            <button
              onClick={onOpenMovementsPanel}
              disabled={isLoading}
              className={`${
                isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500'
              } text-white text-sm py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2`}
              title="Visualizza movimenti pendenti"
            >
              <List size={16} />
              Movimenti Pendenti
            </button>

            {stats && (
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Connesso - {stats.totalLocations} ubicazioni caricate
              </div>
            )}
          </div>

          {/* Optimization Section */}
          <div className="p-4 border-b border-slate-800 bg-gradient-to-b from-slate-900/50 to-transparent">
            <label className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3 block flex items-center gap-2">
              <TrendingUp size={14} />
              Ottimizzazione Logistica
            </label>

            <button
              onClick={onOpenOptimizationPanel}
              disabled={isLoading}
              className={`${
                isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500'
              } text-white text-sm py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2 w-full mb-2 relative`}
              title="Apri pannello ottimizzazione"
            >
              <TrendingUp size={16} />
              Analisi & Suggerimenti
              {optimizationSuggestionsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                  {optimizationSuggestionsCount}
                </span>
              )}
            </button>

            <button
              onClick={onToggleHeatmap}
              disabled={isLoading}
              className={`${
                showHeatmap
                  ? 'bg-orange-600 hover:bg-orange-500'
                  : 'bg-slate-700 hover:bg-slate-600'
              } text-white text-sm py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2 w-full border ${
                showHeatmap ? 'border-orange-400' : 'border-slate-600'
              }`}
              title={showHeatmap ? 'Nascondi heatmap' : 'Mostra heatmap utilizzo'}
            >
              <Activity size={16} />
              {showHeatmap ? 'Nascondi Heatmap' : 'Mostra Heatmap'}
            </button>

            {onToggleFPSMode && (
              <button
                onClick={onToggleFPSMode}
                disabled={isLoading}
                className={`${
                  fpsMode
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-slate-700 hover:bg-slate-600'
                } text-white text-sm py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2 w-full border ${
                  fpsMode ? 'border-blue-400' : 'border-slate-600'
                }`}
                title={fpsMode ? 'Modalità Orbita (Click & Drag)' : 'Modalità FPS (WASD + Mouse)'}
              >
                <Navigation size={16} />
                {fpsMode ? 'Modalità Orbita' : 'Modalità FPS'}
              </button>
            )}
          </div>

          {/* Controls Section - Enhanced Visibility */}
          <div className="p-4 border-b border-slate-800">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
              Controlli Vista
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onZoomIn}
                className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-1 rounded border border-slate-600 transition-colors flex flex-col items-center justify-center gap-1 shadow-sm"
                title="Zoom In"
              >
                <ZoomIn size={18} />
                <span className="text-[10px] font-medium">Zoom +</span>
              </button>
              <button
                onClick={onZoomOut}
                className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-1 rounded border border-slate-600 transition-colors flex flex-col items-center justify-center gap-1 shadow-sm"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
                <span className="text-[10px] font-medium">Zoom -</span>
              </button>
              <button
                onClick={onResetView}
                className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-1 rounded border border-slate-600 transition-colors flex flex-col items-center justify-center gap-1 shadow-sm"
                title="Reset View"
              >
                <Maximize size={18} />
                <span className="text-[10px] font-medium">Reset</span>
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="p-4 border-b border-slate-800">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
              Filtro Ubicazioni
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onFilterChange('all')}
                className={`py-2 px-1 rounded border transition-colors flex flex-col items-center justify-center gap-1 shadow-sm ${
                  filter === 'all'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
                    : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                }`}
                title="Mostra tutte"
              >
                <Layers size={18} />
                <span className="text-[10px] font-medium">Tutte</span>
              </button>
              <button
                onClick={() => onFilterChange('full')}
                className={`py-2 px-1 rounded border transition-colors flex flex-col items-center justify-center gap-1 shadow-sm ${
                  filter === 'full'
                    ? 'bg-green-600 hover:bg-green-500 text-white border-green-500'
                    : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                }`}
                title="Solo piene"
              >
                <Package size={18} />
                <span className="text-[10px] font-medium">Piene</span>
              </button>
              <button
                onClick={() => onFilterChange('empty')}
                className={`py-2 px-1 rounded border transition-colors flex flex-col items-center justify-center gap-1 shadow-sm ${
                  filter === 'empty'
                    ? 'bg-slate-500 hover:bg-slate-400 text-white border-slate-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                }`}
                title="Solo vuote"
              >
                <Box size={18} />
                <span className="text-[10px] font-medium">Vuote</span>
              </button>
            </div>
          </div>

          {/* Level Filter Section */}
          {availableLevels.length > 1 && (
            <div className="p-4 border-b border-slate-800">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                Filtro Piano
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onLevelFilterChange(null)}
                  className={`py-1.5 px-3 rounded border transition-colors text-sm font-medium ${
                    levelFilter === null
                      ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
                      : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                  }`}
                  title="Mostra tutti i piani"
                >
                  Tutti
                </button>
                {availableLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => onLevelFilterChange(level)}
                    className={`py-1.5 px-3 rounded border transition-colors text-sm font-medium min-w-[40px] ${
                      levelFilter === level
                        ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500'
                        : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                    }`}
                    title={`Piano ${level}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {levelFilter !== null && (
                <div className="mt-2 text-xs text-purple-300">
                  Visualizzando solo Piano {levelFilter}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-800">
              <div className="bg-slate-800 p-2 rounded border border-slate-700">
                <span className="text-xs text-slate-400 block">Locations</span>
                <span className="text-lg font-bold text-white">{stats.totalLocations}</span>
              </div>
              <div className="bg-slate-800 p-2 rounded border border-slate-700">
                <span className="text-xs text-slate-400 block">Max Aisle</span>
                <span className="text-lg font-bold text-white">{stats.maxAisle}</span>
              </div>
            </div>
          )}

          {/* Color Legend */}
          <div className="border-b border-slate-800">
            <button
              onClick={() => setIsLegendOpen(!isLegendOpen)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer">
                Legenda Colori
              </label>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${isLegendOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isLegendOpen && (
              <div className="px-4 pb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-xs text-slate-300">Con Giacenza</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500"></div>
                  <span className="text-xs text-slate-300">Mov. Uscita Pendente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-400"></div>
                  <span className="text-xs text-slate-300">Mov. Arrivo Pendente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-600"></div>
                  <span className="text-xs text-slate-300">Vuota</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-400"></div>
                  <span className="text-xs text-slate-300">Selezionata</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-400"></div>
                  <span className="text-xs text-slate-300">Mouse Hover</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Commands Guide */}
        <div className="bg-slate-800 border-t border-slate-700">
          <button
            onClick={() => setIsCommandsOpen(!isCommandsOpen)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MousePointer2 size={14} className="text-slate-300" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Guida Comandi</span>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${isCommandsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isCommandsOpen && (
            <div className="px-4 pb-4 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>🖱️ Scroll</span>
                <span className="text-slate-500">Zoom</span>
              </div>
              <div className="flex justify-between">
                <span>🖱️ Click Sx</span>
                <span className="text-slate-500">Ruota</span>
              </div>
              <div className="flex justify-between">
                <span>🖱️ Click Dx</span>
                <span className="text-slate-500">Sposta</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Minimized Icon */}
      {!isOpen && (
        <div className="h-full w-full flex flex-col items-center py-4 gap-4">
          <Package className="text-blue-400" size={24} />
          <div className="flex-1" />
          <div className="text-slate-500 mb-4" title="Expand for controls">
            <MousePointer2 size={20} />
          </div>
        </div>
      )}
    </div>
  );
};