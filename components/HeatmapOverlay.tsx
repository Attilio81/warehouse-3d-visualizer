import React, { useMemo } from 'react';
import { HeatmapData } from '../types';
import { getHeatmapColor } from '../utils/heatmapUtils';

interface HeatmapOverlayProps {
  heatmapData: HeatmapData[];
  opacity?: number;
  enabled?: boolean;
}

// Singola sfera colorata per la heatmap
const HeatmapSphere: React.FC<{
  position: [number, number, number];
  color: string;
  scale: number;
  opacity: number;
}> = ({ position, color, scale, opacity }) => (
  <mesh position={position}>
    <sphereGeometry args={[0.3 * scale, 10, 10]} />
    <meshBasicMaterial
      color={color}
      transparent
      opacity={opacity}
      depthWrite={false}
    />
  </mesh>
);

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  heatmapData,
  opacity = 0.8,
  enabled = true
}) => {
  // Filtra solo ubicazioni con attività e prepara i dati
  const sphereData = useMemo(() => {
    if (!enabled) return [];
    
    const active = heatmapData.filter(d => d.intensity > 0);
    console.log('Heatmap: rendering', active.length, 'locations');
    
    return active.map(d => ({
      key: d.locationCode,
      position: [d.x, d.y + 0.3, d.z] as [number, number, number],
      color: getHeatmapColor(d.intensity),
      scale: 0.7 + (d.intensity * 0.6), // scala 0.7-1.3
    }));
  }, [heatmapData, enabled]);

  if (!enabled || sphereData.length === 0) return null;

  return (
    <group>
      {sphereData.map(sphere => (
        <HeatmapSphere
          key={sphere.key}
          position={sphere.position}
          color={sphere.color}
          scale={sphere.scale}
          opacity={opacity}
        />
      ))}
    </group>
  );
};
