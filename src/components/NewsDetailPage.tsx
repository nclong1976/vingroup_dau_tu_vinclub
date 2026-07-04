import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Share2, Bookmark, Calendar, Eye } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

interface NewsItem {
  id?: string;
  title: string;
  date: string;
  img: string;
  tag: string;
  content?: string;
  views?: number;
}

interface NewsDetailPageProps {
  news: NewsItem;
  onBack: () => void;
}

export default function NewsDetailPage({ news, onBack }: NewsDetailPageProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [views, setViews] = useState(news.views || Math.floor(Math.random() * 1000) + 100);

  useEffect(() => {
    // Increment views locally and in the database
    const timer = setTimeout(async () => {
      setViews(prev => prev + 1);
      if (news.id) {
        try {
          const newsRef = doc(db, 'news', news.id);
          await updateDoc(newsRef, {
            views: increment(1)
          });
        } catch (error) {
          console.error("Failed to update views", error);
        }
      }
    }, 1500);

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setIsScrolled(target.scrollTop > 100);
    };

    const scrollContainer = document.getElementById('news-detail-scroll');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      clearTimeout(timer);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Default rich text content if not provided
  const defaultContent = `
    <p>VinClub hân hạnh thông báo về sự kiện mới nhất trong hệ sinh thái. Sự kiện lần này đánh dấu một bước ngoặt quan trọng trong việc mang lại những trải nghiệm đẳng cấp và khác biệt dành riêng cho các khách hàng VIP.</p>
    <br/>
    <h3>Điểm nhấn nổi bật</h3>
    <p>Với không gian được thiết kế sang trọng, hiện đại cùng chất lượng dịch vụ chuẩn 5 sao, sự kiện hứa hẹn mang đến những khoảnh khắc đáng nhớ.</p>
    <ul>
      <li>Trải nghiệm dịch vụ cá nhân hóa cao cấp.</li>
      <li>Gặp gỡ và giao lưu cùng cộng đồng tinh hoa.</li>
      <li>Cơ hội nhận những đặc quyền giới hạn chưa từng có.</li>
    </ul>
    <br/>
    <h3>Tầm nhìn tương lai</h3>
    <p>Trong thời gian tới, VinClub cam kết tiếp tục mở rộng hệ thống tiện ích, nâng cấp đặc quyền và ra mắt thêm nhiều chương trình tri ân hấp dẫn nhằm khẳng định vị thế của quý khách hàng trong hệ sinh thái.</p>
    <p>Hãy cùng đón chờ những bất ngờ tiếp theo!</p>
  `;

  const displayContent = news.content || defaultContent;

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-[#121212] flex flex-col h-full w-full overflow-hidden"
    >
      {/* Floating Header (Changes background on scroll) */}
      <div 
        className={`fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-4 transition-all duration-300 ${
          isScrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <Share2 className="w-4 h-4 text-white" />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <Bookmark className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div id="news-detail-scroll" className="flex-1 overflow-y-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Hero Banner */}
        <div className="relative w-full h-[50vh] min-h-[400px]">
          <ProgressiveImage 
            src={news.img} 
            alt={news.title} 
            className="w-full h-full" 
            imgClassName="object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-black/30" />
          
          <div className="absolute bottom-0 left-0 right-0 p-5 px-6">
            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest rounded-lg mb-4 backdrop-blur-sm">
              {news.tag}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-4 drop-shadow-lg">
              {news.title}
            </h1>
            
            <div className="flex items-center gap-4 text-white/50 text-xs font-mono border-t border-white/10 pt-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {news.date}
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {views.toLocaleString()} lượt xem
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-8 pb-32">
          {/* Prose/Rich Text Styling wrapper */}
          <div 
            className="prose prose-invert prose-amber max-w-none
              prose-p:text-white/80 prose-p:leading-relaxed prose-p:text-[15px] prose-p:tracking-wide
              prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
              prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-amber-400
              prose-a:text-amber-500 hover:prose-a:text-amber-400
              prose-ul:text-white/80 prose-ul:list-disc prose-li:my-2
              prose-strong:text-white prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />
        </div>
      </div>
    </motion.div>
  );
}
