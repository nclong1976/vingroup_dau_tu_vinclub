import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';

interface ReceiptModalProps {
  tx: any;
  onClose: () => void;
  userData: any;
}

export default function ReceiptModal({ tx, onClose, userData }: ReceiptModalProps) {
  if (!tx) return null;

  const dateStr = tx.createdAt?.seconds 
    ? new Date(tx.createdAt.seconds * 1000).toLocaleString('vi-VN')
    : tx.date 
      ? (tx.date.includes('-') ? new Date(tx.date).toLocaleString('vi-VN') : tx.date)
      : new Date().toLocaleString('vi-VN');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-sans select-none">
      {/* Background close trigger */}
      <div className="absolute inset-0 z-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md bg-white text-neutral-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col border border-neutral-200"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 p-1.5 rounded-full transition-all z-20 cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Receipt Notch Decorators */}
        <div className="absolute left-[-8px] top-[140px] w-4 h-4 bg-[#07070a] rounded-full border border-neutral-200 z-10" />
        <div className="absolute right-[-8px] top-[140px] w-4 h-4 bg-[#07070a] rounded-full border border-neutral-200 z-10" />

        {/* Header (VinClub Black/Gold branding) */}
        <div className="bg-gradient-to-b from-[#0c0c12] to-[#121218] p-5 text-center text-white border-b border-dashed border-neutral-300 relative">
          <div className="flex justify-center mb-1.5">
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[9px] font-black uppercase text-[#e1b777] tracking-widest">
              BIÊN LAI ĐIỆN TỬ
            </div>
          </div>
          <h4 className="text-xs font-black uppercase tracking-widest font-serif text-[#e1b777]">HỆ THỐNG VINCLUB VIP</h4>
          <p className="text-[8px] font-mono text-neutral-400 mt-1 uppercase">MÃ GIAO DỊCH: TX-{tx.contractId?.split('-')[1] || tx.id?.substring(0, 6).toUpperCase() || '8899'}</p>
        </div>

        {/* Body (Receipt Fields) */}
        <div className="p-5 space-y-3.5 text-[11px] sm:text-xs bg-[#fbfbfe] text-left">
          
          {/* Section 1: Customer Details */}
          <div className="space-y-1.5 pb-3 border-b border-neutral-200/60">
            <div className="flex justify-between">
              <span className="text-neutral-500">Khách hàng:</span>
              <span className="font-bold text-neutral-900 uppercase">{tx.userName || userData?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Mã định danh:</span>
              <span className="font-mono text-neutral-700 font-semibold">{userData?.memberId || 'VNC-8899'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Hạng hội viên:</span>
              <span className="font-bold text-amber-600">{userData?.rank || 'THÀNH VIÊN / MEMBER'}</span>
            </div>
          </div>

          {/* Section 2: Investment Details */}
          <div className="space-y-1.5 pb-3 border-b border-neutral-200/60">
            <div className="flex justify-between items-start">
              <span className="text-neutral-500">Hạng mục ủy thác:</span>
              <span className="font-bold text-neutral-900 text-right max-w-[200px] leading-tight">{tx.title?.replace("Đầu tư: ", "") || "Dự án ủy thác VinClub"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Mã hợp đồng:</span>
              <span className="font-mono text-neutral-700 font-semibold">{tx.contractId || 'VNC-UNKNOWN'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Thời gian tạo:</span>
              <span className="font-bold text-neutral-900">{dateStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Trạng thái pháp lý:</span>
              <span className="font-black text-green-600 flex items-center gap-1">
                <CheckCircle size={10} /> Đã xác thực ký số
              </span>
            </div>
          </div>

          {/* Section 3: Amount and Rewards */}
          <div className="space-y-1.5 pb-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">Phương thức thanh toán:</span>
              <span className="font-bold text-neutral-900">{tx.paymentMethod || 'Số dư tài khoản VinClub'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Điểm thưởng nhận được:</span>
              <span className="font-bold text-emerald-600">+{tx.rewardPoints?.toLocaleString() || Math.floor((tx.amount || 0) * 0.01).toLocaleString()} Điểm VIP</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-neutral-600 font-bold text-xs uppercase">TỔNG TIỀN ỦY THÁC:</span>
              <span className="font-mono text-base sm:text-lg font-black text-[#a63c3c]">
                {(tx.amount || 0).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          {/* Section 4: Signature Embed */}
          <div className="pt-3 border-t border-dashed border-neutral-300 flex items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-[8px] text-neutral-400 block uppercase font-mono leading-none">Chữ ký điện tử đối chiếu:</span>
              {tx.signature_content ? (
                <div className="h-10 mt-1 flex items-center justify-start bg-white border border-neutral-100 rounded px-2 w-28 shadow-sm">
                  <img 
                    src={tx.signature_content} 
                    alt="Digital Signature" 
                    className="max-h-full max-w-full object-contain" 
                  />
                </div>
              ) : (
                <span className="text-[10px] text-neutral-400 italic block mt-1">Chữ ký mặc định</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* QR Representation */}
              <div className="w-11 h-11 bg-white border border-neutral-200 rounded p-1 flex items-center justify-center shadow-sm">
                <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-90">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className={`rounded-[1px] ${ (i * 9 + 4) % 3 === 0 || i % 2 === 0 ? 'bg-neutral-800' : 'bg-transparent' }`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer (VinClub certified stamp footer) */}
        <div className="bg-[#121218] p-3.5 text-center text-white/50 text-[8px] tracking-wider uppercase font-mono flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} className="text-[#e1b777]" /> Chứng thực số hóa bởi VinClub Security Gateway
        </div>
      </motion.div>
    </div>
  );
}
