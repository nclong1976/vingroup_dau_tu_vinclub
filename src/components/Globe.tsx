import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateFibonacciSphere } from '../utils/math';
import { GLOBE_RADIUS, TOTAL_CARDS } from '../data';
import Card from './Card';

interface GlobeProps {
  userPhoto: string;
  projects?: any[];
  lockVerticalMotion?: boolean;
  rotationState: React.MutableRefObject<{ x: number, y: number }>;
  velocityState: React.MutableRefObject<{ x: number, y: number }>;
  isDragging: React.MutableRefObject<boolean>;
  lastInteraction: React.MutableRefObject<number>;
  onSelect: (image: string, location: string, info: string, project?: any) => void;
  onHover?: (info: string) => void;
  onHoverOut?: () => void;
}

export default function Globe({ userPhoto, projects = [], lockVerticalMotion = true, rotationState, velocityState, isDragging, lastInteraction, onSelect, onHover, onHoverOut }: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Precalculate the spherical grid positions and apply random scales based on projects count
  const cardData = useMemo(() => {
    const count = projects.length > 0 ? projects.length : 12;
    const rawPositions = generateFibonacciSphere(count, GLOBE_RADIUS);
    return rawPositions.map((pos) => ({
      position: pos,
      scale: 0.85
    }));
  }, [projects.length]);

  useFrame(() => {
    if (!groupRef.current) return;
    
    // Continuously apply velocity to rotation
    rotationState.current.y += velocityState.current.y;

    if (lockVerticalMotion) {
      rotationState.current.x = 0;
      velocityState.current.x = 0;
    } else {
      rotationState.current.x += velocityState.current.x;
      // Clamp vertical rotation so the sphere doesn't flip upside down (limit to +/- 60 degrees)
      rotationState.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotationState.current.x));
    }

    if (!isDragging.current) {
      // Apply momentum decay (friction/damping)
      velocityState.current.y *= 0.92;
      if (!lockVerticalMotion) {
        velocityState.current.x *= 0.92;
      }

      // Ambient Idle Rotation
      if (Date.now() - lastInteraction.current > 2000) {
        // Gently inject velocity for gradual smooth spinning
        // This yields a steady state velocity of roughly 0.002 radians/frame
        velocityState.current.y += 0.00015; 
      }
    } else {
      // While grabbed and dragging, velocity decays sharply unless actively fueled by delta pointer moves
      velocityState.current.y *= 0.3;
      if (!lockVerticalMotion) {
        velocityState.current.x *= 0.3;
      }
    }

    groupRef.current.rotation.x = rotationState.current.x;
    groupRef.current.rotation.y = rotationState.current.y;
  });

  return (
    <group ref={groupRef}>
      {cardData.map((data, i) => {
        const project = i < projects.length ? projects[i] : undefined;
        const position = data.position;
        const scale = data.scale;

        return (
          <Card 
            key={project?.id || i} 
            index={i} 
            position={position} 
            scale={scale} 
            userPhoto={userPhoto} 
            project={project}
            onSelect={(img, loc, info, proj) => {
              if (!isDragging.current) {
                onSelect(img, loc, info, proj);
              }
            }}
            onHover={onHover}
            onHoverOut={onHoverOut}
          />
        );
      })}
    </group>
  );
}
