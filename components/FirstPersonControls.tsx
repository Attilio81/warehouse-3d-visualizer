import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FirstPersonControlsProps {
  baseSpeed?: number;
  sprintMultiplier?: number;
}

export const FirstPersonControls: React.FC<FirstPersonControlsProps> = ({ 
  baseSpeed = 0.5,
  sprintMultiplier = 2.5 
}) => {
  const { camera, gl } = useThree();
  const lookSpeed = 0.002;
  
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
  });

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isPointerLocked = useRef(false);

  useEffect(() => {
    euler.current.setFromQuaternion(camera.quaternion);

    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC to exit pointer lock
      if (event.code === 'Escape' && isPointerLocked.current) {
        document.exitPointerLock();
        return;
      }

      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveState.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          moveState.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          moveState.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          moveState.current.right = true;
          break;
        case 'Space':
          moveState.current.up = true;
          event.preventDefault();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          moveState.current.down = true;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          moveState.current.sprint = true;
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveState.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          moveState.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          moveState.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          moveState.current.right = false;
          break;
        case 'Space':
          moveState.current.up = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          moveState.current.down = false;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          moveState.current.sprint = false;
          break;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked.current) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      euler.current.y -= movementX * lookSpeed;
      euler.current.x -= movementY * lookSpeed;

      // Limit vertical look
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x));

      camera.quaternion.setFromEuler(euler.current);
    };

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === gl.domElement;
    };

    const handleClick = () => {
      if (!isPointerLocked.current) {
        gl.domElement.requestPointerLock();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    gl.domElement.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    // Use actual delta time for frame-rate independent movement
    const dt = Math.min(delta, 0.1); // Cap delta to avoid huge jumps
    
    // Calculate current speed (with sprint multiplier)
    const currentSpeed = moveState.current.sprint ? baseSpeed * sprintMultiplier : baseSpeed;
    
    // Apply damping
    velocity.current.x -= velocity.current.x * 10.0 * dt;
    velocity.current.y -= velocity.current.y * 10.0 * dt;
    velocity.current.z -= velocity.current.z * 10.0 * dt;

    direction.current.z = Number(moveState.current.forward) - Number(moveState.current.backward);
    direction.current.x = Number(moveState.current.right) - Number(moveState.current.left);
    direction.current.y = Number(moveState.current.up) - Number(moveState.current.down);
    direction.current.normalize();

    if (moveState.current.forward || moveState.current.backward) {
      velocity.current.z -= direction.current.z * currentSpeed;
    }
    if (moveState.current.left || moveState.current.right) {
      velocity.current.x -= direction.current.x * currentSpeed;
    }
    if (moveState.current.up || moveState.current.down) {
      velocity.current.y += direction.current.y * currentSpeed;
    }

    const moveVector = new THREE.Vector3();
    moveVector.setFromMatrixColumn(camera.matrix, 0);
    moveVector.crossVectors(camera.up, moveVector);
    
    camera.position.addScaledVector(moveVector, -velocity.current.z);
    camera.position.addScaledVector(
      new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0),
      -velocity.current.x
    );
    camera.position.y += velocity.current.y;

    // Keep camera above ground
    if (camera.position.y < 2) {
      camera.position.y = 2;
      velocity.current.y = 0;
    }
  });

  return null;
};
