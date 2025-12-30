import React, { useMemo } from 'react';
import { Html, Text } from '@react-three/drei';
import { LocationData } from '../types';

interface AisleLabelsProps {
  locations: LocationData[];
  visible?: boolean;
}

interface AisleInfo {
  aisle: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerZ: number;
  maxY: number;
}

export const AisleLabels: React.FC<AisleLabelsProps> = ({ locations, visible = true }) => {
  // Calculate aisle positions and bounds
  const aisleInfos = useMemo(() => {
    if (locations.length === 0) return [];

    const aisleMap = new Map<number, AisleInfo>();

    locations.forEach(loc => {
      const existing = aisleMap.get(loc.aisle);
      if (existing) {
        existing.minX = Math.min(existing.minX, loc.x);
        existing.maxX = Math.max(existing.maxX, loc.x);
        existing.minZ = Math.min(existing.minZ, loc.z);
        existing.maxZ = Math.max(existing.maxZ, loc.z);
        existing.maxY = Math.max(existing.maxY, loc.y);
      } else {
        aisleMap.set(loc.aisle, {
          aisle: loc.aisle,
          minX: loc.x,
          maxX: loc.x,
          minZ: loc.z,
          maxZ: loc.z,
          centerX: loc.x,
          centerZ: loc.z,
          maxY: loc.y
        });
      }
    });

    // Calculate centers
    aisleMap.forEach(info => {
      info.centerX = (info.minX + info.maxX) / 2;
      info.centerZ = (info.minZ + info.maxZ) / 2;
    });

    return Array.from(aisleMap.values()).sort((a, b) => a.aisle - b.aisle);
  }, [locations]);

  if (!visible || aisleInfos.length === 0) return null;

  return (
    <group>
      {aisleInfos.map(info => (
        <group key={info.aisle}>
          {/* Floor label - text painted on the ground in front of aisle */}
          <Text
            position={[info.centerX, -0.4, info.maxZ + 2.5]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={1.8}
            color="#3B82F6"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
          >
            {info.aisle}
            <meshBasicMaterial color="#3B82F6" transparent opacity={0.9} />
          </Text>

          {/* Floor stripe/line marking the aisle */}
          <mesh position={[info.centerX, -0.48, info.maxZ + 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[Math.max(info.maxX - info.minX + 2, 8), 2.5]} />
            <meshBasicMaterial color="#1E3A5F" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Origin/Shipping zone indicator - also on floor */}
      <group position={[0, 0, 0]}>
        {/* Floor text for shipping zone */}
        <Text
          position={[0, -0.39, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1.5}
          color="#22C55E"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
        >

          <meshBasicMaterial color="#22C55E" transparent opacity={0.9} />
        </Text>

        {/* Ground marker for shipping zone */}
        <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5, 32]} />
          <meshBasicMaterial color="#166534" transparent opacity={0.5} />
        </mesh>

        {/* Directional arrows on floor pointing to shipping */}
        <mesh position={[8, -0.47, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[0.8, 3]} />
          <meshBasicMaterial color="#22C55E" transparent opacity={0.4} />
        </mesh>
        <mesh position={[-8, -0.47, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <planeGeometry args={[0.8, 3]} />
          <meshBasicMaterial color="#22C55E" transparent opacity={0.4} />
        </mesh>
      </group>
    </group>
  );
};
