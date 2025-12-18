import { HeatmapData, LocationData } from '../types';

// Configuration for physical dimensions (must match parser.ts)
const CONFIG = {
  AISLE_GAP: 3,
  BAY_GAP: 1.1,
  LEVEL_GAP: 1.1,
};

/**
 * Normalizza i dati della heatmap per la visualizzazione
 * Mappa i dati heatmap alle locations esistenti per usare le coordinate corrette
 */
export function normalizeHeatmapData(
  data: Array<{
    locationCode: string;
    pickupCount: number;
  }>,
  locations: LocationData[]
): HeatmapData[] {
  if (data.length === 0 || locations.length === 0) return [];

  // Crea mappa delle locations per locationCode
  const locationMap = new Map<string, LocationData>();
  locations.forEach(loc => {
    const code = loc.locationCode || loc.originalString;
    locationMap.set(code, loc);
  });

  // Trova il massimo pickup count
  const maxPickup = Math.max(...data.map(d => d.pickupCount));
  if (maxPickup === 0) return [];

  // Mappa solo le ubicazioni che esistono nel magazzino
  const result: HeatmapData[] = [];
  
  data.forEach(item => {
    if (item.pickupCount <= 0) return;
    
    const loc = locationMap.get(item.locationCode);
    if (!loc) return; // Salta se l'ubicazione non esiste nel magazzino
    
    result.push({
      locationCode: item.locationCode,
      // Usa le coordinate dalla location esistente
      x: loc.x,
      y: loc.y,
      z: loc.z,
      intensity: item.pickupCount / maxPickup,
      pickupCount: item.pickupCount
    });
  });

  console.log(`Heatmap: ${result.length} ubicazioni mappate su ${data.length} totali`);
  return result;
}

/**
 * Mappa i dati della heatmap alle ubicazioni esistenti
 */
export function mapHeatmapToLocations(
  heatmapData: HeatmapData[],
  locations: LocationData[]
): Map<string, HeatmapData> {
  const heatmapMap = new Map<string, HeatmapData>();

  heatmapData.forEach(hd => {
    heatmapMap.set(hd.locationCode, hd);
  });

  return heatmapMap;
}

/**
 * Calcola il colore della heatmap basato sull'intensità
 * Usa una scala dal blu (freddo/poco usato) al rosso (caldo/molto usato)
 */
export function getHeatmapColor(intensity: number): string {
  // intensity da 0 a 1
  const normalizedIntensity = Math.max(0, Math.min(1, intensity));

  if (normalizedIntensity < 0.01) {
    return '#1f2937'; // Grigio scuro per intensità quasi zero
  }

  // Scala colori: Blu -> Cyan -> Verde -> Giallo -> Arancione -> Rosso
  if (normalizedIntensity < 0.2) {
    // Blu scuro -> Blu
    return interpolateColor('#1e3a8a', '#3b82f6', normalizedIntensity / 0.2);
  } else if (normalizedIntensity < 0.4) {
    // Blu -> Cyan
    return interpolateColor('#3b82f6', '#06b6d4', (normalizedIntensity - 0.2) / 0.2);
  } else if (normalizedIntensity < 0.6) {
    // Cyan -> Verde
    return interpolateColor('#06b6d4', '#10b981', (normalizedIntensity - 0.4) / 0.2);
  } else if (normalizedIntensity < 0.8) {
    // Verde -> Giallo
    return interpolateColor('#10b981', '#eab308', (normalizedIntensity - 0.6) / 0.2);
  } else if (normalizedIntensity < 0.9) {
    // Giallo -> Arancione
    return interpolateColor('#eab308', '#f97316', (normalizedIntensity - 0.8) / 0.1);
  } else {
    // Arancione -> Rosso
    return interpolateColor('#f97316', '#dc2626', (normalizedIntensity - 0.9) / 0.1);
  }
}

/**
 * Interpola tra due colori hex
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  if (!c1 || !c2) return color1;

  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);

  return rgbToHex(r, g, b);
}

/**
 * Converte hex in RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

/**
 * Converte RGB in hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Calcola statistiche aggregate per la heatmap
 */
export function calculateHeatmapStats(heatmapData: HeatmapData[]): {
  totalPickups: number;
  averagePickups: number;
  maxPickups: number;
  activeLocations: number;
  inactiveLocations: number;
} {
  if (heatmapData.length === 0) {
    return {
      totalPickups: 0,
      averagePickups: 0,
      maxPickups: 0,
      activeLocations: 0,
      inactiveLocations: 0
    };
  }

  const totalPickups = heatmapData.reduce((sum, d) => sum + d.pickupCount, 0);
  const activeLocations = heatmapData.filter(d => d.pickupCount > 0).length;
  const inactiveLocations = heatmapData.filter(d => d.pickupCount === 0).length;
  const maxPickups = Math.max(...heatmapData.map(d => d.pickupCount));
  const averagePickups = activeLocations > 0 ? totalPickups / activeLocations : 0;

  return {
    totalPickups,
    averagePickups: Math.round(averagePickups * 10) / 10,
    maxPickups,
    activeLocations,
    inactiveLocations
  };
}

/**
 * Filtra le ubicazioni per intensità della heatmap
 */
export function filterByIntensity(
  heatmapData: HeatmapData[],
  minIntensity: number,
  maxIntensity: number
): HeatmapData[] {
  return heatmapData.filter(
    d => d.intensity >= minIntensity && d.intensity <= maxIntensity
  );
}

/**
 * Ottieni le top N ubicazioni più utilizzate
 */
export function getTopLocations(heatmapData: HeatmapData[], n: number): HeatmapData[] {
  return [...heatmapData]
    .sort((a, b) => b.pickupCount - a.pickupCount)
    .slice(0, n);
}
