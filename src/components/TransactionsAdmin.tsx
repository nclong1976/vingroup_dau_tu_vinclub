import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, increment, query, orderBy, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, XCircle, Clock, ArrowDownLeft, ArrowUpRight, CheckSquare, Square, Eye, X, FileText } from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'plus' | 'minus' | 'investment';
  amount: number;
  status: 'Đang chờ duyệt' | 'Thành công' | 'Từ chối' | 'pending' | 'completed' | 'rejected';
  createdAt: string;
  date?: string;
  paymentMethod?: string;
  userName?: string;
  description?: string;
  title?: string;
  contractId?: string;
  signature_content?: string;
  interestRate?: string;
  duration?: string;
}

export default function TransactionsAdmin() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingProof, setViewingProof] = useState<Transaction | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'finance' | 'investment'>('all');

  useEffect(() => {
    const q = query(collection(db, 'transactions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => txs.push({ id: doc.id, ...doc.data() } as Transaction));
      
      // Sort in memory safely to support mixed format dates and firebase timestamps
      txs.sort((a, b) => {
        const getMs = (val: any) => {
          if (!val) return 0;
          if (val.seconds) return val.seconds * 1000;
          if (val.toDate) return val.toDate().getTime();
          return new Date(val).getTime() || 0;
        };
        const dateA = getMs(a.date) || getMs(a.createdAt) || 0;
        const dateB = getMs(b.date) || getMs(b.createdAt) || 0;
        return dateB - dateA;
      });
      
      setTransactions(txs);
      
      // Clean up selected IDs that might no longer be pending or exist
      setSelectedTxIds(prev => {
        const newSet = new Set(prev);
        for (const id of newSet) {
          const tx = txs.find(t => t.id === id);
          if (!tx || (tx.status !== 'pending' && tx.status !== 'Đang chờ duyệt')) {
            newSet.delete(id);
          }
        }
        return newSet;
      });
    });
    return () => unsubscribe();
  }, []);

  const handleAction = async (tx: Transaction, action: 'approve' | 'reject') => {
    const isBulk = isProcessing;
    if (!isBulk) setIsProcessing(true);
    
    try {
      const txRef = doc(db, 'transactions', tx.id);
      const userRef = doc(db, 'users', tx.userId);

      await runTransaction(db, async (transaction) => {
        const userExists = tx.userId && tx.userId !== "anonymous" && tx.userId !== "ẨN DANH";
        let userData: any = null;
        if (userExists) {
          const userDoc = await transaction.get(userRef);
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
        }

        if (action === 'approve') {
          transaction.update(txRef, { status: 'Thành công' });
          
          if (userData) {
            const currentPoints = userData.points || 0;
            const currentCumulative = userData.cumulativeDeposits || 0;

            if (tx.type === 'plus' || tx.type === 'deposit') {
              const newPoints = currentPoints + tx.amount;
              const newCumulative = currentCumulative + tx.amount;
              
              // Determine new tier based on cumulative deposits
              let newTier = 'THÀNH VIÊN / MEMBER';
              if (newCumulative >= 10000000000) {
                newTier = 'KIM CƯƠNG / DIAMOND';
              } else if (newCumulative >= 5000000000) {
                newTier = 'BẠCH KIM / PLATINUM';
              } else if (newCumulative >= 1000000000) {
                newTier = 'VÀNG / GOLD';
              }

              transaction.update(userRef, { 
                points: newPoints,
                balance: newPoints,
                cumulativeDeposits: newCumulative,
                rank: newTier,
                updatedAt: new Date().toISOString()
              });
            } else if (tx.type === 'minus' || tx.type === 'withdraw') {
              if (currentPoints < tx.amount) {
                throw new Error("Số dư không đủ để thực hiện lệnh rút.");
              }
              transaction.update(userRef, { 
                points: currentPoints - tx.amount,
                balance: currentPoints - tx.amount,
                updatedAt: new Date().toISOString()
              });
            }
          }
        } else {
          transaction.update(txRef, { status: 'Từ chối' });
        }
      });
    } catch (error: any) {
      console.error("Lỗi cập nhật giao dịch:", error);
      alert(error.message || "Lỗi cập nhật giao dịch");
    } finally {
      if (!isBulk) setIsProcessing(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedTxIds.size === 0) return;
    setIsProcessing(true);
    
    const txsToProcess = transactions.filter(tx => selectedTxIds.has(tx.id));
    
    await Promise.all(txsToProcess.map(tx => handleAction(tx, action)));
    
    setSelectedTxIds(new Set());
    setIsProcessing(false);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedTxIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTxIds(newSet);
  };

  const isPending = (status: string) => status === 'pending' || status === 'Đang chờ duyệt';

  const filteredTxs = transactions.filter(tx => {
    if (filterTab === 'finance') {
      return tx.type === 'deposit' || tx.type === 'withdraw' || tx.type === 'plus' || tx.type === 'minus';
    }
    if (filterTab === 'investment') {
      return tx.type === 'investment';
    }
    return true;
  });

  const pendingTxs = filteredTxs.filter(tx => isPending(tx.status));
  const allPendingSelected = pendingTxs.length > 0 && selectedTxIds.size === pendingTxs.length;

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(pendingTxs.map(tx => tx.id)));
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen text-gray-800 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">
            Quản lý & Phê duyệt Giao dịch
          </h2>
          <p className="text-xs text-gray-500 mt-1">Duyệt nạp/rút tiền tài khoản và hồ sơ ký kết hợp đồng góp vốn</p>
        </div>
        
        {pendingTxs.length > 0 && (
          <div className="flex items-center gap-4 bg-gray-50 p-2 px-4 rounded-lg border border-gray-200 shadow-sm">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[11px] uppercase tracking-wider text-gray-600">
              <input 
                type="checkbox" 
                className="hidden" 
                checked={allPendingSelected} 
                onChange={toggleSelectAll} 
              />
              {allPendingSelected ? <CheckSquare className="text-blue-600" /> : <Square className="text-gray-400" />}
              Chọn tất cả ({pendingTxs.length})
            </label>
            
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Đã chọn: {selectedTxIds.size}</span>
            
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={selectedTxIds.size === 0 || isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-green-500/20"
            >
              <CheckCircle size={14} strokeWidth={3} /> Duyệt chọn
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={selectedTxIds.size === 0 || isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-red-500/20"
            >
              <XCircle size={14} strokeWidth={3} /> Từ chối chọn
            </button>
          </div>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1 gap-1 mb-6 max-w-md">
        <button
          onClick={() => setFilterTab('all')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${filterTab === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilterTab('finance')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${filterTab === 'finance' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Nạp / Rút tiền
        </button>
        <button
          onClick={() => setFilterTab('investment')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${filterTab === 'investment' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Hợp đồng Góp vốn
        </button>
      </div>

      <div className="grid gap-4">
        {filteredTxs.map((tx) => (
          <div key={tx.id} className={`bg-white border ${selectedTxIds.has(tx.id) ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-100'} rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all hover:shadow-md`}>
            <div className="flex items-center gap-4">
              {isPending(tx.status) && (
                <div className="cursor-pointer" onClick={() => toggleSelection(tx.id)}>
                  {selectedTxIds.has(tx.id) ? (
                    <CheckSquare className="text-blue-600" size={24} />
                  ) : (
                    <Square className="text-gray-300 hover:text-blue-400" size={24} />
                  )}
                </div>
              )}
              
              <div className={`p-3 rounded-2xl ${
                tx.type === 'investment'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : (tx.type === 'plus' || tx.type === 'deposit')
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
              } ${!isPending(tx.status) ? 'ml-8' : ''}`}>
                {tx.type === 'investment' ? (
                  <FileText size={24} />
                ) : (tx.type === 'plus' || tx.type === 'deposit') ? (
                  <ArrowDownLeft size={24} />
                ) : (
                  <ArrowUpRight size={24} />
                )}
              </div>
              <div>
                <p className="font-black text-gray-900 uppercase text-sm tracking-tight">
                  {tx.type === 'investment' ? (
                    `Hợp Đồng Góp Vốn: ${tx.title?.replace('Đầu tư: ', '') || 'Dự án Đặc quyền'}`
                  ) : (tx.type === 'plus' || tx.type === 'deposit') ? (
                    'Lệnh Nạp Tiền'
                  ) : (
                    'Lệnh Rút Tiền'
                  )}
                </p>
                <p className="text-[11px] font-bold text-gray-400 uppercase mt-0.5">Mã ID: <span className="font-mono text-gray-600 tracking-normal">{tx.userId}</span></p>
                <p className="text-[11px] font-medium text-gray-500 mt-1">
                  {tx.type === 'investment' ? (
                    <>Khách hàng: <span className="font-bold text-gray-700">{tx.userName || 'Ẩn danh'}</span> | Lãi suất: <span className="font-bold text-amber-600">{tx.interestRate || '1.85%'}</span> | Kỳ hạn: <span className="font-bold text-amber-600">{tx.duration || '1440 phút'}</span></>
                  ) : tx.description ? (
                    <span className="text-amber-600 font-bold">{tx.description}</span>
                  ) : (
                    <>Khách hàng: <span className="font-bold text-gray-700">{tx.userName || 'Ẩn danh'}</span> | PT: {tx.paymentMethod?.toUpperCase() || 'NGÂN HÀNG'}</>
                  )}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                  {tx.date || tx.createdAt ? new Date(tx.date || tx.createdAt).toLocaleString('vi-VN') : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-10">
              <div className="flex flex-col items-end gap-2">
                {((tx as any).signature || (tx as any).signature_content || (tx as any).idDocumentUrl || (tx as any).cccdFront) && (
                  <button 
                    onClick={() => setViewingProof(tx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                  >
                    <Eye size={12} /> Xem Chữ Ký / HĐ
                  </button>
                )}
                <div className="text-right">
                  <p className={`text-2xl font-black ${
                    tx.type === 'investment' 
                      ? 'text-amber-600' 
                      : (tx.type === 'plus' || tx.type === 'deposit') 
                        ? 'text-green-600' 
                        : 'text-red-600'
                  }`}>
                    {tx.type === 'investment' ? '' : (tx.type === 'plus' || tx.type === 'deposit') ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} <span className="text-xs font-bold">VNĐ</span>
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    {isPending(tx.status) && <><Clock size={12} className="text-amber-500" /><span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Chờ duyệt</span></>}
                    {(tx.status === 'completed' || tx.status === 'Thành công') && <><CheckCircle size={12} className="text-green-600" /><span className="text-green-600 text-[10px] font-black uppercase tracking-widest">Thành công</span></>}
                    {(tx.status === 'rejected' || tx.status === 'Từ chối') && <><XCircle size={12} className="text-red-600" /><span className="text-red-600 text-[10px] font-black uppercase tracking-widest">Từ chối</span></>}
                  </div>
                </div>
              </div>

              {isPending(tx.status) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(tx, 'approve')}
                    disabled={isProcessing}
                    className="w-10 h-10 flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 rounded-xl transition-all disabled:opacity-50"
                    title="Phê duyệt"
                  >
                    <CheckCircle size={20} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => handleAction(tx, 'reject')}
                    disabled={isProcessing}
                    className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-all disabled:opacity-50"
                    title="Từ chối"
                  >
                    <XCircle size={20} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredTxs.length === 0 && (
          <p className="text-center text-gray-500 mt-10">Không có bản ghi giao dịch nào phù hợp.</p>
        )}
      </div>

      {viewingProof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl">
            <button 
              onClick={() => setViewingProof(null)}
              className="absolute right-4 top-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10 transition-all"
            >
              <X size={24} />
            </button>
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                  {viewingProof.type === 'investment' ? 'Hợp Đồng Điện Tử (Chữ ký)' : 'Minh Chứng Giao Dịch'}
                </h3>
                <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">
                  {viewingProof.type === 'investment' ? `Mã Hợp Đồng: ${viewingProof.contractId || viewingProof.id}` : `Mã giao dịch: ${viewingProof.id}`}
                </p>
              </div>
              <div className="text-right">
                 <p className={`text-2xl font-black ${
                   viewingProof.type === 'investment' 
                     ? 'text-amber-600' 
                     : (viewingProof.type === 'plus' || viewingProof.type === 'deposit') 
                       ? 'text-green-600' 
                       : 'text-red-600'
                 }`}>
                    {viewingProof.amount.toLocaleString('vi-VN')} VNĐ
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{viewingProof.userName || 'Người dùng'}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-neutral-100">
              {((viewingProof as any).signature || (viewingProof as any).signature_content || (viewingProof as any).idDocumentUrl || (viewingProof as any).cccdFront) ? (
                <img 
                  src={(viewingProof as any).signature || (viewingProof as any).signature_content || (viewingProof as any).idDocumentUrl || (viewingProof as any).cccdFront} 
                  alt="Proof of transaction" 
                  referrerPolicy="no-referrer"
                  className="max-w-full h-auto rounded-lg shadow-xl border border-white/20"
                />
              ) : (
                <div className="text-gray-400 font-bold italic">Không tìm thấy hình ảnh minh chứng</div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setViewingProof(null)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Đóng
              </button>
              {isPending(viewingProof.status) && (
                <>
                  <button 
                    onClick={() => { handleAction(viewingProof, 'reject'); setViewingProof(null); }}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
                  >
                    Từ chối
                  </button>
                  <button 
                    onClick={() => { handleAction(viewingProof, 'approve'); setViewingProof(null); }}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-green-500/20"
                  >
                    Duyệt ngay
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
