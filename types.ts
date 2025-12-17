export interface LocationData {
  id: number;
  originalString: string;
  aisle: number;
  bay: number;
  level: number;
  x: number;
  y: number;
  z: number;
  productCode?: string;
  productDesc?: string;
  quantity?: number;
  locationCode?: string;
  barcode?: string;     // Codice a barre articolo
  barcodeUnmis?: string; // Unità di misura barcode
  barcodeQuant?: number; // Quantità per barcode
  movIn?: number;       // Quantità in arrivo (movimenti pendenti)
  movOut?: number;      // Quantità in uscita (movimenti pendenti)
}

export interface Stats {
  totalLocations: number;
  maxAisle: number;
  maxBay: number;
  maxLevel: number;
}

export interface SQLLocationData {
  au_ubicaz: string;
  au_magaz: string;
  au_zona: string;
  au_scaff: string | number;
  au_posiz: string | number;
  au_piano: string | number;
  au_cella: string | number;
  lotcpro_lp_codart?: string; // Depends on how SQL request returns joined columns.
  // In mssql driver, collision might happen or it returns flat.
  // The query selects 'lotcpro.lp_codart', 'artico.ar_descr'.
  // mssql usually returns 'lp_codart', 'ar_descr'.
  lp_codart: string;
  lp_esist: number;
  ar_descr: string;
  barcode: string;        // Codice a barre
  barcode_unmis: string;  // Unità di misura barcode
  barcode_quant: number;  // Quantità per barcode
  mov_in: number;   // Movimenti in arrivo (pendenti)
  mov_out: number;  // Movimenti in uscita (pendenti)
}

export interface Movement {
  id?: number;
  codditt: string;
  lp_codart: string;
  lp_magaz: string;
  ubicaz_partenza: string;
  ubicaz_destinazione: string;
  quantita: number;
  data_movimento?: string;
  utente?: string;
  confermato?: boolean;
  data_conferma?: string;
  note?: string;
}

// Statistiche per ottimizzazione logistica
export interface LocationStats {
  locationCode: string;
  pickupFrequency: number;      // Frequenza prelievi (ultimi 30gg)
  lastPickupDate?: string;       // Data ultimo prelievo
  totalVolume: number;           // Volume totale articoli
  distanceFromShipping: number;  // Distanza da zona spedizione
  utilizationScore: number;      // Score di utilizzo (0-100)
}

export interface HeatmapData {
  locationCode: string;
  x: number;
  y: number;
  z: number;
  intensity: number;  // 0-1, dove 1 è massima attività
  pickupCount: number;
}

export interface OptimalLocationSuggestion {
  currentLocation: string;
  suggestedLocation: string;
  reason: string;
  improvementScore: number;  // Quanto migliorerebbe (0-100)
  factors: {
    frequencyScore: number;
    sizeScore: number;
    distanceScore: number;
  };
}

export interface PickingPath {
  locations: string[];
  coordinates: Array<{x: number, y: number, z: number}>;
  totalDistance: number;
  estimatedTime: number; // minuti
  order: number[];       // Ordine ottimale degli indici
}

export interface OptimizationSettings {
  shippingZoneLocation: {x: number, y: number, z: number};
  walkingSpeed: number;  // metri/minuto
  pickTimePerItem: number; // secondi
}