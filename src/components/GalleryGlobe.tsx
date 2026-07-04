import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLOBE_RADIUS } from '../data';
import Globe from './Globe';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Key } from 'lucide-react';

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

function SecretKey3D({ onClick }: { onClick: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle spin and float animation in 3D space
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.8;
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.08;
    }
  });

  return (
    <group 
      ref={meshRef} 
      onClick={(e) => {
        e.stopPropagation();
        const cameraZ = e.camera.position.z;
        // If camera is still outside the globe sphere wall (radius 8), ignore click
        if (cameraZ > 12) {
          return;
        }
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
      scale={hovered ? 0.35 : 0.3}
    >
      {/* 3D Key Model using standard R3F primitives */}
      {/* Head Ring */}
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.05, 8, 24]} />
        <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Key Shaft */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Key Teeth */}
      <mesh position={[0.08, -0.28, 0]}>
        <boxGeometry args={[0.1, 0.04, 0.04]} />
        <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[0.06, -0.36, 0]}>
        <boxGeometry args={[0.08, 0.04, 0.04]} />
        <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.05} />
      </mesh>
    </group>
  );
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

  // Easter Egg States
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [showPoemModal, setShowPoemModal] = useState(false);

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

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === '7981') {
      setShowKeyModal(false);
      setShowPoemModal(true);
      setPasscode('');
      setPasscodeError('');
    } else {
      setPasscodeError('Mật mã không chính xác. Vui lòng thử lại!');
    }
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
      <Canvas 
        camera={{ position: [0, 0, DEFAULT_CAMERA_Z], fov: 45, near: 0.1 }}
        style={{ width: '378px', height: '392px', marginLeft: '1px', marginTop: '-70px' }}
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
            {/* Secret 3D Key at the center of the globe */}
            <SecretKey3D onClick={() => setShowKeyModal(true)} />
          </group>
        </Suspense>
      </Canvas>

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

      {/* Passcode Prompt Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-amber-500/20 w-full max-w-[320px] rounded-3xl p-6 shadow-2xl relative">
            <h4 className="text-amber-500 text-sm font-black uppercase tracking-widest text-center mb-3">
              Mật Mã Bảo Mật
            </h4>
            <p className="text-[11px] text-gray-400 text-center mb-4 leading-relaxed">
              Vui lòng nhập mật mã gồm 4 chữ số để giải mã thông điệp ẩn giấu. <br />
              <span className="text-[9px] text-amber-500/60 font-bold">(Gợi ý: 7981)</span>
            </p>
            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <input 
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value.replace(/[^0-9]/g, ''));
                  setPasscodeError('');
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-3 text-center text-2xl font-mono font-bold text-yellow-400 focus:outline-none focus:border-amber-500 tracking-[0.5em] pl-[0.5em]"
                placeholder="••••"
              />
              {passcodeError && (
                <p className="text-[10px] text-red-500 font-bold text-center">{passcodeError}</p>
              )}
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => { setShowKeyModal(false); setPasscode(''); setPasscodeError(''); }}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs rounded-xl transition-all"
                >
                  HỦY
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all"
                >
                  XÁC NHẬN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Poem Display Modal */}
      {showPoemModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white border border-gray-100 w-full max-w-[360px] rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] text-amber-600 font-black uppercase tracking-widest">
                Thông Điệp Tình Yêu
              </span>
              <button 
                onClick={() => setShowPoemModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all"
              >
                ✕
              </button>
            </div>
            <div 
              className="text-neutral-800 leading-relaxed text-sm md:text-[14.5px] italic text-center whitespace-pre-line border-y border-amber-100 py-6 my-4"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              {`Đem Hà Nội chở mùa qua ngõ vắng
Gió bấc về cào rách vết thương xưa
Phương Nam ấy nắng tràn lên mắt đắng
Em có còn chờ những chuyến mưa thưa?

Hai nửa đời hai đầu dài mệt mỏi
Toan tính nhiều đâu dám ngỏ lời yêu
Cái tuổi này nhớ nhung đầy gai góc
Nuốt nghẹn lòng trong mỗi bóng hoàng hôn.

Ta cách nhau cả chiều dài đất nước
Cứ lặng im như sỏi đá chai sần
Mà bão nổi phía bên trong lồng ngực
Nhớ một người... đau thấu đến tận xương.

`}
              <span className="block font-bold not-italic text-sm text-amber-700 mt-4 tracking-wider">
                Chiến yêu Hương
              </span>
            </div>
            <button 
              onClick={() => setShowPoemModal(false)}
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl tracking-widest transition-all"
            >
              ĐÓNG CỬA SỔ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
