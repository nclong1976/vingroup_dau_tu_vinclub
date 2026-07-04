import ProgressiveImage from './ProgressiveImage';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, Briefcase, Trophy, ShoppingCart, Disc, TrendingUp, 
  X, Check, Clipboard, Calculator, Sparkles, Building2, 
  HelpCircle, ArrowRight, Star, RefreshCw, Award, Play,
  ChevronLeft, Home, Target, Trash2, Heart, Plane, UtensilsCrossed, Ticket, ShoppingBag
} from 'lucide-react';

interface QuickMenuGridProps {
  points: number;
  onUpdatePoints: (newPoints: number) => void;
  userName: string;
  onInvestClick?: () => void;
  userRank?: string;
}

export default function QuickMenuGrid({ points, onUpdatePoints, userName, onInvestClick, userRank }: QuickMenuGridProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // 1. Consultation Form States
  const [consultName, setConsultName] = useState(userName);
  const [consultPhone, setConsultPhone] = useState("");
  const [consultType, setConsultType] = useState("Đầu tư tài chính");
  const [consultMessage, setConsultMessage] = useState("");
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  // 2. Privilege Vouchers States
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 3. Goal Tracker States
  const [goalsList, setGoalsList] = useState([
    { id: '1', title: 'Quỹ hưu trí', saved: 125000000, target: 500000000, color: '#a27b43' },
    { id: '2', title: 'Du lịch châu Âu', saved: 35000000, target: 80000000, color: '#3b82f6' },
    { id: '3', title: 'Mua xe hơi', saved: 180000000, target: 600000000, color: '#10b981' }
  ]);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalSaved, setNewGoalSaved] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalColor, setNewGoalColor] = useState("#a27b43");
  const [claimedPrivilege, setClaimedPrivilege] = useState<string | null>(null);

  const totalSaved = goalsList.reduce((acc, curr) => acc + curr.saved, 0);
  const totalTarget = goalsList.reduce((acc, curr) => acc + curr.target, 0);
  const overallPercent = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : "0.0";

  // 4. Products States
  const [selectedProduct, setSelectedProduct] = useState<string>('VGF');
  const [investPoints, setInvestPoints] = useState<number>(10000);
  const [investTerm, setInvestTerm] = useState<number>(3); // years

  // 5. Lucky Wheel States
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [spinPointsWon, setSpinPointsWon] = useState<number>(0);
  const [hasSpunThisSession, setHasSpunThisSession] = useState(false);

  // 6. Reasons to Invest States
  const [activeReasonTab, setActiveReasonTab] = useState<number>(0);

  const menuItems = [
    { id: 'consult', label: 'Tham vấn phúc lợi', icon: Gift, color: 'from-amber-400 to-yellow-600' },
    { id: 'privileges', label: 'Ưu đãi phúc lợi', icon: Briefcase, color: 'from-yellow-500 to-amber-600' },
    { id: 'goals', label: 'Mục tiêu', icon: Trophy, color: 'from-amber-500 to-rose-600' },
    { id: 'products', label: 'Sản phẩm', icon: ShoppingCart, color: 'from-yellow-400 to-amber-500' },
    { id: 'wheel', label: 'Vòng quay may mắn', icon: Disc, color: 'from-amber-600 to-yellow-500' },
    { id: 'reasons', label: 'Lý do nên đầu tư', icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
  ];

  // Copy code handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalTarget) return;
    const targetVal = parseFloat(newGoalTarget.replace(/[^0-9]/g, '')) || 0;
    const savedVal = parseFloat(newGoalSaved.replace(/[^0-9]/g, '')) || 0;
    if (targetVal <= 0) return;
    const newGoal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      saved: savedVal,
      target: targetVal,
      color: newGoalColor
    };
    setGoalsList([...goalsList, newGoal]);
    setShowAddGoalForm(false);
    setNewGoalTitle("");
    setNewGoalSaved("");
    setNewGoalTarget("");
  };

  const handleDeleteGoal = (id: string) => {
    setGoalsList(goalsList.filter(g => g.id !== id));
  };

  // Submit consultation handler
  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultPhone) return;
    setConsultSubmitted(true);
    setTimeout(() => {
      // simulate response
    }, 1000);
  };

  // Spin Lucky Wheel handler
  const handleSpinWheel = () => {
    const normalizedRank = (userRank || "").toUpperCase();
    const isGoldOrHigher = 
      normalizedRank.includes("GOLD") || 
      normalizedRank.includes("VÀNG") || 
      normalizedRank.includes("PLATINUM") || 
      normalizedRank.includes("BẠCH KIM") || 
      normalizedRank.includes("DIAMOND") || 
      normalizedRank.includes("KIM CƯƠNG");
      
    if (!isGoldOrHigher) {
      alert("Đặc quyền Vòng quay may mắn chỉ dành cho Hội viên hạng VÀNG / GOLD trở lên!");
      return;
    }

    if (isSpinning) return;
    setIsSpinning(true);
    setSpinResult(null);

    // Pick a random prize slice out of 8 slices
    const prizes = [
      { text: '+5,000 VND', value: 5000 },
      { text: 'Voucher Vinpearl 20%', value: 0 },
      { text: '+1,000 VND', value: 1000 },
      { text: 'Double VND!', value: 0 },
      { text: '+2,500 VND', value: 2500 },
      { text: 'Voucher VinFast 10M', value: 0 },
      { text: '+500 VND', value: 500 },
      { text: 'Lucky Box', value: 0 }
    ];

    const randomIndex = Math.floor(Math.random() * prizes.length);
    const degreesPerSlice = 360 / prizes.length;
    // Calculate final spin angle
    // Ensure at least 5 complete rotations (1800 deg) plus the alignment to selected slice
    const totalSpinDeg = 1800 + (360 - randomIndex * degreesPerSlice) - (degreesPerSlice / 2);
    
    setSpinAngle(totalSpinDeg);

    setTimeout(() => {
      setIsSpinning(false);
      const chosenPrize = prizes[randomIndex];
      setSpinResult(chosenPrize.text);
      setSpinPointsWon(chosenPrize.value);
      setHasSpunThisSession(true);

      if (chosenPrize.value > 0) {
        onUpdatePoints(points + chosenPrize.value);
      }
    }, 4500); // Decelerating animation duration
  };

  // Investment product ROI math helper
  const calculateROI = () => {
    const rates: Record<string, number> = { VGF: 0.115, VGB: 0.132, VRB: 0.098 };
    const rate = rates[selectedProduct] || 0.10;
    const finalAmount = Math.round(investPoints * Math.pow(1 + rate, investTerm));
    const profit = finalAmount - investPoints;
    return { finalAmount, profit, percentage: Math.round((finalAmount / investPoints - 1) * 100) };
  };

  return (
    <div id="quick-menu-grid" className="w-full mt-4">
      {/* 3x2 Grid styled precisely like the user's reference image with luxurious light theme */}
      <div className="grid grid-cols-3 gap-y-6 gap-x-3 text-center rounded-[24px] bg-transparent" style={{ marginLeft: '0px', marginTop: '-90px' }}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveModal(item.id);
                setConsultSubmitted(false);
                setSpinResult(null);
                setSpinAngle(0);
              }}
              className="group flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all focus:outline-none"
            >
              {/* Outer icon circular background with clean golden gradient glow */}
              <div className="relative w-11 h-11 rounded-full flex items-center justify-center bg-neutral-50 border border-neutral-200/60 group-hover:border-[#b08953]/50 group-hover:bg-white group-hover:shadow-[0_0_15px_rgba(176,137,83,0.15)] transition-all duration-300">
                <IconComponent 
                  className={`w-5.5 h-5.5 text-[#b08953] group-hover:scale-110 transition-all duration-300 ${item.id === 'wheel' && isSpinning ? 'animate-spin' : ''}`} 
                  strokeWidth={1.5}
                />
              </div>
              
              {/* Label below icon */}
              <span className="text-[10px] font-sans font-medium text-neutral-700 group-hover:text-[#b08953] tracking-wide mt-2.5 leading-tight select-none max-w-[100px] transition-colors">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* FULLSCREEN POPUP MODALS OVERLAYS */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
            onClick={() => {
              if (!isSpinning) setActiveModal(null);
            }}
          >
            {/* Modal Body Card - Bright Luxury Theme */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[370px] bg-white border border-neutral-200 rounded-[28px] overflow-hidden shadow-2xl p-5 text-left mb-16 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gold Ambient Orbs inside modal */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#b08953]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => {
                  if (!isSpinning) setActiveModal(null);
                }}
                disabled={isSpinning}
                className="absolute top-4 right-4 w-11 h-11 rounded-full bg-neutral-100/80 hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-all cursor-pointer active:scale-95 disabled:opacity-50 z-50"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Content Switch */}
              
              {/* 1. WELFARE CONSULTATION MODAL */}
              {activeModal === 'consult' && (
                <div className="flex flex-col h-full font-sans">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#b08953]/10 border border-[#b08953]/20 rounded-xl">
                      <Gift className="w-5 h-5 text-[#b08953]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Tham vấn phúc lợi</h3>
                      <p className="text-[10px] text-neutral-400">Trợ lý tư vấn VIP dành riêng cho bạn</p>
                    </div>
                  </div>

                  {!consultSubmitted ? (
                    <form onSubmit={handleConsultSubmit} className="space-y-3.5">
                      <div>
                        <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono font-bold block mb-1">Thành viên</label>
                        <input
                          type="text"
                          value={consultName}
                          onChange={(e) => setConsultName(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-800 font-medium focus:outline-none focus:border-[#b08953]"
                          placeholder="Họ và tên..."
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono font-bold block mb-1">Số điện thoại liên hệ</label>
                        <input
                          type="tel"
                          value={consultPhone}
                          onChange={(e) => setConsultPhone(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-800 font-medium focus:outline-none focus:border-[#b08953]"
                          placeholder="Nhập số điện thoại..."
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono font-bold block mb-1">Nội dung quan tâm</label>
                        <select
                          value={consultType}
                          onChange={(e) => setConsultType(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-800 font-medium focus:outline-none focus:border-[#b08953]"
                        >
                          <option value="Đầu tư tài chính">Đầu tư tích lũy VinPoints</option>
                          <option value="Đặc quyền nghỉ dưỡng">Đặc quyền nghỉ dưỡng Vinpearl Luxury</option>
                          <option value="Sản phẩm y tế Vinmec">Gói chăm sóc y tế VIP Vinmec</option>
                          <option value="Bất động sản Vinhomes">Biệt thự nghỉ dưỡng Vinhomes</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono font-bold block mb-1">Lời nhắn (Không bắt buộc)</label>
                        <textarea
                          value={consultMessage}
                          onChange={(e) => setConsultMessage(e.target.value)}
                          rows={2}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-800 font-medium focus:outline-none focus:border-[#b08953] resize-none"
                          placeholder="Thời gian trợ lý có thể gọi cho bạn..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-[#b08953] hover:bg-[#98723c] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-transform active:scale-95 shadow-md cursor-pointer"
                      >
                        Gửi yêu cầu tham vấn
                      </button>
                    </form>
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-6 flex flex-col items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                        <Check className="w-6 h-6" strokeWidth={3} />
                      </div>
                      <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">Gửi yêu cầu thành công</h4>
                      <p className="text-[11px] text-neutral-500 px-4 leading-relaxed mb-5">
                        Trợ lý cá nhân chuyên trách VinClub sẽ liên hệ với Thượng khách qua số <strong className="text-amber-700">{consultPhone}</strong> trong vòng 15 phút.
                      </p>
                      <button
                        onClick={() => setActiveModal(null)}
                        className="px-5 py-2 bg-neutral-50 border border-neutral-200 text-neutral-700 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:border-[#b08953] transition-colors"
                      >
                        Đã hiểu
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* 2. WELFARE PRIVILEGES MODAL */}
              {activeModal === 'privileges' && (
                <div className="flex flex-col h-full font-sans max-h-[75vh]">
                  {/* Custom Header matching the design */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4 shrink-0">
                    <button 
                      onClick={() => {
                        if (claimedPrivilege) {
                          setClaimedPrivilege(null);
                        } else {
                          setActiveModal(null);
                        }
                      }} 
                      className="p-1.5 hover:bg-neutral-100 rounded-full cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-neutral-600" />
                    </button>
                    <span className="text-sm font-black text-neutral-800 tracking-wide">Ưu đãi phúc lợi</span>
                    <button 
                      onClick={() => setActiveModal(null)} 
                      className="p-1.5 hover:bg-neutral-100 rounded-full cursor-pointer transition-colors"
                    >
                      <Home className="w-4.5 h-4.5 text-neutral-600" />
                    </button>
                  </div>

                  {claimedPrivilege ? (
                    /* PROMPT FOR CLAIMED VOUCHER */
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-6 flex flex-col items-center shrink-0"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                        <Check className="w-6 h-6 stroke-[3px]" />
                      </div>
                      <h4 className="text-xs font-black text-neutral-800 uppercase tracking-widest mb-1.5">Nhận ưu đãi thành công</h4>
                      <p className="text-[10px] text-neutral-500 px-4 leading-relaxed mb-5">
                        Trợ lý chuyên trách VIP của VinClub đã ghi nhận yêu cầu nhận ưu đãi <strong>{claimedPrivilege}</strong> của Thượng khách. Chúng tôi sẽ phản hồi trong mục hỗ trợ hoặc gọi trực tiếp trong giây lát.
                      </p>
                      <button
                        onClick={() => setClaimedPrivilege(null)}
                        className="px-5 py-2.5 bg-[#a27b43] text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#866330] shadow transition-colors"
                      >
                        Xác nhận
                      </button>
                    </motion.div>
                  ) : (
                    /* GRID OF VOUCHERS */
                    <div className="overflow-y-auto space-y-4 pr-1 flex-1 pb-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-amber-500/20">
                      {/* Top Golden/Brown VIP privileges banner */}
                      <div className="bg-gradient-to-br from-[#a27b43] to-[#866330] rounded-3xl p-5 text-white shadow-lg relative overflow-hidden flex items-center gap-4">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="p-3 bg-white/10 rounded-2xl border border-white/10 shrink-0">
                          <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider mb-1">Đặc quyền thành viên VIP</h4>
                          <p className="text-[9.5px] text-amber-100/80 leading-relaxed font-medium">
                            Tận hưởng hàng trăm ưu đãi độc quyền từ hệ sinh thái VinGroup.
                          </p>
                        </div>
                      </div>

                      {/* Benefits Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            id: "1",
                            title: "Giảm 30% Vinpearl",
                            icon: Plane,
                            iconColor: "text-blue-600 bg-blue-50 border border-blue-100/50",
                            sub: "Áp dụng cho phòng deluxe trở đi",
                            tag: "HOT",
                          },
                          {
                            id: "2",
                            title: "Voucher 500K",
                            icon: ShoppingBag,
                            iconColor: "text-emerald-600 bg-emerald-50 border border-emerald-100/50",
                            sub: "Sân thương mại VinMart",
                            tag: "MỚI",
                          },
                          {
                            id: "3",
                            title: "Buffet 2-for-1",
                            icon: UtensilsCrossed,
                            iconColor: "text-amber-600 bg-amber-50 border border-amber-100/50",
                            sub: "Nhà hàng VinDining",
                            tag: "",
                          },
                          {
                            id: "4",
                            title: "vé Casino 5 sao",
                            icon: Ticket,
                            iconColor: "text-purple-600 bg-purple-50 border border-purple-100/50",
                            sub: "Corona Casino Phú Quốc",
                            tag: "VIP",
                          },
                          {
                            id: "5",
                            title: "Khám sức khỏe MIỄN PHÍ",
                            icon: Heart,
                            iconColor: "text-rose-600 bg-rose-50 border border-rose-100/50",
                            sub: "VinmecCare gói toàn diện",
                            tag: "",
                          },
                          {
                            id: "6",
                            title: "Quà sinh nhật",
                            icon: Gift,
                            iconColor: "text-pink-600 bg-pink-50 border border-pink-100/50",
                            sub: "Voucher 1 triệu đồng",
                            tag: "",
                          }
                        ].map((item) => {
                          const IconComp = item.icon;
                          return (
                            <div 
                              key={item.id}
                              className="bg-white border border-neutral-100 rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative group hover:border-[#a27b43]/30 transition-colors"
                            >
                              {/* Tag on top right */}
                              {item.tag && (
                                <span className="absolute top-3.5 right-3.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md">
                                  {item.tag}
                                </span>
                              )}

                              <div>
                                {/* Icon container */}
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3.5 ${item.iconColor}`}>
                                  <IconComp className="w-4.5 h-4.5" />
                                </div>

                                <h5 className="text-[11.5px] font-black text-neutral-800 leading-tight mb-1">
                                  {item.title}
                                </h5>
                                <p className="text-[9.5px] text-neutral-400 font-medium leading-snug mb-4">
                                  {item.sub}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => setClaimedPrivilege(item.title)}
                                className="w-full py-2 bg-neutral-50 hover:bg-[#a27b43] text-neutral-600 hover:text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                              >
                                Nhận ngay
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. GOALS TRACKER MODAL */}
              {activeModal === 'goals' && (
                <div className="flex flex-col h-full font-sans max-h-[75vh]">
                  {/* Custom Header matching the design */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4 shrink-0">
                    <button 
                      onClick={() => {
                        if (showAddGoalForm) {
                          setShowAddGoalForm(false);
                        } else {
                          setActiveModal(null);
                        }
                      }} 
                      className="p-1.5 hover:bg-neutral-100 rounded-full cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-neutral-600" />
                    </button>
                    <span className="text-sm font-black text-neutral-800 tracking-wide">Mục tiêu</span>
                    <button 
                      onClick={() => setActiveModal(null)} 
                      className="p-1.5 hover:bg-neutral-100 rounded-full cursor-pointer transition-colors"
                    >
                      <Home className="w-4.5 h-4.5 text-neutral-600" />
                    </button>
                  </div>

                  {showAddGoalForm ? (
                    /* ADD GOAL FORM */
                    <form onSubmit={handleAddGoal} className="space-y-4 py-2 shrink-0">
                      <h4 className="text-xs font-black text-neutral-800 uppercase tracking-widest">Thêm mục tiêu mới</h4>
                      
                      <div>
                        <label className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Tên mục tiêu</label>
                        <input
                          type="text"
                          required
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                          placeholder="ví dụ: Mua xe hơi, Quỹ hưu trí..."
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#a27b43]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Số tiền mục tiêu (VNĐ)</label>
                          <input
                            type="text"
                            required
                            value={newGoalTarget}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setNewGoalTarget(val ? parseInt(val).toLocaleString() : '');
                            }}
                            placeholder="600.000.000"
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#a27b43]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Đã tiết kiệm (VNĐ)</label>
                          <input
                            type="text"
                            value={newGoalSaved}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setNewGoalSaved(val ? parseInt(val).toLocaleString() : '');
                            }}
                            placeholder="180.000.000"
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#a27b43]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-1.5">Màu sắc hiển thị</label>
                        <div className="flex gap-3">
                          {[
                            { color: '#a27b43', name: 'Đồng vàng' },
                            { color: '#3b82f6', name: 'Xanh lam' },
                            { color: '#10b981', name: 'Xanh lục' },
                            { color: '#ef4444', name: 'Đỏ' },
                            { color: '#8b5cf6', name: 'Tím' }
                          ].map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => setNewGoalColor(c.color)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${newGoalColor === c.color ? 'border-neutral-800 scale-110 shadow' : 'border-transparent hover:scale-105'}`}
                              style={{ backgroundColor: c.color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddGoalForm(false)}
                          className="flex-1 py-2.5 bg-neutral-100 text-neutral-600 font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-neutral-200"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-[#a27b43] text-white font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#866330] shadow-md"
                        >
                          Thêm
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* LIST OF GOALS */
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="overflow-y-auto space-y-3.5 pr-1 flex-1 pb-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-amber-500/20">
                        {/* A. OVERVIEW CARD */}
                        <div className="bg-white border border-neutral-100 rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-[#a27b43]/10 rounded-lg">
                              <Target className="w-4 h-4 text-[#a27b43]" />
                            </div>
                            <span className="text-xs font-black text-neutral-800">Tổng quan</span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500">
                              <span>Tiến độ chung</span>
                              <span className="text-[#a27b43] font-extrabold">{overallPercent}%</span>
                            </div>

                            {/* Progress bar track */}
                            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/50">
                              <div 
                                className="h-full rounded-full transition-all duration-700" 
                                style={{ 
                                  width: `${Math.min(parseFloat(overallPercent), 100)}%`,
                                  backgroundColor: '#a27b43'
                                }} 
                              />
                            </div>

                            <div className="pt-2.5 space-y-1.5 border-t border-neutral-50 text-[10px] font-bold">
                              <div className="flex justify-between">
                                <span className="text-neutral-400">Đã tiết kiệm</span>
                                <span className="text-neutral-800">{totalSaved.toLocaleString()} VNĐ</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-400">Mục tiêu</span>
                                <span className="text-neutral-800">{totalTarget.toLocaleString()} VNĐ</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* B. LIST CARDS */}
                        <div className="space-y-3">
                          {goalsList.map((g) => {
                            const percent = g.target > 0 ? ((g.saved / g.target) * 100).toFixed(1) : "0.0";
                            return (
                              <div 
                                key={g.id}
                                className="bg-white border border-neutral-100 rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative group hover:border-[#a27b43]/30 transition-colors"
                              >
                                <div className="flex justify-between items-center mb-2.5">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                                      style={{ backgroundColor: g.color }}
                                    />
                                    <span className="text-xs font-black text-neutral-800 leading-tight">{g.title}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteGoal(g.id)}
                                    className="p-1 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-[9px] font-bold text-neutral-400 font-mono">
                                    <span>{g.saved.toLocaleString()} VNĐ</span>
                                    <span>{g.target.toLocaleString()} VNĐ</span>
                                  </div>

                                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-700" 
                                      style={{ 
                                        width: `${Math.min(parseFloat(percent), 100)}%`,
                                        backgroundColor: g.color 
                                      }}
                                    />
                                  </div>

                                  <div className="text-right">
                                    <span 
                                      className="text-[10px] font-black font-mono"
                                      style={{ color: g.color }}
                                    >
                                      {percent}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* C. ADD GOAL DOTTED BUTTON */}
                      <button
                        onClick={() => setShowAddGoalForm(true)}
                        className="w-full py-3.5 border border-dashed border-neutral-300 bg-neutral-50/50 rounded-2xl flex items-center justify-center gap-1.5 text-neutral-500 text-xs font-extrabold hover:bg-neutral-100 hover:border-neutral-400 transition-all cursor-pointer shrink-0"
                      >
                        <span>+ Thêm mục tiêu</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 4. PRODUCTS MODAL */}
              {activeModal === 'products' && (
                <div className="flex flex-col h-full font-sans -mx-4 -mt-2">
                  <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 px-4 gap-4 h-[400px] items-center">
                    {[
                      { 
                        id: 'QTT', 
                        name: 'Quỹ Phát Triển Thể Dục Thể Thao (Sân Vận Động Trống Đồng)', 
                        rate: '1.50 %', 
                        duration: '8640 phút', 
                        min: '5 Tỷ', 
                        scale: '40.000.000.000 VNĐ', 
                        progress: 87,
                        img: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=600&auto=format&fit=crop'
                      },
                      { 
                        id: 'QNX', 
                        name: 'Quỹ Năng Lượng Xanh (VinFast)', 
                        rate: '2.10 %', 
                        duration: '14400 phút', 
                        min: '1 Tỷ', 
                        scale: '100.000.000.000 VNĐ', 
                        progress: 64,
                        img: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?q=80&w=600&auto=format&fit=crop'
                      },
                      { 
                        id: 'QBD', 
                        name: 'Quỹ Bất Động Sản (Khu Đô Thị Vinhomes)', 
                        rate: '1.80 %', 
                        duration: '21600 phút', 
                        min: '2 Tỷ', 
                        scale: '80.000.000.000 VNĐ', 
                        progress: 42,
                        img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop'
                      }
                    ].map((p) => (
                      <div key={p.id} className="snap-center shrink-0 w-[300px] bg-white rounded-xl border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col h-full">
                        <div className="h-[140px] w-full shrink-0 relative">
                          <ProgressiveImage src={p.img} alt={p.name} className="w-full h-full" imgClassName="object-cover" />
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          <div className="flex gap-2.5 mb-3">
                            <div className="w-1.5 rounded-full bg-[#a32a2a] shrink-0" />
                            <h3 className="text-[13px] font-bold text-[#1a202c] leading-snug">{p.name}</h3>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-center mb-3">
                            <div className="flex flex-col">
                              <span className="text-[14px] font-black text-[#a32a2a] mb-1">{p.rate}</span>
                              <span className="text-[9px] text-[#718096]">Lãi suất hàng ngày</span>
                            </div>
                            <div className="flex flex-col border-x border-neutral-200 px-1">
                              <span className="text-[14px] font-black text-[#a32a2a] mb-1">{p.duration}</span>
                              <span className="text-[9px] text-[#718096]">Thời hạn của dự án</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[14px] font-black text-[#a32a2a] mb-1">{p.min}</span>
                              <span className="text-[9px] text-[#718096]">Số tiền bắt đầu</span>
                            </div>
                          </div>
                          
                          <div className="w-full h-[1px] bg-neutral-100 mb-3" />
                          
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-semibold text-[#4a5568]">Quy mô dự án:</span>
                            <span className="text-[12px] font-bold text-[#1a202c]">{p.scale}</span>
                          </div>
                          <div className="text-[10px] text-[#718096] mb-auto">
                            Hoàn lãi hàng ngày, trả gốc khi đáo hạn
                          </div>
                          
                          <div className="mt-4">
                            <button 
                              onClick={() => onInvestClick?.()}
                              className="w-full bg-[#a98f68] hover:bg-[#907954] active:bg-[#7e6949] text-white font-bold text-[13px] py-2.5 rounded-xl transition-colors mb-3 shadow-md cursor-pointer"
                            >
                              Gửi tiền ngay
                            </button>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-[#4a5568]">Tiến độ:</span>
                              <div className="flex-grow h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#a98f68] rounded-full" style={{ width: `${p.progress}%` }} />
                              </div>
                              <span className="text-[11px] font-bold text-[#1a202c]">{p.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <style>{`
                    .hide-scrollbar::-webkit-scrollbar {
                      display: none;
                    }
                    .hide-scrollbar {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}</style>
                </div>
              )}

              {/* 5. LUCKY WHEEL MODAL */}
              {activeModal === 'wheel' && (
                <div className="flex flex-col h-full font-sans items-center">
                  <div className="w-full flex items-center gap-3 mb-4 text-left">
                    <div className="p-2 bg-[#b08953]/10 border border-[#b08953]/20 rounded-xl">
                      <Disc className="w-5 h-5 text-[#b08953]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Vòng quay may mắn</h3>
                      <p className="text-[10px] text-neutral-400">Quay để trúng hàng nghìn điểm VinPoints đặc quyền</p>
                    </div>
                  </div>

                  {/* Visual Spinning Wheel UI */}
                  <div className="relative w-64 h-64 mt-2 flex items-center justify-center">
                    {/* Golden indicator arrow pointer */}
                    <div className="absolute top-[-8px] z-20 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-[#b08953] filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" />

                    {/* Wheel circular body */}
                    <div 
                      className="w-full h-full rounded-full border-4 border-[#b08953] shadow-[0_0_40px_rgba(176,137,83,0.15)] relative overflow-hidden flex items-center justify-center"
                      style={{ 
                        transform: `rotate(${spinAngle}deg)`,
                        transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none',
                        background: 'conic-gradient(#faf9f6 0deg, #f0ede6 45deg, #f0ede6 45deg, #faf9f6 90deg, #faf9f6 90deg, #f0ede6 135deg, #f0ede6 135deg, #faf9f6 180deg, #faf9f6 180deg, #f0ede6 225deg, #f0ede6 225deg, #faf9f6 270deg, #faf9f6 270deg, #f0ede6 315deg, #f0ede6 315deg, #faf9f6 360deg)'
                      }}
                    >
                      {/* Wheel Inner divider lines and texts */}
                      {[
                        { text: "+5,000 VND", deg: 0, color: "text-[#b08953]" },
                        { text: "Vinpearl 20%", deg: 45, color: "text-neutral-700" },
                        { text: "+1,000 VND", deg: 90, color: "text-[#b08953]" },
                        { text: "Double VND!", deg: 135, color: "text-amber-700" },
                        { text: "+2,500 VND", deg: 180, color: "text-[#b08953]" },
                        { text: "VinFast 10M", deg: 225, color: "text-neutral-700" },
                        { text: "+500 VND", deg: 270, color: "text-[#b08953]" },
                        { text: "Lucky Box", deg: 315, color: "text-neutral-500" }
                      ].map((slice, i) => (
                        <div 
                          key={i}
                          className="absolute w-full h-full flex items-start justify-center pt-4"
                          style={{ transform: `rotate(${slice.deg}deg)` }}
                        >
                          <div className="absolute w-0.5 h-1/2 bg-[#b08953]/10 origin-bottom bottom-1/2" />
                          <span className={`text-[8.5px] font-black uppercase tracking-wider font-mono ${slice.color} transform rotate-90 origin-center translate-y-6 mt-1`}>
                            {slice.text}
                          </span>
                        </div>
                      ))}

                      {/* Concentric rings to make it luxurious */}
                      <div className="absolute inset-8 rounded-full border border-[#b08953]/10 pointer-events-none" />
                      <div className="absolute inset-16 rounded-full border border-[#b08953]/5 pointer-events-none" />
                    </div>

                    {/* Central Gold SPIN Button */}
                    <button
                      onClick={handleSpinWheel}
                      disabled={isSpinning || hasSpunThisSession}
                      className="absolute w-15 h-15 rounded-full bg-gradient-to-tr from-amber-400 via-[#b08953] to-amber-600 border-2 border-white flex flex-col items-center justify-center shadow-2xl active:scale-95 disabled:scale-100 disabled:opacity-90 cursor-pointer transition-all z-30"
                    >
                      {isSpinning ? (
                        <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <span className="text-[10px] font-black tracking-widest text-white uppercase font-mono">QUAY</span>
                      )}
                    </button>
                  </div>

                  {/* Spin Result Panel */}
                  <div className="w-full mt-4 text-center h-14 flex items-center justify-center">
                    {spinResult ? (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Chúc mừng Thượng Khách!</span>
                        </div>
                        <p className="text-xs font-black text-neutral-800">
                          Bạn đã trúng <span className="text-amber-700 underline font-mono">{spinResult}</span>
                          {spinPointsWon > 0 && ` (+${spinPointsWon.toLocaleString()} VND)`}
                        </p>
                      </motion.div>
                    ) : (
                      <p className="text-[10px] text-neutral-500">
                        {hasSpunThisSession 
                          ? "Bạn đã dùng lượt quay hôm nay. Hãy quay lại vào ngày mai!" 
                          : "Bấm nút QUAY ở tâm vòng để thử vận may thượng lưu!"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 6. REASONS TO INVEST MODAL */}
              {activeModal === 'reasons' && (
                <div className="flex flex-col h-full font-sans">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#b08953]/10 border border-[#b08953]/20 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-[#b08953]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Vì sao nên chọn VinClub?</h3>
                      <p className="text-[10px] text-neutral-400">Những cột trụ giá trị vững bền vượt thời gian</p>
                    </div>
                  </div>

                  {/* Horizontal mini navigation tabs */}
                  <div className="grid grid-cols-4 gap-1 bg-neutral-100 p-1 border border-neutral-200 rounded-xl mb-4.5">
                    {["Cốt lõi", "An Toàn", "Thanh Khoản", "Cộng Đồng"].map((tab, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveReasonTab(idx)}
                        className={`py-1.5 text-[8.5px] font-bold uppercase rounded-lg transition-colors cursor-pointer ${activeReasonTab === idx ? 'bg-[#b08953]/10 text-[#b08953] border border-[#b08953]/20' : 'text-neutral-500'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab Detail Contents */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 min-h-[160px] flex flex-col justify-between">
                    {activeReasonTab === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#b08953] uppercase tracking-wider">
                          <Building2 className="w-4 h-4 text-[#b08953]" />
                          <span>Hệ sinh thái VinGroup</span>
                        </div>
                        <p className="text-[10px] text-neutral-600 leading-relaxed">
                          Hưởng lợi thế tuyệt đối từ hệ sinh thái tỷ đô hàng đầu Việt Nam: từ Bất động sản Vinhomes, Nghỉ dưỡng Vinpearl, đến Phương tiện di chuyển điện VinFast, Bệnh viện Vinmec và Trường học Vinschool.
                        </p>
                      </motion.div>
                    )}

                    {activeReasonTab === 1 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#b08953] uppercase tracking-wider">
                          <Star className="w-4 h-4 text-[#b08953]" />
                          <span>An toàn & Pháp lý vững mạnh</span>
                        </div>
                        <p className="text-[10px] text-neutral-600 leading-relaxed">
                          Sản phẩm tích lũy được bảo chứng 100% bằng tài sản thực và bảo hiểm hợp đồng từ các tổ chức tài chính uy tín liên kết của Vingroup, cam kết lãi suất thực đạt tối ưu vượt trội.
                        </p>
                      </motion.div>
                    )}

                    {activeReasonTab === 2 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#b08953] uppercase tracking-wider">
                          <Award className="w-4 h-4 text-[#b08953]" />
                          <span>Thanh khoán nhanh 24/7</span>
                        </div>
                        <p className="text-[10px] text-neutral-600 leading-relaxed">
                          Hỗ trợ rút một phần hoặc tất toán khoản đầu tư/tích lũy ngay lập tức trên app VinClub với thao tác chuyển khoản trực tiếp liên ngân hàng, không lo bị gián đoạn hay mất lợi suất tích lũy.
                        </p>
                      </motion.div>
                    )}

                    {activeReasonTab === 3 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#b08953] uppercase tracking-wider">
                          <Award className="w-4 h-4 text-[#b08953]" />
                          <span>Cộng đồng tinh hoa</span>
                        </div>
                        <p className="text-[10px] text-neutral-600 leading-relaxed">
                          Gia nhập câu lạc bộ giới thượng lưu Việt Nam, kết nối kinh doanh đỉnh cao với các đại diện, CEO, doanh nhân thuộc giới siêu giàu là thành viên Câu Lạc Club Diamond và Royal.
                        </p>
                      </motion.div>
                    )}

                    {/* Interactive yield mini SVGs chart to make it premium */}
                    <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
                      <span className="text-[8px] text-neutral-500 uppercase tracking-wider block font-mono">Tăng trưởng VinClub trung bình</span>
                      <div className="flex items-end gap-1.5 h-6">
                        <div className="w-3.5 bg-neutral-200 rounded-sm h-[30%]" title="2023" />
                        <div className="w-3.5 bg-neutral-200 rounded-sm h-[50%]" title="2024" />
                        <div className="w-3.5 bg-[#b08953]/20 rounded-sm h-[75%]" title="2025" />
                        <div className="w-3.5 bg-gradient-to-t from-[#b08953] to-amber-500 rounded-sm h-[100%] animate-pulse" title="2026" />
                        <span className="text-[8.5px] font-black font-mono text-emerald-600 ml-1">+14.8%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
