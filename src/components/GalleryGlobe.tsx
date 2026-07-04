import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLOBE_RADIUS } from '../data';
import Globe from './Globe';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Key } from 'lucide-react';

const CanvasAny = Canvas as any;

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const DEFAULT_CAMERA_Z = isMobile ? 36.0 : 19.8;

function CameraController({ targetZ }: { targetZ: React.MutableRefObject<number> }) {
  useFrame((state) => {
    // Smooth camera Z penetration
    state.camera.position.z = THREE.MathUtils.lerp(
      state.camera.position.z, 
      targetZ.current, 
      0.05
    );
  });
  return null;
}

export default function GalleryGlobe({ 
  userPhoto, 
  projects: propProjects = [],
  lockVerticalMotion = true,
  onSelect,
  selectedCard
}: { 
  userPhoto: string | null; 
  projects?: any[];
  lockVerticalMotion?: boolean;
  onSelect: (image: string, location: string, info: string, project?: any) => void;
  selectedCard: any;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [liveProjects, setLiveProjects] = useState<any[]>([]);


  // 1. Listen to active projects real-time from Firestore
  useEffect(() => {
    const q = query(collection(db, 'projects'), where('status', '==', 'active'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          name: data.name || 'Dự án VinClub',
          imageUrl: data.imageUrl || '',
          roi: data.roi || data.interestRate || 'Liên hệ',
          status: data.status || 'active',
          lat: typeof data.lat === 'number' ? data.lat : undefined,
          lng: typeof data.lng === 'number' ? data.lng : undefined,
          ...data
        });
      });
      setLiveProjects(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, []);

  // Interaction State Maps
  const targetZ = useRef(DEFAULT_CAMERA_Z);
  const rotationState = useRef({ x: 0, y: 0 });
  const velocityState = useRef({ x: 0, y: 0.002 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastInteractionTime = useRef(Date.now() - 3000);
  const pointerPos = useRef({ x: 0, y: 0 });

  // Smooth camera zoom based on selectedCard state
  useEffect(() => {
    if (selectedCard) {
      targetZ.current = GLOBE_RADIUS + 2.2; // Zoom extremely close to show details
    } else {
      targetZ.current = DEFAULT_CAMERA_Z; // Zoom back out
    }
  }, [selectedCard]);

  // Cursor UI state
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [tooltipInfo, setTooltipInfo] = useState<{ name: string; roi: string } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const getProjectROI = (projectName: string): string => {
    if (projectName.includes("Vinhomes")) {
      return "15 - 18% / năm";
    } else if (projectName.includes("VinFast")) {
      return "10 - 12% / năm (Bonds)";
    } else if (projectName.includes("Vinpearl") || projectName.includes("Oasis") || projectName.includes("Wonders") || projectName.includes("Safari")) {
      return "12 - 15% / năm (Equity)";
    } else if (projectName.includes("Vincom")) {
      return "11 - 13% / năm";
    } else if (projectName.includes("VinAI") || projectName.includes("BigData") || projectName.includes("CSS") || projectName.includes("HMS") || projectName.includes("Tech") || projectName.includes("Ventures")) {
      return "18 - 25% / năm (Venture)";
    } else {
      return "9 - 11% / năm";
    }
  };

  const parseTooltip = (info: string) => {
    const lines = info.split('\n');
    if (lines.length > 0) {
      let firstLine = lines[0].trim();
      if (firstLine.startsWith('#')) {
        firstLine = firstLine.substring(1).trim();
      }
      
      const matchedProj = liveProjects.find(p => p.name === firstLine);
      const roi = matchedProj?.roi || matchedProj?.interestRate || getProjectROI(firstLine);

      return {
        name: firstLine,
        roi: roi
      };
    }
    return null;
  };

  useEffect(() => {
    // Non-passive wheel event to capture pinch & scroll reliably outside React rendering
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      lastInteractionTime.current = Date.now();
      
      const delta = e.deltaY;
      
      // Scaling down zoom interaction slightly and applying
      targetZ.current += delta * 0.015;
      
      // Clamp values so user can't zoom out infinitely.
      // -GLOBE_RADIUS lets us see the inside-out opposite end of the sphere walls securely
      targetZ.current = Math.max(-GLOBE_RADIUS * 0.8, Math.min(isMobile ? 45 : 28, targetZ.current));
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    setIsMouseDown(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
    lastInteractionTime.current = Date.now();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    pointerPos.current = { x: e.clientX, y: e.clientY };
    if (tooltipRef.current) {
      tooltipRef.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 16}px)`;
    }

    if (!isDragging.current) return;
    
    const deltaX = e.clientX - lastMouse.current.x;
    const deltaY = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    
    // Map screen cartesian coordinates to rotation
    velocityState.current.y += deltaX * 0.005;
    
    if (!lockVerticalMotion) {
      velocityState.current.x += deltaY * 0.005;
    } else {
      velocityState.current.x = 0;
    }
    
    lastInteractionTime.current = Date.now();
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    setIsMouseDown(false);
    lastInteractionTime.current = Date.now();
  };


  return (
    <div 
      ref={containerRef}
      className={`w-full h-full relative ${isMouseDown ? 'cursor-grabbing' : 'cursor-grab'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Background stays pure white */}
      <CanvasAny 
        camera={{ position: [0, 0, DEFAULT_CAMERA_Z], fov: 45, near: 0.1 }}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController targetZ={targetZ} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 15, 10]} intensity={1.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 0, 15]} intensity={1.2} />
        <Suspense fallback={null}>
          <group position={[0, isMobile ? -3.5 : 0, 0]}>
            <Globe 
              userPhoto={userPhoto}
              projects={liveProjects}
              lockVerticalMotion={lockVerticalMotion}
              rotationState={rotationState}
              velocityState={velocityState}
              isDragging={isDragging}
              lastInteraction={lastInteractionTime}
              onSelect={onSelect}
              onHover={(info) => setTooltipInfo(parseTooltip(info))}
              onHoverOut={() => setTooltipInfo(null)}
            />

          </group>
        </Suspense>
      </CanvasAny>

      {/* Tooltip Overlay */}
      {tooltipInfo && (
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed top-0 left-0 z-50 glassmorphism bg-neutral-950/90 text-stone-200 px-4.5 py-3 font-sans text-xs shadow-[0_8px_32px_rgba(212,175,55,0.15)] flex flex-col gap-1 rounded-2xl min-w-[220px]"
          style={{ 
            willChange: 'transform',
            transform: `translate(${pointerPos.current.x + 16}px, ${pointerPos.current.y + 16}px)`
          }}
        >
          <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest font-mono">Dự Án VinClub</span>
          <span className="text-[13px] text-white font-extrabold tracking-tight font-display leading-tight">{tooltipInfo.name}</span>
          <div className="flex items-center gap-1.5 mt-1.5 border-t border-amber-500/15 pt-1.5">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Kỳ vọng ROI:</span>
            <span className="text-[11px] text-yellow-400 font-black font-sans">{tooltipInfo.roi}</span>
          </div>
        </div>
      )}

      {/* Fallback spinner if loading or no live active projects */}
      {liveProjects.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
