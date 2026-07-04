import ProgressiveImage from './ProgressiveImage';
import { motion } from 'motion/react';
import { ChevronRight, Calendar, Bookmark, ArrowUpRight, TrendingUp } from 'lucide-react';

interface NewsItem {
  id?: string;
  title: string;
  date: string;
  img: string;
  tag: string;
  isFeatured?: boolean;
}

interface NewsSectionProps {
  news: NewsItem[];
  onViewAll?: () => void;
  onNewsClick?: (news: NewsItem) => void;
}

export default function NewsSection({ news, onViewAll, onNewsClick }: NewsSectionProps) {
  const featuredNews = news.filter(n => n.isFeatured).slice(0, 5);
  const regularNews = news.filter(n => !n.isFeatured);

  // If no featured news, take the first 2 as featured
  const displayFeatured = featuredNews.length > 0 ? featuredNews : news.slice(0, 2);
  // Exclude featured news from regular news if they were artificially promoted
  const displayRegular = featuredNews.length > 0 ? regularNews.slice(0, 3) : news.slice(2, 5);

  if (news.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 border border-white/5 rounded-3xl bg-white/[0.02]">
        <div className="text-white/40 mb-2">Không có tin tức nào</div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Featured Section */}
      {displayFeatured.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between px-4 mb-5">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h3 className="text-lg font-black text-white tracking-tight uppercase">Sự kiện nổi bật</h3>
              </div>
              <div className="h-0.5 w-16 bg-gradient-to-r from-amber-500 to-transparent" />
            </div>
            <button 
              onClick={onViewAll}
              className="flex items-center gap-1 text-[10px] font-bold text-amber-500/70 hover:text-amber-400 tracking-widest uppercase transition-colors group"
            >
              Khám phá <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="flex overflow-x-auto gap-4 px-4 pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
            {displayFeatured.map((item, idx) => (
              <motion.div
                key={`featured-${idx}`}
                onClick={() => onNewsClick?.(item)}
                whileTap={{ scale: 0.98 }}
                className="min-w-[280px] w-[280px] h-[340px] relative rounded-3xl overflow-hidden snap-start shrink-0 group border border-white/10 shadow-lg cursor-pointer"
              >
                <div className="absolute inset-0 z-0 bg-neutral-900">
                  <ProgressiveImage src={item.img} alt={item.title} className="w-full h-full" imgClassName="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
                </div>

                <div className="absolute inset-0 z-10 p-5 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black uppercase tracking-widest rounded shadow-md">
                      Nổi bật
                    </span>
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest bg-black/50 backdrop-blur-md px-2 py-0.5 rounded border border-white/5">
                      {item.tag}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white leading-snug mb-3 group-hover:text-amber-300 transition-colors drop-shadow-md">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-medium">
                      <Calendar className="w-3 h-3" />
                      <span>{item.date}</span>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:bg-amber-500/20 group-hover:border-amber-500/50 transition-all">
                      <ArrowUpRight className="w-3.5 h-3.5 text-white group-hover:text-amber-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Regular News Section */}
      {displayRegular.length > 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-white tracking-tight uppercase">Tin tức mới nhất</h3>
              <div className="h-0.5 w-12 bg-gradient-to-r from-amber-500 to-transparent mt-1" />
            </div>
            <button 
              onClick={onViewAll}
              className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-white tracking-widest uppercase transition-colors group"
            >
              Tất cả <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="space-y-3">
            {displayRegular.map((item, idx) => (
              <motion.div
                key={`regular-${idx}`}
                onClick={() => onNewsClick?.(item)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileTap={{ scale: 0.98 }}
                className="flex gap-4 p-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-2xl backdrop-blur-xl transition-all cursor-pointer group shadow-sm"
              >
                <div className="w-[100px] h-[90px] rounded-xl overflow-hidden shrink-0 relative bg-neutral-900 shadow-inner">
                  <ProgressiveImage src={item.img} alt={item.title} className="w-full h-full" imgClassName="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/30 to-transparent" />
                </div>
                
                <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black text-amber-500/90 uppercase tracking-wider truncate mr-2">
                        {item.tag}
                      </span>
                      <Bookmark className="w-3 h-3 text-white/20 group-hover:text-amber-500/60 transition-colors shrink-0" />
                    </div>
                    <h4 className="text-[13px] font-semibold text-white/90 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono mt-2">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    {item.date}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
