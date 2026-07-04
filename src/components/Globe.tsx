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
  
  // Precalculate the spherical grid positions and apply random scales
  const cardData = useMemo(() => {
    const rawPositions = generateFibonacciSphere(TOTAL_CARDS, GLOBE_RADIUS);
    return rawPositions.map((pos) => ({
      position: pos,
      // Random scale between 0.6x and 1.3x to make size uneven but keeping orientation
      scale: 0.6 + Math.random() * 0.7 
    }));
  }, []);

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
        
        let position = data.position;
        let scale = data.scale;
        
        // Convert geographical coordinates (lat, lng) to Vector3 on 3D sphere if explicitly specified by Admin
        if (project && typeof project.lat === 'number' && typeof project.lng === 'number') {
          const lat = project.lat;
          const lng = project.lng;
          
          const phi = (90 - lat) * (Math.PI / 180);
          const theta = (lng + 180) * (Math.PI / 180);

          const x = -(GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta));
          const y = GLOBE_RADIUS * Math.cos(phi);
          const z = GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
          
          position = new THREE.Vector3(x, y, z);
        }

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
