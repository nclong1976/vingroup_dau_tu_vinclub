/**
 * TransactionsAdmin.tsx
 * Quản lý & Phê duyệt Giao dịch – VinClub Admin Panel
 *
 * Features:
 * - Real-time Firestore subscription (onSnapshot)
 * - Custom hooks: useTransactions, useBulkActions
 * - Full TypeScript với interfaces đầy đủ
 * - Bulk approve / reject
 * - Modal xem chữ ký / minh chứng
 * - Filter tabs: Tất cả | Nạp/Rút tiền | Hợp đồng Góp vốn
 * - Loading state & Error boundary
 * - Accessibility: aria labels, keyboard support
 * - Tiếng Việt toàn bộ
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  query,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  CheckSquare,
  Square,
  Eye,
  X,
  FileText,
  AlertCircle,
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
} from 'lucide-react';

// ─────────────────────────────────────────────
// SECTION 1: TypeScript Interfaces
// ─────────────────────────────────────────────

/** Loại giao dịch */
type TxType = 'deposit' | 'withdraw' | 'plus' | 'minus' | 'investment';

/** Trạng thái giao dịch (hỗ trợ cả tiếng Việt lẫn tiếng Anh) */
type TxStatus =
  | 'Đang chờ duyệt'
  | 'Thành công'
  | 'Từ chối'
  | 'pending'
  | 'completed'
  | 'rejected';

/** Filter tab */
type FilterTab = 'all' | 'finance' | 'investment';

/** Giao dịch từ Firestore */
interface Transaction {
  id: string;
  userId: string;
  type: TxType;
  amount: number;
  status: TxStatus;
  /** ISO string hoặc Firestore Timestamp */
  createdAt?: any;
  /** ISO string hoặc Firestore Timestamp (field cũ) */
  date?: any;
  paymentMethod?: string;
  userName?: string;
  userEmail?: string;
  description?: string;
  title?: string;
  contractId?: string;
  /** Chữ ký base64 hoặc URL */
  signature?: string;
  signature_content?: string;
  signature_type?: string;
  idDocumentUrl?: string;
  cccdFront?: string;
  interestRate?: string;
  duration?: string;
  bankInfo?: string;
}

/** Kết quả từ custom hook useTransactions */
interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

/** Kết quả từ custom hook useBulkActions */
interface UseBulkActionsResult {
  selectedIds: Set<string>;
  isProcessing: boolean;
  toggle: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  clearSelection: () => void;
  bulkApprove: (txs: Transaction[]) => Promise<void>;
  bulkReject: (txs: Transaction[]) => Promise<void>;
  approveSingle: (tx: Transaction) => Promise<void>;
  rejectSingle: (tx: Transaction) => Promise<void>;
}

// ─────────────────────────────────────────────
// SECTION 2: Helper Utilities
// ─────────────────────────────────────────────

/** Chuyển đổi date từ nhiều format sang milliseconds */
const toMs = (val: any): number => {
  if (!val) return 0;
  if (val?.seconds) return val.seconds * 1000; // Firestore Timestamp
  if (val?.toDate) return val.toDate().getTime();
  return new Date(val).getTime() || 0;
};

/** Kiểm tra trạng thái "đang chờ duyệt" */
const isPending = (status: TxStatus | string): boolean =>
  status === 'pending' || status === 'Đang chờ duyệt';

/** Kiểm tra giao dịch là "Nạp tiền / Cộng tiền" */
const isCredit = (type: TxType): boolean =>
  type === 'plus' || type === 'deposit';

/** Kiểm tra giao dịch là "Rút tiền / Trừ tiền" */
const isDebit = (type: TxType): boolean =>
  type === 'minus' || type === 'withdraw';

/**
 * Tính hạng thẻ dựa trên tổng nạp tích lũy
 * Quy tắc: MEMBER < 1 tỷ | GOLD ≥ 1 tỷ | PLATINUM ≥ 5 tỷ | DIAMOND ≥ 10 tỷ
 */
const calcTier = (cumulative: number): string => {
  if (cumulative >= 10_000_000_000) return 'KIM CƯƠNG / DIAMOND';
  if (cumulative >= 5_000_000_000) return 'BẠCH KIM / PLATINUM';
  if (cumulative >= 1_000_000_000) return 'VÀNG / GOLD';
  return 'THÀNH VIÊN / MEMBER';
};

/** Lấy URL ảnh minh chứng từ transaction */
const getProofUrl = (tx: Transaction): string | null =>
  tx.signature || tx.signature_content || tx.idDocumentUrl || tx.cccdFront || null;

/** Format ngày giờ sang tiếng Việt */
const formatDate = (val: any): string => {
  const ms = toMs(val);
  if (!ms) return '—';
  return new Date(ms).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─────────────────────────────────────────────
// SECTION 3: Custom Hook – useTransactions
// ─────────────────────────────────────────────

/**
 * useTransactions
 * Subscribe real-time đến Firestore collection 'transactions'.
 * Tự động sort theo ngày mới nhất lên đầu.
 */
function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Không dùng orderBy trên Firestore để tránh lỗi index missing;
    // sort trong bộ nhớ sau khi nhận data
    const q = query(collection(db, 'transactions'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txs: Transaction[] = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Transaction)
        );

        // Sort: mới nhất lên đầu
        txs.sort((a, b) => {
          const dateA = toMs(a.date) || toMs(a.createdAt) || 0;
          const dateB = toMs(b.date) || toMs(b.createdAt) || 0;
          return dateB - dateA;
        });

        setTransactions(txs);
        setLoading(false);
      },
      (err) => {
        console.error('[useTransactions] Lỗi Firestore:', err);
        setError('Không thể tải danh sách giao dịch. Vui lòng thử lại.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { transactions, loading, error };
}

// ─────────────────────────────────────────────
// SECTION 4: Custom Hook – useBulkActions
// ─────────────────────────────────────────────

/**
 * useBulkActions
 * Quản lý selection và thực hiện phê duyệt / từ chối hàng loạt.
 * Sử dụng Firestore runTransaction để đảm bảo tính nguyên tử.
 */
function useBulkActions(): UseBulkActionsResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Toggle chọn một giao dịch
  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Toggle chọn tất cả / bỏ chọn tất cả
  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(ids);
    });
  }, []);

  // Xóa toàn bộ selection
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  /**
   * Xử lý phê duyệt / từ chối một giao dịch.
   * - Nếu approve + credit (plus/deposit): cộng tiền, nâng tier
   * - Nếu approve + debit (minus/withdraw): trừ tiền (có kiểm tra số dư)
   * - Nếu reject: chỉ cập nhật status
   */
  const processOne = useCallback(
    async (tx: Transaction, action: 'approve' | 'reject') => {
      const txRef = doc(db, 'transactions', tx.id);
      const userRef = doc(db, 'users', tx.userId);
      const hasUser =
        tx.userId &&
        tx.userId !== 'anonymous' &&
        tx.userId !== 'ẨN DANH';

      await runTransaction(db, async (firestoreTx) => {
        // Đọc user data nếu cần
        let userData: Record<string, any> | null = null;
        if (hasUser && action === 'approve') {
          const userSnap = await firestoreTx.get(userRef);
          if (userSnap.exists()) {
            userData = userSnap.data() as Record<string, any>;
          }
        }

        if (action === 'approve') {
          // Cập nhật trạng thái giao dịch
          firestoreTx.update(txRef, { status: 'Thành công' });

          if (userData) {
            const currentBalance: number = userData.points || 0;
            const currentCumulative: number = userData.cumulativeDeposits || 0;

            if (isCredit(tx.type)) {
              // ── CỘNG TIỀN: nạp tiền / góp vốn ──────────────────────────
              const newBalance = currentBalance + tx.amount;
              const newCumulative = currentCumulative + tx.amount;
              const newTier = calcTier(newCumulative);

              firestoreTx.update(userRef, {
                points: newBalance,
                balance: newBalance,
                cumulativeDeposits: newCumulative,
                rank: newTier,
                updatedAt: new Date().toISOString(),
              });
            } else if (isDebit(tx.type)) {
              // ── TRỪ TIỀN: rút tiền ──────────────────────────────────────
              if (currentBalance < tx.amount) {
                throw new Error(
                  `Số dư không đủ. Hiện có: ${currentBalance.toLocaleString('vi-VN')} VNĐ, yêu cầu rút: ${tx.amount.toLocaleString('vi-VN')} VNĐ.`
                );
              }
              const newBalance = currentBalance - tx.amount;

              firestoreTx.update(userRef, {
                points: newBalance,
                balance: newBalance,
                updatedAt: new Date().toISOString(),
              });
            }
            // type === 'investment': không cập nhật balance trực tiếp
          }
        } else {
          // Từ chối: chỉ đổi status
          firestoreTx.update(txRef, { status: 'Từ chối' });
        }
      });
    },
    []
  );

  // Phê duyệt một giao dịch đơn
  const approveSingle = useCallback(
    async (tx: Transaction) => {
      setIsProcessing(true);
      try {
        await processOne(tx, 'approve');
      } catch (err: any) {
        alert(err.message || 'Lỗi khi phê duyệt giao dịch.');
      } finally {
        setIsProcessing(false);
      }
    },
    [processOne]
  );

  // Từ chối một giao dịch đơn
  const rejectSingle = useCallback(
    async (tx: Transaction) => {
      setIsProcessing(true);
      try {
        await processOne(tx, 'reject');
      } catch (err: any) {
        alert(err.message || 'Lỗi khi từ chối giao dịch.');
      } finally {
        setIsProcessing(false);
      }
    },
    [processOne]
  );

  // Phê duyệt hàng loạt
  const bulkApprove = useCallback(
    async (txs: Transaction[]) => {
      if (txs.length === 0) return;
      setIsProcessing(true);
      const errors: string[] = [];
      await Promise.allSettled(
        txs.map((tx) =>
          processOne(tx, 'approve').catch((err: any) => {
            errors.push(`[${tx.userName || tx.id}]: ${err.message}`);
          })
        )
      );
      clearSelection();
      setIsProcessing(false);
      if (errors.length > 0) {
        alert(`Một số giao dịch gặp lỗi:\n${errors.join('\n')}`);
      }
    },
    [processOne, clearSelection]
  );

  // Từ chối hàng loạt
  const bulkReject = useCallback(
    async (txs: Transaction[]) => {
      if (txs.length === 0) return;
      setIsProcessing(true);
      await Promise.allSettled(
        txs.map((tx) => processOne(tx, 'reject').catch(console.error))
      );
      clearSelection();
      setIsProcessing(false);
    },
    [processOne, clearSelection]
  );

  return {
    selectedIds,
    isProcessing,
    toggle,
    toggleAll,
    clearSelection,
    bulkApprove,
    bulkReject,
    approveSingle,
    rejectSingle,
  };
}

// ─────────────────────────────────────────────
// SECTION 5: Sub-components
// ─────────────────────────────────────────────

/** Badge trạng thái giao dịch */
function StatusBadge({ status }: { status: TxStatus | string }) {
  if (isPending(status)) {
    return (
      <span className="inline-flex items-center gap-1 text-amber-600 text-[10px] font-black uppercase tracking-widest">
        <Clock size={10} /> Chờ duyệt
      </span>
    );
  }
  if (status === 'completed' || status === 'Thành công') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 text-[10px] font-black uppercase tracking-widest">
        <CheckCircle size={10} /> Thành công
      </span>
    );
  }
  if (status === 'rejected' || status === 'Từ chối') {
    return (
      <span className="inline-flex items-center gap-1 text-red-500 text-[10px] font-black uppercase tracking-widest">
        <XCircle size={10} /> Từ chối
      </span>
    );
  }
  return null;
}

/** Icon loại giao dịch */
function TxTypeIcon({ type }: { type: TxType }) {
  if (type === 'investment') {
    return (
      <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
        <FileText size={22} />
      </div>
    );
  }
  if (isCredit(type)) {
    return (
      <div className="p-3 rounded-2xl bg-green-50 text-green-600 border border-green-100">
        <ArrowDownLeft size={22} />
      </div>
    );
  }
  return (
    <div className="p-3 rounded-2xl bg-red-50 text-red-500 border border-red-100">
      <ArrowUpRight size={22} />
    </div>
  );
}

/** Nhãn tiền (màu theo loại) */
function AmountLabel({ tx }: { tx: Transaction }) {
  const color =
    tx.type === 'investment'
      ? 'text-amber-600'
      : isCredit(tx.type)
      ? 'text-green-600'
      : 'text-red-500';
  const prefix =
    tx.type === 'investment' ? '' : isCredit(tx.type) ? '+' : '-';

  return (
    <p className={`text-xl font-black tabular-nums ${color}`}>
      {prefix}
      {tx.amount.toLocaleString('vi-VN')}{' '}
      <span className="text-xs font-bold">VNĐ</span>
    </p>
  );
}

// ─────────────────────────────────────────────
// SECTION 6: Proof Modal
// ─────────────────────────────────────────────

interface ProofModalProps {
  tx: Transaction;
  onClose: () => void;
  onApprove: (tx: Transaction) => void;
  onReject: (tx: Transaction) => void;
  isProcessing: boolean;
}

function ProofModal({
  tx,
  onClose,
  onApprove,
  onReject,
  isProcessing,
}: ProofModalProps) {
  const proofUrl = getProofUrl(tx);
  const canAction = isPending(tx.status);

  // Đóng modal bằng phím Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem minh chứng giao dịch"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
              {tx.type === 'investment'
                ? 'Hợp đồng điện tử (Chữ ký)'
                : 'Minh chứng giao dịch'}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Mã:{' '}
              <span className="font-mono text-gray-600">
                {tx.contractId || tx.id}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <AmountLabel tx={tx} />
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                {tx.userName || 'Ẩn danh'}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng modal"
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Proof image */}
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-neutral-100 min-h-48">
          {proofUrl ? (
            <img
              src={proofUrl}
              alt="Minh chứng / chữ ký giao dịch"
              referrerPolicy="no-referrer"
              className="max-w-full h-auto rounded-xl shadow-lg border border-white/30 object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <AlertCircle size={40} />
              <p className="font-bold text-sm italic">
                Không có hình ảnh minh chứng
              </p>
            </div>
          )}
        </div>

        {/* Actions footer */}
        <div className="p-5 bg-white border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
          >
            Đóng
          </button>
          {canAction && (
            <>
              <button
                onClick={() => {
                  onReject(tx);
                  onClose();
                }}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                Từ chối
              </button>
              <button
                onClick={() => {
                  onApprove(tx);
                  onClose();
                }}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-green-500/20"
              >
                Duyệt ngay
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION 7: Transaction Row
// ─────────────────────────────────────────────

interface TxRowProps {
  key?: React.Key;
  tx: Transaction;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onApprove: (tx: Transaction) => void;
  onReject: (tx: Transaction) => void;
  onViewProof: (tx: Transaction) => void;
  isProcessing: boolean;
}

function TxRow({
  tx,
  isSelected,
  onToggle,
  onApprove,
  onReject,
  onViewProof,
  isProcessing,
}: TxRowProps) {
  const pending = isPending(tx.status);
  const hasProof = !!getProofUrl(tx);

  // Tên loại giao dịch
  const typeName =
    tx.type === 'investment'
      ? `Hợp Đồng Góp Vốn: ${tx.title?.replace('Đầu tư: ', '') || 'Dự án Đặc quyền'}`
      : isCredit(tx.type)
      ? 'Lệnh Nạp Tiền'
      : 'Lệnh Rút Tiền';

  // Dòng thông tin phụ
  const subInfo =
    tx.type === 'investment' ? (
      <>
        KH: <strong>{tx.userName || 'Ẩn danh'}</strong> | Lãi:{' '}
        <strong className="text-amber-600">{tx.interestRate || '1.85%'}</strong>{' '}
        | Kỳ hạn:{' '}
        <strong className="text-amber-600">{tx.duration || '1440 phút'}</strong>
      </>
    ) : tx.description ? (
      <span className="text-amber-600 font-bold">{tx.description}</span>
    ) : (
      <>
        KH: <strong>{tx.userName || 'Ẩn danh'}</strong>
        {tx.bankInfo ? ` | NH: ${tx.bankInfo}` : tx.paymentMethod ? ` | PT: ${tx.paymentMethod.toUpperCase()}` : ''}
      </>
    );

  return (
    <div
      className={`bg-white border rounded-2xl p-4 flex items-center gap-3 shadow-sm transition-all hover:shadow-md ${
        isSelected
          ? 'border-blue-400 ring-1 ring-blue-300'
          : 'border-gray-100 hover:border-gray-200'
      }`}
      role="row"
    >
      {/* Checkbox – chỉ hiển thị khi đang chờ duyệt */}
      <div className="w-6 flex-shrink-0">
        {pending && (
          <button
            aria-label={isSelected ? 'Bỏ chọn' : 'Chọn giao dịch này'}
            onClick={() => onToggle(tx.id)}
            className="text-gray-300 hover:text-blue-500 transition-colors"
          >
            {isSelected ? (
              <CheckSquare size={22} className="text-blue-500" />
            ) : (
              <Square size={22} />
            )}
          </button>
        )}
      </div>

      {/* Icon loại giao dịch */}
      <div className={!pending ? 'ml-6' : ''}>
        <TxTypeIcon type={tx.type} />
      </div>

      {/* Thông tin chính */}
      <div className="flex-1 min-w-0">
        <p className="font-black text-gray-900 text-sm uppercase tracking-tight truncate">
          {typeName}
        </p>
        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 font-mono">
          ID: <span className="text-gray-500 tracking-normal">{tx.userId}</span>
        </p>
        <p className="text-[11px] font-medium text-gray-500 mt-0.5 truncate">
          {subInfo}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {formatDate(tx.date || tx.createdAt)}
        </p>
      </div>

      {/* Số tiền + trạng thái + nút action */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right space-y-1">
          {hasProof && (
            <button
              onClick={() => onViewProof(tx)}
              aria-label="Xem chữ ký / hợp đồng"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all ml-auto"
            >
              <Eye size={11} /> Xem HĐ
            </button>
          )}
          <AmountLabel tx={tx} />
          <StatusBadge status={tx.status} />
        </div>

        {/* Nút Duyệt / Từ chối đơn */}
        {pending && (
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => onApprove(tx)}
              disabled={isProcessing}
              aria-label="Phê duyệt giao dịch"
              title="Phê duyệt"
              className="w-9 h-9 flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 rounded-xl transition-all disabled:opacity-40"
            >
              <CheckCircle size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => onReject(tx)}
              disabled={isProcessing}
              aria-label="Từ chối giao dịch"
              title="Từ chối"
              className="w-9 h-9 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-xl transition-all disabled:opacity-40"
            >
              <XCircle size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION 8: Stats Bar
// ─────────────────────────────────────────────

interface StatsBarProps {
  transactions: Transaction[];
}

function StatsBar({ transactions }: StatsBarProps) {
  const stats = useMemo(() => {
    const pending = transactions.filter((tx) => isPending(tx.status)).length;
    const totalCredit = transactions
      .filter((tx) => isCredit(tx.type) && tx.status === 'Thành công')
      .reduce((s, tx) => s + tx.amount, 0);
    const totalDebit = transactions
      .filter((tx) => isDebit(tx.type) && tx.status === 'Thành công')
      .reduce((s, tx) => s + tx.amount, 0);
    return { pending, totalCredit, totalDebit, total: transactions.length };
  }, [transactions]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[
        {
          icon: <Clock size={16} />,
          label: 'Chờ duyệt',
          value: stats.pending,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-100',
        },
        {
          icon: <Users size={16} />,
          label: 'Tổng giao dịch',
          value: stats.total,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-100',
        },
        {
          icon: <TrendingUp size={16} />,
          label: 'Đã nạp (duyệt)',
          value: `${(stats.totalCredit / 1_000_000).toFixed(1)}M`,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-100',
        },
        {
          icon: <DollarSign size={16} />,
          label: 'Đã rút (duyệt)',
          value: `${(stats.totalDebit / 1_000_000).toFixed(1)}M`,
          color: 'text-red-500',
          bg: 'bg-red-50',
          border: 'border-red-100',
        },
      ].map((item, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 p-3.5 rounded-xl border ${item.border} ${item.bg}`}
        >
          <div className={`${item.color}`}>{item.icon}</div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {item.label}
            </p>
            <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION 9: Main Component
// ─────────────────────────────────────────────

export default function TransactionsAdmin() {
  const { transactions, loading, error } = useTransactions();
  const {
    selectedIds,
    isProcessing,
    toggle,
    toggleAll,
    bulkApprove,
    bulkReject,
    approveSingle,
    rejectSingle,
  } = useBulkActions();

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [viewingProof, setViewingProof] = useState<Transaction | null>(null);

  // Lọc giao dịch theo tab
  const filteredTxs = useMemo(() => {
    if (filterTab === 'finance') {
      return transactions.filter(
        (tx) => tx.type === 'deposit' || tx.type === 'withdraw' || tx.type === 'plus' || tx.type === 'minus'
      );
    }
    if (filterTab === 'investment') {
      return transactions.filter((tx) => tx.type === 'investment');
    }
    return transactions;
  }, [transactions, filterTab]);

  // Giao dịch đang chờ duyệt (trong tab hiện tại)
  const pendingTxs = useMemo(
    () => filteredTxs.filter((tx) => isPending(tx.status)),
    [filteredTxs]
  );

  const pendingIds = useMemo(
    () => pendingTxs.map((tx) => tx.id),
    [pendingTxs]
  );

  const selectedPendingTxs = useMemo(
    () => pendingTxs.filter((tx) => selectedIds.has(tx.id)),
    [pendingTxs, selectedIds]
  );

  const allPendingSelected =
    pendingIds.length > 0 && pendingIds.every((id) => selectedIds.has(id));

  // ── Render: Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-gray-400 gap-3">
        <Loader2 size={24} className="animate-spin" />
        <span className="font-bold text-sm">Đang tải giao dịch...</span>
      </div>
    );
  }

  // ── Render: Error ──
  if (error) {
    return (
      <div className="flex items-center gap-3 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600 max-w-lg mx-auto mt-10">
        <AlertCircle size={24} className="flex-shrink-0" />
        <div>
          <p className="font-black text-sm">Lỗi tải dữ liệu</p>
          <p className="text-xs mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  // ── Render: Main ──
  return (
    <div className="p-4 md:p-6 bg-white min-h-screen text-gray-800 font-sans">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            Quản lý & Phê duyệt Giao dịch
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Duyệt nạp/rút tiền tài khoản và hồ sơ ký kết hợp đồng góp vốn
          </p>
        </div>

        {/* Bulk action bar – chỉ hiện khi có giao dịch chờ duyệt */}
        {pendingTxs.length > 0 && (
          <div className="flex items-center gap-3 bg-gray-50 p-2 px-3 rounded-xl border border-gray-200 shadow-sm flex-wrap">
            {/* Chọn tất cả */}
            <button
              onClick={() => toggleAll(pendingIds)}
              aria-label={allPendingSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              className="flex items-center gap-2 cursor-pointer font-bold text-[11px] uppercase tracking-wider text-gray-600 hover:text-blue-600 transition-colors"
            >
              {allPendingSelected ? (
                <CheckSquare size={18} className="text-blue-500" />
              ) : (
                <Square size={18} className="text-gray-400" />
              )}
              Chọn tất cả ({pendingTxs.length})
            </button>

            <div className="h-5 w-px bg-gray-300" />

            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Đã chọn:{' '}
              <span className="text-blue-500">{selectedPendingTxs.length}</span>
            </span>

            <button
              onClick={() => bulkApprove(selectedPendingTxs)}
              disabled={selectedPendingTxs.length === 0 || isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-[11px] uppercase tracking-wider shadow-md shadow-green-500/20"
            >
              {isProcessing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle size={12} strokeWidth={3} />
              )}
              Duyệt chọn
            </button>

            <button
              onClick={() => bulkReject(selectedPendingTxs)}
              disabled={selectedPendingTxs.length === 0 || isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold text-[11px] uppercase tracking-wider shadow-md shadow-red-500/20"
            >
              <XCircle size={12} strokeWidth={3} /> Từ chối chọn
            </button>
          </div>
        )}
      </div>

      {/* ── Stats bar ── */}
      <StatsBar transactions={transactions} />

      {/* ── Filter tabs ── */}
      <div
        role="tablist"
        className="flex bg-gray-100 border border-gray-200 rounded-xl p-1 gap-1 mb-6 max-w-sm"
      >
        {(
          [
            { key: 'all', label: 'Tất cả' },
            { key: 'finance', label: 'Nạp / Rút tiền' },
            { key: 'investment', label: 'Góp vốn' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={filterTab === tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              filterTab === tab.key
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1 text-[10px] text-gray-400">
                ({filteredTxs.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Transaction list ── */}
      <div className="grid gap-3" role="list">
        {filteredTxs.map((tx) => (
          <TxRow
            key={tx.id}
            tx={tx}
            isSelected={selectedIds.has(tx.id)}
            onToggle={toggle}
            onApprove={approveSingle}
            onReject={rejectSingle}
            onViewProof={setViewingProof}
            isProcessing={isProcessing}
          />
        ))}

        {filteredTxs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <FileText size={40} strokeWidth={1.5} />
            <p className="font-bold text-sm">Không có bản ghi giao dịch nào phù hợp.</p>
          </div>
        )}
      </div>

      {/* ── Proof Modal ── */}
      {viewingProof && (
        <ProofModal
          tx={viewingProof}
          onClose={() => setViewingProof(null)}
          onApprove={approveSingle}
          onReject={rejectSingle}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
