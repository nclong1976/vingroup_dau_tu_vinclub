import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { Edit, Lock, Unlock, Trash2, ImageIcon, Sparkles, RotateCcw } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  category?: string;
  customId?: string;
  interestRate?: string;
  duration?: string;
  minInvestment?: string;
  scale?: string;
  progress?: number;
  status: string;
  imageUrl?: string;
}

interface ProjectStackedDeckProps {
  projects: Project[];
  onEdit: (p: Project) => void;
  onToggleStatus: (p: Project) => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
}

export default function ProjectStackedDeck({ projects, onEdit, onToggleStatus, onDelete, isOpen }: ProjectStackedDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const x = useMotionValue(0);

  // Animate based on isOpen
  useEffect(() => {
    animate(x, isOpen ? 250 : 0, { type: 'spring', stiffness: 300, damping: 30 });
  }, [isOpen, x]);

  // Reset x when activeIndex changes to keep the deck centered
  useEffect(() => {
    if (!isOpen) {
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  }, [activeIndex, x, isOpen]);
  
  // Transform horizontal drag into a "fan out" factor (0 to 1)
  // When x is between -200 and 200, we consider it "fanning"
  const fanFactor = useTransform(x, [-250, 0, 250], [1, 0, 1]);

  if (projects.length === 0) return null;

  // We rotate through the projects starting from activeIndex
  const displayProjects = [...projects.slice(activeIndex), ...projects.slice(0, activeIndex)];

  return (
    <div className="relative w-full h-[650px] flex items-center justify-center perspective-2000 overflow-hidden rounded-3xl bg-[#050505] touch-none">
      {/* Background Atmosphere - Marble texture feel */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000 100%), url("https://www.transparenttextures.com/patterns/dark-matter.png")',
             backgroundBlendMode: 'overlay'
           }} 
      />
      
      {/* Dynamic Lighting */}
      <motion.div 
        style={{ x: useTransform(x, [-200, 200], [50, -50]) }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none blur-[100px]" 
      />

      {/* Manual Reset Button (only shows when fanned) */}
      <motion.button
        style={{ opacity: useTransform(x, [-50, 0, 50], [1, 0, 1]) }}
        onClick={() => animate(x, 0, { type: 'spring', stiffness: 200, damping: 20 })}
        className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest backdrop-blur-md"
      >
        <RotateCcw className="w-3 h-3" />
        Thu gọn bộ thẻ
      </motion.button>
      
      <div className="relative w-[340px] h-[500px] z-10">
        <AnimatePresence mode="popLayout">
          {displayProjects.map((p, i) => {
            const isTop = i === 0;
            
            return (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                isTop={isTop}
                fanFactor={fanFactor}
                x={x}
                onEdit={() => onEdit(p)}
                onToggleStatus={() => onToggleStatus(p)}
                onDelete={() => onDelete(p.id)}
                onActivate={() => {
                  // If fanned out, clicking another card should bring it to top
                  if (Math.abs(x.get()) >= 20) {
                    setActiveIndex((activeIndex + i) % projects.length);
                    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
                  }
                }}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Hint */}
      <div className="absolute bottom-10 flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
          {projects.map((_, i) => (
            <div 
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-6 bg-[#e1b777]' : 'w-2 bg-neutral-800'}`}
            />
          ))}
        </div>
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] animate-pulse">
          Vuốt sang ngang để xòe bài • Chạm để chọn
        </p>
      </div>
    </div>
  );
}

function ProjectCard({ 
  project, 
  index, 
  isTop, 
  fanFactor, 
  x, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  onActivate
}: { 
  project: Project; 
  index: number; 
  isTop: boolean;
  fanFactor: any;
  x?: any;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onActivate: () => void;
}) {
  // Logic for fanning out
  // Index 0: Center (or dragged position)
  // Index 1: Rotated right
  // Index 2: Rotated left
  // Index 3: Rotated further right...
  
  const rotationBase = index === 0 ? 0 : index % 2 === 1 ? 12 * ((index + 1) / 2) : -12 * (index / 2);
  const xOffsetBase = index === 0 ? 0 : index % 2 === 1 ? 130 * ((index + 1) / 2) : -130 * (index / 2);

  const rotate = useTransform(fanFactor, [0, 1], [0, rotationBase]);
  const xOffset = useTransform(fanFactor, [0, 1], [0, xOffsetBase]);
  const topRotate = useTransform(x, [-400, 400], [-10, 10]);
  
  const z = -index * 30;
  const opacity = 1 - index * 0.12;
  const scale = 1 - index * 0.04;

  return (
    <motion.div
      style={{
        zIndex: 100 - index,
        x: isTop ? x : xOffset,
        rotate: isTop ? topRotate : rotate,
        z,
        scale,
        opacity: opacity > 0 ? opacity : 0,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: -400, right: 400 }}
      dragElastic={0.1}
      dragTransition={{ power: 0.2, timeConstant: 200 }}
      onDragEnd={(_, info) => {
        // Removed automatic collapse on drag end
      }}
      onClick={(e) => {
        onActivate();
      }}
      className={`bg-[#121215] border-[1.5px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing flex flex-col group transition-colors ${isTop ? 'border-[#e1b777]' : 'border-neutral-800 hover:border-[#e1b777]/40'}`}
    >
      {/* Image banner */}
      <div className="relative h-44 bg-neutral-900 overflow-hidden shrink-0 pointer-events-none">
        {project.imageUrl ? (
          <img 
            src={project.imageUrl} 
            alt={project.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 text-[10px] gap-1">
            <ImageIcon className="w-6 h-6 opacity-40" />
            <span>Chưa cập nhật ảnh</span>
          </div>
        )}
        
        {/* Category Badge - Glassmorphism */}
        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/10 text-white font-bold text-[9px] tracking-widest px-3 py-1 rounded uppercase">
          {project.category || 'DỰ ÁN'}
        </div>

        {/* Status Badge */}
        <div className={`absolute top-4 right-4 px-2.5 py-1 rounded text-[9px] font-black tracking-widest uppercase shadow-lg ${
          project.status === 'active' 
            ? 'bg-emerald-500 text-white' 
            : 'bg-rose-500 text-white'
        }`}>
          {project.status === 'active' ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col pointer-events-none bg-gradient-to-b from-[#121215] to-[#0a0a0c]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-neutral-500 font-mono font-bold tracking-widest">
            MÃ ID: {project.customId || 'N/A'}
          </span>
          {isTop && <Sparkles className="w-4 h-4 text-[#e1b777] animate-pulse" />}
        </div>

        <h3 className="text-[17px] font-bold text-white tracking-tight leading-tight mb-5 line-clamp-1">
          {project.name}
        </h3>

        {/* 3-Column Metrics - Premium Dark Theme */}
        <div className="grid grid-cols-3 gap-0.5 bg-white/5 p-4 rounded-xl border border-white/5 mb-6 shadow-inner">
          <div className="text-center">
            <span className="text-[13px] font-black text-[#e1b777] font-mono block">
              {project.interestRate}
            </span>
            <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest mt-1 block">
              LÃI SUẤT
            </span>
          </div>
          <div className="text-center border-x border-white/5 px-1">
            <span className="text-[13px] font-black text-[#e1b777] font-mono block">
              {project.duration?.split(' ')[0]}
            </span>
            <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest mt-1 block">
              THỜI HẠN
            </span>
          </div>
          <div className="text-center">
            <span className="text-[13px] font-black text-[#e1b777] font-mono block truncate">
              {project.minInvestment?.split('.')[0]}
            </span>
            <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest mt-1 block">
              TỐI THIỂU
            </span>
          </div>
        </div>

        {/* Progress & Scale */}
        <div className="space-y-2 mb-6 mt-auto">
          <div className="flex justify-between items-baseline text-[10px]">
            <span className="text-neutral-500 font-bold uppercase tracking-widest">Quy mô vốn:</span>
            <span className="text-white font-bold font-mono text-xs">{project.scale}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 bg-black/50 border border-white/5 rounded-full flex-1 overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${project.progress || 0}%` }}
                className="bg-gradient-to-r from-amber-700 via-[#e1b777] to-amber-400 h-full rounded-full" 
              />
            </div>
            <span className="text-[#e1b777] font-black font-mono text-[11px] min-w-[32px]">
              {project.progress || 0}%
            </span>
          </div>
        </div>

        {/* Action buttons (only interactive on top card) */}
        {isTop && (
          <div className="flex items-center gap-2 pt-4 border-t border-white/5 shrink-0 pointer-events-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex-1 py-1.5 bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:text-white"
            >
              <Edit className="w-3 h-3 text-neutral-400" />
              <span>Sửa</span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
              className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                project.status === 'active'
                  ? 'bg-amber-950/10 border-amber-500/20 text-amber-500 hover:bg-amber-950/20'
                  : 'bg-emerald-950/15 border-emerald-500/20 text-emerald-500 hover:bg-emerald-950/30'
              }`}
            >
              {project.status === 'active' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{project.status === 'active' ? 'Đóng' : 'Mở'}</span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 border border-rose-500/10 bg-rose-950/5 hover:bg-rose-950/20 text-rose-500 hover:border-rose-500/35 rounded-lg transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
