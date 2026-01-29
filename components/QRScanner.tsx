
import * as React from 'react';
import { Target, X } from 'lucide-react';

// Fix: Removed redundant global JSX augmentation to avoid duplicate index signature errors.

interface QRScannerProps {
  onResult: (result: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onResult, onClose }) => {
  React.useEffect(() => {
    const html5QrCode = new (window as any).Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText: string) => {
        html5QrCode.stop().then(() => {
          onResult(decodedText);
        });
      },
      () => {} // silent error
    ).catch((err: any) => {
      console.error("Camera error:", err);
      alert("Erro ao acessar câmera. Verifique permissões.");
      onClose();
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop();
      }
    };
  }, [onResult, onClose]);

  return (
    /* Fix: Intrinsic JSX elements like div, span, button are handled via centralized augmentation in types.ts */
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm relative military-border bg-black overflow-hidden">
        <div className="p-4 border-b border-amber/30 flex justify-between items-center bg-amber/10">
          <div className="flex items-center gap-2">
            <Target className="text-amber animate-pulse" size={20} />
            <span className="font-orbitron font-bold text-xs">ESCANEANDO ALVO...</span>
          </div>
          <button onClick={onClose} className="p-1 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div id="reader" className="w-full bg-black"></div>
        
        <div className="p-4 bg-amber/5 text-[10px] text-center font-bold tracking-widest animate-pulse">
          MANTENHA O CÓDIGO NO CENTRO DO VISOR
        </div>
      </div>
    </div>
  );
};
