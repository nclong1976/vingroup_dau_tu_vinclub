import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import ProgressiveImage from './ProgressiveImage';
import DOMPurify from 'dompurify';
import TransactionsAdmin from './TransactionsAdmin';
import ProjectStackedDeck from './ProjectStackedDeck';
import { LOCATIONS } from '../data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, setDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { 
  Send, 
  Paperclip, 
  File as FileIcon, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Trash2, 
  User, 
  Search, 
  Check, 
  CheckCheck,
  X,
  FileText,
  Plus,
  Minus,
  Edit,
  Lock,
  Unlock,
  Sparkles,
  TrendingUp,
  Settings,
  Megaphone,
  BarChart3,
  Building2,
  CreditCard,
  Users,
  Newspaper,
  MessageSquare,
  Bell,
  Star
} from 'lucide-react';

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Hardcoded bypass for admin login
    if (email === 'admin@gmail.com' && password === '456789') {
      localStorage.setItem('admin_bypass', 'true');
      onLogin();
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      setError('Email hoặc mật khẩu không hợp lệ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Quản Trị Hệ Thống</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            className="w-full border p-2 mb-4 rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border p-2 mb-6 rounded"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}


function DashboardAdmin() {
  const [projectCount, setProjectCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjectCount(snap.size);
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUserCount(snap.size);
    });
    const unsubChat = onSnapshot(collection(db, 'support_chat'), (snap) => {
      const userMessages = snap.docs.filter(doc => doc.data().sender === 'user').length;
      setTicketCount(userMessages > 0 ? userMessages : 0);
    });

    // Real-time Activity Feed: Independent listeners
    const qTxs = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(10));
    const unsubTxs = onSnapshot(qTxs, (snap) => {
      const txActivities = snap.docs.map(doc => ({
        id: doc.id,
        type: 'transaction',
        data: doc.data(),
        timestamp: doc.data().date || doc.data().createdAt
      }));
      setRecentActivity(prev => {
        const otherActs = prev.filter(a => a.type !== 'transaction');
        return [...txActivities, ...otherActs]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 15);
      });
    });

    const qUsersRecent = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(10));
    const unsubUsersRecent = onSnapshot(qUsersRecent, (snap) => {
      const userActivities = snap.docs.map(doc => ({
        id: doc.id,
        type: 'user',
        data: doc.data(),
        timestamp: doc.data().createdAt
      }));
      setRecentActivity(prev => {
        const otherActs = prev.filter(a => a.type !== 'user');
        return [...userActivities, ...otherActs]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 15);
      });
    });

    return () => {
      unsubProjects();
      unsubUsers();
      unsubChat();
      unsubTxs();
      unsubUsersRecent();
    };
  }, []);

  const data = [
    { name: 'Dự án đầu tư', count: projectCount },
    { name: 'Người dùng', count: userCount },
    { name: 'Hỗ trợ', count: ticketCount },
  ];

  const handleExportFinancialReport = async () => {
    try {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const txs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (txs.length === 0) {
        console.log("Không có dữ liệu giao dịch để xuất báo cáo.");
        return;
      }

      // Create CSV content (Excel friendly with BOM)
      const headers = ["ID", "Hoi Vien", "Loai", "So Tien", "Trang Thai", "Ngay Thang"];
      const rows = txs.map((tx: any) => [
        tx.id,
        (tx.userName || tx.userId || 'N/A').replace(/,/g, ' '),
        tx.type === 'deposit' || tx.type === 'plus' ? 'Nap' : 'Rut',
        tx.amount,
        tx.status,
        tx.date ? new Date(tx.date).toLocaleString('vi-VN').replace(/,/g, ' ') : 'N/A'
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `bao_cao_tai_chinh_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Lỗi xuất báo cáo:", err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Tổng quan hệ thống</h2>
        <button 
          onClick={handleExportFinancialReport}
          className="px-4 py-2 bg-[#e1b777] hover:bg-[#c9a365] text-neutral-950 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/10 transition-all flex items-center gap-2"
        >
          <FileIcon className="w-3.5 h-3.5" />
          Xuất báo cáo tài chính
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-gray-400 font-bold text-[11px] uppercase tracking-wider mb-2">Tổng số dự án</h3>
          <span className="text-4xl font-black text-blue-600">{projectCount}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-gray-400 font-bold text-[11px] uppercase tracking-wider mb-2">Người dùng đăng ký</h3>
          <span className="text-4xl font-black text-green-600">{userCount}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-gray-400 font-bold text-[11px] uppercase tracking-wider mb-2">Yêu cầu hỗ trợ</h3>
          <span className="text-4xl font-black text-amber-500">{ticketCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black mb-4 text-gray-800 uppercase tracking-widest border-b pb-2">Biểu đồ thống kê</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black mb-4 text-gray-800 uppercase tracking-widest border-b pb-2 flex items-center justify-between">
            <span>Hoạt động gần đây</span>
            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px]">Trực tuyến</span>
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0 items-start">
                <div className={`p-2 rounded-xl shrink-0 ${act.type === 'transaction' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                  {act.type === 'transaction' ? <TrendingUp size={16} /> : <User size={16} />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800">
                    {act.type === 'transaction' 
                      ? `${act.data.userName || 'Người dùng'} - ${act.data.type === 'deposit' || act.data.type === 'plus' ? 'Nạp' : 'Rút'} ${(act.data.amount || 0).toLocaleString()} VNĐ`
                      : `Thành viên mới: ${act.data.displayName || 'Ẩn danh'}`
                    }
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(act.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      act.type === 'transaction' 
                        ? (act.data.status === 'pending' || act.data.status === 'Đang chờ duyệt' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {act.type === 'transaction' ? act.data.status : 'Mới'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-center text-gray-400 py-10 text-xs italic">Đang chờ cập nhật hoạt động...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsAdmin() {
  const [projects, setProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('Đầu tư Chung');
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  
  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('GIÁO DỤC');
  const [formTab, setFormTab] = useState('Đầu tư Chung');
  const [formCustomId, setFormCustomId] = useState('');
  const [formInterestRate, setFormInterestRate] = useState('1.10 %');
  const [formDuration, setFormDuration] = useState('7200 phút');
  const [formMinInvestment, setFormMinInvestment] = useState('5.000.000 VNĐ');
  const [formScale, setFormScale] = useState('500.000.000 VNĐ');
  const [formProgress, setFormProgress] = useState(90);
  const [formStatus, setFormStatus] = useState('inactive'); // 'active' (Đang hoạt động/Mở), 'inactive' (Đã đóng)
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSeedData = async () => {
    if (confirm("Hệ thống sẽ đồng bộ toàn bộ 48 dự án từ quả cầu 3D sang mục quản lý. Các dự án chưa có sẽ được bổ sung tự động. Bạn có muốn tiếp tục?")) {
      setIsSaving(true);
      try {
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

        const snapshot = await getDocs(collection(db, 'projects'));
        const existingNames = new Set(snapshot.docs.map(doc => doc.data().name));
        
        let count = 0;
        for (let idx = 0; idx < LOCATIONS.length; idx++) {
          const name = LOCATIONS[idx];
          if (!existingNames.has(name)) {
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
            
            await addDoc(collection(db, 'projects'), {
              ...baseProj,
              createdAt: new Date().toISOString()
            });
            count++;
          }
        }
        alert(`Đồng bộ thành công! Đã thêm mới ${count} dự án còn thiếu vào mục quản lý.`);
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi đồng bộ dữ liệu.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormCategory('GIÁO DỤC');
    setFormTab(activeTab);
    setFormCustomId((projects.length + 1).toString());
    setFormInterestRate('1.10 %');
    setFormDuration('7200 phút');
    setFormMinInvestment('5.000.000 VNĐ');
    setFormScale('500.000.000 VNĐ');
    setFormProgress(90);
    setFormStatus('inactive');
    setFormImageUrl('');
    setFormLat('');
    setFormLng('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingProject(p);
    setFormName(p.name || '');
    setFormCategory(p.category || 'GIÁO DỤC');
    setFormTab(p.tab || 'Đầu tư Chung');
    setFormCustomId(p.customId || '');
    setFormInterestRate(p.interestRate || '1.10 %');
    setFormDuration(p.duration || '7200 phút');
    setFormMinInvestment(p.minInvestment || '5.000.000 VNĐ');
    setFormScale(p.scale || '500.000.000 VNĐ');
    setFormProgress(p.progress || 90);
    setFormStatus(p.status || 'inactive');
    setFormImageUrl(p.imageUrl || '');
    setFormLat(p.lat !== undefined ? p.lat.toString() : '');
    setFormLng(p.lng !== undefined ? p.lng.toString() : '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return alert("Vui lòng nhập tên dự án");

    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        category: formCategory,
        tab: formTab,
        customId: formCustomId.trim(),
        interestRate: formInterestRate.trim(),
        duration: formDuration.trim(),
        minInvestment: formMinInvestment.trim(),
        scale: formScale.trim(),
        progress: Number(formProgress),
        status: formStatus,
        imageUrl: formImageUrl,
        lat: formLat.trim() !== '' ? Number(formLat) : undefined,
        lng: formLng.trim() !== '' ? Number(formLng) : undefined,
        updatedAt: new Date()
      };

      if (editingProject) {
        await updateDoc(doc(db, 'projects', editingProject.id), payload);
      } else {
        await addDoc(collection(db, 'projects'), {
          ...payload,
          createdAt: new Date()
        });
      }

      setIsModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu dự án");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa dự án này? Thao tác không thể hoàn tác.')) {
      await deleteDoc(doc(db, 'projects', id));
    }
  };

  const handleToggleStatus = async (p: any) => {
    const newStatus = p.status === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, 'projects', p.id), {
      status: newStatus,
      updatedAt: new Date()
    });
  };

  const filteredProjects = projects.filter(p => (p.tab || 'Đầu tư Chung') === activeTab);

  return (
    <div className="p-8 min-h-screen bg-[#08080a] text-white">
      {/* Header section matching mockup layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-neutral-900 mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
            <span>QUẢN LÝ DỰ ÁN ĐẦU TƯ</span>
            <Sparkles className="w-5 h-5 text-[#e1b777] animate-pulse" />
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-medium">
            Quản lý danh sách các gói góp vốn đầu tư toàn hệ thống
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button 
            onClick={handleSeedData}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-[#e1b777] border border-[#e1b777]/30 hover:bg-[#e1b777]/10 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Đang đồng bộ...' : '⚡ Đồng bộ 48 Dự án Quả Cầu'}
          </button>
          <button 
            onClick={handleOpenAddModal}
            className="bg-[#e1b777] text-neutral-950 px-5 py-2.5 rounded-xl font-bold hover:bg-[#c9a365] active:scale-95 transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm Dự án mới</span>
          </button>
        </div>
      </div>

      {/* Tabs list matching mockup visual layout */}
      <div className="flex mb-8">
        <div className="flex bg-[#0f0f12] border border-neutral-800 rounded-xl p-1 gap-1">
          {['Đầu tư Chung', 'VinFast', 'Vinpearl', 'Vinhomes'].map(tabName => (
            <button
              key={tabName}
              onClick={() => setActiveTab(tabName)}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 cursor-pointer ${
                activeTab === tabName 
                  ? 'bg-[#e1b777] text-neutral-950 shadow-md' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tabName}
            </button>
          ))}
        </div>
      </div>

      {/* Grid container matching luxury visual card design */}
      {filteredProjects.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-3xl p-16 text-center text-neutral-500">
          <TrendingUp className="w-12 h-12 mx-auto stroke-[1] mb-3 text-neutral-600" />
          <h3 className="text-sm font-bold text-neutral-300 mb-1">Chưa có dự án nào trong mục này</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">Bạn có thể click "Thêm Dự án mới" để bắt đầu cấu hình hoặc khôi phục dữ liệu mẫu đặc quyền.</p>
          <button 
            onClick={handleSeedData} 
            className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-bold text-[#e1b777] rounded-xl transition-all"
          >
            Khôi phục dữ liệu mẫu
          </button>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex justify-end gap-2 px-4">
            <button 
              onClick={() => setIsDeckOpen(true)}
              className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all"
            >
              Mở tất cả
            </button>
            <button 
              onClick={() => setIsDeckOpen(false)}
              className="px-4 py-2 bg-neutral-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-900 transition-all"
            >
              Đóng tất cả
            </button>
          </div>
          <ProjectStackedDeck 
            projects={filteredProjects}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            isOpen={isDeckOpen}
          />
        </div>
      )}

      {/* LUXURY EDIT/ADD MODAL (DRAW-IN OVERLAY) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#121215] border border-neutral-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-900 flex justify-between items-center bg-[#161619]">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  {editingProject ? 'Sửa thông tin Dự án' : 'Thêm dự án Đầu Tư mới'}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1">Cập nhật thông tin chi tiết gói đầu tư đặc quyền</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scrollable Area */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Row: Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 block">Tên dự án *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ví dụ: Quỹ Phát Triển Giáo Dục Liên Cấp"
                  className="w-full bg-[#18181c] border border-neutral-800 focus:border-[#e1b777] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#e1b777] transition-all"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>

              {/* Grid: ID & Category Tag */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 block">Mã ID</label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: 1"
                    className="w-full bg-[#18181c] border border-neutral-800 focus:border-[#e1b777] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={formCustomId}
                    onChange={e => setFormCustomId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 block">Thể loại / Nhãn</label>
                  <select 
                    className="w-full bg-[#18181c] border border-neutral-800 focus:border-[#e1b777] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                  >
                    <option value="GIÁO DỤC">GIÁO DỤC</option>
                    <option value="Y TẾ">Y TẾ</option>
                    <option value="THƯƠNG MẠI">THƯƠNG MẠI</option>
                    <option value="BẤT ĐỘNG SẢN">BẤT ĐỘNG SẢN</option>
                    <option value="CÔNG NGHỆ">CÔNG NGHỆ</option>
                    <option value="NĂNG LƯỢNG">NĂNG LƯỢNG</option>
                  </select>
                </div>
              </div>

              {/* Grid: Segment Tab & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 block">Phân khúc đầu tư (Tab)</label>
                  <select 
                    className="w-full bg-[#18181c] border border-neutral-800 focus:border-[#e1b777] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={formTab}
                    onChange={e => setFormTab(e.target.value)}
                  >
                    <option value="Đầu tư Chung">Đầu tư Chung</option>
                    <option value="VinFast">VinFast</option>
                    <option value="Vinpearl">Vinpearl</option>
                    <option value="Vinhomes">Vinhomes</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 block">Trạng thái khởi tạo</label>
                  <select 
                    className="w-full bg-[#18181c] border border-neutral-800 focus:border-[#e1b777] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value)}
                  >
                    <option value="inactive">Đã đóng</option>
                    <option value="active">Đang mở (Hoạt động)</option>
                  </select>
                </div>
              </div>

              {/* Grid: Interest rate, Duration, Min investment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 block">Lãi suất (%)</label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: 1.10 %"
                    className="w-full bg-[#18181c] border border-neutral-800 focus:border-[#e1b777] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={formInterestRate}
                    onChange={e => setFormInterestRate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 block">Thời hạn</label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: 7200 phút"
                    className="w-full bg-[#18181c] border border-neutral-800 focus:border-[#e1b777] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={formDuration}
                    onChange={e => setFormDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 block">Tối thiểu</label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: 5.000.000 VNĐ"
                    className="w-full bg-[#18181c] border border-neutral-800 focus:border-[#e1b777] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={formMinInvestment}
                    onChange={e => setFormMinInvestment(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid: Capital Scale & Funding Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 block">Quy mô vốn</label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: 500.000.000 VNĐ"
                    className="w-full bg-[#18181c] border border-neutral-800 focus:border-[#e1b777] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={formScale}
                    onChange={e => setFormScale(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-neutral-400 block">Tiến độ (%)</label>
                    <span className="text-xs text-[#e1b777] font-bold font-mono">{formProgress}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    className="w-full accent-[#e1b777] bg-neutral-800 h-1 rounded-lg cursor-pointer mt-3"
                    value={formProgress}
                    onChange={e => setFormProgress(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Grid: Latitude & Longitude (Tọa độ địa lý trên Quả cầu) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 block">Vĩ độ (Latitude) - Cho quả cầu 3D</label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: 21.0285"
                    className="w-full bg-[#18181c] border border-neutral-800 focus:border-[#e1b777] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={formLat}
                    onChange={e => setFormLat(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 block">Kinh độ (Longitude) - Cho quả cầu 3D</label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: 105.8542"
                    className="w-full bg-[#18181c] border border-neutral-800 focus:border-[#e1b777] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    value={formLng}
                    onChange={e => setFormLng(e.target.value)}
                  />
                </div>
              </div>

              {/* Row: Image upload */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-neutral-400 block">Ảnh dự án</label>
                <div className="flex flex-col md:flex-row gap-4 items-center bg-[#18181c] border border-neutral-800 rounded-xl p-4">
                  {formImageUrl ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-neutral-800 shrink-0">
                      <img src={formImageUrl} alt="preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setFormImageUrl('')}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                        title="Xóa ảnh"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center text-neutral-600 text-[10px] font-bold shrink-0">
                      <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                      <span>Không có ảnh</span>
                    </div>
                  )}
                  <div className="flex-1 w-full space-y-2">
                    <input 
                      type="file"
                      accept="image/*"
                      className="block w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
                      onChange={e => handleImageUpload(e, setFormImageUrl)}
                    />
                    <p className="text-[10px] text-neutral-500">Hỗ trợ tải lên ảnh trực tiếp từ máy của bạn hoặc cung cấp URL ảnh phía dưới.</p>
                    <input 
                      type="text"
                      placeholder="Hoặc nhập URL ảnh online trực tiếp..."
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#e1b777] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                      value={formImageUrl}
                      onChange={e => setFormImageUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-neutral-900 bg-[#161619] flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#e1b777] hover:bg-[#c9a365] active:scale-95 disabled:opacity-50 text-neutral-950 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <span>{isSaving ? 'Đang lưu...' : 'Lưu dự án'}</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RegistrationAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [vipFilter, setVipFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [viewingDocUser, setViewingDocUser] = useState<any | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingBalanceUser, setEditingBalanceUser] = useState<any | null>(null);
  const [balanceInput, setBalanceInput] = useState<string>('');

  // Add user Form State
  const [addFullName, setAddFullName] = useState('');
  const [addContact, setAddContact] = useState('');
  const [addVipTier, setAddVipTier] = useState('KIM CƯƠNG / DIAMOND');
  const [addBalance, setAddBalance] = useState('88800');
  const [addUserPhoto, setAddUserPhoto] = useState('');

  // Globe config state synchronized via Firestore
  const [lockVertical, setLockVertical] = useState<boolean>(true);
  const [spinRate, setSpinRate] = useState<number>(1.5);
  const [orbitDensity, setOrbitDensity] = useState<number>(3);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'globe'), (snap) => {
      if (snap.exists()) {
        setLockVertical(snap.data().lockVerticalMotion !== false);
      }
    });
    return unsub;
  }, []);

  const handleToggleLock = async () => {
    const newVal = !lockVertical;
    setLockVertical(newVal);
    try {
      await setDoc(doc(db, 'settings', 'globe'), { lockVerticalMotion: newVal }, { merge: true });
    } catch (err) {
      console.error("Lỗi thay đổi cấu hình khóa chuyển động dọc:", err);
    }
  };

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'users', id), { isApproved: true });
  };

  const handleReject = async (id: string) => {
    await updateDoc(doc(db, 'users', id), { isApproved: false });
  };

  const handleUpdateRank = async (id: string, newRank: string) => {
    await updateDoc(doc(db, 'users', id), { rank: newRank });
    setEditingUser(null);
  };

  const handleUpdateBalance = async (id: string, newPoints: number) => {
    try {
      await updateDoc(doc(db, 'users', id), { 
        points: newPoints,
        updatedAt: new Date().toISOString()
      });
      console.log("Cập nhật số dư thành công!");
      setEditingBalanceUser(null);
      setBalanceInput('');
    } catch (err) {
      console.error("Lỗi cập nhật số dư:", err);
      alert("Không thể cập nhật số dư. Vui lòng thử lại.");
    }
  };

  const handleToggleBlock = async (u: any) => {
    const newStatus = !u.isBlocked;
    if (confirm(`Bạn có chắc chắn muốn ${newStatus ? 'KHÓA' : 'MỞ KHÓA'} tài khoản của ${u.fullName || 'người dùng này'}?`)) {
      try {
        await updateDoc(doc(db, 'users', u.id), { 
          isBlocked: newStatus,
          updatedAt: new Date().toISOString()
        });
        console.log(`${newStatus ? 'Khóa' : 'Mở khóa'} tài khoản thành công!`);
      } catch (err) {
        console.error("Lỗi khóa tài khoản:", err);
      }
    }
  };

  const handleDelete = async (u: any) => {
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của ${u.fullName || 'người dùng này'}?`)) {
      try {
        await deleteDoc(doc(db, 'users', u.id));
        if (u.contact) {
          await deleteDoc(doc(db, 'unique_contacts', u.contact));
        }
      } catch (err) {
        console.error("Lỗi xóa tài khoản:", err);
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFullName || !addContact) {
      alert("Vui lòng nhập đầy đủ thông tin Họ tên và Số điện thoại/Email!");
      return;
    }
    const randId = 'VNC-admin-' + Math.floor(100000 + Math.random() * 900000);
    const newMemberId = 'VNC-' + Math.floor(100 + Math.random() * 899) + '-' + Math.floor(100 + Math.random() * 899);
    try {
      await setDoc(doc(db, 'users', randId), {
        userId: randId,
        fullName: addFullName,
        contact: addContact,
        points: Number(addBalance) || 88800,
        rank: addVipTier,
        memberId: newMemberId,
        photoUrl: addUserPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
        isApproved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsAddingUser(false);
      setAddFullName('');
      setAddContact('');
      setAddVipTier('KIM CƯƠNG / DIAMOND');
      setAddBalance('88800');
      setAddUserPhoto('');
    } catch (err) {
      console.error("Lỗi tạo người dùng mới:", err);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAddUserPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserPhotoUploadInEdit = async (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await updateDoc(doc(db, 'users', userId), { photoUrl: reader.result as string });
          alert("Cập nhật ảnh đại diện thành công!");
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter logic
  const filteredUsers = users.filter(u => {
    const nameMatch = (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (u.contact || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (u.id || '').toLowerCase().includes(searchQuery.toLowerCase());
                      
    const vipMatch = vipFilter === 'All' || 
                      (vipFilter === 'Diamond' && (u.rank || '').includes('DIAMOND')) ||
                      (vipFilter === 'Platinum' && (u.rank || '').includes('PLATINUM')) ||
                      (vipFilter === 'Gold' && (u.rank || '').includes('GOLD'));
                      
    const statusMatch = statusFilter === 'All' ||
                        (statusFilter === 'Pending' && u.isApproved === false) ||
                        (statusFilter === 'Approved' && u.isApproved === true);
                        
    return nameMatch && vipMatch && statusMatch;
  });

  // VIP count breakdown
  const diamondCount = users.filter(u => (u.rank || '').includes('DIAMOND')).length;
  const platinumCount = users.filter(u => (u.rank || '').includes('PLATINUM')).length;
  const goldCount = users.filter(u => (u.rank || '').includes('GOLD')).length;
  const totalBalance = users.reduce((sum, u) => sum + (Number(u.points) || 0), 0);

  // VIP Tier Badge Render
  const renderVipBadge = (vipTier: string) => {
    const str = (vipTier || '').toUpperCase();
    if (str.includes('DIAMOND') || str.includes('KIM CƯƠNG')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 shadow-md shadow-cyan-900/10">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          KIM CƯƠNG
        </span>
      );
    } else if (str.includes('PLATINUM') || str.includes('BẠCH KIM')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider text-neutral-300 bg-neutral-900/60 border border-neutral-400/20 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
          BẠCH KIM
        </span>
      );
    } else if (str.includes('GOLD') || str.includes('VÀNG')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider text-[#e1b777] bg-[#e1b777]/5 border border-[#e1b777]/20 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e1b777] animate-pulse"></span>
          VÀNG / GOLD
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider text-neutral-500 bg-neutral-900 border border-neutral-800 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-600"></span>
          MEMBER
        </span>
      );
    }
  };

  return (
    <div className="p-8 bg-[#070709] min-h-screen text-neutral-200">
      <style>{`
        @keyframes custom-spin {
          0% { transform: rotateY(0deg) rotateX(15deg); }
          100% { transform: rotateY(360deg) rotateX(15deg); }
        }
        @keyframes custom-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.95); }
          50% { opacity: 0.95; transform: scale(1.05); }
        }
        @keyframes particle-orbit {
          0% { transform: rotate(0deg) translateX(70px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(70px) rotate(-360deg); }
        }
        .luxury-card {
          background: linear-gradient(135deg, rgba(20,20,25,0.85) 0%, rgba(10,10,12,0.95) 100%);
          border: 1px solid rgba(225, 183, 119, 0.12);
          backdrop-filter: blur(12px);
        }
        .luxury-glow-gold:hover {
          box-shadow: 0 0 20px rgba(225, 183, 119, 0.15);
          border-color: rgba(225, 183, 119, 0.3);
        }
        .sparkle-circle {
          box-shadow: 0 0 35px rgba(225, 183, 119, 0.25), inset 0 0 25px rgba(225, 183, 119, 0.1);
        }
      `}</style>

      {/* Header and Brand */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="h-px w-8 bg-[#e1b777]/40" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#e1b777] font-mono font-semibold">Hệ thống thành viên Private</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-serif flex items-center gap-3">
            Quản Lý Người Dùng Vinclub
            <Sparkles className="w-5 h-5 text-[#e1b777] animate-bounce" />
          </h1>
        </div>

        <button 
          onClick={() => setIsAddingUser(true)}
          className="px-5 py-3 bg-gradient-to-r from-[#e1b777] to-amber-600 text-neutral-950 rounded-xl font-bold text-sm tracking-wider uppercase shadow-xl shadow-amber-500/5 hover:opacity-95 transition-all flex items-center gap-2 border border-[#e1b777]/30"
        >
          <Plus className="w-4 h-4 text-neutral-950 stroke-[3]" />
          Thêm Thượng Khách
        </button>
      </div>

      {/* 3-Column Premium Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="luxury-card p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#e1b777]/5 rounded-full filter blur-3xl pointer-events-none" />
          <div>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">Tổng số hội viên</p>
            <p className="text-3xl font-bold text-white font-serif tracking-tight">{users.length} <span className="text-xs text-[#e1b777] font-sans font-medium">thành viên</span></p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#e1b777]">
            <User className="w-6 h-6" />
          </div>
        </div>

        <div className="luxury-card p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-3xl pointer-events-none" />
          <div>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">Tổng số dư tích lũy</p>
            <p className="text-2xl font-bold text-[#e1b777] font-serif tracking-tight">{totalBalance.toLocaleString()} <span className="text-xs text-neutral-400 font-sans font-normal">VND</span></p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#e1b777]/10 border border-[#e1b777]/20 text-[#e1b777]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="luxury-card p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none" />
          <div>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-1.5 font-mono">Cấp độ VIP (K.Cương / B.Kim / Vàng)</p>
            <div className="flex gap-3 mt-1.5 text-xs font-bold">
              <span className="text-cyan-400 font-mono bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/10">{diamondCount} Diamond</span>
              <span className="text-neutral-300 font-mono bg-neutral-900/50 px-2 py-0.5 rounded border border-neutral-700/20">{platinumCount} Plat</span>
              <span className="text-[#e1b777] font-mono bg-[#e1b777]/5 px-2 py-0.5 rounded border border-[#e1b777]/10">{goldCount} Gold</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Left Area: User Table & Filter Toolbars (75%) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Smart Search and Filter Panel */}
          <div className="luxury-card p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#e1b777]/60" />
              <input 
                type="text" 
                placeholder="Tìm tên, số điện thoại, email hoặc UID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#16161c] border border-[#e1b777]/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#e1b777] focus:ring-1 focus:ring-[#e1b777] transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
              {/* VIP Tier Filter */}
              <div className="flex items-center gap-1.5 bg-[#16161c] border border-[#e1b777]/15 rounded-xl px-3 py-1">
                <span className="text-[10px] uppercase font-mono text-[#e1b777] font-semibold">Cấp VIP:</span>
                <select 
                  value={vipFilter}
                  onChange={(e) => setVipFilter(e.target.value)}
                  className="bg-transparent border-none text-xs text-neutral-200 py-1 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="All" className="bg-[#16161c] text-white">Tất cả cấp bậc</option>
                  <option value="Diamond" className="bg-[#16161c] text-white">Kim Cương (Diamond)</option>
                  <option value="Platinum" className="bg-[#16161c] text-white">Bạch Kim (Platinum)</option>
                  <option value="Gold" className="bg-[#16161c] text-white">Vàng Pro (Gold)</option>
                </select>
              </div>

              {/* Status/Approval Filter */}
              <div className="flex items-center gap-1.5 bg-[#16161c] border border-[#e1b777]/15 rounded-xl px-3 py-1">
                <span className="text-[10px] uppercase font-mono text-[#e1b777] font-semibold">Duyệt hồ sơ:</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-none text-xs text-neutral-200 py-1 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="All" className="bg-[#16161c] text-white">Tất cả trạng thái</option>
                  <option value="Approved" className="bg-[#16161c] text-white">Đã phê duyệt</option>
                  <option value="Pending" className="bg-[#16161c] text-white">Yêu cầu chờ duyệt</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Data Table */}
          <div className="luxury-card rounded-2xl overflow-hidden shadow-xl border border-[#e1b777]/15">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e1b777]/15 bg-[#111116] text-[#e1b777] font-serif uppercase tracking-widest">
                    <th className="p-4 font-semibold text-[10px] w-20">ID</th>
                    <th className="p-4 font-semibold text-[10px]">Hội Viên / Liên Hệ</th>
                    <th className="p-4 font-semibold text-[10px]">Cấp Bậc VIP</th>
                    <th className="p-4 font-semibold text-[10px]">Số Dư Tài Khoản</th>
                    <th className="p-4 font-semibold text-[10px]">CCCD / Định Danh</th>
                    <th className="p-4 font-semibold text-[10px] text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1b777]/5">
                  {filteredUsers.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-[#181822]/40 transition-colors duration-150 group">
                      
                      {/* ID Row */}
                      <td className="p-4 font-mono text-neutral-400 font-semibold">
                        #VINC-{String(idx + 1).padStart(3, '0')}
                      </td>

                      {/* Photo and Contact */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-neutral-800 border border-[#e1b777]/20 flex-shrink-0">
                            {u.photoUrl ? (
                              <ProgressiveImage 
                                src={u.photoUrl} 
                                alt={u.fullName || "User"} 
                                className="w-full h-full object-cover" 
                                imgClassName="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-500">VC</div>
                            )}
                            <input 
                              type="file" 
                              id={`upload-table-${u.id}`} 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleUserPhotoUploadInEdit(u.id, e)}
                            />
                            <label 
                              htmlFor={`upload-table-${u.id}`}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-[#e1b777] cursor-pointer transition-opacity"
                            >
                              Sửa ảnh
                            </label>
                          </div>
                          <div>
                            <div className="font-bold text-neutral-100 text-sm group-hover:text-[#e1b777] transition-colors">{u.fullName || 'Chưa cập nhật tên'}</div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{u.contact || u.email || 'Không có sđt'}</div>
                            <div className="text-[9px] text-neutral-500 font-mono mt-0.5">UID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* VIP Tier Badge */}
                      <td className="p-4">
                        {renderVipBadge(u.rank)}
                      </td>

                      {/* Balance (VND) */}
                      <td className="p-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-100 text-sm">{(Number(u.points) || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-[#e1b777] font-semibold font-sans">VND</span>
                          <button 
                            onClick={() => {
                              setEditingBalanceUser(u);
                              setBalanceInput(String(u.points || 0));
                            }}
                            className="p-1 rounded bg-[#e1b777]/10 text-[#e1b777] hover:bg-[#e1b777]/20 border border-[#e1b777]/10 opacity-60 group-hover:opacity-100 transition-opacity"
                            title="Điều chỉnh số dư"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Verification doc or approved status */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div>
                            {u.isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-950/40 border border-green-500/20 px-2 py-0.5 rounded">
                                <Check className="w-3 h-3 text-green-400" />
                                ĐÃ PHÊ DUYỆT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                ĐANG CHỜ DUYỆT
                              </span>
                            )}
                          </div>
                          {(u.cccdNumber || u.cccdFront || u.idDocumentUrl) && (
                            <button 
                              onClick={() => setViewingDocUser(u)}
                              className="text-[10px] font-semibold text-[#e1b777] hover:underline flex items-center gap-1 mt-0.5 justify-start text-left"
                            >
                              <FileText className="w-3 h-3" />
                              Xem hồ sơ CCCD {u.cccdNumber ? `(${u.cccdNumber})` : ''}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Custom action buttons */}
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          
                          {/* Approval toggles */}
                          {!u.isApproved ? (
                            <button 
                              onClick={() => handleApprove(u.id)}
                              className="px-2.5 py-1.5 bg-green-500/15 hover:bg-green-500/25 border border-green-500/25 text-green-400 rounded-lg font-bold text-[10px] tracking-wider uppercase transition-all"
                            >
                              Duyệt ngay
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleReject(u.id)}
                              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg font-bold text-[10px] tracking-wider uppercase transition-all"
                            >
                              Hủy duyệt
                            </button>
                          )}

                          {/* Quick Edit VIP Tier button */}
                          <button 
                            onClick={() => setEditingUser(u)}
                            className="px-2 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-lg font-semibold text-[10px] transition-all"
                          >
                            Đổi VIP
                          </button>

                          {/* Delete Account */}
                          <button 
                            onClick={() => handleToggleBlock(u)}
                            className={`p-1.5 border rounded-lg transition-all ${
                              u.isBlocked 
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' 
                                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                            }`}
                            title={u.isBlocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                          >
                            {u.isBlocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          <button 
                            onClick={() => handleDelete(u)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-12 text-neutral-500 font-medium">
                        Không tìm thấy người dùng nào phù hợp với bộ lọc tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Area: Interactive Circle Orb & Lock Toggle panel (25%) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="luxury-card rounded-2xl p-6 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden h-full min-h-[500px]">
            {/* Soft Ambient Radial Backlights */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,184,110,0.06),transparent_70%)] pointer-events-none" />
            
            {/* Top Info */}
            <div className="w-full text-center">
              <span className="text-[10px] font-bold tracking-[0.25em] text-[#e1b777] uppercase font-mono block mb-1">Interactive Orb Panel</span>
              <h3 className="text-lg font-serif font-bold text-white">TỔNG QUAN HỘI VIÊN VIP</h3>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-xs mx-auto">
                Bản đồ tương tác biểu diễn cấu trúc tầng lớp thượng lưu của hệ thống Vinclub
              </p>
            </div>

            {/* Glowing Interactive Sphere Component (Custom Pure CSS 3D Sphere) */}
            <div className="my-8 relative w-48 h-48 flex items-center justify-center">
              
              {/* Outer Golden Sparkles Orbit */}
              <div 
                className="absolute inset-0 rounded-full border border-[#e1b777]/10 animate-spin" 
                style={{ animationDuration: '30s', transform: 'rotateX(75deg)' }} 
              />
              <div 
                className="absolute inset-2 rounded-full border border-[#e1b777]/5 animate-spin" 
                style={{ animationDuration: '15s', transform: 'rotateY(60deg)' }} 
              />

              {/* Sphere visual core */}
              <div 
                className="w-32 h-32 rounded-full sparkle-circle relative overflow-hidden flex items-center justify-center bg-gradient-to-tr from-[#0f0e13] via-[#1a171d] to-[#121115] border border-[#e1b777]/30"
                style={{
                  boxShadow: `0 0 40px rgba(225, 183, 119, ${0.1 + (0.05 * spinRate)}), inset 0 0 25px rgba(225, 183, 119, 0.15)`
                }}
              >
                {/* Internal Wireframe grid with rotation speed controlled by slider */}
                <div 
                  className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none"
                  style={{
                    perspective: '400px',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div 
                    className="w-full h-full rounded-full border border-dashed border-[#e1b777]/20 flex items-center justify-center"
                    style={{
                      transformStyle: 'preserve-3d',
                      animation: `custom-spin ${15 / spinRate}s linear infinite`
                    }}
                  >
                    {/* Ring latitude */}
                    <div className="absolute w-full h-[1px] border-t border-[#e1b777]/30" style={{ transform: 'rotateX(90deg)' }} />
                    <div className="absolute w-full h-full rounded-full border border-[#e1b777]/15" style={{ transform: 'rotateY(90deg)' }} />
                    <div className="absolute w-full h-full rounded-full border border-[#e1b777]/10" style={{ transform: 'rotateY(45deg)' }} />
                    <div className="absolute w-full h-full rounded-full border border-[#e1b777]/10" style={{ transform: 'rotateY(-45deg)' }} />

                    {/* Orbiting particles */}
                    {Array.from({ length: Math.min(10, orbitDensity * 3) }).map((_, i) => (
                      <div 
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-amber-400 sparkle shadow shadow-amber-400"
                        style={{
                          top: '50%',
                          left: '50%',
                          marginTop: '-4px',
                          marginLeft: '-4px',
                          transform: `rotateY(${i * (360 / (orbitDensity * 3))}deg) translateZ(64px) rotateY(${-i * (360 / (orbitDensity * 3))}deg)`,
                          animation: 'custom-pulse 2s ease-in-out infinite',
                          animationDelay: `${i * 0.25}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Sparkling overlay effect */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(225,184,110,0.15),transparent_60%)]" />

                {/* Inner central text showing VIP index */}
                <div className="z-10 text-center">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#e1b777] block font-semibold">Tỉ Lệ VIP</span>
                  <span className="text-xl font-bold text-white font-serif tracking-tight">
                    {users.length > 0 ? Math.round(((diamondCount + platinumCount) / users.length) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Glowing decorative rings */}
              <div className="absolute w-40 h-40 rounded-full border-t border-b border-[#e1b777]/20 filter blur-[1px] animate-spin" style={{ animationDuration: '20s' }} />
              <div className="absolute w-44 h-44 rounded-full border-l border-r border-[#e1b777]/10 filter blur-[2px] animate-spin" style={{ animationDuration: '40s', animationDirection: 'reverse' }} />
            </div>

            {/* Controls panel area */}
            <div className="w-full space-y-5 bg-[#121217]/60 p-4 border border-[#e1b777]/10 rounded-xl">
              
              {/* Sliders for decorative control */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-neutral-400 font-semibold uppercase tracking-wider font-mono">Tốc độ xoay:</span>
                  <span className="text-[#e1b777] font-bold font-mono">{spinRate}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.2" 
                  max="4" 
                  step="0.1" 
                  value={spinRate}
                  onChange={(e) => setSpinRate(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#e1b777]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-neutral-400 font-semibold uppercase tracking-wider font-mono">Độ dày quỹ đạo:</span>
                  <span className="text-[#e1b777] font-bold font-mono">{orbitDensity}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="6" 
                  step="1" 
                  value={orbitDensity}
                  onChange={(e) => setOrbitDensity(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#e1b777]"
                />
              </div>

              {/* DIRECT FIREBASE SYSTEM CONTROL: "KHÓA DI CHUYỂN LÊN XUỐNG" (LOCK VERTICAL MOTION) TOGGLE */}
              <div className="pt-2 border-t border-[#e1b777]/10">
                <div className="flex justify-between items-center bg-[#181822] p-3 rounded-xl border border-[#e1b777]/15">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-extrabold text-[#e1b777] tracking-wider uppercase font-mono">Khóa chuyển dọc</span>
                    <span className="text-[9px] text-neutral-400 mt-0.5">LOCK VERTICAL MOTION</span>
                  </div>
                  
                  {/* Luxury styled toggle switch */}
                  <button 
                    onClick={handleToggleLock}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${
                      lockVertical 
                        ? 'bg-amber-500/30 border border-amber-400/40 shadow-inner shadow-amber-400/20' 
                        : 'bg-neutral-800 border border-neutral-700'
                    }`}
                  >
                    <span className="sr-only">Toggle lock vertical motion</span>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full transition-all duration-300 ${
                        lockVertical 
                          ? 'translate-x-6 bg-[#e1b777] shadow shadow-amber-400' 
                          : 'translate-x-1 bg-neutral-500'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[9px] text-neutral-400 mt-2 text-center">
                  * Tự động lưu và đồng bộ thời gian thực cho quả cầu 3D của người dùng.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD NEW USER */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="luxury-card max-w-md w-full rounded-2xl p-6 border border-[#e1b777]/20 shadow-2xl relative">
            <button 
              onClick={() => setIsAddingUser(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-bold text-white mb-6 border-b border-[#e1b777]/10 pb-3">Thêm Thượng Khách Vinclub</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider font-mono">Họ và tên:</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="w-full bg-[#16161c] border border-[#e1b777]/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#e1b777]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider font-mono">Số điện thoại / Email:</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: 0912345678 hoặc email@example.com"
                  value={addContact}
                  onChange={(e) => setAddContact(e.target.value)}
                  className="w-full bg-[#16161c] border border-[#e1b777]/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#e1b777]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider font-mono">Hạng hội viên VIP:</label>
                  <select 
                    value={addVipTier}
                    onChange={(e) => setAddVipTier(e.target.value)}
                    className="w-full bg-[#16161c] border border-[#e1b777]/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#e1b777]"
                  >
                    <option value="KIM CƯƠNG / DIAMOND" className="bg-[#16161c]">KIM CƯƠNG / DIAMOND</option>
                    <option value="BẠCH KIM / PLATINUM" className="bg-[#16161c]">BẠCH KIM / PLATINUM</option>
                    <option value="VÀNG / GOLD" className="bg-[#16161c]">VÀNG / GOLD</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider font-mono">Số dư khởi tạo (VNĐ):</label>
                  <input 
                    type="number" 
                    placeholder="Ví dụ: 88800"
                    value={addBalance}
                    onChange={(e) => setAddBalance(e.target.value)}
                    className="w-full bg-[#16161c] border border-[#e1b777]/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#e1b777] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider font-mono block">Ảnh đại diện (Avatar):</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    id="add-avatar-file"
                    className="hidden" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <label 
                    htmlFor="add-avatar-file"
                    className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs hover:bg-neutral-700 cursor-pointer text-white"
                  >
                    Chọn file ảnh
                  </label>
                  {addUserPhoto ? (
                    <img src={addUserPhoto} className="w-10 h-10 rounded-full object-cover border border-[#e1b777]/20" alt="Preview" />
                  ) : (
                    <span className="text-[10px] text-neutral-500">Chưa chọn ảnh (Sử dụng ảnh mặc định)</span>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddingUser(false)}
                  className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#e1b777] to-amber-600 text-neutral-950 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Tạo Thượng Khách
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHANGE VIP TIER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="luxury-card max-w-sm w-full rounded-2xl p-6 border border-[#e1b777]/20 shadow-2xl relative">
            <button 
              onClick={() => setEditingUser(null)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif font-bold text-white mb-1">Nâng Cấp Hạng Thượng Khách</h3>
            <p className="text-xs text-neutral-400 mb-5 font-mono">UID: {editingUser.id}</p>
            
            <div className="flex items-center gap-3 mb-6 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
              <img src={editingUser.photoUrl} className="w-10 h-10 rounded-full object-cover border border-neutral-700" alt="" />
              <div>
                <p className="font-bold text-white">{editingUser.fullName}</p>
                <p className="text-[10px] text-[#e1b777] font-semibold">{editingUser.rank}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider font-mono">Chọn hạng thành viên mới:</p>
              <button 
                onClick={() => handleUpdateRank(editingUser.id, "KIM CƯƠNG / DIAMOND")}
                className="w-full text-left px-4 py-3 bg-[#16161c] hover:bg-[#1f1f2a] rounded-xl text-xs text-cyan-400 font-bold border border-cyan-500/10 flex items-center justify-between"
              >
                <span>KIM CƯƠNG / DIAMOND</span>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow shadow-cyan-400 animate-pulse" />
              </button>
              <button 
                onClick={() => handleUpdateRank(editingUser.id, "BẠCH KIM / PLATINUM")}
                className="w-full text-left px-4 py-3 bg-[#16161c] hover:bg-[#1f1f2a] rounded-xl text-xs text-neutral-200 font-bold border border-neutral-500/10 flex items-center justify-between"
              >
                <span>BẠCH KIM / PLATINUM</span>
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
              </button>
              <button 
                onClick={() => handleUpdateRank(editingUser.id, "VÀNG / GOLD")}
                className="w-full text-left px-4 py-3 bg-[#16161c] hover:bg-[#1f1f2a] rounded-xl text-xs text-[#e1b777] font-bold border border-[#e1b777]/10 flex items-center justify-between"
              >
                <span>VÀNG / GOLD</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#e1b777] animate-pulse" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADJUST USER BALANCE */}
      {editingBalanceUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="luxury-card max-w-sm w-full rounded-2xl p-6 border border-[#e1b777]/20 shadow-2xl relative">
            <button 
              onClick={() => setEditingBalanceUser(null)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif font-bold text-white mb-1">Chỉnh Sửa Số Dư Tích Lũy</h3>
            <p className="text-xs text-neutral-400 mb-5 font-mono">Hội viên: {editingBalanceUser.fullName}</p>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider font-mono">Nhập số tiền (VND):</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Nhập số tiền..."
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    className="flex-1 bg-[#16161c] border border-[#e1b777]/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e1b777] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleUpdateBalance(editingBalanceUser.id, (Number(editingBalanceUser.points) || 0) + Number(balanceInput))}
                  className="px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cộng
                </button>
                <button 
                  onClick={() => handleUpdateBalance(editingBalanceUser.id, (Number(editingBalanceUser.points) || 0) - Number(balanceInput))}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                  Trừ
                </button>
              </div>

              <div className="pt-2 border-t border-[#e1b777]/10">
                 <button 
                  onClick={() => handleUpdateBalance(editingBalanceUser.id, Number(balanceInput))}
                  className="w-full px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                >
                  Ghi đè trực tiếp: {Number(balanceInput).toLocaleString()} VND
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW ID / CCCD DETAILS & APPROVAL OPTIONS */}
      {viewingDocUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="luxury-card max-w-2xl w-full rounded-2xl p-6 border border-[#e1b777]/20 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setViewingDocUser(null)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-bold text-white mb-1">Xác Minh Căn Cước Công Dân (CCCD)</h3>
            <p className="text-xs text-[#e1b777] mb-6 font-mono">Thượng khách: {viewingDocUser.fullName} | SĐT: {viewingDocUser.contact || 'N/A'}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              
              {/* Front document */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider font-mono">Căn cước công dân (Mặt trước):</p>
                <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-2 flex items-center justify-center h-48 overflow-hidden">
                  {viewingDocUser.cccdFront || viewingDocUser.idDocumentUrl ? (
                    <ProgressiveImage 
                      src={viewingDocUser.cccdFront || viewingDocUser.idDocumentUrl} 
                      alt="CCCD Front" 
                      className="w-full h-full object-contain" 
                      imgClassName="object-contain"
                    />
                  ) : (
                    <span className="text-neutral-500 font-medium">Chưa cung cấp hình ảnh</span>
                  )}
                </div>
              </div>

              {/* Back document */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider font-mono">Căn cước công dân (Mặt sau):</p>
                <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-2 flex items-center justify-center h-48 overflow-hidden">
                  {viewingDocUser.cccdBack ? (
                    <ProgressiveImage 
                      src={viewingDocUser.cccdBack} 
                      alt="CCCD Back" 
                      className="w-full h-full object-contain" 
                      imgClassName="object-contain"
                    />
                  ) : (
                    <span className="text-neutral-500 font-medium">Chưa cung cấp hình ảnh</span>
                  )}
                </div>
              </div>

            </div>

            {/* Profile Info Summary */}
            <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 mb-6 text-xs space-y-2.5">
              <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                <span className="text-neutral-400">Họ và tên ghi nhận:</span>
                <span className="font-bold text-white">{viewingDocUser.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                <span className="text-neutral-400">Số thẻ căn cước (CCCD):</span>
                <span className="font-mono font-bold text-[#e1b777]">{viewingDocUser.cccdNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Trạng thái xác thực tài khoản:</span>
                <span className="font-bold">
                  {viewingDocUser.isApproved ? (
                    <span className="text-green-400">ĐÃ ĐƯỢC DUYỆT</span>
                  ) : (
                    <span className="text-amber-400">ĐANG CHỜ PHÊ DUYỆT</span>
                  )}
                </span>
              </div>
            </div>

            {/* Action options inside view doc */}
            <div className="flex gap-4">
              <button 
                onClick={() => setViewingDocUser(null)}
                className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl font-bold text-xs uppercase"
              >
                Đóng
              </button>
              
              {!viewingDocUser.isApproved ? (
                <button 
                  onClick={() => {
                    handleApprove(viewingDocUser.id);
                    setViewingDocUser(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  Phê Duyệt Hồ Sơ
                </button>
              ) : (
                <button 
                  onClick={() => {
                    handleReject(viewingDocUser.id);
                    setViewingDocUser(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600/25 hover:bg-red-600/35 border border-red-500/30 text-red-200 rounded-xl font-bold text-xs uppercase"
                >
                  Hủy Phê Duyệt
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function NewsAdmin() {
  const [news, setNews] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [newsDate, setNewsDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'news'), (snap) => {
      setNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async () => {
    if (!title || !contentHtml) return;
    
    // Convert YYYY-MM-DD back to vi-VN format string just for consistency with old design
    // Or we can just store the date string
    const [year, month, day] = newsDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    await addDoc(collection(db, 'news'), { 
      title, 
      content: contentHtml, 
      img: imageUrl,
      tag: "TIN TỨC",
      date: formattedDate 
    });
    setTitle('');
    setContentHtml('');
    setImageUrl('');
    const today = new Date();
    setNewsDate(today.toISOString().split('T')[0]);
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'news', id), { isFeatured: !currentStatus });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'news', id));
  };

  const handleEmergencyBroadcast = async () => {
    const msg = prompt("Nhập nội dung thông báo khẩn cấp (sẽ hiển thị ngay lập tức cho tất cả người dùng):");
    if (!msg) return;

    try {
      await updateDoc(doc(db, 'settings', 'system'), {
        broadcast: msg,
        updatedAt: new Date().toISOString()
      });
      console.log("Đã phát sóng thông báo khẩn cấp!");
    } catch (err) {
      console.error("Lỗi phát sóng khẩn cấp:", err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý tin tức</h2>
        <button 
          onClick={handleEmergencyBroadcast}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all active:scale-95"
        >
          <Bell className="w-4 h-4" />
          Phát sóng Khẩn cấp
        </button>
      </div>
      <div className="bg-white p-4 rounded shadow mb-6 space-y-4">
        <input 
          className="w-full border p-2 rounded text-gray-800" 
          placeholder="Tiêu đề tin tức" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
        <div className="flex gap-4 items-center">
          <label className="font-semibold text-gray-700 whitespace-nowrap">Ngày đăng:</label>
          <input 
            type="date" 
            className="border p-2 rounded text-gray-800"
            value={newsDate}
            onChange={(e) => setNewsDate(e.target.value)}
          />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Editor Toolbar */}
          <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1.5">
            <button 
              type="button"
              onClick={() => {
                const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement;
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const selected = text.substring(start, end);
                const replacement = `<b>${selected || 'chữ in đậm'}</b>`;
                const newValue = text.substring(0, start) + replacement + text.substring(end);
                setContentHtml(newValue);
                textarea.focus();
              }}
              className="px-2.5 py-1 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors cursor-pointer"
              title="In đậm"
            >
              B
            </button>
            <button 
              type="button"
              onClick={() => {
                const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement;
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const selected = text.substring(start, end);
                const replacement = `<i>${selected || 'chữ in nghiêng'}</i>`;
                const newValue = text.substring(0, start) + replacement + text.substring(end);
                setContentHtml(newValue);
                textarea.focus();
              }}
              className="px-2.5 py-1 text-xs italic font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors cursor-pointer"
              title="In nghiêng"
            >
              I
            </button>
            <button 
              type="button"
              onClick={() => {
                const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement;
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const selected = text.substring(start, end);
                const replacement = `<u>${selected || 'gạch chân'}</u>`;
                const newValue = text.substring(0, start) + replacement + text.substring(end);
                setContentHtml(newValue);
                textarea.focus();
              }}
              className="px-2.5 py-1 text-xs underline font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors cursor-pointer"
              title="Gạch chân"
            >
              U
            </button>
            <button 
              type="button"
              onClick={() => {
                const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement;
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const replacement = `<br/>`;
                const newValue = text.substring(0, start) + replacement + text.substring(end);
                setContentHtml(newValue);
                textarea.focus();
              }}
              className="px-2 py-1 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors cursor-pointer"
              title="Xuống dòng"
            >
              Xuống dòng (&lt;br/&gt;)
            </button>
            <button 
              type="button"
              onClick={() => {
                const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement;
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const selected = text.substring(start, end);
                const replacement = `<h3>${selected || 'Tiêu đề lớn'}</h3>`;
                const newValue = text.substring(0, start) + replacement + text.substring(end);
                setContentHtml(newValue);
                textarea.focus();
              }}
              className="px-2 py-1 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors cursor-pointer"
              title="Tiêu đề h3"
            >
              H3
            </button>
            <button 
              type="button"
              onClick={() => {
                const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement;
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const selected = text.substring(start, end);
                const replacement = `<ul>\n  <li>${selected || 'Danh sách 1'}</li>\n  <li>Danh sách 2</li>\n</ul>`;
                const newValue = text.substring(0, start) + replacement + text.substring(end);
                setContentHtml(newValue);
                textarea.focus();
              }}
              className="px-2 py-1 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors cursor-pointer"
              title="Danh sách hoa thị"
            >
              • Danh sách
            </button>
            <button 
              type="button"
              onClick={() => {
                const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement;
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const selected = text.substring(start, end);
                const replacement = `<a href="LINK" target="_blank" class="text-blue-600 underline">${selected || 'Liên kết'}</a>`;
                const newValue = text.substring(0, start) + replacement + text.substring(end);
                setContentHtml(newValue);
                textarea.focus();
              }}
              className="px-2 py-1 text-xs font-bold text-blue-600 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors cursor-pointer"
              title="Chèn liên kết"
            >
              Chèn Link
            </button>
          </div>
          
          {/* Main Textarea */}
          <textarea
            id="news-content-textarea"
            className="w-full h-40 p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 border-0 resize-y"
            placeholder="Nội dung tin tức (Hỗ trợ định dạng HTML hoặc sử dụng thanh công cụ phía trên để định dạng nhanh...)"
            value={contentHtml}
            onChange={(e) => setContentHtml(e.target.value)}
          />

          {/* Realtime Live Preview Area */}
          <div className="bg-neutral-50 p-3 border-t border-gray-100">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Xem trước nội dung:</div>
            <div 
              className="text-xs text-gray-700 prose prose-sm max-w-none min-h-[40px] bg-white border border-gray-100 rounded p-2"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentHtml || '<i>Chưa có nội dung xem trước...</i>') }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {imageUrl && <ProgressiveImage src={imageUrl} alt="Preview" className="w-16 h-16 rounded-lg border" />}
          <input 
            type="file"
            accept="image/*"
            className="border p-2 rounded-lg flex-1" 
            onChange={handleImageUpload} 
          />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold" onClick={handleAdd}>Đăng Tin</button>
      </div>
      <div className="space-y-4">
        {news.map(n => (
          <div key={n.id} className="bg-white p-4 rounded shadow flex justify-between items-start">
            <div className="flex gap-4">
              {n.img && <ProgressiveImage src={n.img} alt="News" className="w-20 h-20 rounded-lg" />}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">{n.title}</h3>
                  {n.isFeatured && <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-black border border-amber-200 uppercase">Nổi bật</span>}
                </div>
                <div className="text-gray-600 mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(n.content) }} />
                <p className="text-xs text-gray-400 mt-2 font-bold">{n.date}</p>
              </div>
            </div>
            <div className="flex gap-2 ml-4 shrink-0">
               <button 
                className={`p-1.5 border rounded-lg transition-all ${
                  n.isFeatured 
                    ? 'bg-amber-100 border-amber-300 text-amber-600' 
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                }`} 
                onClick={() => handleToggleFeatured(n.id, !!n.isFeatured)}
                title="Ghim tin nổi bật"
              >
                <Star className={`w-4 h-4 ${n.isFeatured ? 'fill-current' : ''}`} />
              </button>
              <button className="text-red-500 hover:text-red-700 font-bold p-1.5" onClick={() => handleDelete(n.id)}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatAdmin() {
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ base64: string; name: string; type: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notificationAudio = useRef<HTMLAudioElement | null>(null);
  const withdrawAudio = useRef<HTMLAudioElement | null>(null);
  const lastMsgCountRef = useRef<number>(0);
  const lastTxCountRef = useRef<number>(0);

  useEffect(() => {
    // Initialize notification sounds for admin
    notificationAudio.current = new Audio('https://ilhzsadfwezqljvrbpwt.supabase.co/storage/v1/object/public/vinclub/audio_2026-07-04_02-26-46.ogg');
    notificationAudio.current.volume = 0.6;
    
    withdrawAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1651/1651-preview.mp3');
    withdrawAudio.current.volume = 0.5;
  }, []);
  
  useEffect(() => {
    // Realtime connection to global support chat
    const unsub = onSnapshot(collection(db, 'support_chat'), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = docs.sort((a: any, b: any) => a.timestamp - b.timestamp);

      // Play notification sound if new user message arrives (skip initial load)
      if (lastMsgCountRef.current > 0 && snap.size > lastMsgCountRef.current) {
        const lastMsg = sorted[sorted.length - 1] as any;
        if (lastMsg.sender !== 'admin') {
          notificationAudio.current?.play().catch(e => {
            console.log("Audio notification played (or blocked by browser policy)");
          });
        }
      }

      setMessages(sorted);
      lastMsgCountRef.current = snap.size;
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Monitor transactions for withdrawal notifications
    const unsub = onSnapshot(collection(db, 'transactions'), (snap) => {
      // Skip initial load
      if (lastTxCountRef.current > 0 && snap.size > lastTxCountRef.current) {
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Assuming transactions have a date or createdAt field to find the newest one
        const sorted = docs.sort((a: any, b: any) => {
          const dateA = a.createdAt?.seconds || new Date(a.date || 0).getTime();
          const dateB = b.createdAt?.seconds || new Date(b.date || 0).getTime();
          return dateB - dateA;
        });
        
        const newestTx = sorted[0] as any;
        if (newestTx && (newestTx.type === 'withdraw' || newestTx.type === 'minus')) {
          withdrawAudio.current?.play().catch(e => {
            console.log("Withdrawal notification played (or blocked)");
          });
        }
      }
      lastTxCountRef.current = snap.size;
    });
    return unsub;
  }, []);

  // Compute the list of users who have active chats, grouped by their email
  const usersList = React.useMemo(() => {
    const map = new Map<string, { email: string; lastMessage: string; timestamp: number; unreadCount: number }>();
    messages.forEach(m => {
      const email = m.userEmail || m.senderEmail || 'Anonymous';
      const existing = map.get(email);
      
      let msgPreview = m.text || '';
      if (m.fileUrl) {
        if (m.fileType?.startsWith('image/')) msgPreview = '📷 [Hình ảnh]';
        else if (m.fileType?.startsWith('video/')) msgPreview = '🎥 [Video]';
        else msgPreview = `📁 [Tài liệu: ${m.fileName || 'file'}]`;
      }

      if (!existing || m.timestamp > existing.timestamp) {
        map.set(email, {
          email,
          lastMessage: msgPreview,
          timestamp: m.timestamp || Date.now(),
          unreadCount: (existing?.unreadCount || 0) + (m.sender !== 'admin' && email !== selectedUser ? 1 : 0)
        });
      } else {
        if (m.sender !== 'admin' && email !== selectedUser) {
          existing.unreadCount += 1;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [messages, selectedUser]);

  // Auto-select the first user if none is selected
  useEffect(() => {
    if (!selectedUser && usersList.length > 0) {
      setSelectedUser(usersList[0].email);
    }
  }, [usersList, selectedUser]);

  // Scroll to bottom when selected user's messages change
  const filteredMessages = React.useMemo(() => {
    return messages.filter(m => (m.userEmail || m.senderEmail || 'Anonymous') === selectedUser);
  }, [messages, selectedUser]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [filteredMessages]);

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    setIsSending(true);
    reader.onloadend = () => {
      setSelectedFile({
        base64: reader.result as string,
        name: file.name,
        type: file.type
      });
      setIsSending(false);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!selectedUser) return;
    if (!replyText.trim() && !selectedFile) return;

    setIsSending(true);
    try {
      const timestamp = Date.now();
      const payload: any = {
        sender: 'admin',
        senderEmail: 'admin@gmail.com',
        userEmail: selectedUser,
        timestamp
      };

      if (selectedFile) {
        payload.fileUrl = selectedFile.base64;
        payload.fileType = selectedFile.type;
        payload.fileName = selectedFile.name;
        payload.text = replyText.trim() || '';
      } else {
        payload.text = replyText.trim();
      }

      await addDoc(collection(db, 'support_chat'), payload);
      setReplyText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error("Lỗi gửi tin nhắn admin:", err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredUsersList = usersList.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f3f4f6]">
      {/* LEFT SIDEBAR: List of active sessions */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>Hội thoại VIP</span>
            <span className="text-xs bg-[#b08953] text-white px-2 py-0.5 rounded-full font-mono font-medium">
              {usersList.length}
            </span>
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Tìm theo email/số điện thoại..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b08953]"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredUsersList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Không tìm thấy cuộc hội thoại nào.
            </div>
          ) : (
            filteredUsersList.map(u => (
              <button
                key={u.email}
                onClick={() => setSelectedUser(u.email)}
                className={`w-full text-left p-4 transition-all flex items-start gap-3 hover:bg-gray-50 cursor-pointer ${
                  selectedUser === u.email ? 'bg-amber-50/40 border-l-4 border-[#b08953]' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200">
                  <User className="w-5 h-5 text-neutral-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-semibold text-xs text-gray-800 truncate" title={u.email}>
                      {u.email}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(u.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.lastMessage}</p>
                </div>
                {u.unreadCount > 0 && selectedUser !== u.email && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 self-center"></span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT CHAT AREA */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col bg-gray-50 h-full relative">
          {/* Active Chat Header */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center border border-[#b08953]/20">
                <User className="w-4.5 h-4.5 text-[#b08953]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">{selectedUser}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Đang xem hội thoại</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              Tổng số tin nhắn: <strong className="text-[#b08953]">{filteredMessages.length}</strong>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-12 h-12 mb-2 stroke-[1.2]" />
                <p className="text-sm">Chưa có tin nhắn trong cuộc trò chuyện này.</p>
              </div>
            ) : (
              filteredMessages.map(m => {
                const isAdmin = m.sender === 'admin';
                return (
                  <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} w-full`}>
                    <span className="text-[9px] text-gray-400 font-mono font-bold mb-1 px-1 uppercase">
                      {isAdmin ? 'Quản Trị Viên' : 'Hội Viên VIP'} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Image Attachment bubble */}
                    {m.fileUrl && m.fileType?.startsWith('image/') ? (
                      <div className="max-w-[50%] p-2 bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden mb-1">
                        <img 
                          src={m.fileUrl} 
                          alt={m.fileName || "Uploaded"} 
                          className="max-w-full max-h-72 object-contain rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                        {m.text && <p className="text-sm text-gray-800 mt-2 px-1 whitespace-pre-wrap">{m.text}</p>}
                      </div>
                    ) : m.fileUrl && m.fileType?.startsWith('video/') ? (
                      /* Video Attachment bubble */
                      <div className="max-w-[50%] p-2 bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden mb-1">
                        <video 
                          src={m.fileUrl} 
                          controls 
                          className="max-w-full max-h-72 rounded-lg"
                        />
                        {m.text && <p className="text-sm text-gray-800 mt-2 px-1 whitespace-pre-wrap">{m.text}</p>}
                      </div>
                    ) : m.fileUrl ? (
                      /* Raw file / document bubble */
                      <div className={`max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm mb-1 ${
                        isAdmin ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200/80 text-gray-800'
                      }`}>
                        <div className="flex items-center gap-3 bg-black/5 p-2.5 rounded-lg border border-black/10">
                          <FileIcon className="w-8 h-8 opacity-85 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate">{m.fileName || 'file_attachment'}</p>
                            <p className="text-[10px] opacity-70 font-mono uppercase">{m.fileType || 'application/octet-stream'}</p>
                          </div>
                          <a 
                            href={m.fileUrl} 
                            download={m.fileName} 
                            className="bg-white/20 hover:bg-white/30 text-xs font-bold px-3 py-1.5 rounded transition-all underline text-inherit shrink-0"
                          >
                            Tải về
                          </a>
                        </div>
                        {m.text && <p className="mt-2 whitespace-pre-wrap">{m.text}</p>}
                      </div>
                    ) : (
                      /* Text-only bubble */
                      <div className={`max-w-[65%] rounded-2xl px-4.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                        isAdmin 
                          ? 'bg-blue-600 text-white rounded-tr-none font-semibold' 
                          : 'bg-white border border-gray-200/80 text-gray-800 rounded-tl-none font-medium'
                      }`}>
                        {m.text}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive File Preview area before sending */}
          {selectedFile && (
            <div className="px-6 py-3 bg-amber-50/50 border-t border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedFile.type.startsWith('image/') ? (
                  <div className="w-12 h-12 rounded border border-amber-200 bg-white overflow-hidden shrink-0">
                    <img src={selectedFile.base64} alt="upload preview" className="w-full h-full object-cover" />
                  </div>
                ) : selectedFile.type.startsWith('video/') ? (
                  <div className="w-12 h-12 rounded border border-amber-200 bg-white flex items-center justify-center shrink-0">
                    <VideoIcon className="w-6 h-6 text-amber-700" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded border border-amber-200 bg-white flex items-center justify-center shrink-0">
                    <FileIcon className="w-6 h-6 text-amber-700" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-mono">{selectedFile.type}</p>
                </div>
              </div>
              <button 
                onClick={removeSelectedFile}
                className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center cursor-pointer transition-colors"
                title="Hủy tệp đính kèm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-3 shrink-0">
            {/* Native input triggers */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
            />
            <button 
              onClick={handleFileSelectClick}
              disabled={isSending}
              className="w-11 h-11 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-500 flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95"
              title="Đính kèm hình ảnh/tệp/video"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex-1 relative">
              <input 
                type="text"
                placeholder={selectedFile ? "Thêm ghi chú/tin nhắn đi kèm tệp..." : "Nhập phản hồi chăm sóc khách hàng..."}
                className="w-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#b08953] focus:border-[#b08953] rounded-full px-5 py-3 text-sm text-gray-800 placeholder-gray-400"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isSending && handleSend()}
                disabled={isSending}
              />
            </div>

            <button 
              onClick={handleSend}
              disabled={isSending || (!replyText.trim() && !selectedFile)}
              className="px-6 py-3 bg-[#b08953] hover:bg-[#96784d] disabled:opacity-45 text-white rounded-full flex items-center gap-2 font-bold transition-all shrink-0 cursor-pointer active:scale-95 text-sm"
            >
              <span>{isSending ? 'Đang gửi...' : 'Gửi'}</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <User className="w-16 h-16 mb-2 stroke-[1.1] text-gray-300" />
          <h3 className="text-lg font-bold">Chưa chọn hội thoại</h3>
          <p className="text-sm max-w-sm text-center mt-1">Vui lòng chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu tư vấn hỗ trợ VIP.</p>
        </div>
      )}
    </div>
  );
}


function NotificationsAdmin() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [status, setStatus] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        content,
        imageUrl: imageBase64 || null,
        timestamp: Date.now(),
        isNew: true,
        time: "Vừa xong"
      });
      setStatus('Thông báo đã được gửi thành công!');
      setTitle('');
      setContent('');
      setImageBase64('');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('Lỗi khi gửi thông báo.');
    }
  };

  return (
    <div className="p-6 bg-[#070709] min-h-screen">
      <div className="flex items-center gap-2.5 mb-6">
        <span className="h-px w-8 bg-[#e1b777]/40" />
        <h2 className="text-2xl font-bold tracking-tight text-white font-serif uppercase">Gửi Thông Báo Real-time</h2>
      </div>

      <div className="luxury-card p-8 rounded-2xl border border-[#e1b777]/15 max-w-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#e1b777]/5 rounded-full filter blur-3xl pointer-events-none" />
        
        {status && (
          <div className={`mb-6 p-4 rounded-xl border font-bold text-sm tracking-wide transition-all ${
            status.includes('Lỗi') 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-green-500/10 border-green-500/30 text-green-400'
          }`}>
            {status}
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[#e1b777] uppercase tracking-[0.2em] font-mono">Tiêu đề thông báo</label>
            <input 
              className="w-full bg-[#16161c] border border-[#e1b777]/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e1b777] transition-all placeholder-neutral-600" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Ví dụ: Khuyến mãi Private Membership đặc biệt..." 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[#e1b777] uppercase tracking-[0.2em] font-mono">Nội dung chi tiết</label>
            <textarea 
              className="w-full bg-[#16161c] border border-[#e1b777]/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e1b777] transition-all placeholder-neutral-600 min-h-[120px]" 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              rows={4} 
              placeholder="Nhập nội dung thông báo cho toàn thể hội viên..." 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[#e1b777] uppercase tracking-[0.2em] font-mono">Hình ảnh đính kèm (Base64)</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#e1b777]/20 rounded-xl p-6 hover:bg-[#e1b777]/5 transition-all cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <ImageIcon className="w-8 h-8 text-[#e1b777]/40 mb-2 group-hover:text-[#e1b777] transition-colors" />
                <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider group-hover:text-neutral-200">Chọn ảnh thông báo</span>
                <span className="text-[9px] text-neutral-600 mt-1 uppercase font-mono tracking-widest">Support: PNG, JPG, GIF</span>
              </label>

              {imageBase64 && (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[#e1b777]/30 shadow-lg">
                  <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setImageBase64('')}
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button 
            className="w-full bg-gradient-to-r from-[#e1b777] to-amber-600 hover:from-amber-500 hover:to-amber-700 text-neutral-950 px-6 py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-amber-500/10 transition-all active:scale-[0.98]" 
            onClick={handleSend}
          >
            Phát sóng thông báo ngay
          </button>
        </div>
      </div>
    </div>
  );
}

function SystemAdmin() {
  const [settings, setSettings] = useState<any>({ broadcast: '', lockVerticalMotion: false });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'system'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    });
    return unsub;
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'system'), settings, { merge: true });
      alert("Đã cập nhật cấu hình hệ thống!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu cấu hình");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDistributeInterest = async () => {
    if (!window.confirm('Xác nhận phân phối lãi suất hằng ngày (0.4%) cho tất cả hội viên?')) return;

    setStatus({ type: 'loading', message: 'Đang xử lý phân phối lãi suất...' });
    setResult(null);

    try {
      const response = await fetch('/api/admin/distribute-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: 'vinclub-internal-cron-key' })
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ type: 'success', message: data.message });
        setResult(data);
      } else {
        setStatus({ type: 'error', message: data.error || 'Lỗi không xác định khi phân phối lãi suất.' });
      }
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: 'Lỗi kết nối máy chủ.' });
    }
  };

  return (
    <div className="p-8 bg-[#08080a] min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-10 border-b border-neutral-900 pb-8">
          <div className="p-3 bg-amber-500/10 rounded-2xl">
            <Settings className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight font-serif">Quản trị Hệ thống</h2>
            <p className="text-[10px] text-neutral-500 mt-1 uppercase font-bold tracking-[0.4em]">Realtime Synchronization Engine</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Cấu hình chung */}
          <div className="bg-[#121215] border border-neutral-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-6 flex items-center gap-2">
              <Megaphone size={16} />
              Thông báo & Cấu hình
            </h3>
            
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3 block">
                  Thông báo toàn hệ thống (Broadcast)
                </label>
                <textarea
                  className="w-full bg-[#18181c] border border-neutral-800 focus:border-amber-500/50 rounded-2xl p-4 text-sm text-neutral-200 min-h-[140px] focus:outline-none transition-all placeholder:text-neutral-700 font-medium leading-relaxed"
                  placeholder="Nhập nội dung thông báo sẽ xuất hiện ngay lập tức trên màn hình của tất cả người dùng..."
                  value={settings.broadcast || ''}
                  onChange={e => setSettings({ ...settings, broadcast: e.target.value })}
                />
                <p className="text-[10px] text-neutral-600 mt-2 italic font-medium">* Nội dung này sẽ được đồng bộ tức thì qua Websocket tới App User.</p>
              </div>

              <div className="pt-6 border-t border-neutral-900">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[10px] font-black text-neutral-200 uppercase tracking-wider mb-1 block">
                      Khóa chuyển động dọc (Globe Lock)
                    </label>
                    <p className="text-[10px] text-neutral-500">Giới hạn góc xoay của quả cầu 3D cho người dùng</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, lockVerticalMotion: !settings.lockVerticalMotion })}
                    className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${settings.lockVerticalMotion ? 'bg-amber-500' : 'bg-neutral-800'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${settings.lockVerticalMotion ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all active:scale-95 shadow-xl shadow-amber-500/10 disabled:opacity-50"
              >
                {isSaving ? 'Đang cập nhật...' : 'Cập nhật cấu hình ngay'}
              </button>
            </form>
          </div>

          {/* Công cụ tài chính */}
          <div className="space-y-8">
            <div className="bg-[#121215] border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#e1b777]/5 rounded-full filter blur-3xl pointer-events-none" />
              
              <h3 className="text-sm font-black uppercase tracking-widest text-[#e1b777] mb-6 flex items-center gap-2">
                <TrendingUp size={16} />
                Lãi suất tự động
              </h3>

              <p className="text-xs text-neutral-400 mb-8 leading-relaxed font-medium">
                Kích hoạt quy trình tính toán và phân phối lãi suất hằng ngày (<span className="text-[#e1b777] font-bold">0.4%</span>) cho toàn bộ hội viên có số dư trong hệ thống.
              </p>

              <button 
                disabled={status.type === 'loading'}
                onClick={handleDistributeInterest}
                className={`w-full px-6 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                  status.type === 'loading'
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-[#e1b777] shadow-xl shadow-black/40'
                }`}
              >
                {status.type === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Phát lãi suất 0.4% ngay'
                )}
              </button>

              {status.type !== 'idle' && (
                <div className={`mt-6 p-4 rounded-xl border text-[11px] font-bold tracking-wide animate-in fade-in slide-in-from-top-2 ${
                  status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  status.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                  'bg-blue-500/10 border-blue-500/30 text-blue-400'
                }`}>
                  {status.message}
                </div>
              )}

              {result && (
                <div className="mt-6 bg-black/40 rounded-xl p-4 border border-white/5 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-neutral-500">Hội viên nhận lãi:</span>
                    <span className="text-white">{result.totalUsers}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-neutral-500">Tổng điểm chi trả:</span>
                    <span className="text-amber-500">{result.totalPoints.toLocaleString()} VNĐ</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-[#121215] border border-neutral-800 rounded-3xl p-8 shadow-2xl opacity-50 grayscale pointer-events-none">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <Lock className="text-neutral-500 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-neutral-300 text-xs font-bold uppercase tracking-wider">Bảo mật nâng cao</h3>
                  <p className="text-[9px] text-neutral-600 font-mono tracking-widest mt-0.5">ADVANCED ENCRYPTION</p>
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 font-medium">Hệ thống đang đồng bộ các lớp bảo mật đa tầng...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Hàm kiểm tra nút bấm nhanh trong quá trình phát triển
const handleUnimplementedButton = (buttonName: string) => {
  console.warn(`[Vinclub Admin] Nút "${buttonName}" chưa được gắn logic xử lý!`);
  alert(`Chức năng "${buttonName}" đang được tích hợp.`);
};

export default function AdminApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (localStorage.getItem('admin_bypass') === 'true') {
      setIsLoggedIn(true);
      setIsAuthChecking(false);
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@gmail.com') {
        setIsLoggedIn(true);
      } else if (localStorage.getItem('admin_bypass') !== 'true') {
        setIsLoggedIn(false);
      }
      setIsAuthChecking(false);
    });
    return unsub;
  }, []);

  if (isAuthChecking) {
    return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-bold text-gray-500">Đang kiểm tra xác thực...</div>;
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  const handleLogout = async () => {
    localStorage.removeItem('admin_bypass');
    await signOut(auth);
    setIsLoggedIn(false);
  };

  const navItemClass = (path: string) => 
    `flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-300 font-semibold text-[11px] tracking-widest uppercase ${
      location.pathname === path 
        ? 'bg-gradient-to-r from-[#e1b777]/20 to-amber-500/5 text-[#e1b777] border-l-2 border-[#e1b777] shadow-lg shadow-[#e1b777]/5' 
        : 'text-neutral-400 hover:text-[#e1b777] hover:bg-neutral-900/40'
    }`;

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex font-sans">
      <div className="w-64 bg-[#0c0c10] border-r border-[#e1b777]/10 p-5 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="py-6 border-b border-[#e1b777]/10 mb-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <ProgressiveImage src="/logo.png" alt="Vinclub Logo" className="h-7 w-auto" imgClassName="object-contain" />
              <span className="text-xl font-bold tracking-[0.1em] text-[#e1b777] font-serif">VINCLUB</span>
            </div>
            <p className="text-[9px] text-[#e1b777]/40 uppercase tracking-[0.3em] font-mono">Private Admin Panel</p>
          </div>
          <nav className="space-y-1.5">
            <Link to="/admin" className={navItemClass('/admin')}>Tổng quan</Link>
            <Link to="/admin/projects" className={navItemClass('/admin/projects')}>Dự án</Link>
            <Link to="/admin/registrations" className={navItemClass('/admin/registrations')}>Người dùng</Link>
            <Link to="/admin/news" className={navItemClass('/admin/news')}>Tin tức</Link>
            <Link to="/admin/chat" className={navItemClass('/admin/chat')}>Hỗ trợ</Link>
            <Link to="/admin/notifications" className={navItemClass('/admin/notifications')}>Thông báo</Link>
            <Link to="/admin/transactions" className={navItemClass('/admin/transactions')}>Giao dịch</Link>
            <Link to="/admin/system" className={navItemClass('/admin/system')}>Hệ thống</Link>
          </nav>
        </div>
        <div className="pt-4 border-t border-[#e1b777]/10">
          <button 
            className="w-full px-4 py-2.5 bg-[#e1b777]/10 hover:bg-[#e1b777]/20 text-[#e1b777] border border-[#e1b777]/20 rounded-lg font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#070709]">
        <Routes>
          <Route path="/" element={<DashboardAdmin />} />
          <Route path="/projects" element={<ProjectsAdmin />} />
          <Route path="/registrations" element={<RegistrationAdmin />} />
          <Route path="/news" element={<NewsAdmin />} />
          <Route path="/chat" element={<ChatAdmin />} />
          <Route path="/notifications" element={<NotificationsAdmin />} />
          <Route path="/transactions" element={<TransactionsAdmin />} />
          <Route path="/system" element={<SystemAdmin />} />
        </Routes>
      </div>
    </div>
  );
}
