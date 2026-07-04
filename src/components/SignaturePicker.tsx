import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Type } from 'lucide-react';

export default function SignaturePicker({ onSign }: { onSign: (dataUrl: string) => void }) {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Initialize with transparent or white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000000';
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'type') {
      // Create a canvas representation of the typed text
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (typedName) {
          ctx.font = 'italic 40px "Times New Roman", serif';
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
        }
        
        onSign(canvas.toDataURL('image/png'));
      }
    }
  }, [typedName, mode, onSign]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || mode !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && mode === 'draw') {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        onSign(canvas.toDataURL('image/png'));
      }
    }
  };

  const clear = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      onSign('');
    } else {
      setTypedName('');
      onSign('');
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[300px] mx-auto">
      <div className="flex bg-gray-100 p-1 rounded-lg w-full mb-3">
        <button
          onClick={() => setMode('draw')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-colors ${mode === 'draw' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <PenTool className="w-4 h-4" /> Vẽ tay
        </button>
        <button
          onClick={() => setMode('type')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-colors ${mode === 'type' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Type className="w-4 h-4" /> Nhập chữ
        </button>
      </div>

      <div className="relative w-full border border-gray-300 rounded-lg overflow-hidden bg-white shadow-inner">
        {mode === 'draw' ? (
          <canvas
            ref={canvasRef}
            width={300}
            height={150}
            className="w-full touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        ) : (
          <div className="h-[150px] flex items-center justify-center p-4 bg-gray-50/50">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Nhập họ tên của bạn..."
              className="w-full text-center text-3xl font-serif italic bg-transparent border-b-2 border-dashed border-gray-300 focus:outline-none focus:border-amber-500 pb-2 text-gray-800 placeholder-gray-300"
            />
          </div>
        )}
        
        {mode === 'draw' && (
          <div className="absolute bottom-2 right-2 pointer-events-none">
            <span className="text-[10px] text-gray-300 font-medium tracking-widest uppercase">Ký tại đây</span>
          </div>
        )}
      </div>

      <div className="w-full flex justify-end mt-2">
        <button 
          onClick={clear}
          className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors"
        >
          Xoá làm lại
        </button>
      </div>
    </div>
  );
}
