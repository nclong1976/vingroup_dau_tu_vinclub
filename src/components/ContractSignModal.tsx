import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileSignature, 
  CheckCircle, 
  RotateCcw, 
  ArrowRight, 
  ShieldCheck, 
  DollarSign, 
  CreditCard, 
  Coins,
  FileCheck
} from 'lucide-react';
import { collection, addDoc, runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import ProgressiveImage from './ProgressiveImage';
import VinpearlStamp from './VinpearlStamp';

interface ContractSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onComplete: (points: number) => void;
  userData?: any;
  projectDetails?: {
    location: string;
    profit?: string;
    term?: string;
  };
  onRequestDeposit?: () => void;
}

export default function ContractSignModal({ 
  isOpen, 
  onClose, 
  userName,
  onComplete,
  userData,
  projectDetails,
  onRequestDeposit
}: ContractSignModalProps) {
  
  const [step, setStep] = useState(1); // 1: Amount & Payment, 2: Sign Contract, 3: Success
  const [amount, setAmount] = useState<number>(2000000);
  const [paymentMethod, setPaymentMethod] = useState('Số dư tài khoản VinClub');
  const [contractId] = useState(() => `VNC-${Math.floor(100000 + Math.random() * 900000)}`);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  const [showSignatureDrawer, setShowSignatureDrawer] = useState(false);
  const [useSavedSignature, setUseSavedSignature] = useState(false);

  // Reset states on reopen
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setHasSignature(false);
      setSignatureData('');
      setShowSignatureDrawer(false);
      setUseSavedSignature(false);
      
      // Auto-signature logic
      if (userData?.signature_content) {
        setSignatureData(userData.signature_content);
        setHasSignature(true);
        setUseSavedSignature(true);
      }
    }
  }, [isOpen, userData]);

  // Set up canvas when entering Step 2 (signing) OR when opening signature drawer
  useEffect(() => {
    if (step === 2 && isOpen && showSignatureDrawer && !useSavedSignature) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Clear and style
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#1034a6'; // Authentic blue signature ink
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          }
        }
      }, 80);
    }
  }, [step, isOpen, showSignatureDrawer, useSavedSignature]);

  if (!isOpen) return null;

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
      // Store current drawing state as base64
      setSignatureData(canvas.toDataURL('image/png'));
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Map client coordinates to canvas internal coordinates correctly
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasSignature(true);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasSignature(false);
      setSignatureData('');
    }
  };

  const handleContinueToSign = () => {
    if (paymentMethod === 'Số dư tài khoản VinClub') {
      const currentBalance = userData?.balance || 0;
      if (amount > currentBalance) {
        alert(`Số dư không đủ! Bạn cần nạp thêm ${ (amount - currentBalance).toLocaleString() } VND để thực hiện dự án này.`);
        onClose();
        if (onRequestDeposit) onRequestDeposit();
        return;
      }
    }
    setStep(2);
  };

  const handleConfirmInvestment = async () => {
    if (!hasSignature || !signatureData) return;
    setIsSubmitting(true);

    try {
      if (!userData?.uid) throw new Error("User not logged in");

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userData.uid);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error("User profile not found!");
        }

        const currentBalance = userDoc.data().balance || 0;
        const currentPoints = userDoc.data().points || 0;
        const rewardPoints = Math.floor(amount * 0.01); // Thưởng 1% Điểm tích lũy

        if (paymentMethod === 'Số dư tài khoản VinClub') {
          if (currentBalance < amount) {
            throw new Error("Số dư không đủ!");
          }
          // Khấu trừ số dư và cộng điểm tích lũy
          transaction.update(userRef, { 
            balance: currentBalance - amount,
            points: currentPoints + rewardPoints,
            updatedAt: serverTimestamp() 
          });
        }

        // Create transaction record
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          userId: userData.uid,
          userName: userName,
          amount: amount,
          type: 'investment',
          paymentMethod: paymentMethod,
          title: `Đầu tư: ${projectDetails?.location || 'Dự án Đặc quyền VinClub'}`,
          status: 'Thành công',
          contractId: contractId,
          signature_content: signatureData,
          rewardPoints: rewardPoints,
          createdAt: serverTimestamp()
        });
      });

      // 3. Move to success screen
      setStep(3);
      if (onComplete) onComplete(0); // Pass 0 as it's already handled in Firestore transaction
    } catch (err: any) {
      console.error("Investment Transaction Failed:", err);
      alert("Lỗi giao dịch: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-[#07070a] border border-[#e1b777]/30 w-full max-w-4xl rounded-2xl shadow-[0_0_50px_rgba(225,183,119,0.15)] flex flex-col h-[95vh] sm:h-auto max-h-[95vh] sm:max-h-[90vh] overflow-hidden z-10"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e1b777]/10 bg-[#0c0c12]/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <FileSignature className="text-[#e1b777]" size={24} />
            <h2 className="text-sm md:text-base font-bold text-[#e1b777] uppercase tracking-[0.2em] font-serif">
              {step === 1 && "Thiết lập Gói Góp Vốn"}
              {step === 2 && "Ký kết Hợp đồng Điện tử"}
              {step === 3 && "Giao dịch Thành công"}
            </h2>
          </div>
          {step !== 3 && (
            <button 
              onClick={onClose} 
              className="text-neutral-400 hover:text-[#e1b777] hover:bg-white/5 p-1.5 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Amount & Payment Selection */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-2 sm:p-6 md:p-8 overflow-y-auto space-y-2 sm:space-y-6 flex-1"
              >
                <div className="text-center max-w-xl mx-auto mb-1 sm:mb-4">
                  <h3 className="text-sm sm:text-lg font-serif font-semibold text-[#e1b777] mb-0 sm:mb-1">Cấu hình Hạn mức Ủy thác</h3>
                  <p className="text-[9px] sm:text-xs text-neutral-500 leading-tight">
                    Chọn số tiền đầu tư vào <strong className="text-white font-medium">{projectDetails?.location}</strong>. 
                    Tối thiểu 2.000.000 VNĐ.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-6 max-w-3xl mx-auto">
                  
                  {/* Left panel: Input Amount */}
                  <div className="bg-[#0e0e16] border border-[#e1b777]/10 rounded-xl p-2.5 sm:p-5 flex flex-col justify-between">
                    <div>
                      <label className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1 sm:mb-2.5">
                        Số Tiền Ủy Thác (VNĐ)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#e1b777] font-bold text-sm sm:text-lg">₫</span>
                        <input 
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-[#14141f] border border-[#e1b777]/20 rounded-lg pl-8 pr-3 py-1.5 sm:py-3.5 text-base sm:text-xl font-bold text-[#e1b777] focus:outline-none focus:border-[#e1b777] focus:ring-1 focus:ring-[#e1b777]/30 transition-all font-mono"
                        />
                      </div>

                      {/* Quick select presets */}
                      <div className="grid grid-cols-2 gap-1.5 mt-2 sm:mt-4">
                        {[2000000, 5000000, 10000000, 50000000].map(val => (
                          <button 
                            key={val}
                            type="button"
                            onClick={() => setAmount(val)}
                            className={`py-1.5 sm:py-2 px-3 text-[10px] sm:text-xs font-bold font-mono rounded-lg transition-all border ${amount === val ? 'bg-[#e1b777] text-black border-[#e1b777]' : 'bg-[#14141f] text-neutral-300 border-white/5 hover:border-[#e1b777]/30'}`}
                          >
                            {val.toLocaleString('vi-VN')} đ
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-6 pt-2 sm:pt-4 border-t border-white/5 text-[9px] sm:text-[11px] text-neutral-500 space-y-0.5 sm:space-y-1.5 font-sans">
                      <p className="flex justify-between">
                        <span>Lợi nhuận dự kiến:</span>
                        <span className="text-white font-medium">{projectDetails?.profit}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Thời gian khóa quỹ:</span>
                        <span className="text-white font-medium">{projectDetails?.term}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right panel: Payment Method */}
                  <div className="bg-[#0e0e16] border border-[#e1b777]/10 rounded-xl p-2.5 sm:p-5 space-y-1.5 sm:space-y-3.5">
                    <label className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0 sm:mb-1">
                      Phương Thức Thanh Toán
                    </label>

                    {[
                      { id: 'wallet', name: 'Số dư tài khoản VinClub', desc: 'Khấu trừ trực tiếp từ số dư ví', icon: Coins },
                      { id: 'transfer', name: 'Chuyển khoản ngân hàng', desc: 'Thanh toán trực tiếp qua QR Code', icon: CreditCard },
                      { id: 'vnpay', name: 'Ví điện tử VNPay', desc: 'Liên kết thanh toán thông minh', icon: DollarSign }
                    ].map(method => {
                      const Icon = method.icon;
                      return (
                        <label 
                          key={method.id} 
                          className={`flex items-center gap-2 p-1.5 sm:p-3.5 border rounded-xl cursor-pointer transition-all ${paymentMethod === method.name ? 'border-[#e1b777] bg-[#e1b777]/5 shadow-[0_0_15px_rgba(225,183,119,0.05)]' : 'border-white/5 bg-[#14141f] hover:border-[#e1b777]/20'}`}
                        >
                          <input 
                            type="radio" 
                            name="payment" 
                            checked={paymentMethod === method.name}
                            onChange={() => setPaymentMethod(method.name)}
                            className="text-[#e1b777] focus:ring-[#e1b777] bg-black border-white/20 w-3.5 h-3.5"
                          />
                          <div className="flex-1">
                            <span className="text-[9px] sm:text-xs font-bold text-white block flex items-center gap-1.5">
                              <Icon size={10} className="text-[#e1b777]" />
                              {method.name}
                            </span>
                            <span className="text-[8px] sm:text-[10px] text-neutral-500 block mt-0 leading-tight">{method.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Bar inside Panel */}
                <div className="max-w-3xl mx-auto pt-0.5 sm:pt-4 flex justify-center sm:justify-end">
                  <button 
                    onClick={() => {
                      if (amount < 2000000) {
                        alert("Hạn mức tối thiểu để ủy thác là 2.000.000 VNĐ.");
                        return;
                      }
                      handleContinueToSign();
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3.5 bg-gradient-to-r from-[#e1b777] to-[#c59e62] hover:from-[#c59e62] hover:to-[#e1b777] text-black font-bold text-[9px] sm:text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_20px_rgba(225,183,119,0.25)] hover:shadow-[0_4px_25px_rgba(225,183,119,0.35)] transition-all active:scale-95"
                  >
                    Tiến hành tạo Hợp đồng <ArrowRight size={12} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Contract Preview & Sign */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 overflow-hidden flex flex-col relative h-full bg-[#09090e]"
              >
                
                {/* Full Height Scrollable Contract */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div 
                    className="max-w-2xl mx-auto bg-white p-4 sm:p-12 rounded-xl shadow-2xl border border-neutral-200/50 text-[#12347a] leading-tight text-[11px] sm:text-sm"
                    style={{ fontFamily: "Calibri, Candara, 'Segoe UI', Optima, Arial, sans-serif" }}
                  >
                    
                    {/* Contract Header */}
                    <div className="text-center mb-4 border-b border-[#12347a]/20 pb-4">
                      <h3 className="font-bold text-[#0f2b5c] uppercase tracking-wider text-[8px] sm:text-xs">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                      <p className="font-bold text-[#1e40af] underline decoration-1 underline-offset-4 text-[7px] sm:text-[10px]">Độc lập - Tự do - Hạnh phúc</p>
                      
                      <div className="flex justify-center my-3">
                        <ProgressiveImage src="/logo.png" alt="Vinclub logo" className="h-7 sm:h-10 w-auto opacity-90" imgClassName="object-contain mix-blend-multiply" />
                      </div>

                      <h1 className="text-xs sm:text-lg font-bold text-[#0f2b5c] tracking-wider uppercase mt-1 mb-0.5">
                        HỢP ĐỒNG ỦY THÁC ĐẦU TƯ
                      </h1>
                      <p className="text-[7px] sm:text-[9px] text-[#1e40af]/80 font-mono uppercase tracking-wider">Mã số: {contractId}</p>
                    </div>

                    {/* Contract Body */}
                    <div className="space-y-3">
                      <p className="italic text-[#12347a]/90">Căn cứ Bộ luật Dân sự nước Cộng hòa Xã hội Chủ nghĩa Việt Nam ban hành năm 2015.</p>
                      <p className="italic text-[#12347a]/90">Căn cứ nhu cầu và năng lực tài chính của hai bên.</p>
                      <p className="text-[#0f2b5c]">Hôm nay, ngày {new Date().toLocaleDateString('vi-VN')}, chúng tôi gồm có:</p>
                      
                      <div className="pl-3 border-l-2 border-[#12347a]/40 py-1 space-y-1 bg-[#12347a]/5 rounded-r-lg">
                        <p className="font-bold text-[#0f2b5c] text-[10px] sm:text-xs">BÊN NHẬN ỦY THÁC (BÊN A): CÔNG TY CỔ PHẦN VINCLUB</p>
                        <p className="text-[#12347a]/95">Trụ sở chính: Tòa nhà Văn phòng Symphony, Vinhomes Riverside, Long Biên, Hà Nội</p>
                        <p className="text-[#12347a]/95">Đại diện: Ban Điều hành Đặc quyền Thượng lưu VinClub</p>
                      </div>

                      <div className="pl-3 border-l-2 border-[#12347a]/40 py-1 space-y-1 bg-[#12347a]/5 rounded-r-lg">
                        <p className="font-bold text-[#0f2b5c] text-[10px] sm:text-xs">BÊN ỦY THÁC ĐẦU TƯ (BÊN B):</p>
                        <p className="text-[#12347a]/95">Ông/Bà: <span className="font-bold text-[#0f2b5c] underline underline-offset-2">{userName || 'Thành viên VIP'}</span></p>
                        <p className="text-[#12347a]/90">Tài khoản VIP định danh trên hệ thống: <span className="font-mono text-[#1034a6]">{userName ? `@${userName.toLowerCase().replace(/\s+/g, '')}` : 'thanhvien_vip'}</span></p>
                      </div>

                      <h4 className="font-bold text-[#0f2b5c] uppercase tracking-wider mt-4 mb-1 border-b border-[#12347a]/20 pb-0.5 text-[9px] sm:text-[11px]">
                        ĐIỀU 1: NỘI DUNG VÀ HẠN MỨC ỦY THÁC
                      </h4>
                      <p className="text-[#12347a]/95">
                        Bên B tự nguyện ủy thác cho Bên A số tiền chính xác là: 
                        <strong className="text-[#1034a6] font-bold bg-[#1034a6]/5 px-1 rounded ml-1 border border-[#1034a6]/10">
                          {amount.toLocaleString('vi-VN')} VNĐ
                        </strong> (qua phương thức {paymentMethod}) để tiến hành đầu tư sinh lời đặc quyền vào dự án: 
                        <strong className="text-[#0f2b5c] font-semibold"> {projectDetails?.location}</strong> thuộc Hệ sinh thái Thượng lưu VinClub.
                      </p>
                      
                      <h4 className="font-bold text-[#0f2b5c] uppercase tracking-wider mt-4 mb-1 border-b border-[#12347a]/20 pb-0.5 text-[9px] sm:text-[11px]">
                        ĐIỀU 2: CHÍNH SÁCH PHÂN CHIA LỢI NHUẬN
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-[#12347a]/95">
                        <li>
                          Tỷ suất lợi nhuận cố định cam kết: <span className="text-[#1034a6] font-bold">{projectDetails?.profit}</span>.
                        </li>
                        <li>
                          Kỳ hạn hoàn trả vốn gốc và phân phối lợi nhuận: <span className="text-[#1034a6] font-bold">{projectDetails?.term}</span>.
                        </li>
                        <li>
                          Bên A chịu trách nhiệm tự động quyết toán lợi nhuận và hoàn gốc vào ví định danh của Bên B ngay sau khi kỳ hạn kết thúc.
                        </li>
                      </ul>

                      <h4 className="font-bold text-[#0f2b5c] uppercase tracking-wider mt-4 mb-1 border-b border-[#12347a]/20 pb-0.5 text-[9px] sm:text-[11px]">
                        ĐIỀU 3: CAM KẾT BẢO HỘ VÀ PHÁP LÝ
                      </h4>
                      <p className="text-[#12347a]/95">
                        Bên A cam kết bảo toàn 100% nguồn vốn ủy thác của Bên B thông qua Quỹ bảo trợ rủi ro của VinClub. 
                        Hợp đồng điện tử này được số hóa mã hóa bảo mật trên máy chủ và có giá trị pháp lý tương đương văn bản giấy kể từ thời điểm Bên B ký điện tử thành công.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 mt-6 sm:mt-10 pt-4 border-t border-[#12347a]/20 text-center text-[10px] sm:text-xs gap-4">
                      <div className="flex flex-col justify-between h-[150px] sm:h-[220px]">
                        <div>
                          <p className="font-bold text-[#0f2b5c] uppercase leading-tight text-[8px] sm:text-[10px]">
                            ĐẠI DIỆN BÊN A
                          </p>
                          <span className="text-[7.5px] sm:text-[9px] font-semibold block mt-1 text-[#12347a]/80 normal-case leading-tight">
                            PHÓ TỔNG GIÁM ĐỐC<br />ĐẠI DIỆN THEO PHÁP LUẬT
                          </span>
                        </div>
                        <div className="flex items-center justify-center relative mx-auto w-16 h-16 sm:w-24 sm:h-24 md:w-[100px] md:h-[120px] -my-1">
                          <VinpearlStamp className="h-full w-full object-contain" opacity="0.95" />
                        </div>
                        <p className="font-bold text-[#1034a6] uppercase tracking-wide text-[8px] sm:text-[10px]">VÕ THỊ PHƯƠNG THẢO</p>
                      </div>

                      <div className="flex flex-col justify-between h-[150px] sm:h-[220px]">
                        <div>
                          <p className="font-bold text-[#0f2b5c] uppercase leading-tight text-[8px] sm:text-[10px]">
                            ĐẠI DIỆN BÊN B
                          </p>
                          <span className="text-[7.5px] sm:text-[9px] font-semibold block mt-1 text-[#12347a]/80 normal-case leading-tight">
                            BÊN ỦY THÁC ĐẦU TƯ<br />(KÝ VÀ GHI RÕ HỌ TÊN)
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center min-h-[40px] sm:min-h-[60px] my-auto">
                          {hasSignature ? (
                            <ProgressiveImage 
                              src={signatureData} 
                              alt="Signature Preview" 
                              className="h-8 sm:h-14 w-auto object-contain rounded border border-neutral-200" 
                              style={{ backgroundColor: '#ffffff' }}
                            />
                          ) : (
                            <span className="text-[#12347a]/40 italic text-[8px] sm:text-[10px]">Chưa ký</span>
                          )}
                        </div>
                        <p className="font-bold text-[#1034a6] uppercase tracking-wide text-[8px] sm:text-[10px]">{userName || 'Thượng Khách VIP'}</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* FLOATING SIGNATURE BUTTON (ANCHORED RIGHT SIDE OF CONTRACT WINDOW) */}
                <button 
                  onClick={() => setShowSignatureDrawer(true)}
                  className={`absolute right-0 top-1/3 -translate-y-1/2 z-40 bg-gradient-to-b ${hasSignature ? 'from-emerald-500 to-teal-600' : 'from-[#e1b777] to-[#aa7c11]'} text-black rounded-l-2xl py-4.5 px-2 flex flex-col items-center gap-2 shadow-2xl active:scale-95 transition-all group cursor-pointer`}
                >
                  {hasSignature ? (
                    <CheckCircle className="w-4.5 h-4.5 text-white" />
                  ) : (
                    <FileSignature className="w-4.5 h-4.5 text-black" />
                  )}
                  <div className="flex flex-col items-center text-[9px] font-black tracking-widest text-black gap-0.5 leading-none">
                    <span>C</span>
                    <span>H</span>
                    <span>Ữ</span>
                    <span className="h-0.5"></span>
                    <span>K</span>
                    <span>Ý</span>
                  </div>
                </button>

                {/* SIGNATURE DRAWER OVERLAY */}
                <AnimatePresence>
                  {showSignatureDrawer && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-md bg-[#0c0c12] border border-[#e1b777]/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-left relative"
                      >
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <h3 className="text-sm font-bold text-[#e1b777] uppercase tracking-wider font-serif">Bảng ký điện tử</h3>
                          <button 
                            onClick={() => setShowSignatureDrawer(false)}
                            className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/5 cursor-pointer"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <p className="text-[11px] text-neutral-400 leading-normal">
                          Sử dụng ngón tay hoặc chuột vẽ chữ ký cá nhân vào khung dưới đây. Chữ ký này sẽ được nhúng trực tiếp vào Hợp đồng.
                        </p>

                        {/* Canvas container */}
                        <div className="relative w-full h-44 bg-white border border-[#e1b777]/40 rounded-xl overflow-hidden shadow-inner">
                          {useSavedSignature && userData?.signature_content ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white p-4">
                              <img 
                                src={userData.signature_content} 
                                alt="Registered Signature" 
                                className="max-w-full max-h-full object-contain mix-blend-multiply opacity-85"
                              />
                              <div className="absolute top-2 left-2 px-2 py-1 bg-[#1034a6]/10 rounded border border-[#1034a6]/20">
                                <span className="text-[9px] font-black text-[#1034a6] uppercase tracking-widest">Chữ ký hệ thống</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              {!hasSignature && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                                  <span className="text-neutral-400 font-serif italic text-xs">Ký tên tại đây</span>
                                </div>
                              )}
                              <canvas
                                ref={canvasRef}
                                width={360}
                                height={176}
                                className="w-full h-full cursor-crosshair touch-none bg-white"
                                onMouseDown={startDrawing}
                                onMouseUp={stopDrawing}
                                onMouseOut={stopDrawing}
                                onMouseMove={draw}
                                onTouchStart={startDrawing}
                                onTouchEnd={stopDrawing}
                                onTouchMove={draw}
                              />
                            </>
                          )}
                        </div>

                        {/* Action button options */}
                        <div className="flex justify-between items-center">
                          {userData?.signature_content && (
                            <button
                              onClick={() => {
                                if (useSavedSignature) {
                                  setUseSavedSignature(false);
                                  setHasSignature(false);
                                  setSignatureData('');
                                } else {
                                  setUseSavedSignature(true);
                                  setHasSignature(true);
                                  setSignatureData(userData.signature_content);
                                }
                              }}
                              className="text-[10px] font-bold text-[#e1b777] hover:text-[#c59e62] uppercase tracking-wider py-1 px-2 rounded hover:bg-white/5 cursor-pointer"
                            >
                              {useSavedSignature ? "✍️ Vẽ chữ ký mới" : "📁 Dùng chữ ký hệ thống"}
                            </button>
                          )}
                          {!useSavedSignature && (
                            <button 
                              onClick={clearSignature}
                              disabled={!hasSignature || isSubmitting}
                              className="flex items-center gap-1.5 text-neutral-500 hover:text-[#e1b777] disabled:opacity-30 text-[10px] uppercase tracking-wider font-bold transition-colors py-1 px-2 rounded hover:bg-white/5 cursor-pointer"
                            >
                              <RotateCcw size={10} /> Vẽ lại
                            </button>
                          )}
                        </div>

                        {/* Drawer footer buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 mt-2">
                          <button
                            onClick={() => {
                              setShowSignatureDrawer(false);
                            }}
                            className="py-2.5 bg-[#14141f] border border-white/5 text-neutral-300 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer"
                          >
                            Đóng
                          </button>
                          <button
                            onClick={() => {
                              if (hasSignature && signatureData) {
                                setShowSignatureDrawer(false);
                              } else {
                                alert("Vui lòng thực hiện ký tên trước khi xác nhận!");
                              }
                            }}
                            disabled={!hasSignature}
                            className="py-2.5 bg-gradient-to-r from-[#e1b777] to-[#c59e62] text-black disabled:from-neutral-800 disabled:text-neutral-500 font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            Xác nhận chữ ký
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sticky Action Footer Bar */}
                <div className="p-4 border-t border-[#e1b777]/10 bg-[#0c0c12]/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 z-20">
                  <div className="text-left w-full sm:w-auto">
                    <p className="text-[10px] text-neutral-400">Trạng thái hợp đồng:</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${hasSignature ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className={`text-[11px] font-bold ${hasSignature ? 'text-green-400' : 'text-red-400'}`}>
                        {hasSignature ? 'Chữ ký điện tử hợp lệ' : 'Đang chờ ký điện tử'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => setStep(1)}
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-[#14141f] hover:bg-white/5 text-neutral-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all border border-white/5 active:scale-95"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={handleConfirmInvestment}
                      disabled={!hasSignature || isSubmitting}
                      className="flex-2 sm:flex-none px-8 py-2.5 bg-gradient-to-r from-[#e1b777] to-[#c59e62] hover:from-[#c59e62] hover:to-[#e1b777] disabled:from-neutral-800 disabled:to-neutral-900 text-black disabled:text-neutral-500 font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_20px_rgba(225,183,119,0.2)] disabled:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <FileCheck size={14} /> Ký & Đầu Tư
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

            {/* STEP 3: Success Screen / Receipt */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-3 sm:p-8 flex flex-col items-center justify-start overflow-y-auto space-y-4 sm:space-y-6 flex-1 bg-[#07070a] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl scale-125 animate-pulse" />
                  <div className="relative w-14 h-14 bg-gradient-to-b from-[#e1b777] to-[#c59e62] rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-8 h-8 text-black stroke-[2.5]" />
                  </div>
                </div>

                <div className="space-y-1 max-w-md shrink-0 text-center">
                  <h3 className="text-base sm:text-xl font-serif font-bold text-[#e1b777] tracking-wider uppercase">
                    Ủy Thác Thành Công!
                  </h3>
                  <p className="text-[10px] sm:text-xs text-neutral-400">
                    Giao dịch của Thượng khách đã được ghi nhận trên hệ thống điện tử.
                  </p>
                </div>

                {/* GORGEOUS PREMIUM RECEIPT CARD */}
                <div className="w-full max-w-md bg-white text-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative font-sans flex flex-col border border-neutral-200 shrink-0">
                  {/* Decorative side notches for receipt look */}
                  <div className="absolute left-[-8px] top-[140px] w-4 h-4 bg-[#07070a] rounded-full border border-neutral-200 z-10" />
                  <div className="absolute right-[-8px] top-[140px] w-4 h-4 bg-[#07070a] rounded-full border border-neutral-200 z-10" />

                  {/* Receipt Header */}
                  <div className="bg-gradient-to-b from-[#0c0c12] to-[#121218] p-5 text-center text-white border-b border-dashed border-neutral-300 relative">
                    <div className="flex justify-center mb-2">
                      <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[9px] font-black uppercase text-[#e1b777] tracking-widest">
                        BIÊN LAI ĐIỆN TỬ
                      </div>
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest font-serif text-[#e1b777]">HỆ THỐNG VINCLUB VIP</h4>
                    <p className="text-[8px] font-mono text-neutral-400 mt-1 uppercase">MÃ GIAO DỊCH: TX-{contractId.split('-')[1] || '8899'}</p>
                  </div>

                  {/* Receipt Body */}
                  <div className="p-5 space-y-3.5 text-[11px] sm:text-xs bg-[#fbfbfe] text-left">
                    <div className="space-y-1.5 pb-3 border-b border-neutral-200/60">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Khách hàng:</span>
                        <span className="font-bold text-neutral-900 uppercase">{userName}</span>
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

                    <div className="space-y-1.5 pb-3 border-b border-neutral-200/60">
                      <div className="flex justify-between items-start">
                        <span className="text-neutral-500">Hạng mục ủy thác:</span>
                        <span className="font-bold text-neutral-900 text-right max-w-[200px] leading-tight">{projectDetails?.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Mã hợp đồng:</span>
                        <span className="font-mono text-neutral-700 font-semibold">{contractId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Thời hạn đầu tư:</span>
                        <span className="font-bold text-neutral-900">{projectDetails?.term}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Lãi suất cố định:</span>
                        <span className="font-bold text-[#1034a6] bg-[#1034a6]/5 px-1.5 py-0.5 rounded">{projectDetails?.profit}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pb-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Phương thức thanh toán:</span>
                        <span className="font-bold text-neutral-900">{paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Điểm thưởng nhận được:</span>
                        <span className="font-bold text-emerald-600">+{Math.floor(amount * 0.01).toLocaleString('vi-VN')} Điểm VIP</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-neutral-600 font-bold text-xs uppercase">TỔNG TIỀN ỦY THÁC:</span>
                        <span className="font-mono text-base sm:text-lg font-black text-[#a63c3c]">
                          {amount.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    </div>

                    {/* Stamp and Digital Signature */}
                    <div className="pt-3 border-t border-dashed border-neutral-300 flex items-center justify-between gap-4">
                      <div className="text-left">
                        <span className="text-[8px] text-neutral-400 block uppercase font-mono leading-none">Chữ ký điện tử:</span>
                        <div className="h-10 mt-1 flex items-center justify-start bg-white border border-neutral-100 rounded px-2 w-28">
                          <img 
                            src={signatureData} 
                            alt="Signature" 
                            className="max-h-full max-w-full object-contain" 
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* QR Representation */}
                        <div className="w-11 h-11 bg-white border border-neutral-200 rounded p-1 flex items-center justify-center shadow-sm">
                          <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-90">
                            {[...Array(16)].map((_, i) => (
                              <div key={i} className={`rounded-[1px] ${ (i * 7 + 3) % 4 === 0 || i % 2 === 0 ? 'bg-neutral-800' : 'bg-transparent' }`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Footer */}
                  <div className="bg-[#121218] p-3 text-center text-white/50 text-[8px] tracking-wider uppercase font-mono">
                    Chứng thực số hóa bởi VinClub Security Gateway
                  </div>
                </div>

                <div className="pt-2 w-full max-w-xs shrink-0">
                  <button 
                    onClick={onClose}
                    className="w-full py-3 bg-gradient-to-r from-[#e1b777] to-[#c59e62] hover:from-[#c59e62] hover:to-[#e1b777] text-black font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Hoàn tất giao dịch
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}
