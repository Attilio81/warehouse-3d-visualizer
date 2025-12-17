import React, { useState } from 'react';
import { LocationData, Stats } from '../types';
import { SearchBar } from './SearchBar';
import { CollapsibleSection } from './CollapsibleSection';
import { Package, Box, Layers, RefreshCw, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize, MousePointer2, Database, AlertCircle, PackagePlus, List, TrendingUp, Activity, Navigation, Eye, Filter, Keyboard, Palette } from 'lucide-react';

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
        <div className="p-3 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center gap-2">
            <Package className="text-blue-400" size={20} />
            <h1 className="font-bold text-lg text-white">Warehouse 3D</h1>
          </div>
        </div>

        {/* Search Bar - Always Visible */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/50">
          <SearchBar
            locations={locations}
            onSelectLocation={onSearchSelect}
          />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* ===== CONNESSIONE ===== */}
          <CollapsibleSection
            title="Connessione"
            icon={<Database size={14} />}
            defaultOpen={true}
          >
            <div className="flex flex-col gap-2">
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
                } text-white text-sm py-2 px-3 rounded font-medium transition-colors flex items-center justify-center gap-2`}
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                {isLoading ? 'Caricamento...' : 'Ricarica Dati'}
              </button>

              {stats && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Connesso
                  </span>
                  <span className="text-slate-300 font-medium">{stats.totalLocations} ubicazioni</span>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* ===== MOVIMENTI ===== */}
          <CollapsibleSection
            title="Movimenti"
            icon={<PackagePlus size={14} />}
            defaultOpen={false}
            accentColor="text-green-400"
          >
            <div className="flex flex-col gap-2">
              <button
                onClick={onOpenMovementModal}
                disabled={isLoading || !selectedLocation || !selectedLocation.productCode}
                className={`${
                  isLoading || !selectedLocation || !selectedLocation.productCode
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-green-600 hover:bg-green-500'
                } text-white text-sm py-2 px-3 rounded font-medium transition-colors flex items-center justify-center gap-2`}
                title={!selectedLocation ? 'Seleziona una ubicazione' : !selectedLocation.productCode ? 'Ubicazione vuota' : 'Crea movimento'}
              >
                <PackagePlus size={14} />
                Sposta Articolo
              </button>

              <button
                onClick={onOpenMovementsPanel}
                disabled={isLoading}
                className={`${
                  isLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500'
                } text-white text-sm py-2 px-3 rounded font-medium transition-colors flex items-center justify-center gap-2`}
              >
                <List size={14} />
                Movimenti Pendenti
              </button>
            </div>
          </CollapsibleSection>

          {/* ===== OTTIMIZZAZIONE ===== */}
          <CollapsibleSection
            title="Ottimizzazione"
            icon={<TrendingUp size={14} />}
            defaultOpen={false}
            badge={optimizationSuggestionsCount}
            badgeColor="bg-orange-500"
            accentColor="text-blue-400"
          >
            <div className="flex flex-col gap-2">
              <button
                onClick={onOpenOptimizationPanel}
                disabled={isLoading}
                className={`${
                  isLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500'
                } text-white text-sm py-2 px-3 rounded font-medium transition-colors flex items-center justify-center gap-2 w-full`}
              >
                <TrendingUp size={14} />
                Analisi & Suggerimenti
              </button>

              <button
                onClick={onToggleHeatmap}
                disabled={isLoading}
                className={`${
                  showHeatmap
                    ? 'bg-orange-600 hover:bg-orange-500 border-orange-400'
                    : 'bg-slate-700 hover:bg-slate-600 border-slate-600'
                } text-white text-sm py-2 px-3 rounded font-medium transition-colors flex items-center justify-center gap-2 w-full border`}
              >
                <Activity size={14} />
                {showHeatmap ? 'Nascondi Heatmap' : 'Mostra Heatmap'}
              </button>
            </div>
          </CollapsibleSection>

          {/* ===== VISUALIZZAZIONE ===== */}
          <CollapsibleSection
            title="Visualizzazione"
            icon={<Eye size={14} />}
            defaultOpen={true}
          >
            <div className="flex flex-col gap-3">
              {/* Camera Controls */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Controlli Camera</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={onZoomIn}
                    className="bg-slate-700 hover:bg-slate-600 text-white py-1.5 px-1 rounded border border-slate-600 transition-colors flex flex-col items-center justify-center gap-0.5"
                  >
                    <ZoomIn size={16} />
                    <span className="text-[9px] font-medium">Zoom +</span>
                  </button>
                  <button
                    onClick={onZoomOut}
                    className="bg-slate-700 hover:bg-slate-600 text-white py-1.5 px-1 rounded border border-slate-600 transition-colors flex flex-col items-center justify-center gap-0.5"
                  >
                    <ZoomOut size={16} />
                    <span className="text-[9px] font-medium">Zoom -</span>
                  </button>
                  <button
                    onClick={onResetView}
                    className="bg-slate-700 hover:bg-slate-600 text-white py-1.5 px-1 rounded border border-slate-600 transition-colors flex flex-col items-center justify-center gap-0.5"
                  >
                    <Maximize size={16} />
                    <span className="text-[9px] font-medium">Reset</span>
                  </button>
                </div>
              </div>

              {/* Navigation Mode */}
              {onToggleFPSMode && (
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Modalità Navigazione</label>
                  <button
                    onClick={onToggleFPSMode}
                    className={`${
                      fpsMode
                        ? 'bg-blue-600 hover:bg-blue-500 border-blue-400'
                        : 'bg-slate-700 hover:bg-slate-600 border-slate-600'
                    } text-white text-sm py-2 px-3 rounded font-medium transition-colors flex items-center justify-center gap-2 w-full border`}
                  >
                    <Navigation size={14} />
                    {fpsMode ? 'Modalità Orbita' : 'Modalità FPS'}
                  </button>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* ===== FILTRI ===== */}
          <CollapsibleSection
            title="Filtri"
            icon={<Filter size={14} />}
            defaultOpen={true}
          >
            <div className="flex flex-col gap-3">
              {/* Location Filter */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Ubicazioni</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onFilterChange('all')}
                    className={`py-1.5 px-1 rounded border transition-colors flex flex-col items-center justify-center gap-0.5 ${
                      filter === 'all'
                        ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
                        : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                    }`}
                  >
                    <Layers size={16} />
                    <span className="text-[9px] font-medium">Tutte</span>
                  </button>
                  <button
                    onClick={() => onFilterChange('full')}
                    className={`py-1.5 px-1 rounded border transition-colors flex flex-col items-center justify-center gap-0.5 ${
                      filter === 'full'
                        ? 'bg-green-600 hover:bg-green-500 text-white border-green-500'
                        : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                    }`}
                  >
                    <Package size={16} />
                    <span className="text-[9px] font-medium">Piene</span>
                  </button>
                  <button
                    onClick={() => onFilterChange('empty')}
                    className={`py-1.5 px-1 rounded border transition-colors flex flex-col items-center justify-center gap-0.5 ${
                      filter === 'empty'
                        ? 'bg-slate-500 hover:bg-slate-400 text-white border-slate-400'
                        : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                    }`}
                  >
                    <Box size={16} />
                    <span className="text-[9px] font-medium">Vuote</span>
                  </button>
                </div>
              </div>

              {/* Level Filter */}
              {availableLevels.length > 1 && (
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">Piano</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => onLevelFilterChange(null)}
                      className={`py-1 px-2.5 rounded border transition-colors text-xs font-medium ${
                        levelFilter === null
                          ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
                          : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                      }`}
                    >
                      Tutti
                    </button>
                    {availableLevels.map(level => (
                      <button
                        key={level}
                        onClick={() => onLevelFilterChange(level)}
                        className={`py-1 px-2.5 rounded border transition-colors text-xs font-medium min-w-[32px] ${
                          levelFilter === level
                            ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500'
                            : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  {levelFilter !== null && (
                    <div className="mt-1.5 text-[10px] text-purple-300">
                      Visualizzando Piano {levelFilter}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* ===== LEGENDA ===== */}
          <CollapsibleSection
            title="Legenda Colori"
            icon={<Palette size={14} />}
            defaultOpen={false}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-xs text-slate-300">Con Giacenza</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span className="text-xs text-slate-300">Mov. Uscita Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-400"></div>
                <span className="text-xs text-slate-300">Mov. Arrivo Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-slate-600"></div>
                <span className="text-xs text-slate-300">Vuota</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-400"></div>
                <span className="text-xs text-slate-300">Selezionata</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-400"></div>
                <span className="text-xs text-slate-300">Hover</span>
              </div>
            </div>
          </CollapsibleSection>

          {/* ===== GUIDA COMANDI ===== */}
          <CollapsibleSection
            title="Comandi"
            icon={<Keyboard size={14} />}
            defaultOpen={false}
          >
            <div className="text-xs space-y-1">
              <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Modalità Orbita</div>
              <div className="flex justify-between text-slate-400">
                <span>🖱️ Scroll</span>
                <span>Zoom</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>🖱️ Click Sx + Drag</span>
                <span>Ruota</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>🖱️ Click Dx + Drag</span>
                <span>Sposta</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>🖱️ Doppio Click</span>
                <span>Cambia punto orbita</span>
              </div>
              
              <div className="text-slate-500 text-[10px] uppercase tracking-wider mt-2 mb-1">Modalità FPS</div>
              <div className="flex justify-between text-slate-400">
                <span>W A S D</span>
                <span>Movimento</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Space / Shift</span>
                <span>Su / Giù</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Ctrl</span>
                <span>Sprint</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Mouse</span>
                <span>Guarda</span>
              </div>

              <div className="text-slate-500 text-[10px] uppercase tracking-wider mt-2 mb-1">Shortcuts</div>
              <div className="flex justify-between text-slate-400">
                <span>1 / 2 / 3 / 4</span>
                <span>Cambia Piano</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>0</span>
                <span>Tutti i Piani</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>F</span>
                <span>Toggle FPS</span>
              </div>
            </div>
          </CollapsibleSection>

        </div>

        {/* Footer Stats */}
        {stats && (
          <div className="bg-slate-800 border-t border-slate-700 p-2">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-500 block">Ubicazioni</span>
                <span className="text-sm font-bold text-white">{stats.totalLocations}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Scaffali</span>
                <span className="text-sm font-bold text-white">{stats.maxAisle}</span>
              </div>
            </div>
          </div>
        )}

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