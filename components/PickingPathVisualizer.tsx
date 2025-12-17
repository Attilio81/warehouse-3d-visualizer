import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { PickingPath } from '../types';

interface PickingPathVisualizerProps {
  path: PickingPath | null;
  enabled?: boolean;
  color?: string;
  lineWidth?: number;
}

export const PickingPathVisualizer: React.FC<PickingPathVisualizerProps> = ({
  path,
  enabled = true,
  color = '#22d3ee', // Cyan
  lineWidth = 3
}) => {
  const points = useMemo(() => {
    if (!path || !enabled || path.coordinates.length === 0) return [];

    // Crea punti che partono dall'origine (0, 0.5, 0) - zona spedizione
    const pathPoints: THREE.Vector3[] = [
      new THREE.Vector3(0, 0.5, 0) // Punto di partenza
    ];

    // Aggiungi tutti i punti del percorso, leggermente sollevati
    path.coordinates.forEach(coord => {
      pathPoints.push(new THREE.Vector3(coord.x, coord.y + 0.5, coord.z));
    });

    // Ritorno alla zona spedizione
    pathPoints.push(new THREE.Vector3(0, 0.5, 0));

    return pathPoints;
  }, [path, enabled]);

  // Markers per i punti di picking
  const markers = useMemo(() => {
    if (!path || !enabled || path.coordinates.length === 0) return [];

    return path.coordinates.map((coord, index) => ({
      position: [coord.x, coord.y + 1.2, coord.z] as [number, number, number],
      order: index + 1
    }));
  }, [path, enabled]);

  if (!enabled || !path || points.length === 0) return null;

  return (
    <group>
      {/* Linea del percorso */}
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        dashed={false}
      />

      {/* Markers numerati per ogni punto */}
      {markers.map((marker, index) => (
        <group key={index} position={marker.position}>
          {/* Sfera marker */}
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* Anello di evidenza */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
            <ringGeometry args={[0.5, 0.7, 32]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {/* Marker zona spedizione (origine) */}
      <group position={[0, 0.8, 0]}>
        <mesh>
          <coneGeometry args={[0.5, 1, 4]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>
    </group>
  );
};
