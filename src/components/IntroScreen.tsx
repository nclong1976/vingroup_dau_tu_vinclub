import ProgressiveImage from './ProgressiveImage';
import { Camera, Upload, ArrowRight, ArrowLeft, AlertCircle, Bell, RefreshCw, KeyRound, Check, HelpCircle } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
declare global {
  interface Window {
    aistudio?: {
      openSelectKey?: () => Promise<boolean | void>;
    };
  }
}

interface IntroScreenProps {
  onStart: (photoBase64: string, name: string, uid?: string) => void;
}

type OnboardingStep = 'login' | 'otp' | 'register' | 'terms' | 'upload';

export default function IntroScreen({ onStart }: IntroScreenProps) {
  const [step, setStep] = useState<OnboardingStep>('login');
  const [isLoading, setIsLoading] = useState(false);
  
  // Login States
  const [loginContact, setLoginContact] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // OTP States
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string[]>(Array(6).fill(''));
  const [showOtpAlert, setShowOtpAlert] = useState<boolean>(false);
  const [otpResendCountdown, setOtpResendCountdown] = useState<number>(30);

  // Register States
  const [regFullName, setRegFullName] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regReferralCode, setRegReferralCode] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  // Terms agreement state
  const [hasAgreed, setHasAgreed] = useState(false);

  // Photo States
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // OTP resend countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && otpResendCountdown > 0) {
      timer = setInterval(() => {
        setOtpResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpResendCountdown]);

  // Hình nền cho các màn hình khác nhau
  const loginBg = "https://lh3.googleusercontent.com/aida-public/AB6AXuARfLgNzYC6RxLGZA_J-o8B-c3mlX-YbuxQ4UyARBun0278t3R9087JcIl051a7XWOabYnSNYw5a8_GP5N5qDjunEoIwfRzeHkZ2SbgBoUWBTruIkea-GCxbT8FupNg6ktyNKCre0gqPLpu-6EXzr2tauEoizvvcRoK8JH-4mM_-LOjKh7MTMpWZf73oB68AZPbfCaIzu6ZRfW_zuqyRaG1E4H147xfWRv_ebrzoNulw3oHNsH0F54BSgAObaL2I_YnZ_hWiWFnHul9wA";
  const registerBg = "https://lh3.googleusercontent.com/aida-public/AB6AXuCly3M_gSncR2CJjebmyEdjKsJSIb808sHuH1S4SvfpVFbuE_TBHhYRM5CL6s2_GdvS0WD6kBX2puPdY7xPlFPJp6aUC9DjMwp6QQEs7MWDQ29Yag0CcH4f19DQanry_8yFCZ8jpwcDm_7HIqg1TCtV_cSPi0eF8ld3xhF_h60xAjEVlnObXuvOZ_wm0njAlAy5Z3FUS3BytOAMdDGs0mloJ-J25MFai8b-o3dpTBdwHqtkg-nZ_-TC";
  const termsBg = "https://ilhzsadfwezqljvrbpwt.supabase.co/storage/v1/object/public/vinclub/06aeb4ab-8ad8-410b-befb-754f3313d989%20(1).png";

  // Strict Phone & Email validation function
  const validateContact = (contact: string): { isValid: boolean; type: 'phone' | 'email' | null; error?: string } => {
    const value = contact.trim();
    if (!value) {
      return { isValid: false, type: null, error: 'Vui lòng nhập số điện thoại hoặc email.' };
    }

    if (value.includes('@')) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) {
        return { isValid: false, type: 'email', error: 'Email không đúng định dạng (Ví dụ: vip.member@domain.com).' };
      }
      return { isValid: true, type: 'email' };
    } else {
      // Standardize Vietnamese mobile numbers: starts with 0 (followed by 3, 5, 7, 8, 9) and has exactly 10 digits
      // Or international Vietnamese country format (+84 followed by 9 digits)
      const cleanValue = value.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^(03|05|07|08|09)\d{8}$|^\+84(3|5|7|8|9)\d{8}$/;
      if (!phoneRegex.test(cleanValue)) {
        return { isValid: false, type: 'phone', error: 'Số điện thoại không hợp lệ. Phải là số di động Việt Nam gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09) hoặc định dạng +84.' };
      }
      return { isValid: true, type: 'phone' };
    }
  };

  const generateAndSendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(code);
    setOtpInput(Array(6).fill(''));
    setShowOtpAlert(true);
    setOtpResendCountdown(30);
  };

  const handleVerifyOtp = async (codeToCheck: string) => {
    if (codeToCheck !== otpCode) {
      setLoginError('Mã OTP không chính xác. Vui lòng kiểm tra lại!');
      setOtpInput(Array(6).fill(''));
      setTimeout(() => {
        document.getElementById('otp-input-0')?.focus();
      }, 50);
      return;
    }
    
    setIsLoading(true);
    setLoginError(null);
    try {
      // Sign in anonymously first to get Firebase auth credentials
      let uid: string;
      try {
        const userCredential = await signInAnonymously(auth);
        uid = userCredential.user.uid;
      } catch (authErr) {
        console.warn("Firebase Auth failure, generating local session ID:", authErr);
        uid = 'local-user-' + Math.floor(100000 + Math.random() * 900000);
      }

      // Check if user already exists in Firestore by querying their contact
      const contactQuery = query(collection(db, 'users'), where('contact', '==', loginContact.trim()));
      const contactSnap = await getDocs(contactQuery);
      
      if (!contactSnap.empty) {
        const existingUser = contactSnap.docs[0].data();
        onStart(existingUser.photoUrl || '/new-test.png', existingUser.fullName, existingUser.userId);
      } else {
        // Check localStorage matching contact
        const localUserStr = localStorage.getItem('vinclub_local_user');
        if (localUserStr) {
          try {
            const localUser = JSON.parse(localUserStr);
            if (localUser.contact === loginContact.trim()) {
              onStart(localUser.photoUrl || '/new-test.png', localUser.fullName, localUser.userId);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error("Local user load error:", e);
          }
        }
        
        // Strictly refuse entry for unregistered accounts
        setLoginError('Tài khoản chưa được đăng ký trong hệ thống VinClub. Vui lòng bấm Đăng ký.');
        setStep('login');
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      setLoginError("Xác thực mã OTP thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value !== '' && isNaN(Number(value))) return;
    
    const newInput = [...otpInput];
    newInput[index] = value.slice(-1); // Only keep last typed character
    setOtpInput(newInput);
    
    if (value !== '' && index < 5) {
      setTimeout(() => {
        document.getElementById(`otp-input-${index + 1}`)?.focus();
      }, 10);
    }
    
    const fullCode = newInput.join('');
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otpInput[index] === '' && index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        prevInput?.focus();
        
        const newInput = [...otpInput];
        newInput[index - 1] = '';
        setOtpInput(newInput);
      } else {
        const newInput = [...otpInput];
        newInput[index] = '';
        setOtpInput(newInput);
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateContact(loginContact);
    if (!validation.isValid) {
      setLoginError(validation.error || 'Vui lòng nhập số điện thoại hoặc email hợp lệ.');
      return;
    }

    if (loginContact.trim() === 'admin@gmail.com') {
      window.location.href = '/admin';
      return;
    }

    setLoginError(null);
    setIsLoading(true);
    try {
      const contactVal = loginContact.trim();
      
      // Checking Firestore for registered users
      const contactQuery = query(collection(db, 'users'), where('contact', '==', contactVal));
      const contactSnap = await getDocs(contactQuery);
      
      let exists = !contactSnap.empty;
      
      if (!exists) {
        const contactRef = doc(db, 'unique_contacts', contactVal);
        const contactDoc = await getDoc(contactRef);
        if (contactDoc.exists()) {
          exists = true;
        }
      }
      
      if (!exists) {
        // Fallback check in localStorage
        const localUserStr = localStorage.getItem('vinclub_local_user');
        if (localUserStr) {
          try {
            const localUser = JSON.parse(localUserStr);
            if (localUser.contact === contactVal) {
              exists = true;
            }
          } catch (e) {}
        }
      }

      if (!exists) {
        setLoginError('Tài khoản chưa được đăng ký trong hệ thống VinClub. Vui lòng bấm Đăng ký tài khoản mới ở phía dưới.');
        setIsLoading(false);
        return;
      }

      generateAndSendOtp();
      setStep('otp');
    } catch (error: any) {
      console.error("Login check failed:", error);
      setLoginError("Không thể xác thực thông tin đăng nhập. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setRegError('Vui lòng nhập họ và tên');
      return;
    }
    
    const validation = validateContact(regContact);
    if (!validation.isValid) {
      setRegError(validation.error || 'Vui lòng nhập số điện thoại hoặc email hợp lệ.');
      return;
    }

    if (!regReferralCode.trim()) {
      setRegError('Vui lòng nhập mã giới thiệu (Bắt buộc)');
      return;
    }

    if (!regReferralCode || regReferralCode.trim().toUpperCase() !== 'V-ECO') {
      setRegError('Mã giới thiệu bắt buộc là "V-ECO".');
      return;
    }
    setRegError(null);
    setIsLoading(true);

    try {
      const contactVal = regContact.trim();
      const contactRef = doc(db, 'unique_contacts', contactVal);
      const contactDoc = await getDoc(contactRef);
      
      if (contactDoc.exists()) {
        setRegError('Tài khoản với số điện thoại/email này đã được đăng ký.');
        setIsLoading(false);
        return;
      }
      
      // Fallback check in users collection just in case
      const q = query(collection(db, 'users'), where('contact', '==', contactVal));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setRegError('Tài khoản với số điện thoại/email này đã được đăng ký.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setStep('terms');
    } catch (err) {
      console.error("Register check err", err);
      setRegError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
      setIsLoading(false);
    }
  };

  const handleStart = async (url: string) => {
    setIsLoading(true);
    const finalName = regFullName.trim() || (loginContact.trim() ? "Thượng Khách (" + loginContact.trim() + ")" : "Trần Duy Thái");
    const finalContact = regContact.trim() || loginContact.trim() || "N/A";
    
    try {
      let uid: string;
      try {
        uid = auth.currentUser?.uid || (await signInAnonymously(auth)).user.uid;
      } catch (authErr) {
        console.warn("Unable to authenticate via Firebase Auth. Generating local session ID:", authErr);
        uid = 'local-user-' + Math.floor(100000 + Math.random() * 900000);
      }

      const profile = {
        userId: uid,
        fullName: finalName,
        contact: finalContact,
        photoUrl: url,
        points: 0,
        balance: 0,
        rank: "THÀNH VIÊN / MEMBER",
        memberId: "VNC-" + Math.floor(100000 + Math.random() * 900000),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Always store locally as fallback/quick session loader
      localStorage.setItem('vinclub_local_user', JSON.stringify(profile));

      // Always try to write to Firestore users collection
      try {
        const userRef = doc(db, 'users', uid);
        const contactRef = doc(db, 'unique_contacts', finalContact);
        
        const batch = writeBatch(db);
        batch.set(userRef, {
          ...profile,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        if (finalContact !== 'N/A') {
          batch.set(contactRef, {
            uid: uid,
            createdAt: new Date()
          });
        }
        await batch.commit();

        // Send welcome notification
        await addDoc(collection(db, 'notifications'), {
          userId: uid,
          title: 'Chào mừng thành viên mới',
          message: `Chào mừng ${finalName} đến với VINCLUB!`,
          createdAt: new Date(),
          isRead: false
        });
      } catch (dbErr) {
        console.warn("Unable to write profile to Firestore:", dbErr);
      }

      onStart(url, finalName, uid);
    } catch (error) {
      console.error("onboarding start error:", error);
      // absolute fail-safe fallback to ensure user is never blocked
      const localUid = 'local-user-' + Math.floor(100000 + Math.random() * 900000);
      const fallbackProfile = {
        userId: localUid,
        fullName: finalName,
        contact: finalContact,
        photoUrl: url,
        points: 0,
        balance: 0,
        rank: "THÀNH VIÊN / MEMBER",
        memberId: "VNC-" + Math.floor(100000 + Math.random() * 900000),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('vinclub_local_user', JSON.stringify(fallbackProfile));
      onStart(url, finalName, localUid);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = () => {
    handleStart('/new-test.png');
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      setUseCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error("Camera access denied", e);
      setUseCamera(false);
      setCameraError("Không thể kết nối với camera hoặc quyền truy cập bị từ chối. Quý khách vui lòng tải ảnh từ thiết bị.");
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const w = videoRef.current.videoWidth;
      const h = videoRef.current.videoHeight;
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, w, h);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPreviewUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setUseCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadDemoImage = async () => {
    try {
      const res = await fetch('/new-test.png');
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load demo image', err);
      setPreviewUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=533&q=80');
    }
  };

  return (
    <div className="absolute inset-0 bg-neutral-950 text-white font-sans overflow-hidden flex flex-col justify-between w-full h-full">
      {/* GORGEOUS SMS OTP FLOATING NOTIFICATION */}
      <AnimatePresence>
        {showOtpAlert && step === 'otp' && (
          <motion.div
            initial={{ y: -120, x: "-50%", opacity: 0 }}
            animate={{ y: 20, x: "-50%", opacity: 1 }}
            exit={{ y: -120, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 120 }}
            className="absolute top-0 left-1/2 z-50 w-[90%] max-w-sm"
          >
            <div className="bg-neutral-900/95 border-2 border-amber-500/60 rounded-xl p-4 shadow-[0_10px_30px_rgba(245,158,11,0.3)] backdrop-blur-md flex flex-col gap-2 text-stone-200">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <Bell className="w-3.5 h-3.5 animate-bounce" />
                  VINCLUB SECURITY SMS
                </div>
                <button
                  onClick={() => setShowOtpAlert(false)}
                  className="text-stone-500 hover:text-white text-xs cursor-pointer font-bold px-1.5 py-0.5 rounded hover:bg-white/5 transition-all"
                >
                  X
                </button>
              </div>
              <div className="text-xs leading-relaxed font-normal">
                Mã xác thực OTP đăng nhập dịch vụ của Quý khách là:{' '}
                <span className="text-sm font-black text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded inline-block animate-pulse">
                  {otpCode}
                </span>
                . Vui lòng nhập mã này trên màn hình để xác nhận quyền truy cập tài khoản VIP.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background with responsive alignment */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
          style={{ 
            backgroundImage: `url(${step === 'register' ? registerBg : step === 'terms' ? termsBg : loginBg})`,
            backgroundPosition: 'center top'
          }}
        />
        {step !== 'terms' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/90 to-transparent md:via-[#121212]/80 z-1" />
            <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-[#141210]/30 to-transparent pointer-events-none z-1" />
          </>
        )}
      </div>

      {/* Header Container */}
      {step !== 'terms' && (
        <header className="relative z-20 w-full h-16 border-b border-white/10 bg-[#131313]/80 backdrop-blur-xl flex items-center justify-between px-6">
          {/* Leading Back Icon */}
          <div className="w-10">
            {step !== 'login' && (
              <button 
                onClick={() => {
                  if (step === 'register') setStep('login');
                  else if (step === 'otp') { setStep('login'); setLoginError(null); }
                  else if (step === 'upload') setStep('login');
                }}
                aria-label="Go back" 
                className="text-[#dcc2a6] hover:opacity-80 transition-opacity active:scale-95 flex items-center justify-center p-2 -ml-2 cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
          </div>
          
          {/* Brand Logo centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <ProgressiveImage src="/logo.png" alt="Vinclub Logo" className="h-9 w-auto" imgClassName="object-contain" />
          </div>

          {/* Empty div for flex balance */}
          <div className="w-10"></div>
        </header>
      )}

      {/* Main Form Content Area */}
      <main className="relative z-10 flex-grow flex flex-col justify-end pb-12 pt-8 px-6 w-full max-w-md mx-auto overflow-y-auto">
        {/* Intro Video */}
        <div className="w-full h-auto mb-6">
          <video src="/intro.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover rounded-lg" />
        </div>
        <AnimatePresence mode="wait">
          
          {/* STEP 1: LOGIN SCREEN */}
          {step === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col gap-6"
            >
              <div className="text-center">
                <h1 className="text-[19px] font-semibold text-white tracking-wide leading-snug">
                  Truy cập bằng số điện thoại hoặc email
                </h1>
              </div>

              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                <div className="relative">
                  <input 
                    type="text"
                    value={loginContact}
                    onChange={(e) => {
                      setLoginContact(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Nhập số điện thoại hoặc email"
                    className="w-full bg-neutral-950/60 border border-amber-500/20 hover:border-amber-500/40 rounded-lg p-4 text-[15px] text-white placeholder-white/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all h-12"
                  />
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/40 p-2.5 border border-red-900/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 hover:from-amber-600 hover:to-yellow-700 font-bold text-[16px] rounded-lg py-3 transition-all duration-200 h-12 cursor-pointer flex items-center justify-center uppercase tracking-widest text-xs shadow-[0_4px_12px_rgba(245,158,11,0.25)] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Tiếp tục"
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button 
                  onClick={() => setStep('register')}
                  className="text-white/75 hover:text-white text-sm font-medium hover:underline transition-all cursor-pointer"
                >
                  Đăng ký tài khoản mới
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP: OTP VERIFICATION SCREEN */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300"
            >
              <div className="text-center flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-1 text-amber-500 animate-pulse">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-[19px] font-semibold text-white tracking-wide leading-snug">
                  Xác thực mã bảo mật OTP
                </h1>
                <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
                  Hệ thống đã gửi một mã OTP gồm 6 chữ số tới thông tin liên hệ của quý khách:
                </p>
                <span className="text-sm font-semibold text-amber-500 font-mono tracking-wider bg-amber-950/40 px-3 py-1 border border-amber-500/20 rounded-full">
                  {loginContact}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {/* 6 Digit Input Fields */}
                <div className="flex justify-between items-center gap-2 px-1">
                  {otpInput.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="w-12 h-14 bg-neutral-950/80 border border-amber-500/20 hover:border-amber-500/40 rounded-lg text-center text-xl font-bold font-mono text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-md"
                    />
                  ))}
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/40 p-2.5 border border-red-900/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="flex flex-col gap-3.5 mt-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-400 font-normal">Không nhận được mã?</span>
                    {otpResendCountdown > 0 ? (
                      <span className="text-stone-500 font-mono">Gửi lại sau {otpResendCountdown}s</span>
                    ) : (
                      <button
                        onClick={generateAndSendOtp}
                        className="text-amber-500 hover:text-amber-400 font-bold transition-all cursor-pointer flex items-center gap-1 hover:underline"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                        Gửi lại mã OTP
                      </button>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-4 flex gap-3">
                    <button
                      onClick={() => {
                        setStep('login');
                        setLoginError(null);
                      }}
                      className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-stone-300 font-bold text-xs rounded-lg transition-all uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 h-11"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Thay đổi sđt/email
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: REGISTER SCREEN */}
          {step === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col gap-6"
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white font-display text-center">
                  Tạo tài khoản mới
                </h1>
              </div>

              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                <div className="relative">
                  <input 
                    type="text"
                    value={regFullName}
                    onChange={(e) => {
                      setRegFullName(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    placeholder="Họ và tên"
                    className="w-full bg-neutral-950/60 border border-amber-500/20 hover:border-amber-500/40 rounded-lg p-4 text-[15px] text-white placeholder-white/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all h-12"
                  />
                </div>

                <div className="relative">
                  <input 
                    type="text"
                    value={regContact}
                    onChange={(e) => {
                      setRegContact(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    placeholder="Số điện thoại hoặc Email"
                    className="w-full bg-neutral-950/60 border border-amber-500/20 hover:border-amber-500/40 rounded-lg p-4 text-[15px] text-white placeholder-white/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all h-12"
                  />
                </div>

                <div className="relative">
                  <input 
                    type="text"
                    value={regReferralCode}
                    onChange={(e) => {
                      setRegReferralCode(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    placeholder="Nhập mã giới thiệu"
                    className="w-full bg-neutral-950/60 border border-amber-500/20 hover:border-amber-500/40 rounded-lg p-4 text-[15px] text-white placeholder-white/40 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all h-12"
                  />
                </div>

                {regError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/40 p-2.5 border border-red-900/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 hover:from-amber-600 hover:to-yellow-700 font-bold text-[16px] rounded-lg py-3 transition-all duration-200 h-12 cursor-pointer flex items-center justify-center uppercase tracking-widest text-xs shadow-[0_4px_12px_rgba(245,158,11,0.25)] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Đăng ký"
                  )}
                </button>
              </form>

              <div className="text-center font-normal text-sm text-white/50">
                Đã có tài khoản?{' '}
                <button 
                  onClick={() => setStep('login')}
                  className="text-amber-500 hover:text-amber-400 font-medium underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Đăng nhập
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: TERMS & CONDITIONS */}
          {step === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md"
            >
              <div className="w-full max-w-md bg-neutral-900/95 border-2 border-amber-500/30 rounded-xl p-1 shadow-2xl h-[92vh] max-h-[800px] flex flex-col relative overflow-hidden text-stone-200">
                {/* Custom Corner Cutouts matching the mockup */}
                <div className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full border-2 border-amber-500/30 bg-neutral-950 z-40" />
                <div className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full border-2 border-amber-500/30 bg-neutral-950 z-40" />
                <div className="absolute -bottom-2.5 -left-2.5 w-5 h-5 rounded-full border-2 border-amber-500/30 bg-neutral-950 z-40" />
                <div className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full border-2 border-amber-500/30 bg-neutral-950 z-40" />

                {/* SVG Watermark Background */}
                <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 opacity-[0.04] pointer-events-none z-0" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" fill="none" r="90" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="2"></circle>
                  <circle cx="100" cy="100" fill="none" r="70" stroke="#f59e0b" strokeWidth="1"></circle>
                  <path d="M 60 140 Q 100 180 140 140" fill="none" stroke="#f59e0b" strokeWidth="2"></path>
                  <text fill="#f59e0b" fontSize="20" fontWeight="bold" opacity="0.3" textAnchor="middle" x="100" y="100">VINCLUB</text>
                </svg>

                <div className="border border-amber-500/10 rounded-lg p-5 flex flex-col h-full relative z-10 overflow-hidden justify-between">
                  {/* Header Section */}
                  <div className="text-center">
                    {/* Brand Logo */}
                    <div className="flex justify-center mb-2">
                      <ProgressiveImage src="/logo.png" alt="Vinclub Logo" style={{ height: "48px", width: "auto" }} imgClassName="object-contain" />
                    </div>
                    <p className="text-stone-400 text-xs mb-1">
                      Xin chào <span className="font-semibold text-white">{regFullName.trim() || loginContact.trim() || "Trần Duy Thái"}</span>,
                    </p>
                    <h1 className="text-amber-500 font-bold text-[19px] leading-snug uppercase tracking-wide">
                      ĐIỀU KHOẢN THAM GIA<br/>VINCLUB
                    </h1>
                  </div>

                  {/* Terms List Scroll Zone */}
                  <div className="flex-grow overflow-y-auto my-3 pr-1 space-y-4 text-left">
                    {/* Item 1 */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </div>
                      <p className="text-stone-300 text-xs leading-relaxed font-normal">
                        Khi đăng ký tham gia VinClub, Quý khách xác nhận đã đủ 18 tuổi, có đầy đủ năng lực hành vi dân sự và tự nguyện tham gia các hoạt động đầu tư trên nền tảng.
                      </p>
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </div>
                      <p className="text-stone-300 text-xs leading-relaxed font-normal">
                        Người dùng hiểu rằng mọi khoản đầu tư đều tiềm ẩn rủi ro nhất định, đồng thời cam kết tự tìm hiểu, cân nhắc và chịu trách nhiệm đối với các quyết định tài chính của mình.
                      </p>
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                      </div>
                      <p className="text-stone-300 text-xs leading-relaxed font-normal">
                        VinClub không cam kết lợi nhuận cố định trong mọi trường hợp và có quyền cập nhật, điều chỉnh các chính sách, điều khoản nhằm phù hợp với quy định hiện hành và quyền lợi chung của cộng đồng thành viên.
                      </p>
                    </div>
                  </div>

                  {/* Footer & Buttons */}
                  <div className="border-t border-amber-500/20 pt-3 text-center mt-auto">
                    <p className="text-[13px] text-amber-400 font-bold leading-normal mb-3 px-2">
                      Quý khách đã đọc, hiểu rõ và đồng ý với các điều khoản tham gia VinClub hay chưa?
                    </p>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setStep('register')}
                        disabled={isLoading}
                        className="flex-1 py-2.5 px-4 border border-amber-500/30 rounded-lg text-amber-500 hover:bg-white/5 active:bg-white/10 font-bold text-xs bg-transparent transition-colors duration-150 uppercase tracking-wider cursor-pointer disabled:opacity-50"
                      >
                        KHÔNG ĐỒNG Ý
                      </button>
                      <button 
                        onClick={handleAcceptTerms}
                        disabled={isLoading}
                        className="flex-1 py-2.5 px-4 border border-transparent rounded-lg text-neutral-950 font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 transition-colors duration-150 uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "ĐỒNG Ý"
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PHOTO BOOTH SELECTION */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col gap-6"
            >
              {!previewUrl && !useCamera && (
                <div className="flex flex-col gap-5 text-center">
                  <div>
                    <h1 className="text-xl font-bold font-display tracking-tight text-white uppercase">
                      THẺ HÀNH TRÌNH VINCLUB
                    </h1>
                    <p className="text-xs text-amber-500 mt-1 tracking-wider uppercase font-mono">
                      Cung cấp ảnh chân dung của bạn để bắt đầu
                    </p>
                  </div>

                  <div className="flex flex-col gap-3.5 w-full">
                    {cameraError && (
                      <div className="text-red-400 text-xs bg-red-950/40 p-2.5 border border-red-900/30 rounded-lg text-left flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{cameraError}</span>
                      </div>
                    )}
                    <button 
                      onClick={startCamera}
                      className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-solid border-amber-500/30 text-amber-400 bg-transparent hover:bg-amber-500/5 transition-colors uppercase tracking-widest text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Chụp ảnh chân dung
                    </button>
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-solid border-amber-500/30 text-amber-400 bg-transparent hover:bg-amber-500/5 transition-colors uppercase tracking-widest text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Tải ảnh từ thiết bị
                    </button>

                    <button 
                      onClick={loadDemoImage}
                      className="flex items-center justify-center gap-3 w-full py-3 px-6 bg-neutral-900/60 hover:bg-neutral-900/80 text-stone-200 transition-colors uppercase tracking-widest text-[11px] font-semibold rounded-lg cursor-pointer border border-amber-500/10"
                    >
                      Sử dụng ảnh mẫu
                    </button>
                  </div>

                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                  />
                  
                  <p className="text-[10px] text-white/40 leading-relaxed text-left bg-neutral-900/60 p-4 border border-amber-500/10 rounded-lg">
                    Bằng việc tải ảnh lên, bạn xác nhận có quyền sở hữu hợp pháp đối với ảnh chân dung này để phục vụ trải nghiệm WebGL của Vinclub.
                  </p>
                </div>
              )}

              {useCamera && !previewUrl && (
                <div className="flex flex-col items-center gap-5 w-full">
                  <div className="relative w-full aspect-[3/4] max-h-[40vh] bg-neutral-900 border border-amber-500/20 overflow-hidden rounded-lg shadow-2xl">
                    <video ref={videoRef} className="object-cover w-full h-full" playsInline muted />
                  </div>
                  <button 
                    onClick={takePhoto}
                    className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 font-bold transition-colors uppercase tracking-widest text-xs rounded-lg cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.25)]"
                  >
                    <Camera className="w-4 h-4" />
                    Chụp hình ngay
                  </button>
                  <button 
                    onClick={stopCamera}
                    className="text-xs uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>
              )}

              {previewUrl && (
                <div className="flex flex-col items-center gap-6 w-full animate-in fade-in zoom-in duration-300">
                  <div className="w-40 aspect-[3/4] border-2 border-amber-500/30 rounded-lg overflow-hidden bg-neutral-900 shadow-2xl relative">
                    <ProgressiveImage src={previewUrl} alt="Preview" className="w-full h-full" imgClassName="object-cover" />
                    <div className="absolute bottom-2 left-0 right-0 text-center">
                      <span className="bg-black/80 text-[8px] uppercase tracking-widest font-mono py-1 px-2.5 text-amber-400 border border-amber-500/30">
                        VIP MEMBER
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleStart(previewUrl)}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 font-bold transition-all uppercase tracking-widest text-xs rounded-lg cursor-pointer shadow-[0_4px_16px_rgba(245,158,11,0.25)] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Bắt đầu hành trình
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => setPreviewUrl(null)}
                    className="text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    Chọn ảnh khác
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
