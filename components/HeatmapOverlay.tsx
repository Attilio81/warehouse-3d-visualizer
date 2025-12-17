import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { HeatmapData } from '../types';
import { getHeatmapColor } from '../utils/heatmapUtils';

interface HeatmapOverlayProps {
  heatmapData: HeatmapData[];
  opacity?: number;
  enabled?: boolean;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  heatmapData,
  opacity = 0.7,
  enabled = true
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!meshRef.current || heatmapData.length === 0 || !enabled) return;

    const mesh = meshRef.current;

    for (let i = 0; i < heatmapData.length; i++) {
      const data = heatmapData[i];

      // Posiziona leggermente sopra l'ubicazione per visibilità
      tempObject.position.set(data.x, data.y + 0.45, data.z);

      // Scala in base all'intensità (min 0.8, max 1.2)
      const scale = 0.8 + (data.intensity * 0.4);
      tempObject.scale.set(scale, scale * 0.5, scale);

      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [heatmapData, enabled]);

  useLayoutEffect(() => {
    if (!meshRef.current || heatmapData.length === 0 || !enabled) return;

    const mesh = meshRef.current;

    for (let i = 0; i < heatmapData.length; i++) {
      const data = heatmapData[i];
      const color = getHeatmapColor(data.intensity);
      tempColor.set(color);
      mesh.setColorAt(i, tempColor);
    }

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [heatmapData, enabled]);

  if (!enabled || heatmapData.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, heatmapData.length]}
      frustumCulled={false}
    >
      <cylinderGeometry args={[0.5, 0.5, 0.3, 16]} />
      <meshStandardMaterial
        transparent
        opacity={opacity}
        emissive="#ffffff"
        emissiveIntensity={0.3}
        roughness={0.3}
        metalness={0.6}
      />
    </instancedMesh>
  );
};
