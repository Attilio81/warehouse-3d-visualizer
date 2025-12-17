import React, { useMemo } from 'react';
import * as THREE from 'three';

interface MetalRackProps {
  position: [number, number, number];
  levels: number;
  width?: number;
  depth?: number;
  levelHeight?: number;
  color?: string;
  frameColor?: string;
}

// Single metal rack unit with frame structure
export const MetalRack: React.FC<MetalRackProps> = ({
  position,
  levels,
  width = 2,
  depth = 1,
  levelHeight = 1.5,
  color = '#FF6B00', // Orange for metal frame
  frameColor = '#FF6B00'
}) => {
  const totalHeight = levels * levelHeight;
  const beamThickness = 0.08;
  const postThickness = 0.1;

  return (
    <group position={position}>
      {/* Vertical posts - 4 corners */}
      {[
        [-width / 2 + postThickness / 2, 0, -depth / 2 + postThickness / 2],
        [width / 2 - postThickness / 2, 0, -depth / 2 + postThickness / 2],
        [-width / 2 + postThickness / 2, 0, depth / 2 - postThickness / 2],
        [width / 2 - postThickness / 2, 0, depth / 2 - postThickness / 2],
      ].map((pos, i) => (
        <mesh key={`post-${i}`} position={[pos[0], totalHeight / 2, pos[2]]}>
          <boxGeometry args={[postThickness, totalHeight, postThickness]} />
          <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Horizontal beams and shelves for each level */}
      {Array.from({ length: levels }).map((_, levelIndex) => {
        const y = levelIndex * levelHeight + levelHeight / 2;
        return (
          <group key={`level-${levelIndex}`}>
            {/* Front and back horizontal beams */}
            <mesh position={[0, y - levelHeight / 2 + beamThickness, -depth / 2 + beamThickness / 2]}>
              <boxGeometry args={[width - postThickness * 2, beamThickness * 2, beamThickness]} />
              <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, y - levelHeight / 2 + beamThickness, depth / 2 - beamThickness / 2]}>
              <boxGeometry args={[width - postThickness * 2, beamThickness * 2, beamThickness]} />
              <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Side beams (diagonal cross braces) */}
            <mesh position={[-width / 2 + postThickness / 2, y, 0]}>
              <boxGeometry args={[beamThickness, beamThickness, depth - postThickness * 2]} />
              <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[width / 2 - postThickness / 2, y, 0]}>
              <boxGeometry args={[beamThickness, beamThickness, depth - postThickness * 2]} />
              <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
            </mesh>

            {/* Shelf surface (wood/metal panel) */}
            <mesh position={[0, y - levelHeight / 2 + beamThickness * 2.5, 0]}>
              <boxGeometry args={[width - postThickness * 2, 0.05, depth - postThickness * 2]} />
              <meshStandardMaterial color="#8B7355" metalness={0.1} roughness={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* Top beams */}
      <mesh position={[0, totalHeight - beamThickness / 2, -depth / 2 + beamThickness / 2]}>
        <boxGeometry args={[width, beamThickness, beamThickness]} />
        <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, totalHeight - beamThickness / 2, depth / 2 - beamThickness / 2]}>
        <boxGeometry args={[width, beamThickness, beamThickness]} />
        <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
};

// Pallet with realistic wood texture look
interface PalletProps {
  position: [number, number, number];
  hasBoxes?: boolean;
  boxColor?: string;
}

export const Pallet: React.FC<PalletProps> = ({
  position,
  hasBoxes = true,
  boxColor = '#8B4513'
}) => {
  const palletColor = '#DEB887';
  const plankWidth = 0.12;
  const palletWidth = 1.2;
  const palletDepth = 0.8;
  const palletHeight = 0.15;

  return (
    <group position={position}>
      {/* Pallet base - top planks */}
      {[-0.35, 0, 0.35].map((x, i) => (
        <mesh key={`top-${i}`} position={[x, palletHeight - 0.02, 0]}>
          <boxGeometry args={[plankWidth, 0.02, palletDepth]} />
          <meshStandardMaterial color={palletColor} roughness={0.9} />
        </mesh>
      ))}

      {/* Cross planks */}
      {[-0.3, 0, 0.3].map((z, i) => (
        <mesh key={`cross-${i}`} position={[0, palletHeight - 0.04, z]}>
          <boxGeometry args={[palletWidth, 0.02, plankWidth]} />
          <meshStandardMaterial color={palletColor} roughness={0.9} />
        </mesh>
      ))}

      {/* Support blocks */}
      {[
        [-0.4, 0, -0.3], [0, 0, -0.3], [0.4, 0, -0.3],
        [-0.4, 0, 0], [0, 0, 0], [0.4, 0, 0],
        [-0.4, 0, 0.3], [0, 0, 0.3], [0.4, 0, 0.3],
      ].map((pos, i) => (
        <mesh key={`block-${i}`} position={[pos[0], palletHeight / 2, pos[2]]}>
          <boxGeometry args={[0.1, palletHeight - 0.04, 0.1]} />
          <meshStandardMaterial color={palletColor} roughness={0.9} />
        </mesh>
      ))}

      {/* Boxes on pallet */}
      {hasBoxes && (
        <group position={[0, palletHeight + 0.2, 0]}>
          {/* Stack of boxes */}
          <mesh position={[-0.25, 0, -0.15]}>
            <boxGeometry args={[0.4, 0.35, 0.35]} />
            <meshStandardMaterial color={boxColor} roughness={0.7} />
          </mesh>
          <mesh position={[0.2, 0, 0.1]}>
            <boxGeometry args={[0.45, 0.4, 0.4]} />
            <meshStandardMaterial color="#4A90D9" roughness={0.7} />
          </mesh>
          <mesh position={[-0.15, 0.35, 0]}>
            <boxGeometry args={[0.5, 0.3, 0.5]} />
            <meshStandardMaterial color="#2ECC71" roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// Forklift simple model
interface ForkliftProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export const Forklift: React.FC<ForkliftProps> = ({
  position,
  rotation = [0, 0, 0]
}) => {
  const bodyColor = '#F4D03F'; // Yellow
  const wheelColor = '#2C3E50';
  const forkColor = '#7F8C8D';

  return (
    <group position={position} rotation={rotation}>
      {/* Main body */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.2, 0.8, 2]} />
        <meshStandardMaterial color={bodyColor} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Cabin/roof */}
      <mesh position={[0, 1.3, -0.3]}>
        <boxGeometry args={[1.1, 0.6, 1.2]} />
        <meshStandardMaterial color={bodyColor} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Mast (vertical lift structure) */}
      <mesh position={[0, 1.2, 1.1]}>
        <boxGeometry args={[0.15, 2, 0.15]} />
        <meshStandardMaterial color={forkColor} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.4, 1.2, 1.1]}>
        <boxGeometry args={[0.1, 2, 0.1]} />
        <meshStandardMaterial color={forkColor} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.4, 1.2, 1.1]}>
        <boxGeometry args={[0.1, 2, 0.1]} />
        <meshStandardMaterial color={forkColor} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Forks */}
      <mesh position={[-0.3, 0.2, 1.8]}>
        <boxGeometry args={[0.1, 0.05, 1.2]} />
        <meshStandardMaterial color={forkColor} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.3, 0.2, 1.8]}>
        <boxGeometry args={[0.1, 0.05, 1.2]} />
        <meshStandardMaterial color={forkColor} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Wheels */}
      {[
        [-0.5, 0.25, -0.7],
        [0.5, 0.25, -0.7],
        [-0.4, 0.2, 0.6],
        [0.4, 0.2, 0.6],
      ].map((pos, i) => (
        <mesh key={`wheel-${i}`} position={[pos[0], pos[1], pos[2]]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
          <meshStandardMaterial color={wheelColor} roughness={0.9} />
        </mesh>
      ))}

      {/* Counterweight */}
      <mesh position={[0, 0.4, -1.2]}>
        <boxGeometry args={[1, 0.5, 0.4]} />
        <meshStandardMaterial color="#2C3E50" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
};

// Warehouse floor with grid pattern
interface WarehouseFloorProps {
  width?: number;
  depth?: number;
  gridSize?: number;
}

export const WarehouseFloor: React.FC<WarehouseFloorProps> = ({
  width = 100,
  depth = 100,
  gridSize = 2
}) => {
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base color
    ctx.fillStyle = '#1a2744';
    ctx.fillRect(0, 0, 512, 512);
    
    // Grid lines
    ctx.strokeStyle = '#2a3a5a';
    ctx.lineWidth = 2;
    
    const step = 512 / 8;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, 512);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(512, i * step);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / gridSize, depth / gridSize);
    
    return texture;
  }, [width, depth, gridSize]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial 
        map={gridTexture}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};
