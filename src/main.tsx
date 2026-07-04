import React, { StrictMode, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import AdminApp from './components/AdminApp.tsx';
import './index.css';

// Global error listener for loading or initial mount errors
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root && (root.innerHTML.trim() === '' || root.innerHTML.includes('id="root"'))) {
    root.innerHTML = `
      <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f0f11; color: #e4e4e7; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; box-sizing: border-box;">
        <div style="max-width: 480px; width: 100%; bg: #18181b; border: 1px solid #27272a; padding: 32px; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          <div style="width: 48px; height: 48px; background: rgba(239, 68, 68, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
            <svg style="width: 24px; height: 24px; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h1 style="font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Không thể tải ứng dụng</h1>
          <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">Phát hiện lỗi không tương thích hoặc lỗi kết nối. Hãy ấn nút phía dưới để làm mới bộ nhớ đệm và thử lại.</p>
          <pre style="background: #09090b; padding: 16px; border-radius: 12px; font-size: 11px; font-family: monospace; text-align: left; overflow-x: auto; border: 1px solid #1f1f23; margin-bottom: 24px; color: #f43f5e; max-height: 120px;">${event.message || 'Unknown Error'}\nSource: ${event.filename || 'Unknown'}:${event.lineno || 0}</pre>
          <button onclick="localStorage.clear(); window.location.reload();" style="width: 100%; padding: 12px; background: linear-gradient(to right, #d4af37, #f3e5ab); color: #1c1917; border: none; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; transition: opacity 0.2s;">
            DỌN DẸP BỘ NHỚ & TẢI LẠI TRANG
          </button>
        </div>
      </div>
    `;
  }
});

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public props: ErrorBoundaryProps;
  public state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', fontFamily: 'sans-serif', background: '#0f0f11', color: '#e4e4e7', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '480px', width: '100%', background: '#18181b', border: '1px solid #27272a', padding: '32px', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 20px' }}>
              <svg style={{ width: '24px', height: '24px', color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>Lỗi Hệ Thống (React Crash)</h1>
            <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '24px' }}>Ứng dụng gặp sự cố hiển thị. Vui lòng thử reset lại hoặc chụp ảnh lỗi gửi CSKH.</p>
            <pre style={{ background: '#09090b', padding: '16px', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace', textAlign: 'left', overflowX: 'auto', border: '1px solid #1f1f23', marginBottom: '24px', color: '#f43f5e', maxHeight: '120px' }}>
              {this.state.error?.toString() || 'Unknown Error'}
              {"\n\n"}
              {this.state.error?.stack || ''}
            </pre>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              style={{ width: '100%', padding: '12px', background: 'linear-gradient(to right, #d4af37, #f3e5ab)', color: '#1c1917', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
            >
              DỌN DẸP BỘ NHỚ & TẢI LẠI TRANG
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
