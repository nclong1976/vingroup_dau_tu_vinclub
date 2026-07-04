import ProgressiveImage from './ProgressiveImage';
import { useState } from 'react';
import { Eye, EyeOff, Clock, CreditCard, QrCode } from 'lucide-react';
import { motion } from 'motion/react';
interface BalanceCardProps {
  userName: string;
  userPhoto?: string;
  rank?: string;
  balance?: number;
  points?: number;
}

export default function BalanceCard({ userName, userPhoto, rank = "Titan", balance = 1250000, points = 88800 }: BalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const formattedBalance = balance.toLocaleString();
  const formattedPoints = points.toLocaleString();

  return (
    <motion.div 
      className="relative w-full rounded-[24px] overflow-hidden border border-[#3a352a]/50 shadow-[0_15px_40px_rgba(0,0,0,0.6)] p-6 bg-[#fdfcfc]"
      style={{ height: '220px' }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-90"
        style={{ backgroundImage: `url('https://ilhzsadfwezqljvrbpwt.supabase.co/storage/v1/object/public/vinclub/Screenshot_18-Photoroom.png')` }}
      />
      
      {/* Golden glow overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
      <div className="absolute top-10 right-0 w-32 h-32 bg-yellow-600/25 blur-[50px] rounded-full translate-x-1/2 pointer-events-none" />

      {/* Top Row: User Info & QR */}
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex items-center space-x-3">
          {userPhoto ? (
            <ProgressiveImage src={userPhoto} alt={userName} className="w-12 h-12 rounded-full border-[2px] border-amber-500/30 shrink-0 shadow-lg" imgClassName="object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-800 border-[2px] border-amber-500/30 flex items-center justify-center shadow-lg">
              <span className="text-white text-base font-bold">{userName.charAt(0)}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-white text-sm font-extrabold tracking-wide uppercase drop-shadow-md">{userName}</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <div className="w-[16px] h-[16px] rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6b22] flex items-center justify-center shadow-sm">
                <span className="font-black text-white leading-none" style={{ fontSize: '10px', color: '#f1c413' }}>V</span>
              </div>
              <span className="text-amber-500/90 text-[11px] font-black tracking-widest uppercase">{rank}</span>
            </div>
          </div>
        </div>
        <button className="flex items-center space-x-1.5 bg-black/40 hover:bg-black/60 transition-colors px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md shadow-lg">
          <QrCode className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-white/90 text-[10px] font-black tracking-widest uppercase">QR</span>
        </button>
      </div>

      {/* Dual Asset Section */}
      <div className="flex justify-start items-start mb-5 relative z-10">
        {/* Balance Section */}
        <div className="relative">
          <div className="text-[#d4e6cf] text-[10px] mb-1 uppercase tracking-[0.2em] font-normal text-left" style={{ marginLeft: '160px' }}>Số dư VND</div>
          <div className="flex items-center space-x-2" style={{ marginLeft: '160px' }}>
            <div className="text-[#d4e6cf] font-mono text-lg tracking-tight font-black flex items-center h-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              {showBalance ? (
                <span>{formattedBalance}</span>
              ) : (
                <span className="tracking-[0.2em] text-xs">••••••</span>
              )}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowBalance(!showBalance);
              }}
              className="text-neutral-400 hover:text-white transition-colors p-1"
            >
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>


      {/* Bottom Actions */}
      <div className="flex items-center justify-between relative z-10 pt-2 border-t border-white/5">
        <button 
          className="flex-1 flex items-center justify-center space-x-2 py-2 text-neutral-300 hover:text-white transition-colors bg-white/5 rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Clock className="w-4 h-4 text-neutral-400" />
          <span className="text-[12px] font-medium">Giao dịch</span>
        </button>
        <div className="w-2" />
        <button 
          className="flex-1 flex items-center justify-center space-x-2 py-2 text-neutral-300 hover:text-white transition-colors bg-white/5 rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <CreditCard className="w-4 h-4 text-neutral-400" />
          <span className="text-[12px] font-medium">Thẻ VIP</span>
        </button>
      </div>
    </motion.div>
  );
}
