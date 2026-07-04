import ProgressiveImage from './ProgressiveImage';
import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, File as FileIcon, X, ArrowLeft, Home, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp: string;
  unixTime?: number;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  userEmail?: string;
}

interface SupportTabProps {
  userName?: string;
  userId?: string;
  initialMessage?: string | null;
  onClearInitialMessage?: () => void;
  onBack?: () => void;
}

const mockMessages: ChatMessage[] = [
  {
    id: "mock_msg_1",
    text: "",
    sender: "user",
    timestamp: "23:23",
    unixTime: 1782928980000,
    fileUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop",
    fileType: "image/jpeg",
    fileName: "image_VIP.jpg"
  },
  {
    id: "mock_msg_2",
    text: "';σ];",
    sender: "user",
    timestamp: "01:21",
    unixTime: 1782936060000
  }
];

export default function SupportTab({ userName, userId, initialMessage, onClearInitialMessage, onBack }: SupportTabProps) {
  const [typedText, setTypedText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (initialMessage) {
      setTypedText(initialMessage);
      if (onClearInitialMessage) onClearInitialMessage();
    }
  }, [initialMessage]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'support_chat'), (snap) => {
      const currentUserEmail = auth.currentUser?.email || 'Anonymous';
      const msgs = snap.docs
        .map(doc => {
          const data = doc.data();
          const msgEmail = data.userEmail || data.senderEmail || 'Anonymous';
          return {
            id: doc.id,
            text: data.text,
            sender: data.sender === 'admin' ? 'admin' : 'user',
            timestamp: new Date(data.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            unixTime: data.timestamp || Date.now(),
            fileUrl: data.fileUrl,
            fileType: data.fileType,
            fileName: data.fileName,
            userEmail: msgEmail
          } as ChatMessage;
        })
        .filter(m => m.userEmail === currentUserEmail);

      msgs.sort((a, b) => (a.unixTime || 0) - (b.unixTime || 0));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    }, (error) => { console.error('Error in support_chat:', error); });
    return unsub;
  }, []);



  const handleSendMessage = async () => {
    if (!typedText.trim()) return;
    const text = typedText;
    setTypedText('');
    await addDoc(collection(db, 'support_chat'), {
      text,
      sender: 'user',
      senderEmail: auth.currentUser?.email || 'Anonymous',
      userEmail: auth.currentUser?.email || 'Anonymous',
      timestamp: Date.now()
    });
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      await addDoc(collection(db, 'support_chat'), {
        text: '',
        sender: 'user',
        senderEmail: auth.currentUser?.email || 'Anonymous',
        userEmail: auth.currentUser?.email || 'Anonymous',
        timestamp: Date.now(),
        fileUrl: base64String,
        fileType: file.type,
        fileName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const quickChips = [
    "Tôi muốn nâng hạng VIP",
    "Làm sao để nhận ưu đãi?",
    "Thông tin dự án mới",
    "Gặp chuyên viên tư vấn"
  ];

  const allMessages = [...mockMessages, ...messages];

  return (
    <div className="flex flex-col h-full bg-[#f4f4f4] relative select-none w-full">
      {/* HEADER: MATCHES IMAGE EXACTLY */}
      <div className="h-16 bg-white border-b border-neutral-100 flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer text-neutral-800"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
        </button>
        
        <div className="flex flex-col items-center">
          <h1 className="text-[16px] font-black text-neutral-900 tracking-tight">CSKH VinClub</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
            <span className="text-[11px] font-bold text-[#10b981] tracking-wide">Đang trực tuyến</span>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer text-neutral-800"
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* CHAT BODY: MATCHES IMAGE BACKGROUND AND PADDING */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-12 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#f4f4f4]">
        <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest text-center py-2">
          Hệ thống bảo mật đầu cuối VinClub Concierge
        </div>

        <AnimatePresence initial={false}>
          {allMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}
              >
                {/* Message Bubble */}
                {msg.fileUrl ? (
                  /* Image Message - Thick Gold border with rounded-3xl exactly like image */
                  <div className="flex flex-col items-end max-w-[78%]">
                    <div className="p-3 bg-[#96784d] rounded-[32px] shadow-sm overflow-hidden flex items-center justify-center">
                      <img 
                        src={msg.fileUrl} 
                        alt={msg.fileName || "Uploaded"} 
                        className="w-full max-w-[210px] aspect-[4/5] object-cover rounded-[25px]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-1 mr-3 font-medium font-mono">{msg.timestamp}</span>
                  </div>
                ) : (
                  /* Text Message */
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    <div className={`px-4.5 py-2.5 rounded-[18px] text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser 
                        ? 'bg-[#96784d] text-white font-medium shadow-sm' 
                        : 'bg-white border border-neutral-100/60 text-neutral-800 font-medium shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className={`text-[10px] text-neutral-400 mt-1 font-medium font-mono ${isUser ? 'mr-3' : 'ml-3'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}

          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col items-start w-full"
            >
              <div className="bg-white border border-neutral-100/60 rounded-[22px] rounded-bl-[6px] px-5 py-3.5 shadow-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#96784d]/60 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#96784d]/60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#96784d]/60 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-[9px] text-[#96784d] font-bold tracking-wider mt-1 ml-3 uppercase animate-pulse">CSKH đang trả lời...</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* QUICK SUGGESTIONS */}
      <div className="px-4 py-2 bg-transparent overflow-x-auto whitespace-nowrap flex gap-2 hide-scrollbar shrink-0">
        {quickChips.map((chip, idx) => (
          <button 
            key={idx} 
            onClick={() => setTypedText(chip)} 
            className="inline-block py-2 px-4 bg-white border border-neutral-200 rounded-full text-[11px] text-neutral-700 font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            # {chip}
          </button>
        ))}
      </div>

      {/* INPUT FOOTER: ADDED pb-32 TO CLEAR MOBILE NAV */}
      <div className="p-3 bg-white border-t border-neutral-100 flex flex-col shrink-0 pb-32">
        <div className="flex items-center gap-2.5">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <button 
            onClick={handleAttachmentClick}
            className="w-10 h-10 rounded-full bg-[#f1f1f3] hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <Paperclip className="w-5 h-5 text-neutral-400" />
          </button>
          
          <div className="flex-1 bg-[#f1f1f3] rounded-full px-5 flex items-center h-10">
            <input 
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              placeholder="Nhập tin nhắn..."
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[13px] text-neutral-800 placeholder-neutral-400 py-1"
            />
          </div>

          <button 
            onClick={handleSendMessage} 
            disabled={!typedText.trim()} 
            className="w-10 h-10 rounded-full bg-[#96784d] hover:bg-[#856942] disabled:opacity-45 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-95 shadow-sm"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
