import { LocationData, Stats, SQLLocationData } from '../types';

// Configuration for physical dimensions (relative units)
const CONFIG = {
  BOX_WIDTH: 1,
  BOX_HEIGHT: 1,
  BOX_DEPTH: 1,
  AISLE_GAP: 3, // Space between aisles (walking path)
  BAY_GAP: 1.1, // Spacing along the aisle
  LEVEL_GAP: 1.1, // Spacing vertically
};

export const parseWarehouseData = (text: string): { locations: LocationData[], stats: Stats } => {
  const lines = text.trim().split('\n');
  const locations: LocationData[] = [];

  let maxAisle = 0;
  let maxBay = 0;
  let maxLevel = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Split by space to get parts. Expected: "01 01 01"
    const parts = trimmed.split(/\s+/);

    if (parts.length >= 3) {
      const aisle = parseInt(parts[0], 10);
      const bay = parseInt(parts[1], 10);
      const level = parseInt(parts[2], 10);

      if (!isNaN(aisle) && !isNaN(bay) && !isNaN(level)) {

        // Update stats
        if (aisle > maxAisle) maxAisle = aisle;
        if (bay > maxBay) maxBay = bay;
        if (level > maxLevel) maxLevel = level;

        // Calculate 3D Coordinates
        const x = aisle * CONFIG.AISLE_GAP;
        const y = level * CONFIG.LEVEL_GAP;
        const z = bay * CONFIG.BAY_GAP;

        locations.push({
          id: index,
          originalString: trimmed,
          aisle,
          bay,
          level,
          x,
          y,
          z
        });
      }
    }
  });

  return {
    locations,
    stats: {
      totalLocations: locations.length,
      maxAisle,
      maxBay,
      maxLevel
    }
  };
};

export const parseSQLData = (data: SQLLocationData[]): { locations: LocationData[], stats: Stats } => {
  const locations: LocationData[] = [];

  let maxAisle = 0;
  let maxBay = 0;
  let maxLevel = 0;
  let warningCount = 0;

  // Debug: log first 5 rows to see lp_esist values
  if (data.length > 0) {
    console.log('DEBUG - First 5 rows lp_esist values:');
    data.slice(0, 5).forEach((row, i) => {
      console.log(`  Row ${i} (${row.au_ubicaz}): lp_esist =`, row.lp_esist, `(type: ${typeof row.lp_esist})`);
    });
  }

  data.forEach((row, index) => {
    // Map SQL fields to 3D coordinates
    // au_scaff -> aisle
    // au_piano -> level
    // au_posiz (or au_cella) -> bay

    // Try to parse from au_ubicaz if the individual fields are empty
    let aisle = typeof row.au_scaff === 'number' ? row.au_scaff : parseInt((row.au_scaff as string)?.trim(), 10);
    let level = typeof row.au_piano === 'number' ? row.au_piano : parseInt((row.au_piano as string)?.trim(), 10);
    let bay = typeof row.au_posiz === 'number' ? row.au_posiz : parseInt((row.au_posiz as string)?.trim(), 10);

    // If fields are empty/NaN, try to parse from au_ubicaz (format: "XX YY ZZ")
    if (isNaN(aisle) || isNaN(bay) || isNaN(level)) {
      if (row.au_ubicaz && row.au_ubicaz.trim().length > 0) {
        const parts = row.au_ubicaz.trim().split(/\s+/);
        if (parts.length >= 3) {
          if (isNaN(aisle)) aisle = parseInt(parts[0], 10);
          if (isNaN(bay)) bay = parseInt(parts[1], 10);
          if (isNaN(level)) level = parseInt(parts[2], 10);

          if (warningCount < 5) {
            console.warn(`Parsed coordinates from au_ubicaz for "${row.au_ubicaz}": scaff=${aisle}, posiz=${bay}, piano=${level}`);
            warningCount++;
            if (warningCount === 5) {
              console.warn('... (suppressing further parsing warnings)');
            }
          }
        }
      }
    }

    // Fallback if posiz is still 0 or NaN, try cella
    if ((!bay || isNaN(bay)) && row.au_cella) {
      bay = typeof row.au_cella === 'number' ? row.au_cella : parseInt((row.au_cella as string)?.trim(), 10);
    }

    // Final validation - set to 0 if still NaN
    if (isNaN(aisle)) aisle = 0;
    if (isNaN(level)) level = 0;
    if (isNaN(bay)) bay = 0;

    // Update stats
    if (aisle > maxAisle) maxAisle = aisle;
    if (bay > maxBay) maxBay = bay;
    if (level > maxLevel) maxLevel = level;

    // Calculate 3D Coordinates
    const x = aisle * CONFIG.AISLE_GAP;
    const y = level * CONFIG.LEVEL_GAP;
    const z = bay * CONFIG.BAY_GAP;

    // Convert lp_esist to number (it might come as string "0.000000000")
    const quantity = typeof row.lp_esist === 'number'
      ? row.lp_esist
      : parseFloat(row.lp_esist) || 0;

    // Convert movements to numbers
    const movIn = typeof row.mov_in === 'number'
      ? row.mov_in
      : parseFloat(row.mov_in) || 0;

    const movOut = typeof row.mov_out === 'number'
      ? row.mov_out
      : parseFloat(row.mov_out) || 0;

    locations.push({
      id: index,
      originalString: row.au_ubicaz,
      aisle,
      bay,
      level,
      x,
      y,
      z,
      productCode: row.lp_codart || '',
      productDesc: row.ar_descr || '',
      quantity: quantity,
      locationCode: row.au_ubicaz,
      movIn: movIn,
      movOut: movOut
    });
  });

  console.log(`Parsed ${locations.length} locations from database (received ${data.length} rows from API)`);
  console.log(`Max coordinates: Aisle=${maxAisle}, Bay=${maxBay}, Level=${maxLevel}`);

  // Debug: count locations with and without stock
  const withStock = locations.filter(l => l.quantity && l.quantity > 0).length;
  const withoutStock = locations.filter(l => !l.quantity || l.quantity === 0).length;
  console.log(`Locations with stock: ${withStock}, without stock: ${withoutStock}`);

  return {
    locations,
    stats: {
      totalLocations: locations.length,
      maxAisle,
      maxBay,
      maxLevel
    }
  };
};