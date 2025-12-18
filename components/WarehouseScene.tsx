import React, { useRef, useLayoutEffect, useState, useEffect, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { LocationData, HeatmapData, PickingPath } from '../types';
import { getHeatmapColor } from '../utils/heatmapUtils';
import { HeatmapOverlay } from './HeatmapOverlay';
import { PickingPathVisualizer } from './PickingPathVisualizer';
import { FirstPersonControls } from './FirstPersonControls';
import { AisleLabels } from './AisleLabels';
import { WarehouseFloor, Pallet } from './MetalRack';

export interface WarehouseController {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  focusLocation: (location: LocationData) => void;
}

interface WarehouseSceneProps {
  locations: LocationData[];
  onSelectLocation: (loc: LocationData | null, mouseX?: number, mouseY?: number) => void;
  selectedLocationId: number | null;
  heatmapData?: HeatmapData[];
  showHeatmap?: boolean;
  pickingPath?: PickingPath | null;
  showPickingPath?: boolean;
  fpsMode?: boolean;
  showAisleLabels?: boolean;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

const Racks: React.FC<{ 
  locations: LocationData[]; 
  onSelect: (id: number, mouseX?: number, mouseY?: number) => void;
  selectedId: number | null;
  heatmapData?: HeatmapData[];
  showHeatmap?: boolean;
}> = ({ locations, onSelect, selectedId, heatmapData = [], showHeatmap = false }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!meshRef.current || locations.length === 0) return;

    const mesh = meshRef.current;
    
    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      tempObject.position.set(loc.x, loc.y, loc.z);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    
    if (mesh.geometry) {
      mesh.geometry.computeBoundingSphere();
    }
  }, [locations]);

  // Crea mappa heatmap per locationCode
  const heatmapMap = useMemo(() => {
    const map = new Map<string, number>();
    heatmapData.forEach(hd => map.set(hd.locationCode, hd.intensity));
    return map;
  }, [heatmapData]);

  useLayoutEffect(() => {
    if (!meshRef.current || locations.length === 0) return;
    const mesh = meshRef.current;

    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      if (loc.id === selectedId) {
        tempColor.set('#FACC15'); // Yellow - Selected
      } else if (loc.id === hoveredId) {
        tempColor.set('#60A5FA'); // Blue - Hovered
      } else if (showHeatmap) {
        // Modalità Heatmap: colora in base all'intensità
        const locCode = loc.locationCode || loc.originalString;
        const intensity = heatmapMap.get(locCode) || 0;
        if (intensity > 0) {
          tempColor.set(getHeatmapColor(intensity));
        } else {
          tempColor.set('#1f2937'); // Grigio scuro per nessuna attività
        }
      } else {
        // Modalità normale
        const hasMovOut = loc.movOut && loc.movOut > 0;
        const hasMovIn = loc.movIn && loc.movIn > 0;
        const hasStock = loc.quantity && loc.quantity > 0;

        if (hasMovOut) {
          tempColor.set('#F59E0B'); // Amber - Movement out
        } else if (hasMovIn) {
          tempColor.set('#FB923C'); // Orange - Movement in
        } else if (hasStock) {
          tempColor.set('#10B981'); // Green - Has stock
        } else {
          const isEvenAisle = loc.aisle % 2 === 0;
          const baseColor = isEvenAisle ? '#4B5563' : '#374151';
          tempColor.set(baseColor);
        }
      }
      mesh.setColorAt(i, tempColor);
    }

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [locations, selectedId, hoveredId, showHeatmap, heatmapMap]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, locations.length]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined && locations[e.instanceId]) {
          const mouseEvent = e.nativeEvent as MouseEvent;
          onSelect(locations[e.instanceId].id, mouseEvent.clientX, mouseEvent.clientY);
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined && locations[e.instanceId]) {
          setHoveredId(locations[e.instanceId].id);
        }
      }}
      onPointerOut={() => setHoveredId(null)}
    >
      <boxGeometry args={[1, 0.8, 1]} />
      <meshStandardMaterial roughness={0.5} metalness={0.8} />
    </instancedMesh>
  );
};

// Calculate warehouse center from locations
const useWarehouseCenter = (locations: LocationData[]) => {
  return useMemo(() => {
    if (locations.length === 0) return { x: 0, y: 0, z: 0 };
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const loc of locations) {
      if (loc.x < minX) minX = loc.x;
      if (loc.x > maxX) maxX = loc.x;
      if (loc.y < minY) minY = loc.y;
      if (loc.y > maxY) maxY = loc.y;
      if (loc.z < minZ) minZ = loc.z;
      if (loc.z > maxZ) maxZ = loc.z;
    }

    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2,
      maxDim: Math.max(maxX - minX, maxY - minY, maxZ - minZ)
    };
  }, [locations]);
};

const CameraController: React.FC<{ locations: LocationData[] }> = ({ locations }) => {
  const { camera, controls } = useThree();
  const initializedRef = useRef(false);
  const center = useWarehouseCenter(locations);

  useEffect(() => {
    if (locations.length === 0) return;

    // Only auto-position camera on first load, not on filter changes
    if (initializedRef.current) return;
    initializedRef.current = true;

    const controlsRef = controls as any;
    if (controlsRef) {
      controlsRef.target.set(center.x, center.y, center.z);
      const maxDim = center.maxDim || 50;
      camera.position.set(center.x + maxDim * 0.8, center.y + maxDim * 0.8, center.z + maxDim * 0.8);
      controlsRef.update();
    }
  }, [locations, camera, controls, center]);

  return null;
};

// Double-click handler to change orbit point
const OrbitTargetHandler: React.FC = () => {
  const { camera, controls, raycaster, scene } = useThree();
  const pointerVec = useMemo(() => new THREE.Vector2(), []);
  
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleDoubleClick = (e: MouseEvent) => {
      const ctrl = controls as any;
      if (!ctrl || !ctrl.target) return;

      // Update pointer position
      const rect = canvas.getBoundingClientRect();
      pointerVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(pointerVec, camera);
      
      // Find intersections with all meshes
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        
        // Animate to new target
        const startTarget = ctrl.target.clone();
        const endTarget = point.clone();
        const startTime = Date.now();
        const duration = 500;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          
          ctrl.target.lerpVectors(startTarget, endTarget, eased);
          ctrl.update();
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    };

    canvas.addEventListener('dblclick', handleDoubleClick);
    return () => canvas.removeEventListener('dblclick', handleDoubleClick);
  }, [camera, controls, raycaster, scene]);

  return null;
};

// Animated camera controller with smooth transitions
const SceneController = forwardRef<WarehouseController, {}>((_, ref) => {
  const { camera, controls } = useThree();
  
  // Animation state
  const animationRef = useRef<{
    isAnimating: boolean;
    startTime: number;
    duration: number;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
  }>({
    isAnimating: false,
    startTime: 0,
    duration: 1000,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3()
  });

  // Easing function for smooth animation
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Animation frame
  useFrame(() => {
    const anim = animationRef.current;
    if (!anim.isAnimating) return;

    const ctrl = controls as any;
    if (!ctrl) return;

    const elapsed = Date.now() - anim.startTime;
    const progress = Math.min(elapsed / anim.duration, 1);
    const easedProgress = easeInOutCubic(progress);

    // Interpolate camera position
    camera.position.lerpVectors(anim.startPos, anim.endPos, easedProgress);
    
    // Interpolate target
    ctrl.target.lerpVectors(anim.startTarget, anim.endTarget, easedProgress);
    ctrl.update();

    if (progress >= 1) {
      anim.isAnimating = false;
    }
  });

  const animateTo = useCallback((targetPos: THREE.Vector3, cameraPos: THREE.Vector3, duration: number = 800) => {
    const ctrl = controls as any;
    if (!ctrl) return;

    const anim = animationRef.current;
    anim.isAnimating = true;
    anim.startTime = Date.now();
    anim.duration = duration;
    anim.startPos.copy(camera.position);
    anim.endPos.copy(cameraPos);
    anim.startTarget.copy(ctrl.target);
    anim.endTarget.copy(targetPos);
  }, [camera, controls]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const ctrl = controls as any;
      if (!ctrl) return;
      const offset = new THREE.Vector3().subVectors(camera.position, ctrl.target);
      const currentDist = offset.length();
      const newDist = Math.max(5, Math.min(currentDist * 0.7, 5000));
      offset.setLength(newDist);
      const newPos = ctrl.target.clone().add(offset);
      animateTo(ctrl.target.clone(), newPos, 300);
    },
    zoomOut: () => {
      const ctrl = controls as any;
      if (!ctrl) return;
      const offset = new THREE.Vector3().subVectors(camera.position, ctrl.target);
      const currentDist = offset.length();
      const newDist = Math.max(5, Math.min(currentDist * 1.4, 5000));
      offset.setLength(newDist);
      const newPos = ctrl.target.clone().add(offset);
      animateTo(ctrl.target.clone(), newPos, 300);
    },
    resetView: () => {
      const ctrl = controls as any;
      if (!ctrl) return;
      const offset = new THREE.Vector3().subVectors(camera.position, ctrl.target);
      const len = offset.length();
      if (len < 10) offset.setLength(150);
      else offset.setLength(len * 1.5);
      const newPos = ctrl.target.clone().add(offset);
      animateTo(ctrl.target.clone(), newPos, 500);
    },
    focusLocation: (location: LocationData) => {
      const distance = 15;
      const angle = Math.PI / 4;

      const targetPos = new THREE.Vector3(location.x, location.y, location.z);
      const cameraPos = new THREE.Vector3(
        location.x + distance * Math.cos(angle),
        location.y + distance * 0.8,
        location.z + distance * Math.sin(angle)
      );

      animateTo(targetPos, cameraPos, 800);
    }
  }), [animateTo]);

  return null;
});

export const WarehouseScene = forwardRef<WarehouseController, WarehouseSceneProps>(({
  locations,
  onSelectLocation,
  selectedLocationId,
  heatmapData = [],
  showHeatmap = false,
  pickingPath = null,
  showPickingPath = false,
  fpsMode = false,
  showAisleLabels = true
}, ref) => {
  const dataKey = useMemo(() => `racks-${locations.length}`, [locations.length]);

  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[50, 50, 50]} fov={50} far={10000} />

      {!fpsMode ? (
        <OrbitControls
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.9}
          minDistance={1}
          maxDistance={5000}
          enableDamping
          dampingFactor={0.1}
        />
      ) : (
        <FirstPersonControls />
      )}

      <CameraController locations={locations} />
      <SceneController ref={ref} />
      {!fpsMode && <OrbitTargetHandler />}

      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[100, 200, 100]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-50, 100, -50]} intensity={0.3} />
      <pointLight position={[0, 50, 0]} intensity={0.5} color="#fff5e6" />
      <Environment preset="warehouse" />

      <Racks
        key={dataKey}
        locations={locations}
        onSelect={(id, mouseX, mouseY) => onSelectLocation(locations.find(l => l.id === id) || null, mouseX, mouseY)}
        selectedId={selectedLocationId}
        heatmapData={heatmapData}
        showHeatmap={showHeatmap}
      />

      {/* Picking Path Visualizer */}
      {showPickingPath && pickingPath && (
        <PickingPathVisualizer path={pickingPath} enabled={showPickingPath} />
      )}

      {/* Aisle Labels */}
      <AisleLabels locations={locations} visible={showAisleLabels} />

      {/* Warehouse Floor with grid pattern */}
      <WarehouseFloor width={200} depth={200} gridSize={4} />

      {/* Decorative Pallets near shipping zone */}
      <Pallet position={[3, 0, -3]} hasBoxes={true} />
      <Pallet position={[-3, 0, -4]} hasBoxes={true} boxColor="#E74C3C" />
      <Pallet position={[0, 0, -6]} hasBoxes={false} />

      {selectedLocationId !== null && (() => {
        const loc = locations.find(l => l.id === selectedLocationId);
        if (!loc) return null;
        return (
          <Html position={[loc.x, loc.y + 1.5, loc.z]} center zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
            <div className="bg-black/80 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap border border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
              {loc.originalString}
            </div>
          </Html>
        );
      })()}
    </Canvas>
  );
});

WarehouseScene.displayName = 'WarehouseScene';
