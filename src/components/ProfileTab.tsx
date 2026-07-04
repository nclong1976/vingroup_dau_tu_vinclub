import ProgressiveImage from './ProgressiveImage';
import { useState, useRef, useEffect } from 'react';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, setDoc, onSnapshot, collection, addDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import SignaturePad from './SignaturePad';
import { 
  User, Award, Shield, LogOut, FileText, ChevronRight, 
  CheckCircle2, AlertTriangle, CreditCard, Lock, KeyRound, 
  ArrowDownLeft, ArrowUpRight, ArrowDownRight, Clock, TrendingUp, Gift, 
  Camera, Building2, Check, X, ShieldAlert, Sparkles, Receipt,
  Search, ChevronDown, RefreshCw, ArrowLeft, Home, Landmark,
  HelpCircle, Settings, Wallet, ArrowDown, ArrowUp, DollarSign,
  TrendingDown, Bell, ShieldCheck, History
} from 'lucide-react';

// List of all legal banks in Vietnam
const VIETNAMESE_BANKS = [
  { code: 'VCB', name: 'Vietcombank', full: 'Ngân hàng Ngoại thương Việt Nam' },
  { code: 'TCB', name: 'Techcombank', full: 'Ngân hàng Kỹ thương Việt Nam' },
  { code: 'CTG', name: 'VietinBank', full: 'Ngân hàng Công thương Việt Nam' },
  { code: 'BID', name: 'BIDV', full: 'Ngân hàng Đầu tư và Phát triển Việt Nam' },
  { code: 'MB', name: 'MB Bank', full: 'Ngân hàng Quân đội' },
  { code: 'VBA', name: 'Agribank', full: 'Ngân hàng Nông nghiệp & Phát triển Nông thôn' },
  { code: 'VPB', name: 'VPBank', full: 'Ngân hàng Việt Nam Thịnh Vượng' },
  { code: 'ACB', name: 'ACB', full: 'Ngân hàng Á Châu' },
  { code: 'STB', name: 'Sacombank', full: 'Ngân hàng Sài Gòn Thương Tín' },
  { code: 'TPB', name: 'TPBank', full: 'Ngân hàng Tiên Phong' },
  { code: 'VIB', name: 'VIB', full: 'Ngân hàng Quốc tế Việt Nam' },
  { code: 'SHB', name: 'SHB', full: 'Ngân hàng Sài Gòn - Hà Nội' },
  { code: 'HDB', name: 'HDBank', full: 'Ngân hàng Phát triển TP. Hồ Chí Minh' },
  { code: 'MSB', name: 'MSB', full: 'Ngân hàng Hàng Hải Việt Nam' },
  { code: 'OCB', name: 'OCB', full: 'Ngân hàng Phương Đông' },
  { code: 'EIB', name: 'Eximbank', full: 'Ngân hàng Xuất Nhập Khẩu Việt Nam' },
  { code: 'BAB', name: 'Bac A Bank', full: 'Ngân hàng Bắc Á' },
  { code: 'VAB', name: 'VietBank', full: 'Ngân hàng Việt Nam Thương Tín' },
  { code: 'KLB', name: 'Kienlongbank', full: 'Ngân hàng Kiên Long' },
  { code: 'NCB', name: 'NCB', full: 'Ngân hàng Quốc Dân' },
  { code: 'PVC', name: 'PVcomBank', full: 'Ngân hàng Đại Chúng Việt Nam' },
  { code: 'NAB', name: 'Nam A Bank', full: 'Ngân hàng Nam Á' },
  { code: 'LPB', name: 'LPBank', full: 'Ngân hàng Lộc Phát Việt Nam' },
  { code: 'BVB', name: 'VietCapital Bank', full: 'Ngân hàng Bản Việt' },
  { code: 'ABB', name: 'An Binh Bank', full: 'Ngân hàng An Bình' },
  { code: 'SCB', name: 'SCB', full: 'Ngân hàng Sài Gòn' },
  { code: 'SGB', name: 'Saigonbank', full: 'Ngân hàng Sài Gòn Công Thương' },
  { code: 'GPB', name: 'GPBank', full: 'Ngân hàng Dầu Khí Toàn Cầu' },
  { code: 'CBB', name: 'CBBank', full: 'Ngân hàng Xây dựng Việt Nam' },
  { code: 'OCEAN', name: 'OceanBank', full: 'Ngân hàng Đại Dương' },
  { code: 'HSBC', name: 'HSBC', full: 'Ngân hàng HSBC Việt Nam' },
  { code: 'SHINHAN', name: 'Shinhan Bank', full: 'Ngân hàng Shinhan Việt Nam' },
  { code: 'WOORI', name: 'Woori Bank', full: 'Ngân hàng Woori Việt Nam' }
];

interface ProfileTabProps {
  userName: string;
  userPhoto: string;
  onReset: () => void;
  points?: number;
  balance?: number;
  rank?: string;
  memberId?: string;
  onOpenHistory?: () => void;
  onNavigateToSupport?: (initialMessage?: string) => void;
  onUpdatePhoto?: (newPhotoUrl: string) => void;
  onBack?: () => void;
}

export default function ProfileTab({ 
  userName, 
  userPhoto, 
  onReset, 
  points = 0, 
  balance = 0,
  rank = "THÀNH VIÊN / MEMBER", 
  memberId = "", 
  onOpenHistory,
  onNavigateToSupport,
  onUpdatePhoto,
  onBack
}: ProfileTabProps) {
  
  // Active modal state
  const [activeModal, setActiveModal] = useState<'profile_info' | 'kyc' | 'signature' | 'bank_link' | 'change_pwd' | 'change_withdraw_pwd' | 'deposit' | 'withdraw' | 'profit' | 'bonus' | null>(null);
  
  // Local states for interactivity
  const [verificationStatus, setVerificationStatus] = useState<'Chưa xác thực' | 'Đang chờ duyệt' | 'Đã xác thực'>('Chưa xác thực');
  const isVerified = verificationStatus === 'Đã xác thực';
  const [userEmail, setUserEmail] = useState<string>('user@vinclub.vip');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  const [linkedBank, setLinkedBank] = useState<{bankName: string, accountNum: string, accountOwner: string} | null>(() => {
    const saved = localStorage.getItem('vinclub_linked_bank');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return {
      bankName: "Vietcombank",
      accountNum: "1023847589",
      accountOwner: "TRAN DUY THAI"
    };
  });
  
  // Signature state
  const [signature, setSignature] = useState<string | null>(() => {
    return localStorage.getItem('vinclub_user_signature') || null;
  });

  // Current history tab (Ví vs Đầu tư)
  const [txTab, setTxTab] = useState<'wallet' | 'investment'>('wallet');

  // Searchable banks state
  const [bankSearch, setBankSearch] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  // Camera integration for CCCD
  const [cameraActiveSide, setCameraActiveSide] = useState<'front' | 'back' | null>(null);
  const [cccdFront, setCccdFront] = useState<string | null>(null);
  const [cccdBack, setCccdBack] = useState<string | null>(null);
  const [cccdNumber, setCccdNumber] = useState<string>("201888999123");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmittingVerify, setIsSubmittingVerify] = useState<boolean>(false);

  // Stats
  const [stats, setStats] = useState({
    transactions: 0,
    invested: 0,
    expectedProfit: 0
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    // Set email
    if (auth.currentUser.email) {
      setUserEmail(auth.currentUser.email);
    }

    // Real-time listener for transactions
    const q = query(
      collection(db, 'transactions'), 
      where('userId', '==', uid)
    );

    const unsubTxs = onSnapshot(q, (txSnap) => {
      let totalInvested = 0;
      let expectedProfit = 0;
      const allTxs: any[] = [];

      txSnap.forEach(doc => {
        const data = doc.data();
        allTxs.push({ id: doc.id, ...data });
        
        if (data.status === 'completed' || data.status === 'success' || data.status === 'Thành công') {
          if (data.type === 'deposit' || data.type === 'investment' || data.type === 'plus') {
            totalInvested += data.amount || 0;
            if (data.interestRate) {
              expectedProfit += (data.amount || 0) * (data.interestRate / 100);
            }
          }
        }
      });

      // Sort and get top 3
      const sorted = allTxs.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setRecentTransactions(sorted.slice(0, 3));

      // Update stats based on transactions
      setStats(prev => ({
        ...prev,
        transactions: txSnap.size,
        invested: totalInvested,
        expectedProfit: expectedProfit || (totalInvested * 0.15)
      }));
    });

    const unsubUser = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.isApproved === true) {
          setVerificationStatus('Đã xác thực');
        } else if (data.isApproved === false) {
          setVerificationStatus('Đang chờ duyệt');
        } else {
          setVerificationStatus('Chưa xác thực');
        }
        
        // Allow user doc to override stats if they exist
        if (data.totalInvested !== undefined || data.expectedProfit !== undefined) {
          setStats(prev => ({
            ...prev,
            invested: data.totalInvested ?? prev.invested,
            expectedProfit: data.expectedProfit ?? prev.expectedProfit
          }));
        }

        if (data.role === 'admin' || data.isAdmin) {
          setIsAdmin(true);
        }
        if (data.signature_content) {
          setSignature(data.signature_content);
          localStorage.setItem('vinclub_user_signature', data.signature_content);
        }
      }
    });

    return () => {
      unsubTxs();
      unsubUser();
    };
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when modal changes or unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [activeModal]);

  const startCamera = async (side: 'front' | 'back') => {
    setCameraActiveSide(side);
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    const preferredFacingMode = side === 'front' ? 'user' : 'environment';

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: preferredFacingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      } catch (firstErr) {
        console.warn(`Failed to get preferred camera facingMode (${preferredFacingMode}), trying general fallback`, firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      }

      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error("Video element play failed", err));
        }
      }, 150);
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraError("Không thể truy cập Camera. Vui lòng cấp quyền camera trong trình duyệt hoặc chụp tải ảnh lên bằng Album ảnh.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActiveSide(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (cameraActiveSide === 'front') {
          setCccdFront(dataUrl);
        } else if (cameraActiveSide === 'back') {
          setCccdBack(dataUrl);
        }
      }
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === 'front') {
          setCccdFront(reader.result as string);
        } else {
          setCccdBack(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Verification to Admin
  const handleVerifySubmit = async () => {
    if (!cccdFront || !cccdBack || !cccdNumber) {
      alert("Vui lòng cung cấp đầy đủ 2 mặt CCCD và Số CCCD!");
      return;
    }
    setIsSubmittingVerify(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, 'users', uid), {
          cccdNumber,
          cccdFront,
          cccdBack,
          isApproved: false // Gửi cho admin duyệt
        });
        setVerificationStatus('Đang chờ duyệt');
        alert("Đã gửi thông tin xác minh! Quản trị viên sẽ phê duyệt hồ sơ của bạn sớm nhất có thể.");
        setActiveModal(null);
      }
    } catch (err) {
      console.error(err);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  // Deposit state
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositMethod, setDepositMethod] = useState<'bank' | 'momo' | 'usdt'>('bank');
  const [depositSuccess, setDepositSuccess] = useState<boolean>(false);
  const [depositStep, setDepositStep] = useState<number>(1);
  const [depositSignature, setDepositSignature] = useState<string>('');
  const [isDepositSubmitting, setIsDepositSubmitting] = useState<boolean>(false);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawBank, setWithdrawBank] = useState<string>("Vietcombank");
  const [withdrawPin, setWithdrawPin] = useState<string>("");
  const [withdrawSuccess, setWithdrawSuccess] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string>("");
  const [isWithdrawSubmitting, setIsWithdrawSubmitting] = useState<boolean>(false);

  // Change Password state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Change Withdraw PIN state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  // Bank edit state
  const [bankSelect, setBankSelect] = useState("Vietcombank");
  const [bankAccount, setBankAccount] = useState("");
  const [bankOwner, setBankOwner] = useState(userName.toUpperCase());
  const [bankSuccess, setBankSuccess] = useState(false);

  // Photo upload simulated state
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(userPhoto || null);

  useEffect(() => {
    setCurrentPhoto(userPhoto || null);
  }, [userPhoto]);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "YN";
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Handle deposit simulation
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setDepositStep(2);
  };

  const handleConfirmDeposit = async () => {
    if (!depositSignature) {
      alert("Vui lòng ký tên xác nhận!");
      return;
    }
    
    setIsDepositSubmitting(true);
    try {
      const amountVal = parseFloat(depositAmount);
      
      // Save transaction + contract signature to Firebase
      const newTransaction = {
        amount: amountVal,
        type: 'plus',
        paymentMethod: depositMethod,
        signature_type: 'image/png',
        signature_content: depositSignature,
        date: new Date().toISOString(),
        status: "Đang chờ duyệt",
        userName: userName || "Nhà Đầu Tư",
        title: "Góp vốn (Nạp VND)"
      };
      
      await addDoc(collection(db, 'transactions'), newTransaction);
      
      const amountStr = amountVal.toLocaleString();
      const depositMsg = `Tôi muốn góp vốn đầu tư ${amountStr} VND\nTôi xin cam đoan số tiền trên là hợp pháp.`;
      
      setDepositSuccess(true);
      setTimeout(() => {
        setDepositSuccess(false);
        setDepositAmount("");
        setDepositStep(1);
        setDepositSignature("");
        setActiveModal(null);
        if (onNavigateToSupport) {
          onNavigateToSupport(depositMsg);
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gửi yêu cầu.");
    } finally {
      setIsDepositSubmitting(false);
    }
  };

  // Handle withdraw simulation
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return;
    if (amount > balance) {
      setWithdrawError("Số dư tài khoản không đủ để thực hiện giao dịch này!");
      return;
    }
    if (withdrawPin.length < 6) {
      setWithdrawError("Mật khẩu rút tiền phải gồm 6 chữ số!");
      return;
    }
    setWithdrawError("");
    setIsWithdrawSubmitting(true);
    try {
      const uid = auth.currentUser?.uid || "anonymous";
      // Create a withdraw transaction in Firestore
      const newTx = {
        userId: uid,
        amount: amount,
        type: 'minus',
        paymentMethod: 'bank',
        bankInfo: linkedBank ? `${linkedBank.bankName} - ${linkedBank.accountNum}` : withdrawBank,
        date: new Date().toISOString(),
        status: "Đang chờ duyệt",
        userName: userName || "Nhà Đầu Tư",
        title: "Rút tiền về ngân hàng"
      };
      await addDoc(collection(db, 'transactions'), newTx);
      
      setWithdrawSuccess(true);
      setTimeout(() => {
        setWithdrawSuccess(false);
        setWithdrawAmount("");
        setWithdrawPin("");
        setActiveModal(null);
      }, 2000);
    } catch (err) {
      console.error(err);
      setWithdrawError("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsWithdrawSubmitting(false);
    }
  };

  // Handle password simulation
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd || !newPwd || !confirmPwd) return;
    if (newPwd !== confirmPwd) return;
    setPwdSuccess(true);
    setTimeout(() => {
      setPwdSuccess(false);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setActiveModal(null);
    }, 2000);
  };

  // Handle withdraw PIN simulation
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || !confirmPin) return;
    if (newPin !== confirmPin) return;
    setPinSuccess(true);
    setTimeout(() => {
      setPinSuccess(false);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setActiveModal(null);
    }, 2000);
  };

  // Handle link bank simulation
  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccount) return;
    const info = {
      bankName: bankSelect,
      accountNum: bankAccount,
      accountOwner: bankOwner.toUpperCase()
    };
    setLinkedBank(info);
    localStorage.setItem('vinclub_linked_bank', JSON.stringify(info));
    setBankSuccess(true);
    setTimeout(() => {
      setBankSuccess(false);
      setActiveModal(null);
    }, 2000);
  };

  // Signature creation modal callback
  const handleSaveSignature = async (sigDataUrl: string) => {
    setSignature(sigDataUrl);
    localStorage.setItem('vinclub_user_signature', sigDataUrl);
    
    // Save to firestore if logged in
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        await updateDoc(doc(db, 'users', uid), {
          signature_content: sigDataUrl
        });
      } catch (e) {
        console.error("Lỗi khi lưu chữ ký vào Firestore:", e);
      }
    }
  };

  const handleRemoveBank = () => {
    if (window.confirm("Bạn có chắc chắn muốn gỡ liên kết tài khoản ngân hàng này?")) {
      setLinkedBank(null);
      localStorage.removeItem('vinclub_linked_bank');
    }
  };

  const filteredBanks = bankSearch.trim() === ""
    ? VIETNAMESE_BANKS
    : VIETNAMESE_BANKS.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.full.toLowerCase().includes(bankSearch.toLowerCase()));

  // Sub-component for Menu Items
  const MenuItem = ({ icon: Icon, label, onClick, colorClass = "bg-neutral-50 text-neutral-500", value }: { icon: any, label: string, onClick?: () => void, colorClass?: string, value?: string }) => (
    <button 
      onClick={onClick}
      className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors text-left focus:outline-none cursor-pointer"
    >
      <div className="flex items-center space-x-3.5">
        <div className={`p-2 rounded-xl ${colorClass}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div>
          <span className="text-[13px] font-bold text-neutral-800">{label}</span>
          {value && <p className="text-[10px] text-neutral-400 font-medium">{value}</p>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-300" />
    </button>
  );

  return (
    <div className="w-full min-h-screen bg-[#f8f9fb] flex flex-col items-center text-neutral-800 pb-24 font-sans relative">
      
      {/* 1. STICKY TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100 flex items-center justify-between px-4 h-14 w-full shadow-sm">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 rounded-full active:scale-90 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5.5 h-5.5 text-neutral-700" />
        </button>
        <h1 className="text-sm font-black text-neutral-900 tracking-widest uppercase">Trung tâm cá nhân</h1>
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 rounded-full active:scale-90 transition-all cursor-pointer"
        >
          <Home className="w-5.5 h-5.5 text-neutral-700" />
        </button>
      </header>

      {/* Profile Content Container */}
      <div className="w-full max-w-md px-4 pt-6 flex flex-col items-center space-y-6">

        {/* 2. USER PROFILE INFO BOX */}
        <div className="w-full flex flex-col items-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#8d7a53] to-[#c5a880] p-1 shadow-xl">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
                {currentPhoto ? (
                  <ProgressiveImage src={currentPhoto} alt={userName} className="w-full h-full" imgClassName="object-cover" />
                ) : (
                  <span className="text-2xl font-black text-[#8d7a53] tracking-widest">
                    {getInitials(userName)}
                  </span>
                )}
              </div>
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-neutral-100 cursor-pointer hover:bg-neutral-50 active:scale-90 transition-all">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64Data = reader.result as string;
                      setCurrentPhoto(base64Data);
                      if (onUpdatePhoto) onUpdatePhoto(base64Data);
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
              />
              <Camera className="w-4 h-4 text-[#8d7a53]" />
            </label>
          </div>

          <div className="text-center mt-4">
            <h2 className="text-xl font-black text-neutral-900 tracking-tight">
              {userName}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-xs font-bold text-neutral-400">{userEmail}</span>
              <span className="w-1 h-1 bg-neutral-200 rounded-full" />
              <span className="text-[10px] font-black text-[#8d7a53] uppercase tracking-widest">{isAdmin ? 'Quản trị viên' : 'Hội viên'}</span>
            </div>
            <div className="mt-2.5 flex items-center justify-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100/50">
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{rank}</span>
            </div>
          </div>
        </div>

        {/* 3. FINANCE CARD */}
        <div className="w-full bg-[#1c1c1e] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Landmark className="w-24 h-24 text-white" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">Tổng tài sản khả dụng</p>
                <h3 className="text-2xl font-black tracking-tight flex items-baseline gap-1.5">
                  <motion.span
                    key={balance}
                    initial={{ opacity: 0.5, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-[#e1b777] via-white to-[#e1b777] bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer"
                  >
                    {balance.toLocaleString()}
                  </motion.span>
                  <span className="text-xs text-[#c5a880] font-bold">VND</span>
                </h3>
              </div>
              <div className="px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                ID: {memberId}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button 
                onClick={() => setActiveModal('deposit')}
                className="flex items-center justify-center gap-2 py-3 bg-[#c5a880] hover:bg-[#b08953] active:scale-95 transition-all text-neutral-900 font-black text-xs rounded-2xl shadow-lg"
              >
                <ArrowDown className="w-4 h-4" /> Nạp tiền
              </button>
              <button 
                onClick={() => setActiveModal('withdraw')}
                className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white font-black text-xs rounded-2xl border border-white/10"
              >
                <ArrowUp className="w-4 h-4" /> Rút tiền
              </button>
            </div>
          </div>
        </div>

        {/* 4. METRICS ROW */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { label: 'Giao dịch', value: stats.transactions, icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Đang đầu tư', value: stats.invested.toLocaleString(), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Ước tính LN', value: stats.expectedProfit.toLocaleString(), icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 border border-neutral-100 shadow-sm flex flex-col items-center text-center">
              <div className={`w-8 h-8 rounded-full ${item.bg} ${item.color} flex items-center justify-center mb-1.5`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{item.label}</span>
              <span className="text-xs font-black text-neutral-800 mt-0.5">{item.value}</span>
            </div>
          ))}
        </div>

        {/* 5. MENU SECTIONS */}
        <div className="w-full space-y-4">
          
          {/* A. ACCOUNT SECTION */}
          <div className="space-y-2">
            <p className="px-1 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Tài khoản & Xác thực</p>
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden divide-y divide-neutral-50">
              <MenuItem 
                icon={Building2} 
                label="Liên kết ngân hàng" 
                onClick={() => setActiveModal('bank_link')}
                colorClass="bg-amber-50 text-amber-600"
                value={linkedBank ? `${linkedBank.bankName} - ${linkedBank.accountNum}` : "Chưa liên kết"}
              />
              <MenuItem 
                icon={ShieldCheck} 
                label="Xác thực danh tính" 
                onClick={() => setActiveModal('kyc')}
                colorClass="bg-blue-50 text-blue-600"
                value={verificationStatus === 'Đã xác thực' ? "Đã xác thực" : verificationStatus === 'Đang chờ duyệt' ? "Đang chờ duyệt" : "Chưa xác thực"}
              />
              <MenuItem 
                icon={FileText} 
                label="Chữ ký điện tử" 
                onClick={() => setActiveModal('signature')}
                colorClass="bg-purple-50 text-purple-600"
                value={signature ? "Đã cài đặt" : "Chưa cài đặt"}
              />
            </div>
          </div>

          {/* B. SYSTEM SECTION */}
          <div className="space-y-2">
            <p className="px-1 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Tiện ích & Bảo mật</p>
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden divide-y divide-neutral-50">
              <MenuItem 
                icon={Wallet} 
                label="Lịch sử giao dịch" 
                onClick={() => onOpenHistory ? onOpenHistory() : null}
                colorClass="bg-emerald-50 text-emerald-600"
              />
              <MenuItem 
                icon={Lock} 
                label="Đổi mật khẩu đăng nhập" 
                onClick={() => setActiveModal('change_pwd')}
                colorClass="bg-orange-50 text-orange-600"
              />
              <MenuItem 
                icon={KeyRound} 
                label="Đổi mã PIN rút tiền" 
                onClick={() => setActiveModal('change_withdraw_pwd')}
                colorClass="bg-rose-50 text-rose-600"
              />
              <MenuItem 
                icon={Bell} 
                label="Thông báo hệ thống" 
                onClick={() => alert("Chưa có thông báo mới")}
                colorClass="bg-indigo-50 text-indigo-600"
              />
              <MenuItem 
                icon={HelpCircle} 
                label="Trung tâm hỗ trợ" 
                onClick={() => onNavigateToSupport ? onNavigateToSupport() : null}
                colorClass="bg-teal-50 text-teal-600"
              />
              <MenuItem 
                icon={Settings} 
                label="Cài đặt ứng dụng" 
                onClick={() => alert("Tính năng đang phát triển")}
                colorClass="bg-slate-50 text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* 6. RECENT TRANSACTIONS */}
        {recentTransactions.length > 0 && (
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Giao dịch gần đây</h4>
              <button 
                onClick={() => onOpenHistory ? onOpenHistory() : null}
                className="text-[10px] font-black text-[#96784d] uppercase tracking-wider hover:underline"
              >
                Xem tất cả
              </button>
            </div>
            <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm space-y-4">
              {recentTransactions.map((tx, idx) => (
                <div key={tx.id || idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'plus' || tx.type === 'deposit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {tx.type === 'plus' || tx.type === 'deposit' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-neutral-900 leading-none mb-1">{tx.title || (tx.type === 'plus' ? 'Nạp tiền' : 'Rút tiền')}</p>
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">{new Date(tx.date || tx.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[11px] font-black ${tx.type === 'plus' || tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'plus' || tx.type === 'deposit' ? '+' : '-'}{tx.amount?.toLocaleString()}
                    </p>
                    <p className="text-[8px] font-black text-neutral-400 uppercase">{tx.status || 'Chờ duyệt'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. LOGOUT BUTTON */}
        <div className="w-full pb-8">
          <button 
            onClick={async () => {
              if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                try {
                  await signOut(auth);
                  if (onReset) onReset();
                } catch(e) { console.error(e); }
              }
            }}
            className="w-full py-4 bg-white border border-red-100 text-red-500 rounded-3xl font-black text-sm uppercase tracking-widest shadow-sm hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất tài khoản
          </button>
          
          <p className="mt-6 text-center text-[10px] font-bold text-neutral-300 uppercase tracking-[0.2em]">
            Phiên bản 3.5.0 • VIN CLUB LUXURY
          </p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODALS RENDERING ENGINE                                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        
        {/* A. LINK BANK MODAL */}
        {activeModal === 'bank_link' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-left border border-neutral-100 overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#96784d]" /> Liên kết ngân hàng
                </h3>
                <button onClick={() => { setActiveModal(null); setBankSearch(''); }} className="p-1 hover:bg-neutral-100 rounded-full cursor-pointer"><X className="w-5 h-5 text-neutral-400" /></button>
              </div>

              {bankSuccess ? (
                <div className="py-8 flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center border border-green-100">
                    <Check className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-extrabold text-neutral-800">Liên kết thành công</h4>
                  <p className="text-xs text-neutral-500">Tài khoản ngân hàng của bạn đã được kết nối an toàn.</p>
                </div>
              ) : (
                <form onSubmit={handleBankSubmit} className="space-y-4 overflow-y-auto pr-1">
                  {/* Select Bank */}
                  <div className="relative">
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Chọn Ngân hàng</label>
                    <button 
                      type="button"
                      onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                      className="w-full flex justify-between items-center bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl px-3.5 py-3 text-xs font-bold transition-all text-neutral-800"
                    >
                      <span>{VIETNAMESE_BANKS.find(b => b.code === bankSelect)?.name || bankSelect}</span>
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    </button>

                    {isBankDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-xl rounded-xl max-h-48 overflow-y-auto z-50 p-2 space-y-1">
                        <div className="sticky top-0 bg-white pb-1.5 pt-0.5">
                          <input 
                            type="text"
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            placeholder="Tìm kiếm ngân hàng..."
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#96784d]"
                          />
                        </div>
                        {filteredBanks.map(b => (
                          <button
                            key={b.code}
                            type="button"
                            onClick={() => {
                              setBankSelect(b.code);
                              setIsBankDropdownOpen(false);
                              setBankSearch('');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${bankSelect === b.code ? 'bg-[#96784d]/10 text-[#96784d] font-bold' : 'hover:bg-neutral-50 text-neutral-700'}`}
                          >
                            <span className="font-bold">{b.name}</span> - <span className="text-[10px] text-neutral-400">{b.full}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Số Tài khoản</label>
                    <input 
                      type="text"
                      required
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-xs font-bold focus:outline-none focus:border-[#96784d] text-neutral-800"
                      placeholder="Nhập số tài khoản..."
                    />
                  </div>

                  {/* Owner */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Tên Chủ Tài khoản</label>
                    <input 
                      type="text"
                      required
                      value={bankOwner}
                      onChange={(e) => setBankOwner(e.target.value.toUpperCase())}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-xs font-bold focus:outline-none focus:border-[#96784d] uppercase tracking-wide text-neutral-800"
                      placeholder="VIET IN HOA KHONG DAU..."
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-900 font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all"
                  >
                    Xác nhận liên kết
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* B. KYC VERIFICATION MODAL */}
        {activeModal === 'kyc' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => { stopCamera(); setActiveModal(null); }} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl text-left border border-neutral-100 overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" /> Xác thực danh tính
                </h3>
                <button onClick={() => { stopCamera(); setActiveModal(null); }} className="p-1 hover:bg-neutral-100 rounded-full cursor-pointer"><X className="w-5 h-5 text-neutral-400" /></button>
              </div>

              <div className="overflow-y-auto space-y-4 pr-1 flex-1 pb-4">
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-2">
                  <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
                    Theo quy định, bạn cần xác thực danh tính để tăng hạn mức giao dịch và bảo vệ tài khoản.
                  </p>
                </div>

                {/* 1. CCCD Number */}
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Số CCCD / Hộ chiếu</label>
                  <input 
                    type="text"
                    required
                    value={cccdNumber}
                    onChange={(e) => setCccdNumber(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500"
                    placeholder="Nhập 12 số CCCD..."
                  />
                </div>

                {/* 2. Photo Upload (Front / Back) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Front Side */}
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Mặt trước CCCD</span>
                    {cccdFront ? (
                      <div className="relative w-full h-24 rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50">
                        <ProgressiveImage src={cccdFront} alt="Mặt trước CCCD" className="w-full h-full" imgClassName="object-cover" />
                        <button 
                          onClick={() => setCccdFront(null)}
                          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-1">
                        <button 
                          onClick={() => startCamera('front')}
                          className="h-16 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 hover:bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 transition-colors"
                        >
                          <Camera className="w-5 h-5 mb-1" />
                          <span className="text-[9px] font-bold">Chụp ảnh</span>
                        </button>
                        <label className="py-1.5 rounded-lg border border-neutral-200 text-center text-[10px] font-bold text-neutral-500 hover:bg-neutral-50 cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'front')} />
                          Tải từ Album
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Back Side */}
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Mặt sau CCCD</span>
                    {cccdBack ? (
                      <div className="relative w-full h-24 rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50">
                        <ProgressiveImage src={cccdBack} alt="Mặt sau CCCD" className="w-full h-full" imgClassName="object-cover" />
                        <button 
                          onClick={() => setCccdBack(null)}
                          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-1">
                        <button 
                          onClick={() => startCamera('back')}
                          className="h-16 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 hover:bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 transition-colors"
                        >
                          <Camera className="w-5 h-5 mb-1" />
                          <span className="text-[9px] font-bold">Chụp ảnh</span>
                        </button>
                        <label className="py-1.5 rounded-lg border border-neutral-200 text-center text-[10px] font-bold text-neutral-500 hover:bg-neutral-50 cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'back')} />
                          Tải từ Album
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Camera Capture Screen Overlay */}
                {cameraActiveSide && (
                  <div className="p-3.5 bg-neutral-900 rounded-2xl flex flex-col items-center space-y-3 relative overflow-hidden">
                    <video ref={videoRef} playsInline muted className="w-full rounded-xl aspect-[4/3] object-cover bg-black" />
                    {cameraError && <p className="text-[10px] text-red-400 text-center font-bold">{cameraError}</p>}
                    <div className="flex gap-2 w-full">
                      <button 
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1"
                      >
                        Chụp ảnh
                      </button>
                      <button 
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 bg-neutral-800 text-white font-bold text-xs rounded-lg"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleVerifySubmit}
                disabled={isSubmittingVerify || !cccdFront || !cccdBack || !cccdNumber}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all disabled:opacity-40 shrink-0"
              >
                {isSubmittingVerify ? "Đang gửi hồ sơ..." : "Gửi thông tin xác thực"}
              </button>
            </motion.div>
          </div>
        )}

        {/* B2. ELECTRONIC SIGNATURE MODAL */}
        {activeModal === 'signature' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-left border border-neutral-100 overflow-hidden flex flex-col z-10"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" /> Chữ ký điện tử
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-neutral-100 rounded-full cursor-pointer"><X className="w-5 h-5 text-neutral-400" /></button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                  <p className="text-[10px] text-purple-600 font-bold leading-relaxed">
                    Chữ ký này sẽ được sử dụng để ký kết các hợp đồng đầu tư và giao dịch góp vốn tự động.
                  </p>
                </div>

                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 flex flex-col items-center">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block self-start">Ký vào khung bên dưới</span>
                  <div className="w-full bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-inner">
                    <SignaturePad onSign={(data) => {
                      if (data) {
                        setSignature(data);
                      }
                    }} />
                  </div>
                </div>

                {signature && (
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-neutral-300 uppercase tracking-[0.2em] mb-2">Xem trước chữ ký hiện tại</span>
                    <div className="w-32 h-16 bg-neutral-50 rounded-lg border border-neutral-100 p-2 flex items-center justify-center">
                      <img src={signature} alt="Xem trước chữ ký" className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  if (signature) {
                    handleSaveSignature(signature);
                    alert("Đã cập nhật chữ ký điện tử!");
                    setActiveModal(null);
                  }
                }}
                disabled={!signature}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all disabled:opacity-40"
              >
                Lưu chữ ký điện tử
              </button>
            </motion.div>
          </div>
        )}

        {/* C. CHANGE PASSWORD MODAL */}
        {activeModal === 'change_pwd' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-left border border-neutral-100 overflow-hidden flex flex-col z-10"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#96784d]" /> Đổi mật khẩu
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-neutral-100 rounded-full cursor-pointer"><X className="w-5 h-5 text-neutral-400" /></button>
              </div>

              {pwdSuccess ? (
                <div className="py-8 flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center border border-green-100">
                    <Check className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-extrabold text-neutral-800">Thành công</h4>
                  <p className="text-xs text-neutral-500">Mật khẩu đăng nhập của bạn đã được thay đổi.</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Mật khẩu hiện tại</label>
                    <input 
                      type="password"
                      required
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-xs font-bold focus:outline-none focus:border-[#96784d]"
                      placeholder="Mật khẩu hiện tại..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Mật khẩu mới</label>
                    <input 
                      type="password"
                      required
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-xs font-bold focus:outline-none focus:border-[#96784d]"
                      placeholder="Mật khẩu mới..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Xác nhận mật khẩu</label>
                    <input 
                      type="password"
                      required
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-xs font-bold focus:outline-none focus:border-[#96784d]"
                      placeholder="Xác nhận mật khẩu mới..."
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-900 font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all"
                  >
                    Thay đổi mật khẩu
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* D. DEPOSIT CAPITAL (GỬI TIỀN) MODAL */}
        {activeModal === 'deposit' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl text-left border border-neutral-100 overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <ArrowDown className="w-5 h-5 text-[#96784d]" /> {depositStep === 1 ? 'Yêu cầu nạp tiền' : 'Hợp đồng góp vốn'}
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-neutral-100 rounded-full cursor-pointer"><X className="w-5 h-5 text-neutral-400" /></button>
              </div>

              {depositSuccess ? (
                <div className="py-8 flex flex-col items-center text-center space-y-3 shrink-0">
                  <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center border border-green-100">
                    <Check className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-extrabold text-neutral-800">Đã gửi yêu cầu</h4>
                  <p className="text-xs text-neutral-500 font-medium">Hệ thống đang kiểm tra giao dịch nạp của bạn.</p>
                </div>
              ) : depositStep === 1 ? (
                <form onSubmit={handleDepositSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Số tiền góp vốn (VND)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        required
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-mono font-bold focus:outline-none focus:border-[#96784d] text-neutral-800"
                        placeholder="Nhập số tiền..."
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#96784d]">VND</span>
                    </div>
                    {depositAmount && (
                      <p className="mt-1.5 text-right text-xs font-bold text-[#96784d]">
                        {parseFloat(depositAmount).toLocaleString('vi-VN')} VND
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Phương thức đóng góp</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setDepositMethod('bank')}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${depositMethod === 'bank' ? 'bg-[#96784d]/10 border-[#96784d] text-[#96784d]' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}
                      >
                        <Building2 className="w-5 h-5 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">BANK</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDepositMethod('momo')}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${depositMethod === 'momo' ? 'bg-[#96784d]/10 border-[#96784d] text-[#96784d]' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}
                      >
                        <Wallet className="w-5 h-5 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">MOMO</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDepositMethod('usdt')}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${depositMethod === 'usdt' ? 'bg-[#96784d]/10 border-[#96784d] text-[#96784d]' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}
                      >
                        <Landmark className="w-5 h-5 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">USDT</span>
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 mt-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-900 font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all"
                  >
                    Tiếp tục cam kết
                  </button>
                </form>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-[11px] font-serif leading-relaxed text-neutral-700 max-h-48 overflow-y-auto space-y-2">
                    <p className="text-center font-bold text-xs">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="text-center italic text-[10px] -mt-1">Độc lập - Tự do - Hạnh phúc</p>
                    <p className="text-center font-bold text-xs uppercase pt-2">Bản cam kết góp vốn đầu tư</p>
                    <p>Tôi tên là: <strong>{userName}</strong></p>
                    <p>Hôm nay tự nguyện đóng góp số tiền: <strong>{parseFloat(depositAmount).toLocaleString()} VND</strong> thông qua cổng <strong>{depositMethod.toUpperCase()}</strong> để đầu tư hợp tác phát triển.</p>
                    <p>Cam kết tuân thủ chính sách, tính pháp lý nguồn tiền và thỏa thuận bảo mật thông tin.</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Ký tên điện tử để duyệt</span>
                    <SignaturePad onSign={setDepositSignature} />
                  </div>

                  <button 
                    onClick={handleConfirmDeposit}
                    disabled={isDepositSubmitting || !depositSignature}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-900 font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all disabled:opacity-40"
                  >
                    {isDepositSubmitting ? "Đang gửi..." : "Xác nhận & Hoàn tất"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* E. WITHDRAW CAPITAL (RÚT TIỀN) MODAL */}
        {activeModal === 'withdraw' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-left border border-neutral-100 overflow-hidden flex flex-col z-10"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <ArrowUp className="w-5 h-5 text-[#96784d]" /> Rút tiền về ngân hàng
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-neutral-100 rounded-full cursor-pointer"><X className="w-5 h-5 text-neutral-400" /></button>
              </div>

              {withdrawSuccess ? (
                <div className="py-8 flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center border border-green-100">
                    <Check className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-extrabold text-neutral-800">Gửi yêu cầu thành công</h4>
                  <p className="text-xs text-neutral-500">Yêu cầu rút tiền đang được ban quản trị xét duyệt.</p>
                </div>
              ) : (
                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Số tiền rút</label>
                    <div className="relative">
                      <input 
                        type="number"
                        required
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-mono font-bold focus:outline-none focus:border-[#96784d]"
                        placeholder="Nhập số tiền..."
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#96784d]">VND</span>
                    </div>
                    {withdrawAmount && (
                      <p className="mt-1.5 text-right text-xs font-bold text-[#96784d]">
                        {parseFloat(withdrawAmount).toLocaleString()} VND
                      </p>
                    )}
                  </div>

                  {/* Bank selected display */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Ngân hàng thụ hưởng</label>
                    {linkedBank ? (
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-extrabold text-neutral-800">{linkedBank.bankName}</p>
                          <p className="font-mono text-neutral-500 font-bold">{linkedBank.accountNum}</p>
                        </div>
                        <span className="text-[9px] bg-green-50 text-green-600 px-2 py-0.5 border border-green-100 rounded font-black uppercase">Đã LK</span>
                      </div>
                    ) : (
                      <div className="bg-red-50 rounded-xl p-3 border border-red-100 flex justify-between items-center text-xs">
                        <span className="text-red-500 font-bold">Chưa liên kết ngân hàng!</span>
                        <button 
                          type="button"
                          onClick={() => setActiveModal('bank_link')}
                          className="text-[10px] bg-white border border-red-200 px-2.5 py-1 rounded-lg text-red-600 font-bold"
                        >
                          LK Ngay
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pin Code */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Mật khẩu rút tiền (6 số)</label>
                    <input 
                      type="password"
                      required
                      maxLength={6}
                      value={withdrawPin}
                      onChange={(e) => setWithdrawPin(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-[#96784d]"
                      placeholder="******"
                    />
                  </div>

                  {withdrawError && (
                    <p className="text-[11px] text-red-500 font-bold text-center">{withdrawError}</p>
                  )}

                  <button 
                    type="submit"
                    disabled={isWithdrawSubmitting || !linkedBank}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-900 font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all disabled:opacity-40"
                  >
                    {isWithdrawSubmitting ? "Đang gửi..." : "Xác nhận rút tiền"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* F. CHANGE WITHDRAW PIN MODAL */}
        {activeModal === 'change_withdraw_pwd' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-left border border-neutral-100 overflow-hidden flex flex-col z-10"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#96784d]" /> Đổi mã PIN rút tiền
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-neutral-100 rounded-full cursor-pointer"><X className="w-5 h-5 text-neutral-400" /></button>
              </div>

              {pinSuccess ? (
                <div className="py-8 flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center border border-green-100">
                    <Check className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-extrabold text-neutral-800">Thành công</h4>
                  <p className="text-xs text-neutral-500">Mã PIN rút tiền của bạn đã được thay đổi.</p>
                </div>
              ) : (
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Mã PIN hiện tại</label>
                    <input 
                      type="password"
                      required
                      maxLength={6}
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-[#96784d]"
                      placeholder="******"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Mã PIN mới</label>
                    <input 
                      type="password"
                      required
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-[#96784d]"
                      placeholder="******"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Xác nhận mã PIN mới</label>
                    <input 
                      type="password"
                      required
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-3 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-[#96784d]"
                      placeholder="******"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-900 font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all"
                  >
                    Thay đổi mã PIN
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
}
