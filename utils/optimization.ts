import { LocationData, HeatmapData, OptimalLocationSuggestion, PickingPath, OptimizationSettings } from '../types';

// Configurazione default zona spedizione (origine 0,0,0)
const DEFAULT_SETTINGS: OptimizationSettings = {
  shippingZoneLocation: { x: 0, y: 0, z: 0 },
  walkingSpeed: 80, // metri/minuto
  pickTimePerItem: 30, // secondi
};

/**
 * Calcola la distanza euclidea tra due punti 3D
 */
export function calculateDistance(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calcola la distanza dalla zona di spedizione
 */
export function calculateDistanceFromShipping(
  location: { x: number; y: number; z: number },
  settings: OptimizationSettings = DEFAULT_SETTINGS
): number {
  return calculateDistance(location, settings.shippingZoneLocation);
}

/**
 * Calcola uno score di ottimalità per un'ubicazione basato su:
 * - Frequenza di prelievo (più alta = meglio)
 * - Distanza dalla zona spedizione (più vicina = meglio)
 * - Livello (più basso = meglio, più facile accesso)
 */
export function calculateLocationScore(
  location: LocationData,
  pickupFrequency: number,
  maxFrequency: number,
  settings: OptimizationSettings = DEFAULT_SETTINGS
): number {
  // Normalizza frequenza (0-1)
  const frequencyScore = maxFrequency > 0 ? pickupFrequency / maxFrequency : 0;

  // Calcola score distanza (più vicino = meglio)
  const distance = calculateDistanceFromShipping(location, settings);
  const maxDistance = 200; // Assumiamo 200m come massima distanza ragionevole
  const distanceScore = Math.max(0, 1 - distance / maxDistance);

  // Score livello (livello 1 = 1.0, livello 2 = 0.8, livello 3+ = 0.6)
  const levelScore = location.level === 1 ? 1.0 : location.level === 2 ? 0.8 : 0.6;

  // Media ponderata: frequenza 50%, distanza 30%, livello 20%
  return frequencyScore * 0.5 + distanceScore * 0.3 + levelScore * 0.2;
}

/**
 * Genera suggerimenti per ubicazioni ottimali
 * Identifica prodotti ad alta rotazione in ubicazioni non ottimali
 */
export function generateOptimizationSuggestions(
  locations: LocationData[],
  heatmapData: HeatmapData[],
  settings: OptimizationSettings = DEFAULT_SETTINGS
): OptimalLocationSuggestion[] {
  const suggestions: OptimalLocationSuggestion[] = [];

  // Crea mappa delle frequenze di pickup
  const frequencyMap = new Map<string, number>();
  let maxFrequency = 0;

  heatmapData.forEach(hd => {
    frequencyMap.set(hd.locationCode, hd.pickupCount);
    if (hd.pickupCount > maxFrequency) maxFrequency = hd.pickupCount;
  });

  // Trova ubicazioni con alta frequenza
  const highFrequencyLocations = locations.filter(loc => {
    const freq = frequencyMap.get(loc.locationCode || loc.originalString) || 0;
    return freq >= maxFrequency * 0.5; // Top 50% frequenza
  });

  // Per ogni ubicazione ad alta frequenza, valuta se è ben posizionata
  highFrequencyLocations.forEach(currentLoc => {
    const currentFreq = frequencyMap.get(currentLoc.locationCode || currentLoc.originalString) || 0;
    const currentScore = calculateLocationScore(currentLoc, currentFreq, maxFrequency, settings);

    // Trova ubicazioni vuote potenzialmente migliori
    const emptyLocations = locations.filter(loc =>
      (!loc.quantity || loc.quantity === 0) &&
      loc.id !== currentLoc.id
    );

    // Calcola score per ubicazioni vuote
    const betterLocations = emptyLocations
      .map(emptyLoc => ({
        location: emptyLoc,
        score: calculateLocationScore(emptyLoc, currentFreq, maxFrequency, settings)
      }))
      .filter(item => item.score > currentScore + 0.15) // Almeno 15% migliore
      .sort((a, b) => b.score - a.score);

    if (betterLocations.length > 0) {
      const bestLocation = betterLocations[0];
      const improvement = ((bestLocation.score - currentScore) / currentScore) * 100;

      const distanceCurrent = calculateDistanceFromShipping(currentLoc, settings);
      const distanceBest = calculateDistanceFromShipping(bestLocation.location, settings);

      let reason = '';
      if (distanceBest < distanceCurrent * 0.7) {
        reason = 'Molto più vicina alla zona spedizione';
      } else if (bestLocation.location.level < currentLoc.level) {
        reason = 'Livello più basso e più accessibile';
      } else if (distanceBest < distanceCurrent) {
        reason = 'Posizione più favorevole per picking frequente';
      } else {
        reason = 'Ottimizzazione generale del flusso';
      }

      suggestions.push({
        currentLocation: currentLoc.locationCode || currentLoc.originalString,
        suggestedLocation: bestLocation.location.locationCode || bestLocation.location.originalString,
        reason,
        improvementScore: Math.round(improvement),
        factors: {
          frequencyScore: currentFreq / maxFrequency,
          sizeScore: currentLoc.quantity || 0,
          distanceScore: 1 - (distanceCurrent / 200)
        }
      });
    }
  });

  return suggestions.sort((a, b) => b.improvementScore - a.improvementScore);
}

/**
 * Algoritmo Nearest Neighbor per calcolare percorso ottimale di picking
 * Parte dalla zona spedizione e visita le ubicazioni nell'ordine più efficiente
 */
export function calculateOptimalPickingPath(
  locationCodes: string[],
  allLocations: LocationData[],
  settings: OptimizationSettings = DEFAULT_SETTINGS
): PickingPath {
  // Mappa per accesso rapido alle ubicazioni
  const locationMap = new Map<string, LocationData>();
  allLocations.forEach(loc => {
    locationMap.set(loc.locationCode || loc.originalString, loc);
  });

  // Ottieni le ubicazioni richieste
  const requestedLocations = locationCodes
    .map(code => locationMap.get(code))
    .filter(loc => loc !== undefined) as LocationData[];

  if (requestedLocations.length === 0) {
    return {
      locations: [],
      coordinates: [],
      totalDistance: 0,
      estimatedTime: 0,
      order: []
    };
  }

  // Algoritmo Nearest Neighbor
  const visited = new Set<number>();
  const orderedLocations: LocationData[] = [];
  const orderedCoordinates: Array<{x: number, y: number, z: number}> = [];
  const orderedIndices: number[] = [];

  let currentPos = settings.shippingZoneLocation;
  let totalDistance = 0;

  while (visited.size < requestedLocations.length) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    // Trova la ubicazione non visitata più vicina
    requestedLocations.forEach((loc, idx) => {
      if (!visited.has(idx)) {
        const dist = calculateDistance(currentPos, loc);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = idx;
        }
      }
    });

    if (nearestIdx !== -1) {
      visited.add(nearestIdx);
      const nextLoc = requestedLocations[nearestIdx];
      orderedLocations.push(nextLoc);
      orderedCoordinates.push({ x: nextLoc.x, y: nextLoc.y, z: nextLoc.z });
      orderedIndices.push(nearestIdx);
      totalDistance += nearestDist;
      currentPos = { x: nextLoc.x, y: nextLoc.y, z: nextLoc.z };
    }
  }

  // Aggiungi ritorno alla zona spedizione
  totalDistance += calculateDistance(currentPos, settings.shippingZoneLocation);

  // Calcola tempo stimato (distanza / velocità + tempo picking)
  const walkingTime = totalDistance / settings.walkingSpeed; // minuti
  const pickingTime = (requestedLocations.length * settings.pickTimePerItem) / 60; // minuti
  const estimatedTime = walkingTime + pickingTime;

  return {
    locations: orderedLocations.map(loc => loc.locationCode || loc.originalString),
    coordinates: orderedCoordinates,
    totalDistance: Math.round(totalDistance * 10) / 10,
    estimatedTime: Math.round(estimatedTime * 10) / 10,
    order: orderedIndices
  };
}

/**
 * Ottimizzazione 2-opt per migliorare il percorso
 * (opzionale, per percorsi più lunghi)
 */
export function optimize2Opt(path: PickingPath, locations: LocationData[]): PickingPath {
  if (path.coordinates.length < 4) return path;

  let improved = true;
  let bestPath = [...path.coordinates];
  let bestDistance = path.totalDistance;

  while (improved) {
    improved = false;

    for (let i = 0; i < bestPath.length - 2; i++) {
      for (let j = i + 2; j < bestPath.length; j++) {
        // Calcola distanza attuale
        const currentDist =
          calculateDistance(bestPath[i], bestPath[i + 1]) +
          calculateDistance(bestPath[j], bestPath[(j + 1) % bestPath.length]);

        // Calcola distanza con swap
        const newDist =
          calculateDistance(bestPath[i], bestPath[j]) +
          calculateDistance(bestPath[i + 1], bestPath[(j + 1) % bestPath.length]);

        if (newDist < currentDist) {
          // Inverti il segmento
          const newPath = [
            ...bestPath.slice(0, i + 1),
            ...bestPath.slice(i + 1, j + 1).reverse(),
            ...bestPath.slice(j + 1)
          ];
          bestPath = newPath;
          bestDistance = bestDistance - currentDist + newDist;
          improved = true;
        }
      }
    }
  }

  return {
    ...path,
    coordinates: bestPath,
    totalDistance: Math.round(bestDistance * 10) / 10
  };
}
