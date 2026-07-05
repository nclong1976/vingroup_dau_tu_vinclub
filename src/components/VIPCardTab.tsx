import ProgressiveImage from './ProgressiveImage';
import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Sparkles, RefreshCw, CreditCard, Award, HelpCircle } from 'lucide-react';
interface VIPCardTabProps {
  userName: string;
}

type CardTier = 'MEMBER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export default function VIPCardTab({ userName }: VIPCardTabProps) {
  const [tier, setTier] = useState<CardTier>('DIAMOND');
  const [isFlipped, setIsFlipped] = useState(false);

  // Luxury banking tier configurations using provided image assets
  const tierConfig = {
    MEMBER: {
      name: 'THÀNH VIÊN / MEMBER',
      imageUrl: 'https://statics.vinpearl.com/vinclub-member_1723049424.png',
      backBg: 'linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 50%, #d1d5db 100%)',
      borderColor: 'border-slate-300',
      textColor: 'text-slate-600',
      badgeColor: 'bg-slate-200 text-slate-700 border-slate-300',
      shadowColor: 'shadow-slate-500/10',
      accentColor: 'bg-slate-400',
      serial: 'VNC 8899 MEMB 1234',
      cvv: '012',
      privileges: [
        'Y tế : Giảm 30% gói khám chữa bệnh tại Vinmec.',
        'Đặc quyền tham gia các gói đầu tư',
        'Lãi xuất tự động 0.4%'
      ],
      exclusiveQuote: 'Bắt đầu hành trình tinh hoa cùng hệ sinh thái VinClub.'
    },
    GOLD: {
      name: 'VÀNG / GOLD',
      imageUrl: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcS42YT1prXcaoupJMGpoUAj7d1BVNTrGId7YctH4Yk190Zf6fU_',
      backBg: 'linear-gradient(135deg, #fef08a 0%, #fef9c3 50%, #fde047 100%)',
      borderColor: 'border-yellow-400/50',
      textColor: 'text-yellow-600',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      shadowColor: 'shadow-yellow-500/15',
      accentColor: 'bg-yellow-500',
      serial: 'VNC 8899 GOLD 5678',
      cvv: '388',
      privileges: [
        'Y tế & Nghỉ dưỡng: Giảm 30% gói khám chữa bệnh tại Vinmec.',
        'Giảm 10% tham gia các dự án BDS trừ trực tiếp khi ký hợp đồng đầu tư.',
        'Giảm 5% tham gia mua xe Vinfast',
        'Lãi suất tự động: Tự động cộng 0.8% lãi suất lúc 09:00 sáng AM hàng ngày.'
      ],
      exclusiveQuote: 'Khẳng định vị thế, trải nghiệm phong vị thượng lưu.'
    },
    PLATINUM: {
      name: 'BẠCH KIM / PLATINUM',
      imageUrl: 'https://statics.vinpearl.com/vinclub-platinum_1723049468.png',
      backBg: 'linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 50%, #94a3b8 100%)',
      borderColor: 'border-cyan-500/40',
      textColor: 'text-slate-700',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      shadowColor: 'shadow-cyan-500/15',
      accentColor: 'bg-slate-500',
      serial: 'VNC 8899 PLAT 9012',
      cvv: '789',
      privileges: [
        'Y tế & Nghỉ dưỡng: Giảm 30% gói khám chữa bệnh tại Vinmec.',
        'Giảm 15% khi tham gia các dự án BDS trừ trực tiếp khi ký hợp đồng đầu tư.',
        'Nhận ngay một gói Học bổng Vinschool.',
        'Lãi suất tự động: Tự động cộng 1.2% lãi suất lúc 09:00 sáng AM hàng ngày.'
      ],
      exclusiveQuote: 'Đặc quyền vượt trội, nâng tầm phong cách sống.'
    },
    DIAMOND: {
      name: 'KIM CƯƠNG / DIAMOND',
      imageUrl: 'https://statics.vinpearl.com/vinclub-diamond_1723049663.png',
      backBg: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #0c0a09 100%)',
      borderColor: 'border-amber-500/50',
      textColor: 'text-amber-500',
      badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-500/30',
      shadowColor: 'shadow-amber-500/20',
      accentColor: 'bg-amber-600',
      serial: 'VNC 8899 DIAM 9999',
      cvv: '999',
      privileges: [
        'Nhận ngay hai gói Học bổng Vinschool.',
        'Y tế & Nghỉ dưỡng: Giảm 30% gói khám chữa bệnh tại Vinmec.',
        'Giảm 20% khi tham gia các dự án BDS trừ trực tiếp khi ký hợp đồng đầu tư.',
        'Lãi suất tự động: Tự động cộng 2.0% lãi suất lúc 09:00 sáng AM hàng ngày.'
      ],
      exclusiveQuote: 'Đỉnh cao kiệt tác, đặc quyền thượng khách tối thượng.'
    }
  };

  const activePreset = tierConfig[tier];

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center px-4 py-6 select-none">
      
      {/* Luxury Bank-style Title and Subtitle */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-semibold text-neutral-900 tracking-tight">
          THẺ THÀNH VIÊN VINCLUB
        </h2>
        <p className="text-[11px] font-sans text-neutral-500 uppercase tracking-widest mt-1">
          Đặc quyền tài chính & Phong cách sống thượng lưu
        </p>
      </div>

      {/* Tier Selector in Luxury Brushed Design */}
      <div className="grid grid-cols-4 bg-white/95 border border-amber-500/20 p-1 rounded-2xl mb-8 w-full shadow-md backdrop-blur-md">
        {(['MEMBER', 'GOLD', 'PLATINUM', 'DIAMOND'] as CardTier[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTier(t);
              setIsFlipped(false);
            }}
            className={`py-2 text-[9.5px] font-sans font-bold rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
              tier === t 
                ? 'bg-gradient-to-b from-[#d4af37] to-[#aa7c11] text-white shadow-md scale-105' 
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/50'
            }`}
          >
            {t === 'MEMBER' ? 'Member' : t === 'GOLD' ? 'Gold' : t === 'PLATINUM' ? 'Platinum' : 'Diamond'}
          </button>
        ))}
      </div>

      {/* Card 3D container with beautiful prospective scale */}
      <div 
        className="relative w-full aspect-[1.58/1] max-w-md cursor-pointer group mb-6 hover:scale-[1.02] transition-transform duration-300"
        style={{ perspective: '1500px' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
          className={`w-full h-full relative rounded-2xl border ${activePreset.borderColor} shadow-[0_16px_35px_rgba(141,103,45,0.15)] ${activePreset.shadowColor} transition-all duration-500`}
        >
          {/* FRONT SIDE */}
          <div 
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-inner"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)'
            }}
          >
            {/* Direct Membership Card Image provided by user */}
            <ProgressiveImage src={activePreset.imageUrl} alt={activePreset.name} className="w-full h-full" imgClassName="object-cover" />

            {/* High-end metallic glare effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />

            {/* Premium Gold Watermark Border for interactive luxury */}
            <div className="absolute inset-2.5 border border-white/10 rounded-xl pointer-events-none" />

            {/* Overlay the User Name dynamically in sophisticated styling to look like an actual printed card */}
            <div className="absolute bottom-5 left-6 z-10 text-left">
              <span className="text-[7.5px] text-white/50 block font-mono tracking-widest uppercase">
                CHỦ THẺ
              </span>
              <span className="text-xs font-serif font-semibold tracking-wider text-white uppercase drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]">
                {userName}
              </span>
            </div>

            {/* Overlay card serial number dynamically */}
            <div className="absolute bottom-5 right-6 z-10 text-right">
              <span className="text-[7.5px] text-white/50 block font-mono tracking-widest uppercase">
                MÃ THẺ
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-white/90 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]">
                {activePreset.serial}
              </span>
            </div>
          </div>

          {/* BACK SIDE (Luxury Private Banking Styled Card Back) */}
          <div 
            className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
            style={{ 
              background: activePreset.backBg,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            {/* Magnetic Stripe */}
            <div className="absolute top-5 left-0 right-0 h-9 bg-neutral-900" />

            {/* Signature Area */}
            <div className="mt-11 flex items-center space-x-3 z-10">
              <div className="flex-1 h-8 bg-white/70 border border-neutral-300/40 rounded px-3 flex items-center justify-between">
                <span className="font-serif italic text-neutral-800 text-xs font-semibold select-none tracking-wide">
                  {userName}
                </span>
                <span className="text-[10px] font-mono font-bold text-neutral-600 select-none">
                  CVV {activePreset.cvv}
                </span>
              </div>
              
              {/* Premium Bank Hologram representation */}
              <div className="w-10 h-8 rounded bg-gradient-to-br from-amber-400 via-rose-300 to-sky-400 opacity-80 flex items-center justify-center border border-white/20">
                <div className="w-6 h-5 bg-white/20 rounded-sm" />
              </div>
            </div>

            {/* Watermark Logo and Terms */}
            <div className="z-10 text-left mt-2 flex justify-between items-end">
              <div className="max-w-[70%]">
                <p className="text-[7.5px] text-neutral-700 leading-normal font-sans">
                  • Thẻ này là đặc quyền thuộc hệ sinh thái VinClub Private Member. Chỉ có giá trị sử dụng bởi chủ thẻ danh định được in ở mặt trước.
                </p>
                <p className="text-[7.5px] text-neutral-700 leading-normal font-sans mt-0.5">
                  • Vui lòng xuất trình thẻ điện tử 3D này khi thực hiện thanh toán, sử dụng phòng chờ sân bay hoặc dịch vụ nghỉ dưỡng để được phục vụ đặc cách.
                </p>
                <p className="text-[7.5px] text-neutral-600 font-mono font-bold mt-2">
                  ĐƯỜNG DÂY NÓNG: 1900 23 23 89
                </p>
              </div>

              {/* Secure QR / Chip symbol */}
              <div className="w-11 h-11 bg-white rounded-lg p-1.5 flex items-center justify-center shadow-inner">
                {/* Simulated QR block */}
                <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-80">
                  {[...Array(16)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-[1px] ${
                        (i * 3 + 7) % 5 === 0 || i % 3 === 0 ? 'bg-neutral-800' : 'bg-transparent'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Flip action helper with gold styles */}
      <button 
        onClick={() => setIsFlipped(!isFlipped)}
        className="flex items-center gap-2 text-xs text-neutral-800 hover:text-amber-700 font-bold transition-colors uppercase tracking-widest px-5 py-2.5 border border-amber-500/35 bg-white hover:bg-neutral-50 rounded-full active:scale-95 shadow-sm"
      >
        <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
        LẬT THẺ
      </button>

      {/* Tier Benefits Panel in banking format */}
      <motion.div 
        key={tier}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 bg-white border border-neutral-200 text-neutral-800 rounded-3xl p-5.5 w-full max-w-md text-left shadow-lg relative overflow-hidden"
      >
        {/* Subtle executive gold divider */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#d4af37] via-[#aa7c11] to-[#d4af37]" />
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-semibold text-sm text-neutral-900 tracking-wide">
              ĐẶC QUYỀN HẠNG {activePreset.name.split(' / ')[0]}
            </h4>
            <p className="text-[10px] text-neutral-400 font-mono tracking-wider">
              {activePreset.serial}
            </p>
          </div>
        </div>

        <p className="text-xs text-neutral-600 italic leading-relaxed font-sans mb-4 border-l-2 border-amber-500/40 pl-3">
          "{activePreset.exclusiveQuote}"
        </p>

        {/* Dynamic Benefits bullet list */}
        <div className="space-y-2.5 mb-5">
          {activePreset.privileges.map((p, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
              <span className="text-[11.5px] text-neutral-700 font-sans leading-relaxed">{p}</span>
            </div>
          ))}
        </div>

        {/* Executive Quick Stats Panel */}
        <div className="grid grid-cols-2 gap-3.5 pt-4 border-t border-neutral-100">
          <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center">
            <span className="text-[8px] text-neutral-400 block uppercase font-mono font-bold tracking-wider">Tích lũy tối đa</span>
            <span className="text-[13px] font-bold text-amber-700 mt-0.5 block font-mono">
              {tier === 'MEMBER' ? '1%' : tier === 'GOLD' ? '3%' : tier === 'PLATINUM' ? '4%' : '5%'} Điểm VIP
            </span>
          </div>
          <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center">
            <span className="text-[8px] text-neutral-400 block uppercase font-mono font-bold tracking-wider">Định mức chiết khấu</span>
            <span className="text-[13px] font-bold text-amber-700 mt-0.5 block font-mono">
              {tier === 'MEMBER' ? 'Lên tới 5%' : tier === 'GOLD' ? 'Lên tới 15%' : tier === 'PLATINUM' ? 'Lên tới 25%' : 'Lên tới 40%'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
