import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WarehouseScene, WarehouseController } from './components/WarehouseScene';
import { Sidebar } from './components/Sidebar';
import { MovementModal } from './components/MovementModal';
import { MovementsPanel } from './components/MovementsPanel';
import { OptimizationPanel } from './components/OptimizationPanel';
import { LocationTooltip } from './components/LocationTooltip';
import { parseSQLData } from './utils/parser';
import { LocationData, Stats, SQLLocationData, HeatmapData, OptimalLocationSuggestion, PickingPath } from './types';
import { normalizeHeatmapData } from './utils/heatmapUtils';
import { generateOptimizationSuggestions, calculateOptimalPickingPath } from './utils/optimization';

const API_URL = 'http://localhost:4000/api/warehouse-data';
const API_MOVEMENTS_URL = 'http://localhost:4000/api/movimenti';
const API_HEATMAP_URL = 'http://localhost:4000/api/optimization/heatmap';
const API_SUGGESTIONS_URL = 'http://localhost:4000/api/optimization/suggestions';

export function App() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'full' | 'empty'>('all');
  const [levelFilter, setLevelFilter] = useState<number | null>(null); // null = tutti i piani
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isMovementsPanelOpen, setIsMovementsPanelOpen] = useState(false);

  // Optimization states
  const [isOptimizationPanelOpen, setIsOptimizationPanelOpen] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [suggestions, setSuggestions] = useState<OptimalLocationSuggestion[]>([]);
  const [pickingPath, setPickingPath] = useState<PickingPath | null>(null);
  const [showPickingPath, setShowPickingPath] = useState(false);
  const [selectedLocationsForPath, setSelectedLocationsForPath] = useState<string[]>([]);
  const [fpsMode, setFpsMode] = useState(false);

  const warehouseRef = useRef<WarehouseController>(null);

  // Get available levels for filter (memoized for use in keyboard shortcuts)
  const availableLevels = useMemo(() => 
    [...new Set(locations.map(loc => loc.level))].sort((a, b) => a - b), 
    [locations]
  );

  // Load data from database on startup
  useEffect(() => {
    loadDataFromAPI();
    loadOptimizationData();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Skip if in FPS mode (FPS has its own controls)
      if (fpsMode) return;

      switch (e.key.toLowerCase()) {
        case 'f':
          // Focus on selected location
          if (selectedLocationId !== null) {
            const loc = locations.find(l => l.id === selectedLocationId);
            if (loc) warehouseRef.current?.focusLocation(loc);
          }
          break;
        case 'h':
          // Home / Reset view
          warehouseRef.current?.resetView();
          break;
        case '1':
          // Top-down view (would need to extend WarehouseController)
          e.preventDefault();
          setLevelFilter(availableLevels[0] || null);
          break;
        case '2':
          e.preventDefault();
          setLevelFilter(availableLevels[1] || null);
          break;
        case '3':
          e.preventDefault();
          setLevelFilter(availableLevels[2] || null);
          break;
        case '0':
          // Show all levels
          e.preventDefault();
          setLevelFilter(null);
          break;
        case 'escape':
          // Deselect
          setSelectedLocationId(null);
          setTooltipPosition(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fpsMode, selectedLocationId, locations, availableLevels]);

  const loadDataFromAPI = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SQLLocationData[] = await response.json();
      const result = parseSQLData(data);

      setLocations(result.locations);
      setStats(result.stats);
      setSelectedLocationId(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(`Errore nel caricamento dei dati: ${errorMessage}`);
      console.error('Errore caricamento dati:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOptimizationData = async () => {
    try {
      // Carica dati heatmap
      const heatmapResponse = await fetch(`${API_HEATMAP_URL}?days=30`);
      if (heatmapResponse.ok) {
        const rawHeatmapData = await heatmapResponse.json();
        const normalizedHeatmap = normalizeHeatmapData(rawHeatmapData);
        setHeatmapData(normalizedHeatmap);
      }
    } catch (err) {
      console.error('Errore caricamento dati ottimizzazione:', err);
    }
  };

  // Genera suggerimenti quando cambiano i dati
  useEffect(() => {
    if (locations.length > 0 && heatmapData.length > 0) {
      const newSuggestions = generateOptimizationSuggestions(locations, heatmapData);
      setSuggestions(newSuggestions);
    }
  }, [locations, heatmapData]);

  const handleSelectLocation = (loc: LocationData | null, mouseX?: number, mouseY?: number) => {
    if (loc) {
      setSelectedLocationId(loc.id);
      if (mouseX !== undefined && mouseY !== undefined) {
        setTooltipPosition({ x: mouseX, y: mouseY });
      } else {
        setTooltipPosition(null);
      }
    } else {
      setSelectedLocationId(null);
      setTooltipPosition(null);
    }
  };

  const handleSearchSelect = (location: LocationData) => {
    // Select the location
    setSelectedLocationId(location.id);
    setTooltipPosition(null); // Non mostrare tooltip dalla ricerca
    // Focus camera on the location
    warehouseRef.current?.focusLocation(location);
  };

  const handleCreateMovement = async (movement: {
    codditt: string;
    lp_codart: string;
    lp_magaz: string;
    ubicaz_partenza: string;
    ubicaz_destinazione: string;
    quantita: number;
    utente: string;
    note: string;
  }) => {
    const response = await fetch(API_MOVEMENTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movement),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Errore nella creazione del movimento');
    }

    // Reload data to show new pending movements
    await loadDataFromAPI();
  };

  // Optimization handlers
  const handleOpenOptimizationPanel = () => {
    setIsOptimizationPanelOpen(true);
  };

  const handleSuggestionClick = (suggestion: OptimalLocationSuggestion) => {
    // Trova e seleziona l'ubicazione suggerita
    const location = locations.find(
      loc => (loc.locationCode || loc.originalString) === suggestion.suggestedLocation
    );
    if (location) {
      setSelectedLocationId(location.id);
      setTooltipPosition(null); // Non mostrare tooltip dai suggerimenti
      warehouseRef.current?.focusLocation(location);
    }
  };

  const handleHighlightLocation = (locationCode: string) => {
    const location = locations.find(
      loc => (loc.locationCode || loc.originalString) === locationCode
    );
    if (location) {
      setSelectedLocationId(location.id);
      setTooltipPosition(null); // Non mostrare tooltip dall'highlight
      warehouseRef.current?.focusLocation(location);
    }
  };

  const handleToggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };

  const handleToggleFPSMode = () => {
    setFpsMode(!fpsMode);
  };

  const handleCalculatePickingPath = (locationCodes: string[]) => {
    if (locationCodes.length > 0) {
      const path = calculateOptimalPickingPath(locationCodes, locations);
      setPickingPath(path);
      setShowPickingPath(true);
    }
  };

  // Filter locations based on selected filter and level
  const filteredLocations = locations.filter(loc => {
    // Level filter
    if (levelFilter !== null && loc.level !== levelFilter) return false;
    
    // Occupancy filter
    if (filter === 'all') return true;
    if (filter === 'full') return loc.quantity > 0;
    if (filter === 'empty') return loc.quantity === 0;
    return true;
  });

  return (
    <div className="w-full h-full relative flex">
      <Sidebar
        onReload={loadDataFromAPI}
        selectedLocation={selectedLocationId !== null ? locations.find(l => l.id === selectedLocationId) || null : null}
        stats={stats}
        isLoading={isLoading}
        error={error}
        onZoomIn={() => warehouseRef.current?.zoomIn()}
        onZoomOut={() => warehouseRef.current?.zoomOut()}
        onResetView={() => warehouseRef.current?.resetView()}
        filter={filter}
        onFilterChange={setFilter}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
        availableLevels={availableLevels}
        onOpenMovementModal={() => setIsMovementModalOpen(true)}
        onOpenMovementsPanel={() => setIsMovementsPanelOpen(true)}
        locations={locations}
        onSearchSelect={handleSearchSelect}
        onOpenOptimizationPanel={handleOpenOptimizationPanel}
        onToggleHeatmap={handleToggleHeatmap}
        showHeatmap={showHeatmap}
        optimizationSuggestionsCount={suggestions.length}
        onToggleFPSMode={handleToggleFPSMode}
        fpsMode={fpsMode}
      />

      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        selectedLocation={selectedLocationId !== null ? locations.find(l => l.id === selectedLocationId) || null : null}
        onCreateMovement={handleCreateMovement}
      />

      <MovementsPanel
        isOpen={isMovementsPanelOpen}
        onClose={() => setIsMovementsPanelOpen(false)}
      />

      <OptimizationPanel
        isOpen={isOptimizationPanelOpen}
        onClose={() => setIsOptimizationPanelOpen(false)}
        suggestions={suggestions}
        heatmapData={heatmapData}
        pickingPath={pickingPath}
        onSuggestionClick={handleSuggestionClick}
        onHighlightLocation={handleHighlightLocation}
      />

      <div className="flex-1 h-full bg-gray-900 relative">
        <WarehouseScene
          ref={warehouseRef}
          locations={filteredLocations}
          onSelectLocation={handleSelectLocation}
          selectedLocationId={selectedLocationId}
          heatmapData={heatmapData}
          showHeatmap={showHeatmap}
          pickingPath={pickingPath}
          showPickingPath={showPickingPath}
          fpsMode={fpsMode}
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gray-900/80">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">Caricamento dati...</h2>
              <p className="text-gray-400">Connessione al database in corso</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-white text-center max-w-md p-6 bg-red-900/30 rounded-lg border border-red-500">
              <h2 className="text-2xl font-bold mb-2 text-red-400">Errore</h2>
              <p className="text-gray-300">{error}</p>
            </div>
          </div>
        )}

        {locations.length === 0 && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-white text-opacity-50 text-center">
              <h2 className="text-2xl font-bold mb-2">Nessun dato disponibile</h2>
              <p>Premi "Ricarica Dati" nella sidebar per caricare i dati dal database.</p>
            </div>
          </div>
        )}

        {/* FPS Mode Controls Hint */}
        {fpsMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg border border-blue-400 pointer-events-none z-30">
            <div className="text-sm font-semibold mb-2 text-center">🎮 Modalità FPS Attiva</div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <kbd className="bg-blue-800 px-2 py-0.5 rounded">W A S D</kbd>
                <span>Muovi</span>
                <kbd className="bg-green-700 px-2 py-0.5 rounded">Ctrl</kbd>
                <span className="text-green-300">Sprint</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-blue-800 px-2 py-0.5 rounded">Mouse</kbd>
                <span>Guarda (Click per bloccare)</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-blue-800 px-2 py-0.5 rounded">Space</kbd>
                <span>Su</span>
                <kbd className="bg-blue-800 px-2 py-0.5 rounded">Shift</kbd>
                <span>Giù</span>
              </div>
              <div className="flex items-center gap-2 border-t border-blue-700 pt-1 mt-1">
                <kbd className="bg-blue-800 px-2 py-0.5 rounded">ESC</kbd>
                <span>Sblocca mouse per Sidebar</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Location Tooltip */}
      {selectedLocationId !== null && tooltipPosition && (() => {
        const selectedLocation = locations.find(l => l.id === selectedLocationId);
        if (!selectedLocation) return null;
        return (
          <LocationTooltip
            location={selectedLocation}
            mouseX={tooltipPosition.x}
            mouseY={tooltipPosition.y}
            onClose={() => {
              setSelectedLocationId(null);
              setTooltipPosition(null);
            }}
          />
        );
      })()}
    </div>
  );
}