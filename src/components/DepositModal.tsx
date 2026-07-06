import ProgressiveImage from './ProgressiveImage';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Check, ShieldCheck, Landmark, Wallet, Building2, Loader2 } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import SignaturePicker from './SignaturePicker';
import SignaturePad from './SignaturePad';
import VinpearlStamp from './VinpearlStamp';
interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userId: string;
  onComplete?: (amount: number) => void;
}

export default function DepositModal({ isOpen, onClose, userName, userId, onComplete }: DepositModalProps) {
  const [step, setStep] = useState<number>(1);
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'bank' | 'momo' | 'usdt'>('bank');
  
  const [signature, setSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!signature) {
      alert('Vui lòng ký tên xác nhận!');
      return;
    }

    setIsSubmitting(true);
    try {
      const amountVal = parseFloat(amount);
      const newTransaction = {
        userId: userId || "anonymous",
        amount: amountVal,
        type: 'plus',
        paymentMethod: method,
        signature_type: 'image/png',
        signature_content: signature,
        date: new Date().toISOString(),
        status: "Đang chờ duyệt",
        userName: userName || "Nhà Đầu Tư",
        title: "Góp vốn (Nạp VND)"
      };

      await addDoc(collection(db, 'transactions'), newTransaction);

      setSuccess(true);
      setTimeout(() => {
        if (onComplete) onComplete(amountVal);
        onClose();
        // Reset states
        setTimeout(() => {
          setStep(1);
          setAmount('');
          setSignature('');
          setSuccess(false);
        }, 500);
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi tạo yêu cầu nạp tiền.');
      setIsSubmitting(false);
    }
  };

  const formatVND = (val: string) => {
    if (!val) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(val));
  };

  const today = new Date();
  const dateStr = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
        <div className="absolute inset-0" onClick={onClose} />
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-neutral-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[95vh] sm:h-auto max-h-[95vh] sm:max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-amber-500/20 bg-neutral-950/50">
            <h2 className="text-lg font-bold text-amber-500 uppercase tracking-widest font-mono">
              {step === 1 ? 'Yêu Cầu Nạp Vốn' : 'Hợp Đồng Góp Vốn'}
            </h2>
            <button onClick={onClose} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {success ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-10 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center border border-green-500/50">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Đã Gửi Yêu Cầu</h3>
                <p className="text-sm text-neutral-400">Yêu cầu nạp vốn của bạn đang được xử lý.</p>
              </motion.div>
            ) : step === 1 ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Số tiền nạp (VNĐ)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-black/50 border border-amber-500/30 rounded-xl px-4 py-3 text-lg font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Nhập số tiền..."
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 font-bold">VNĐ</div>
                  </div>
                  {amount && <div className="mt-2 text-right text-sm text-amber-400 font-medium">{formatVND(amount)}</div>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Phương thức thanh toán</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setMethod('bank')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${method === 'bank' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-amber-500/50'}`}
                    >
                      <Building2 className="w-6 h-6 mb-2" />
                      <span className="text-[10px] font-bold uppercase">Ngân hàng</span>
                    </button>
                    <button
                      onClick={() => setMethod('momo')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${method === 'momo' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-amber-500/50'}`}
                    >
                      <Wallet className="w-6 h-6 mb-2" />
                      <span className="text-[10px] font-bold uppercase">Ví Momo</span>
                    </button>
                    <button
                      onClick={() => setMethod('usdt')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${method === 'usdt' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-amber-500/50'}`}
                    >
                      <Landmark className="w-6 h-6 mb-2" />
                      <span className="text-[10px] font-bold uppercase">USDT (Crypto)</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-900 font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Tiếp Tục Ký Hợp Đồng <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div 
                className="bg-white text-[#12347a] p-3 sm:p-8 rounded-xl shadow-2xl border border-neutral-200/50 text-xs sm:text-sm leading-relaxed space-y-4 max-h-[35vh] sm:max-h-[50vh] overflow-y-auto"
                  style={{ fontFamily: "Calibri, Candara, 'Segoe UI', Optima, Arial, sans-serif" }}
                >
                  <div className="text-center mb-6 border-b border-[#12347a]/20 pb-4">
                    <h3 className="font-bold text-[#0f2b5c] text-xs sm:text-base uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                    <p className="font-bold text-[#1e40af] underline decoration-1 underline-offset-4 text-[10px] sm:text-xs">Độc lập - Tự do - Hạnh phúc</p>
                    <h2 className="text-sm sm:text-lg font-bold mt-4 uppercase text-[#0f2b5c]">Hợp Đồng Nạp Vốn Đầu Tư</h2>
                    <p className="italic text-[#1e40af]/80 text-[10px] sm:text-xs">{dateStr}</p>
                  </div>
                  
                  <p className="text-[#0f2b5c]">Hôm nay, {dateStr}, tại nền tảng hệ sinh thái đầu tư, chúng tôi gồm:</p>
                  
                  <div className="space-y-1 pl-4 border-l-2 border-[#12347a]/30 bg-[#12347a]/5 py-1.5 rounded-r">
                    <p className="font-bold text-[#0f2b5c]">BÊN A (NHÀ ĐẦU TƯ):</p>
                    <p className="text-[#12347a]/95">Ông/Bà: <strong className="text-[#0f2b5c] underline underline-offset-2">{userName}</strong></p>
                  </div>
                  
                  <div className="space-y-1 pl-4 border-l-2 border-[#12347a]/30 bg-[#12347a]/5 py-1.5 rounded-r">
                    <p className="font-bold text-[#0f2b5c]">BÊN B (ĐƠN VỊ TIẾP NHẬN):</p>
                    <p className="text-[#12347a]/95">Hệ Sinh Thế Đầu Tư VIP VinClub</p>
                  </div>
                  
                  <p className="text-[#12347a]/95">Hai bên thống nhất ký kết hợp đồng nạp vốn đầu tư với các điều khoản sau:</p>
                  
                  <ul className="list-decimal pl-5 space-y-2 text-[#12347a]/95">
                    <li>Bên A đồng ý nạp số tiền <strong className="text-[#1034a6] bg-[#1034a6]/5 px-1 rounded border border-[#1034a6]/15">{formatVND(amount)}</strong> vào hệ thống thông qua phương thức <strong className="text-[#0f2b5c]">{method === 'bank' ? 'NGÂN HÀNG' : method.toUpperCase()}</strong>.</li>
                    <li>Bên B cam kết sử dụng số tiền nạp để cộng vào số dư tài khoản của Bên A ngay sau khi giao dịch được xác nhận hợp lệ.</li>
                    <li>Bên A cam đoan số tiền nạp là hoàn toàn hợp pháp và chịu mọi trách nhiệm trước pháp luật về nguồn gốc số tiền.</li>
                    <li>Hợp đồng này có giá trị pháp lý dưới dạng điện tử, chữ ký điện tử của Bên A là bằng chứng xác nhận sự đồng ý với các điều khoản.</li>
                  </ul>
                  
                  <div className="grid grid-cols-2 mt-8 text-center pt-8 border-t border-[#12347a]/20 gap-4">
                    <div className="flex flex-col justify-between h-[150px] sm:h-[160px]">
                      <p className="font-bold text-[#0f2b5c] text-xs sm:text-sm">ĐẠI DIỆN BÊN B</p>
                      <div className="flex-1 flex items-center justify-center">
                        <VinpearlStamp className="h-16 w-16" opacity="0.95" />
                      </div>
                      <p className="font-bold text-[#12347a]/80 text-[10px] sm:text-xs uppercase tracking-wider">Đã xác nhận</p>
                    </div>
                    <div className="flex flex-col justify-between h-[150px] sm:h-[160px]">
                      <p className="font-bold text-[#0f2b5c] text-xs sm:text-sm">BÊN A (Ký tên)</p>
                      <div className="flex-1 flex items-center justify-center">
                        {signature ? (
                          <ProgressiveImage src={signature} alt="Chữ ký" className="h-12 w-auto object-contain border-b border-[#12347a]/20 pb-1" />
                        ) : (
                          <span className="text-[#12347a]/40 italic text-xs">Chưa có chữ ký</span>
                        )}
                      </div>
                      <p className="font-bold text-[#1034a6] text-[10px] sm:text-xs uppercase tracking-wider">{userName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-amber-500/10">
                  <h4 className="text-amber-500 font-bold text-sm uppercase flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Chữ Ký Điện Tử
                  </h4>
                  <SignaturePicker onSign={setSignature} />
                  
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting || !signature}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-900 font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác Nhận & Hoàn Tất'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
