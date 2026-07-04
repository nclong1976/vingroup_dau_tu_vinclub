import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Search, Calendar, Bookmark, Eye, ArrowUpRight, Filter } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';

interface NewsItem {
  id?: string;
  title: string;
  date: string;
  img: string;
  tag: string;
  isFeatured?: boolean;
  content?: string;
  views?: number;
}

interface AllNewsPageProps {
  news: NewsItem[];
  onBack: () => void;
  onNewsClick: (news: NewsItem) => void;
}

export default function AllNewsPage({ news, onBack, onNewsClick }: AllNewsPageProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique categories
  const categories = ['Tất cả', ...Array.from(new Set(news.map(n => n.tag)))];

  const filteredNews = news.filter(n => {
    const matchCategory = activeCategory === 'Tất cả' || n.tag === activeCategory;
    const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-50 bg-[#121212] flex flex-col h-full w-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col pt-12 pb-4 px-4 bg-black/80 backdrop-blur-xl border-b border-white/5 shrink-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-lg font-black text-white tracking-widest uppercase">Tin tức & Sự kiện</h2>
          <div className="w-10 h-10" /> {/* spacer */}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-white/40" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm tin tức..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* Categories Tabs */}
        <div className="flex overflow-x-auto gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                activeCategory === category 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="popLayout">
          {filteredNews.length > 0 ? (
            <div className="space-y-4">
              {filteredNews.map((item, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={item.id || idx}
                  onClick={() => onNewsClick(item)}
                  className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden cursor-pointer group hover:bg-white/[0.04] transition-colors"
                >
                  <div className="h-40 w-full relative overflow-hidden">
                    <ProgressiveImage 
                      src={item.img} 
                      alt={item.title} 
                      className="w-full h-full" 
                      imgClassName="object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      {item.isFeatured && (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black uppercase tracking-widest rounded shadow-md">
                          Nổi bật
                        </span>
                      )}
                      <span className="text-[9px] font-bold text-white uppercase tracking-widest bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                        {item.tag}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 pt-2">
                    <h3 className="text-sm font-bold text-white/90 leading-snug mb-3 group-hover:text-amber-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.date}
                        </div>
                        {item.views !== undefined && (
                          <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono">
                            <Eye className="w-3.5 h-3.5" />
                            {item.views}
                          </div>
                        )}
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-amber-500 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center h-40 text-white/40"
            >
              <Filter className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-sm">Không tìm thấy tin tức nào</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
