import { useState } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { motion } from 'motion/react';
import ContractSignModal from './ContractSignModal';
import ProgressiveImage from './ProgressiveImage';

interface LocationDetailsProps {
  key?: string;
  userName?: string;
  onComplete?: (points: number) => void;
  data: { image: string; location: string; info: string; project?: any };
  userPhoto: string | null;
  userData?: any;
  onRequestDeposit?: () => void;
  onClose: () => void;
}

export default function LocationDetailsScreen({ data, onClose, userName, onComplete, userData, onRequestDeposit }: LocationDetailsProps) {
  const [showContractSign, setShowContractSign] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const progress = data.project?.progress || 0;

  const handleInvest = () => {
    if (data.project?.status === 'inactive') {
      alert("Dự án đầu tư này đang đóng.");
      return;
    }
    setShowContractSign(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto p-4 font-sans"
    >
      <div className="absolute inset-0 z-0" onClick={onClose} />
      
      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="w-full max-w-[400px] bg-white rounded-2xl overflow-hidden shadow-2xl z-10 relative flex flex-col"
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 transition-colors z-40 rounded-full text-white cursor-pointer backdrop-blur-md"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Project Image */}
        <div className="w-full bg-neutral-200" style={{ height: '152px' }}>
          <ProgressiveImage 
            src={data.image} 
            alt={data.location} 
            className="w-full h-full" 
            imgClassName="object-cover" 
            style={{ paddingLeft: '0px', paddingTop: '0px', paddingRight: '0px', height: '152px' }}
          />
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 text-neutral-800">
          
          {/* Title with Red Bar */}
          <div className="flex gap-3 items-center">
            <div className="w-1.5 h-10 bg-[#a63c3c] shrink-0" />
            <h2 className="text-[17px] font-bold text-[#072a40] leading-snug">
              {data.location}
            </h2>
          </div>

          {/* 3-Column Stats */}
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-neutral-200 mt-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[#a63c3c] font-extrabold text-[15px]">
                {data.project?.interestRate || "1.50 %"}
              </span>
              <span className="text-neutral-400 text-[10px]">Lãi suất hàng ngày</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[#a63c3c] font-extrabold text-[15px]">
                {data.project?.duration || "8640 phút"}
              </span>
              <span className="text-neutral-400 text-[10px]">Thời hạn dự án</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[#a63c3c] font-extrabold text-[15px] truncate px-1" title={data.project?.minInvestment}>
                {data.project?.minInvestment || "2.000.000 VNĐ"}
              </span>
              <span className="text-neutral-400 text-[10px]">Số tiền tối thiểu</span>
            </div>
          </div>

          <div className="w-full h-px bg-neutral-100 my-1" />

          {/* Scale & Description */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-neutral-600 font-semibold">Quy mô dự án:</span>
              <span className="text-[#072a40] font-bold">
                {data.project?.scale || "40.000.000.000 VNĐ"}
              </span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              Hoàn lãi hàng ngày, trả gốc khi đáo hạn
            </p>
          </div>

          {/* Invest Button */}
          <div className="mt-1">
            <button 
              onClick={handleInvest}
              disabled={isSubmitting || submitSuccess}
              className={`w-full py-3 font-bold text-sm rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer ${
                submitSuccess 
                  ? 'bg-green-600 text-white cursor-default' 
                  : isSubmitting
                  ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                  : 'bg-[#9a7b4f] hover:bg-[#856840] text-white shadow-md active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : submitSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Đã gửi yêu cầu
                </>
              ) : (
                'Gửi tiền ngay'
              )}
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 text-[11px] font-bold mt-1">
            <span className="text-neutral-500">Tiến độ:</span>
            <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#9a7b4f] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[#072a40]">{progress}%</span>
          </div>

        </div>
      </motion.div>
      {showContractSign && (
        <ContractSignModal
          isOpen={showContractSign}
          onClose={() => {
            setShowContractSign(false);
            setSubmitSuccess(true);
          }}
          userName={userName || 'Nhà Đầu Tư'}
          userData={userData}
          onRequestDeposit={onRequestDeposit}
          projectDetails={{
            location: data.location,
            profit: data.project?.interestRate || "1.5% / ngày",
            term: data.project?.duration || "6 ngày",
          }}
          onComplete={(p) => onComplete && onComplete(p)}
        />
      )}
    </motion.div>
  );
}
