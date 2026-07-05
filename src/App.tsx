import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Briefcase, TrendingUp, ShieldCheck, Search, Bell, X, Sparkles, MapPin, CheckCircle, Clock, ArrowDownLeft, ArrowUpRight, HelpCircle, Megaphone } from 'lucide-react';
import GalleryGlobe from './components/GalleryGlobe';
import IntroScreen from './components/IntroScreen';
import LocationDetailsScreen from './components/LocationDetailsScreen';
import LoadingOverlay from './components/LoadingOverlay';
import VIPCardTab from './components/VIPCardTab';
import BalanceCard from './components/BalanceCard';
import ProfileTab from './components/ProfileTab';
import SupportTab from './components/SupportTab';
import { LOCATIONS } from './data';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, collection, onSnapshot, addDoc, query, where, runTransaction, serverTimestamp } from 'firebase/firestore';
import QuickMenuGrid from './components/QuickMenuGrid';
import ContractSignModal from './components/ContractSignModal';
import ProgressiveImage from './components/ProgressiveImage';
import DepositModal from './components/DepositModal';
import AdminApp from './components/AdminApp';

// Helper function to composite the user's selfie onto an investment photo for search selection
function compositeUserPhotoForSearch(
  travelImageUrl: string,
  userPhotoBase64: string,
  locationName: string,
  callback: (compositedUrl: string) => void
) {
  const travelImg = new Image();
  travelImg.crossOrigin = 'anonymous';
  travelImg.src = travelImageUrl;

  travelImg.onload = () => {
    const userImg = new Image();
    userImg.src = userPhotoBase64;

    userImg.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 533;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback(travelImageUrl);
        return;
      }

      ctx.drawImage(travelImg, 0, 0, 400, 533);
      
      // Draw gold borders
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, 388, 521);

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, 364, 497);

      // Draw premium bottom bar
      ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
      ctx.fillRect(12, 430, 376, 91);

      ctx.fillStyle = '#d4af37';
      ctx.fillRect(12, 430, 376, 3);

      // Draw luxury text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      let name = locationName || "DỰ ÁN ĐẦU TƯ";
      if (name.length > 28) {
        name = name.slice(0, 26) + "...";
      }
      ctx.fillText(name.toUpperCase(), 24, 460);

      ctx.fillStyle = '#d4af37';
      ctx.font = '9px monospace';
      ctx.fillText("HỆ SINH THÁI VINCLUB VIP", 24, 485);

      // Draw VIP avatar
      ctx.save();
      const pW = 85;
      const pH = 100;
      const pX = 295;
      const pY = 415;

      ctx.fillStyle = '#000000';
      ctx.fillRect(pX, pY, pW, pH);
      ctx.drawImage(userImg, pX + 4, pY + 4, pW - 8, pH - 24);
      
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.strokeRect(pX, pY, pW, pH);

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("CỔ ĐÔNG VIP", pX + pW / 2, pY + pH - 10);
      ctx.restore();

      try {
        callback(canvas.toDataURL('image/jpeg', 0.9));
      } catch (e) {
        console.warn("toDataURL failed in search photo composite, falling back to raw travelImageUrl", e);
        callback(travelImageUrl);
      }
    };

    userImg.onerror = () => callback(travelImageUrl);
  };

  travelImg.onerror = () => callback(travelImageUrl);
}

const getRelativeTime = (timestamp: number) => {
  if (!timestamp) return "Vừa xong";
  const diffInMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffInMinutes < 1) return "Vừa xong";
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  return `${Math.floor(diffInHours / 24)} ngày trước`;
};

import NewsSection from './components/NewsSection';
import AllNewsPage from './components/AllNewsPage';
import NewsDetailPage from './components/NewsDetailPage';
import AllProjectsPage from './components/AllProjectsPage';
import ReceiptModal from './components/ReceiptModal';

const liveWithdrawals = [
  "Nguyễn Văn Bảo rút lãi suất thành công 250.000.000 VND",
  "Trần Thị Lan rút lãi suất thành công 75.000.000 VND",
  "Phạm Minh Hoàng rút lãi suất thành công 1.250.000.000 VND",
  "Lê Thanh Sơn rút lãi suất thành công 3.500.000.000 VND",
  "Hoàng Anh Tuấn rút lãi suất thành công 10.000.000.000 VND",
  "Nguyễn Thị Phương rút lãi suất thành công 450.000.000 VND",
  "Vũ Đức Long rút lãi suất thành công 8.200.000.000 VND",
  "Đỗ Minh Trí rút lãi suất thành công 150.000.000 VND",
  "Lâm Bửu Gia rút lãi suất thành công 950.000.000 VND",
  "Tạ Quốc Bảo rút lãi suất thành công 5.400.000.000 VND"
];
const marqueeText = liveWithdrawals.join("   •   ") + "   •   ";

export default function App() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Trần Duy Thái");
  const [userId, setUserId] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [rank, setRank] = useState<string>("THÀNH VIÊN / MEMBER");
  const [memberId, setMemberId] = useState<string>("");
  const [userData, setUserData] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<{ image: string; location: string; info: string; project?: any } | null>(null);
  const [isLoadingGlobe, setIsLoadingGlobe] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'vip' | 'profile' | 'support'>('home');

  const [appView, setAppView] = useState<'main' | 'all-news' | 'all-projects'>('main');
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [lockVerticalMotion, setLockVerticalMotion] = useState<boolean>(true);
  const [broadcast, setBroadcast] = useState<string>('');
  const seedingInProgress = useRef(false);
  const [realTransactions, setRealTransactions] = useState<any[]>([]);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<any | null>(null);

  useEffect(() => {
    if (!userId) {
      setRealTransactions([]);
      return;
    }
    const txQuery = query(collection(db, 'transactions'), where('userId', '==', userId));
    const unsub = onSnapshot(txQuery, (snap) => {
      const txs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      txs.sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setRealTransactions(txs);
    }, (err) => console.error("Error listening to transactions:", err));
    return unsub;
  }, [userId]);

  // Automatic Investment Maturity check
  useEffect(() => {
    if (!userId || !userData || realTransactions.length === 0) return;

    const checkMaturity = async () => {
      const now = new Date();
      
      const activeInvestments = realTransactions.filter(tx => 
        tx.type === 'investment' && 
        tx.status === 'Thành công' && 
        tx.settled !== true
      );

      if (activeInvestments.length === 0) return;

      for (const tx of activeInvestments) {
        const durationStr = tx.duration || "7200 phút";
        const durationMinutes = parseInt(durationStr.replace(/[^0-9]/g, ''), 10) || 7200;
        
        const createdDate = tx.createdAt?.seconds 
          ? new Date(tx.createdAt.seconds * 1000)
          : tx.date 
            ? new Date(tx.date) 
            : new Date();

        const maturityDate = new Date(createdDate.getTime() + durationMinutes * 60 * 1000);

        if (now >= maturityDate) {
          console.log("Matured Investment detected:", tx.id, "Maturity Date:", maturityDate);
          
          try {
            const rateStr = tx.interestRate || "1.50 %";
            const rateVal = parseFloat(rateStr.replace(/[^0-9.]/g, '')) || 1.5;
            
            const days = durationMinutes / 1440;
            
            const profit = Math.floor(tx.amount * (rateVal / 100) * days);
            const totalReturn = tx.amount + profit;

            await runTransaction(db, async (transaction) => {
              const userRef = doc(db, 'users', userId);
              const userSnap = await transaction.get(userRef);
              if (!userSnap.exists()) return;

              const currentBalance = userSnap.data().balance || 0;
              const txRef = doc(db, 'transactions', tx.id);
              
              transaction.update(txRef, { settled: true });
              
              transaction.update(userRef, { 
                balance: currentBalance + totalReturn,
                updatedAt: serverTimestamp()
              });

              const returnTxRef = doc(collection(db, 'transactions'));
              transaction.set(returnTxRef, {
                userId: userId,
                userName: tx.userName || userData.name || 'Nhà Đầu Tư',
                amount: totalReturn,
                type: 'plus',
                title: `Kết toán đầu tư: ${tx.title?.replace("Đầu tư: ", "") || "Dự án ủy thác"}`,
                status: 'Thành công',
                description: `Hoàn trả gốc và lãi suất ${rateStr} thời hạn ${durationStr}`,
                createdAt: serverTimestamp()
              });
            });

            alert(`🎉 Hợp đồng đầu tư ${tx.contractId || tx.id} đã đáo hạn thành công!\n\nSố tiền gốc & lãi tổng cộng ${totalReturn.toLocaleString('vi-VN')} VND đã được hoàn trả tự động vào tài khoản VinClub của bạn.`);

          } catch (e) {
            console.error("Error settling matured investment:", e);
          }
        }
      }
    };

    const timer = setTimeout(checkMaturity, 1500);
    return () => clearTimeout(timer);

  }, [userId, realTransactions, userData]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'projects'), async (snap) => {
      if (snap.empty && !seedingInProgress.current) {
        seedingInProgress.current = true;
        const getCategoryOfLocation = (name: string): string => {
          if (name.includes("Vinhomes") || name.includes("Happy Town") || name.includes("Biệt thự")) {
            return "BẤT ĐỘNG SẢN";
          }
          if (name.includes("Vinpearl Resort") || name.includes("Vinpearl Luxury") || name.includes("Oasis") || name.includes("Safari") || name.includes("Wonders") || name.includes("Golf")) {
            return "NGHỈ DƯỠNG";
          }
          if (name.includes("Vinschool") || name.includes("VinUni")) {
            return "GIÁO DỤC";
          }
          if (name.includes("Vinmec") || name.includes("VinFA") || name.includes("VinCharm")) {
            return "Y TẾ";
          }
          if (name.includes("VinFast") || name.includes("Vsmart") || name.includes("VinBus") || name.includes("VinAI") || name.includes("VinBigData") || name.includes("VinCSS") || name.includes("HMS") || name.includes("VinTech") || name.includes("VinConnect") || name.includes("VinDiGix") || name.includes("One Mount") || name.includes("VinID")) {
            return "CÔNG NGHỆ";
          }
          if (name.includes("Quỹ Vì Tương Lai Xanh")) {
            return "NĂNG LƯỢNG";
          }
          if (name.includes("Vincom") || name.includes("WinMart") || name.includes("Adayroi") || name.includes("VinPro") || name.includes("VinDS") || name.includes("Viễn Thông A") || name.includes("VinKC")) {
            return "THƯƠNG MẠI";
          }
          if (name.includes("VinVentures")) {
            return "ĐẦU TƯ";
          }
          return "THƯƠNG MẠI";
        };

        const getTabOfLocation = (name: string): string => {
          if (name.includes("Vinhomes")) return "Vinhomes";
          if (name.includes("VinFast")) return "VinFast";
          if (name.includes("Vinpearl")) return "Vinpearl";
          return "Đầu tư Chung";
        };

        const getUnsplashIdOfLocation = (name: string): string => {
          const UNSPLASH_IDS: Record<string, string> = {
            "Vinhomes Riverside, Hà Nội": "photo-1600585154340-be6161a56a0c",
            "Vinhomes Grand Park, TP.HCM": "photo-1545324418-cc1a3fa10c00",
            "Vinhomes Ocean Park, Gia Lâm": "photo-1512917774080-9991f1c4c750",
            "Vinhomes Golden River, Ba Son": "photo-1486406146926-c627a92ad1ab",
            "Vincom Center Đồng Khởi": "photo-1568254183919-78a4f43a2877",
            "Vincom Mega Mall Royal City": "photo-1519501025264-65ba15a82390",
            "Vincom Plaza Đà Nẵng": "photo-1555529669-e69e7aa0ba9a",
            "VinOffice Tower Hà Nội": "photo-1497366216548-37526070297c",
            "Biệt thự Vinhomes Central Park": "photo-1600596542815-ffad4c1539a9",
            "Nhà ở xã hội Happy Town": "photo-1582407947304-fd86f028f716",
            "Vinpearl Resort Nha Trang": "photo-1571896349842-33c89424de2d",
            "Vinpearl Luxury Đà Nẵng": "photo-1540541338287-41700207dee6",
            "Vinpearl Golf Nam Hội An": "photo-1587174486073-ae5e5cff23aa",
            "VinOasis Phú Quốc": "photo-1542314831-068cd1dbfeeb",
            "Vinpearl Safari Phú Quốc": "photo-1534447677768-be436bb09401",
            "VinWonders Nha Trang": "photo-1505995433366-e12047f3f144",
            "Vinpearl Golf Hải Phòng": "photo-1535131749006-b7f58c99034b",
            "Hệ thống Vinschool Times City": "photo-1577896851231-70ef18881754",
            "Đại học Tinh hoa VinUni": "photo-1562774053-701939374585",
            "Bệnh viện Vinmec Times City": "photo-1584515979956-d9f6e5d09982",
            "Bệnh viện Vinmec Central Park": "photo-1519494026892-80bbd2d6fd0d",
            "Chuỗi bán lẻ dược phẩm VinFA": "photo-1586015555751-63bb77f4322a",
            "Tập đoàn xe điện toàn cầu VinFast": "photo-1617788138017-80ad40651399",
            "Nhà máy Ô tô VinFast Hải Phòng": "photo-1581091226825-a6a2a5aee158",
            "Xe buýt điện thông minh VinBus": "photo-1570125909232-eb263c188f7e",
            "Điện thoại thông minh Vsmart": "photo-1511707171634-5f897ff02aa9",
            "Siêu thị WinMart Times City": "photo-1542838132-92c53300491e",
            "Cửa hàng WinMart+": "photo-1604719312566-8912e9227c6a",
            "Thương mại điện tử Adayroi": "photo-1460925895917-afdab827c52f",
            "Chuỗi điện máy VinPro": "photo-1518770660439-4636190af475",
            "Bán lẻ thời trang VinDS": "photo-1483985988355-763728e1935b",
            "Hệ thống Viễn Thông A": "photo-1511707171634-5f897ff02aa9",
            "Viện Trí tuệ Nhân tạo VinAI": "photo-1526374965328-7f61d4dc18c5",
            "Nghiên cứu dữ liệu lớn VinBigData": "photo-1507146426996-ef05306b995a",
            "Hệ thống an ninh mạng VinCSS": "photo-1563986768609-322da13575f3",
            "Phát triển phần mềm HMS": "photo-1555066931-4365d14bab8c",
            "Nghiên cứu nguyên vật liệu VinTech": "photo-1532187643603-ba119ca4109e",
            "Dịch vụ công nghệ VinConnect": "photo-1515378791036-0648a3ef77b2",
            "Số hóa doanh nghiệp VinDiGix": "photo-1451187580459-43490279c0fa",
            "Hãng hàng không Vinpearl Air": "photo-1436491865332-7a61a109cc05",
            "Trường đào tạo phi công VinAviation": "photo-1517976487492-5750f3195933",
            "Xưởng phim hoạt hình VinTaTa": "photo-1534447677768-be436bb09401",
            "Hỗ trợ khởi nghiệp VinVentures": "photo-1559136555-9303baea8ebd",
            "Chăm sóc sức khỏe VinCharm": "photo-1519699047748-de8e457a634e",
            "Bán lẻ ngành trẻ em VinKC": "photo-1513159446162-54eb8bdaa79b",
            "Đại lý công nghệ One Mount Group": "photo-1552664730-d307ca884978",
            "Cổng thanh toán & Ví VinID": "photo-1559526324-4b87b5e36e44",
            "Quỹ Vì Tương Lai Xanh": "photo-1542601906990-b4d3fb778b09"
          };
          const id = UNSPLASH_IDS[name] || "photo-1507525428034-b723cf961d3e";
          return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;
        };

        const getInterestRateOfLocation = (name: string): string => {
          if (name.includes("Vinhomes")) return "1.45 %";
          if (name.includes("VinFast")) return "1.75 %";
          if (name.includes("Vinpearl") || name.includes("Wonders") || name.includes("Oasis") || name.includes("Safari")) return "1.55 %";
          if (name.includes("Vincom")) return "1.35 %";
          if (name.includes("VinAI") || name.includes("BigData") || name.includes("CSS") || name.includes("HMS") || name.includes("VinTech") || name.includes("VinConnect") || name.includes("VinDiGix") || name.includes("One Mount") || name.includes("VinID") || name.includes("VinVentures")) return "1.85 %";
          if (name.includes("Vinschool") || name.includes("VinUni")) return "1.20 %";
          if (name.includes("Vinmec") || name.includes("VinFA") || name.includes("VinCharm")) return "1.40 %";
          return "1.15 %";
        };

        const getMinInvestmentOfLocation = (name: string): string => {
          if (name.includes("Vinhomes") || name.includes("Vinpearl Resort") || name.includes("Vinpearl Luxury") || name.includes("VinFast")) {
            return "50.000.000 VNĐ";
          }
          if (name.includes("Vincom") || name.includes("VinUni") || name.includes("Vinmec") || name.includes("One Mount") || name.includes("VinVentures")) {
            return "20.000.000 VNĐ";
          }
          return "5.000.000 VNĐ";
        };

        const getScaleOfLocation = (name: string): string => {
          if (name.includes("VinFast") || name.includes("Vinhomes")) {
            return "15.000.000.000 VNĐ";
          }
          if (name.includes("Vinpearl") || name.includes("Vincom")) {
            return "5.000.000.000 VNĐ";
          }
          return "1.000.000.000 VNĐ";
        };

        const getDurationOfLocation = (name: string): string => {
          if (name.includes("VinFast") || name.includes("Vinhomes")) return "14400 phút";
          if (name.includes("Vinpearl") || name.includes("Vincom")) return "10080 phút";
          return "7200 phút";
        };

        const SPECIFIC_COORDS: Record<string, { lat: number; lng: number }> = {
          "Hệ thống Vinschool Times City": { lat: 21.0069, lng: 105.8678 },
          "Đại học Tinh hoa VinUni": { lat: 20.9850, lng: 105.9400 },
          "Bệnh viện Vinmec Times City": { lat: 21.0065, lng: 105.8690 },
          "Tập đoàn xe điện toàn cầu VinFast": { lat: 20.8033, lng: 106.7725 },
          "Nhà máy Ô tô VinFast Hải Phòng": { lat: 20.7950, lng: 106.7850 },
          "Vinpearl Resort Nha Trang": { lat: 12.2185, lng: 109.2240 },
          "Vinpearl Luxury Đà Nẵng": { lat: 16.0245, lng: 108.2615 },
          "Vinhomes Riverside, Hà Nội": { lat: 21.0385, lng: 105.9080 },
          "Vinhomes Grand Park, TP.HCM": { lat: 10.8400, lng: 106.8375 },
          "Vinhomes Ocean Park, Gia Lâm": { lat: 20.9895, lng: 105.9525 },
          "Vincom Center Đồng Khởi": { lat: 10.7780, lng: 106.7020 },
          "Quỹ Vì Tương Lai Xanh": { lat: 21.0285, lng: 105.8542 }
        };

        const seedProjects = LOCATIONS.map((name, idx) => {
          const category = getCategoryOfLocation(name);
          const tab = getTabOfLocation(name);
          const interestRate = getInterestRateOfLocation(name);
          const duration = getDurationOfLocation(name);
          const minInvestment = getMinInvestmentOfLocation(name);
          const scale = getScaleOfLocation(name);
          const progress = 70 + (idx * 7) % 28;
          const imageUrl = getUnsplashIdOfLocation(name);
          const customId = `VNC-${idx + 1 < 10 ? '0' : ''}${idx + 1}`;
          
          const baseProj: any = {
            customId,
            name,
            category,
            tab,
            interestRate,
            duration,
            minInvestment,
            scale,
            progress,
            status: "active",
            imageUrl
          };
          
          if (SPECIFIC_COORDS[name]) {
            baseProj.lat = SPECIFIC_COORDS[name].lat;
            baseProj.lng = SPECIFIC_COORDS[name].lng;
          }
          
          return baseProj;
        });

        for (const p of seedProjects) {
          try {
            await addDoc(collection(db, 'projects'), {
              ...p,
              createdAt: new Date()
            });
          } catch (err) {
            console.error("Auto-seeding error: ", err);
          }
        }
      } else {
        setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (err) => console.error("Error listening to projects:", err));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'system'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setLockVerticalMotion(data.lockVerticalMotion !== false);
        setBroadcast(data.broadcast || '');
      }
    }, (err) => console.error("Error listening to settings:", err));
    return unsub;
  }, []);

  const [newsList, setNewsList] = useState<any[]>([
    {
      title: "Vinhomes ra mắt dự án Royal Island siêu sang",
      date: "12/05/2026",
      img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80",
      tag: "Bất động sản"
    },
    {
      title: "VinFast mở rộng hệ thống trạm sạc toàn cầu",
      date: "09/05/2026",
      img: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400&q=80",
      tag: "Năng lượng xanh"
    }
  ]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'news'), (snap) => {
      const parseDateStr = (dateStr: string) => {
        if (!dateStr) return 0;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          const parsedDate = new Date(y, m, d);
          return isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
        }
        const parsed = Date.parse(dateStr);
        return isNaN(parsed) ? 0 : parsed;
      };

      const news = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }))
        .sort((a: any, b: any) => parseDateStr(b.date) - parseDateStr(a.date));
      
      if (news.length > 0) {
        setNewsList(news.map(n => ({
          id: n.id,
          title: n.title,
          date: n.date || new Date().toLocaleDateString('vi-VN'),
          img: n.img || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80",
          tag: n.tag || "Tin Tức",
          isFeatured: n.isFeatured || false,
          views: n.views || 0,
          content: n.content || ''
        })));
      }
    }, (err) => console.error("Error listening to news:", err));
    return unsub;
  }, []);

  // Search States
  
  const [showBalance, setShowBalance] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'plus' | 'minus'>('all');
  const [initialSupportMessage, setInitialSupportMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchingSpinner, setIsSearchingSpinner] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notification States
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(() => parseInt(localStorage.getItem('lastSeenNotifs') || '0', 10));
  const notificationContainerRef = useRef<HTMLDivElement>(null);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  useEffect(() => {
    // Load local user settings on mount
    const localUserStr = localStorage.getItem('vinclub_local_user');
    if (localUserStr) {
      try {
        const localUser = JSON.parse(localUserStr);
        if (localUser.fullName) setUserName(localUser.fullName);
        if (localUser.photoUrl) setUserPhoto(localUser.photoUrl);
        if (localUser.points) setPoints(localUser.points);
        if (localUser.rank) setRank(localUser.rank);
        if (localUser.memberId) setMemberId(localUser.memberId);
        if (localUser.userId) setUserId(localUser.userId);
        else if (localUser.uid) setUserId(localUser.uid);
      } catch (e) {
        console.error("Error loading local user on mount:", e);
      }
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        if (user.email === 'admin@gmail.com') {
          setIsAdmin(true);
          navigate('/admin');
        } else {
          setIsAdmin(false);
        }
      } else {
        const localUserStr = localStorage.getItem('vinclub_local_user');
        if (!localUserStr) {
          setUserId(null);
          setIsAdmin(false);
          setUserPhoto(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    if (auth.currentUser?.email === 'admin@gmail.com') {
      setIsAdmin(true);
      navigate('/admin');
      return;
    }

    const userRef = doc(db, 'users', userId);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData({ uid: userId, ...data });
        if (data.fullName) setUserName(data.fullName);
        if (data.photoUrl) setUserPhoto(data.photoUrl);
        if (data.points !== undefined) setPoints(data.points);
        if (data.balance !== undefined) setBalance(data.balance);
        if (data.rank) setRank(data.rank);
        if (data.memberId) setMemberId(data.memberId);
      }
    }, (err) => console.error("Error listening to user profile:", err));

    return () => unsubUser();
  }, [userId]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'notifications'), (snap) => {
      const notifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter based on targeted user or broadcast
      const filtered = notifs.filter((n: any) => {
        if (n.targetType === 'targeted') {
          return n.targetUserId === userId;
        }
        return true; // broadcast or default
      });

      filtered.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      setNotificationsList(filtered);
      
      const currentLastSeen = parseInt(localStorage.getItem('lastSeenNotifs') || '0', 10);
      setUnreadCount(filtered.filter((n: any) => n.timestamp > currentLastSeen).length);
    }, (err) => console.error("Error listening to notifications:", err));
    return unsub;
  }, [userId]);

  // Close search and notification list when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync linter requirement
  const handleReset = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
    localStorage.removeItem('vinclub_local_user');
    setUserPhoto(null);
    setUserId(null);
    setUserName("Trần Duy Thái");
    setPoints(0);
    setBalance(0);
    setUserData(null);
    setRank("THÀNH VIÊN / MEMBER");
    setMemberId("");
    setActiveTab('home');
    setSearchQuery('');
  };

  const handleUpdatePoints = async (newPoints: number) => {
    setPoints(newPoints);
    
    // Tier upgrade logic
    let newRank = "THÀNH VIÊN / MEMBER";
    if (newPoints >= 10000000000) {
      newRank = "KIM CƯƠNG / DIAMOND";
    } else if (newPoints >= 5000000000) {
      newRank = "BẠCH KIM / PLATINUM";
    } else if (newPoints >= 1000000000) {
      newRank = "VÀNG / GOLD";
    }
    setRank(newRank);
    
    // Sync to local storage
    const localUserStr = localStorage.getItem('vinclub_local_user');
    if (localUserStr) {
      try {
        const localUser = JSON.parse(localUserStr);
        localUser.points = newPoints;
        localUser.rank = newRank;
        localStorage.setItem('vinclub_local_user', JSON.stringify(localUser));
      } catch (e) {
        console.error("Error syncing points to local storage:", e);
      }
    }
    
    // Sync to firestore if userId is set
    if (userId) {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { points: newPoints, rank: newRank }, { merge: true });
      } catch (e) {
        console.error("Error syncing points to Firestore:", e);
      }
    }
  };

  const handleUpdateUserPhoto = async (newPhotoUrl: string) => {
    setUserPhoto(newPhotoUrl);
    
    // Sync to local storage
    const localUserStr = localStorage.getItem('vinclub_local_user');
    if (localUserStr) {
      try {
        const localUser = JSON.parse(localUserStr);
        localUser.photoUrl = newPhotoUrl;
        localStorage.setItem('vinclub_local_user', JSON.stringify(localUser));
      } catch (e) {
        console.error("Error syncing photo to local storage:", e);
      }
    }
    
    // Sync to firestore if userId is set
    if (userId) {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { photoUrl: newPhotoUrl }, { merge: true });
      } catch (e) {
        console.error("Error syncing photo to Firestore:", e);
      }
    }
  };

  // Swiping & Pulling states for smooth native pull-to-refresh & gestures
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isAtTop = useRef(true);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    isAtTop.current = scrollTop <= 0;
    if (isAtTop.current) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isAtTop.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      // Dynamic elastic resistance formula
      const resistance = 0.45;
      const distance = Math.pow(diff, 0.82) * resistance;
      setPullDistance(Math.min(distance, 110));
      // Stop body bounce from interfering with custom experience
      if (diff > 8 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 55 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(75);
      
      // Luxury refresh simulation with dynamic point adjustments
      setTimeout(() => {
        setPoints(prev => prev + Math.floor(100 + Math.random() * 200));
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1400);
    } else {
      setPullDistance(0);
    }
  };

  // Local matching suggestions
  const filteredSuggestions = searchQuery.trim() === ""
    ? []
    : LOCATIONS.filter(loc => loc.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6);

  // Handle location search selection
  const handleSelectLocation = async (locName: string) => {
    const idx = LOCATIONS.indexOf(locName);
    if (idx !== -1) {
      setSearchQuery("");
      setIsSearchFocused(false);
      setIsSearchingSpinner(true);
      try {
        const res = await fetch('/api/generate-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index: idx })
        });
        const data = await res.json();
        if (data.success && data.base64) {
          if (userPhoto) {
            compositeUserPhotoForSearch(data.base64, userPhoto, data.location, (compositedUrl) => {
              setSelectedCard({ image: compositedUrl, location: data.location, info: data.info });
              setActiveTab('home');
              setIsSearchingSpinner(false);
            });
          } else {
            setSelectedCard({ image: data.base64, location: data.location, info: data.info });
            setActiveTab('home');
            setIsSearchingSpinner(false);
          }
        } else {
          setIsSearchingSpinner(false);
        }
      } catch (err) {
        console.error("Search fetch error", err);
        setIsSearchingSpinner(false);
      }
    }
  };

  return (
    <div className="w-full h-full relative bg-transparent text-stone-100 overflow-hidden flex flex-col justify-between">
      {/* Global Broadcast Banner */}
      <AnimatePresence>
        {broadcast && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[9999] p-4 flex justify-center pointer-events-none"
          >
            <div className="bg-[#e1b777] text-neutral-950 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md pointer-events-auto">
              <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center animate-pulse">
                <Megaphone size={16} />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest leading-none">{broadcast}</p>
              <button 
                onClick={() => setBroadcast('')}
                className="ml-2 p-1 hover:bg-black/10 rounded-full transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!userPhoto ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#09090b] z-50">
          <IntroScreen onStart={(photo, name, uid) => {
            setUserPhoto(photo);
            setUserName(name || "Trần Duy Thái");
            if (uid) setUserId(uid);
            setIsLoadingGlobe(true);
          }} />
        </div>
      ) : (
        <>
          {/* GLOBE ENTRY LOADING OVERLAY */}
          <AnimatePresence>
            {isLoadingGlobe && (
              <motion.div
                key="loading-overlay"
                className="absolute inset-0 z-50 bg-[#09090b]"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <LoadingOverlay onComplete={() => setIsLoadingGlobe(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* TOP HEADER: SEARCH BAR + NOTIFICATION BELL */}
          {!isLoadingGlobe && activeTab === 'home' && !selectedCard && appView === 'main' && (
            <motion.header 
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-5 pb-10 px-4 flex items-center justify-between gap-4 pointer-events-auto select-none"
            >
              {/* CENTER SEARCH COMPONENT */}
              <div ref={searchContainerRef} className="flex-1 max-w-md relative">
                <div className={`flex items-center bg-black/60 backdrop-blur-xl border ${isSearchFocused ? 'border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]' : 'border-white/10'} rounded-full px-4.5 py-2.5 transition-all w-full`}>
                  <Search className={`w-4.5 h-4.5 ${isSearchFocused ? 'text-amber-400' : 'text-gray-400'} shrink-0 mr-2.5`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Tìm kiếm danh mục đầu tư Vingroup..."
                    className="bg-transparent text-white text-xs w-full focus:outline-none placeholder-gray-400 font-medium"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {isSearchingSpinner && (
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0 ml-1.5" />
                  )}
                </div>

                {/* Autocomplete Dropdown suggestions list */}
                <AnimatePresence>
                  {isSearchFocused && filteredSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 text-left py-2 divide-y divide-white/5"
                    >
                      <div className="px-4 py-1.5 text-[9px] font-bold text-amber-500 tracking-widest uppercase">GỢI Ý KỲ QUAN</div>
                      {filteredSuggestions.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => handleSelectLocation(loc)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-xs text-gray-200 transition-colors text-left font-medium cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{loc}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* NOTIFICATIONS BELL */}
              <div ref={notificationContainerRef} className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setUnreadCount(0); // clear count upon opening
                  }}
                  className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all relative cursor-pointer shadow-lg"
                >
                  <Bell className="w-5 h-5 text-[#dcc2a6]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 rounded-full border border-neutral-900 text-[9px] font-black flex items-center justify-center text-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Panel Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-3 w-80 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 text-left py-2"
                    >
                      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                        <span className="text-xs font-black text-[#dcc2a6] tracking-wider uppercase">THÔNG BÁO VIP</span>
                        <span className="text-[9px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">NEW</span>
                      </div>

                      <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                        {notificationsList.map((notif) => (
                          <div 
                            key={notif.id}
                            className={`p-3.5 hover:bg-white/5 transition-colors ${notif.timestamp > lastSeenTimestamp ? 'bg-amber-500/5' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                                {notif.timestamp > lastSeenTimestamp && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                {notif.title}
                              </h5>
                              <span className="text-[8px] text-gray-500 font-mono">{getRelativeTime(notif.timestamp)}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed font-sans whitespace-pre-wrap">{notif.content}</p>
                            {notif.imageUrl && <ProgressiveImage src={notif.imageUrl} alt="Notification image" className="mt-2 h-32 w-full rounded-lg" imgClassName="object-cover" />}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.header>
          )}

          {/* MAIN CONTAINER CONTENT */}
          <main className="absolute inset-0 z-0 flex flex-col justify-center items-center bg-transparent">
            
            {/* BEAUTIFUL LUXURY BACKGROUND IMAGE FOR THE HOME PAGE / APP */}
            {!isLoadingGlobe && (
              <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
                <motion.div
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ 
                    scale: activeTab === 'home' ? 1 : 1.05, 
                    opacity: activeTab === 'home' ? 0.85 : 0.3,
                    filter: activeTab === 'home' ? 'blur(0px)' : 'blur(10px)'
                  }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 w-full h-full bg-[length:100%_100%] bg-center bg-no-repeat"
                  style={{ 
                    backgroundImage: `url('https://ilhzsadfwezqljvrbpwt.supabase.co/storage/v1/object/public/vinclub/444c10bb-71fc-4efe-bd3e-c1639a6fb9d4.jpg')`,
                  }}
                />
                {/* Elegant overlay to blend the background image perfectly with bright luxury gold vibes */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#060608]/80" />
                {/* Extra golden/warm ambient light leaks to make it feel exceptionally bright, warm and fresh */}
                <div className="absolute top-[-10%] right-1/4 w-[600px] h-[600px] bg-amber-400/15 rounded-full blur-[140px] mix-blend-screen pointer-events-none" />
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-yellow-300/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
              </div>
            )}
            
                         {/* HOME PAGE SCROLLABLE CONTENT LAYER */}
            {!isLoadingGlobe && activeTab === 'home' && !selectedCard && (
              <div 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="absolute inset-0 overflow-y-auto pt-[90px] pb-32 z-25 flex flex-col items-center pointer-events-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ 
                  scrollBehavior: 'smooth', 
                  WebkitOverflowScrolling: 'touch',
                  willChange: 'transform'
                }}
              >
                {/* 0. PULL TO REFRESH GOLDEN CIRCULAR GLOW LOADER */}
                <div 
                  className="w-full overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ease-out"
                  style={{ 
                    height: pullDistance > 0 ? `${pullDistance}px` : '0px',
                    opacity: pullDistance > 15 ? 1 : 0
                  }}
                >
                  <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                    <motion.div 
                      animate={isRefreshing ? { rotate: 360 } : { rotate: pullDistance * 2.5 }}
                      transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: "spring", stiffness: 200, damping: 20 }}
                      className="w-9 h-9 rounded-full border-2 border-amber-500/10 border-t-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)] bg-neutral-900/90"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    </motion.div>
                    <span className="text-[9px] font-black tracking-widest text-amber-500 uppercase">
                      {isRefreshing ? 'ĐANG ĐỒNG BỘ...' : 'KÉO ĐỂ CẬP NHẬT'}
                    </span>
                  </div>
                </div>

                {/* 1. BALANCE CARD */}
                <motion.div
                  initial={{ opacity: 0, y: 30, rotateX: 10 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full px-4 max-w-[360px] shrink-0 mb-2 mt-4"
                  style={{ transformPerspective: 1000 }}
                >
                  <BalanceCard userName={userName} userPhoto={userPhoto || undefined} rank={rank} balance={balance} points={points} />
                </motion.div>

                {/* LIVE WITHDRAWALS BROADCAST BANNER */}
                <div className="w-full px-4 max-w-[360px] shrink-0 mt-3 mb-1">
                  <div className="w-full bg-[#121214]/65 border border-amber-500/15 rounded-xl py-2 px-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
                    <div className="flex items-center gap-1.5 text-amber-500 mr-3 shrink-0 font-bold border-r border-amber-500/10 pr-2.5">
                      <Megaphone className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                      <span className="text-[9px] tracking-widest font-black uppercase text-amber-400">VINCLUB</span>
                    </div>
                    <div className="relative flex flex-1 overflow-hidden h-4 items-center">
                      <div className="flex gap-8 whitespace-nowrap animate-marquee-infinite text-[11px] font-sans font-medium text-stone-200">
                        <span>{marqueeText}</span>
                        <span>{marqueeText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. THE GLOBE */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-[400px] shrink-0 relative mb-4"
                  style={{ marginTop: '-10px' }}
                >
                  <GalleryGlobe 
                    userPhoto={userPhoto} 
                    projects={projects}
                    lockVerticalMotion={lockVerticalMotion}
                    onSelect={(img, loc, info, proj) => setSelectedCard({ image: img, location: loc, info: info, project: proj })} 
                    selectedCard={selectedCard}
                  />

                  {/* FLOATING BUTTON: HẠNG MỤC ĐẦU TƯ (ANCHORED RIGHT EDGE) */}
                  <button 
                    onClick={() => setAppView('all-projects')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-gradient-to-b from-[#1c1c1f]/95 to-[#0d0d0f]/95 backdrop-blur-xl border border-r-0 border-[#e1b777]/35 rounded-l-2xl py-4.5 px-2 flex flex-col items-center gap-2.5 shadow-[0_4px_25px_rgba(245,158,11,0.2)] active:scale-95 transition-all group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-all shrink-0">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="flex flex-col items-center text-[9px] font-black tracking-widest text-amber-400 gap-0.5 leading-none">
                      <span>H</span>
                      <span>Ạ</span>
                      <span>N</span>
                      <span>G</span>
                      <span className="h-0.5"></span>
                      <span>M</span>
                      <span>Ụ</span>
                      <span>C</span>
                      <span className="h-1"></span>
                      <span className="text-stone-300">Đ</span>
                      <span className="text-stone-300">Ầ</span>
                      <span className="text-stone-300">U</span>
                      <span className="h-0.5"></span>
                      <span className="text-stone-300">T</span>
                      <span className="text-stone-300">Ư</span>
                    </div>
                  </button>
                </motion.div>

                {/* 3. QUICK MENU GRID */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full px-4 max-w-[360px] shrink-0 mb-6"
                >
                  <QuickMenuGrid 
                    points={points} 
                    onUpdatePoints={handleUpdatePoints} 
                    userName={userName}
                    userRank={rank}
                    onInvestClick={() => setShowDepositModal(true)}
                  />
                </motion.div>



                {/* 4. NEWS SECTION */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full shrink-0 pb-20"
                >
                  <NewsSection 
                    news={newsList} 
                    onViewAll={() => setAppView('all-news')}
                    onNewsClick={(news) => setSelectedNews(news)}
                  />
                </motion.div>
              </div>
            )}

            {/* SCREEN OVERLAYS FOR THE TABS (ONLY VISIBLE WHEN TABS ARE ACTIVE) */}
            <AnimatePresence mode="wait">
              {activeTab === 'vip' && (
                <motion.div
                  key="vip-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative z-30 w-full h-[85vh] max-h-[750px] overflow-y-auto pt-24 pb-20 px-4 cursor-pointer"
                  onClick={() => setActiveTab('home')}
                >
                  <div className="cursor-default" onClick={(e) => e.stopPropagation()}>
                    <VIPCardTab userName={userName} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 z-30 w-full h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-pointer bg-[#f8f9fb]"
                  style={{ 
                    scrollBehavior: 'smooth', 
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'transform'
                  }}
                  onClick={() => setActiveTab('home')}
                >
                  <div className="w-full h-full cursor-default" onClick={(e) => e.stopPropagation()}>
                    <ProfileTab 
                      userName={userName} 
                      userPhoto={userPhoto || ""} 
                      onReset={handleReset} 
                      points={points}
                      balance={balance}
                      rank={rank}
                      memberId={memberId}
                      onOpenHistory={() => setShowHistoryModal(true)}
                      onNavigateToSupport={(msg) => {
                        setActiveTab('support');
                        if (msg) setInitialSupportMessage(msg);
                      }}
                      onUpdatePhoto={handleUpdateUserPhoto}
                      onBack={() => setActiveTab('home')}
                      userId={userId || undefined}
                      onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'support' && (
                <motion.div
                  key="support-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 z-30 w-full h-full overflow-hidden cursor-pointer bg-[#f4f4f4]"
                  onClick={() => setActiveTab('home')}
                >
                  <div className="w-full h-full cursor-default" onClick={(e) => e.stopPropagation()}>
                    <SupportTab 
                      userName={userName} 
                      userId={userId || undefined} 
                      initialMessage={initialSupportMessage}
                      onClearInitialMessage={() => setInitialSupportMessage(null)}
                      onBack={() => setActiveTab('home')}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


            {/* DEPOSIT MODAL */}
            <DepositModal
              isOpen={showDepositModal}
              onClose={() => setShowDepositModal(false)}
              userName={userName}
              userId={userId || "anonymous"}
            />

            {/* LOCATION DETAILS MODAL POPUP */}
            <AnimatePresence>
              {selectedCard && (
                <LocationDetailsScreen 
                  key="location-details"
                  data={selectedCard} 
                  userPhoto={userPhoto}
                  userName={userName}
                  userData={userData}
                  onRequestDeposit={() => setShowDepositModal(true)}
                  onComplete={(pts) => handleUpdatePoints(points + pts)}
                  onClose={() => setSelectedCard(null)} 
                />
              )}
            </AnimatePresence>

            {/* TRANSACTION HISTORY MODAL POPUP */}
            <AnimatePresence>
              {showHistoryModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 cursor-pointer"
                  onClick={() => setShowHistoryModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="relative w-full max-w-[370px] bg-neutral-900 border border-amber-500/20 rounded-[28px] overflow-hidden shadow-2xl p-5 text-left cursor-default flex flex-col max-h-[80vh]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Gold Ambient Orbs */}
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Close Button */}
                    <button
                      onClick={() => setShowHistoryModal(false)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-950/80 hover:bg-neutral-800 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer active:scale-95 z-20"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4 z-10">
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <Clock className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider">Lịch sử giao dịch</h3>
                        <p className="text-[10px] text-gray-400">Các hoạt động tích điểm & tiêu điểm VinPoints</p>
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 border border-white/10 rounded-xl mb-4.5 z-10 select-none">
                      {[
                        { id: 'all', label: 'Tất cả' },
                        { id: 'plus', label: 'Tích điểm' },
                        { id: 'minus', label: 'Tiêu điểm' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setHistoryFilter(tab.id as any)}
                          className={`py-1.5 text-[9px] font-bold uppercase rounded-lg transition-colors cursor-pointer text-center ${
                            historyFilter === tab.id 
                              ? 'bg-amber-500 text-neutral-950' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden z-10 max-h-[380px]">
                      {realTransactions
                        .filter(tx => {
                          const t = (tx.type === 'deposit' || tx.type === 'plus') ? 'plus' : 'minus';
                          return historyFilter === 'all' || t === historyFilter;
                        })
                        .map((tx) => {
                          const isPlus = tx.type === 'deposit' || tx.type === 'plus';
                          const displayPoints = tx.amount || tx.points || 0;
                          const dateStr = tx.date 
                            ? (tx.date.includes('-') ? new Date(tx.date).toLocaleDateString('vi-VN') : tx.date)
                            : tx.createdAt?.seconds 
                              ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString('vi-VN')
                              : 'N/A';
                          const displayStatus = tx.status === 'completed' || tx.status === 'success' || tx.status === 'Thành công'
                            ? 'Thành công'
                            : tx.status === 'pending' || tx.status === 'Đang chờ' || tx.status === 'Đang xử lý' || tx.status === 'Đang chờ duyệt'
                              ? 'Chờ duyệt'
                              : 'Từ chối';
                          
                          return (
                            <div 
                              key={tx.id} 
                              onClick={() => {
                                if (tx.type === 'investment') {
                                  setSelectedReceiptTx(tx);
                                  setShowHistoryModal(false);
                                }
                              }}
                              className={`bg-neutral-950/70 border border-white/5 rounded-2xl p-3 flex justify-between items-center transition-all ${tx.type === 'investment' ? 'cursor-pointer hover:border-amber-500/35 hover:bg-neutral-900 active:scale-[0.98]' : ''}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-2 rounded-xl shrink-0 ${isPlus ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                  {isPlus ? <ArrowDownLeft className="w-4 h-4 shrink-0" /> : <ArrowUpRight className="w-4 h-4 shrink-0" />}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-[10px] font-bold text-stone-200 truncate pr-1">{tx.title || tx.description || "Giao dịch"}</h4>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[8.5px] font-mono text-gray-500">
                                    <span>{dateStr}</span>
                                    <span>•</span>
                                    <span className="truncate max-w-[80px]">{tx.id}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <span className={`text-[11px] font-black font-mono tracking-wide block ${isPlus ? 'text-emerald-400' : 'text-amber-500'}`}>
                                  {isPlus ? '+' : '-'}{displayPoints.toLocaleString()} VND
                                </span>
                                <span className={`text-[7.5px] px-1.5 py-0.5 rounded font-extrabold tracking-wide uppercase font-mono mt-0.5 inline-block ${
                                  displayStatus === 'Thành công'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : displayStatus === 'Chờ duyệt'
                                      ? 'bg-amber-500/10 text-amber-400 animate-pulse'
                                      : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  {displayStatus}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      {realTransactions.length === 0 && (
                        <div className="text-center py-12 text-neutral-500 text-xs">
                          Chưa có lịch sử giao dịch.
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </main>

          {/* BOTTOM HORIZONTAL NAVIGATION BAR */}
          {!isLoadingGlobe && !selectedCard && appView === 'main' && !selectedNews && !showDepositModal && !showHistoryModal && !selectedReceiptTx && (
            <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center items-center pointer-events-none select-none px-4">
              <div className="w-full max-w-[390px] flex items-center justify-between pointer-events-auto">
                
                {/* LEFT MAIN NAVIGATION PILL */}
                <motion.nav 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex-1 h-[68px] bg-white/95 border border-amber-500/20 rounded-[34px] shadow-[0_8px_30px_rgba(141,103,45,0.12)] flex items-center justify-around px-2 relative backdrop-blur-md mr-3"
                >
                  {/* TAB 1: TRANG CHỦ */}
                  <button
                    onClick={() => {
                      setActiveTab('home');
                      setSelectedCard(null);
                    }}
                    className="flex flex-col items-center justify-center w-16 h-full cursor-pointer focus:outline-none group relative"
                    title="Trang chủ"
                  >
                    <svg className={`w-6 h-6 transition-all duration-300 ${activeTab === 'home' ? 'text-[#b08953] scale-110' : 'text-neutral-400 group-hover:text-neutral-800'}`} viewBox="0 0 24 24" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className={`text-[10px] font-black tracking-tight mt-0.5 transition-colors duration-300 ${activeTab === 'home' ? 'text-[#b08953]' : 'text-neutral-400 group-hover:text-neutral-800'}`}>
                      Trang chủ
                    </span>
                  </button>

                  {/* TAB 2: METALLIC BRONZE QR/VIP ACTION BUTTON */}
                  <div className="relative -top-3">
                    <button
                      onClick={() => {
                        setActiveTab('vip');
                        setSelectedCard(null);
                      }}
                      className={`w-14 h-14 bg-gradient-to-b from-[#d2a657] to-[#8d672d] hover:from-[#e1b76a] hover:to-[#a27a3c] rounded-full shadow-[0_5px_15px_rgba(141,103,45,0.4)] flex items-center justify-center active:scale-95 transition-all cursor-pointer border-[2px] ${activeTab === 'vip' ? 'border-[#ffeaab]' : 'border-amber-300/35'} relative`}
                      title="Quét QR & Thẻ VIP"
                    >
                      <svg className="w-6 h-6 text-neutral-950 font-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <path d="M7 7h.01M17 7h.01M17 17h.01M7 17h.01" strokeLinecap="round" />
                      </svg>
                      {activeTab === 'vip' && (
                        <span className="absolute -bottom-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-[1.5px] border-neutral-900 animate-ping" />
                      )}
                    </button>
                  </div>

                  {/* TAB 3: CÁ NHÂN (TÀI SẢN & PROFILE) */}
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setSelectedCard(null);
                    }}
                    className="flex flex-col items-center justify-center w-16 h-full cursor-pointer focus:outline-none group"
                    title="Cá nhân"
                  >
                    <svg className={`w-6 h-6 transition-all duration-300 ${activeTab === 'profile' ? 'text-[#b08953] scale-110' : 'text-neutral-400 group-hover:text-neutral-800'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className={`text-[10px] font-black tracking-tight mt-0.5 transition-colors duration-300 ${activeTab === 'profile' ? 'text-[#b08953]' : 'text-neutral-400 group-hover:text-neutral-800'}`}>
                      Hồ sơ
                    </span>
                  </button>
                </motion.nav>

                {/* RIGHT FLOATING PREMIUM BANKING ASSISTANT BUTTON (CSKH) */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <button
                    onClick={() => setActiveTab('support')}
                    className="w-[68px] h-[68px] bg-white/95 border border-amber-500/20 rounded-full shadow-[0_8px_30px_rgba(141,103,45,0.12)] flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 active:scale-95 transition-all backdrop-blur-md group"
                    title="Chăm sóc khách hàng"
                  >
                    <div className="relative">
                      <img 
                        src="https://media.istockphoto.com/id/1448313693/vector/robot-in-circle-vector-icon.jpg?s=612x612&w=0&k=20&c=h3AOIz0RNIEVXEV5uoJIm8BFzleM8wEAvwscmeI5Aiw=" 
                        alt="AI Assistant"
                        className={`w-9 h-9 rounded-full object-cover transition-all duration-300 ${activeTab === 'support' ? 'scale-110 ring-2 ring-amber-500/50' : 'opacity-90 group-hover:opacity-100'}`}
                      />
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <span className={`text-[10px] font-black tracking-tight mt-0.5 transition-colors duration-300 ${activeTab === 'support' ? 'text-[#b08953]' : 'text-neutral-400 group-hover:text-neutral-800'}`}>
                      CSKH
                    </span>
                  </button>
                </motion.div>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {appView === 'all-news' && (
          <AllNewsPage 
            news={newsList}
            onBack={() => setAppView('main')}
            onNewsClick={(news) => setSelectedNews(news)}
          />
        )}

        {appView === 'all-projects' && (
          <AllProjectsPage 
            projects={projects}
            onBack={() => setAppView('main')}
            onSelectProject={async (proj) => {
              setAppView('main');
              setIsSearchingSpinner(true);
              try {
                const res = await fetch('/api/location-info', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ location: proj.name })
                });
                const data = await res.json();
                setSelectedCard({
                  image: proj.imageUrl || "",
                  location: proj.name,
                  info: data.info || `Thông tin chi tiết về dự án đầu tư ${proj.name} thuộc hệ sinh thái Vingroup.`,
                  project: proj
                });
              } catch (e) {
                console.error("Error loading location info", e);
                setSelectedCard({
                  image: proj.imageUrl || "",
                  location: proj.name,
                  info: `Thông tin chi tiết về dự án đầu tư ${proj.name} thuộc hệ sinh thái Vingroup.`,
                  project: proj
                });
              } finally {
                setIsSearchingSpinner(false);
              }
            }}
          />
        )}

        {selectedReceiptTx && (
          <ReceiptModal 
            tx={selectedReceiptTx}
            onClose={() => setSelectedReceiptTx(null)}
            userData={userData}
          />
        )}
        
        {selectedNews && (
          <NewsDetailPage 
            news={selectedNews}
            onBack={() => setSelectedNews(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
