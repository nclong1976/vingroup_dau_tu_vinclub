import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Search, TrendingUp, Filter, Target } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';

interface ProjectItem {
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
  description?: string;
}

interface AllProjectsPageProps {
  projects: ProjectItem[];
  onBack: () => void;
  onSelectProject: (proj: ProjectItem) => void;
}

export default function AllProjectsPage({ projects, onBack, onSelectProject }: AllProjectsPageProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique categories, filtering out undefined
  const categories = ['Tất cả', ...Array.from(new Set(projects.map(p => p.category).filter(Boolean) as string[]))];

  const filteredProjects = projects.filter(p => {
    if (p.status !== 'active') return false; // Chỉ hiển thị các dự án đang hoạt động
    const matchCategory = activeCategory === 'Tất cả' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.customId && p.customId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-50 bg-[#09090b] flex flex-col h-full w-full overflow-hidden font-sans"
    >
      {/* Header */}
      <div className="flex flex-col pt-12 pb-4 px-4 bg-[#0a0a0c]/90 backdrop-blur-2xl border-b border-white/5 shrink-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-[#dcc2a6]" />
          </button>
          <h2 className="text-sm md:text-base font-bold text-white tracking-[0.2em] uppercase font-serif">Hạng Mục Đầu Tư</h2>
          <div className="w-10 h-10" /> {/* spacer */}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-amber-500/60" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm dự án, mã ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121215]/80 border border-[#e1b777]/25 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#e1b777] transition-all"
          />
        </div>

        {/* Categories Tabs */}
        <div className="flex overflow-x-auto gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeCategory === category 
                  ? 'bg-gradient-to-b from-[#d4af37] to-[#aa7c11] text-white shadow-lg shadow-amber-500/10' 
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-transparent">
        <AnimatePresence mode="popLayout">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
              {filteredProjects.map((proj, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  key={proj.id || idx}
                  className="bg-[#121215]/80 border border-[#e1b777]/15 rounded-3xl overflow-hidden shadow-xl"
                >
                  {/* Card Banner */}
                  <div className="h-36 w-full relative overflow-hidden bg-neutral-900">
                    {proj.imageUrl ? (
                      <ProgressiveImage 
                        src={proj.imageUrl} 
                        alt={proj.name} 
                        className="w-full h-full" 
                        imgClassName="object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1c1c22] flex items-center justify-center">
                        <Target className="w-8 h-8 text-neutral-600 animate-pulse" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                        {proj.category || "Hạng mục"}
                      </span>
                    </div>
                    {proj.customId && (
                      <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-mono text-neutral-300 font-bold border border-white/5">
                        ID: {proj.customId}
                      </div>
                    )}
                  </div>
                  
                  {/* Card Info */}
                  <div className="p-5 flex flex-col gap-3.5">
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">
                      {proj.name}
                    </h3>
                    
                    {/* 3-Column Metrics */}
                    <div className="grid grid-cols-3 gap-0.5 bg-white/5 p-3 rounded-xl border border-white/5 text-center shadow-inner">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-amber-500 font-black text-[12px] font-mono">
                          {proj.interestRate || "1.50 %"}
                        </span>
                        <span className="text-neutral-500 text-[8px] font-bold uppercase tracking-wider">Lãi suất</span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-x border-white/5">
                        <span className="text-amber-500 font-black text-[12px] font-mono">
                          {proj.duration || "7200 phút"}
                        </span>
                        <span className="text-neutral-500 text-[8px] font-bold uppercase tracking-wider">Thời hạn</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-amber-500 font-black text-[12px] font-mono truncate px-0.5" title={proj.minInvestment}>
                          {proj.minInvestment || "5.000.000 đ"}
                        </span>
                        <span className="text-neutral-500 text-[8px] font-bold uppercase tracking-wider">Tối thiểu</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-neutral-400 font-semibold uppercase tracking-wider">Quy mô quỹ đầu tư:</span>
                      <span className="text-white font-black font-mono text-xs">{proj.scale || "10.000.000.000 đ"}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-bold">
                        <span className="text-neutral-500 uppercase tracking-wider">Tiến độ gói góp vốn:</span>
                        <span className="text-amber-500 font-mono">{proj.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-black/60 border border-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-700 via-[#e1b777] to-amber-500 rounded-full" style={{ width: `${proj.progress || 0}%` }} />
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => onSelectProject(proj)}
                      className="w-full mt-1.5 py-2.5 bg-gradient-to-b from-[#d4af37] to-[#aa7c11] hover:from-[#e1b777] hover:to-[#c69a3f] active:scale-[0.98] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Tham gia đầu tư
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center h-48 text-neutral-500"
            >
              <Filter className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-xs">Không tìm thấy hạng mục nào hoạt động</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
